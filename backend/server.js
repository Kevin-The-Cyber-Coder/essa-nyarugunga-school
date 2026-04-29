const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
    socket.emit('messageSent', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

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
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  qualification: String,
  experience: Number
});

const classSchema = new mongoose.Schema({
  className: String,
  grade: String,
  academicYear: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrollmentDate: Date
});

const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  audience: [String],
  priority: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
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
  }]
});

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  date: Date,
  status: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const permissionSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requesterName: String,
  requesterRole: String,
  type: String,
  reason: String,
  fromDate: Date,
  toDate: Date,
  status: { type: String, default: 'pending' }
});
// Add these schemas to your server.js

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['quiz', 'assignment', 'exam', 'project'], default: 'assignment' },
  totalPoints: { type: Number, default: 100 },
  dueDate: Date,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  questions: [{
    questionText: String,
    questionType: { type: String, enum: ['multiple_choice', 'essay', 'file', 'code'] },
    points: Number,
    options: [String]
  }],
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    submittedAt: { type: Date, default: Date.now },
    answers: mongoose.Schema.Types.Mixed,
    attachments: [{
      fileName: String,
      fileUrl: String
    }],
    score: Number,
    feedback: String,
    status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const parentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  phone: String,
  occupation: String,
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
const Parent = mongoose.model('Parent', parentSchema);

const disciplineSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  incidentDate: Date,
  category: String,
  description: String,
  status: { type: String, default: 'pending' }
});

const pageContentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  title: String,
  content: String,
  heroImage: String,
  sections: mongoose.Schema.Types.Mixed,
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
const Announcement = mongoose.model('Announcement', announcementSchema);
const News = mongoose.model('News', newsSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Permission = mongoose.model('Permission', permissionSchema);
const Discipline = mongoose.model('Discipline', disciplineSchema);
const PageContent = mongoose.model('PageContent', pageContentSchema);
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
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (user.role !== role) return res.status(401).json({ message: 'Invalid role selected' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );
    
    res.json({ success: true, _id: user._id, fullName: user.fullName, email: user.email, role: user.role, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SUPER ADMIN ROUTES ====================
app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  const currentUser = await User.findById(req.userId);
  if (currentUser.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  
  const { fullName, email, password, phone, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email already exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
  const newAdmin = new User({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
  await newAdmin.save();
  res.json({ success: true, message: `${role} created`, user: { _id: newAdmin._id, fullName, email, role } });
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

app.post('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  const { title, content, audience, priority } = req.body;
  const announcement = new Announcement({ title, content, audience: audience || ['all'], priority: priority || 'normal', createdBy: req.userId });
  await announcement.save();
  res.json({ success: true, announcement });
});

app.get('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50);
  res.json(announcements);
});

app.delete('/api/super-admin/announcements/:id', authMiddleware, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ACADEMIC ADMIN ROUTES ====================

// Get all teachers
app.get('/api/academic-admin/teachers', authMiddleware, async (req, res) => {
  const teachers = await User.find({ role: 'teacher' }).select('-password');
  res.json(teachers);
});

// Create teacher
app.post('/api/academic-admin/create-teacher', authMiddleware, async (req, res) => {
  const { fullName, email, password, phone, subject } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email already exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
  const teacher = new User({ fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '', createdBy: req.userId });
  await teacher.save();
  await TeacherProfile.create({ user: teacher._id, subject: subject || 'General' });
  
  res.json({ success: true, message: 'Teacher created', teacher: { _id: teacher._id, fullName, email } });
});

// Delete teacher
app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await TeacherProfile.findOneAndDelete({ user: req.params.id });
  res.json({ success: true });
});

// Get all classes
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  const classes = await Class.find().populate('teacher', 'fullName');
  res.json(classes);
});

// Create class
app.post('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  const { className, grade, academicYear, teacherId } = req.body;
  const newClass = new Class({ className, grade, academicYear, teacher: teacherId || null });
  await newClass.save();
  res.json({ success: true, class: newClass });
});

// Delete class
app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Get all news/events
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  const news = await News.find().sort({ createdAt: -1 });
  res.json(news);
});

// Create news/event
app.post('/api/academic-admin/news', authMiddleware, async (req, res) => {
  const { title, summary, content, image, category, date } = req.body;
  const news = new News({ title, summary, content, image, category, date: date || new Date() });
  await news.save();
  res.json({ success: true, news });
});

// Delete news/event
app.delete('/api/academic-admin/news/:id', authMiddleware, async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Get gallery
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  const images = await Gallery.find().sort({ date: -1 });
  res.json(images);
});

// Add gallery image
app.post('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  const { title, image, category } = req.body;
  const gallery = new Gallery({ title, image, category, date: new Date() });
  await gallery.save();
  res.json({ success: true, gallery });
});

// Delete gallery image
app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Get/Update page content
app.get('/api/academic-admin/content/:page', authMiddleware, async (req, res) => {
  let content = await PageContent.findOne({ page: req.params.page });
  if (!content) content = { page: req.params.page, title: '', content: '' };
  res.json(content);
});

app.put('/api/academic-admin/content/:page', authMiddleware, async (req, res) => {
  const { title, content, heroImage } = req.body;
  const updated = await PageContent.findOneAndUpdate(
    { page: req.params.page },
    { title, content, heroImage, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ success: true, content: updated });
});

// ==================== MESSAGE ROUTES ====================

// Get all users for chat
app.get('/api/messages/users', authMiddleware, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.userId }, isActive: true }).select('fullName email role');
  res.json(users);
});

