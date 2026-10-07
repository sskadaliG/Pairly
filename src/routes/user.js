const express = require('express');
const userRouter = express.Router();

const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    }
    catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }
});

module.exports = userRouter;