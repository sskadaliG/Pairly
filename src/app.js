const express = require('express');

const app = express();

app.use("/user", (req, res, next) => {
    next();
    // res.send("Hello User");

}, (req, res, next) => {
    // res.send("Hello User 2")
    next();
},
    (req, res, next) => {
        // res.send("Hello User 3")
        next();
    },
    (req, res, next) => {
        res.send("Hello User 4")
    }
);


app.listen(3000, () => {
    console.log("server is up and running!")
})