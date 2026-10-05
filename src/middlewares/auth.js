require("dotenv").config();
const jwt = require('jsonwebtoken');
const User = require("../models/user");


const userAuth = async (req, res, next) => {
    const cookies = req.cookies;
    try {
        if (!cookies.token) {
            return res.status(401).send("Token not found");
        }
        const decodedMessage = jwt.verify(cookies.token, process.env.JWT_SECRET);

        const user = await User.findById(decodedMessage.userId);
        if (!user) {
            return res.status(404).send("User not found, please login again");
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).send("Error:" + err.message);
    }

};

module.exports = { userAuth };