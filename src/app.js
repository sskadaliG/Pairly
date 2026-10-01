const express = require('express');

const connectDB = require("./config/database");

const User = require("./models/user");

const app = express();

app.use(express.json());


connectDB().then(() => {
    console.log("Database connected successfully!");

    app.listen(3000, () => {
        console.log("server is up and running!")
    })

}).catch((err) => {
    console.log("Database connection failed!", err);
});

app.post("/signup", async (req, res) => {

    const user = new User(req.body);
    if (!user.firstName || !user.email || !user.password || !user.gender) {
        return res.status(400).send("Missing required fields: firstName, email, password, gender");
    };

    try {
        await user.save();
        res.send("User created successfully!");
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).send("Email already registered");
        }
        res.status(400).send("Error creating user: " + err.message);
    }

});
app.get("/user", async (req, res) => {
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
    canUpdateFields = ['firstName', 'lastName', 'password', 'age', 'gender', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country', 'photoURL', 'bio', 'interests'];
    updateFields = Object.keys(req.body);
    const isValidOperation = updateFields.every((field) => canUpdateFields.includes(field));

    if (!isValidOperation) {
        return res.status(400).send("Invalid updates!");
    }
    try {
        const user = await User.findByIdAndUpdate(userId, req.body, { returnDocument: "after" });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
    } catch (err) {
        res.status(400).send("Error updating user: " + err.message);
    }
});


