const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  incidentDate: { type: Date, required: true, default: Date.now },
  category: { 
    type: String, 
    enum: ['Late', 'Misbehavior', 'Uniform Violation', 'Academic Dishonesty', 'Fighting', 'Other'], 
    required: true 
  },
  description: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['warning', 'suspension', 'expulsion', 'community_service', 'detention', 'pending'], 
    default: 'pending' 
  },
  actionDetails: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Discipline', disciplineSchema);