const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { getUserFromToken } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const Message = require("../models/message");

const initializeSocket = (server) => {
    const io = new Server(server, {
        // Same rules as the Express CORS setup, so the frontend can connect with its cookie
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    // Run cookie-parser on the connection request, so socket.request.cookies has the cookies,
    // just like req.cookies in Express
    io.engine.use(cookieParser());

    // Runs before every connection, like userAuth runs before an API route.
    // next() lets the connection in; next(new Error(...)) refuses it.
    io.use(async (socket, next) => {
        try {
            const token = socket.request.cookies?.token;
            if (!token) {
                return next(new Error("Please login again"));
            }

            const user = await getUserFromToken(token);
            if (!user) {
                return next(new Error("Please login again"));
            }

            // Remember who this connection belongs to, like req.user in Express
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Please login again"));
        }
    });

    // Runs every time a browser connects. socket is that one connection.
    // Only logged-in users get here now.
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id, socket.user.firstName);

        // Each user joins a room named after their own ID. A user can have several
        // connections (two tabs, phone and laptop), and they all join the same room,
        // so sending to this room reaches every one of them.
        const myId = socket.user._id.toString();
        socket.join(myId);

        // The browser sends: socket.emit("sendMessage", { toUserId, text }, (reply) => { ... })
        // reply is the callback: calling it sends an answer back to that one browser.
        socket.on("sendMessage", async (data, reply) => {
            // Without a callback there's no one to answer, so ignore the event
            if (typeof reply !== "function") {
                return;
            }

            const { toUserId, text } = data || {};

            // Same idea as the typeof checks in the API: anything can arrive here
            if (typeof toUserId !== "string" || !mongoose.Types.ObjectId.isValid(toUserId)) {
                return reply({ ok: false, error: "Invalid user" });
            }
            if (typeof text !== "string" || !text.trim()) {
                return reply({ ok: false, error: "Message can't be empty" });
            }
            if (text.trim().length > 1000) {
                return reply({ ok: false, error: "Message is too long (max 1000 characters)" });
            }
            if (toUserId === myId) {
                return reply({ ok: false, error: "You can't message yourself" });
            }

            try {
                // Only connections can chat, the same rule as GET /chat/:userId
                const connection = await ConnectionRequest.findOne({
                    status: "accepted",
                    $or: [
                        { fromUserId: myId, toUserId },
                        { fromUserId: toUserId, toUserId: myId },
                    ],
                });
                if (!connection) {
                    return reply({ ok: false, error: "You can only chat with your connections" });
                }

                const message = await Message.create({ fromUserId: myId, toUserId, text: text.trim() });

                // Deliver to both rooms: the other person, and all of my own tabs and devices.
                // Socket.IO sends it once to each connection, even if it's in both rooms.
                io.to(toUserId).to(myId).emit("newMessage", message);

                reply({ ok: true });
            } catch (err) {
                console.error("Error sending message:", err);
                reply({ ok: false, error: "Something went wrong. Please try again later." });
            }
        });

        // The browser sends: socket.emit("markRead", { fromUserId })
        // meaning "I've read the messages this person sent me".
        socket.on("markRead", async (data) => {
            const { fromUserId } = data || {};
            if (typeof fromUserId !== "string" || !mongoose.Types.ObjectId.isValid(fromUserId)) {
                return;
            }

            try {
                const readAt = new Date();
                // toUserId: myId means you can only mark messages sent to you.
                // readAt: null skips ones already read, so their time stays the same.
                const result = await Message.updateMany(
                    { fromUserId, toUserId: myId, readAt: null },
                    { readAt }
                );

                // Only tell the sender if something actually changed
                if (result.modifiedCount > 0) {
                    io.to(fromUserId).emit("messagesRead", { readerId: myId, readAt });
                }
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
};

module.exports = initializeSocket;
