ESSA Nyarugunga School Management System
Professional README
<div align="center"> <img src="../essa-nyarugunga/src/assets/logo.png" alt="ESSA Nyarugunga School Logo" width="150"> <h1>🏫 ESSA Nyarugunga School</h1> <h3>Comprehensive School Management System</h3> <p>A full-featured platform for managing academic operations, student records, teacher assignments, and school communication</p>
https://img.shields.io/badge/version-1.0.0-blue
https://img.shields.io/badge/license-MIT-green
https://img.shields.io/badge/Node.js-22.x-green
https://img.shields.io/badge/React-18.x-blue
https://img.shields.io/badge/MongoDB-8.x-green
https://img.shields.io/badge/status-production-success

</div>
📋 Table of Contents
Overview

Features

System Architecture

Technology Stack

Screenshots

Installation Guide

Configuration

User Roles & Access

API Documentation

Database Schema

Usage Guide

Testing

Deployment

Troubleshooting

Contributing

License

Contact

📖 Overview
ESSA Nyarugunga School Management System is a comprehensive web-based platform designed to streamline academic operations, facilitate communication between teachers, students, and administrators, and provide real-time access to educational resources. The system supports multiple user roles including Super Admin, Academic Admin, Discipline Admin, Accounts Admin, Teachers, and Students.

🎯 Key Objectives
Centralized Management: Manage all school operations from a single dashboard

Real-time Communication: Instant messaging and announcements

Academic Tracking: Monitor student performance, attendance, and assignments

Role-based Access: Secure, role-specific interfaces and permissions

Scalable Architecture: Built to handle growing school needs

✨ Features
🖥️ Super Admin Dashboard
Feature	Description
Admin Management	Create, view, and delete sub-administrators
Announcements	Post school-wide announcements with targeting
System Overview	View all system activities and statistics
User Analytics	Track user engagement and system usage
📚 Academic Admin Module
Feature	Description
Class Management	Create, edit, and delete classes (S1-S6)
Teacher Assignment	Assign teachers to specific classes
Student Management	View and manage student records
Performance Tracking	Monitor class and student academic performance
News Management	Create and publish school news
Photo Gallery	Manage school event photos and galleries
👨‍🏫 Teacher Module
Feature	Description
Student Management	Create and manage student accounts
Attendance Tracking	Record and monitor student attendance
Assignment Creation	Create, publish, and grade assignments
Grade Management	Record and calculate student grades
Class View	View assigned classes and student lists
Password Reset	Reset student passwords when needed
💬 Messaging System
Feature	Description
Real-time Chat	Instant messaging between users
Unread Notifications	Visual indicators for new messages
User Directory	Browse all system users
Message History	Complete conversation threads
🎓 Student Features
Feature	Description
Attendance View	Check personal attendance records
Grades Dashboard	View academic performance
Assignments	Submit and track assignments
Announcements	Receive school announcements
Messages	Communicate with teachers
🔔 Additional Features
Real-time Notifications using Socket.IO

Secure Authentication with JWT

Responsive Design for mobile and desktop

Export Capabilities for reports

Activity Logging for audit trails

