// seed.js - Run this file to reset and seed the database
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = mongoose.model('User', new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}));

const TeacherProfile = mongoose.model('TeacherProfile', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: String,
  email: String,
  subject: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
}));

const Student = mongoose.model('Student', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: String,
  fullName: String,
  email: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentName: String,
  parentPhone: String,
  isActive: { type: Boolean, default: true },
  enrollmentDate: { type: Date, default: Date.now }
}));

const Class = mongoose.model('Class', new mongoose.Schema({
  className: String,
  grade: { type: String, enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  academicYear: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: String,
  content: String,
  audience: [String],
  priority: { type: String, default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const News = mongoose.model('News', new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  image: String,
  category: { type: String, default: 'news' },
  author: String,
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
}));

const Gallery = mongoose.model('Gallery', new mongoose.Schema({
  title: String,
  image: String,
  category: String,
  description: String,
  photographer: String,
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 }
}));

const AdmissionApplication = mongoose.model('AdmissionApplication', new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  level: String,
  status: { type: String, default: 'pending' },
  applicationNumber: String,
  createdAt: { type: Date, default: Date.now }
}));

// Seed function
const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting database seeding...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Drop all collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
      console.log(`   ✅ Dropped: ${collection.collectionName}`);
    }
    console.log('✅ All collections dropped successfully\n');
    
    // ==================== CREATE SUPER ADMIN (HEAD MASTER) ====================
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = new User({
      fullName: 'Head Master',
      email: 'admin@essa.rw',
      password: superAdminPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true,
      createdAt: new Date()
    });
    await superAdmin.save();
    console.log('✅ Super Admin (Head Master) created:');
    console.log('   Name: Head Master');
    console.log('   Email: admin@essa.rw');
    console.log('   Password: admin123');
    console.log('   Role: super_admin\n');
    
    // ==================== CREATE SAMPLE ANNOUNCEMENTS ====================
    const announcements = [
      {
        title: 'Welcome to the New Academic Year 2026',
        content: 'We are excited to welcome all students, parents, and teachers to the 2026 academic year. Let\'s work together for excellence!',
        audience: ['all'],
        priority: 'high',
        createdBy: superAdmin._id,
        isActive: true
      },
      {
        title: 'Parent-Teacher Conference Schedule',
        content: 'The parent-teacher conference will be held on May 20, 2026. Parents are encouraged to attend and discuss their children\'s progress.',
        audience: ['parents'],
        priority: 'normal',
        createdBy: superAdmin._id,
        isActive: true
      },
      {
        title: 'Sports Day Announcement',
        content: 'Annual Sports Day will take place on June 25, 2026. All students are encouraged to participate.',
        audience: ['all'],
        priority: 'normal',
        createdBy: superAdmin._id,
        isActive: true
      }
    ];
    
    for (const ann of announcements) {
      await Announcement.create(ann);
    }
    console.log(`✅ Created ${announcements.length} announcements\n`);
    
    // ==================== CREATE SAMPLE NEWS ====================
    const newsItems = [
      {
        title: 'ESSA Nyarugunga Welcomes New Head Master',
        summary: 'We are pleased to announce the appointment of our new Head Master, bringing over 15 years of educational leadership experience.',
        content: 'The board of directors has appointed a new Head Master to lead ESSA Nyarugunga into a new era of excellence...',
        category: 'announcement',
        author: 'Board of Directors',
        isPublished: true
      },
      {
        title: 'New Computer Laboratory Inaugurated',
        summary: 'State-of-the-art computer lab with 50 modern computers was officially opened.',
        content: 'The new facility will enhance ICT education for all students and provide hands-on experience...',
        category: 'academic',
        author: 'ICT Department',
        isPublished: true
      }
    ];
    
    for (const news of newsItems) {
      await News.create(news);
    }
    console.log(`✅ Created ${newsItems.length} news articles\n`);
    
    // ==================== CREATE SAMPLE GALLERY ITEMS ====================
    const galleryItems = [
      {
        title: 'Graduation Ceremony 2025',
        image: 'https://via.placeholder.com/500x350/1a3a5c/ffffff?text=Graduation',
        category: 'events',
        description: 'S6 students receiving their certificates',
        photographer: 'School Media Team'
      },
      {
        title: 'Science Exhibition',
        image: 'https://via.placeholder.com/500x350/1a3a5c/ffffff?text=Science+Exhibition',
        category: 'academic',
        description: 'Students showcasing their science projects',
        photographer: 'Science Department'
      }
    ];
    
    for (const gallery of galleryItems) {
      await Gallery.create(gallery);
    }
    console.log(`✅ Created ${galleryItems.length} gallery items\n`);
    
    // ==================== SEEDING COMPLETE ====================
    console.log('🎉 Database seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 SUPER ADMIN LOGIN CREDENTIALS:');
    console.log('   Email: admin@essa.rw');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin (Head Master)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Login with the credentials above');
    console.log('   2. Navigate to "Manage Admins" section');
    console.log('   3. Create other admin accounts:');
    console.log('      - Academic Admin');
    console.log('      - Discipline Admin');
    console.log('      - Accounts Admin');
    console.log('   4. Create teachers, classes, and students\n');
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Database connection closed\n');
  }
};

// Connect and seed
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/essa_school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  return seedDatabase();
})
.catch(err => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});