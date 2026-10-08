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

        if (updates.password !== undefined) {
            if (!validator.isStrongPassword(String(updates.password))) {
                return res.status(400).send("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol");
            }
            updates.password = await bcrypt.hash(updates.password, 10);
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

module.exports = profileRouter;