const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== SCHEMAS ====================

// User Schema
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

// Student Schema
const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  name: String,
  email: String,
  grade: String,
  className: String,
  avgScore: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
  parentPhone: String
});

// Grade Schema
const gradeSchema = new mongoose.Schema({
  studentId: { type: Number, required: true },
  studentName: { type: String, required: true },
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  grade: { type: String },
  term: { type: String, required: true },
  year: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  className: { type: String, required: true },
  dueDate: { type: Date, required: true },
  totalPoints: { type: Number, default: 100 },
  submissions: [{
    studentId: Number,
    studentName: String,
    submittedAt: Date,
    score: Number,
    feedback: String,
    status: { type: String, default: 'pending' }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: { type: Number, required: true },
  studentName: { type: String, required: true },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  createdAt: { type: Date, default: Date.now }
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
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ==================== MIDDLEWARE ====================
const authMiddleware = (req, res, next) => {
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
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
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
    
    res.json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ROUTES ====================

// Get students
app.get('/api/teacher/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all grades
app.get('/api/teacher/grades', authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find().sort({ createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add grade
app.post('/api/teacher/grades', authMiddleware, async (req, res) => {
  try {
    const { studentId, studentName, subject, score, term, remarks, year } = req.body;
    
    const grade = new Grade({
      studentId,
      studentName,
      subject,
      score,
      term,
      year: year || 2026
    });
    
    await grade.save();
    
    // Update student average score
    const studentGrades = await Grade.find({ studentId });
    const avgScore = studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length;
    await Student.findOneAndUpdate({ studentId }, { avgScore: Math.round(avgScore) });
    
    res.json({ success: true, message: 'Grade added successfully', grade });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignments
app.get('/api/teacher/assignments', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment
app.post('/api/teacher/assignments', authMiddleware, async (req, res) => {
  try {
    const { title, description, subject, className, dueDate, totalPoints } = req.body;
    
    const assignment = new Assignment({
      title,
      description,
      subject,
      className,
      dueDate,
      totalPoints,
      submissions: []
    });
    
    await assignment.save();
    res.json({ success: true, message: 'Assignment created successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance
app.post('/api/teacher/attendance', authMiddleware, async (req, res) => {
  try {
    const { records } = req.body;
    
    for (const record of records) {
      await Attendance.create(record);
      
      // Update student attendance percentage
      const studentAttendance = await Attendance.find({ studentId: record.studentId });
      const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
      const attendancePercent = Math.round((presentCount / studentAttendance.length) * 100);
      await Student.findOneAndUpdate({ studentId: record.studentId }, { attendance: attendancePercent });
    }
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats
app.get('/api/teacher/dashboard', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find();
    const assignments = await Assignment.find();
    const grades = await Grade.find();
    
    const avgScore = grades.length > 0 
      ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1)
      : 0;
    
    res.json({
      totalStudents: students.length,
      totalAssignments: assignments.length,
      classAverage: avgScore,
      students: students.map(s => ({
        id: s.studentId,
        name: s.name,
        avgScore: s.avgScore,
        attendance: s.attendance
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SEED DATABASE ====================
const seedDatabase = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }
  
  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  await User.create({
    fullName: 'Mukansanga Marie',
    email: 'teacher@essa.rw',
    password: teacherPassword,
    role: 'teacher',
    phone: '+250788123458'
  });
  
  // Create students
  const students = [
    { studentId: 1, name: 'Alice Habimana', email: 'alice@essa.rw', grade: 'S4', className: 'Software Development', avgScore: 85, attendance: 95, parentPhone: '+250788123001' },
    { studentId: 2, name: 'Jean Paul Ndayisaba', email: 'jean@essa.rw', grade: 'S4', className: 'Software Development', avgScore: 78, attendance: 88, parentPhone: '+250788123002' },
    { studentId: 3, name: 'Marie Claire Uwase', email: 'marie@essa.rw', grade: 'S4', className: 'Software Development', avgScore: 92, attendance: 98, parentPhone: '+250788123003' },
    { studentId: 4, name: 'Eric Munezero', email: 'eric@essa.rw', grade: 'S4', className: 'Software Development', avgScore: 70, attendance: 85, parentPhone: '+250788123004' },
    { studentId: 5, name: 'Diane Umuhoza', email: 'diane@essa.rw', grade: 'S4', className: 'Software Development', avgScore: 88, attendance: 92, parentPhone: '+250788123005' }
  ];
  
  for (const student of students) {
    await Student.create(student);
  }
  
  // Create sample grades
  const grades = [
    { studentId: 1, studentName: 'Alice Habimana', subject: 'Mathematics', score: 85, term: 'Term 1', year: 2026 },
    { studentId: 2, studentName: 'Jean Paul Ndayisaba', subject: 'Mathematics', score: 78, term: 'Term 1', year: 2026 },
    { studentId: 3, studentName: 'Marie Claire Uwase', subject: 'Mathematics', score: 92, term: 'Term 1', year: 2026 },
    { studentId: 4, studentName: 'Eric Munezero', subject: 'Mathematics', score: 70, term: 'Term 1', year: 2026 },
    { studentId: 5, studentName: 'Diane Umuhoza', subject: 'Mathematics', score: 88, term: 'Term 1', year: 2026 }
  ];
  
  for (const grade of grades) {
    await Grade.create(grade);
  }
  
  console.log('✅ Database seeded successfully!');
  console.log('\n🔐 Demo Credentials:');
  console.log('Teacher: teacher@essa.rw / teacher123\n');
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  await seedDatabase();
});