const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  baseSalary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: Date,
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Salary || mongoose.model('Salary', salarySchema);