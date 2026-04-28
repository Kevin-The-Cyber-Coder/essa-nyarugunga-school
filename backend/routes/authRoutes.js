const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, name) => {
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login attempt:', { email, role });
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid role selected' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken(user._id, user.role, user.fullName);
    
    console.log('Login successful:', { email, role });
    
    res.json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;