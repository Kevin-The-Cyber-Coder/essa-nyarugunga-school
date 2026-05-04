// reset-db.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/essa_school';

// Define schemas (minimal version for reset)
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date
});

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  subject: String,
  phone: String
});

const classSchema = new mongoose.Schema({
  className: String,
  grade: String,
  academicYear: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: Array
});

const User = mongoose.model('User', userSchema);
const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
const Class = mongoose.model('Class', classSchema);

const resetDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }

    // Create Super Admin
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
    console.log('✅ Super Admin created: admin@essa.rw / admin123');

    // Create Academic Admin
    const academicAdminPassword = await bcrypt.hash('academic123', 10);
    const academicAdmin = new User({
      fullName: 'Academic Administrator',
      email: 'academic@essa.rw',
      password: academicAdminPassword,
      role: 'academic_admin',
      phone: '+250788123457',
      isActive: true,
      createdAt: new Date()
    });
    await academicAdmin.save();
    console.log('✅ Academic Admin created: academic@essa.rw / academic123');

    // Create Sample Teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher = new User({
      fullName: 'John Teacher',
      email: 'teacher@essa.rw',
      password: teacherPassword,
      role: 'teacher',
      phone: '+250788123458',
      isActive: true,
      createdAt: new Date()
    });
    await teacher.save();
    console.log('✅ Teacher created: teacher@essa.rw / teacher123');

    // Create Teacher Profile
    const teacherProfile = new TeacherProfile({
      userId: teacher._id,
      fullName: 'John Teacher',
      email: 'teacher@essa.rw',
      subject: 'Mathematics & Computer Science',
      phone: '+250788123458'
    });
    await teacherProfile.save();
    console.log('✅ Teacher Profile created');

    // Create Sample Class with Teacher Assigned
    const sampleClass = new Class({
      className: 'A',
      grade: 'S4',
      academicYear: '2026',
      teacherId: teacher._id,
      students: []
    });
    await sampleClass.save();
    console.log('✅ Sample Class created: S4 A with Teacher assigned');

    // Create Another Class without Teacher
    const sampleClass2 = new Class({
      className: 'B',
      grade: 'S5',
      academicYear: '2026',
      teacherId: null,
      students: []
    });
    await sampleClass2.save();
    console.log('✅ Sample Class created: S5 B (No teacher)');

    console.log('\n🎉 Database Reset Complete!');
    console.log('\n📋 Login Credentials:');
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Teacher "John Teacher" is already assigned to Class "S4 A"');
    console.log('   Teacher will see this class when they login!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();