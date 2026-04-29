const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }
    
    console.log('\n✅ All collections cleared!');
    
    // Create Super Admin directly
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = {
      fullName: 'Super Administrator',
      email: 'admin@essa.rw',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true,
      createdAt: new Date()
    };
    
    await db.collection('users').insertOne(superAdmin);
    console.log('\n✅ Super Admin created!');
    console.log('📧 Email: admin@essa.rw');
    console.log('🔑 Password: admin123');
    
    await mongoose.disconnect();
    console.log('\n✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetDatabase();