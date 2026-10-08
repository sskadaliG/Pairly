const express = require('express');
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

requestRouter.post("/request/send/:status/:userId", userAuth, async (req, res) => {
    const { status, userId } = req.params;
    try {
        const fromUserId = req.user._id; // Assuming userAuth middleware sets req.user
        const toUserId = userId;

        // Check if a connection request already exists
        const existingRequest = await ConnectionRequest.findOne({ fromUserId, toUserId });
        if (existingRequest) {
            return res.status(400).send("Connection request already sent.");
        }

        // Create a new connection request
        const newRequest = new ConnectionRequest({ fromUserId, toUserId, status });
        await newRequest.save();

        res.status(200).send("Connection request sent successfully.");


    } catch (err) {
        res.status(500).send("Error sending connection request: " + err.message);
    }


});

module.exports = requestRouter;