const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

app.use(cors());
app.use(express.json());

// ==================== MODELS ====================

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['super_admin', 'academic_admin', 'discipline_admin', 'accounts_admin', 'teacher', 'student', 'parent'] },
  phone: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  subject: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  fullName: String,
  email: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentName: String,
  parentPhone: String,
  isActive: { type: Boolean, default: true },
  enrollmentDate: { type: Date, default: Date.now }
});

const classSchema = new mongoose.Schema({
  className: String,
  grade: { type: String, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  academicYear: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  subject: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  totalPoints: Number,
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: Date,
    content: String,
    score: Number,
    status: { type: String, default: 'pending' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: Date,
  status: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const gradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  subject: String,
  score: Number,
  grade: String,
  term: String,
  year: Number,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const disciplineSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: String,
  category: String,
  description: String,
  action: String,
  actionDetails: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const permissionSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requesterName: String,
  requesterRole: String,
  type: { type: String, enum: ['leave', 'early_dismissal', 'sports', 'event', 'other'] },
  reason: String,
  fromDate: Date,
  toDate: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { type: [String], default: ['all'] },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const newsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  image: String,
  category: { type: String, enum: ['news', 'event', 'announcement'], default: 'news' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const gallerySchema = new mongoose.Schema({
  title: String,
  image: String,
  category: String,
  date: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  senderRole: String,
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverName: String,
  receiverRole: String,
  content: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
const Student = mongoose.model('Student', studentSchema);
const Class = mongoose.model('Class', classSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Grade = mongoose.model('Grade', gradeSchema);
const Discipline = mongoose.model('Discipline', disciplineSchema);
const Permission = mongoose.model('Permission', permissionSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const News = mongoose.model('News', newsSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
  });
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.role !== role) return res.status(401).json({ message: 'Invalid role' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.fullName }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ success: true, _id: user._id, fullName: user.fullName, email: user.email, role: user.role, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SUPER ADMIN ROUTES ====================

// Get admins
app.get('/api/super-admin/admins', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
    const admins = await User.find({ role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] } }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create admin
app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
    
    const { fullName, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email exists' });
    
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const newAdmin = new User({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
    await newAdmin.save();
    res.json({ success: true, user: { _id: newAdmin._id, fullName, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete admin
app.delete('/api/super-admin/admins/:id', authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Create announcement
app.post('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  const { title, content, audience, priority } = req.body;
  const announcement = new Announcement({ title, content, audience: audience || ['all'], priority: priority || 'normal', createdBy: req.userId });
  await announcement.save();
  res.json({ success: true, announcement });
});

// Get announcements
app.get('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
});

app.get('/api/announcements', authMiddleware, async (req, res) => {
  const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(announcements);
});

// Delete announcement
app.delete('/api/super-admin/announcements/:id', authMiddleware, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Get discipline cases
app.get('/api/super-admin/discipline-cases', authMiddleware, async (req, res) => {
  const cases = await Discipline.find().sort({ createdAt: -1 });
  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    resolved: cases.filter(c => c.status === 'resolved').length,
    byCategory: {}
  };
  cases.forEach(c => {
    stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
  });
  res.json({ cases, stats });
});

// Update discipline case
app.put('/api/super-admin/discipline-cases/:id', authMiddleware, async (req, res) => {
  const { action, actionDetails, status } = req.body;
  const disciplineCase = await Discipline.findById(req.params.id);
  if (!disciplineCase) return res.status(404).json({ message: 'Case not found' });
  
  disciplineCase.action = action;
  disciplineCase.actionDetails = actionDetails;
  disciplineCase.status = status;
  disciplineCase.reviewedBy = req.userId;
  disciplineCase.reviewedAt = new Date();
  await disciplineCase.save();
  res.json({ success: true });
});

// Get permissions
app.get('/api/super-admin/permissions', authMiddleware, async (req, res) => {
  const permissions = await Permission.find().sort({ createdAt: -1 });
  const trends = {
    total: permissions.length,
    approved: permissions.filter(p => p.status === 'approved').length,
    rejected: permissions.filter(p => p.status === 'rejected').length,
    pending: permissions.filter(p => p.status === 'pending').length,
    byType: {}
  };
  permissions.forEach(p => {
    trends.byType[p.type] = (trends.byType[p.type] || 0) + 1;
  });
  res.json({ permissions, trends });
});

// Update permission
app.put('/api/super-admin/permissions/:id', authMiddleware, async (req, res) => {
  const { status, rejectionReason } = req.body;
  const permission = await Permission.findById(req.params.id);
  if (!permission) return res.status(404).json({ message: 'Permission not found' });
  
  permission.status = status;
  permission.reviewedBy = req.userId;
  permission.reviewedAt = new Date();
  if (rejectionReason) permission.rejectionReason = rejectionReason;
  await permission.save();
  res.json({ success: true });
});

// ==================== ACADEMIC ADMIN ROUTES ====================

// Teachers
app.get('/api/academic-admin/teachers-list', authMiddleware, async (req, res) => {
  const teachers = await TeacherProfile.find();
  res.json(teachers);
});

app.post('/api/academic-admin/create-teacher-credentials', authMiddleware, async (req, res) => {
  const { fullName, email, password, phone, subject } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
  const user = new User({ fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '', createdBy: req.userId });
  await user.save();
  
  const teacher = new TeacherProfile({ userId: user._id, fullName, email, subject: subject || 'General', phone: phone || '' });
  await teacher.save();
  res.json({ success: true, teacher: { _id: teacher._id, fullName, email, password: password || 'teacher123' } });
});

app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  const teacher = await TeacherProfile.findById(req.params.id);
  if (teacher) {
    await User.findByIdAndDelete(teacher.userId);
    await TeacherProfile.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true });
});

// Classes
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  const classes = await Class.find().populate('teacherId', 'fullName');
  res.json(classes);
});

app.post('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  const { className, grade, academicYear, teacherId } = req.body;
  const newClass = new Class({ className, grade, academicYear, teacherId: teacherId || null });
  await newClass.save();
  res.json({ success: true, class: newClass });
});

app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, async (req, res) => {
  const { teacherId } = req.body;
  const classItem = await Class.findById(req.params.classId);
  if (!classItem) return res.status(404).json({ message: 'Class not found' });
  classItem.teacherId = teacherId;
  await classItem.save();
  res.json({ success: true });
});

app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
// Assign teacher to class - FIXED VERSION
app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classId = req.params.classId;
    
    console.log('Assign teacher request:', { classId, teacherId });
    
    // Find the class
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Update the teacherId
    classItem.teacherId = teacherId;
    await classItem.save();
    
    console.log('Class updated:', classItem);
    
    // Get teacher details for response
    let teacherDetails = null;
    if (teacherId) {
      const teacher = await User.findById(teacherId).select('fullName');
      teacherDetails = teacher;
    }
    
    res.json({ 
      success: true, 
      message: 'Teacher assigned successfully',
      class: {
        ...classItem.toObject(),
        teacherId: teacherDetails
      }
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ message: error.message });
  }
});    // Get teacher details for response
    const teacher = await User.findById(teacherId).select('fullName');
    
    res.json({ 
      success: true, 
      message: 'Teacher assigned successfully',
      class: {
        ...classItem.toObject(),
        teacherId: teacher
      }
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ message: error.message });
  }
});
// News
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  const news = await News.find().sort({ createdAt: -1 });
  res.json(news);
});

