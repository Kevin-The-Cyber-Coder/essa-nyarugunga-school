const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

// Import User model
const User = require('./models/User');

// Create ONLY Super Admin (no other demo credentials)
const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
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
      console.log('\n✅ ========================================');
      console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
      console.log('✅ ========================================');
      console.log('📧 Email: admin@essa.rw');
      console.log('🔑 Password: admin123');
      console.log('✅ ========================================');
      console.log('\n⚠️  No other demo credentials exist.');
      console.log('⚠️  All other users must be created by admins.\n');
    } else {
      console.log('\n✅ Super Admin already exists');
      console.log('📧 Email: admin@essa.rw');
      console.log('🔑 Password: admin123\n');
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

// Import routes
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const academicAdminRoutes = require('./routes/academicAdminRoutes');
const disciplineAdminRoutes = require('./routes/disciplineAdminRoutes');
const accountsAdminRoutes = require('./routes/accountsAdminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const parentRoutes = require('./routes/parentRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/academic-admin', academicAdminRoutes);
app.use('/api/discipline-admin', disciplineAdminRoutes);
app.use('/api/accounts-admin', accountsAdminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  await createSuperAdmin();
});