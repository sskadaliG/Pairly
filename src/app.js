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

    try {
        await user.save();
        res.send("User created successfully!");
    } catch (err) {
        res.status(400).send("Error creating user: " + err.message);
    }

});
app.get("/user", async (req, res) => {
    console.log(req.query.email);
    if (!req.query.email) {
        return res.status(400).send("Email is required");
    }
    try {
        const users = await User.find({ email: req.query.email });
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

app.delete("/users/:id", async (req, res) => {

    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("User deleted successfully!");
    } catch (err) {
        res.status(500).send("Error deleting user: " + err.message);
    }

});


