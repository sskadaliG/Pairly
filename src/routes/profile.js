const express = require('express');
const profileRouter = express.Router();

const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

const bcrypt = require('bcrypt');
const validator = require('validator');
const isValidToUpdate = require("../utils/isValidToUpdate");

profileRouter.get("/profile/view", userAuth, async (req, res) => {

    res.json(req.user);

});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {

    const updates = { ...req.body };

    try {
        if (!isValidToUpdate(req.body)) {
            return res.status(400).send("Invalid updates!");
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: "after", runValidators: true });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
    } catch (err) {
        // Mongoose validation errors describe the user's own input, like "Invalid URL format"
        if (err.name === "ValidationError" || err.name === "CastError") {
            return res.status(400).send("Error updating user: " + err.message);
        }
        console.error("Error updating user:", err);
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required." });
        }

        // bcrypt only accepts strings, so reject numbers, arrays and objects with a 400
        if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({ message: "Passwords must be text." });
        }

        if (!validator.isStrongPassword(newPassword)) {
            return res.status(400).json({ message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different from the current password." });
        }

        // req.user does not include the password (select: false), so load it explicitly
        const user = await User.findById(req.user._id).select('+password');

        const isPasswordValid = await user.validatePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Error updating password:", err);
        res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
});

module.exports = profileRouter;