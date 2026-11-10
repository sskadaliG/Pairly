const express = require('express');
const mongoose = require('mongoose');
const chatRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const Message = require("../models/message");

const USER_SAFE_DATA = 'firstName lastName photoURL age gender bio';

// How many of the latest messages to send when a chat opens
const MESSAGE_LIMIT = 100;

chatRouter.get("/chat/:userId", userAuth, async (req, res) => {
    const { userId } = req.params;
    try {
        const myId = req.user._id;

        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id." });
        }

        // Check that the other user exists
        const otherUser = await User.findById(userId).select(USER_SAFE_DATA);
        if (!otherUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Only connections can chat: an accepted request in either direction
        const connection = await ConnectionRequest.findOne({
            status: "accepted",
            $or: [
                { fromUserId: myId, toUserId: userId },
                { fromUserId: userId, toUserId: myId },
            ],
        });
        if (!connection) {
            return res.status(403).json({ message: "You can only chat with your connections." });
        }

        // Newest first to take the latest messages, then reverse so the chat reads oldest to newest
        const messages = await Message.find({
            $or: [
                { fromUserId: myId, toUserId: userId },
                { fromUserId: userId, toUserId: myId },
            ],
        }).sort({ createdAt: -1 }).limit(MESSAGE_LIMIT);
        messages.reverse();

        res.status(200).json({ message: "Chat fetched successfully.", data: { user: otherUser, messages } });
    } catch (err) {
        console.error("Error fetching chat:", err);
        res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
});

module.exports = chatRouter;
