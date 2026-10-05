const express = require('express');

const connectDB = require("./config/database");

const User = require("./models/user");

const app = express();

const bcrypt = require('bcrypt');

const validator = require('validator');

const { validateSignUpData } = require("./utils/validateSignUpData");

const cookieParser = require('cookie-parser');

const jwt = require('jsonwebtoken');

require('dotenv').config();

app.use(cookieParser());

app.use(express.json());


app.post("/signup", async (req, res) => {


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

app.post("/login", async (req, res) => {
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

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send("Invalid credentials");
        }
        const token = jwt.sign({ "userId": user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie("token", token, { httpOnly: true });

        res.send("Login successful!");
    } catch (err) {
        res.status(500).send("Error logging in: " + err.message);
    }
});

app.get("/profile", async (req, res) => {
    const cookies = req.cookies;
    try {
        if (!cookies.token) {
            return res.status(401).send("Token not found");
        }
        const decodedMessage = jwt.verify(cookies.token, process.env.JWT_SECRET);

        const user = await User.findById(decodedMessage.userId);
        if (!user) {
            return res.status(404).send("User not found, please login again");
        }
        res.send(user);
    } catch (err) {
        res.status(401).send("Invalid token");
    }

});


app.get("/users", async (req, res) => {
    if (!req.body.email) {
        return res.status(400).send("Email is required");
    }
    try {
        const users = await User.find({ email: req.body.email });
        if (users.length === 0) {
            return res.status(404).send("User not found");
        } else {
            res.json(users[0]);
        }
    } catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }

});

app.get("/feed", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }

});

app.delete("/users", async (req, res) => {

    try {
        const user = await User.findByIdAndDelete(req.body.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("User deleted successfully!");
    } catch (err) {
        res.status(500).send("Error deleting user: " + err.message);
    }

});

app.patch("/users/:userId", async (req, res) => {
    const userId = req.params?.userId;
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

connectDB().then(() => {
    console.log("Database connected successfully!");

    app.listen(3000, () => {
        console.log("server is up and running!")
    })

}).catch((err) => {
    console.log("Database connection failed!", err);
});

