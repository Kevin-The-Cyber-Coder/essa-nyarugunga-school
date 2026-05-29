// ==================== LOAD ENVIRONMENT VARIABLES ====================
const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== FILE UPLOAD CONFIGURATION ====================
const uploadDirs = ['./uploads', './uploads/news', './uploads/gallery', './uploads/profile'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const makeStorage = (folder, prefix) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, `uploads/${folder}/`),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${prefix}-${unique}${path.extname(file.originalname)}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadNews    = multer({ storage: makeStorage('news',    'news'),    fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadGallery = multer({ storage: makeStorage('gallery', 'gallery'), fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadProfile = multer({ storage: makeStorage('profile', 'profile'), fileFilter: imageFileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== EMAIL CONFIGURATION ====================
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

emailTransporter.verify((error) => {
  if (error) console.error('❌ Email config error:', error.message);
  else console.log('✅ Email configured for:', process.env.EMAIL_USER);
});

// ==================== SCHEMAS ====================
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  profileImage: String,
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
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
  slipGeneratedCount: { type: Number, default: 0 }, // ADD THIS LINE
  lastSlipGeneratedAt: Date, // ADD THIS LINE
  createdAt: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  audience: { type: mongoose.Schema.Types.Mixed, default: ['all'] },
  priority: { type: String, default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const newsSchema = new mongoose.Schema({
  title: String,
  summary: String,
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

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientName: { type: String, required: true },
  recipientRole: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  attachments: [String],
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String,
    lastReadAt: Date
  }],
  lastMessage: String,
  lastMessageAt: { type: Date, default: Date.now },
  subject: String,
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

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
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate application number
admissionApplicationSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model('AdmissionApplication').countDocuments();
    this.applicationNumber = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: String,
  message: { type: String, required: true },
  status: { type: String, default: 'unread' },
  createdAt: { type: Date, default: Date.now }
});

const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now }
});

const feeStructureSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  feeType: String,
  amount: Number,
  dueDate: Date,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const feePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  amount: Number,
  feeType: String,
  paymentDate: Date,
  receiptNo: String,
  status: { type: String, default: 'completed' }
});

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

const budgetSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

const incomeSchema = new mongoose.Schema({
  source: String,
  amount: Number,
  date: Date,
  description: String,
  reference: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
  category: String,
  amount: Number,
  date: Date,
  description: String,
  reference: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// ==================== REGISTER MODELS ====================
const User               = mongoose.model('User', userSchema);
const TeacherProfile     = mongoose.model('TeacherProfile', teacherProfileSchema);
const Student            = mongoose.model('Student', studentSchema);
const Class              = mongoose.model('Class', classSchema);
const Assignment         = mongoose.model('Assignment', assignmentSchema);
const Attendance         = mongoose.model('Attendance', attendanceSchema);
const Grade              = mongoose.model('Grade', gradeSchema);
const Discipline         = mongoose.model('Discipline', disciplineSchema);
const Permission         = mongoose.model('Permission', permissionSchema);
const Announcement       = mongoose.model('Announcement', announcementSchema);
const News               = mongoose.model('News', newsSchema);
const Gallery            = mongoose.model('Gallery', gallerySchema);
const Message            = mongoose.model('Message', messageSchema);
const Conversation       = mongoose.model('Conversation', conversationSchema);
const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);
const Contact            = mongoose.model('Contact', contactSchema);
const Subscription       = mongoose.model('Subscription', subscriptionSchema);
const FeeStructure       = mongoose.model('FeeStructure', feeStructureSchema);
const FeePayment         = mongoose.model('FeePayment', feePaymentSchema);
const Salary             = mongoose.model('Salary', salarySchema);
const Budget             = mongoose.model('Budget', budgetSchema);
const Income             = mongoose.model('Income', incomeSchema);
const Expense            = mongoose.model('Expense', expenseSchema);

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    req.userName = decoded.name;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) return res.status(403).json({ message: 'Access denied' });
  next();
};

// ==================== SOCKET.IO ====================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    socket.userId   = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.userId);
  socket.join(socket.userId);

  socket.on('join', (userId) => { if (userId) socket.join(userId); });
  socket.on('sendMessage', (data) => { io.to(data.receiverId).emit('newMessage', data); });
  socket.on('typing', ({ recipientId, isTyping }) => {
    socket.to(recipientId).emit('user_typing', { userId: socket.userId, isTyping });
  });
  socket.on('mark_read', ({ messageId, senderId }) => {
    socket.to(senderId).emit('message_read', { messageId });
  });
  socket.on('disconnect', () => { console.log('🔌 Disconnected:', socket.userId); });
});