// Get conversations
app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  const conversations = await Message.aggregate([
    { $match: { $or: [{ senderId: req.userId }, { receiverId: req.userId }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
        _id: { $cond: [{ $eq: ['$senderId', req.userId] }, '$receiverId', '$senderId'] },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', req.userId] }, { $eq: ['$isRead', false] }] }, 1, 0] } }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } }
  ]);
  
  const result = await Promise.all(conversations.map(async (conv) => {
    const user = await User.findById(conv._id).select('fullName email role');
    return { userId: conv._id, user, lastMessage: conv.lastMessage, unreadCount: conv.unreadCount };
  }));
  
  res.json(result);
});

// Get messages with specific user
app.get('/api/messages/user/:userId', authMiddleware, async (req, res) => {
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
});

// Send message
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
  
  const io = req.app.get('io');
  io.to(receiverId).emit('newMessage', message);
  
  res.json({ success: true, message });
});

// Get unread count
app.get('/api/messages/unread/count', authMiddleware, async (req, res) => {
  const count = await Message.countDocuments({ receiverId: req.userId, isRead: false });
  res.json({ count });
});
// ==================== ADD THESE MISSING TEACHER ROUTES ====================

// Get teacher's classes
app.get('/api/teacher/classes', authMiddleware, async (req, res) => {
  try {
    // Check if user is teacher
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get classes where teacherId matches
    const teacherClasses = await Class.find({ teacherId: req.userId });
    res.json(teacherClasses);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create class
app.post('/api/teacher/classes', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { className, grade, academicYear } = req.body;
    const newClass = new Class({
      className,
      grade,
      academicYear,
      teacherId: req.userId,
      students: []
    });
    
    await newClass.save();
    res.json({ success: true, message: 'Class created', class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get teacher's students
app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all students where teacherId matches
    const teacherStudents = await Student.find({ teacherId: req.userId }).populate('userId', 'fullName email');
    res.json(teacherStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create student
app.post('/api/teacher/create-student', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { fullName, email, password, studentId, classId } = req.body;
    
    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create user account for student
    const hashedPassword = await bcrypt.hash(password || 'student123', 10);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'student',
      isActive: true,
      createdBy: req.userId
    });
    await newUser.save();
    
    // Create student profile
    const newStudent = new Student({
      userId: newUser._id,
      studentId: studentId || `STU${Date.now()}`,
      classId,
      teacherId: req.userId,
      enrollmentDate: new Date()
    });
    await newStudent.save();
    
    // Add student to class
    await Class.findByIdAndUpdate(classId, { $push: { students: newStudent._id } });
    
    res.json({
      success: true,
      message: 'Student created',
      student: {
        _id: newStudent._id,
        studentId: newStudent.studentId,
        fullName: newUser.fullName,
        email: newUser.email,
        password: password || 'student123'
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete student
app.delete('/api/teacher/students/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Remove from class
    await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    
    // Delete user account
    await User.findByIdAndDelete(student.userId);
    
    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset student password
app.post('/api/teacher/students/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { newPassword } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword || 'student123', 10);
    await User.findByIdAndUpdate(student.userId, { password: hashedPassword });
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get teacher's assignments
app.get('/api/teacher/assignments', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const assignments = await Assignment.find({ teacherId: req.userId });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create assignment
app.post('/api/teacher/assignments', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { title, description, subject, classId, dueDate, totalPoints } = req.body;
    
    const newAssignment = new Assignment({
      title,
      description,
      subject,
      classId,
      teacherId: req.userId,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints || 100
    });
    
    await newAssignment.save();
    res.json({ success: true, message: 'Assignment created', assignment: newAssignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance
app.post('/api/teacher/attendance', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { classId, date, records } = req.body;
    
    for (const record of records) {
      await Attendance.findOneAndUpdate(
        { studentId: record.studentId, date: new Date(date) },
        { 
          classId, 
          status: record.status, 
          teacherId: req.userId,
          date: new Date(date)
        },
        { upsert: true, new: true }
      );
    }
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Request permission
app.post('/api/teacher/permissions', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { type, reason, fromDate, toDate } = req.body;
    const user = await User.findById(req.userId);
    
    const permission = new Permission({
      requesterId: req.userId,
      requesterName: user.fullName,
      requesterRole: user.role,
      type,
      reason,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      status: 'pending'
    });
    
    await permission.save();
    res.json({ success: true, message: 'Permission request submitted' });
  } catch (error) {
    console.error('Error requesting permission:', error);
    res.status(500).json({ message: error.message });
  }
});

// Report discipline
app.post('/api/teacher/discipline', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { studentId, category, description, incidentDate } = req.body;
    
    const discipline = new Discipline({
      studentId,
      reportedBy: req.userId,
      incidentDate: new Date(incidentDate),
      category,
      description,
      status: 'pending'
    });
    
    await discipline.save();
    res.json({ success: true, message: 'Discipline case reported' });
  } catch (error) {
    console.error('Error reporting discipline:', error);
    res.status(500).json({ message: error.message });
  }
});
// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Create default super admin
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ role: 'super_admin' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      fullName: 'Super Administrator',
      email: 'admin@essa.rw',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true
    });
    console.log('\n✅ Super Admin created!');
    console.log('📧 Email: admin@essa.rw');
    console.log('🔑 Password: admin123\n');
  }
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Socket.IO server ready`);
  await createDefaultAdmin();
});