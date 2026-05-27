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
// Create email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'kevineniyomurinzi@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

/// ==================== ADMISSION APPLICATION SCHEMA ====================
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

// Generate application number before saving
admissionApplicationSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.applicationNumber = `ESS${year}${random}`;
  }
  this.updatedAt = new Date();
  next();
});

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);

// ==================== ADMISSION ROUTES ====================

// Submit admission application (PUBLIC - no auth required)
app.post('/api/admissions/submit', async (req, res) => {
  try {
    const applicationData = req.body;
    
    console.log('📝 New admission application received:', applicationData.fullName);
    
    // Validate required fields
    const requiredFields = ['fullName', 'dateOfBirth', 'email', 'phone', 'address', 'level', 'previousSchool', 'lastAverage', 'parentName', 'parentPhone'];
    for (const field of requiredFields) {
      if (!applicationData[field]) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required field: ${field}` 
        });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicationData.email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address format' 
      });
    }
    
    // Validate phone format (Rwanda)
    const phoneRegex = /^(\+250|0)[7-9][0-9]{8}$/;
    if (!phoneRegex.test(applicationData.phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use 0788123456 or +250788123456' 
      });
    }
    
    // Create new application
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
    console.log(`✅ Application saved with number: ${newApplication.applicationNumber}`);
    
    // Send email notifications (if email is configured)
    try {
      await sendAdmissionEmailToAdmin(newApplication);
      await sendConfirmationEmailToApplicant(newApplication);
      console.log('📧 Emails sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails, just log it
    }
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationNumber: newApplication.applicationNumber,
      applicationId: newApplication._id
    });
    
  } catch (error) {
    console.error('Admission submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit application. Please try again later.' 
    });
  }
});

// Email to Academic Admin
const sendAdmissionEmailToAdmin = async (application) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const adminEmail = 'academic@essa.rw'; // Academic admin email
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `📋 NEW ADMISSION APPLICATION - ${application.fullName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a3a5c; color: white; padding: 20px; text-align: center; }
          .content { background: #f5f5f5; padding: 20px; }
          .section { background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
          .section-title { color: #1a3a5c; border-bottom: 2px solid #ffc107; padding-bottom: 5px; }
          .label { font-weight: bold; width: 140px; display: inline-block; }
          .status { background: #ffc107; color: #1a3a5c; padding: 3px 8px; border-radius: 4px; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎓 ESSA Nyarugunga School</h2>
            <p>New Admission Application Received</p>
          </div>
          <div class="content">
            <div class="section">
              <h3 class="section-title">📝 Application Details</h3>
              <p><span class="label">Application Number:</span> <strong>${application.applicationNumber}</strong></p>
              <p><span class="label">Submitted:</span> ${new Date(application.createdAt).toLocaleString()}</p>
              <p><span class="label">Status:</span> <span class="status">PENDING REVIEW</span></p>
            </div>
            
            <div class="section">
              <h3 class="section-title">👤 Student Information</h3>
              <p><span class="label">Full Name:</span> ${application.fullName}</p>
              <p><span class="label">Date of Birth:</span> ${new Date(application.dateOfBirth).toLocaleDateString()}</p>
              <p><span class="label">Nationality:</span> ${application.nationality}</p>
              <p><span class="label">Email:</span> ${application.email}</p>
              <p><span class="label">Phone:</span> ${application.phone}</p>
              <p><span class="label">Address:</span> ${application.address}</p>
            </div>
            
            <div class="section">
              <h3 class="section-title">📚 Academic Information</h3>
              <p><span class="label">Level:</span> ${application.level}</p>
              <p><span class="label">Previous School:</span> ${application.previousSchool}</p>
              <p><span class="label">Last Average:</span> ${application.lastAverage}%</p>
              <p><span class="label">Achievements:</span> ${application.achievements || 'None'}</p>
              <p><span class="label">Scholarship:</span> ${application.applyScholarship ? 'Yes' : 'No'}</p>
            </div>
            
            <div class="section">
              <h3 class="section-title">👪 Parent/Guardian Information</h3>
              <p><span class="label">Name:</span> ${application.parentName}</p>
              <p><span class="label">Phone:</span> ${application.parentPhone}</p>
              <p><span class="label">Email:</span> ${application.parentEmail || 'Not provided'}</p>
              <p><span class="label">Occupation:</span> ${application.parentOccupation || 'Not provided'}</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="http://localhost:5173/academic-admin/applications" style="background: #1a3a5c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                📊 View in Admin Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from ESSA Nyarugunga School Admission System.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// Confirmation email to applicant
const sendConfirmationEmailToApplicant = async (application) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: application.email,
    subject: `✅ Application Received - ESSA Nyarugunga`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a3a5c; color: white; padding: 20px; text-align: center; }
          .content { background: #f5f5f5; padding: 20px; }
          .section { background: white; padding: 15px; border-radius: 8px; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎓 ESSA Nyarugunga School</h2>
            <p>Application Received Successfully!</p>
          </div>
          <div class="content">
            <div class="section">
              <h3>Dear ${application.fullName},</h3>
              <p>Thank you for applying to <strong>ESSA Nyarugunga School</strong>! We have successfully received your admission application.</p>
              
              <p><strong>📋 Application Number:</strong> ${application.applicationNumber}</p>
              <p><strong>📅 Submission Date:</strong> ${new Date(application.createdAt).toLocaleString()}</p>
              <p><strong>📚 Applied Level:</strong> ${application.level}</p>
              <p><strong>📧 Status:</strong> <span style="color: #ffc107;">Pending Review</span></p>
              
              <hr>
              <p>Our admissions team will review your application and contact you within <strong>3-5 business days</strong> regarding the next steps.</p>
              
              <p>If you have any questions, please contact our admissions office:</p>
              <p>📞 Phone: +250 788 123 456<br>📧 Email: admissions@essanyarugunga.rw</p>
            </div>
          </div>
          <div class="footer">
            <p>ESSA Nyarugunga School - Excellence in Science and Administrative Education</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

// ==================== ACADEMIC ADMIN - VIEW APPLICATIONS ====================

// Get all applications (Academic Admin only)
app.get('/api/academic-admin/applications', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser?.role !== 'academic_admin' && currentUser?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const applications = await AdmissionApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await AdmissionApplication.countDocuments(query);
    
    res.json({
      success: true,
      data: applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single application by ID
app.get('/api/academic-admin/applications/:id', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser?.role !== 'academic_admin' && currentUser?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update application status
app.put('/api/academic-admin/applications/:id/status', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser?.role !== 'academic_admin' && currentUser?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status, reviewNotes } = req.body;
    const application = await AdmissionApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes: reviewNotes || '',
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get application statistics
app.get('/api/academic-admin/applications/stats/summary', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser?.role !== 'academic_admin' && currentUser?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const total = await AdmissionApplication.countDocuments();
    const pending = await AdmissionApplication.countDocuments({ status: 'pending' });
    const reviewing = await AdmissionApplication.countDocuments({ status: 'reviewing' });
    const accepted = await AdmissionApplication.countDocuments({ status: 'accepted' });
    const rejected = await AdmissionApplication.countDocuments({ status: 'rejected' });
    const scholarshipRequests = await AdmissionApplication.countDocuments({ applyScholarship: true });
    
    res.json({
      success: true,
      stats: {
        total,
        pending,
        reviewing,
        accepted,
        rejected,
        scholarshipRequests
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
});
// ==================== MODELS ====================

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
  createdAt: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
  title: String,
  content: String,
  audience: [String],
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
  title: String,
  image: String,
  category: String,
  description: String,
  photographer: { type: String, default: 'School Media Team' },
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
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

// ==================== ADMISSION SCHEMA ====================
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

admissionApplicationSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.applicationNumber = `ESS${year}${random}`;
  }
  this.updatedAt = new Date();
  next();
});

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);

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

// ==================== DATABASE CONNECTION ====================
// CORRECTED MongoDB Atlas connection string with database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essa_school';

console.log('📡 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  console.log(`📁 Database: ${mongoose.connection.name}`);
  console.log(`🔗 Host: ${mongoose.connection.host}`);
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.log('\n💡 Troubleshooting Tips:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify MongoDB Atlas cluster is active');
  console.log('   3. Whitelist your IP address in MongoDB Atlas (0.0.0.0/0 for development)');
  console.log('   4. Check your username and password in connection string');
  console.log('   5. Make sure the database name exists\n');
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
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
    console.error('Auth error:', error.message);
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
app.get('/api/super-admin/admins', authMiddleware, async (req, res) => {
  const currentUser = await User.findById(req.userId);
  if (currentUser?.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  const admins = await User.find({ role: { $in: ['academic_admin', 'discipline_admin', 'accounts_admin'] } }).select('-password');
  res.json(admins);
});

app.post('/api/super-admin/create-admin', authMiddleware, async (req, res) => {
  const currentUser = await User.findById(req.userId);
  if (currentUser?.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
  
  const { fullName, email, password, phone, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  
  const hashedPassword = await bcrypt.hash(password || 'admin123', 10);
  const newAdmin = new User({ fullName, email, password: hashedPassword, role, phone: phone || '', createdBy: req.userId });
  await newAdmin.save();
  res.json({ success: true, user: { _id: newAdmin._id, fullName, email, role } });
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
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
});

app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json([]);
  }
});

app.delete('/api/super-admin/announcements/:id', authMiddleware, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ==================== ACADEMIC ADMIN ROUTES ====================

// Get teachers list
app.get('/api/academic-admin/teachers-list', authMiddleware, async (req, res) => {
  try {
    const teachers = await TeacherProfile.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Create teacher
app.post('/api/academic-admin/create-teacher-credentials', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, password, subject, phone } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password || 'teacher123', 10);
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
    
    res.json({ success: true, teacher: { _id: teacherProfile._id, fullName, email, subject, phone } });
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

// Get classes
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
    res.status(500).json([]);
  }
});

// Create class
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

// Assign teacher to class
app.put('/api/academic-admin/classes/:classId/assign-teacher', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classItem = await Class.findById(req.params.classId);
    if (!classItem) return res.status(404).json({ message: 'Class not found' });
    
    classItem.teacherId = teacherId;
    await classItem.save();
    
    let teacherName = null;
    if (teacherId) {
      const teacher = await TeacherProfile.findOne({ userId: teacherId });
      teacherName = teacher ? teacher.fullName : 'Unknown';
    }
    
    res.json({ success: true, class: { ...classItem.toObject(), teacherId: teacherId ? { _id: teacherId, fullName: teacherName } : null } });
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

// ==================== NEWS ROUTES ====================

// Get all news (admin)
app.get('/api/academic-admin/news', authMiddleware, async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Create news
app.post('/api/academic-admin/news', authMiddleware, async (req, res) => {
  try {
    const { title, summary, content, image, category, tags } = req.body;
    const currentUser = await User.findById(req.userId);
    
    const news = new News({
      title,
      summary,
      content: content || summary,
      image: image || 'https://via.placeholder.com/800x400/1a3a5c/ffffff?text=News',
      category: category || 'news',
      tags: tags || [],
      author: currentUser?.fullName || 'Academic Admin',
      date: new Date(),
      isPublished: true
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

// Public news endpoint
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

// ==================== GALLERY ROUTES ====================

// Get all gallery (admin)
app.get('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ date: -1 });
    res.json(gallery);
  } catch (error) {
    res.status(500).json([]);
  }
});

// Create gallery
app.post('/api/academic-admin/gallery', authMiddleware, async (req, res) => {
  try {
    const { title, image, category, description } = req.body;
    
    const galleryItem = new Gallery({
      title,
      image: image || 'https://via.placeholder.com/400x300/1a3a5c/ffffff?text=Gallery',
      category: category || 'events',
      description: description || '',
      date: new Date(),
      isPublished: true
    });
    await galleryItem.save();
    res.json({ success: true, gallery: galleryItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete gallery
app.delete('/api/academic-admin/gallery/:id', authMiddleware, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public gallery endpoint
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

// ==================== CONTACT ROUTES ====================
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;
    console.log('Contact submission:', { fullName, email, phone, subject, message });
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ADMISSION ROUTES ====================
app.post('/api/admissions/submit', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Save to database
    const newApplication = new AdmissionApplication({
      fullName: applicationData.fullName,
      dateOfBirth: new Date(applicationData.dateOfBirth),
      nationality: applicationData.nationality,
      nationalId: applicationData.nationalId,
      email: applicationData.email,
      phone: applicationData.phone,
      address: applicationData.address,
      level: applicationData.level,
      previousSchool: applicationData.previousSchool,
      lastAverage: parseFloat(applicationData.lastAverage),
      achievements: applicationData.achievements,
      parentName: applicationData.parentName,
      parentPhone: applicationData.parentPhone,
      parentEmail: applicationData.parentEmail,
      parentOccupation: applicationData.parentOccupation,
      applyScholarship: applicationData.applyScholarship || false,
      status: 'pending'
    });
    
    await newApplication.save();
    
    // Send email notifications
    await sendAdmissionEmail(newApplication);
    
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
  try {
    const applications = await AdmissionApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json([]);
  }
});

app.put('/api/academic-admin/applications/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await AdmissionApplication.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SUBSCRIPTION ROUTES ====================
app.post('/api/subscriptions/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('New subscription:', email);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== TEACHER ROUTES ====================
app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.userId }).populate('classId', 'grade className');
    res.json(students);
  } catch (error) {
    res.json([]);
  }
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

// ==================== CREATE DEFAULT USERS ====================
const createDefaultUsers = async () => {
  try {
    // Create Super Admin
    const existingSuperAdmin = await User.findOne({ email: 'admin@essa.rw' });
    if (!existingSuperAdmin) {
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
    const existingAcademicAdmin = await User.findOne({ email: 'academic@essa.rw' });
    if (!existingAcademicAdmin) {
      const hashedPassword = await bcrypt.hash('academic123', 10);
      await User.create({
        fullName: 'Academic Administrator',
        email: 'academic@essa.rw',
        password: hashedPassword,
        role: 'academic_admin',
        phone: '+250788123457',
        isActive: true
      });
      console.log('✅ Academic Admin created: academic@essa.rw / academic123');
    }
    
    // Create Sample Teacher
    const existingTeacher = await User.findOne({ email: 'teacher@essa.rw' });
    if (!existingTeacher) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      const teacherUser = await User.create({
        fullName: 'John Teacher',
        email: 'teacher@essa.rw',
        password: hashedPassword,
        role: 'teacher',
        phone: '+250788123458',
        isActive: true
      });
      
      await TeacherProfile.create({
        userId: teacherUser._id,
        fullName: 'John Teacher',
        email: 'teacher@essa.rw',
        subject: 'Mathematics & Computer Science',
        phone: '+250788123458'
      });
      console.log('✅ Sample Teacher created: teacher@essa.rw / teacher123');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

createDefaultUsers().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📋 Login Credentials:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 SUPER ADMIN:');
    console.log('   Email: admin@essa.rw');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 ACADEMIC ADMIN:');
    console.log('   Email: academic@essa.rw');
    console.log('   Password: academic123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 TEACHER:');
    console.log('   Email: teacher@essa.rw');
    console.log('   Password: teacher123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
});