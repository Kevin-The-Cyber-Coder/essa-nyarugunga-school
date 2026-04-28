const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all conversations for a user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.userId': req.userId
    }).sort({ updatedAt: -1 });
    
    // Get unread counts
    const conversationsWithUnread = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount.get(req.userId.toString()) || 0
    }));
    
    res.json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is participant
    if (!conversation.participants.some(p => p.userId.toString() === req.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const messages = await Message.find({
      $or: [
        { 'sender.id': req.userId, 'receiver.id': conversation.participants.find(p => p.userId.toString() !== req.userId.toString())?.userId },
        { 'sender.id': conversation.participants.find(p => p.userId.toString() !== req.userId.toString())?.userId, 'receiver.id': req.userId }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { 'receiver.id': req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a new message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiverId, receiverName, receiverRole, subject, content } = req.body;
    
    const sender = await User.findById(req.userId);
    
    const message = new Message({
      sender: {
        id: req.userId,
        name: sender.fullName,
        role: req.userRole
      },
      receiver: {
        id: receiverId,
        name: receiverName,
        role: receiverRole
      },
      subject,
      content
    });
    
    await message.save();
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [req.userId, receiverId] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { userId: req.userId, name: sender.fullName, role: req.userRole },
          { userId: receiverId, name: receiverName, role: receiverRole }
        ],
        lastMessage: {
          content: content.substring(0, 100),
          senderId: req.userId,
          sentAt: new Date()
        }
      });
    } else {
      conversation.lastMessage = {
        content: content.substring(0, 100),
        senderId: req.userId,
        sentAt: new Date()
      };
      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    }
    
    conversation.updatedAt = new Date();
    await conversation.save();
    
    res.status(201).json({ success: true, message: 'Message sent successfully', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get users by role (for creating new conversations)
router.get('/users/:role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('fullName email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all teachers (for students and parents)
router.get('/teachers', authMiddleware, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('fullName email role');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all admins
router.get('/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('fullName email role');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      'receiver.id': req.userId,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;