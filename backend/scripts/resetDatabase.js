const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const resetDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`🗑️ Dropped: ${collection.name}`);
    }

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

    console.log('\n✅ Database Reset Complete!');
    console.log('📧 Email: admin@essa.rw');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: super_admin\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetDatabase();