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
        res.status(400).send("Error updating user: " + err.message);
    }
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required." });
        }

        if (!validator.isStrongPassword(String(newPassword))) {
            return res.status(400).json({ message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different from the current password." });
        }

        // req.user does not include the password (select: false), so load it explicitly
        const user = await User.findById(req.user._id).select('+password');

        const isPasswordValid = await user.validatePassword(String(currentPassword));
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        res.status(500).json({ message: "Error updating password: " + err.message });
    }
});

module.exports = profileRouter;