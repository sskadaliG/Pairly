const express = require('express');
const profileRouter = express.Router();

const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

const bcrypt = require('bcrypt');
const validator = require('validator');

profileRouter.get("/profile/:userId", userAuth, async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
    } catch (err) {
        res.status(500).send("Error fetching user: " + err.message);
    }
});

profileRouter.patch("/profile/:userId", userAuth, async (req, res) => {
    const userId = req.params?.userId;
    if (userId !== req.user._id.toString()) {
        return res.status(403).send("You are not authorized to update this user");
    }
    const canUpdateFields = ['firstName', 'lastName', 'password', 'age', 'gender', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country', 'photoURL', 'bio', 'interests'];
    const updateFields = Object.keys(req.body);
    const isValidOperation = updateFields.every((field) => canUpdateFields.includes(field));

    const updates = { ...req.body };

    try {
        if (!isValidOperation) {
            return res.status(400).send("Invalid updates!");
        }

        if (updates.password !== undefined) {
            if (!validator.isStrongPassword(String(updates.password))) {
                return res.status(400).send("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol");
            }
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: "after" });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
    } catch (err) {
        res.status(400).send("Error updating user: " + err.message);
    }
});

module.exports = profileRouter;