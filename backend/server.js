// ==================== LOAD ENVIRONMENT VARIABLES ====================
const dotenv = require('dotenv');
dotenv.config();

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

app.use(cors());
app.use(express.json());

// ==================== EMAIL CONFIGURATION ====================
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'kevineniyomurinzi@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// ==================== MODELS ====================

// User Schema
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

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  subject: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  totalPoints: Number,
  fileUrl: String,
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedAt: Date,
    content: String,
    score: Number,
    feedback: String,
    status: { type: String, default: 'pending' }
  }],
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

// Discipline Schema
const disciplineSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  className: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: String,
  category: String,
  description: String,
  action: String,
  actionDetails: String,
  status: { type: String, default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Permission Schema
const permissionSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requesterName: String,
  requesterRole: String,
  type: String,
  reason: String,
  fromDate: Date,
  toDate: Date,
  status: { type: String, default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  audience: [String],
  priority: { type: String, default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// News Schema
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: String,
  image: String,
  category: { type: String, default: 'news' },
  tags: [String],
  author: String,
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Gallery Schema
const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'events' },
  description: String,
  photographer: { type: String, default: 'School Media Team' },
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
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

// Admission Application Schema
const admissionApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  nationality: { type: String, default: 'Rwandan' },
  nationalId: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  level: { type: String, required: true },
  previousSchool: { type: String, required: true },
  lastAverage: { type: Number, required: true },
  achievements: { type: String, default: '' },
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  parentEmail: { type: String, default: '' },
  parentOccupation: { type: String, default: '' },
  applyScholarship: { type: Boolean, default: false },
  reportCardUrl: { type: String, default: '' },
  birthCertUrl: { type: String, default: '' },
  studentPhotoUrl: { type: String, default: '' },
  applicationNumber: { type: String, unique: true },
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'accepted', 'rejected', 'waitlisted'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String, default: '' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Contact Message Schema
const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: String,
  message: { type: String, required: true },
  status: { type: String, default: 'unread' },
  createdAt: { type: Date, default: Date.now }
});

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now }
});

// Fee Structure Schema
const feeStructureSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  feeType: String,
  amount: Number,
  dueDate: Date,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

// Fee Payment Schema
const feePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  amount: Number,
  feeType: String,
  paymentDate: Date,
  receiptNo: String,
  status: { type: String, default: 'completed' }
});

