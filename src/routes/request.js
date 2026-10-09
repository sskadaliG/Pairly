const express = require('express');
const mongoose = require('mongoose');
const requestRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");

const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");


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

        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(toUserId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        // Users cannot send a request to themselves
        if (fromUserId.toString() === toUserId) {
            return res.status(400).json({ message: "You cannot send a request to yourself." });
        }

        // Check that the recipient exists
        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if a connection request already exists in either direction
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ],
        });
        if (existingRequest) {
            return res.status(400).json({ message: "A connection request already exists between you and this user." });
        }

        // Create a new connection request
        const newRequest = new ConnectionRequest({ fromUserId, toUserId, status });
        await newRequest.save();
        const statusText = { interested: "interested in", not_interested: "not interested in" };
        const message = `${req.user.firstName} is ${statusText[status]} ${toUser.firstName}`;

        res.status(201).json({ message, data: newRequest });


    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "A connection request already exists between you and this user." });
        }
        res.status(500).json({ message: "Error sending connection request: " + err.message });
    }

});

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    const { status, requestId } = req.params;
    try {

        // Validate the status parameter
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status: " + status });
        }

        // Validate the requestId format
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request id." });
        }

        // Find the connection request
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: req.user._id,
            status: "interested",
        });
        if (!connectionRequest) {
            return res.status(404).json({ message: "Connection request not found." });
        }

        // Update the status of the connection request
        connectionRequest.status = status;
        await connectionRequest.save();
        res.status(200).json({ message: "Connection request " + status, data: connectionRequest });

    } catch (err) {
        res.status(500).json({ message: "Error reviewing connection request: " + err.message });
    }
});

module.exports = requestRouter;