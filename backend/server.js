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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== FILE UPLOAD CONFIGURATION ====================

// Create upload directories if they don't exist
const uploadDirs = ['./uploads', './uploads/news', './uploads/gallery', './uploads/profile'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for news images
const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/news/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
  }
});
// ==================== SOCKET.IO WITH USER ROOMS ====================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.userId);
  
  // Join user to their personal room
  socket.join(socket.userId);
  
  // Handle typing indicators
  socket.on('typing', ({ recipientId, isTyping }) => {
    socket.to(recipientId).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });
  
  // Handle message read receipts
  socket.on('mark_read', ({ messageId, senderId }) => {
    socket.to(senderId).emit('message_read', { messageId });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.userId);
  });
}); 

// Configure storage for gallery images
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer upload instances
const uploadNews = multer({ 
  storage: newsStorage, 
  fileFilter: imageFileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadGallery = multer({ 
  storage: galleryStorage, 
  fileFilter: imageFileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const uploadProfile = multer({ 
  storage: profileStorage, 
  fileFilter: imageFileFilter, 
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for profile
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== EMAIL CONFIGURATION ====================

// Create email transporter
// ==================== EMAIL CONFIGURATION ====================

// Create email transporter for muekeshimanakevin20@gmail.com
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'kevineniyomurinzi@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-16-character-app-password'
  },
  // Add these options for better reliability
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('📧 Gmail setup tips:');
    console.log('1. Enable 2-Step Verification on your Google account');
    console.log('2. Generate an App Password (not your regular password)');
    console.log('3. Use the 16-character App Password in .env');
  } else {
    console.log('✅ Email configured successfully for:', process.env.EMAIL_USER);
  }
});
// Email templates
const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Welcome to ESSA Nyarugunga Portal, ${user.fullName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          .button { background: #1a3a5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎓 Welcome to ESSA Nyarugunga Portal</h2>
            <p>École Secondaire des Sciences et Administrative</p>
          </div>
          <div class="content">
            <h3>Dear ${user.fullName},</h3>
            <p>Welcome to the ESSA Nyarugunga School Management Portal! Your account has been created successfully.</p>
            
            <div class="credentials">
              <h4>📋 Your Account Details:</h4>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Password:</strong> ${user.tempPassword || 'Use the password provided by your administrator'}</p>
              <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
            </div>
            
            <p>You can now log in to the portal to access:</p>
            <ul>
              <li>📚 Academic information and grades</li>
              <li>📅 Attendance tracking</li>
              <li>💰 Fee payment status</li>
              <li>💬 Messaging system</li>
              <li>📢 School announcements</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/portal/login" class="button">🔐 Login to Portal</a>
            </div>
            
            <p>If you have any questions, please contact the school administration.</p>
            <p>Best regards,<br><strong>ESSA Nyarugunga Administration</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ESSA Nyarugunga School | Excellence in Education</p>
            <p>Nyarugunga Sector, Kicukiro District, Kigali, Rwanda</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  await emailTransporter.sendMail(mailOptions);
};

const sendNewsNotificationEmail = async (news) => {
  const subscribers = await Subscription.find({ isActive: true });
  
  for (const subscriber of subscribers) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: subscriber.email,
      subject: `📰 New: ${news.title} - ESSA Nyarugunga`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .news-image { max-width: 100%; border-radius: 8px; margin: 15px 0; }
            .button { background: #1a3a5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📢 New Update from ESSA Nyarugunga</h2>
            </div>
            <div class="content">
              <h3>${news.title}</h3>
              ${news.image ? `<img src="${news.image}" alt="${news.title}" class="news-image" />` : ''}
              <p>${news.summary}</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:5173/news" class="button">📖 Read Full Article</a>
              </div>
            </div>
            <div class="footer">
              <p>You received this email because you subscribed to ESSA Nyarugunga newsletter.</p>
              <p><a href="http://localhost:5173/unsubscribe?email=${subscriber.email}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
  }
};

const sendContactNotificationEmail = async (contact) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'admin@essa.rw',
    subject: `📬 New Contact Message from ${contact.fullName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a3a5c; color: white; padding: 15px; }
          .content { padding: 20px; background: #f5f5f5; }
          .info { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <h3>Contact Details:</h3>
            <div class="info"><strong>Name:</strong> ${contact.fullName}</div>
            <div class="info"><strong>Email:</strong> ${contact.email}</div>
            <div class="info"><strong>Phone:</strong> ${contact.phone || 'Not provided'}</div>
            <div class="info"><strong>Subject:</strong> ${contact.subject || 'General Inquiry'}</div>
            <div class="info"><strong>Message:</strong></div>
            <p style="background: white; padding: 15px; border-radius: 5px;">${contact.message}</p>
            <hr>
            <p>Login to the admin dashboard to reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  await emailTransporter.sendMail(mailOptions);
};

const sendAdmissionConfirmationEmail = async (application) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: application.email,
    subject: `🎓 Admission Application Received - ESSA Nyarugunga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎓 Application Received!</h2>
          </div>
          <div class="content">
            <h3>Dear ${application.fullName},</h3>
            <p>Thank you for applying to <strong>ESSA Nyarugunga School</strong>!</p>
            <p>We have successfully received your admission application.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Application Number:</strong> ${application.applicationNumber}</p>
              <p><strong>Submitted Date:</strong> ${new Date(application.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> Pending Review</p>
            </div>
            <p>Our admissions team will review your application and contact you within 3-5 business days.</p>
            <p>For any questions, contact us at <strong>+250 788 123 456</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  await emailTransporter.sendMail(mailOptions);
};

// ==================== MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  profileImage: String, // Added profile image field
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
  title: { type: String },
  summary: { type: String },
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

// ==================== MESSAGING MODELS ====================

// Message Schema
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
  readAt: { type: Date },
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  attachments: [{ type: String }],
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // For replies
  createdAt: { type: Date, default: Date.now }
});

// Conversation Schema to track message threads
const conversationSchema = new mongoose.Schema({
  participants: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String,
    lastReadAt: Date
  }],
  lastMessage: { type: String },
  lastMessageAt: { type: Date, default: Date.now },
  subject: { type: String },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

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
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
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
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROFILE PICTURE UPLOAD ====================
app.post('/api/user/upload-profile', authMiddleware, uploadProfile.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.userId, { profileImage: imageUrl });
    
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CONTACT ROUTES ====================
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;
    
    // Save to database
    const contact = new Contact({ fullName, email, phone, subject, message });
    await contact.save();
    
    // Send email to admin with enhanced template
    await sendContactNotificationEmail(contact);
    
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
        return res.json({ success: true, message: 'Welcome back! You have been resubscribed.' });
      }
      return res.json({ success: true, message: 'You are already subscribed!' });
    }
    
    subscription = new Subscription({ email });
    await subscription.save();
    
    // Send welcome email
    const welcomeMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '📧 Welcome to ESSA Nyarugunga Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center;">
            <h2>Welcome to Our Newsletter! 📧</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h3>Thank you for subscribing!</h3>
            <p>You will now receive the latest news, events, and announcements from ESSA Nyarugunga School.</p>
            <p>Stay tuned for updates about:</p>
            <ul>
              <li>📚 Academic achievements</li>
              <li>🎉 School events and activities</li>
              <li>📢 Important announcements</li>
              <li>🏆 Student successes</li>
            </ul>
          </div>
        </div>
      `
    };
    
    await emailTransporter.sendMail(welcomeMailOptions);
    
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== NEWS ROUTES ====================
// Public news endpoints
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

// Admin news routes with file upload
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const news = await News.find().sort({ date: -1 });
  res.json(news);
});

app.post('/api/academic-admin/news', authMiddleware, uploadNews.single('image'), async (req, res) => {
  try {
    const { title, summary, content, category, tags } = req.body;
    const currentUser = await User.findById(req.userId);
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/news/${req.file.filename}`;
    }
    
    const news = new News({
      title,
      summary,
      content: content || summary,
      image: imageUrl || null,
      category: category || 'news',
      tags: tags ? tags.split(',') : [],
      author: currentUser?.fullName || 'Academic Admin',
      date: new Date(),
      isPublished: true
    });
    
    await news.save();
    
    // Send email notifications to subscribers
    try {
      await sendNewsNotificationEmail(news);
      console.log('📧 Newsletter sent to subscribers');
    } catch (emailError) {
      console.error('Email error:', emailError);
    }
    
    res.json({ success: true, news, imageUrl });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/news/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== GALLERY ROUTES ====================
