const express = require('express');

const authRouter = express.Router();

const User = require("../models/user");

const bcrypt = require('bcrypt');

const validator = require('validator');

const { validateSignUpData } = require("../utils/validateSignUpData");

const crypto = require('crypto');

const { loginLimiter, forgotPasswordLimiter } = require("../middlewares/rateLimiter");

authRouter.post("/signup", async (req, res) => {
    const { firstName, lastName, email, password, age, gender, phoneNumber, address, city, state, zipCode, country, photoURL, bio, interests } = req.body;

    // Validate first, so bad input gets a 400 instead of bcrypt throwing a 500.
    // These messages are written by us for the user, so they're safe to send.
    try {
        validateSignUpData(req);
    } catch (err) {
        return res.status(400).send("Error creating user: " + err.message);
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({ firstName, lastName, email, password: passwordHash, age, gender, phoneNumber, address, city, state, zipCode, country, photoURL, bio, interests });

        await user.save();
        res.send("User created successfully!");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send("Email already registered");
        }
        // Mongoose validation errors describe the user's own input, like "age is less than 18"
        if (err.name === "ValidationError" || err.name === "CastError") {
            return res.status(400).send("Error creating user: " + err.message);
        }
        // Anything else is unexpected: log the details here, send a general message
        console.error("Error creating user:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }

});


authRouter.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).send("Email and password are required");
        }

        // bcrypt only accepts strings, so reject numbers, arrays and objects with a 400
        if (typeof password !== "string") {
            return res.status(400).send("Invalid credentials");
        }

        if (typeof email !== "string" || !validator.isEmail(email.trim())) {
            return res.status(400).send("Invalid email format");
        }

        // Emails are saved lowercase (see the user model), so search the same way
        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).send("Invalid credentials");
        }
        const token = await user.toJWT();
        res.cookie("token", token, { httpOnly: true });
        const userData = user.toObject();
        delete userData.password;
        res.send({ message: "Login successful!", body: userData });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

authRouter.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).send("Email is required");
        }

        // isEmail throws on non-strings, and a string also keeps
        // objects like { "$ne": null } out of the database query
        if (typeof email !== "string" || !validator.isEmail(email.trim())) {
            return res.status(400).send("Invalid email format");
        }

        // Emails are saved lowercase (see the user model), so search the same way
        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
            const resetToken = await user.generatePasswordResetToken();
            // The link opens the frontend's reset password page, which sends the token to POST /reset-password
            console.log("Reset link:", `http://localhost:5173/reset-password?token=${resetToken}`);
        }
        res.send("If that email is registered, a reset link has been sent.");

    } catch (err) {
        console.error("Error processing forgot password:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

authRouter.post("/reset-password", async (req, res) => {
    const { resetToken, newPassword } = req.body;

    try {
        if (!resetToken || !newPassword) {
            return res.status(400).send("Reset token and new password are required");
        }

        // crypto and bcrypt only accept strings, so reject anything else with a 400
        if (typeof resetToken !== "string" || typeof newPassword !== "string") {
            return res.status(400).send("Reset token and new password must be text");
        }
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },   // not expired
        });
        if (!user) {
            return res.status(400).send("Reset link is invalid or has expired");
        }
        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).send("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.send("Password reset successful!");
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

authRouter.post("/logout", (req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.send("Logout successful!");
});

module.exports = authRouter;