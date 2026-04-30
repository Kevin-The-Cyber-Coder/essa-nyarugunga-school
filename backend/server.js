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

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// ==================== MODELS ====================

// User Schema
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

// Teacher Profile Schema
const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  subject: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

// Student Schema
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

// Class Schema
const classSchema = new mongoose.Schema({
  className: String,
  grade: { type: String, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  academicYear: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

// Grade Schema
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

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: Date,
  status: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { type: [String], default: ['all'] },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Page Schema for website content
const pageSchema = new mongoose.Schema({
  pageName: { type: String, required: true, unique: true },
  title: String,
  content: String,
  heroImage: String,
  updatedAt: { type: Date, default: Date.now }
});

// Message Schema
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

// Models
const User = mongoose.model('User', userSchema);
const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
const Student = mongoose.model('Student', studentSchema);
const Class = mongoose.model('Class', classSchema);
const Grade = mongoose.model('Grade', gradeSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const Page = mongoose.model('Page', pageSchema);
const Message = mongoose.model('Message', messageSchema);

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

// ==================== ACADEMIC ADMIN ROUTES ====================

// Get website pages
app.get('/api/academic-admin/pages', authMiddleware, async (req, res) => {
  try {
    const pages = await Page.find();
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update page content
app.put('/api/academic-admin/pages/:pageName', authMiddleware, async (req, res) => {
  try {
    const { title, content, heroImage } = req.body;
    const page = await Page.findOneAndUpdate(
      { pageName: req.params.pageName },
      { title, content, heroImage, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teachers list
app.get('/api/academic-admin/teachers-list', authMiddleware, async (req, res) => {
  try {
    const teachers = await TeacherProfile.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create teacher credentials
app.post('/api/academic-admin/create-teacher-credentials', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, password, phone, subject } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
    const user = new User({
      fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '',
      createdBy: req.userId, isActive: true
    });
    await user.save();
    
    const teacher = new TeacherProfile({
      userId: user._id, fullName, email, subject: subject || 'General', phone: phone || ''
    });
    await teacher.save();
    
    res.json({
      success: true,
      message: 'Teacher created successfully',
      teacher: { _id: teacher._id, fullName, email, password: password || 'teacher123' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update teacher
app.put('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, subject } = req.body;
    const teacher = await TeacherProfile.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    teacher.fullName = fullName;
    teacher.email = email;
    teacher.subject = subject;
    teacher.phone = phone;
    await teacher.save();
    
    await User.findByIdAndUpdate(teacher.userId, { fullName, email, phone });
    res.json({ success: true, message: 'Teacher updated successfully' });
  } catch (error) {
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

// Get students performance
app.get('/api/academic-admin/students-performance', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'fullName email');
    const performance = [];
    for (const student of students) {
      const grades = await Grade.find({ studentId: student._id });
      const avgScore = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0;
      const classInfo = await Class.findById(student.classId);
      performance.push({
        studentId: student.studentId,
        name: student.fullName,
        email: student.email,
        class: classInfo ? `${classInfo.grade} ${classInfo.className}` : 'Not Assigned',
        averageScore: avgScore.toFixed(1),
        totalGrades: grades.length
      });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get class performance
app.get('/api/academic-admin/class-performance', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().populate('teacherId', 'fullName');
    const performance = [];
    for (const classItem of classes) {
      const students = await Student.find({ classId: classItem._id });
      let totalAvg = 0;
      for (const student of students) {
        const grades = await Grade.find({ studentId: student._id });
        const avg = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0;
        totalAvg += avg;
      }
      const classAvg = students.length > 0 ? (totalAvg / students.length).toFixed(1) : 0;
      performance.push({
        className: `${classItem.grade} ${classItem.className}`,
        teacher: classItem.teacherId?.fullName || 'Not Assigned',
        studentCount: students.length,
        averageScore: classAvg,
        academicYear: classItem.academicYear
      });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get announcements
app.get('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
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
    
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
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

// ==================== CREATE DEFAULT PAGES ====================
const createDefaultPages = async () => {
  const pages = ['home', 'about', 'academics', 'admissions'];
  for (const pageName of pages) {
    const existing = await Page.findOne({ pageName });
    if (!existing) {
      await Page.create({
        pageName,
        title: `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} Page`,
        content: `Welcome to the ${pageName} page of ESSA Nyarugunga School.`,
        heroImage: ''
      });
      console.log(`✅ Created ${pageName} page`);
    }
  }
};

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
  
  // Create sample class if none exists
  const classCount = await Class.countDocuments();
  if (classCount === 0) {
    await Class.create({
      className: 'A',
      grade: 'S4',
      academicYear: '2026',
      teacherId: null
    });
    console.log('✅ Sample class created');
  }
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

const init = async () => {
  await createDefaultSuperAdmin();
  await createDefaultPages();
  
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login Credentials:`);
    console.log(`Super Admin: admin@essa.rw / admin123`);
    console.log(`\n💡 Create Academic Admin through Super Admin dashboard\n`);
  });
};

init();