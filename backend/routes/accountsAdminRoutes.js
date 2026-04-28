const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Salary = require('../models/Salary');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Assign fees to class
router.post('/assign-fees', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const { classId, term, year, amount, dueDate } = req.body;
    const students = await Student.find({ classId });
    
    for (const student of students) {
      const existingFee = await Fee.findOne({ studentId: student._id, term, year });
      if (!existingFee) {
        const fee = new Fee({
          studentId: student._id,
          term, year, amount,
          balance: amount,
          dueDate
        });
        await fee.save();
      }
    }
    res.json({ success: true, message: `Fees assigned to ${students.length} students` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all fees
router.get('/fees', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const fees = await Fee.find().populate('studentId', 'studentId');
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record payment
router.post('/fees/:feeId/payment', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const { amount, method, reference } = req.body;
    const fee = await Fee.findById(req.params.feeId);
    
    fee.paidAmount += amount;
    fee.balance -= amount;
    fee.status = fee.balance <= 0 ? 'paid' : 'partial';
    fee.paymentHistory.push({ amount, method, reference, receiptNo: `RCP${Date.now()}` });
    await fee.save();
    
    res.json({ success: true, message: 'Payment recorded', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher salaries for approval
router.get('/teacher-salaries', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const salaries = await Salary.find({ status: 'pending' }).populate('teacherId', 'teacherId subject');
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve salary
router.put('/teacher-salaries/:salaryId/approve', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.salaryId);
    salary.status = 'approved';
    salary.approvedBy = req.userId;
    await salary.save();
    res.json({ success: true, message: 'Salary approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record school expenses
let expenses = [];
let income = [];

router.post('/expenses', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    expenses.push({ id: expenses.length + 1, category, amount, description, date, createdAt: new Date() });
    res.json({ success: true, message: 'Expense recorded', expense: expenses[expenses.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/financial-records', authMiddleware, roleCheck(['accounts_admin']), async (req, res) => {
  try {
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ income, expenses, totalIncome, totalExpenses, balance: totalIncome - totalExpenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;