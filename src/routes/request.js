const express = require('express');
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

requestRouter.post("/sendConnectionRequest", userAuth, async (req, res) => {
    const user = req.user;
    try {
        console.log("User sending request:", user._id);


        res.send("Connection request sent successfully!");

    } catch (err) {
        res.status(500).send("Error sending connection request: " + err.message);
    }


});

module.exports = requestRouter;