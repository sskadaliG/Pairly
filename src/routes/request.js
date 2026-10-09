const express = require('express');
const requestRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");

const { userAuth } = require("../middlewares/auth");

requestRouter.post("/request/send/:status/:userId", userAuth, async (req, res) => {
    const { status, userId } = req.params;
    try {

        const fromUserId = req.user._id;
        const toUserId = userId;

        // Validate the status parameter
        const allowedStatus = ["interested", "not_interested"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status: " + status });
        }

        // Check if a connection request already exists
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ],
        });
        if (existingRequest) {
            return res.status(400).send("Connection request already sent.");
        }

        //to check if user is trying to send a request to random userId which is not present in the database
        const userExists = await ConnectionRequest.findOne({ toUserId });
        if (!userExists) {
            return res.status(404).send("User not found.");
        }

        // Create a new connection request
        const newRequest = new ConnectionRequest({ fromUserId, toUserId, status });
        await newRequest.save();

        res.status(200).send({ message: "Connection request sent successfully.", data: newRequest });


    } catch (err) {
        res.status(500).send("Error sending connection request: " + err.message);
    }


});

module.exports = requestRouter;