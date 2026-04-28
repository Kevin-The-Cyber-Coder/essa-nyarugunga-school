const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  term: { type: String, required: true },
  year: { type: Number, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  dueDate: Date,
  paymentHistory: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    method: String,
    reference: String,
    receiptNo: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);