🏗️ System Architecture
text
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  React   │  │  React   │  │  React   │  │  React   │   │
│  │  Admin   │  │ Teacher  │  │ Student  │  │  Login   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│                    (Express.js / Node.js)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware                │   │
│  │                    (JWT Validation)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────┐  │
│  │ Auth   │  │ Admin  │  │Academic│  │Teacher │  │Student│  │
│  │ Routes │  │ Routes │  │ Routes │  │ Routes │  │Routes │  │
│  └────────┘  └────────┘  └────────┘  └────────┘  └──────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Socket.IO (Real-time)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   MongoDB Database                     │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │   │
│  │  │Users │ │Class │ │Student│Teacher│ │News  │       │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
💻 Technology Stack
Frontend
Technology	Version	Purpose
React	18.2.0	UI Framework
React Router DOM	6.8.0	Navigation
Axios	1.3.0	HTTP Client
Socket.IO Client	4.5.0	Real-time Communication
CSS3	-	Styling
Vite	4.0.0	Build Tool
Backend
Technology	Version	Purpose
Node.js	22.x	Runtime Environment
Express.js	4.18.0	Web Framework
MongoDB	8.x	Database
Mongoose	7.0.0	ODM
Socket.IO	4.5.0	WebSocket Server
JWT	9.0.0	Authentication
bcryptjs	2.4.3	Password Hashing
Development Tools
Tool	Purpose
Nodemon	Auto-restart during development
Postman	API Testing
Git	Version Control
MongoDB Compass	Database GUI
📸 Screenshots
Login Page
text
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    ESSA NYARUGUNGA                    │    │
│  │                                                        │    │
│  │                   🔐 SCHOOL LOGIN                     │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  📧 Email: admin@essa.rw                        │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  🔒 Password: ••••••••                         │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  👤 Role: [Super Admin ▼]                       │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │                 🔑 SIGN IN                       │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
Super Admin Dashboard
text
┌─────────────────────────────────────────────────────────────┐
│  🏫 ESSA Nyarugunga                    🔔 👤 Admin  ▼       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────────┐ │
│ │ 📊 Stats │ │  ┌─────────────────────────────────────┐   │ │
│ │ 45       │ │  │  📢 Quick Actions                    │   │ │
│ │ Teachers │ │  │  [➕ Create Admin]  [📣 Announce]    │   │ │
│ │         │ │  └─────────────────────────────────────┘   │ │
│ │ 320      │ │                                             │ │
│ │ Students │ │  ┌─────────────────────────────────────┐   │ │
│ │         │ │  │  👥 Administrators                   │   │ │
│ │ 12       │ │  │  ┌────┬────────────┬─────────────┐  │   │ │
│ │ Classes  │ │  │  │ #  │ Name        │ Role        │  │   │ │
│ └─────────┘ │  │  ├────┼────────────┼─────────────┤  │   │ │
│             │  │  │ 1  │ John Doe    │ Academic    │  │   │ │
│ ┌─────────┐ │  │  │ 2  │ Jane Smith  │ Discipline  │  │   │ │
│ │ 📈      │ │  │  │ 3  │ Bob Wilson  │ Accounts    │  │   │ │
│ │ System  │ │  │  └────┴────────────┴─────────────┘  │   │ │
│ │ Health  │ │  └─────────────────────────────────────┘   │ │
│ │ 🟢 All  │ │                                             │ │
│ │ Systems │ │  ┌─────────────────────────────────────┐   │ │
│ │ Active  │ │  │  📢 Recent Announcements            │   │ │
│ └─────────┘ │  │  • Exam schedule released (2h ago)  │   │ │
│             │  │  • Staff meeting tomorrow (5h ago)  │   │ │
└─────────────┘  └─────────────────────────────────────┘   │ │
                 └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
