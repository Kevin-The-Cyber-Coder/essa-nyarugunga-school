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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

// Import models
const User = require('./models/User');

// Create default super admin
const createDefaultSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const superAdmin = new User({
        fullName: 'Super Administrator',
        email: 'admin@essa.rw',
        password: hashedPassword,
        role: 'super_admin',
        phone: '+250788123456',
        isActive: true
      });
      
      await superAdmin.save();
      console.log('\n✅ ========================================');
      console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
      console.log('✅ ========================================');
      console.log('📧 Email: admin@essa.rw');
      console.log('🔑 Password: admin123');
      console.log('✅ ========================================\n');
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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  await createDefaultSuperAdmin();
});