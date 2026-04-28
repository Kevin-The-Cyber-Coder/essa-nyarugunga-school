const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Clear existing users
    await usersCollection.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Hash passwords manually
    const hashedPasswordStudent = await bcrypt.hash('student123', 10);
    const hashedPasswordTeacher = await bcrypt.hash('teacher123', 10);
    const hashedPasswordParent = await bcrypt.hash('parent123', 10);
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);

    // Create users
    const users = [
      {
        fullName: 'Mukeshimana Kevin',
        email: 'student@essa.rw',
        password: hashedPasswordStudent,
        role: 'student',
        phone: '+250788123457',
        address: 'Kigali, Rwanda',
        isActive: true,
        createdAt: new Date()
      },
      {
        fullName: 'Ntihinduka Elissa',
        email: 'teacher@essa.rw',
        password: hashedPasswordTeacher,
        role: 'teacher',
        phone: '+250788123458',
        address: 'Kigali, Rwanda',
        isActive: true,
        createdAt: new Date()
      },
      {
        fullName: 'Papa Kevin',
        email: 'parent@essa.rw',
        password: hashedPasswordParent,
        role: 'parent',
        phone: '+250788123459',
        address: 'Kigali, Rwanda',
        isActive: true,
        createdAt: new Date()
      },
      {
        fullName: 'AineByoona James',
        email: 'admin@essa.rw',
        password: hashedPasswordAdmin,
        role: 'admin',
        phone: '+250788123456',
        address: 'Kigali, Rwanda',
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Insert users
    const result = await usersCollection.insertMany(users);
    console.log(`✅ Created ${result.insertedCount} users`);

    console.log('\n📊 Seed completed successfully!');
    console.log('\n🔐 Demo Credentials:');
    console.log('-------------------');
    console.log('Student: student@essa.rw / student123');
    console.log('Teacher: teacher@essa.rw / teacher123');
    console.log('Parent: parent@essa.rw / parent123');
    console.log('Admin: admin@essa.rw / admin123');
    console.log('-------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();