import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const StudentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('portalToken');

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    const userId = localStorage.getItem('userId');
    if (userId) {
      newSocket.emit('join', userId);
    }
    
    newSocket.on('newMessage', (message) => {
      if (selectedUser && message.senderId === selectedUser._id) {
        setMessages(prev => [...prev, message]);
      }
      fetchUnreadCount();
    });
    
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (!token || role !== 'student') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Student');
      fetchDashboardData();
      fetchUsers();
      fetchUnreadCount();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/student/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setAssignments(data.assignments || []);
        setGrades(data.grades || []);
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;
    
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          content: messageText
        })
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage.message]);
        setMessageText('');
        if (socket) {
          socket.emit('sendMessage', {
            receiverId: selectedUser._id,
            ...newMessage.message
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const { value: content } = await Swal.fire({
      title: 'Submit Assignment',
      input: 'textarea',
      inputLabel: 'Your work',
      inputPlaceholder: 'Write your answer here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: '#27ae60'
    });
    
    if (content) {
      const token = getToken();
      const response = await fetch(`${API_URL}/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Assignment submitted successfully', 'success');
        fetchDashboardData();
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#f39c12' },
    { id: 'grades', label: 'Grades', icon: 'fas fa-chart-simple', color: '#27ae60' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#e74c3c' },
    { id: 'chat', label: 'Messages', icon: 'fas fa-comments', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '260px';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1a3a5c' }}></i>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? '80px' : '260px',
        background: '#1a3a5c',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999
      }}>
        <div style={{ padding: sidebarCollapsed ? '1rem 0' : '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ width: '60px', height: '60px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <i className="fas fa-user-graduate" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Student</p>
            </>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            position: 'absolute', bottom: '-12px', right: '-12px', width: '24px', height: '24px',
            background: '#ffc107', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#1a3a5c'
          }}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px', width: '100%', padding: '12px 24px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem'
              }}>
              <i className={item.icon} style={{ width: '20px', color: item.color }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.id === 'chat' && unreadCount > 0 && !sidebarCollapsed && (
                <span style={{ marginLeft: 'auto', background: '#e74c3c', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '12px', width: '100%', padding: '12px', background: '#e74c3c',
            border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer'
          }}>
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarCollapsed ? '80px' : '260px', transition: 'margin-left 0.3s ease', padding: '20px' }}>
        <h1 style={{ color: '#1a3a5c' }}>Welcome, {userName}! 👋</h1>
        
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '20px 0' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{dashboardData?.totalAssignments || 0}</h3>
                <p>Total Assignments</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{dashboardData?.completedAssignments || 0}</h3>
                <p>Completed</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{grades.length}</h3>
                <p>Grades Recorded</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{attendance.filter(a => a.status === 'Present').length}/{attendance.length}</h3>
                <p>Attendance</p>
              </div>
            </div>
            
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '20px' }}>
              <h2>Recent Grades</h2>
              {grades.slice(0, 5).map(grade => (
                <div key={grade._id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                  <strong>{grade.subject}</strong>: {grade.score}% ({grade.grade})
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '20px' }}>
            <h2>My Assignments</h2>
            {assignments.map(assignment => (
              <div key={assignment._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}>
                <h3>{assignment.title}</h3>
                <p>{assignment.description}</p>
                <p><strong>Subject:</strong> {assignment.subject}</p>
                <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {assignment.status}</p>
                {assignment.status === 'pending' && (
                  <button onClick={() => handleSubmitAssignment(assignment._id)} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
                    Submit Assignment
                  </button>
                )}
                {assignment.score && <p><strong>Score:</strong> {assignment.score}%</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'grades' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '20px' }}>
            <h2>My Grades</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a3a5c', color: 'white' }}>
                  <th style={{ padding: '12px' }}>Subject</th>
                  <th style={{ padding: '12px' }}>Score</th>
                  <th style={{ padding: '12px' }}>Grade</th>
                  <th style={{ padding: '12px' }}>Term</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>{grade.subject}</td>
                    <td style={{ padding: '12px' }}>{grade.score}%</td>
                    <td style={{ padding: '12px' }}>{grade.grade}</td>
                    <td style={{ padding: '12px' }}>{grade.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '20px' }}>
            <h2>Attendance Records</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a3a5c', color: 'white' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', marginTop: '20px', display: 'flex', height: '70vh' }}>
            <div style={{ width: '30%', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
              <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                <h3>Chats</h3>
              </div>
              {users.map(user => (
                <div key={user._id} onClick={() => {
                  setSelectedUser(user);
                  fetchMessages(user._id);
                }} style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  background: selectedUser?._id === user._id ? '#f0f4f8' : 'white'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.role}</div>
                </div>
              ))}
            </div>
            
            <div style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
              {selectedUser ? (
                <>
                  <div style={{ padding: '1rem', background: '#1a3a5c', color: 'white' }}>
                    <h3>{selectedUser.fullName}</h3>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {messages.map(msg => (
                      <div key={msg._id} style={{
                        textAlign: msg.senderId === localStorage.getItem('userId') ? 'right' : 'left',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          maxWidth: '70%',
                          padding: '0.5rem 1rem',
                          borderRadius: '12px',
                          background: msg.senderId === localStorage.getItem('userId') ? '#1a3a5c' : '#f0f4f8',
                          color: msg.senderId === localStorage.getItem('userId') ? 'white' : '#333'
                        }}>
                          <div><strong>{msg.senderName}</strong></div>
                          <div>{msg.content}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                    <button onClick={handleSendMessage} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                  Select a user to start chatting
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginTop: '20px' }}>
            <h2>Profile Information</h2>
            <p><strong>Name:</strong> {userName}</p>
            <p><strong>Email:</strong> {localStorage.getItem('userEmail')}</p>
            <p><strong>Role:</strong> Student</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;