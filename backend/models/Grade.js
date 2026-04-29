const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String },
  term: { type: String, required: true },
  year: { type: Number, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

gradeSchema.pre('save', function(next) {
  if (this.score >= 80) this.grade = 'A';
  else if (this.score >= 75) this.grade = 'B+';
  else if (this.score >= 70) this.grade = 'B';
  else if (this.score >= 65) this.grade = 'C+';
  else if (this.score >= 60) this.grade = 'C';
  else if (this.score >= 50) this.grade = 'D';
  else if (this.score >= 40) this.grade = 'E';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);