const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ==================== SIMPLE MIDDLEWARE (NO NEXT ISSUES) ====================
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== SCHEMAS ====================
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'parent', 'admin'], required: true },
  phone: String,
  address: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  grade: String,
  className: String,
  combination: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  subject: String,
  score: Number,
  grade: String,
  term: String,
  year: Number,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: String,
  createdAt: { type: Date, default: Date.now }
});

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: String,
  date: Date,
  status: String,
  subject: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: String
});

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  subject: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: String,
  className: String,
  dueDate: Date,
  totalPoints: Number,
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    submittedAt: Date,
    fileUrl: String,
    score: Number,
    status: { type: String, default: 'pending' }
  }]
});

// Calculate grade before saving
gradeSchema.pre('save', function(next) {
  if (this.score >= 80) this.grade = 'A';
  else if (this.score >= 75) this.grade = 'B+';
  else if (this.score >= 70) this.grade = 'B';
  else if (this.score >= 65) this.grade = 'C+';
  else if (this.score >= 60) this.grade = 'C';
  else if (this.score >= 50) this.grade = 'D';
  else if (this.score >= 40) this.grade = 'E';
  else this.grade = 'F';
  next();
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);
const Grade = mongoose.model('Grade', gradeSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);

// ==================== AUTH HELPER ====================
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
  } catch (error) {
    return null;
  }
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid role selected' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );
    
    let roleData = null;
    if (role === 'student') {
      roleData = await Student.findOne({ user: user._id });
    }
    
    res.json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      roleData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== STUDENT ROUTES ====================
app.get('/api/student/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const student = await Student.findOne({ user: decoded.id }).populate('user', 'fullName email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const grades = await Grade.find({ student: student._id }).sort({ createdAt: -1 });
    const averageScore = grades.length > 0 
      ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1)
      : 0;
    
    const attendance = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(10);
    const totalDays = await Attendance.countDocuments({ student: student._id });
    const presentDays = await Attendance.countDocuments({ student: student._id, status: 'Present' });
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
    
    const assignments = await Assignment.find({ className: student.className }).sort({ dueDate: 1 });
    
    res.json({
      student: {
        name: student.user.fullName,
        email: student.user.email,
        studentId: student.studentId,
        grade: student.grade,
        className: student.className
      },
      grades: grades.slice(0, 5),
      averageScore,
      attendance,
      attendanceRate,
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter(a => 
        a.submissions.some(s => s.student?.toString() === student._id.toString())
      ).length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/student/grades', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });
    
    const student = await Student.findOne({ user: decoded.id });
    const grades = await Grade.find({ student: student._id }).sort({ term: -1, year: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/student/attendance', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });
    
    const student = await Student.findOne({ user: decoded.id });
    const attendance = await Attendance.find({ student: student._id }).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ROUTES ====================
app.get('/api/teacher/students', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const students = await Student.find().populate('user', 'fullName email');
    res.json(students.map(s => ({
      id: s._id,
      name: s.user.fullName,
      email: s.user.email,
      grade: s.grade,
      className: s.className
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/grades', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { studentId, studentName, subject, score, term, year } = req.body;
    const teacher = await User.findById(decoded.id);
    
    const grade = new Grade({
      student: studentId,
      studentName,
      subject,
      score,
      term,
      year,
      teacher: decoded.id,
      teacherName: teacher.fullName
    });
    
    await grade.save();
    res.json({ success: true, message: 'Grade added successfully', grade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/teacher/attendance', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { records } = req.body;
    const teacher = await User.findById(decoded.id);
    
    for (const record of records) {
      await Attendance.findOneAndUpdate(
        { student: record.studentId, date: new Date(record.date), subject: record.subject },
        {
          student: record.studentId,
          studentName: record.studentName,
          date: new Date(record.date),
          status: record.status,
          subject: record.subject,
          teacher: decoded.id,
          teacherName: teacher.fullName
        },
        { upsert: true }
      );
    }
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEST ROUTE ====================
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// ==================== SEED DATABASE ====================
const seedDatabase = async () => {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('Database already has users, skipping seed...');
    return;
  }
  
  // Create users
  const studentUser = new User({
    fullName: 'Jean Paul Ndayisaba',
    email: 'student@essa.rw',
    password: await bcrypt.hash('student123', 10),
    role: 'student',
    phone: '+250788123457'
  });
  await studentUser.save();
  
  const teacherUser = new User({
    fullName: 'Mukansanga Marie',
    email: 'teacher@essa.rw',
    password: await bcrypt.hash('teacher123', 10),
    role: 'teacher',
    phone: '+250788123458'
  });
  await teacherUser.save();
  
  const parentUser = new User({
    fullName: 'Habimana Jean',
    email: 'parent@essa.rw',
    password: await bcrypt.hash('parent123', 10),
    role: 'parent',
    phone: '+250788123459'
  });
  await parentUser.save();
  
  const adminUser = new User({
    fullName: 'Dr. Uwimana Jean Paul',
    email: 'admin@essa.rw',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    phone: '+250788123456'
  });
  await adminUser.save();
  
  // Create student profile
  const student = new Student({
    user: studentUser._id,
    studentId: 'STU2024001',
    grade: 'S6',
    className: 'Software Development',
    combination: 'Software Development'
  });
  await student.save();
  
  // Add sample grades
  const grades = [
    { student: student._id, studentName: 'Jean Paul Ndayisaba', subject: 'Mathematics', score: 85, term: 'Term 1', year: 2026, teacher: teacherUser._id, teacherName: 'Mukansanga Marie' },
    { student: student._id, studentName: 'Jean Paul Ndayisaba', subject: 'English', score: 78, term: 'Term 1', year: 2026, teacher: teacherUser._id, teacherName: 'Mukansanga Marie' },
    { student: student._id, studentName: 'Jean Paul Ndayisaba', subject: 'Physics', score: 92, term: 'Term 1', year: 2026, teacher: teacherUser._id, teacherName: 'Mukansanga Marie' }
  ];
  
  for (const g of grades) {
    await Grade.create(g);
  }
  
  // Add sample attendance
  const attendanceRecords = [
    { student: student._id, studentName: 'Jean Paul Ndayisaba', date: new Date('2026-04-22'), status: 'Present', subject: 'Mathematics', teacher: teacherUser._id, teacherName: 'Mukansanga Marie' },
    { student: student._id, studentName: 'Jean Paul Ndayisaba', date: new Date('2026-04-23'), status: 'Present', subject: 'English', teacher: teacherUser._id, teacherName: 'Mukansanga Marie' },
    { student: student._id, studentName: 'Jean Paul Ndayisaba', date: new Date('2026-04-24'), status: 'Late', subject: 'Physics', teacher: teacherUser._id, teacherName: 'Mukansanga Marie' }
  ];
  
  for (const a of attendanceRecords) {
    await Attendance.create(a);
  }
  
  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔐 DEMO CREDENTIALS:');
  console.log('-------------------');
  console.log('Student: student@essa.rw / student123');
  console.log('Teacher: teacher@essa.rw / teacher123');
  console.log('Parent: parent@essa.rw / parent123');
  console.log('Admin: admin@essa.rw / admin123');
  console.log('-------------------\n');
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Test API: http://localhost:${PORT}/api/test\n`);
  await seedDatabase();
});