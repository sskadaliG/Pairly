const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

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

    // Runs every time a browser connects. socket is that one connection.
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // Only log whether a token arrived, never the token itself
        const token = socket.request.cookies?.token;
        console.log("Login cookie received:", token ? "yes" : "no");

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
    });
};

module.exports = initializeSocket;
