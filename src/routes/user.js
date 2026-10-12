const express = require('express');
const userRouter = express.Router();

const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

const ConnectionRequest = require("../models/connectionRequest");

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    }
    catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }
});

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const userSafeData = 'firstName lastName photoURL age gender bio';
        const interestedRequests = await ConnectionRequest.find({ toUserId: userId, status: "interested" }).populate('fromUserId', userSafeData);
        res.status(200).json({ message: "Interested requests fetched successfully.", data: interestedRequests });
    } catch (err) {
        res.status(500).send({ message: "Error fetching interested requests: " + err.message });
    }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const userSafeData = 'firstName lastName photoURL age gender bio';
        const acceptedRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: userId, status: "accepted" },
                { toUserId: userId, status: "accepted" }
            ]
        }).populate('fromUserId toUserId', userSafeData);
        const connections = acceptedRequests
            .map(request =>
                request.fromUserId?._id.toString() === userId.toString()
                    ? request.toUserId
                    : request.fromUserId
            )
            .filter(user => user !== null);

        res.status(200).json({ message: "Connections fetched successfully.", data: connections });
    } catch (err) {
        res.status(500).send({ message: "Error fetching connections: " + err.message });
    }
});


module.exports = userRouter;