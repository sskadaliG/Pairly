const express = require('express');

const authRouter = express.Router();

const User = require("../models/user");

const bcrypt = require('bcrypt');

const validator = require('validator');

const { validateSignUpData } = require("../utils/validateSignUpData");

const crypto = require('crypto');

authRouter.post("/signup", async (req, res) => {
    const { firstName, lastName, email, password, age, gender, phoneNumber, address, city, state, zipCode, country, photoURL, bio, interests } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ firstName, lastName, email, password: passwordHash, age, gender, phoneNumber, address, city, state, zipCode, country, photoURL, bio, interests });

    try {
        validateSignUpData(req);
        await user.save();
        res.send("User created successfully!");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send("Email already registered");
        }
        res.status(400).send("Error creating user: " + err.message);
    }

});


authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).send("Invalid email format");
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).send("Invalid credentials");
        }

        if (!password) {
            return res.status(400).send("Password is required");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).send("Invalid credentials");
        }
        const token = await user.toJWT();
        res.cookie("token", token, { httpOnly: true });

        res.send("Login successful!");
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

authRouter.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).send("Invalid email format");
        }

        const user = await User.findOne({ email });
        if (user) {
            const resetToken = await user.generatePasswordResetToken();
            console.log("Reset link:", `http://localhost:3000/reset-password?token=${resetToken}`);
        }
        res.send("If that email is registered, a reset link has been sent.");

    } catch (err) {
        res.status(500).send("Error processing forgot password: " + err.message);
    }
});

authRouter.post("/reset-password", async (req, res) => {
    const { resetToken, newPassword } = req.body;

    try {
        if (!resetToken || !newPassword) {
            return res.status(400).send("Reset token and new password are required");
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
        res.status(500).send("Error resetting password: " + err.message);
    }
});

authRouter.post("/logout", (req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.send("Logout successful!");
});

module.exports = authRouter;