const express = require('express');

const authRouter = express.Router();

const User = require("../models/user");

const bcrypt = require('bcrypt');

const validator = require('validator');

const { validateSignUpData } = require("../utils/validateSignUpData");

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

module.exports = authRouter;