// Public gallery endpoints
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

// Admin gallery routes with file upload
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const gallery = await Gallery.find().sort({ date: -1 });
  res.json(gallery);
});

app.post('/api/academic-admin/gallery', authMiddleware, uploadGallery.single('image'), async (req, res) => {
  try {
    const { title, category, description } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/gallery/${req.file.filename}`;
    }
    
    const galleryItem = new Gallery({
      title,
      image: imageUrl,
      category: category || 'events',
      description: description || '',
      date: new Date(),
      isPublished: true
    });
    
    await galleryItem.save();
    res.json({ success: true, gallery: galleryItem, imageUrl });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'academic_admin' && req.userRole !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ADMISSION ROUTES ====================
app.post('/api/admissions/submit', async (req, res) => {
  try {
    const applicationData = req.body;
    
    const newApplication = new AdmissionApplication({
      fullName: applicationData.fullName,
      dateOfBirth: new Date(applicationData.dateOfBirth),
      nationality: applicationData.nationality || 'Rwandan',
      nationalId: applicationData.nationalId || '',
      email: applicationData.email,
      phone: applicationData.phone,
      address: applicationData.address,
      level: applicationData.level,
      previousSchool: applicationData.previousSchool,
      lastAverage: parseFloat(applicationData.lastAverage),
      achievements: applicationData.achievements || '',
      parentName: applicationData.parentName,
      parentPhone: applicationData.parentPhone,
      parentEmail: applicationData.parentEmail || '',
      parentOccupation: applicationData.parentOccupation || '',
      applyScholarship: applicationData.applyScholarship || false,
      status: 'pending'
    });
    
    await newApplication.save();
    
    // Send confirmation email to applicant
    await sendAdmissionConfirmationEmail(newApplication);
    
    res.json({
      success: true,
      message: 'Application submitted successfully!',
      applicationNumber: newApplication.applicationNumber
    });
  } catch (error) {
    console.error('Admission error:', error);
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
  try {
    const { fullName, email, password, subject, phone } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    
    const finalPassword = password || 'teacher123';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    
    const teacherUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'teacher',
      phone: phone || '',
      createdBy: req.userId,
      isActive: true
    });
    await teacherUser.save();
    
    const teacherProfile = new TeacherProfile({
      userId: teacherUser._id,
      fullName,
      email,
      subject: subject || 'General',
      phone: phone || ''
    });
    await teacherProfile.save();
    
    // Send welcome email to teacher
    try {
      await sendWelcomeEmail({
        fullName,
        email,
        role: 'teacher',
        tempPassword: finalPassword
      });
      console.log(`📧 Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }
    
    res.json({ success: true, teacher: teacherProfile, password: finalPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/teachers/:id', authMiddleware, async (req, res) => {
  const teacher = await TeacherProfile.findById(req.params.id);
  if (teacher) {
    await User.findByIdAndDelete(teacher.userId);
    await TeacherProfile.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true });
});

// ==================== CLASSES ROUTES ====================
app.get('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().lean();
    for (let cls of classes) {
      if (cls.teacherId) {
        const teacher = await TeacherProfile.findOne({ userId: cls.teacherId });
        if (teacher) {
          cls.teacherId = { _id: cls.teacherId, fullName: teacher.fullName };
        }
      }
    }
    res.json(classes);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/academic-admin/classes', authMiddleware, async (req, res) => {
  try {
    const { className, grade, academicYear, teacherId } = req.body;
    
    const newClass = new Class({
      className,
      grade,
      academicYear,
      teacherId: teacherId || null,
      students: []
    });
    await newClass.save();
    res.json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classItem = await Class.findById(req.params.classId);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    classItem.teacherId = teacherId;
    await classItem.save();
    res.json({ success: true, class: classItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/academic-admin/classes/:id', authMiddleware, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PERFORMANCE ROUTES ====================
app.get('/api/academic-admin/students-performance', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('classId', 'grade className');
    const performanceData = students.map(student => ({
      studentId: student.studentId || `STU${student._id.toString().slice(-6)}`,
      name: student.fullName,
      class: student.classId ? `${student.classId.grade} ${student.classId.className}` : 'Not Assigned',
      averageScore: Math.floor(Math.random() * 30) + 65
    }));
    res.json(performanceData);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/academic-admin/class-performance', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().populate('teacherId', 'fullName');
    const performanceData = classes.map(cls => ({
      className: `${cls.grade} ${cls.className}`,
      teacher: cls.teacherId?.fullName || 'Not Assigned',
      studentCount: cls.students?.length || 0,
      averageScore: Math.floor(Math.random() * 25) + 70
    }));
    res.json(performanceData);
  } catch (error) {
    res.json([]);
  }
});

// ==================== MESSAGING ROUTES ====================

// Get all conversations for a user
app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const conversations = await Conversation.aggregate([
      {
        $match: {
          'participants.userId': mongoose.Types.ObjectId.createFromHexString(userId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'conversationId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          unreadCount: {
            $size: {
              $filter: {
                input: '$messages',
                cond: {
                  $and: [
                    { $eq: ['$$this.isRead', false] },
                    { $ne: ['$$this.senderId', mongoose.Types.ObjectId.createFromHexString(userId)] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);
    
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a specific conversation
app.get('/api/messages/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;
    
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId }
      ],
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .limit(100);
    
    // Mark messages as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        recipientId: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a new message
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { recipientId, subject, content, parentMessageId } = req.body;
    const senderId = req.userId;
    
    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }
    
    // Get recipient info
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    
    const message = new Message({
      senderId,
      senderName: sender.fullName,
      senderRole: sender.role,
      recipientId,
      recipientName: recipient.fullName,
      recipientRole: recipient.role,
      subject,
      content,
      parentMessageId: parentMessageId || null
    });
    
    await message.save();
    
    // Update or create conversation
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [senderId, recipientId] },
      isActive: true
    });
    
    if (conversation) {
      conversation.lastMessage = content.substring(0, 100);
      conversation.lastMessageAt = new Date();
      conversation.messageCount += 1;
      await conversation.save();
    } else {
      conversation = new Conversation({
        participants: [
          { userId: senderId, name: sender.fullName, role: sender.role },
          { userId: recipientId, name: recipient.fullName, role: recipient.role }
        ],
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
        subject: subject,
        messageCount: 1
      });
      await conversation.save();
    }
    
    // Emit real-time event via Socket.io
    io.to(recipientId.toString()).emit('new_message', {
      message: {
        _id: message._id,
        senderName: sender.fullName,
        senderRole: sender.role,
        subject,
        content,
        createdAt: message.createdAt
      },
      conversationId: conversation._id
    });
    
    res.json({ success: true, message, conversationId: conversation._id });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete/Archive a message
app.delete('/api/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.userId;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    // Only sender or recipient can delete
    if (message.senderId.toString() !== userId && message.recipientId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    message.isDeleted = true;
    await message.save();
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread message count
app.get('/api/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const count = await Message.countDocuments({
      recipientId: userId,
      isRead: false,
      isDeleted: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users for messaging (except current user)
app.get('/api/messages/users', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const users = await User.find(
      { _id: { $ne: userId }, isActive: true },
      'fullName email role profileImage'
    ).sort('fullName');
    
    // Group users by role
    const groupedUsers = {
      admin: users.filter(u => u.role === 'admin'),
      academic_admin: users.filter(u => u.role === 'academic_admin'),
      teachers: users.filter(u => u.role === 'teacher'),
      students: users.filter(u => u.role === 'student'),
      parents: users.filter(u => u.role === 'parent')
    };
    
    res.json({ success: true, users: groupedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark message as read
app.put('/api/messages/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.userId;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    if (message.recipientId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});