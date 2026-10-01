const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 20
    },
    lastName: {
        type: String,
        minlength: 1,
        maxlength: 10
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 18,
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other'],
        validate(value) {
            if (!['Male', 'Female', 'Other'].includes(value)) {
                throw new Error('Gender must be Male, Female, or Other');
            }
        }
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zipCode: {
        type: String
    },
    country: {
        type: String
    },
    photoURL: {
        type: String,
        default: "https://cdn.vectorstock.com/i/1000v/42/08/avatar-default-user-profile-icon-social-media-vector-57234208.jpg"
    },
    bio: {
        type: String,
        default: "This user has not added a bio yet."
    },
    interests: {
        type: [String],
        default: ['music', 'art'],
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;