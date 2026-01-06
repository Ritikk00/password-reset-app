const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Token = require('./models/Token');

/**
 * EMAIL SENDER
 */
const sendEmail = async (email, randomString) => {
    // FIX 1: Localhost hata kar Environment Variable use karein
    // Render Dashboard mein FRONTEND_URL = https://your-ui-link.onrender.com set karein
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${randomString}`;
    
    // FIX 2: More reliable Transporter settings for Render
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Port 465 ke liye true
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App Password only
        },
        tls: {
            rejectUnauthorized: false,
       // Connection timeout fix
        }
       
    });

    const mailOptions = {
        from: `"Support Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    console.log(`[EMAIL SERVICE] Attempting to send email to: ${email}`);
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Email sent successfully.`);
        return true;
    } catch (error) {
        console.error(`[EMAIL SERVICE] Error details:`, error);
        throw error; // Isse catch block mein error handle hoga
    }
};

/**
 * 1. FORGOT PASSWORD FLOW
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() }); // email lowercase check

        if (!user) {
            return res.status(404).json({ message: 'User does not exist in our database.' });
        }

        // Token management
        let token = await Token.findOne({ userId: user._id });
        if (token) await token.deleteOne();

        const randomString = crypto.randomBytes(32).toString('hex');
        
        await new Token({
            userId: user._id,
            token: randomString,
            createdAt: Date.now(),
        }).save();

        // Email sending with await
        await sendEmail(user.email, randomString);
        res.json({ message: 'Password reset link has been sent to your email.' });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: error.message || 'An error occurred during email sending.' });
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

        user.password = newPassword; // Note: In production use bcrypt to hash this!
        await user.save();
        await token.deleteOne();
        
        res.json({ message: 'Your password has been successfully reset.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// Test user registration
router.post('/register-test', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = new User({ email: email.toLowerCase(), password });
        await user.save();
        res.json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
});

module.exports = router;