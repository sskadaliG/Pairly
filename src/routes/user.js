const express = require('express');
const userRouter = express.Router();

const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

const ConnectionRequest = require("../models/connectionRequest");

const USER_SAFE_DATA = 'firstName lastName photoURL age gender bio';

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const interestedRequests = await ConnectionRequest.find({ toUserId: userId, status: "interested" }).populate('fromUserId', USER_SAFE_DATA);
        res.status(200).json({ message: "Interested requests fetched successfully.", data: interestedRequests });
    } catch (err) {
        console.error("Error fetching interested requests:", err);
        res.status(500).send({ message: "Something went wrong. Please try again later." });
    }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const acceptedRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: userId, status: "accepted" },
                { toUserId: userId, status: "accepted" }
            ]
        }).populate('fromUserId toUserId', USER_SAFE_DATA);
        const connections = acceptedRequests
            .map(request =>
                request.fromUserId?._id.toString() === userId.toString()
                    ? request.toUserId
                    : request.fromUserId
            )
            .filter(user => user !== null);

        res.status(200).json({ message: "Connections fetched successfully.", data: connections });
    } catch (err) {
        console.error("Error fetching connections:", err);
        res.status(500).send({ message: "Something went wrong. Please try again later." });
    }
});

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        let limit = Math.max(parseInt(req.query.limit) || 10, 1);
        limit = Math.min(limit, 50);
        const skip = (page - 1) * limit;

        // Fetch all connection requests involving the authenticated user to exclude them from the feed
        const excludedRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: userId },
                { toUserId: userId }
            ]
        }).select('fromUserId toUserId');

        // Create a set of user IDs to exclude from the feed
        const excludedUserIds = new Set([userId.toString()]);
        excludedRequests.forEach(request => {
            excludedUserIds.add(request.fromUserId.toString());
            excludedUserIds.add(request.toUserId.toString());
        });
        // Fetch users not involved in any connection requests with the authenticated user
        const feedUsers = await User.find({ _id: { $nin: [...excludedUserIds] } }).sort({ _id: 1 }).select(USER_SAFE_DATA).skip(skip).limit(limit);
        res.status(200).json({ message: "Feed fetched successfully.", data: feedUsers });
    }
    catch (err) {
        console.error("Error fetching feed:", err);
        res.status(500).send({ message: "Something went wrong. Please try again later." });
    }
});


module.exports = userRouter;