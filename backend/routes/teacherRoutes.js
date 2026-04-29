const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Discipline = require('../models/Discipline');
const Permission = require('../models/Permission');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// ==================== CLASS MANAGEMENT ====================

// Get teacher's classes
router.get('/classes', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.userId }).populate('students');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create class
router.post('/classes', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { className, grade, academicYear } = req.body;
    const newClass = new Class({
      className, grade, academicYear,
      teacher: req.userId,
      students: []
    });
    await newClass.save();
    res.json({ success: true, message: 'Class created successfully', class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== STUDENT MANAGEMENT ====================

// Get teacher's students
router.get('/students', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.userId });
    const classIds = classes.map(c => c._id);
    const students = await Student.find({ classId: { $in: classIds } })
      .populate('user', 'fullName email isActive')
      .populate('parent', 'fullName email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student
router.post('/create-student', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { fullName, email, password, studentId, classId, parentName, parentEmail, parentPhone } = req.body;
    
    const classExists = await Class.findOne({ _id: classId, teacher: req.userId });
    if (!classExists) {
      return res.status(400).json({ message: 'Class not found or not assigned to you' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const defaultPassword = password || `student${Math.floor(Math.random() * 10000)}`;
    
    const studentUser = new User({
      fullName, email, password: defaultPassword, role: 'student',
      createdBy: req.userId, isActive: true
    });
    await studentUser.save();
    
    let parentId = null;
    if (parentEmail) {
      let parentUser = await User.findOne({ email: parentEmail });
      if (!parentUser) {
        parentUser = new User({
          fullName: parentName || `${fullName}'s Parent`,
          email: parentEmail, password: 'parent123', role: 'parent',
          phone: parentPhone, createdBy: req.userId
        });
        await parentUser.save();
      }
      parentId = parentUser._id;
    }
    
    const student = new Student({
      user: studentUser._id, studentId: studentId || `STU${Date.now()}`,
      classId, parent: parentId, enrollmentDate: new Date(), isActive: true
    });
    await student.save();
    
    await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    
    res.json({ 
      success: true, message: 'Student created successfully',
      student: { _id: student._id, studentId: student.studentId, fullName, email, password: defaultPassword }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student
router.put('/students/:id', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { fullName, email, classId } = req.body;
    const student = await Student.findById(req.params.id).populate('user');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update user
    await User.findByIdAndUpdate(student.user._id, { fullName, email });
    
    // Update class if changed
    if (classId && classId !== student.classId?.toString()) {
      // Remove from old class
      if (student.classId) {
        await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
      }
      // Add to new class
      await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
      student.classId = classId;
      await student.save();
    }
    
    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student
router.delete('/students/:id', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Remove from class
    if (student.classId) {
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    }
    
    // Delete user account
    if (student.user) {
      await User.findByIdAndDelete(student.user._id);
    }
    
    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset student password
router.post('/students/:id/reset-password', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const student = await Student.findById(req.params.id).populate('user');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    student.user.password = newPassword || 'student123';
    await student.user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ASSIGNMENT MANAGEMENT ====================

router.get('/assignments', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.userId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/assignments', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { title, description, subject, classId, dueDate, totalPoints } = req.body;
    const assignment = new Assignment({
      title, description, subject, classId, teacherId: req.userId,
      dueDate, totalPoints: totalPoints || 100
    });
    await assignment.save();
    res.json({ success: true, message: 'Assignment created', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ATTENDANCE ====================

router.post('/attendance', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    for (const record of records) {
      await Attendance.findOneAndUpdate(
        { studentId: record.studentId, date: new Date(date) },
        { classId, status: record.status, teacherId: req.userId },
        { upsert: true }
      );
    }
    res.json({ success: true, message: 'Attendance marked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PERMISSIONS ====================

router.post('/permissions', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { type, reason, fromDate, toDate } = req.body;
    const user = await User.findById(req.userId);
    const permission = new Permission({
      requesterId: req.userId, requesterName: user.fullName, requesterRole: user.role,
      type, reason, fromDate, toDate, status: 'pending'
    });
    await permission.save();
    res.json({ success: true, message: 'Permission request submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DISCIPLINE ====================

router.post('/discipline', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { studentId, category, description, incidentDate } = req.body;
    const discipline = new Discipline({
      studentId, reportedBy: req.userId, incidentDate, category, description, status: 'pending'
    });
    await discipline.save();
    res.json({ success: true, message: 'Discipline case reported' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Teacher routes are working!' });
});

module.exports = router;