const validator = require('validator');

const validateSignUpData = (req) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName) {
        throw new Error("First name is required");
    }
    else if (firstName.length < 2 || firstName.length > 20) {
        throw new Error("First name must be between 2 and 20 characters");
    }
    else if (!lastName) {
        throw new Error("Last name is required");
    }
    else if (lastName && (lastName.length < 1 || lastName.length > 10)) {
        throw new Error("Last name must be between 1 and 10 characters");
    }
    else if (!email) {
        throw new Error("Email is required");
    }
    else if (!validator.isEmail(email)) {
        throw new Error("Invalid email format");
    }
    else if (!password) {
        throw new Error("Password is required");
    }
    else if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
        throw new Error("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol");
    }

};

module.exports = { validateSignUpData };