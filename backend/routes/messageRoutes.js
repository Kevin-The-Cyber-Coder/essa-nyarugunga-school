const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Get conversations for a user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.userId },
            { receiverId: req.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', req.userId] },
                  { $eq: ['$isRead', false] }
                ]},
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);
    
    const conversations = await Promise.all(messages.map(async (conv) => {
      const otherUser = await User.findById(conv._id).select('fullName email role');
      return {
        userId: conv._id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount
      };
    }));
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages with specific user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId }
      ]
    }).sort({ createdAt: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const sender = await User.findById(req.userId);
    const receiver = await User.findById(receiverId);
    
    const message = new Message({
      senderId: req.userId,
      senderName: sender.fullName,
      senderRole: sender.role,
      receiverId,
      receiverName: receiver.fullName,
      receiverRole: receiver.role,
      content
    });
    
    await message.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', message);
    
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.userId,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users for chatting
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId }, isActive: true })
      .select('fullName email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;