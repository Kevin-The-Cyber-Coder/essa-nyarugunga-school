// src/components/ChatModal.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ChatModal = ({ isOpen, onClose, recipient, onMessageSent }) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  const getToken = () => localStorage.getItem('portalToken');

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    const token = getToken();
    try {
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    const token = getToken();
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.participant.id);
  };

  const handleSendNewMessage = async (e) => {
    e.preventDefault();
    if (!subject || !content) {
      Swal.fire('Error', 'Please fill subject and message', 'error');
      return;
    }

    setLoading(true);
    const token = getToken();

    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: recipient.id,
          receiverName: recipient.name,
          receiverRole: recipient.role,
          subject,
          content
        })
      });

      if (response.ok) {
        Swal.fire('Success', 'Message sent successfully!', 'success');
        setSubject('');
        setContent('');
        onMessageSent?.();
        onClose();
      } else {
        Swal.fire('Error', 'Failed to send message', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const token = getToken();
    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedConversation.participant.id,
          receiverName: selectedConversation.participant.name,
          receiverRole: selectedConversation.participant.role,
          subject: `Re: ${messages[0]?.subject || 'Message'}`,
          content: replyText
        })
      });

      if (response.ok) {
        setReplyText('');
        fetchMessages(selectedConversation.participant.id);
        fetchConversations();
        Swal.fire('Sent!', 'Reply sent successfully', 'success');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1a3a5c',
          color: 'white'
        }}>
          <h3>Messages</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          <button onClick={() => setActiveTab('new')} style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'new' ? '#ffc107' : '#f8f9fa',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'new' ? 'bold' : 'normal'
          }}>New Message</button>
          <button onClick={() => setActiveTab('inbox')} style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'inbox' ? '#ffc107' : '#f8f9fa',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'inbox' ? 'bold' : 'normal'
          }}>Inbox ({conversations.length})</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {activeTab === 'new' ? (
            <form onSubmit={handleSendNewMessage} style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>To:</label>
                <input
                  type="text"
                  value={recipient?.name || ''}
                  disabled
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', background: '#f8f9fa' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows="5"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', height: '100%' }}>
              {/* Conversations List */}
              <div style={{ width: '35%', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                {conversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      background: selectedConversation?._id === conv._id ? '#f0f4f8' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{conv.participant.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{conv.lastMessage.content?.substring(0, 50)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      {conv.unreadCount > 0 && (
                        <span style={{ marginLeft: '8px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No conversations yet</div>
                )}
              </div>

              {/* Messages Area */}
              <div style={{ width: '65%', display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                      {messages.map(msg => (
                        <div
                          key={msg._id}
                          style={{
                            marginBottom: '1rem',
                            textAlign: msg.senderId === localStorage.getItem('userId') ? 'right' : 'left'
                          }}
                        >
                          <div style={{
                            display: 'inline-block',
                            maxWidth: '80%',
                            padding: '10px',
                            borderRadius: '12px',
                            background: msg.senderId === localStorage.getItem('userId') ? '#1a3a5c' : '#f0f4f8',
                            color: msg.senderId === localStorage.getItem('userId') ? 'white' : '#333'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px' }}>
                              {msg.senderName}
                            </div>
                            <div><strong>{msg.subject}</strong></div>
                            <div style={{ marginTop: '5px' }}>{msg.content}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>
                              {new Date(msg.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', resize: 'none' }}
                        rows="2"
                      />
                      <button
                        onClick={handleSendReply}
                        style={{
                          padding: '0 16px',
                          background: '#1a3a5c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                    Select a conversation to read messages
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;