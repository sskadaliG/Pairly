const isValidToUpdate = (body) => {

    const canUpdateFields = ['firstName', 'lastName', 'password', 'age', 'gender', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country', 'photoURL', 'bio', 'interests'];
    const updateFields = Object.keys(body);
    return updateFields.every((field) => canUpdateFields.includes(field));

};

module.exports = isValidToUpdate;