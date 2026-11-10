const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
}, { timestamps: true });

// Speeds up loading a conversation: messages between two users, oldest first
messageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
