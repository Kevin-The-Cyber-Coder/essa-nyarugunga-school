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

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'academic_admin', 'discipline_admin', 'accounts_admin', 'teacher', 'student', 'parent'], 
    required: true 
  },
  phone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Teacher Profile Schema
const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, default: 'General' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentName: { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  enrollmentDate: { type: Date, default: Date.now }
});

// Class Schema
const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  grade: { type: String, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], required: true },
  academicYear: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

// News Schema
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, default: '' },
  image: { type: String, default: '' },
  category: { type: String, enum: ['news', 'event', 'announcement'], default: 'news' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Gallery Schema
const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'general' },
  date: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverName: { type: String, required: true },
  receiverRole: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  totalPoints: { type: Number, default: 100 },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: Date,
    content: String,
    score: Number,
    status: { type: String, default: 'pending' }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Models
const User = mongoose.model('User', userSchema);
const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
const Student = mongoose.model('Student', studentSchema);
const Class = mongoose.model('Class', classSchema);
const News = mongoose.model('News', newsSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const Message = mongoose.model('Message', messageSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

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

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
  });
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
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
app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
    
    const { fullName, email, password, phone, role } = req.body;
    const allowedRoles = ['academic_admin', 'discipline_admin', 'accounts_admin'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const newAdmin = new User({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
    await newAdmin.save();
    
    res.json({ success: true, message: `${role} created`, user: { _id: newAdmin._id, fullName, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/super-admin/admins', authMiddleware, async (req, res) => {
  const currentUser = await User.findById(req.userId);
  if (currentUser.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const admins = await User.find({ role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] } }).select('-password');
  res.json(admins);
});


// Get all discipline cases
app.get('/api/super-admin/discipline-cases', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Discipline = mongoose.model('Discipline', new mongoose.Schema({
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      category: String,
      description: String,
      action: String,
      status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }));
    
    const cases = await Discipline.find()
      .populate('studentId', 'fullName studentId')
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 });
    
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update discipline case (punish, suspend, expel)
app.put('/api/super-admin/discipline-cases/:id', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { action, actionDetails, status } = req.body;
    const Discipline = mongoose.model('Discipline');
    
    const disciplineCase = await Discipline.findById(req.params.id);
    if (!disciplineCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    disciplineCase.action = action;
    disciplineCase.actionDetails = actionDetails;
    disciplineCase.status = status;
    disciplineCase.reviewedBy = req.userId;
    disciplineCase.reviewedAt = new Date();
    await disciplineCase.save();
    
    // If suspension or expulsion, update student status
    if (action === 'suspension' || action === 'expulsion') {
      const Student = mongoose.model('Student');
      await Student.findByIdAndUpdate(disciplineCase.studentId, { isActive: false });
    }
    
    res.json({ success: true, message: `Case ${status} with action: ${action}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all permissions
app.get('/api/super-admin/permissions', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Permission = mongoose.model('Permission', new mongoose.Schema({
      requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requesterName: String,
      requesterRole: String,
      type: String,
      reason: String,
      fromDate: Date,
      toDate: Date,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }));
    
    const permissions = await Permission.find()
      .populate('requesterId', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update permission status
app.put('/api/super-admin/permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const Permission = mongoose.model('Permission');
    
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    permission.status = status;
    permission.reviewedBy = req.userId;
    permission.reviewedAt = new Date();
    if (rejectionReason) permission.rejectionReason = rejectionReason;
    await permission.save();
    
    res.json({ success: true, message: `Permission ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get permission trends
app.get('/api/super-admin/permissions/trends', authMiddleware, async (req, res) => {
  try {
    const Permission = mongoose.model('Permission');
    const permissions = await Permission.find();
    
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
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ACADEMIC ADMIN ROUTES ====================

// Get all teachers
app.get('/api/academic-admin/teachers', authMiddleware, async (req, res) => {
  try {
    const teachers = await TeacherProfile.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create teacher
app.post('/api/academic-admin/create-teacher', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, password, phone, subject } = req.body;
    console.log('Creating teacher:', { fullName, email, subject });
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create user account
    const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'teacher',
      phone: phone || '',
      createdBy: req.userId,
      isActive: true
    });
    await user.save();
    
    // Create teacher profile
    const teacher = new TeacherProfile({
      userId: user._id,
      fullName,
      email,
      subject: subject || 'General',
      phone: phone || ''
    });
    await teacher.save();
    
    res.json({ success: true, message: 'Teacher created', teacher: { _id: teacher._id, fullName, email } });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete teacher
app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  try {
    const teacher = await TeacherProfile.findById(req.params.id);
    if (teacher) {
      await User.findByIdAndDelete(teacher.userId);
      await TeacherProfile.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().populate('teacherId', 'fullName');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create class
app.post('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    const { className, grade, academicYear, teacherId } = req.body;
    const newClass = new Class({ className, grade, academicYear, teacherId: teacherId || null });
    await newClass.save();
    res.json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete class
app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all news
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create news
app.post('/api/academic-admin/news', authMiddleware, async (req, res) => {
  try {
    const { title, summary, content, image, category } = req.body;
    const news = new News({ title, summary, content, image, category });
    await news.save();
    res.json({ success: true, news });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete news
app.delete('/api/academic-admin/news/:id', authMiddleware, async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get gallery
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  try {
    const images = await Gallery.find().sort({ date: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add gallery image
app.post('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  try {
    const { title, image, category } = req.body;
    const gallery = new Gallery({ title, image, category });
    await gallery.save();
    res.json({ success: true, gallery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete gallery image
app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ROUTES ====================
app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.userId });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/teacher/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.userId });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/create-student', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, password, studentId, classId, parentName, parentPhone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword, role: 'student', createdBy: req.userId });
    await user.save();
    
    const student = new Student({
      userId: user._id,
      studentId: studentId || `STU${Date.now()}`,
      fullName,
      email,
      classId,
      teacherId: req.userId,
      parentName: parentName || '',
      parentPhone: parentPhone || ''
    });
    await student.save();
    
    await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    
    res.json({ success: true, student: { _id: student._id, fullName, email, password } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/teacher/students/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
      await User.findByIdAndDelete(student.userId);
      await Student.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/students/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const student = await Student.findById(req.params.id);
    if (student) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(student.userId, { password: hashedPassword });
    }
    res.json({ success: true, newPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== MESSAGE ROUTES ====================
app.get('/api/messages/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId }, isActive: true }).select('fullName email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/messages/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.userId, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/messages/user/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId }
      ]
    }).sort({ createdAt: 1 });
    
    await Message.updateMany({ senderId: req.params.userId, receiverId: req.userId, isRead: false }, { $set: { isRead: true } });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== CREATE DEFAULT SUPER ADMIN ====================
const createDefaultSuperAdmin = async () => {
  try {
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
    } else {
      console.log('✅ Super Admin already exists');
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
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