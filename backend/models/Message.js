const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverName: { type: String, required: true },
  receiverRole: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  attachments: [{ fileName: String, fileUrl: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);