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


