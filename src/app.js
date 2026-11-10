const express = require('express');

const http = require('http');

const connectDB = require("./config/database");

const app = express();

const cookieParser = require('cookie-parser');

const authRouter = require("./routes/authRouter");

const requestRouter = require("./routes/request");

const profileRouter = require("./routes/profile");

const userRouter = require("./routes/user");

const chatRouter = require("./routes/chat");

const cors = require("cors");

const initializeSocket = require("./utils/socket");

const helmet = require("helmet");

require('dotenv').config();

// Adds standard security headers to every response
app.use(helmet());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(cookieParser());

app.use(express.json());


app.use("/", userRouter);

app.use("/", authRouter);

app.use("/", requestRouter);

app.use("/", profileRouter);

app.use("/", chatRouter);




// Socket.IO needs the underlying HTTP server, so create it from the Express app
const server = http.createServer(app);

// Attach Socket.IO to the same server
initializeSocket(server);

connectDB().then(() => {
    console.log("Database connected successfully!");

    // server.listen (not app.listen), so Express and Socket.IO can share port 3000
    server.listen(3000, () => {
        console.log("server is up and running!")
    })

}).catch((err) => {
    console.log("Database connection failed!", err);
});

