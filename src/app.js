const express = require('express');

const connectDB = require("./config/database");

const app = express();


connectDB().then(() => {
    console.log("Database connected successfully!");

    app.listen(3000, () => {
        console.log("server is up and running!")
    })

}).catch((err) => {
    console.log("Database connection failed!", err);
});

