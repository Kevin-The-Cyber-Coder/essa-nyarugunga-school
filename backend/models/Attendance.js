const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);