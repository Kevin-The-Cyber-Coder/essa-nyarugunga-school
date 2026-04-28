const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { 
    type: [String], 
    enum: ['all', 'students', 'teachers', 'parents', 'admins'], 
    default: ['all'] 
  },
  priority: { 
    type: String, 
    enum: ['normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  attachments: [{ fileName: String, fileUrl: String }],
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite error
module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);