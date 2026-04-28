const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: { type: String, required: true },
  requesterRole: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  type: { 
    type: String, 
    enum: ['leave', 'early_dismissal', 'sports', 'event', 'other'], 
    required: true 
  },
  reason: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  attachment: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);