const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { getUserFromToken } = require("../middlewares/auth");

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
        socket.on("sendMessage", (data, reply) => {
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

            // Not saved or delivered yet (step 3h), just confirm the input was fine
            reply({ ok: true });
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
};

module.exports = initializeSocket;
