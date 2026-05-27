import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import ChatModal from '../components/ChatModal';

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
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [chatActiveTab, setChatActiveTab] = useState('inbox');
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  const navigate = useNavigate();
  const API_URL = 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('portalToken');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setMobileMenuOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    const userId = localStorage.getItem('userId');
    if (userId) newSocket.emit('join', userId);
    newSocket.on('newMessage', () => {
      fetchUnreadCount();
      fetchUsers();
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
        fetch(`${API_URL}/super-admin/admins`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/discipline-cases`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/super-admin/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (adminsRes.ok) setAdmins(await adminsRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setUsers(await response.json());
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setMessages(await response.json());
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
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
    if (!messageText.trim() || !selectedConversation) return;
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiverId: selectedConversation.participant.id,
          content: messageText
        })
      });
      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage.message]);
        setMessageText('');
        if (socket) socket.emit('sendMessage', { receiverId: selectedConversation.participant.id, ...newMessage.message });
        fetchUsers();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectConversation = (user) => {
    setSelectedConversation({ participant: user });
    fetchMessages(user._id);
  };

  const handleNewMessage = () => {
    setChatActiveTab('new');
    setSelectedConversation(null);
    setMessages([]);
  };

  const handleSendNewMessage = async (e) => {
    e.preventDefault();
    const receiverId = document.getElementById('newMessageReceiver')?.value;
    const content = document.getElementById('newMessageContent')?.value;
    
    if (!receiverId || !content) {
      Swal.fire('Error', 'Please select recipient and enter message', 'error');
      return;
    }
    
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId, content, subject: 'New Message' })
      });
      if (response.ok) {
        Swal.fire('Success', 'Message sent successfully!', 'success');
        setChatActiveTab('inbox');
        fetchUsers();
        fetchUnreadCount();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to send message', 'error');
    }
  };

  const handleOpenChatModal = (user = null) => {
    if (user) setSelectedChatUser(user);
    setIsChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedChatUser(null);
    fetchUnreadCount();
  };

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
            <option value="academic_admin">📚 Academic Admin</option>
            <option value="discipline_admin">⚖️ Discipline Admin</option>
            <option value="accounts_admin">💰 Accounts Admin</option>
          </select>
        </div>
      `,
      confirmButtonText: 'Create Admin',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        if (!fullName || !email) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          fullName, email,
          password: document.getElementById('password')?.value || 'admin123',
          phone: document.getElementById('phone')?.value || '',
          role: document.getElementById('role')?.value
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      if (response.ok) {
        Swal.fire({ title: '✅ Admin Created!', html: `<p><strong>Name:</strong> ${formValues.fullName}</p><p><strong>Email:</strong> ${formValues.email}</p><p><strong>Password:</strong> <code>${formValues.password}</code></p>`, icon: 'success' });
        fetchAllData();
      } else {
        Swal.fire('Error', 'Failed to create admin', 'error');
      }
    }
  };

  const handlePostAnnouncement = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Post Announcement',
      html: `
        <div style="text-align: left;">
          <input type="text" id="title" class="swal2-input" placeholder="Title *" required>
          <textarea id="content" class="swal2-textarea" placeholder="Content *" rows="4" required></textarea>
          <select id="audience" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="all">📢 All Users</option>
            <option value="students">🎓 Students</option>
            <option value="teachers">👨‍🏫 Teachers</option>
            <option value="parents">👪 Parents</option>
            <option value="admins">👑 Admins</option>
          </select>
          <select id="priority" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="normal">ℹ️ Normal</option>
            <option value="high">⚠️ High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
      `,
      confirmButtonText: '📢 Post Announcement',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const title = document.getElementById('title')?.value;
        const content = document.getElementById('content')?.value;
        if (!title || !content) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          title, content,
          audience: document.getElementById('audience')?.value,
          priority: document.getElementById('priority')?.value
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/super-admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      if (response.ok) {
        Swal.fire('✅ Success!', 'Announcement posted successfully', 'success');
        fetchAllData();
      }
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const result = await Swal.fire({
      title: 'Delete Admin?',
      text: `Remove ${admin.fullName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      const token = getToken();
      await fetch(`${API_URL}/super-admin/admins/${admin._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Deleted!', 'Admin removed successfully', 'success');
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
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      const token = getToken();
      await fetch(`${API_URL}/super-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Deleted!', 'Announcement removed', 'success');
      fetchAllData();
    }
  };

  const handleDisciplineAction = async (disciplineCase) => {
    const { value: action } = await Swal.fire({
      title: `Action for ${disciplineCase.studentName || 'Student'}`,
      html: `<p class="case-description">📝 ${disciplineCase.description}</p>`,
      input: 'select',
      inputOptions: { warning: '⚠️ Warning', detention: '📝 Detention', community_service: '🤝 Community Service', suspension: '🚫 Suspension', expulsion: '❌ Expulsion' },
      inputPlaceholder: 'Select action',
      showCancelButton: true,
      confirmButtonText: 'Apply Action',
      confirmButtonColor: '#e74c3c'
    });
    if (action) {
      const { value: details } = await Swal.fire({
        title: 'Action Details',
        input: 'textarea',
        inputLabel: 'Additional details',
        inputPlaceholder: 'e.g., Suspended for 3 days...',
        showCancelButton: true,
        confirmButtonText: 'Submit'
      });
      const token = getToken();
      await fetch(`${API_URL}/super-admin/discipline-cases/${disciplineCase._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, actionDetails: details || '', status: 'resolved' })
      });
      Swal.fire('Action Applied!', `Student has been ${action}`, 'success');
      fetchAllData();
    }
  };

  const handlePermissionAction = async (permission, status) => {
    const result = await Swal.fire({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} Permission`,
      text: `${permission.requesterName} requested: ${permission.reason}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: status === 'approved' ? '✅ Approve' : '❌ Reject',
      confirmButtonColor: status === 'approved' ? '#27ae60' : '#e74c3c',
      input: status === 'rejected' ? 'textarea' : null,
      inputLabel: status === 'rejected' ? 'Reason for rejection' : ''
    });
    if (result.isConfirmed) {
      const token = getToken();
      await fetch(`${API_URL}/super-admin/permissions/${permission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, rejectionReason: result.value || '' })
      });
      Swal.fire(`Permission ${status}!`, '', 'success');
      fetchAllData();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'admins', label: 'Sub-Admins', icon: 'fas fa-users-cog', color: '#27ae60' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn', color: '#f39c12' },
    { id: 'discipline', label: 'Discipline', icon: 'fas fa-gavel', color: '#e74c3c' },
    { id: 'permissions', label: 'Permissions', icon: 'fas fa-file-alt', color: '#9b59b6' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-comments', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-cog', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
  const sidebarWidthMobile = mobileMenuOpen ? sidebarWidth : '0px';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-crown"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Super Admin</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-crown"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Super Administrator</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}>
              <i className={item.icon} style={{ color: item.color }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.id === 'messages' && unreadCount > 0 && !sidebarCollapsed && <span className="nav-badge">{unreadCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i>{!sidebarCollapsed && <span>Logout</span>}</button>
        </div>
      </aside>

      <main className="main-content" style={{ marginLeft: isMobile ? '0' : sidebarWidth }}>
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><i className="fas fa-bars"></i></button>
            <h2>Super Admin Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-user-shield"></i></div>
              <div className="user-details"><span className="user-name">{userName}</span><span className="user-role-badge">Super Admin</span></div>
            </div>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-text"><h1>Welcome back, {userName.split(' ')[0]}! 👑</h1><p>Here's what's happening across your school management system today.</p></div>
          <div className="welcome-date"><i className="fas fa-calendar-alt"></i><span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-users-cog" style={{ color: '#27ae60' }}></i></div><div className="stat-info"><h3>{admins.length}</h3><p>Sub-Admins</p><span className="stat-trend positive">+{admins.filter(a => a.createdAt && new Date(a.createdAt).getMonth() === new Date().getMonth()).length} this month</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-bullhorn" style={{ color: '#f39c12' }}></i></div><div className="stat-info"><h3>{announcements.length}</h3><p>Announcements</p><span className="stat-trend">{announcements.filter(a => a.priority === 'urgent').length} urgent</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-gavel" style={{ color: '#e74c3c' }}></i></div><div className="stat-info"><h3>{disciplineStats.total || 0}</h3><p>Discipline Cases</p><span className="stat-trend negative">{disciplineStats.pending || 0} pending</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#f3e5f5' }}><i className="fas fa-file-alt" style={{ color: '#9b59b6' }}></i></div><div className="stat-info"><h3>{permissionTrends.total || 0}</h3><p>Permissions</p><span className="stat-trend">{permissionTrends.approved || 0} approved</span></div></div>
            </div>

            <div className="quick-actions">
              <button onClick={handleCreateAdmin} className="action-btn primary"><i className="fas fa-user-plus"></i> Create Sub-Admin</button>
              <button onClick={handlePostAnnouncement} className="action-btn secondary"><i className="fas fa-bullhorn"></i> Post Announcement</button>
            </div>

            <div className="pending-items-grid">
              <div className="pending-card"><h3><i className="fas fa-gavel"></i> Pending Discipline Cases</h3>
                {disciplineCases.filter(c => c.status === 'pending').slice(0, 5).map(c => (
                  <div key={c._id} className="pending-item"><div className="item-info"><strong>{c.studentName || 'Student'}</strong><p>{c.category}</p></div><button onClick={() => handleDisciplineAction(c)} className="item-action">Review</button></div>
                ))}
                {disciplineCases.filter(c => c.status === 'pending').length === 0 && <p className="no-items">No pending discipline cases</p>}
              </div>
              <div className="pending-card"><h3><i className="fas fa-file-alt"></i> Pending Permissions</h3>
                {permissions.filter(p => p.status === 'pending').slice(0, 5).map(p => (
                  <div key={p._id} className="pending-item"><div className="item-info"><strong>{p.requesterName}</strong><p>{p.type}</p></div><div className="item-actions"><button onClick={() => handlePermissionAction(p, 'approved')} className="approve-btn">✓</button><button onClick={() => handlePermissionAction(p, 'rejected')} className="reject-btn">✗</button></div></div>
                ))}
                {permissions.filter(p => p.status === 'pending').length === 0 && <p className="no-items">No pending permissions</p>}
              </div>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-users-cog"></i> System Administrators</h2><button onClick={handleCreateAdmin} className="btn-primary-sm"><i className="fas fa-plus"></i> Add Admin</button></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Admin</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th></tr></thead><tbody>
              {admins.map(admin => (<tr key={admin._id}><td><strong>{admin.fullName}</strong></td><td>{admin.email}</td><td><span className={`role-badge ${admin.role}`}>{admin.role?.replace('_', ' ')}</span></td><td>{admin.phone || '-'}</td><td><button onClick={() => handleDeleteAdmin(admin)} className="delete-btn-sm"><i className="fas fa-trash"></i></button></td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-bullhorn"></i> School Announcements</h2><button onClick={handlePostAnnouncement} className="btn-primary-sm"><i className="fas fa-plus"></i> Post Announcement</button></div>
            <div className="announcements-list">{announcements.map(ann => (<div key={ann._id} className={`announcement-item ${ann.priority}`}><div className="announcement-header"><div><h3>{ann.title}</h3><span className={`priority-badge ${ann.priority}`}>{ann.priority === 'urgent' ? '🔴 URGENT' : ann.priority === 'high' ? '⚠️ HIGH' : 'ℹ️ NORMAL'}</span></div><button onClick={() => handleDeleteAnnouncement(ann._id)} className="delete-btn-sm"><i className="fas fa-trash"></i></button></div><p>{ann.content}</p><div className="announcement-footer"><span><i className="fas fa-users"></i> {ann.audience === 'all' ? 'All Users' : ann.audience}</span><span><i className="fas fa-calendar"></i> {new Date(ann.createdAt).toLocaleDateString()}</span></div></div>))}
            {announcements.length === 0 && <p className="no-data">No announcements yet.</p>}</div>
          </div>
        )}

        {/* Discipline Tab */}
        {activeTab === 'discipline' && (
          <div className="data-card">
            <h2><i className="fas fa-gavel"></i> Discipline Cases</h2>
            <div className="discipline-stats"><div className="stat-chip">Total: {disciplineStats.total || 0}</div><div className="stat-chip pending">Pending: {disciplineStats.pending || 0}</div><div className="stat-chip resolved">Resolved: {disciplineStats.resolved || 0}</div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Student</th><th>Category</th><th>Description</th><th>Reported By</th><th>Status</th><th>Action</th></tr></thead><tbody>
              {disciplineCases.map(c => (<tr key={c._id}><td><strong>{c.studentName || 'Student'}</strong></td><td>{c.category}</td><td>{c.description?.substring(0, 60)}...</td><td>{c.reporterName || 'Teacher'}</td><td><span className={`status-badge ${c.status}`}>{c.status}</span></td><td>{c.status === 'pending' ? <button onClick={() => handleDisciplineAction(c)} className="review-btn">Review</button> : <span className="action-text">{c.action}</span>}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="data-card">
            <h2><i className="fas fa-file-alt"></i> Permission Requests</h2>
            <div className="permission-stats"><div className="stat-chip approved">Approved: {permissionTrends.approved || 0}</div><div className="stat-chip pending">Pending: {permissionTrends.pending || 0}</div><div className="stat-chip rejected">Rejected: {permissionTrends.rejected || 0}</div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Requester</th><th>Type</th><th>Reason</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {permissions.map(p => (<tr key={p._id}><td><strong>{p.requesterName}</strong><br/><small>{p.requesterRole}</small></td><td>{p.type}</td><td>{p.reason?.substring(0, 50)}...</td><td><small>{new Date(p.fromDate).toLocaleDateString()} to {new Date(p.toDate).toLocaleDateString()}</small></td><td><span className={`status-badge ${p.status}`}>{p.status}</span></td><td>{p.status === 'pending' ? (<div className="action-buttons"><button onClick={() => handlePermissionAction(p, 'approved')} className="approve-btn-sm">Approve</button><button onClick={() => handlePermissionAction(p, 'rejected')} className="reject-btn-sm">Reject</button></div>) : <span className="action-text">{p.action || p.status}</span>}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="messages-container">
            <div className="messages-header"><div className="messages-tabs"><button className={`msg-tab ${chatActiveTab === 'inbox' ? 'active' : ''}`} onClick={() => setChatActiveTab('inbox')}><i className="fas fa-inbox"></i> Inbox {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}</button><button className={`msg-tab ${chatActiveTab === 'new' ? 'active' : ''}`} onClick={handleNewMessage}><i className="fas fa-pen-alt"></i> New Message</button></div></div>
            {chatActiveTab === 'inbox' ? (
              <div className="inbox-container">
                <div className="conversations-list"><div className="search-conversations"><i className="fas fa-search"></i><input type="text" placeholder="Search conversations..." /></div>
                  {users.map(user => (<div key={user._id} className={`conversation-item ${selectedConversation?.participant?._id === user._id ? 'active' : ''}`} onClick={() => handleSelectConversation(user)}><div className="conv-avatar"><i className={`fas ${user.role === 'teacher' ? 'fa-chalkboard-user' : user.role === 'student' ? 'fa-user-graduate' : user.role === 'parent' ? 'fa-users' : 'fa-user'}`}></i></div><div className="conv-info"><div className="conv-name">{user.fullName}</div><div className="conv-role">{user.role}</div></div></div>))}
                  {users.length === 0 && <p className="no-conversations">No conversations yet</p>}
                </div>
                <div className="messages-area">
                  {selectedConversation ? (
                    <>
                      <div className="messages-header-info"><div className="conv-avatar-large"><i className={`fas ${selectedConversation.participant.role === 'teacher' ? 'fa-chalkboard-user' : 'fa-user'}`}></i></div><div><h3>{selectedConversation.participant.fullName}</h3><p>{selectedConversation.participant.role}</p></div></div>
                      <div className="messages-list">{messages.map(msg => (<div key={msg._id} className={`message-bubble ${msg.senderId === localStorage.getItem('userId') ? 'sent' : 'received'}`}><div className="message-text">{msg.content}</div><div className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</div></div>))}</div>
                      <div className="message-input-area"><textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}></textarea><button onClick={handleSendMessage}><i className="fas fa-paper-plane"></i></button></div>
                    </>
                  ) : <div className="no-conversation-selected"><i className="fas fa-comments"></i><h3>No conversation selected</h3><p>Select a user to start messaging</p></div>}
                </div>
              </div>
            ) : (
              <div className="new-message-container"><form onSubmit={handleSendNewMessage}><div className="form-group"><label>Select Recipient</label><select id="newMessageReceiver" required><option value="">Select User</option>{users.map(user => (<option key={user._id} value={user._id}>{user.fullName} ({user.role})</option>))}</select></div><div className="form-group"><label>Message</label><textarea id="newMessageContent" rows="8" placeholder="Type your message here..." required></textarea></div><button type="submit" className="send-message-btn"><i className="fas fa-paper-plane"></i> Send Message</button></form></div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card"><div className="profile-header"><div className="profile-avatar"><i className="fas fa-crown"></i></div><h2>{userName}</h2><p className="profile-role">Super Administrator</p></div>
            <div className="profile-details"><div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email Address</label><p>{localStorage.getItem('userEmail') || 'admin@essa.rw'}</p></div></div>
            <div className="detail-item"><i className="fas fa-shield-alt"></i><div><label>Role</label><p>Super Administrator</p></div></div>
            <div className="detail-item"><i className="fas fa-key"></i><div><label>Permissions</label><p>Full System Access</p></div></div></div>
          </div>
        )}
      </main>

      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChatModal} recipient={selectedChatUser} onMessageSent={fetchUnreadCount} />

      <style>{`
        .super-admin-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #1a3a5c, #0d2b42); color: white; }
        .loading-spinner { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-top-color: #ffc107; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mobile-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 998; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; background: linear-gradient(180deg, #1a3a5c 0%, #0d2b42 100%); color: white; transition: width 0.3s ease; overflow: hidden; display: flex; flex-direction: column; z-index: 999; box-shadow: 2px 0 10px rgba(0,0,0,0.1); }
        .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 45px; height: 45px; background: #ffc107; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .logo-icon i { font-size: 1.5rem; color: #1a3a5c; }
        .logo-text h3 { margin: 0; font-size: 1rem; }
        .logo-text p { margin: 0; font-size: 0.7rem; opacity: 0.8; }
        .collapse-btn { position: absolute; bottom: -12px; right: -12px; width: 24px; height: 24px; background: #ffc107; border: none; border-radius: 50%; cursor: pointer; color: #1a3a5c; }
        .user-profile { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .user-avatar { width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; }
        .user-avatar i { font-size: 1.8rem; color: #ffc107; }
        .user-info h4 { margin: 0; font-size: 0.9rem; }
        .user-role { font-size: 0.7rem; opacity: 0.8; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 20px; background: transparent; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; transition: all 0.3s; position: relative; }
        .nav-item i { width: 20px; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #ffc107; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: #ffc107; border-right: 3px solid #ffc107; }
        .nav-badge { position: absolute; right: 20px; background: #e74c3c; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; min-width: 18px; text-align: center; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .logout-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .main-content { transition: margin-left 0.3s ease; padding: 20px; min-height: 100vh; }
        .top-bar { background: white; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .top-bar-left { display: flex; align-items: center; gap: 15px; }
        .mobile-menu-btn { display: none; background: #1a3a5c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 25px 30px; margin-bottom: 25px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .welcome-text h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .welcome-date { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 30px; font-size: 0.85rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { font-size: 1.5rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 5px 0 0; color: #666; font-size: 0.85rem; }
        .stat-trend { font-size: 0.7rem; display: block; margin-top: 5px; }
        .stat-trend.positive { color: #27ae60; }
        .stat-trend.negative { color: #e74c3c; }
        .quick-actions { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; }
        .action-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .action-btn.primary { background: #27ae60; color: white; }
        .action-btn.secondary { background: #3498db; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .pending-items-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .pending-card { background: white; border-radius: 16px; padding: 20px; }
        .pending-card h3 { margin-bottom: 15px; color: #1a3a5c; font-size: 1rem; }
        .pending-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
        .item-info strong { display: block; font-size: 0.85rem; }
        .item-info p { font-size: 0.75rem; color: #666; margin: 2px 0 0; }
        .item-action { background: #f39c12; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; }
        .item-actions { display: flex; gap: 5px; }
        .approve-btn { background: #27ae60; color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
        .reject-btn { background: #e74c3c; color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
        .no-items { text-align: center; padding: 20px; color: #999; font-size: 0.85rem; }
        .data-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .btn-primary-sm { background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .delete-btn-sm { background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 10px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; font-size: 0.8rem; }
        .data-table td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 0.8rem; }
        .role-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .role-badge.academic_admin { background: #e8f5e9; color: #27ae60; }
        .role-badge.discipline_admin { background: #fdecea; color: #e74c3c; }
        .role-badge.accounts_admin { background: #e3f2fd; color: #3498db; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .status-badge.pending { background: #fff3e0; color: #f39c12; }
        .status-badge.approved { background: #e8f5e9; color: #27ae60; }
        .status-badge.rejected { background: #fdecea; color: #e74c3c; }
        .announcements-list { display: flex; flex-direction: column; gap: 15px; }
        .announcement-item { padding: 15px; border-radius: 12px; background: #f8f9fa; border-left: 3px solid; }
        .announcement-item.urgent { border-left-color: #e74c3c; background: #fdecea; }
        .announcement-item.high { border-left-color: #f39c12; background: #fff3e0; }
        .announcement-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .announcement-header h3 { margin: 0; font-size: 1rem; }
        .priority-badge { font-size: 0.7rem; margin-left: 10px; padding: 2px 6px; border-radius: 4px; }
        .priority-badge.urgent { background: #e74c3c; color: white; }
        .priority-badge.high { background: #f39c12; color: white; }
        .priority-badge.normal { background: #27ae60; color: white; }
        .announcement-footer { margin-top: 10px; display: flex; gap: 15px; font-size: 0.7rem; color: #999; }
        .discipline-stats, .permission-stats { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-chip { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .stat-chip.pending { background: #fff3e0; color: #f39c12; }
        .stat-chip.resolved, .stat-chip.approved { background: #e8f5e9; color: #27ae60; }
        .stat-chip.rejected { background: #fdecea; color: #e74c3c; }
        .action-buttons { display: flex; gap: 8px; }
        .approve-btn-sm { background: #27ae60; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
        .reject-btn-sm { background: #e74c3c; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
        .review-btn { background: #f39c12; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 500px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; }
        .profile-avatar { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 2.5rem; color: #ffc107; }
        .profile-header h2 { margin: 0; font-size: 1.3rem; }
        .profile-role { opacity: 0.9; margin-top: 5px; font-size: 0.85rem; }
        .profile-details { padding: 20px; }
        .detail-item { display: flex; gap: 15px; padding: 12px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1rem; color: #1a3a5c; width: 25px; }
        .detail-item label { display: block; font-size: 0.7rem; color: #999; }
        .detail-item p { margin: 0; font-weight: 500; font-size: 0.85rem; }

        /* Messages Tab Styles */
        .messages-container { background: white; border-radius: 16px; overflow: hidden; height: calc(100vh - 200px); min-height: 500px; display: flex; flex-direction: column; }
        .messages-header { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background: white; }
        .messages-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
        .msg-tab { padding: 8px 20px; background: #f0f2f5; border: none; border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.3s; display: flex; align-items: center; gap: 8px; }
        .msg-tab.active { background: #1a3a5c; color: white; }
        .msg-tab .unread-count { background: #e74c3c; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; margin-left: 5px; }
        .inbox-container { display: flex; flex: 1; overflow: hidden; }
        .conversations-list { width: 30%; border-right: 1px solid #e0e0e0; overflow-y: auto; background: #f8f9fa; }
        .search-conversations { padding: 15px; position: relative; border-bottom: 1px solid #e0e0e0; }
        .search-conversations i { position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: #999; }
        .search-conversations input { width: 100%; padding: 8px 8px 8px 35px; border: 1px solid #ddd; border-radius: 20px; font-size: 0.85rem; }
        .conversation-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #eee; }
        .conversation-item:hover { background: #e8f0fe; }
        .conversation-item.active { background: #e3f2fd; border-left: 3px solid #ffc107; }
        .conv-avatar { width: 40px; height: 40px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-role { font-size: 0.7rem; color: #ffc107; }
        .no-conversations { text-align: center; padding: 40px; color: #999; }
        .messages-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .messages-header-info { display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #e0e0e0; background: white; }
        .conv-avatar-large { width: 50px; height: 50px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
        .messages-header-info h3 { margin: 0; font-size: 1rem; }
        .messages-header-info p { margin: 0; font-size: 0.7rem; color: #ffc107; }
        .messages-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f8f9fa; }
        .message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 18px; }
        .message-bubble.sent { align-self: flex-end; background: #1a3a5c; color: white; border-bottom-right-radius: 4px; }
        .message-bubble.received { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .message-time { font-size: 0.6rem; opacity: 0.7; margin-top: 5px; text-align: right; }
        .message-input-area { display: flex; gap: 10px; padding: 15px; border-top: 1px solid #e0e0e0; background: white; }
        .message-input-area textarea { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; resize: none; font-family: inherit; font-size: 0.85rem; }
        .message-input-area textarea:focus { outline: none; border-color: #1a3a5c; }
        .message-input-area button { width: 45px; height: 45px; background: #1a3a5c; color: white; border: none; border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .message-input-area button:hover { background: #ffc107; color: #1a3a5c; transform: scale(1.05); }
        .no-conversation-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; text-align: center; gap: 15px; }
        .no-conversation-selected i { font-size: 4rem; opacity: 0.3; }
        .new-message-container { flex: 1; padding: 30px; max-width: 600px; margin: 0 auto; width: 100%; }
        .send-message-btn { width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 15px; }

        /* Responsive */
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .welcome-text h1 { font-size: 1.2rem; }
          .stats-grid { grid-template-columns: 1fr; }
          .pending-items-grid { grid-template-columns: 1fr; }
          .quick-actions { flex-direction: column; }
          .inbox-container { flex-direction: column; }
          .conversations-list { width: 100%; max-height: 200px; border-right: none; border-bottom: 1px solid #e0e0e0; }
          .message-bubble { max-width: 85%; }
          .messages-tabs { width: 100%; justify-content: center; }
          .sidebar { width: ${sidebarWidthMobile}; }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;