// Salary Schema
const salarySchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: String,
  subject: String,
  amount: Number,
  month: String,
  year: Number,
  status: { type: String, default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

// Income Schema
const incomeSchema = new mongoose.Schema({
  source: String,
  amount: Number,
  date: Date,
  description: String,
  reference: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
  category: String,
  amount: Number,
  date: Date,
  description: String,
  reference: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Register models
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
const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);
const Salary = mongoose.model('Salary', salarySchema);
const Budget = mongoose.model('Budget', budgetSchema);
const Income = mongoose.model('Income', incomeSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('join', (userId) => {
    if (userId) socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
  });
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

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

// ==================== SEEDING SYSTEM ====================
const seedDatabase = async () => {
  try {
    console.log('\n🌱 Seeding database...');
    
    // Clear existing data
    await User.deleteMany({});
    await TeacherProfile.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Announcement.deleteMany({});
    await News.deleteMany({});
    await Gallery.deleteMany({});
    await AdmissionApplication.deleteMany({});
    await Contact.deleteMany({});
    await Subscription.deleteMany({});
    
    // Create Super Admin (Head Master)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      fullName: 'Head Master',
      email: 'admin@essa.rw',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true,
      createdAt: new Date()
    });
    console.log('✅ Super Admin created: admin@essa.rw / admin123');
    
    // Create sample announcements
    await Announcement.create([
      { title: 'Welcome to 2026 Academic Year', content: 'We are excited to welcome all students back for the 2026 academic year.', audience: ['all'], priority: 'high', createdBy: superAdmin._id },
      { title: 'Parent-Teacher Conference', content: 'Parent-teacher conference will be held on May 20, 2026.', audience: ['parents'], priority: 'normal', createdBy: superAdmin._id }
    ]);
    
    // Create sample news
    await News.create([
      { title: 'ESSA Nyarugunga Wins Science Competition', summary: 'Our students won first place in the National Science Fair.', category: 'achievement', author: 'Science Department', isPublished: true },
      { title: 'New Computer Laboratory Opens', summary: 'State-of-the-art computer lab with 50 new computers.', category: 'announcement', author: 'ICT Department', isPublished: true }
    ]);
    
    // Create sample gallery
    await Gallery.create([
      { title: 'Graduation Ceremony 2025', image: 'https://via.placeholder.com/500x350', category: 'events', description: 'S6 graduation ceremony', isPublished: true },
      { title: 'Sports Day', image: 'https://via.placeholder.com/500x350', category: 'sports', description: 'Annual sports day', isPublished: true }
    ]);
    
    console.log('✅ Sample data created');
    console.log('\n🎉 Seeding completed!');
    
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essa_school';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(async () => {
  console.log('✅ MongoDB Connected');
  
  // Check if should seed
  const shouldSeed = process.argv.includes('--seed') || process.env.SEED_DB === 'true';
  const userCount = await User.countDocuments();
  
  if (shouldSeed || userCount === 0) {
    await seedDatabase();
  }
  
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login Credentials:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 SUPER ADMIN (Head Master):');
    console.log('   Email: admin@essa.rw');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
})
.catch(err => {
  console.error('MongoDB Connection Error:', err.message);
  process.exit(1);
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

// ==================== CONTACT ROUTES ====================
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;
    
    // Save to database
    const contact = new Contact({ fullName, email, phone, subject, message });
    await contact.save();
    
    // Send email to super admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'admin@essa.rw',
      subject: `📬 New Contact Message from ${fullName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all contacts (admin only)
app.get('/api/admin/contacts', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.json(contacts);
});

// ==================== SUBSCRIPTION ROUTES ====================
app.post('/api/subscriptions/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    let subscription = await Subscription.findOne({ email });
    
    if (subscription) {
      if (!subscription.isActive) {
        subscription.isActive = true;
        await subscription.save();
        return res.json({ success: true, message: 'Subscribed successfully!' });
      }
      return res.json({ success: true, message: 'Already subscribed!' });
    }
    
    await Subscription.create({ email });
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NEWS ROUTES ====================
app.get('/api/news/public', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const query = { isPublished: true };
    if (category && category !== 'all') query.category = category;
    
    const news = await News.find(query).sort({ date: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'Not found' });
    news.views += 1;
    await news.save();
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin news routes
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const news = await News.find().sort({ date: -1 });
  res.json(news);
});

app.post('/api/academic-admin/news', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const news = new News({ ...req.body, author: req.userName });
  await news.save();
  res.json({ success: true, news });
});

app.delete('/api/academic-admin/news/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== GALLERY ROUTES ====================
app.get('/api/gallery/public', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const query = { isPublished: true };
    if (category && category !== 'all') query.category = category;
    
    const gallery = await Gallery.find(query).sort({ date: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// Admin gallery routes
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const gallery = await Gallery.find().sort({ date: -1 });
  res.json(gallery);
});

app.post('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const gallery = new Gallery(req.body);
  await gallery.save();
  res.json({ success: true, gallery });
});

app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ADMISSION ROUTES ====================
app.post('/api/admissions/submit', async (req, res) => {
  try {
    const application = new AdmissionApplication(req.body);
    await application.save();
    
    // Send email to academic admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'academic@essa.rw',
      subject: `New Admission Application: ${application.fullName}`,
      html: `<h2>New Application</h2><p>Name: ${application.fullName}</p><p>Level: ${application.level}</p><p>Email: ${application.email}</p>`
    };
    await emailTransporter.sendMail(mailOptions);
    
    res.json({ success: true, applicationNumber: application.applicationNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/academic-admin/applications', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const applications = await AdmissionApplication.find().sort({ createdAt: -1 });
  res.json(applications);
});

app.put('/api/academic-admin/applications/:id/status', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const application = await AdmissionApplication.findByIdAndUpdate(req.params.id, { status: req.body.status, reviewedAt: new Date() }, { new: true });
  res.json({ success: true, application });
});

// ==================== SUPER ADMIN ROUTES ====================
app.get('/api/super-admin/admins', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const admins = await User.find({ role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] } }).select('-password');
  res.json(admins);
});

app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  
  const { fullName, email, password, phone, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
  const newAdmin = new User({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
  await newAdmin.save();
  res.json({ success: true, user: { _id: newAdmin._id, fullName, email, role } });
});

app.delete('/api/super-admin/admins/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.post('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const announcement = new Announcement({ ...req.body, createdBy: req.userId });
  await announcement.save();
  res.json({ success: true, announcement });
});

app.get('/api/super-admin/announcements', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
});

app.delete('/api/super-admin/announcements/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Public announcements
app.get('/api/announcements', async (req, res) => {
  const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(announcements);
});

// ==================== TEACHER ROUTES ====================
app.get('/api/academic-admin/teachers-list', authMiddleware, async (req, res) => {
  const teachers = await TeacherProfile.find();
  res.json(teachers);
});

app.post('/api/academic-admin/create-teacher-credentials', authMiddleware, async (req, res) => {
  const { fullName, email, password, subject, phone } = req.body;
  
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
  const teacherUser = new User({ fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '', createdBy: req.userId });
  await teacherUser.save();
  
  const teacherProfile = new TeacherProfile({ userId: teacherUser._id, fullName, email, subject: subject || 'General', phone: phone || '' });
  await teacherProfile.save();
  
  res.json({ success: true, teacher: { _id: teacherProfile._id, fullName, email, subject, phone } });
});

app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  const teacher = await TeacherProfile.findById(req.params.id);
  if (teacher) {
    await User.findByIdAndDelete(teacher.userId);
    await TeacherProfile.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true });
});

// Teacher creates class
app.post('/api/teacher/create-class', authMiddleware, async (req, res) => {
  if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Only teachers can create classes' });
  const newClass = new Class({ ...req.body, teacherId: req.userId });
  await newClass.save();
  res.json({ success: true, class: newClass });
});

app.get('/api/teacher/classes', authMiddleware, async (req, res) => {
  const classes = await Class.find({ teacherId: req.userId });
  res.json(classes);
});

// Teacher adds student
app.post('/api/teacher/add-student', authMiddleware, async (req, res) => {
  if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  
  const { fullName, email, studentId, classId, parentName, parentPhone } = req.body;
  const hashedPassword = await bcrypt.hash('student123', 10);
  
  const studentUser = new User({ fullName, email, password: hashedPassword, role: 'student', createdBy: req.userId });
  await studentUser.save();
  
  const student = new Student({ userId: studentUser._id, studentId, fullName, email, classId, teacherId: req.userId, parentName, parentPhone });
  await student.save();
  
  await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
  
  res.json({ success: true, student, password: 'student123' });
});

app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  const students = await Student.find({ teacherId: req.userId }).populate('classId');
  res.json(students);
});

// Teacher creates assignment
app.post('/api/teacher/assignments', authMiddleware, async (req, res) => {
  if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const assignment = new Assignment({ ...req.body, teacherId: req.userId });
  await assignment.save();
  res.json({ success: true, assignment });
});

app.get('/api/teacher/assignments', authMiddleware, async (req, res) => {
  const assignments = await Assignment.find({ teacherId: req.userId }).populate('classId');
  res.json(assignments);
});

// Teacher marks attendance
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
  const attendance = await Attendance.find({ teacherId: req.userId }).populate('studentId');
  res.json(attendance);
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
    senderId: req.userId,
    senderName: sender?.fullName || 'Unknown',
    senderRole: sender?.role || 'unknown',
    receiverId,
    receiverName: receiver?.fullName || 'Unknown',
    receiverRole: receiver?.role || 'unknown',
    content
  });
  await message.save();
  
  io.to(receiverId).emit('newMessage', message);
  res.json({ success: true, message });
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});