import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './MessagingSystem.css';

const API_URL = 'http://localhost:5000/api';

const MessagingSystem = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const token = localStorage.getItem('token');
  
  // Initialize Socket.io
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    
    newSocket.on('new_message', (data) => {
      if (currentConversation && data.conversationId === currentConversation._id) {
        fetchMessages(currentConversation.participants.find(p => p.userId !== user.id)?.userId);
      }
      fetchConversations();
      fetchUnreadCount();
    });
    
    newSocket.on('user_typing', ({ userId, isTyping: typing }) => {
      if (userId !== user.id) {
        setTypingUser(typing ? userId : null);
        setTimeout(() => setTypingUser(null), 1000);
      }
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, [token]);
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  };
  
  // Fetch messages for a conversation
  const fetchMessages = async (otherUserId) => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };
  
  // Fetch users for messaging
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };
  
  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Unread count error:', error);
    }
  };
  
  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      await axios.post(`${API_URL}/messages/send`, {
        recipientId: selectedUser._id,
        subject: subject || 'New Message',
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewMessage('');
      setSubject('');
      setShowCompose(false);
      fetchConversations();
      if (selectedUser) {
        fetchMessages(selectedUser._id);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
  };
  
  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && selectedUser) {
      setIsTyping(true);
      socket?.emit('typing', { recipientId: selectedUser._id, isTyping: true });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedUser) {
        socket.emit('typing', { recipientId: selectedUser._id, isTyping: false });
        setIsTyping(false);
      }
    }, 1000);
  };
  
  // Select conversation
  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    const otherUser = conversation.participants.find(p => p.userId !== user.id);
    setSelectedUser({ _id: otherUser.userId, fullName: otherUser.name, role: otherUser.role });
    await fetchMessages(otherUser.userId);
  };
  
  // Delete message
  const deleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        await axios.delete(`${API_URL}/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchMessages(selectedUser?._id);
        fetchConversations();
      } catch (error) {
        console.error('Delete message error:', error);
      }
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    fetchConversations();
    fetchUsers();
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (selectedUser) fetchMessages(selectedUser._id);
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedUser]);
  
  const formatDate = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now - msgDate;
    
    if (diff < 86400000) return msgDate.toLocaleTimeString();
    return msgDate.toLocaleDateString();
  };
  
  return (
    <div className="messaging-container">
      <div className="messaging-sidebar">
        <div className="sidebar-header">
          <h3>💬 Messages</h3>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          <button className="compose-btn" onClick={() => {
            setShowCompose(true);
            fetchUsers();
          }}>
            ✏️ Compose
          </button>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">No messages yet</div>
          ) : (
            conversations.map(conv => {
              const otherUser = conv.participants.find(p => p.userId !== user.id);
              const unread = conv.unreadCount || 0;
              
              return (
                <div
                  key={conv._id}
                  className={`conversation-item ${currentConversation?._id === conv._id ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {otherUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">{otherUser?.name}</div>
                    <div className="conversation-role">{otherUser?.role}</div>
                    <div className="conversation-preview">
                      {conv.lastMessage?.substring(0, 40)}...
                    </div>
                  </div>
                  {unread > 0 && <div className="unread-dot">{unread}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="messaging-main">
        {!selectedUser ? (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar">{selectedUser.fullName?.charAt(0)}</div>
                <div>
                  <h4>{selectedUser.fullName}</h4>
                  <small>{selectedUser.role}</small>
                </div>
              </div>
              {typingUser && <div className="typing-indicator">Typing...</div>}
            </div>
            
            <div className="messages-area">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div className="message-subject">{msg.subject}</div>
                    <div className="message-text">{msg.content}</div>
                    <div className="message-meta">
                      <span>{msg.senderName} • {msg.senderRole}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                      {msg.isRead && msg.senderId === user.id && <span>✓✓ Read</span>}
                    </div>
                  </div>
                  {msg.senderId === user.id && (
                    <button
                      className="delete-message-btn"
                      onClick={() => deleteMessage(msg._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="message-input-area">
              <input
                type="text"
                placeholder="Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="subject-input"
              />
              <div className="input-group">
                <textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                  rows="3"
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  Send 📤
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      
      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Message</h3>
            <select onChange={(e) => {
              const userId = e.target.value;
              for (let role in users) {
                const found = users[role]?.find(u => u._id === userId);
                if (found) {
                  setSelectedUser(found);
                  break;
                }
              }
            }}>
              <option value="">Select recipient...</option>
              {Object.entries(users).map(([role, userList]) => 
                userList?.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({role})
                  </option>
                ))
              )}
            </select>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              placeholder="Message"
              value={newMessage}
              onChange={handleTyping}
              rows="5"
            />
            <div className="modal-buttons">
              <button onClick={() => setShowCompose(false)}>Cancel</button>
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;