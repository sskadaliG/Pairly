const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
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

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
};

module.exports = initializeSocket;
