const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('sendMessage', (data) => {
    io.to(data.receiverId).emit('newMessage', data);
    socket.emit('messageSent', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essa_school')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

// Create Super Admin
const createSuperAdmin = async () => {
  const existing = await User.findOne({ role: 'super_admin' });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      fullName: 'Super Administrator',
      email: 'admin@essa.rw',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+250788123456',
      isActive: true
    });
    console.log('\n✅ SUPER ADMIN CREATED!');
    console.log('📧 Email: admin@essa.rw');
    console.log('🔑 Password: admin123\n');
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
const messageRoutes = require('./routes/messageRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/academic-admin', academicAdminRoutes);
app.use('/api/discipline-admin', disciplineAdminRoutes);
app.use('/api/accounts-admin', accountsAdminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await createSuperAdmin();
});

// Make io accessible to routes
app.set('io', io);