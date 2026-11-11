require("dotenv").config();
const jwt = require('jsonwebtoken');
const User = require("../models/user");

// Shared by userAuth (API routes) and the chat socket.
// Returns the user, null if the user no longer exists, or throws if the token is invalid.
const getUserFromToken = async (token) => {
    // Throws if the token is invalid or expired
    const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedMessage.userId);
    if (!user) {
        return null;
    }

    // The password changed after this token was issued, so this login is no longer valid.
    // iat ("issued at") is in seconds, so compare in seconds too.
    if (user.passwordChangedAt && decodedMessage.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        throw new Error("Token was issued before the last password change");
    }

    return user;
};

const userAuth = async (req, res, next) => {
    const cookies = req.cookies;
    try {
        if (!cookies.token) {
            return res.status(401).send("Token not found");
        }

        const user = await getUserFromToken(cookies.token);
        if (!user) {
            return res.status(404).send("User not found, please login again");
        }

        req.user = user;
        next();
    } catch (err) {
        // An invalid or expired token: don't send the jwt library's error details
        res.status(401).send("Please login again");
    }

};

module.exports = { userAuth, getUserFromToken };
