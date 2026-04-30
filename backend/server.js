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

// Import Models
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const Assignment = require('./models/Assignment');
const Attendance = require('./models/Attendance');
const News = require('./models/News');
const Message = require('./models/Message');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
  });
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.fullName }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

app.delete('/api/super-admin/admins/:id', authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ACADEMIC ADMIN ROUTES ====================
app.get('/api/academic-admin/teachers', authMiddleware, async (req, res) => {
  const teachers = await Teacher.find().populate('userId', 'fullName email phone isActive');
  res.json(teachers);
});

app.post('/api/academic-admin/create-teacher', authMiddleware, async (req, res) => {
  const { fullName, email, password, phone, subject } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
  const user = new User({ fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '', createdBy: req.userId });
  await user.save();
  
  const teacher = new Teacher({ userId: user._id, teacherId: `TCH${Date.now()}`, fullName, email, subject: subject || 'General', phone: phone || '' });
  await teacher.save();
  
  res.json({ success: true, teacher: { _id: teacher._id, fullName, email } });
});

app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (teacher) {
    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true });
});

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

app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

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
  
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ fullName, email, password: hashedPassword, role: 'student', createdBy: req.userId });
  await user.save();
  
  const student = new Student({ userId: user._id, studentId: studentId || `STU${Date.now()}`, fullName, email, classId, teacherId: req.userId, parentName, parentPhone });
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

app.post('/api/teacher/assignments', authMiddleware, async (req, res) => {
  const { title, description, subject, classId, dueDate, totalPoints } = req.body;
  const assignment = new Assignment({ title, description, subject, classId, teacherId: req.userId, dueDate, totalPoints: totalPoints || 100 });
  await assignment.save();
  res.json({ success: true, assignment });
});

app.get('/api/teacher/assignments', authMiddleware, async (req, res) => {
  const assignments = await Assignment.find({ teacherId: req.userId });
  res.json(assignments);
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

app.get('/api/teacher/attendance', authMiddleware, async (req, res) => {
  const attendance = await Attendance.find({ teacherId: req.userId });
  res.json(attendance);
});

// ==================== STUDENT ROUTES ====================
app.get('/api/student/dashboard', authMiddleware, async (req, res) => {
  const student = await Student.findOne({ userId: req.userId }).populate('userId', 'fullName email');
  const assignments = await Assignment.find({ classId: student.classId });
  const attendance = await Attendance.find({ studentId: student._id });
  res.json({ student, assignments, attendance });
});

// ==================== PARENT ROUTES ====================
app.get('/api/parent/children', authMiddleware, async (req, res) => {
  const children = await Student.find({ parentId: req.userId }).populate('userId', 'fullName email');
  res.json(children);
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

// ==================== CREATE DEFAULT SUPER ADMIN ====================
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
createDefaultSuperAdmin().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login: admin@essa.rw / admin123\n`);
  });
});