const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  qualification: String,
  experience: Number,
  salary: { type: Number, default: 0 },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);