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
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['super_admin', 'academic_admin', 'discipline_admin', 'accounts_admin', 'teacher', 'student', 'parent'] },
  phone: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
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

// Discipline Case Schema
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

// Permission Schema
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
const Announcement = mongoose.model('Announcement', announcementSchema);
const Discipline = mongoose.model('Discipline', disciplineSchema);
const Permission = mongoose.model('Permission', permissionSchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
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

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.role !== role) {
      console.log('Role mismatch:', { expected: role, actual: user.role });
      return res.status(401).json({ message: 'Invalid role' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful:', email);
    res.json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== SUPER ADMIN ROUTES ====================

// Create sub-admin
app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied. Super admin only.' });
    }
    
    const { fullName, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const newAdmin = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      phone: phone || '',
      createdBy: req.userId,
      isActive: true
    });
    await newAdmin.save();
    
    res.json({
      success: true,
      message: `${role} created successfully`,
      user: { _id: newAdmin._id, fullName, email, role }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all admins
app.get('/api/super-admin/admins', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const admins = await User.find({
      role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] }
    }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete admin
app.delete('/api/super-admin/admins/:id', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement
app.post('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  try {
    const { title, content, audience, priority } = req.body;
    const announcement = new Announcement({
      title,
      content,
      audience: audience || ['all'],
      priority: priority || 'normal',
      createdBy: req.userId
    });
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all announcements
app.get('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete announcement
app.delete('/api/super-admin/announcements/:id', authMiddleware, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discipline cases
app.get('/api/super-admin/discipline-cases', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update discipline case
app.put('/api/super-admin/discipline-cases/:id', authMiddleware, async (req, res) => {
  try {
    const { action, actionDetails, status } = req.body;
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
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get permissions
app.get('/api/super-admin/permissions', authMiddleware, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update permission
app.put('/api/super-admin/permissions/:id', authMiddleware, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }
    
    permission.status = status;
    permission.reviewedBy = req.userId;
    permission.reviewedAt = new Date();
    if (rejectionReason) permission.rejectionReason = rejectionReason;
    await permission.save();
    
    res.json({ success: true });
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
    
    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const message = new Message({
      senderId: req.userId,
      senderName: sender.fullName,
      senderRole: sender.role,
      receiverId,
      receiverName: receiver.fullName,
      receiverRole: receiver.role,
      content
    });
    await message.save();
    
    io.to(receiverId).emit('newMessage', message);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

createDefaultSuperAdmin().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login: admin@essa.rw / admin123\n`);
  });
});