app.post('/api/academic-admin/news', authMiddleware, async (req, res) => {
  const { title, summary, content, image, category } = req.body;
  const news = new News({ title, summary, content, image, category, date: new Date() });
  await news.save();
  res.json({ success: true, news });
});

app.delete('/api/academic-admin/news/:id', authMiddleware, async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Gallery
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  const images = await Gallery.find().sort({ date: -1 });
  res.json(images);
});

app.post('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  const { title, image, category } = req.body;
  const gallery = new Gallery({ title, image, category, date: new Date() });
  await gallery.save();
  res.json({ success: true, gallery });
});

app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Performance
app.get('/api/academic-admin/students-performance', authMiddleware, async (req, res) => {
  const students = await Student.find();
  const performance = [];
  for (const student of students) {
    const grades = await Grade.find({ studentId: student._id });
    const avg = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0;
    performance.push({
      studentId: student.studentId,
      name: student.fullName,
      class: 'N/A',
      averageScore: avg.toFixed(1)
    });
  }
  res.json(performance);
});

app.get('/api/academic-admin/class-performance', authMiddleware, async (req, res) => {
  const classes = await Class.find();
  const performance = [];
  for (const classItem of classes) {
    const students = await Student.find({ classId: classItem._id });
    performance.push({
      className: `${classItem.grade} ${classItem.className}`,
      teacher: classItem.teacherId?.fullName || 'Not Assigned',
      studentCount: students.length,
      averageScore: '0',
      academicYear: classItem.academicYear
    });
  }
  res.json(performance);
});

