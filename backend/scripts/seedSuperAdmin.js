const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school');
    console.log('Connected to MongoDB');

    // Get User model
    const User = mongoose.model('User', new mongoose.Schema({
      fullName: String,
      email: String,
      password: String,
      role: String,
      phone: String,
      isActive: Boolean,
      createdAt: Date
    }));

    // Check if super admin exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const superAdmin = new User({
        fullName: 'Super Administrator',
        email: 'admin@essa.rw',
        password: hashedPassword,
        role: 'super_admin',
        phone: '+250788123456',
        isActive: true,
        createdAt: new Date()
      });
      
      await superAdmin.save();
      console.log('✅ Super Admin created successfully!');
      console.log('📧 Email: admin@essa.rw');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Super Admin already exists');
      console.log('📧 Email: admin@essa.rw');
      console.log('🔑 Password: admin123');
    }
    
    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error seeding super admin:', error);
  }
};

seedSuperAdmin();