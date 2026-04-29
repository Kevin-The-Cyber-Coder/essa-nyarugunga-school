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
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Make io accessible
app.set('io', io);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// ==================== MONGODB CONNECTION ====================
mongoose.connect('mongodb://127.0.0.1:27017/essa_school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ==================== SCHEMAS ====================
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  qualification: String,
  experience: Number
});

const classSchema = new mongoose.Schema({
  className: String,
  grade: String,
  academicYear: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentName: String,
  parentPhone: String,
  parentOccupation: String,
  enrollmentDate: Date
});

const newsSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  image: String,
  category: { type: String, enum: ['news', 'event', 'announcement'] },
  date: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const gallerySchema = new mongoose.Schema({
  title: String,
  image: String,
  category: String,
  date: Date,
  isActive: { type: Boolean, default: true }
});

const pageContentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  title: String,
  content: String,
  heroImage: String,
  updatedAt: { type: Date, default: Date.now }
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
const Class = mongoose.model('Class', classSchema);
const Student = mongoose.model('Student', studentSchema);
const News = mongoose.model('News', newsSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const PageContent = mongoose.model('PageContent', pageContentSchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userName = decoded.name;
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
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.fullName }, 'secretkey', { expiresIn: '7d' });
    res.json({ success: true, _id: user._id, fullName: user.fullName, email: user.email, role: user.role, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ACADEMIC ADMIN ROUTES ====================

// Get all teachers
app.get('/api/academic-admin/teachers', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create teacher
app.post('/api/academic-admin/create-teacher', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { fullName, email, password, phone, subject } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
    const teacher = new User({
      fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '',
      createdBy: req.userId, isActive: true
    });
    await teacher.save();
    
    await TeacherProfile.create({ userId: teacher._id, subject: subject || 'General' });
    
    res.json({ success: true, message: 'Teacher created', teacher: { _id: teacher._id, fullName, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete teacher
app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') return res.status(403).json({ message: 'Access denied' });
    await User.findByIdAndDelete(req.params.id);
    await TeacherProfile.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') return res.status(403).json({ message: 'Access denied' });
    const classes = await Class.find().populate('teacherId', 'fullName');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create class
app.post('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') return res.status(403).json({ message: 'Access denied' });
    const { className, grade, academicYear, teacherId } = req.body;
    const newClass = new Class({ className, grade, academicYear, teacherId: teacherId || null });
    await newClass.save();
    res.json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign teacher to class
app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') return res.status(403).json({ message: 'Access denied' });
    
    const { teacherId } = req.body;
    const classItem = await Class.findById(req.params.classId);
    if (!classItem) return res.status(404).json({ message: 'Class not found' });
    
    classItem.teacherId = teacherId;
    await classItem.save();
    
    const teacher = await User.findById(teacherId).select('fullName');
    res.json({ success: true, message: 'Teacher assigned', class: { ...classItem.toObject(), teacherId: teacher } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete class
app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'academic_admin') return res.status(403).json({ message: 'Access denied' });
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
    const news = new News({
      title, summary, content, image, category,
      date: new Date(), isActive: true
    });
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
    const gallery = new Gallery({ title, image, category, date: new Date() });
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

// Get page content
app.get('/api/academic-admin/content/:page', authMiddleware, async (req, res) => {
  try {
    let content = await PageContent.findOne({ page: req.params.page });
    if (!content) content = { page: req.params.page, title: '', content: '' };
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update page content
app.put('/api/academic-admin/content/:page', authMiddleware, async (req, res) => {
  try {
    const { title, content, heroImage } = req.body;
    const updated = await PageContent.findOneAndUpdate(
      { page: req.params.page },
      { title, content, heroImage, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, content: updated });
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
      content, isRead: false
    });
    await message.save();
    
    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', message);
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== CREATE DEFAULT USERS ====================
const createDefaultUsers = async () => {
  // Create Super Admin
  const superAdminExists = await User.findOne({ email: 'admin@essa.rw' });
  if (!superAdminExists) {
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

  // Create Academic Admin
  const academicAdminExists = await User.findOne({ email: 'academic@essa.rw' });
  if (!academicAdminExists) {
    const hashedPassword = await bcrypt.hash('academic123', 10);
    await User.create({
      fullName: 'Academic Admin',
      email: 'academic@essa.rw',
      password: hashedPassword,
      role: 'academic_admin',
      phone: '+250788123457',
      isActive: true
    });
    console.log('✅ Academic Admin created: academic@essa.rw / academic123');
  }

  // Create sample classes
  const classCount = await Class.countDocuments();
  if (classCount === 0) {
    await Class.create([
      { className: 'A', grade: 'S4', academicYear: '2026', teacherId: null },
      { className: 'B', grade: 'S5', academicYear: '2026', teacherId: null }
    ]);
    console.log('✅ Sample classes created');
  }

  // Create sample news
  const newsCount = await News.countDocuments();
  if (newsCount === 0) {
    await News.create([
      { title: 'New Academic Year', summary: 'The 2026 academic year has started', category: 'announcement', date: new Date() },
      { title: 'Science Fair', summary: 'Annual science fair coming soon', category: 'event', date: new Date() }
    ]);
    console.log('✅ Sample news created');
  }

  // Create sample gallery
  const galleryCount = await Gallery.countDocuments();
  if (galleryCount === 0) {
    await Gallery.create([
      { title: 'Campus View', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop', category: 'academic' },
      { title: 'Sports Day', image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=250&fit=crop', category: 'sports' }
    ]);
    console.log('✅ Sample gallery created');
  }
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ==================== START SERVER ====================
const PORT = 5000;
createDefaultUsers().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Socket.IO ready`);
    console.log(`\n📋 Login Credentials:`);
    console.log(`Super Admin: admin@essa.rw / admin123`);
    console.log(`Academic Admin: academic@essa.rw / academic123\n`);
  });
});