// ==================== TEACHER ROUTES ====================

app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  const students = await Student.find({ teacherId: req.userId }).populate('userId', 'fullName email');
  res.json(students);
});

app.get('/api/teacher/classes', authMiddleware, async (req, res) => {
  const classes = await Class.find({ teacherId: req.userId });
  res.json(classes);
});

app.post('/api/teacher/create-student', authMiddleware, async (req, res) => {
  const { fullName, email, password, studentId, classId, parentName, parentPhone } = req.body;
  
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ fullName, email, password: hashedPassword, role: 'student', createdBy: req.userId });
  await user.save();
  
  const student = new Student({
    userId: user._id, studentId: studentId || `STU${Date.now()}`, fullName, email,
    classId, teacherId: req.userId, parentName, parentPhone, enrollmentDate: new Date()
  });
  await student.save();
  
  await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
  res.json({ success: true, student: { _id: student._id, fullName, email, password } });
});

app.delete('/api/teacher/students/:id', authMiddleware, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (student) {
    await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true });
});

app.post('/api/teacher/students/:id/reset-password', authMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  const student = await Student.findById(req.params.id);
  if (student) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(student.userId, { password: hashedPassword });
  }
  res.json({ success: true, newPassword });
});

app.get('/api/teacher/assignments', authMiddleware, async (req, res) => {
  const assignments = await Assignment.find({ teacherId: req.userId });
  res.json(assignments);
});

app.post('/api/teacher/assignments', authMiddleware, async (req, res) => {
  const { title, description, subject, classId, dueDate, totalPoints } = req.body;
  const assignment = new Assignment({ title, description, subject, classId, teacherId: req.userId, dueDate, totalPoints: totalPoints || 100 });
  await assignment.save();
  res.json({ success: true, assignment });
});

app.get('/api/teacher/attendance', authMiddleware, async (req, res) => {
  const attendance = await Attendance.find({ teacherId: req.userId });
  res.json(attendance);
});

app.post('/api/teacher/attendance', authMiddleware, async (req, res) => {
  const { classId, date, records } = req.body;
  for (const record of records) {
    await Attendance.findOneAndUpdate(
      { studentId: record.studentId, date: new Date(date) },
      { classId, status: record.status, teacherId: req.userId },
      { upsert: true }
    );
  }
  res.json({ success: true });
});

// ==================== MESSAGE ROUTES ====================
app.get('/api/messages/users', authMiddleware, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.userId }, isActive: true }).select('fullName email role');
  res.json(users);
});

app.get('/api/messages/unread/count', authMiddleware, async (req, res) => {
  const count = await Message.countDocuments({ receiverId: req.userId, isRead: false });
  res.json({ count });
});

app.get('/api/messages/user/:userId', authMiddleware, async (req, res) => {
  const messages = await Message.find({
    $or: [
      { senderId: req.userId, receiverId: req.params.userId },
      { senderId: req.params.userId, receiverId: req.userId }
    ]
  }).sort({ createdAt: 1 });
  
  await Message.updateMany({ senderId: req.params.userId, receiverId: req.userId, isRead: false }, { $set: { isRead: true } });
  res.json(messages);
});

app.post('/api/messages/send', authMiddleware, async (req, res) => {
  const { receiverId, content } = req.body;
  const sender = await User.findById(req.userId);
  const receiver = await User.findById(receiverId);
  
  const message = new Message({
    senderId: req.userId, senderName: sender.fullName, senderRole: sender.role,
    receiverId, receiverName: receiver.fullName, receiverRole: receiver.role,
    content
  });
  await message.save();
  
  io.to(receiverId).emit('newMessage', message);
  res.json({ success: true, message });
});

// ==================== CREATE DEFAULT USERS ====================
const createDefaultSuperAdmin = async () => {
  const existing = await User.findOne({ email: 'admin@essa.rw' });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      fullName: 'Super Administrator',
      email: 'admin@essa.rw',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true
    });
    console.log('✅ Super Admin created: admin@essa.rw / admin123');
  }
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

createDefaultSuperAdmin().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login: admin@essa.rw / admin123\n`);
  });
});