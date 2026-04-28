const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  qualification: String,
  experience: Number,
  salary: { type: Number, default: 0 },
  salaryStatus: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);