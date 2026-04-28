const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Discipline = require('../models/Discipline');
const Permission = require('../models/Permission');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Create student
router.post('/create-student', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { fullName, email, password, studentId, classId, dateOfBirth, gender, parentEmail, parentName, parentPhone } = req.body;
    
    // Create student user
    const studentUser = new User({
      fullName, email, password, role: 'student', phone: '',
      createdBy: req.userId
    });
    await studentUser.save();
    
    // Create parent user if provided
    let parentId = null;
    if (parentEmail) {
      let parentUser = await User.findOne({ email: parentEmail });
      if (!parentUser) {
        parentUser = new User({
          fullName: parentName || `${fullName}'s Parent`,
          email: parentEmail,
          password: 'parent123',
          role: 'parent',
          phone: parentPhone,
          createdBy: req.userId
        });
        await parentUser.save();
      }
      parentId = parentUser._id;
    }
    
    // Create student profile
    const student = new Student({
      userId: studentUser._id,
      studentId: studentId || `STU${Date.now()}`,
      parentId,
      classId,
      dateOfBirth,
      gender
    });
    await student.save();
    
    // Add student to class
    await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    
    res.json({ success: true, message: 'Student created successfully', student: { ...student.toObject(), fullName, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher's classes
router.get('/my-classes', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.userId }).populate('students');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance
router.post('/attendance', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    
    for (const record of records) {
      await Attendance.findOneAndUpdate(
        { studentId: record.studentId, date: new Date(date) },
        { classId, status: record.status, teacherId: req.userId, remarks: record.remarks },
        { upsert: true }
      );
    }
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment
router.post('/assignments', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { title, description, subject, classId, dueDate, totalPoints, attachments } = req.body;
    const assignment = new Assignment({
      title, description, subject, classId, teacherId: req.userId,
      dueDate, totalPoints, attachments: attachments || []
    });
    await assignment.save();
    res.json({ success: true, message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignments for teacher's classes
router.get('/assignments', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.userId });
    const classIds = classes.map(c => c._id);
    const assignments = await Assignment.find({ classId: { $in: classIds } }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Grade assignment submission
router.put('/assignments/:assignmentId/grade', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { studentId, score, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    const submission = assignment.submissions.find(s => s.studentId.toString() === studentId);
    if (submission) {
      submission.score = score;
      submission.feedback = feedback;
      submission.status = 'graded';
    }
    await assignment.save();
    res.json({ success: true, message: 'Submission graded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Report discipline case
router.post('/discipline', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const { studentId, incidentDate, category, description } = req.body;
    const discipline = new Discipline({
      studentId, reportedBy: req.userId, incidentDate, category, description
    });
    await discipline.save();
    res.json({ success: true, message: 'Discipline case reported', discipline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request permission
router.post('/permissions', authMiddleware, roleCheck(['teacher', 'student']), async (req, res) => {
  try {
    const { studentId, type, reason, fromDate, toDate } = req.body;
    const user = await User.findById(req.userId);
    const permission = new Permission({
      requesterId: req.userId,
      requesterName: user.fullName,
      requesterRole: user.role,
      studentId: studentId || null,
      studentName: studentId ? null : user.fullName,
      type, reason, fromDate, toDate
    });
    await permission.save();
    res.json({ success: true, message: 'Permission request submitted', permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student performance charts
router.get('/student-performance/:classId', authMiddleware, roleCheck(['teacher']), async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId }).populate('userId', 'fullName');
    const performance = [];
    
    for (const student of students) {
      const assignments = await Assignment.find({ classId: req.params.classId });
      const grades = [];
      for (const assignment of assignments) {
        const submission = assignment.submissions.find(s => s.studentId.toString() === student._id.toString());
        if (submission && submission.score) {
          grades.push(submission.score);
        }
      }
      const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      performance.push({
        studentId: student._id,
        name: student.userId.fullName,
        averageScore: avg.toFixed(1),
        totalAssignments: assignments.length,
        completedAssignments: grades.length
      });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;