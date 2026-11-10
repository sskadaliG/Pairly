const express = require('express');

const connectDB = require("./config/database");

const app = express();

const cookieParser = require('cookie-parser');

const authRouter = require("./routes/authRouter");

const requestRouter = require("./routes/request");

const profileRouter = require("./routes/profile");

const userRouter = require("./routes/user");

const chatRouter = require("./routes/chat");

const cors = require("cors");

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




connectDB().then(() => {
    console.log("Database connected successfully!");

    app.listen(3000, () => {
        console.log("server is up and running!")
    })

}).catch((err) => {
    console.log("Database connection failed!", err);
});

