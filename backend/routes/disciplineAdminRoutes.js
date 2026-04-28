const express = require('express');
const router = express.Router();
const Discipline = require('../models/Discipline');
const Permission = require('../models/Permission');
const Student = require('../models/Student');
const Announcement = require('../models/Announcement');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Get all discipline cases
router.get('/cases', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const cases = await Discipline.find()
      .populate('studentId', 'studentId')
      .populate('reportedBy', 'fullName role')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review and take action on case
router.put('/cases/:caseId/review', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const { action, actionDetails, status } = req.body;
    const disciplineCase = await Discipline.findById(req.params.caseId);
    
    disciplineCase.action = action;
    disciplineCase.actionDetails = actionDetails;
    disciplineCase.status = status;
    disciplineCase.reviewedBy = req.userId;
    disciplineCase.reviewedAt = new Date();
    await disciplineCase.save();
    
    // If suspension or expulsion, update student status
    if (action === 'suspension' || action === 'expulsion') {
      await Student.findByIdAndUpdate(disciplineCase.studentId, { isActive: false });
    }
    
    res.json({ success: true, message: `Case ${status} with action: ${action}`, disciplineCase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all permission requests
router.get('/permissions', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or reject permission
router.put('/permissions/:permissionId', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const permission = await Permission.findById(req.params.permissionId);
    
    permission.status = status;
    permission.reviewedBy = req.userId;
    permission.reviewedAt = new Date();
    if (rejectionReason) permission.rejectionReason = rejectionReason;
    await permission.save();
    
    res.json({ success: true, message: `Permission ${status}`, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discipline stats by class
router.get('/stats', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const cases = await Discipline.find().populate('studentId', 'classId');
    const stats = {
      total: cases.length,
      pending: cases.filter(c => c.status === 'pending').length,
      resolved: cases.filter(c => c.status === 'resolved').length,
      byCategory: {},
      byClass: {}
    };
    
    for (const c of cases) {
      stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// School-wide announcement
router.post('/announcements', authMiddleware, roleCheck(['discipline_admin', 'super_admin']), async (req, res) => {
  try {
    const { title, content, audience, priority } = req.body;
    const announcement = new Announcement({
      title, content, audience, priority,
      createdBy: req.userId
    });
    await announcement.save();
    res.json({ success: true, message: 'Announcement sent', announcement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;