Teacher Dashboard
text
┌─────────────────────────────────────────────────────────────┐
│  👨‍🏫 Mr. John Doe - Mathematics               🔔 3  👤     │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────────────────────────┐ │
│ │ 📚 My    │ │  🎯 Today's Schedule                        │ │
│ │ Classes  │ │  ┌────────────────────────────────────┐   │ │
│ │          │ │  │ 08:00 - S3A - Mathematics          │   │ │
│ │ • S3A    │ │  │ 10:00 - S4B - Advanced Math        │   │ │
│ │ • S4B    │ │  │ 13:00 - S2C - Basic Math           │   │ │
│ │ • S2C    │ │  └────────────────────────────────────┘   │ │
│ └──────────┘ │                                            │ │
│              │  ┌────────────────────────────────────┐   │ │
│ ┌──────────┐ │  │  📝 Pending Grading (15)           │   │ │
│ │ 👨‍🎓      │ │  │  • S3A - Weekly Test               │   │ │
│ │ Students │ │  │  • S4B - Project Submissions       │   │ │
│ │ 127      │ │  │  • S2C - Quiz                      │   │ │
│ └──────────┘ │  └────────────────────────────────────┘   │ │
│              │                                            │ │
│ ┌──────────┐ │  ┌────────────────────────────────────┐   │ │
│ │ 📊 Today │ │  │  📋 Recent Messages                 │   │ │
│ │ Present  │ │  │  • Parent meeting request          │   │ │
│ │ 85       │ │  │  • Department update               │   │ │
│ │ / 127    │ │  └────────────────────────────────────┘   │ │
│ └──────────┘ └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
Class Management Interface
text
┌─────────────────────────────────────────────────────────────┐
│  📚 Academic Admin - Class Management                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ CREATE NEW CLASS ─────────────────────────────────────┐ │
│  │  Class Name: [S3A        ]  Grade: [S3 ▼]              │ │
│  │  Academic Year: [2024-2025]  Teacher: [Select ▼]       │ │
│  │                         [➕ Create Class]               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ CLASS LIST ───────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  ┌──────┬──────────┬──────────────┬──────────────┐   │ │
│  │  │ Grade│ Class    │ Teacher       │ Students     │   │ │
│  │  ├──────┼──────────┼──────────────┼──────────────┤   │ │
│  │  │ S1   │ S1A      │ Ms. Alice     │ 32           │   │ │
│  │  │ S1   │ S1B      │ Mr. Bob       │ 30           │   │ │
│  │  │ S2   │ S2A      │ Ms. Carol     │ 28           │   │ │
│  │  │ S3   │ S3A      │ Not Assigned  │ 31           │   │ │
│  │  └──────┴──────────┴──────────────┴──────────────┘   │ │
│  │                                                        │ │
│  │  [👁️ View]  [✏️ Edit]  [👨‍🏫 Assign Teacher]  [🗑️ Delete]│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
🚀 Installation Guide
Prerequisites
Before you begin, ensure you have the following installed:

bash
# Check Node.js version
node --version  # Should be v22.x or higher

# Check npm version
npm --version   # Should be v10.x or higher

# Check MongoDB
mongod --version  # Should be v8.x or higher

# Check Git
git --version
Step 1: Clone the Repository
bash
# Clone the project
git clone https://github.com/Kevin-The-Cyber-Coder/essa-nyarugunga-school.git

# Navigate to project directory
cd essa-nyarugunga-school
Step 2: Backend Setup
bash
# Enter backend directory
cd backend

# Install dependencies
npm install

# Create environment file
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb://127.0.0.1:27017/essa_school" >> .env
echo "JWT_SECRET=your_super_secret_key_change_this" >> .env
Package.json dependencies for backend:

json
{
  "name": "essa-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "socket.io": "^4.5.0",
    "dotenv": "^16.0.3",
    "nodemon": "^2.0.20"
  }
}
Step 3: Frontend Setup
bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Install additional dependencies if needed
npm install axios react-router-dom socket.io-client
Package.json dependencies for frontend:

json
{
  "name": "essa-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "socket.io-client": "^4.5.0"
  }
}
Step 4: Database Setup
bash
# Start MongoDB service (Windows)
net start MongoDB

# Start MongoDB service (Linux/Mac)
sudo systemctl start mongod

# Create database (MongoDB shell)
mongosh
use essa_school
exit
Step 5: Run the Application
bash
# Terminal 1: Start Backend Server
cd backend
npm run dev
# or
node server.js

# Terminal 2: Start Frontend Development Server
cd frontend
npm run dev
Step 6: Access the Application
Frontend: http://localhost:5173

Backend API: http://localhost:5000

API Health Check: http://localhost:5000/api/health

Default Login Credentials
Role	Email	Password
Super Admin	admin@essa.rw	admin123
⚙️ Configuration
Environment Variables (.env)
Backend (.env)
env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/essa_school
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/essa_school

