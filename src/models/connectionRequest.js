const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectionRequestSchema = new Schema({
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'interested', 'not_interested'], default: 'pending', required: true },
}, { timestamps: true });

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
// The index above only helps queries that start with fromUserId. This one serves
// the "sent to me" queries: received requests, connections and the feed.
connectionRequestSchema.index({ toUserId: 1, status: 1 });

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);
module.exports = ConnectionRequest;