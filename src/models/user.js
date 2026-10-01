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
        minlength: 5,
        maxlength: 50,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 50
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        required: true,
        validate(value) {
            if (!['Male', 'Female', 'Other'].includes(value)) {
                throw new Error('Gender must be Male, Female, or Other');
            }
        }
    },
    phoneNumber: {
        type: String,
        validate(value) {
            if (!/^\d{10}$/.test(value)) {
                throw new Error('Phone number must be 10 digits');
            }
        }
    },
    address: {
        type: String,
        minlength: 5,
        maxlength: 50
    },
    city: {
        type: String,
        minlength: 2,
        maxlength: 20
    },
    state: {
        type: String,
        minlength: 2,
        maxlength: 20
    },
    zipCode: {
        type: String,
        validate(value) {
            if (!/^\d{5}$/.test(value)) {
                throw new Error('Zip code must be 5 digits');
            }
        }
    },
    country: {
        type: String,
        minlength: 2,
        maxlength: 20
    },
    photoURL: {
        type: String,
        default: "https://cdn.vectorstock.com/i/1000v/42/08/avatar-default-user-profile-icon-social-media-vector-57234208.jpg",
        maxlength: 200
    },
    bio: {
        type: String,
        default: "This user has not added a bio yet.",
        maxlength: 200
    },
    interests: {
        type: [String],
        default: ['music', 'art'],
        validate: {
            validator: function (value) {
                return value.length <= 10;
            },
            message: 'Interests cannot exceed 10 items'
        }
    },

},
    {
        timestamps: true
    });

const User = mongoose.model('User', userSchema);

module.exports = User;