// ==================== EMAIL HELPERS ====================
const sendWelcomeEmail = async (user) => {
  if (!process.env.EMAIL_USER) return;
  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Welcome to ESSA Nyarugunga Portal, ${user.fullName}!`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a3a5c,#2c5f8a);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h2>🎓 Welcome to ESSA Nyarugunga Portal</h2></div>
      <div style="background:#f5f5f5;padding:30px;border-radius:0 0 10px 10px;">
        <h3>Dear ${user.fullName},</h3>
        <p>Your account has been created successfully.</p>
        <div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #ffc107;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Password:</strong> ${user.tempPassword || 'Set by administrator'}</p>
          <p><strong>Role:</strong> ${user.role?.toUpperCase()}</p>
        </div>
        <p>Best regards,<br><strong>ESSA Nyarugunga Administration</strong></p>
      </div></div>`
  });
};

const sendNewsNotificationEmail = async (news) => {
  if (!process.env.EMAIL_USER) return;
  const subscribers = await Subscription.find({ isActive: true });
  for (const sub of subscribers) {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: sub.email,
      subject: `📰 New: ${news.title} - ESSA Nyarugunga`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a3a5c,#2c5f8a);color:white;padding:20px;text-align:center;"><h2>📢 New Update</h2></div>
        <div style="padding:20px;"><h3>${news.title}</h3><p>${news.summary}</p></div></div>`
    }).catch(console.error);
  }
};

const sendAdmissionConfirmationEmail = async (application) => {
  if (!process.env.EMAIL_USER) return;
  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: application.email,
    subject: `🎓 Admission Application Received - ESSA Nyarugunga`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a3a5c,#2c5f8a);color:white;padding:20px;text-align:center;"><h2>Application Received!</h2></div>
      <div style="padding:20px;background:#f5f5f5;">
        <h3>Dear ${application.fullName},</h3>
        <p>Application Number: <strong>${application.applicationNumber}</strong></p>
        <p>Status: Pending Review. We'll contact you within 3–5 business days.</p>
      </div></div>`
  });
};

