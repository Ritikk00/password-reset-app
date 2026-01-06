const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Token = require('./models/Token');

/**
 * EMAIL SENDER - Brevo (Sendinblue) Optimized
 */
const sendEmail = async (email, randomString) => {
    // Render Dashboard mein FRONTEND_URL set hona chahiye (e.g., https://your-ui.onrender.com)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${randomString}`;
    
    // Brevo ke liye Port 587 aur secure: false sabse best hai
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER, // Brevo Login Email
            pass: process.env.EMAIL_PASS, // Brevo SMTP Key (Master Password)
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `"Support Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Password Reset</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset My Password</a>
                </div>
                <p><strong>Note:</strong> This link is valid for 1 hour only.</p>
                <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px;">If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    console.log(`[EMAIL SERVICE] Attempting to send email via Brevo to: ${email}`);
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Email sent successfully.`);
        return true;
    } catch (error) {
        console.error(`[EMAIL SERVICE] Error details:`, error);
        throw error;
    }
};

/**
 * 1. FORGOT PASSWORD FLOW
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ message: 'User does not exist in our database.' });
        }

        // Purane tokens delete karein
        await Token.findOneAndDelete({ userId: user._id });

        const randomString = crypto.randomBytes(32).toString('hex');
        
        await new Token({
            userId: user._id,
            token: randomString,
            createdAt: Date.now(),
        }).save();

        await sendEmail(user.email, randomString);
        res.json({ message: 'Password reset link has been sent to your email.' });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: 'Error sending email. Please check server logs.' });
    }
});

/**
 * 2. VERIFY TOKEN
 */
router.get('/reset-password/:randomString', async (req, res) => {
    try {
        const token = await Token.findOne({ token: req.params.randomString });
        if (!token) {
            return res.status(400).json({ message: 'Invalid or expired password reset link.' });
        }
        res.json({ message: 'Link is valid.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * 3. RESET PASSWORD FLOW
 */
router.post('/reset-password', async (req, res) => {
    const { token: randomString, newPassword } = req.body;
    try {
        const token = await Token.findOne({ token: randomString });
        if (!token) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        const user = await User.findById(token.userId);
        if (!user) return res.status(400).json({ message: 'User not found.' });

        user.password = newPassword; 
        await user.save();
        await token.deleteOne();
        
        res.json({ message: 'Your password has been successfully reset.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

/**
 * TEST REGISTRATION
 */
router.post('/register-test', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = new User({ email: email.toLowerCase().trim(), password });
        await user.save();
        res.json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
});

module.exports = router;