# Security
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Socket.IO
SOCKET_PORT=5000
Frontend (.env)
env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
MongoDB Connection String Options
javascript
// Development
mongoose.connect('mongodb://127.0.0.1:27017/essa_school', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Production (MongoDB Atlas)
mongoose.connect('mongodb+srv://<username>:<password>@cluster.mongodb.net/essa_school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
});
👥 User Roles & Access
Role Hierarchy
text
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                              │
│              Full system access & control                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  ACADEMIC     │    │  DISCIPLINE   │    │   ACCOUNTS    │
│    ADMIN      │    │    ADMIN      │    │    ADMIN      │
│ Classes,      │    │ Incidents,    │    │ Fees,         │
│ Teachers,     │    │ Behavior,     │    │ Payments,     │
│ Students      │    │ Permissions   │    │ Finance       │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         TEACHER                              │
│     Assignments, Attendance, Grades, Student Management     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         STUDENT                              │
│       View grades, assignments, attendance, messages        │
└─────────────────────────────────────────────────────────────┘
Permission Matrix
Feature	Super Admin	Academic Admin	Teacher	Student
User Management	✅	❌	❌	❌
Create Admin	✅	❌	❌	❌
Manage Classes	✅	✅	❌	❌
Assign Teachers	✅	✅	❌	❌
Create News	✅	✅	❌	❌
Manage Gallery	✅	✅	❌	❌
Create Students	✅	✅	✅	❌
Post Assignments	✅	✅	✅	❌
Record Attendance	✅	✅	✅	❌
Submit Assignments	❌	❌	❌	✅
View Grades	✅	✅	✅	✅
Send Messages	✅	✅	✅	✅
View Announcements	✅	✅	✅	✅
📡 API Documentation
Authentication Endpoints
POST /api/auth/login
Authenticates a user and returns JWT token.

Request Body:

json
{
  "email": "admin@essa.rw",
  "password": "admin123",
  "role": "super_admin"
}
Response:

json
{
  "success": true,
  "_id": "65a1b2c3d4e5f67890abcdef",
  "fullName": "Super Administrator",
  "email": "admin@essa.rw",
  "role": "super_admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Super Admin Endpoints
Method	Endpoint	Description
GET	/api/super-admin/admins	List all admins
POST	/api/super-admin/create-admin	Create new admin
DELETE	/api/super-admin/admins/:id	Delete admin
GET	/api/super-admin/announcements	Get announcements
POST	/api/super-admin/announcements	Create announcement
DELETE	/api/super-admin/announcements/:id	Delete announcement
Academic Admin Endpoints
Method	Endpoint	Description
GET	/api/academic-admin/classes	Get all classes
POST	/api/academic-admin/classes	Create new class
PUT	/api/academic-admin/classes/:classId/assign-teacher	Assign teacher to class
DELETE	/api/academic-admin/classes/:id	Delete class
GET	/api/academic-admin/teachers-list	Get all teachers
POST	/api/academic-admin/create-teacher-credentials	Create teacher
GET	/api/academic-admin/news	Get news
POST	/api/academic-admin/news	Create news
GET	/api/academic-admin/gallery	Get gallery images
POST	/api/academic-admin/gallery	Add gallery image
Teacher Endpoints
Method	Endpoint	Description
GET	/api/teacher/students	Get teacher's students
GET	/api/teacher/classes	Get teacher's classes
POST	/api/teacher/create-student	Create student
POST	/api/teacher/students/:id/reset-password	Reset student password
GET	/api/teacher/assignments	Get assignments
POST	/api/teacher/assignments	Create assignment
GET	/api/teacher/attendance	Get attendance records
POST	/api/teacher/attendance	Record attendance
Messaging Endpoints
Method	Endpoint	Description
GET	/api/messages/users	Get all users for messaging
GET	/api/messages/unread/count	Get unread message count
GET	/api/messages/user/:userId	Get conversation with user
POST	/api/messages/send	Send a message
Socket.IO Events
Event	Direction	Payload	Description
join	Client → Server	userId	User joins their room
sendMessage	Client → Server	{receiverId, content}	Send message
newMessage	Server → Client	{senderId, content, ...}	Receive new message
🗄️ Database Schema
User Collection
javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  role: String [super_admin, academic_admin, discipline_admin, accounts_admin, teacher, student],
  phone: String,
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
Class Collection
javascript
{
  _id: ObjectId,
  className: String,
  grade: String [S1, S2, S3, S4, S5, S6],
  academicYear: String,
  teacherId: ObjectId (ref: User),
  students: [ObjectId (ref: Student)],
  createdAt: Date
}
Student Collection
javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  studentId: String,
  fullName: String,
  email: String,
  classId: ObjectId (ref: Class),
  teacherId: ObjectId (ref: User),
  parentName: String,
  parentPhone: String,
  isActive: Boolean,
  enrollmentDate: Date
}
Assignment Collection
javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  subject: String,
  classId: ObjectId (ref: Class),
  teacherId: ObjectId (ref: User),
  dueDate: Date,
  totalPoints: Number,
  submissions: [{
    studentId: ObjectId,
    submittedAt: Date,
    content: String,
    score: Number,
    status: String
  }],
  createdAt: Date
}
Message Collection
javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  senderName: String,
  senderRole: String,
  receiverId: ObjectId (ref: User),
  receiverName: String,
  receiverRole: String,
  content: String,
  isRead: Boolean,
  createdAt: Date
}
📖 Usage Guide
Quick Start Guide
1. Logging In
Navigate to http://localhost:5173

