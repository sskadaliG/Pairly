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

app.patch("/users", async (req, res) => {
    const id = req.body._id;
    try {
        const user = await User.findByIdAndUpdate(id, req.body, { returnDocument: "after" });
        console.log("User after update:", user); // Log the user after update for debugging
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.json(user);
        console.log("Updated user:", user); // Log the updated user for debugging
    } catch (err) {
        res.status(400).send("Error updating user: " + err.message);
    }
});