// ==================== SEEDING ====================
const seedDatabase = async () => {
  console.log('\n🌱 Seeding database...');
  await Promise.all([
    User.deleteMany({}), TeacherProfile.deleteMany({}), Student.deleteMany({}),
    Class.deleteMany({}), Announcement.deleteMany({}), News.deleteMany({}),
    Gallery.deleteMany({}), AdmissionApplication.deleteMany({}),
    Contact.deleteMany({}), Subscription.deleteMany({})
  ]);

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await User.create({
    fullName: 'Head Master', email: 'admin@essa.rw',
    password: hashedPassword, role: 'super_admin',
    phone: '+250788123456', isActive: true
  });

  await Announcement.create([
    { title: 'Welcome to 2026 Academic Year', content: 'We are excited to welcome all students back.', audience: ['all'], priority: 'high', createdBy: superAdmin._id },
    { title: 'Parent-Teacher Conference', content: 'Scheduled for May 20, 2026.', audience: ['parents'], priority: 'normal', createdBy: superAdmin._id }
  ]);
  await News.create([
    { title: 'ESSA Wins Science Competition', summary: 'First place at the National Science Fair.', category: 'achievement', author: 'Science Dept', isPublished: true },
    { title: 'New Computer Lab Opens', summary: 'State-of-the-art lab with 50 new computers.', category: 'announcement', author: 'ICT Dept', isPublished: true }
  ]);
  await Gallery.create([
    { title: 'Graduation 2025', image: 'https://via.placeholder.com/500x350', category: 'events', isPublished: true },
    { title: 'Sports Day',      image: 'https://via.placeholder.com/500x350', category: 'sports', isPublished: true }
  ]);

  console.log('✅ Super Admin: admin@essa.rw / admin123');
  console.log('🎉 Seeding done!\n');
};

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Account is deactivated' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );
    res.json({ success: true, _id: user._id, fullName: user.fullName, email: user.email, role: user.role, profileImage: user.profileImage, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROFILE ====================
app.post('/api/user/upload-profile', authMiddleware, uploadProfile.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`;
    await User.findByIdAndUpdate(req.userId, { profileImage: imageUrl });
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { fullName, phone }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== CONTACT ====================
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;
    const contact = await Contact.create({ fullName, email, phone, subject, message });
    if (process.env.EMAIL_USER) {
      emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@essa.rw',
        subject: `📬 New Contact from ${fullName}`,
        html: `<p><b>Name:</b> ${fullName}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone || '-'}</p><p><b>Subject:</b> ${subject || '-'}</p><p><b>Message:</b> ${message}</p>`
      }).catch(console.error);
    }
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/contacts', authMiddleware, requireRole('super_admin'), async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.json(contacts);
});

// ==================== SUBSCRIPTIONS ====================
app.post('/api/subscriptions/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    let sub = await Subscription.findOne({ email });
    if (sub) {
      if (!sub.isActive) { sub.isActive = true; await sub.save(); }
      return res.json({ success: true, message: 'Subscribed successfully!' });
    }
    await Subscription.create({ email });
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/subscriptions/unsubscribe', async (req, res) => {
  try {
    await Subscription.findOneAndUpdate({ email: req.body.email }, { isActive: false });
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ANNOUNCEMENTS (FIXED) ====================
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    const formatted = announcements.map(ann => ({
      ...ann.toObject(),
      audience: Array.isArray(ann.audience) ? ann.audience[0] : (ann.audience || 'all')
    }));
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/super-admin/announcements', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    const formatted = announcements.map(ann => ({
      ...ann.toObject(),
      audience: Array.isArray(ann.audience) ? ann.audience[0] : (ann.audience || 'all')
    }));
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/super-admin/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/super-admin/announcements', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    let audience = req.body.audience;
    if (typeof audience === 'string') {
      audience = audience === 'all' ? ['all'] : [audience];
    }
    if (!audience || (Array.isArray(audience) && audience.length === 0)) {
      audience = ['all'];
    }
    
    const announcement = await Announcement.create({ 
      title: req.body.title,
      content: req.body.content,
      audience: audience,
      priority: req.body.priority || 'normal',
      createdBy: req.userId,
      isActive: true
    });
    
    res.json({ 
      success: true, 
      announcement: {
        ...announcement.toObject(),
        audience: announcement.audience[0]
      }
    });
  } catch (error) {
    console.error('POST /api/super-admin/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/super-admin/announcements/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ 
      success: true, 
      announcement: {
        ...announcement.toObject(),
        audience: Array.isArray(announcement.audience) ? announcement.audience[0] : (announcement.audience || 'all')
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/super-admin/announcements/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ==================== ANNOUNCEMENTS ====================
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    const formatted = announcements.map(ann => ({
      ...ann.toObject(),
      audience: Array.isArray(ann.audience) ? ann.audience[0] : (ann.audience || 'all')
    }));
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADD THIS - POST endpoint for announcements (for discipline admin, academic admin, etc.)
app.post('/api/announcements', authMiddleware, async (req, res) => {
  try {
    // Allow these roles to post announcements
    const allowedRoles = ['super_admin', 'academic_admin', 'discipline_admin', 'accounts_admin'];
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to post announcements.' });
    }
    
    let audience = req.body.audience;
    if (typeof audience === 'string') {
      audience = audience === 'all' ? ['all'] : [audience];
    }
    if (!audience || (Array.isArray(audience) && audience.length === 0)) {
      audience = ['all'];
    }
    
    const announcement = await Announcement.create({ 
      title: req.body.title,
      content: req.body.content,
      audience: audience,
      priority: req.body.priority || 'normal',
      createdBy: req.userId,
      isActive: true
    });
    
    res.json({ 
      success: true, 
      announcement: {
        ...announcement.toObject(),
        audience: announcement.audience[0]
      }
    });
  } catch (error) {
    console.error('POST /api/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/super-admin/announcements', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    const formatted = announcements.map(ann => ({
      ...ann.toObject(),
      audience: Array.isArray(ann.audience) ? ann.audience[0] : (ann.audience || 'all')
    }));
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/super-admin/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/super-admin/announcements', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    let audience = req.body.audience;
    if (typeof audience === 'string') {
      audience = audience === 'all' ? ['all'] : [audience];
    }
    if (!audience || (Array.isArray(audience) && audience.length === 0)) {
      audience = ['all'];
    }
    
    const announcement = await Announcement.create({ 
      title: req.body.title,
      content: req.body.content,
      audience: audience,
      priority: req.body.priority || 'normal',
      createdBy: req.userId,
      isActive: true
    });
    
    res.json({ 
      success: true, 
      announcement: {
        ...announcement.toObject(),
        audience: announcement.audience[0]
      }
    });
  } catch (error) {
    console.error('POST /api/super-admin/announcements error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/super-admin/announcements/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ 
      success: true, 
      announcement: {
        ...announcement.toObject(),
        audience: Array.isArray(announcement.audience) ? announcement.audience[0] : (announcement.audience || 'all')
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/super-admin/announcements/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== NEWS ====================
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
    const news = await News.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!news) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/academic-admin/news', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  const news = await News.find().sort({ date: -1 });
  res.json(news);
});

app.post('/api/academic-admin/news', authMiddleware, requireRole('academic_admin', 'super_admin'), uploadNews.single('image'), async (req, res) => {
  try {
    const { title, summary, content, category, tags } = req.body;
    const currentUser = await User.findById(req.userId);
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/news/${req.file.filename}` : null;
    const news = await News.create({
      title, summary, content: content || summary,
      image: imageUrl, category: category || 'news',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      author: currentUser?.fullName || 'Academic Admin',
      date: new Date(), isPublished: true
    });
    sendNewsNotificationEmail(news).catch(console.error);
    res.json({ success: true, news, imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/academic-admin/news/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json({ success: true, news });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/news/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== GALLERY ====================
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

app.get('/api/academic-admin/gallery', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  const gallery = await Gallery.find().sort({ date: -1 });
  res.json(gallery);
});

app.post('/api/academic-admin/gallery', authMiddleware, requireRole('academic_admin', 'super_admin'), uploadGallery.single('image'), async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/gallery/${req.file.filename}` : null;
    if (!imageUrl) return res.status(400).json({ message: 'Image is required' });
    const galleryItem = await Gallery.create({ title, image: imageUrl, category: category || 'events', description: description || '', isPublished: true });
    res.json({ success: true, gallery: galleryItem, imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/gallery/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ADMISSIONS ====================
app.post('/api/admissions/submit', async (req, res) => {
  try {
    const data = req.body;
    const application = await AdmissionApplication.create({
      fullName: data.fullName, dateOfBirth: new Date(data.dateOfBirth),
      nationality: data.nationality || 'Rwandan', nationalId: data.nationalId || '',
      email: data.email, phone: data.phone, address: data.address,
      level: data.level, previousSchool: data.previousSchool,
      lastAverage: parseFloat(data.lastAverage), achievements: data.achievements || '',
      parentName: data.parentName, parentPhone: data.parentPhone,
      parentEmail: data.parentEmail || '', parentOccupation: data.parentOccupation || '',
      applyScholarship: data.applyScholarship || false
    });
    sendAdmissionConfirmationEmail(application).catch(console.error);
    res.json({ success: true, message: 'Application submitted!', applicationNumber: application.applicationNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/academic-admin/applications', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  const applications = await AdmissionApplication.find().sort({ createdAt: -1 });
  res.json(applications);
});

app.put('/api/academic-admin/applications/:id/status', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  const application = await AdmissionApplication.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, reviewNotes: req.body.reviewNotes || '', reviewedAt: new Date(), reviewedBy: req.userId },
    { new: true }
  );
  res.json({ success: true, application });
});

// ==================== SUPER ADMIN ====================
app.get('/api/super-admin/admins', authMiddleware, requireRole('super_admin'), async (req, res) => {
  const admins = await User.find({ role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] } }).select('-password');
  res.json(admins);
});

app.post('/api/super-admin/create-admin', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
    const newAdmin = await User.create({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
    sendWelcomeEmail({ fullName, email, role, tempPassword: password || 'admin123' }).catch(console.error);
    res.json({ success: true, user: { _id: newAdmin._id, fullName, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/super-admin/admins/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const { fullName, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { fullName, phone, isActive }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/super-admin/admins/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Super admin dashboard stats
app.get('/api/super-admin/stats', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, pendingApplications, pendingDiscipline, pendingPermissions, totalIncome, totalExpenses] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      TeacherProfile.countDocuments(),
      Class.countDocuments(),
      AdmissionApplication.countDocuments({ status: 'pending' }),
      Discipline.countDocuments({ status: 'pending' }),
      Permission.countDocuments({ status: 'pending' }),
      Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    res.json({
      success: true,
      totalStudents, totalTeachers, totalClasses, pendingApplications,
      pendingDiscipline, pendingPermissions,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHERS ====================
app.get('/api/academic-admin/teachers-list', authMiddleware, async (req, res) => {
  const teachers = await TeacherProfile.find().sort({ fullName: 1 });
  res.json(teachers);
});

app.post('/api/academic-admin/create-teacher-credentials', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const { fullName, email, password, subject, phone } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const finalPassword = password || 'teacher123';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const teacherUser = await User.create({ fullName, email, password: hashedPassword, role: 'teacher', phone: phone || '', createdBy: req.userId });
    const teacherProfile = await TeacherProfile.create({ userId: teacherUser._id, fullName, email, subject: subject || 'General', phone: phone || '' });
    sendWelcomeEmail({ fullName, email, role: 'teacher', tempPassword: finalPassword }).catch(console.error);
    res.json({ success: true, teacher: teacherProfile, password: finalPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/academic-admin/teachers/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const { fullName, email, subject, phone } = req.body;
    const teacher = await TeacherProfile.findByIdAndUpdate(req.params.id, { fullName, email, subject, phone }, { new: true });
    if (teacher?.userId) await User.findByIdAndUpdate(teacher.userId, { fullName, email, phone });
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/teachers/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const teacher = await TeacherProfile.findById(req.params.id);
    if (teacher?.userId) await User.findByIdAndDelete(teacher.userId);
    await TeacherProfile.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== CLASSES ====================
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().lean();
    for (const cls of classes) {
      if (cls.teacherId) {
        const teacher = await TeacherProfile.findOne({ userId: cls.teacherId });
        if (teacher) cls.teacherInfo = { _id: cls.teacherId, fullName: teacher.fullName };
      }
    }
    res.json(classes);
  } catch {
    res.json([]);
  }
});

app.post('/api/academic-admin/classes', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const { className, grade, academicYear, teacherId } = req.body;
    const newClass = await Class.create({ className, grade, academicYear, teacherId: teacherId || null, students: [] });
    res.json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const classItem = await Class.findByIdAndUpdate(req.params.classId, { teacherId: req.body.teacherId }, { new: true });
    if (!classItem) return res.status(404).json({ message: 'Class not found' });
    res.json({ success: true, class: classItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/classes/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== STUDENTS ====================
app.get('/api/academic-admin/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'grade className').sort({ fullName: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/academic-admin/students', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const count = await Student.countDocuments();
    const studentId = `STU${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;
    const student = await Student.create({ ...req.body, studentId });
    if (req.body.classId) {
      await Class.findByIdAndUpdate(req.body.classId, { $addToSet: { students: student._id } });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/academic-admin/students/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/students/:id', authMiddleware, requireRole('academic_admin', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (student?.classId) await Class.findByIdAndUpdate(student.classId, { $pull: { students: student._id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PERFORMANCE ====================
app.get('/api/academic-admin/students-performance', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'grade className');
    const performanceData = students.map(s => ({
      studentId: s.studentId || `STU${s._id.toString().slice(-6)}`,
      name: s.fullName,
      class: s.classId ? `${s.classId.grade} ${s.classId.className}` : 'Not Assigned',
      averageScore: Math.floor(Math.random() * 30) + 65
    }));
    res.json(performanceData);
  } catch {
    res.json([]);
  }
});

app.get('/api/academic-admin/class-performance', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find();
    const performanceData = classes.map(cls => ({
      className: `${cls.grade} ${cls.className}`,
      studentCount: cls.students?.length || 0,
      averageScore: Math.floor(Math.random() * 25) + 70
    }));
    res.json(performanceData);
  } catch {
    res.json([]);
  }
});

// ==================== GRADES ====================
app.get('/api/teacher/grades', authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find({ teacherId: req.userId }).populate('studentId', 'fullName studentId');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/grades', authMiddleware, requireRole('teacher', 'academic_admin', 'super_admin'), async (req, res) => {
  try {
    const grade = await Grade.create({ ...req.body, teacherId: req.userId });
    res.json({ success: true, grade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/student/grades/:studentId', authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ATTENDANCE ====================
app.post('/api/teacher/attendance', authMiddleware, requireRole('teacher', 'academic_admin', 'super_admin'), async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    const bulk = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, classId, date: new Date(date) },
        update: { $set: { status: r.status, teacherId: req.userId } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(bulk);
    res.json({ success: true, message: 'Attendance saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/teacher/attendance/:classId', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { classId: req.params.classId };
    if (date) query.date = new Date(date);
    const attendance = await Attendance.find(query).populate('studentId', 'fullName studentId');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ASSIGNMENTS ====================
app.get('/api/teacher/assignments', authMiddleware, requireRole('teacher'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.userId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/assignments', authMiddleware, requireRole('teacher', 'academic_admin', 'super_admin'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, teacherId: req.userId });
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/teacher/assignments/:id', authMiddleware, requireRole('teacher', 'academic_admin', 'super_admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/teacher/assignments/:id', authMiddleware, requireRole('teacher', 'academic_admin', 'super_admin'), async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== DISCIPLINE ====================
app.get('/api/discipline-admin/cases', authMiddleware, requireRole('discipline_admin', 'super_admin'), async (req, res) => {
  try {
    const cases = await Discipline.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/discipline-admin/cases', authMiddleware, async (req, res) => {
  try {
    const disciplineCase = await Discipline.create({ ...req.body, reportedBy: req.userId, reporterName: req.userName });
    res.json({ success: true, case: disciplineCase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/discipline-admin/cases/:id', authMiddleware, requireRole('discipline_admin', 'super_admin'), async (req, res) => {
  try {
    const disciplineCase = await Discipline.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, case: disciplineCase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/discipline-admin/stats', authMiddleware, requireRole('discipline_admin', 'super_admin'), async (req, res) => {
  try {
    const [pending, resolved, total] = await Promise.all([
      Discipline.countDocuments({ status: 'pending' }),
      Discipline.countDocuments({ status: 'resolved' }),
      Discipline.countDocuments()
    ]);
    res.json({ success: true, pending, resolved, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PERMISSIONS ====================
app.get('/api/permissions', authMiddleware, async (req, res) => {
  try {
    let permissions;
    if (req.userRole === 'super_admin' || req.userRole === 'discipline_admin') {
      permissions = await Permission.find().sort({ createdAt: -1 });
    } else {
      permissions = await Permission.find({ requesterId: req.userId }).sort({ createdAt: -1 });
    }
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/permissions', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.create({
      ...req.body, requesterId: req.userId,
      requesterName: req.userName, requesterRole: req.userRole
    });
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/permissions/:id', authMiddleware, requireRole('discipline_admin', 'super_admin'), async (req, res) => {
  try {
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ==================== PERMISSIONS ====================
app.get('/api/permissions', authMiddleware, async (req, res) => {
  try {
    let permissions;
    if (req.userRole === 'super_admin' || req.userRole === 'discipline_admin') {
      permissions = await Permission.find().sort({ createdAt: -1 });
    } else {
      permissions = await Permission.find({ requesterId: req.userId }).sort({ createdAt: -1 });
    }
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/permissions', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.create({
      ...req.body, requesterId: req.userId,
      requesterName: req.userName, requesterRole: req.userRole
    });
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD THIS - Super admin can view all permissions including discipline admin requests
app.get('/api/super-admin/permissions', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FIX THIS - Allow super_admin to approve/reject permission requests
app.put('/api/permissions/:id', authMiddleware, async (req, res) => {
  try {
    // Allow super_admin OR discipline_admin to update
    if (req.userRole !== 'super_admin' && req.userRole !== 'discipline_admin') {
      return res.status(403).json({ message: 'Access denied. Only Super Admin or Discipline Admin can process permissions.' });
    }
    
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD THIS - Super admin stats include pending permissions
app.get('/api/super-admin/stats', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, pendingApplications, pendingDiscipline, pendingPermissions, totalIncome, totalExpenses] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      TeacherProfile.countDocuments(),
      Class.countDocuments(),
      AdmissionApplication.countDocuments({ status: 'pending' }),
      Discipline.countDocuments({ status: 'pending' }),
      Permission.countDocuments({ status: 'pending' }), // This counts all pending permissions including discipline admin requests
      Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    res.json({
      success: true,
      totalStudents, totalTeachers, totalClasses, pendingApplications,
      pendingDiscipline, pendingPermissions,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});// ==================== PERMISSIONS ====================
app.get('/api/permissions', authMiddleware, async (req, res) => {
  try {
    let permissions;
    if (req.userRole === 'super_admin' || req.userRole === 'discipline_admin') {
      permissions = await Permission.find().sort({ createdAt: -1 });
    } else {
      permissions = await Permission.find({ requesterId: req.userId }).sort({ createdAt: -1 });
    }
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/permissions', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.create({
      ...req.body, requesterId: req.userId,
      requesterName: req.userName, requesterRole: req.userRole
    });
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Super Admin endpoint to view all permissions
app.get('/api/super-admin/permissions', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update permission (approve/reject) - Super Admin and Discipline Admin can do this
app.put('/api/permissions/:id', authMiddleware, async (req, res) => {
  try {
    // Allow super_admin OR discipline_admin to update
    if (req.userRole !== 'super_admin' && req.userRole !== 'discipline_admin') {
      return res.status(403).json({ message: 'Access denied. Only Super Admin or Discipline Admin can process permissions.' });
    }
    
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ==================== PERMISSIONS ====================
app.get('/api/permissions', authMiddleware, async (req, res) => {
  try {
    let permissions;
    if (req.userRole === 'super_admin' || req.userRole === 'discipline_admin') {
      permissions = await Permission.find().sort({ createdAt: -1 });
    } else {
      permissions = await Permission.find({ requesterId: req.userId }).sort({ createdAt: -1 });
    }
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/permissions', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.create({
      ...req.body, requesterId: req.userId,
      requesterName: req.userName, requesterRole: req.userRole
    });
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Super Admin endpoint to view all permissions
app.get('/api/super-admin/permissions', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update permission (approve/reject) - Super Admin and Discipline Admin can do this
app.put('/api/permissions/:id', authMiddleware, async (req, res) => {
  try {
    // Allow super_admin OR discipline_admin to update
    if (req.userRole !== 'super_admin' && req.userRole !== 'discipline_admin') {
      return res.status(403).json({ message: 'Access denied. Only Super Admin or Discipline Admin can process permissions.' });
    }
    
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PERMISSION SLIP GENERATION ====================

// Generate and return permission slip HTML
app.get('/api/permissions/:id/slip', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission request not found' });
    }
    
    // Only allow if permission is approved
    if (permission.status !== 'approved') {
      return res.status(400).json({ message: 'Permission slip can only be generated for approved requests' });
    }
    
    // Get user details if needed
    const user = await User.findById(permission.requesterId);
    
    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Permission Slip - ESSA Nyarugunga</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .slip-container {
            max-width: 800px;
            width: 100%;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #0d1f33, #1a3a5c);
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          .header p {
            font-size: 12px;
            opacity: 0.8;
          }
          .content {
            padding: 30px;
          }
          .title {
            text-align: center;
            margin-bottom: 25px;
          }
          .title h2 {
            color: #1a3a5c;
            font-size: 20px;
            border-bottom: 2px solid #ffc107;
            display: inline-block;
            padding-bottom: 8px;
          }
          .info-row {
            display: flex;
            margin-bottom: 15px;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .info-label {
            width: 140px;
            font-weight: 700;
            color: #555;
            font-size: 13px;
          }
          .info-value {
            flex: 1;
            color: #333;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            background: #e8f5e9;
            color: #27ae60;
          }
          .qr-code {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
          }
          .qr-code img {
            width: 120px;
            height: 120px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 11px;
            color: #888;
            border-top: 1px solid #eee;
          }
          .signature-area {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
          }
          .signature {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 8px;
            font-size: 11px;
            color: #666;
          }
          .button-group {
            text-align: center;
            padding: 20px 30px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
          }
          .print-btn {
            background: #1a3a5c;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 0 5px;
            transition: all 0.2s;
          }
          .print-btn:hover {
            background: #0d2b42;
            transform: translateY(-1px);
          }
          .close-btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 0 5px;
            transition: all 0.2s;
          }
          .close-btn:hover {
            background: #c0392b;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .button-group {
              display: none;
            }
            .slip-container {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="slip-container">
          <div class="header">
            <h1>🎓 ESSA NYARUGUNGA</h1>
            <p>Excel in Studies, Serve in Spirit, Act in Love</p>
            <p>P.O Box 123, Kigali, Rwanda | Tel: +250 788 123 456</p>
          </div>
          <div class="content">
            <div class="title">
              <h2>📄 OFFICIAL PERMISSION SLIP</h2>
            </div>
            <div class="info-row">
              <div class="info-label">Permission Number:</div>
              <div class="info-value"><strong>#${permission._id.toString().slice(-8).toUpperCase()}</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Requester Name:</div>
              <div class="info-value"><strong>${permission.requesterName || user?.fullName || 'N/A'}</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Role:</div>
              <div class="info-value">${permission.requesterRole?.toUpperCase() || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Permission Type:</div>
              <div class="info-value">${permission.type?.toUpperCase() || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Reason:</div>
              <div class="info-value">${permission.reason || 'Not specified'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Valid From:</div>
              <div class="info-value">${new Date(permission.fromDate).toLocaleDateString('en-RW', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Valid To:</div>
              <div class="info-value">${new Date(permission.toDate).toLocaleDateString('en-RW', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Status:</div>
              <div class="info-value"><span class="status-badge">✓ APPROVED</span></div>
            </div>
            <div class="info-row">
              <div class="info-label">Approved By:</div>
              <div class="info-value">${permission.reviewedBy ? 'Administrator' : 'System'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Approved On:</div>
              <div class="info-value">${permission.reviewedAt ? new Date(permission.reviewedAt).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            ${permission.rejectionReason ? `
            <div class="info-row">
              <div class="info-label">Rejection Reason:</div>
              <div class="info-value" style="color: #e74c3c;">${permission.rejectionReason}</div>
            </div>
            ` : ''}
            <div class="qr-code">
              <div style="margin-bottom: 10px; font-size: 12px; color: #666;">Scan to Verify Authenticity</div>
              <div style="font-family: monospace; font-size: 11px; background: white; padding: 8px; border-radius: 8px; word-break: break-all;">
                ID: ${permission._id}
              </div>
            </div>
            <div class="signature-area">
              <div class="signature">
                <div class="signature-line">Student's Signature</div>
              </div>
              <div class="signature">
                <div class="signature-line">Parent's/Guardian's Signature</div>
              </div>
              <div class="signature">
                <div class="signature-line">School Stamp & Signature</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This is an electronically generated permission slip. Please present this document when requested.</p>
            <p>For any inquiries, contact the school administration office.</p>
            <p>© ${new Date().getFullYear()} ESSA Nyarugunga - All Rights Reserved</p>
          </div>
          <div class="button-group">
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="close-btn" onclick="window.close()">✖️ Close</button>
          </div>
        </div>
        <script>
          // Auto print on load (optional - uncomment if you want auto print)
          // setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;
    
    res.send(slipHtml);
  } catch (error) {
    console.error('Error generating permission slip:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate permission slip as PDF (using HTML to PDF via browser print)
app.get('/api/permissions/:id/slip-pdf', authMiddleware, async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission request not found' });
    }
    
    if (permission.status !== 'approved') {
      return res.status(400).json({ message: 'Permission slip can only be generated for approved requests' });
    }
    
    // Redirect to the HTML version which has print functionality
    // The user can then print to PDF using browser's print dialog
    res.redirect(`/api/permissions/${req.params.id}/slip`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all permissions for a specific user (including approved ones for slip generation)
app.get('/api/my-permissions', authMiddleware, async (req, res) => {
  try {
    const permissions = await Permission.find({ 
      requesterId: req.userId,
      status: 'approved'
    }).sort({ createdAt: -1 });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ==================== FEES ====================
app.get('/api/accounts/fee-structures', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  const feeStructures = await FeeStructure.find().populate('classId', 'grade className').sort({ createdAt: -1 });
  res.json(feeStructures);
});

app.post('/api/accounts/fee-structures', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const feeStructure = await FeeStructure.create(req.body);
    res.json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/accounts/fee-structures/:id', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  await FeeStructure.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get('/api/accounts/payments', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  const payments = await FeePayment.find().populate('studentId', 'fullName studentId').sort({ paymentDate: -1 });
  res.json(payments);
});

app.post('/api/accounts/payments', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const count = await FeePayment.countDocuments();
    const receiptNo = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const payment = await FeePayment.create({ ...req.body, receiptNo, paymentDate: new Date() });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SALARIES ====================
app.get('/api/accounts/salaries', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  const salaries = await Salary.find().sort({ createdAt: -1 });
  res.json(salaries);
});

app.post('/api/accounts/salaries', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const salary = await Salary.create(req.body);
    res.json({ success: true, salary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/accounts/salaries/:id/approve', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.userId, approvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, salary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== BUDGET / INCOME / EXPENSES ====================
app.get('/api/accounts/budget', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  let budget = await Budget.findOne().sort({ updatedAt: -1 });
  if (!budget) budget = { total: 0 };
  res.json(budget);
});

app.put('/api/accounts/budget', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    let budget = await Budget.findOne();
    if (budget) {
      budget.total = req.body.total; budget.updatedBy = req.userId; budget.updatedAt = new Date();
      await budget.save();
    } else {
      budget = await Budget.create({ total: req.body.total, updatedBy: req.userId });
    }
    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/accounts/income', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  const income = await Income.find().sort({ date: -1 });
  res.json(income);
});

app.post('/api/accounts/income', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const income = await Income.create({ ...req.body, recordedBy: req.userId, date: req.body.date || new Date() });
    res.json({ success: true, income });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/accounts/expenses', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json(expenses);
});

app.post('/api/accounts/expenses', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, recordedBy: req.userId, date: req.body.date || new Date() });
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/accounts/financial-summary', authMiddleware, requireRole('accounts_admin', 'super_admin'), async (req, res) => {
  try {
    const [incomeAgg, expenseAgg, pendingSalaries, completedPayments] = await Promise.all([
      Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Salary.countDocuments({ status: 'pending' }),
      FeePayment.countDocuments({ status: 'completed' })
    ]);
    const totalIncome   = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    res.json({ success: true, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, pendingSalaries, completedPayments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== MESSAGING ====================
app.get('/api/messages/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId }, isActive: true }, 'fullName email role profileImage').sort('fullName');
    const grouped = {
      super_admin:      users.filter(u => u.role === 'super_admin'),
      academic_admin:   users.filter(u => u.role === 'academic_admin'),
      discipline_admin: users.filter(u => u.role === 'discipline_admin'),
      accounts_admin:   users.filter(u => u.role === 'accounts_admin'),
      teachers:         users.filter(u => u.role === 'teacher'),
      students:         users.filter(u => u.role === 'student'),
      parents:          users.filter(u => u.role === 'parent')
    };
    res.json({ success: true, users: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const conversations = await Conversation.aggregate([
      { $match: { 'participants.userId': userId, isActive: true } },
      { $sort: { lastMessageAt: -1 } }
    ]);
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/messages/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.userId }
      ],
      isDeleted: false
    }).sort({ createdAt: 1 }).limit(100);
    await Message.updateMany(
      { senderId: req.params.userId, recipientId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;
    const [sender, recipient] = await Promise.all([User.findById(req.userId), User.findById(recipientId)]);
    if (!sender || !recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const message = await Message.create({
      senderId: req.userId, senderName: sender.fullName, senderRole: sender.role,
      recipientId, recipientName: recipient.fullName, recipientRole: recipient.role,
      subject, content
    });

    let conversation = await Conversation.findOne({ 'participants.userId': { $all: [req.userId, recipientId] }, isActive: true });
    if (conversation) {
      conversation.lastMessage = content.substring(0, 100);
      conversation.lastMessageAt = new Date();
      conversation.messageCount += 1;
      await conversation.save();
    } else {
      conversation = await Conversation.create({
        participants: [
          { userId: req.userId, name: sender.fullName, role: sender.role },
          { userId: recipientId, name: recipient.fullName, role: recipient.role }
        ],
        lastMessage: content.substring(0, 100), lastMessageAt: new Date(), subject, messageCount: 1
      });
    }

    io.to(recipientId.toString()).emit('new_message', {
      message: { _id: message._id, senderName: sender.fullName, subject, content, createdAt: message.createdAt },
      conversationId: conversation._id
    });
    res.json({ success: true, message, conversationId: conversation._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipientId: req.userId, isRead: false, isDeleted: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/messages/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    if (message.recipientId.toString() !== req.userId) return res.status(403).json({ success: false, message: 'Unauthorized' });
    message.isRead = true; message.readAt = new Date();
    await message.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    if (message.senderId.toString() !== req.userId && message.recipientId.toString() !== req.userId)
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    message.isDeleted = true;
    await message.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USERS (SUPER ADMIN) ====================
app.get('/api/super-admin/users', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/super-admin/users/:id/toggle-active', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER DASHBOARD ====================
app.get('/api/teacher/dashboard', authMiddleware, requireRole('teacher'), async (req, res) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ userId: req.userId });
    const classes = await Class.find({ teacherId: req.userId });
    const classIds = classes.map(c => c._id);
    const [totalStudents, pendingAssignments, recentGrades] = await Promise.all([
      Student.countDocuments({ classId: { $in: classIds } }),
      Assignment.countDocuments({ teacherId: req.userId, dueDate: { $gte: new Date() } }),
      Grade.find({ teacherId: req.userId }).sort({ createdAt: -1 }).limit(5)
    ]);
    res.json({ success: true, teacherProfile, classes, totalStudents, pendingAssignments, recentGrades });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ==================== DATABASE CONNECTION & START ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essa_school';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(async () => {
  console.log('✅ MongoDB Connected');
  const userCount = await User.countDocuments();
  if (process.argv.includes('--seed') || process.env.SEED_DB === 'true' || userCount === 0) {
    await seedDatabase();
  }
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
    console.log(`\n🔑 Super Admin: admin@essa.rw / admin123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});