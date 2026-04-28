const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Salary = require('../models/Salary');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Create teacher
router.post('/create-teacher', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const { fullName, email, password, phone, subject, department, qualification, salary } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const user = new User({
      fullName, email, password, role: 'teacher', phone,
      createdBy: req.userId
    });
    await user.save();
    
    const teacherId = `TCH${Date.now()}`;
    const teacher = new Teacher({
      userId: user._id, teacherId, subject, department, qualification,
      salary: salary || 0
    });
    await teacher.save();
    
    res.json({ success: true, message: 'Teacher created successfully', teacher: { ...teacher.toObject(), fullName, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all teachers
router.get('/teachers', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('userId', 'fullName email phone isActive');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create class
router.post('/classes', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const { className, grade, teacherId, academicYear } = req.body;
    const newClass = new Class({ className, grade, teacher: teacherId, academicYear });
    await newClass.save();
    
    await Teacher.findByIdAndUpdate(teacherId, { $push: { classes: newClass._id } });
    res.json({ success: true, message: 'Class created successfully', class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes
router.get('/classes', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'fullName').populate('students');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher salary management
router.post('/teacher-salary', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const { teacherId, month, year, baseSalary, bonuses, deductions } = req.body;
    const netSalary = baseSalary + (bonuses || 0) - (deductions || 0);
    
    const salary = new Salary({
      teacherId, month, year, baseSalary, bonuses, deductions, netSalary
    });
    await salary.save();
    
    res.json({ success: true, message: 'Salary recorded', salary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher salaries
router.get('/teacher-salaries', authMiddleware, roleCheck(['academic_admin']), async (req, res) => {
  try {
    const salaries = await Salary.find().populate('teacherId', 'teacherId subject');
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;