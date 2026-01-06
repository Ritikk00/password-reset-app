const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Token = require('./models/Token');

/**
 * EMAIL SENDER
 * Uses nodemailer to send real emails via Gmail (or other service defined in .env)
 */
const sendEmail = async (email, randomString) => {
    const resetLink = `http://localhost:5173/reset-password/${randomString}`;
    
    // Create Transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Email Options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    console.log(`[EMAIL SERVICE] Sending email to: ${email}`);
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Email sent successfully.`);
    return true;
};

/**
 * 1. FORGOT PASSWORD FLOW
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Requirement: Check if the user exists in the DB.
        const user = await User.findOne({ email });

        // Requirement: If the user is not present send an error message.
        if (!user) {
            return res.status(404).json({ message: 'User does not exist in our database.' });
        }

        // Requirement: If the user is found generate a random string
        let token = await Token.findOne({ userId: user._id });
        if (token) await token.deleteOne();

        const randomString = crypto.randomBytes(32).toString('hex');
        
        // Requirement: Store the random string in DB for later verification.
        await new Token({
            userId: user._id,
            token: randomString,
            createdAt: Date.now(),
        }).save();

        // Requirement: send a link with that random string in the mail
        await sendEmail(user.email, randomString);
        res.json({ message: 'Password reset link has been sent to your email.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please check server logs.' });
    }
});

/**
 * 2. VERIFY TOKEN (Helper Route)
 */
router.get('/reset-password/:randomString', async (req, res) => {
    const { randomString } = req.params;

    try {
        // Retrieve the random string from DB
        const token = await Token.findOne({ token: randomString });

        // Requirement: If the string does not match send an error message.
        if (!token) {
            return res.status(400).json({ message: 'Invalid or expired password reset link.' });
        }

        // Requirement: If the string matches show the password reset form.
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
        // Retrieve the random string from DB
        const token = await Token.findOne({ token: randomString });
        
        // Check if the random string matches
        if (!token) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // Update User Password
        const user = await User.findById(token.userId);
        if (!user) return res.status(400).json({ message: 'User not found.' });

        // Requirement: Store the new password
        user.password = newPassword;
        await user.save();
        
        // Requirement: clear the random string in the DB
        await token.deleteOne();
        
        res.json({ message: 'Your password has been successfully reset.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// Helper route to create a test user easily (since we don't have a registration page)
router.post('/register-test', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = new User({ email, password });
        await user.save();
        res.json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
});

module.exports = router;
