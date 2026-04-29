const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    // Test super admin login
    const superAdmin = users.find(u => u.email === 'admin@essa.rw');
    if (superAdmin) {
      console.log('\n✅ Super Admin found!');
      console.log('Email:', superAdmin.email);
      console.log('Role:', superAdmin.role);
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('Password "admin123" match:', isMatch);
      
      if (!isMatch) {
        // Re-hash password
        const newHash = await bcrypt.hash('admin123', 10);
        await db.collection('users').updateOne(
          { email: 'admin@essa.rw' },
          { $set: { password: newHash } }
        );
        console.log('✅ Password has been re-hashed!');
      }
    } else {
      console.log('\n❌ Super Admin NOT found!');
      // Create super admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.collection('users').insertOne({
        fullName: 'Super Administrator',
        email: 'admin@essa.rw',
        password: hashedPassword,
        role: 'super_admin',
        phone: '+250788123456',
        isActive: true,
        createdAt: new Date()
      });
      console.log('✅ Super Admin created!');
    }
    
    await mongoose.disconnect();
    console.log('\nTest complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();