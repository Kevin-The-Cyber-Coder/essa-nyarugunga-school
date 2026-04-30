import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const SuperAdminDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [admins, setAdmins] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [disciplineCases, setDisciplineCases] = useState([]);
  const [disciplineStats, setDisciplineStats] = useState({});
  const [permissions, setPermissions] = useState([]);
  const [permissionTrends, setPermissionTrends] = useState({});
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const navigate = useNavigate();
  const API_URL = 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('portalToken');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    if (!token || role !== 'super_admin') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Super Administrator');
      fetchAllData();
      fetchUsers();
      fetchUnreadCount();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    const token = getToken();
    try {
      const [adminsRes, announcementsRes, casesRes, permissionsRes] = await Promise.all([
        fetch(`${API_URL}/super-admin/admins`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/announcements`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/discipline-cases`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/permissions`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data);
      }
      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncements(data);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setDisciplineCases(data.cases || []);
        setDisciplineStats(data.stats || {});
      }
      if (permissionsRes.ok) {
        const data = await permissionsRes.json();
        setPermissions(data.permissions || []);
        setPermissionTrends(data.trends || {});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      if (response.ok) setUsers(await response.json());
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const fetchMessages = async (userId) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setMessages(await response.json());
    } catch (error) {
      console.error('Error fetching messages:', error);
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

  // Create Sub-Admin
  const handleCreateAdmin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Sub-Admin',
      html: `
        <div style="text-align: left;">
          <input type="text" id="fullName" class="swal2-input" placeholder="Full Name *" required>
          <input type="email" id="email" class="swal2-input" placeholder="Email *" required>
          <input type="password" id="password" class="swal2-input" placeholder="Password (default: admin123)">
          <input type="tel" id="phone" class="swal2-input" placeholder="Phone Number">
          <select id="role" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="academic_admin">Academic Admin</option>
            <option value="discipline_admin">Discipline Admin</option>
            <option value="accounts_admin">Accounts Admin</option>
          </select>
        </div>
      `,
      confirmButtonText: 'Create Admin',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        if (!fullName || !email) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          fullName, email,
          password: document.getElementById('password').value || 'admin123',
          phone: document.getElementById('phone').value,
          role: document.getElementById('role').value
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire({
          title: 'Admin Created!',
          html: `
            <div style="text-align: left;">
              <p><strong>Name:</strong> ${formValues.fullName}</p>
              <p><strong>Email:</strong> ${formValues.email}</p>
              <p><strong>Password:</strong> ${formValues.password}</p>
              <p><strong>Role:</strong> ${formValues.role}</p>
            </div>
          `,
          icon: 'success'
        });
        fetchAllData();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to create admin', 'error');
      }
    }
  };

  // Post Announcement with audience selector
  const handlePostAnnouncement = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Post Announcement',
      html: `
        <div style="text-align: left;">
          <input type="text" id="title" class="swal2-input" placeholder="Title *" required>
          <textarea id="content" class="swal2-textarea" placeholder="Content *" required></textarea>
          <select id="audience" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="all">📢 All Users</option>
            <option value="students">🎓 Students Only</option>
            <option value="teachers">👨‍🏫 Teachers Only</option>
            <option value="parents">👪 Parents Only</option>
            <option value="admins">👑 Admins Only</option>
          </select>
          <select id="priority" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="normal">ℹ️ Normal</option>
            <option value="high">⚠️ High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
      `,
      confirmButtonText: 'Post Announcement',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        if (!title || !content) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          title, content,
          audience: document.getElementById('audience').value,
          priority: document.getElementById('priority').value
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Announcement posted successfully', 'success');
        fetchAllData();
      } else {
        Swal.fire('Error', 'Failed to post announcement', 'error');
      }
    }
  };

  // Handle Discipline Case
  const handleDisciplineAction = async (disciplineCase) => {
    const { value: action } = await Swal.fire({
      title: `Action for ${disciplineCase.studentName || 'Student'}`,
      text: disciplineCase.description,
      input: 'select',
      inputOptions: {
        'warning': '⚠️ Warning',
        'detention': '📝 Detention',
        'community_service': '🤝 Community Service',
        'suspension': '🚫 Suspension (Temporary)',
        'expulsion': '❌ Expulsion (Permanent)'
      },
      inputPlaceholder: 'Select action',
      showCancelButton: true,
      confirmButtonText: 'Apply Action',
      confirmButtonColor: '#e74c3c'
    });
    
    if (action) {
      const { value: details } = await Swal.fire({
        title: 'Action Details',
        input: 'textarea',
        inputLabel: 'Provide additional details about the action',
        inputPlaceholder: 'e.g., Suspended for 3 days...',
        showCancelButton: true,
        confirmButtonText: 'Submit'
      });
      
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/discipline-cases/${disciplineCase._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          actionDetails: details || '',
          status: 'resolved'
        })
      });
      
      if (response.ok) {
        Swal.fire('Action Applied!', `Student has been ${action}`, 'success');
        fetchAllData();
      } else {
        Swal.fire('Error', 'Failed to apply action', 'error');
      }
    }
  };

  // Handle Permission Request
  const handlePermissionAction = async (permission, status) => {
    const result = await Swal.fire({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} Permission`,
      text: `${permission.requesterName} requested: ${permission.reason}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: status === 'approved' ? 'Approve' : 'Reject',
      confirmButtonColor: status === 'approved' ? '#27ae60' : '#e74c3c',
      input: status === 'rejected' ? 'textarea' : null,
      inputLabel: status === 'rejected' ? 'Reason for rejection' : '',
      inputPlaceholder: 'Enter reason...'
    });
    
    if (result.isConfirmed) {
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/permissions/${permission._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          rejectionReason: result.value || ''
        })
      });
      
      if (response.ok) {
        Swal.fire(`Permission ${status}!`, '', 'success');
        fetchAllData();
      }
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const result = await Swal.fire({
      title: 'Delete Admin?',
      text: `Remove ${admin.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Delete'
    });
    
    if (result.isConfirmed) {
      const token = getToken();
      await fetch(`${API_URL}/super-admin/admins/${admin._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      Swal.fire('Deleted!', 'Admin removed', 'success');
      fetchAllData();
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Announcement?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Delete'
    });
    
    if (result.isConfirmed) {
      const token = getToken();
      await fetch(`${API_URL}/super-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      Swal.fire('Deleted!', 'Announcement removed', 'success');
      fetchAllData();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'admins', label: 'Manage Admins', icon: 'fas fa-users-cog', color: '#27ae60' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn', color: '#f39c12' },
    { id: 'discipline', label: 'Discipline Cases', icon: 'fas fa-gavel', color: '#e74c3c' },
    { id: 'permissions', label: 'Permissions', icon: 'fas fa-file-alt', color: '#9b59b6' },
    { id: 'chat', label: 'Messages', icon: 'fas fa-comments', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
  const sidebarWidthMobile = mobileMenuOpen ? sidebarWidth : '0px';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1a3a5c' }}></i>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 998
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? sidebarWidthMobile : sidebarWidth,
        background: 'linear-gradient(180deg, #1a3a5c 0%, #0d2b42 100%)',
        color: 'white', position: 'fixed', left: 0, top: 0, bottom: 0,
        transition: 'width 0.3s ease', overflow: 'hidden', display: 'flex',
        flexDirection: 'column', zIndex: 999
      }}>
        <div style={{ padding: sidebarCollapsed ? '1rem 0' : '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ width: '60px', height: '60px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <i className="fas fa-crown" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Super Admin</p>
            </>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            position: 'absolute', bottom: '-12px', right: '-12px', width: '24px', height: '24px',
            background: '#ffc107', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#1a3a5c'
          }}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px', width: '100%', padding: sidebarCollapsed ? '12px' : '12px 20px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
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
      <main style={{
        flex: 1, marginLeft: isMobile ? '0' : sidebarWidth,
        transition: 'margin-left 0.3s ease', padding: '20px', width: '100%', overflowX: 'auto'
      }}>
        {/* Top Bar */}
        <div style={{
          background: 'white', padding: '10px 20px', borderRadius: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: isMobile ? 'block' : 'none' }}>
              <i className="fas fa-bars"></i>
            </button>
            <h2 style={{ color: '#1a3a5c', margin: 0 }}>Super Admin Dashboard</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', background: '#1a3a5c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fas fa-crown"></i>
            </div>
            <div>
              <div style={{ fontWeight: '600' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Super Admin</div>
            </div>
          </div>
        </div>

        <h1 style={{ color: '#1a3a5c', marginBottom: '20px' }}>Welcome, {userName}! 👑</h1>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: '1rem', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-users-cog" style={{ fontSize: '2rem', color: '#27ae60' }}></i>
                <h3>{admins.length}</h3>
                <p>Sub-Admins</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-bullhorn" style={{ fontSize: '2rem', color: '#f39c12' }}></i>
                <h3>{announcements.length}</h3>
                <p>Announcements</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-gavel" style={{ fontSize: '2rem', color: '#e74c3c' }}></i>
                <h3>{disciplineStats.total || 0}</h3>
                <p>Discipline Cases</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-file-alt" style={{ fontSize: '2rem', color: '#9b59b6' }}></i>
                <h3>{permissionTrends.total || 0}</h3>
                <p>Permissions</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button onClick={handleCreateAdmin} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-user-plus"></i> Create Sub-Admin
              </button>
              <button onClick={handlePostAnnouncement} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-bullhorn"></i> Post Announcement
              </button>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3>Quick Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: '1rem', marginTop: '1rem' }}> <div style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>{disciplineStats.pending || 0}</div>
                  <div style={{ fontSize: '0.8rem' }}>Pending Cases</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#27ae60' }}>{permissionTrends.approved || 0}</div>
                  <div style={{ fontSize: '0.8rem' }}>Approved Permissions</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#f39c12' }}>{permissionTrends.pending || 0}</div>
                  <div style={{ fontSize: '0.8rem' }}>Pending Permissions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admins Tab - Similar to before */}
        {activeTab === 'admins' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>System Administrators</h2>
              <button onClick={handleCreateAdmin} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Add Admin
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: '#1a3a5c', color: 'white' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Phone</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>{admin.fullName}</td>
                    <td style={{ padding: '12px' }}>{admin.email}</td>
                    <td style={{ padding: '12px' }}>{admin.role}</td>
                    <td style={{ padding: '12px' }}>{admin.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDeleteAdmin(admin)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>School Announcements</h2>
              <button onClick={handlePostAnnouncement} style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Post Announcement
              </button>
            </div>
            {announcements.map(ann => (
              <div key={ann._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#1a3a5c' }}>{ann.title}</h3>
                    <span style={{ 
                      background: ann.priority === 'urgent' ? '#e74c3c' : ann.priority === 'high' ? '#f39c12' : '#27ae60',
                      color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', display: 'inline-block', marginTop: '5px'
                    }}>
                      {ann.priority}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(ann._id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
                <p style={{ marginTop: '10px', color: '#666' }}>{ann.content}</p>
                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '8px' }}>
                  Posted on {new Date(ann.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Discipline Cases Tab */}
        {activeTab === 'discipline' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Discipline Cases</h2>
            {disciplineCases.map(c => (
              <div key={c._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.studentName || 'Student'}</strong> - {c.category}
                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>{c.description}</p>
                  </div>
                  {c.status === 'pending' ? (
                    <button onClick={() => handleDisciplineAction(c)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      Take Action
                    </button>
                  ) : (
                    <span style={{ color: '#27ae60' }}>✓ {c.action}</span>
                  )}
                </div>
              </div>
            ))}
            {disciplineCases.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No discipline cases reported.</p>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Permission Requests</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#d4edda', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                  Approved: {permissionTrends.approved || 0}
                </span>
                <span style={{ background: '#fff3cd', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                  Pending: {permissionTrends.pending || 0}
                </span>
                <span style={{ background: '#f8d7da', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                  Rejected: {permissionTrends.rejected || 0}
                </span>
              </div>
            </div>
            {permissions.map(p => (
              <div key={p._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong>{p.requesterName}</strong> ({p.requesterRole})
                    <p style={{ margin: '5px 0', color: '#666' }}>{p.reason}</p>
                    <small>{new Date(p.fromDate).toLocaleDateString()} - {new Date(p.toDate).toLocaleDateString()}</small>
                  </div>
                  {p.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handlePermissionAction(p, 'approved')} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                        Approve
                      </button>
                      <button onClick={() => handlePermissionAction(p, 'rejected')} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ 
                      background: p.status === 'approved' ? '#d4edda' : '#f8d7da',
                      color: p.status === 'approved' ? '#155724' : '#721c24',
                      padding: '4px 12px', borderRadius: '4px'
                    }}>
                      {p.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {permissions.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No permission requests.</p>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : '70vh' }}>
            <div style={{
              width: isMobile ? '100%' : '30%',
              borderRight: isMobile ? 'none' : '1px solid #e0e0e0',
              borderBottom: isMobile ? '1px solid #e0e0e0' : 'none',
              overflowY: 'auto',
              maxHeight: isMobile ? '200px' : 'auto'
            }}>
              <div style={{ padding: '1rem' }}>Users</div>
              {users.map(user => (
                <div key={user._id} onClick={() => { setSelectedUser(user); fetchMessages(user._id); }} style={{ padding: '1rem', cursor: 'pointer', background: selectedUser?._id === user._id ? '#f0f4f8' : 'white' }}>
                  <strong>{user.fullName}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.role}</div>
                </div>
              ))}
            </div>
            <div style={{ width: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column' }}>
              {selectedUser ? (
                <>
                  <div style={{ padding: '1rem', background: '#1a3a5c', color: 'white' }}><strong>{selectedUser.fullName}</strong></div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', height: '300px' }}>
                    {messages.map(msg => (
                      <div key={msg._id} style={{ textAlign: msg.senderId === localStorage.getItem('userId') ? 'right' : 'left', marginBottom: '1rem' }}>
                        <div style={{ display: 'inline-block', maxWidth: '70%', padding: '8px 12px', borderRadius: '12px', background: msg.senderId === localStorage.getItem('userId') ? '#1a3a5c' : '#f0f4f8', color: msg.senderId === localStorage.getItem('userId') ? 'white' : '#333' }}>
                          <div><strong>{msg.senderName}</strong></div>
                          <div>{msg.content}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <button onClick={handleSendMessage} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>Select a user to chat</div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <i className="fas fa-crown" style={{ fontSize: '2.5rem', color: '#1a3a5c' }}></i>
            </div>
            <h2>{userName}</h2>
            <p style={{ color: '#ffc107' }}>Super Administrator</p>
            <hr />
            <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <p><strong>Email:</strong> {localStorage.getItem('userEmail')}</p>
              <p><strong>Role:</strong> Super Admin</p>
              <p><strong>Permissions:</strong> Full system access</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;