const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectionRequestSchema = new Schema({
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'interested', 'not_interested'], default: 'pending', required: true },
}, { timestamps: true });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);
module.exports = ConnectionRequest;