Enter email: admin@essa.rw

Enter password: admin123

Select role: Super Admin

Click "Sign In"

2. Creating an Academic Admin
Go to Super Admin Dashboard

Click "Create Admin"

Fill in: Name, Email, Phone

Select Role: "Academic Admin"

Click "Create"

3. Creating a Class
Login as Academic Admin

Go to "Class Management"

Fill class details:

Class Name (e.g., "S3A")

Grade (e.g., "S3")

Academic Year (e.g., "2024-2025")

Click "Create Class"

4. Adding a Teacher
Go to "Teacher Management"

Click "Add Teacher"

Fill teacher details

Click "Create Teacher"

Note the generated password

5. Assigning Teacher to Class
Go to "Class Management"

Find the class

Click "Assign Teacher"

Select teacher from dropdown

Confirm assignment

6. Creating Student Accounts
Login as Teacher

Go to "Student Management"

Click "Create Student"

Fill student and parent details

Select class

Click "Create"

7. Recording Attendance
Go to "Attendance"

Select date

Select class

Mark present/absent for each student

Click "Save Attendance"

8. Creating Assignments
Go to "Assignments"

Click "Create Assignment"

Fill title, description, due date

Select class and subject

Set total points

Publish assignment

🧪 Testing
API Testing with cURL
bash
# Health Check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@essa.rw","password":"admin123","role":"super_admin"}'

# Get all classes (with token)
curl http://localhost:5000/api/academic-admin/classes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create class
curl -X POST http://localhost:5000/api/academic-admin/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"className":"S3A","grade":"S3","academicYear":"2024-2025"}'
Testing Script
javascript
// test.js - Run with: node test.js
const testAPI = async () => {
  // Test Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@essa.rw',
      password: 'admin123',
      role: 'super_admin'
    })
  });
  
  const data = await loginRes.json();
  console.log('Login:', data.success ? '✅ Passed' : '❌ Failed');
  console.log('Token:', data.token);
  
  // Test Health
  const healthRes = await fetch('http://localhost:5000/api/health');
  console.log('Health Check:', healthRes.ok ? '✅ Passed' : '❌ Failed');
};

testAPI();
🚢 Deployment
Deploying Backend to Production
Option 1: Deploy on VPS (Ubuntu)
bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone project
git clone https://github.com/Kevin-The-Cyber-Coder/essa-nyarugunga-school.git
cd essa-nyarugunga/backend

# Install dependencies
npm install --production

# Setup environment
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/essa_school
JWT_SECRET=your_secure_secret_key
NODE_ENV=production
EOF

# Start with PM2
pm2 start server.js --name essa-backend
pm2 save
pm2 startup

# Setup Nginx as reverse proxy
sudo apt install nginx -y
Nginx Configuration:

nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
Option 2: Deploy on MongoDB Atlas
Create account at MongoDB Atlas

Create a cluster (free tier available)

Get connection string: mongodb+srv://username:password@cluster.mongodb.net/essa_school

Update .env with Atlas connection string

Deploying Frontend to Production
Build for Production
bash
# Build the frontend
cd frontend
npm run build

# The build will be in the 'dist' folder
Deploy to Vercel
bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
Deploy to Netlify
bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
Docker Deployment
dockerfile
# Dockerfile for Backend
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
dockerfile
# Dockerfile for Frontend
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:8
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    restart: always    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/essa_school
      - JWT_SECRET=your_secret_key

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
🔧 Troubleshooting
Common Issues and Solutions
Issue 1: MongoDB Connection Failed
bash
Error: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
Solution:

bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
net start MongoDB            # Windows
brew services start mongodb  # Mac

# Check if MongoDB is running
mongod --version
Issue 2: Port Already in Use
bash
Error: listen EADDRINUSE: address already in use :::5000
Solution:

bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5001 node server.js
Issue 3: JWT Token Expired
bash
Error: TokenExpiredError: jwt expired
Solution:

javascript
// Regenerate token with longer expiry
const token = jwt.sign(
  { id: user._id, role: user.role },
  SECRET,
  { expiresIn: '30d' }  // Extended expiry
);
Issue 4: CORS Error in Browser
bash
Access to XMLHttpRequest has been blocked by CORS policy
Solution:

javascript
// In server.js, configure CORS properly
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
Issue 5: Socket.IO Connection Failed
bash
WebSocket connection to 'ws://localhost:5000/socket.io/' failed
Solution:

javascript
// Client side connection with proper config
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});
Debugging Commands
bash
# Check Node.js version
node --version

# Check npm packages
npm list --depth=0

# Check MongoDB connection
mongosh --eval "db.runCommand({ping: 1})"

# Check backend logs
pm2 logs essa-backend

# Test API endpoint
curl -I http://localhost:5000/api/health

# Check environment variables
printenv | grep -E "PORT|MONGODB|JWT"
🤝 Contributing
Contribution Guidelines
Fork the repository

Create a feature branch

bash
git checkout -b feature/awesome-feature
Commit changes

bash
git commit -m "Add awesome feature"
Push to branch

bash
git push origin feature/awesome-feature
Open a Pull Request

Development Workflow
bash
# Clone your fork
git clone https://github.com/Kevin-The-Cyber-Coder/essa-nyarugunga-school.git

# Add upstream remote
git remote add upstream https://github.com/Kevin-The-Cyber-Coder/essa-nyarugunga-school.git

# Create branch
git checkout -b feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to your fork
git push origin feature-name

# Sync with upstream
git fetch upstream
git merge upstream/main
Code Style
Backend: Use ESLint with Airbnb style guide

Frontend: Use Prettier for formatting

Commit Messages: Conventional commits format

bash
# Conventional commit format
type(scope): description

# Examples
feat(auth): add JWT authentication
fix(teacher): resolve class assignment bug
docs(readme): update installation guide
style(ui): improve dashboard layout
📄 License
This project is licensed under the MIT License - see below for details:

text
MIT License

Copyright (c) 2024 ESSA Nyarugunga School

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
📞 Contact
Development Team
Role	            Name                	Contact
Lead Developer	    Mukeshimana Kevin 	    kevineniyomurinzi@gmail.com
Backend Developer	Mugisha Ishaq	        mugishaishaq8@gmail.com
Frontend Developer	UI Team	                jeanvierog@gmail.com
Database Admin	    Mukeshimana Kevin	    kevineniyomurinzi@gmail.com
School Information

ESSA Nyarugunga School
Nyarugunga Sector, Kigali
Rwanda

Phone: +250 788 123 456
Email: info@essa.rw
Website: www.essa.rw
Support Channels
Technical Support: kevineniyomurinzi@gmail.com

Report Issues: https://github.com/yourusername/essa-nyarugunga/issues

Documentation: https://docs.essa.rw

Live Chat: Available on website

🙏 Acknowledgments
Thanks to all contributors and testers

Special thanks to the school administration for support

Open source community for amazing tools and libraries

📊 Project Statistics
text
├── Backend
│   ├── 25+ API Endpoints
│   ├── 12 MongoDB Models
│   ├── 8 Middleware Functions
│   └── 3,500+ Lines of Code
│
├── Frontend
│   ├── 15 React Components
│   ├── 6 Main Pages
│   ├── 4 Role-based Dashboards
│   └── 2,800+ Lines of Code
│
└── Database
    ├── 12 Collections
    ├── 45+ Fields
    └── 30+ Indexes
<div align="center"> <strong>Built with ❤️ for ESSA Nyarugunga School</strong> <br> <sub>© 2024 ESSA Nyarugunga School. All rights reserved.</sub> </div>
