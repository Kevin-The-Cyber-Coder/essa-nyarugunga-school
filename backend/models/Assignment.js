const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  totalPoints: { type: Number, default: 100 },
  attachments: [{ fileName: String, fileUrl: String }],
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: Date,
    fileUrl: String,
    content: String,
    score: Number,
    feedback: String,
    status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);