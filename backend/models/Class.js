const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  section: { type: String, default: 'A' },
  grade: { type: String, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], required: true },
  academicYear: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);