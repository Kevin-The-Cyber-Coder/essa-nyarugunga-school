import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import ChatModal from '../components/ChatModal';

const API_URL = 'http://localhost:5000/api';

const ParentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Child selector
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [disciplineRecords, setDisciplineRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Chat states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const navigate = useNavigate();
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

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    const userId = localStorage.getItem('userId');
    if (userId) newSocket.emit('join', userId);
    newSocket.on('newMessage', () => fetchUnreadCount());
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (!token || role !== 'parent') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Parent');
      fetchChildren();
      fetchUnreadCount();
    }
  }, [navigate]);

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  };

  const fetchChildren = async () => {
    try {
      const data = await apiRequest('/parent/children');
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
        fetchChildData(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    setLoading(true);
    try {
      const [dashboard, gradesData, attendanceData, feeData, assignmentsData, announcementsData, eventsData, disciplineData, documentsData] = await Promise.all([
        apiRequest(`/parent/children/${childId}/dashboard`).catch(() => null),
        apiRequest(`/parent/children/${childId}/grades`).catch(() => []),
        apiRequest(`/parent/children/${childId}/attendance`).catch(() => []),
        apiRequest(`/parent/children/${childId}/fees`).catch(() => null),
        apiRequest(`/parent/children/${childId}/assignments`).catch(() => []),
        apiRequest(`/parent/children/${childId}/announcements`).catch(() => []),
        apiRequest(`/parent/children/${childId}/events`).catch(() => []),
        apiRequest(`/parent/children/${childId}/discipline`).catch(() => []),
        apiRequest(`/parent/children/${childId}/documents`).catch(() => [])
      ]);
      
      setDashboardData(dashboard);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setFeeStatus(feeData);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setDisciplineRecords(Array.isArray(disciplineData) ? disciplineData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Error fetching child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (child) => {
    setSelectedChild(child);
    fetchChildData(child._id);
    setShowChildSelector(false);
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest('/messages/unread/count').catch(() => ({ count: 0 }));
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleOpenChat = (user = null) => {
    if (user) setSelectedChatUser(user);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedChatUser(null);
    fetchUnreadCount();
  };

  const handleDownloadDocument = (doc) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      Swal.fire('Download', `Downloading ${doc.name}`, 'info');
    }
  };

  const handlePayOnline = () => {
    Swal.fire({
      title: 'Pay Online',
      html: `
        <div style="text-align: left;">
          <p>Amount Due: <strong>${feeStatus?.balance?.toLocaleString() || 0} RWF</strong></p>
          <p>Select Payment Method:</p>
          <select id="paymentMethod" class="swal2-select">
            <option value="mobile">Mobile Money</option>
            <option value="card">Credit/Debit Card</option>
            <option value="bank">Bank Transfer</option>
          </select>
          <input type="text" id="amount" class="swal2-input" placeholder="Amount to Pay" value="${feeStatus?.balance || 0}">
        </div>
      `,
      confirmButtonText: 'Pay Now',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const amount = document.getElementById('amount').value;
        const method = document.getElementById('paymentMethod').value;
        return { amount, method };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Payment Initiated', `You will be redirected to complete payment of ${parseInt(result.value.amount).toLocaleString()} RWF via ${result.value.method}`, 'success');
      }
    });
  };

  const handleRequestPermission = async () => {
    if (!selectedChild) return;
    
    const { value: formValues } = await Swal.fire({
      title: `Request Permission for ${selectedChild.name}`,
      html: `
        <div class="admin-form">
          <div class="form-group"><input type="text" id="type" class="swal2-input" placeholder="Permission Type (e.g., Leave, Event)" required></div>
          <div class="form-group"><textarea id="reason" class="swal2-textarea" placeholder="Reason" rows="3" required></textarea></div>
          <div class="form-group"><input type="date" id="fromDate" class="swal2-input" required></div>
          <div class="form-group"><input type="date" id="toDate" class="swal2-input" required></div>
        </div>
      `,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      preConfirm: () => {
        const type = document.getElementById('type').value;
        const reason = document.getElementById('reason').value;
        if (!type || !reason) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { type, reason, fromDate: document.getElementById('fromDate').value, toDate: document.getElementById('toDate').value, childId: selectedChild._id };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/permissions/request', { method: 'POST', body: JSON.stringify({ ...formValues, requesterRole: 'parent' }) });
        Swal.fire('Request Sent!', 'Your permission request has been submitted', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to submit request', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'academic', label: 'Academic Performance', icon: 'fas fa-graduation-cap', color: '#27ae60' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-calendar-check', color: '#f39c12' },
    { id: 'fees', label: 'Fee & Payments', icon: 'fas fa-money-bill-wave', color: '#9b59b6' },
    { id: 'homework', label: 'Homework', icon: 'fas fa-tasks', color: '#1abc9c' },
    { id: 'events', label: 'Events', icon: 'fas fa-calendar-alt', color: '#e74c3c' },
    { id: 'discipline', label: 'Behavior', icon: 'fas fa-gavel', color: '#c0392b' },
    { id: 'documents', label: 'Documents', icon: 'fas fa-folder-open', color: '#34495e' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog', color: '#7f8c8d' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
  const sidebarWidthMobile = mobileMenuOpen ? sidebarWidth : '0px';

  // Calculate statistics
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-users"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Parent</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-user-friends"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Parent</span>
            </div>
          )}
        </div>

        {/* Child Selector */}
        <div className="child-selector">
          <button className="child-selector-btn" onClick={() => setShowChildSelector(!showChildSelector)}>
            <i className="fas fa-child"></i>
            {!sidebarCollapsed && (
              <span>{selectedChild?.name || 'Select Child'}</span>
            )}
            <i className="fas fa-chevron-down"></i>
          </button>
          {showChildSelector && (
            <div className="child-dropdown">
              {children.map(child => (
                <div key={child._id} className="child-option" onClick={() => handleChildChange(child)}>
                  <i className="fas fa-user-graduate"></i>
                  <div>
                    <strong>{child.name}</strong>
                    <p>{child.className} | {child.section}</p>
                  </div>
                  {selectedChild?._id === child._id && <i className="fas fa-check-circle"></i>}
                </div>
              ))}
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}>
              <i className={item.icon} style={{ color: item.color }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="chat-btn" onClick={() => handleOpenChat()}>
            <i className="fas fa-comments"></i>
            {!sidebarCollapsed && <span>Messages</span>}
            {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ marginLeft: isMobile ? '0' : sidebarWidth }}>
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className="fas fa-bars"></i>
            </button>
            <h2>Parent Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="child-badge" onClick={() => setShowChildSelector(!showChildSelector)}>
              <i className="fas fa-child"></i>
              <span>{selectedChild?.name || 'Select Child'}</span>
              <i className="fas fa-chevron-down"></i>
            </div>
            <div className="notification-bell" onClick={() => handleOpenChat()}>
              <i className="fas fa-envelope"></i>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-user-friends"></i></div>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role-badge">Parent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Child Info Banner */}
        {selectedChild && (
          <div className="child-info-banner">
            <div className="child-avatar"><i className="fas fa-user-graduate"></i></div>
            <div className="child-details">
              <h2>{selectedChild.name}</h2>
              <p><strong>Class:</strong> {selectedChild.className} | <strong>Section:</strong> {selectedChild.section} | <strong>Roll No:</strong> {selectedChild.rollNo}</p>
            </div>
            <button onClick={handleRequestPermission} className="request-btn"><i className="fas fa-file-alt"></i> Request Permission</button>
          </div>
        )}

        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome, {userName.split(' ')[0]}! 👪</h1>
            <p>Track your child's academic progress, attendance, fees, and more.</p>
          </div>
          <div className="welcome-date">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd' }}><i className="fas fa-chart-line" style={{ color: '#3498db' }}></i></div>
            <div className="stat-info"><h3>{avgGrade}%</h3><p>Average Grade</p><span className="stat-trend">{avgGrade >= 80 ? 'Excellent' : avgGrade >= 70 ? 'Good' : 'Average'}</span></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-calendar-check" style={{ color: '#27ae60' }}></i></div>
            <div className="stat-info"><h3>{attendanceRate}%</h3><p>Attendance Rate</p><span className="stat-trend">{attendanceRate >= 90 ? 'Excellent' : attendanceRate >= 75 ? 'Good' : 'Needs Improvement'}</span></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-tasks" style={{ color: '#f39c12' }}></i></div>
            <div className="stat-info"><h3>{assignments.filter(a => a.status === 'pending').length}</h3><p>Pending Homework</p></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-money-bill-wave" style={{ color: '#e74c3c' }}></i></div>
            <div className="stat-info"><h3>{feeStatus?.balance?.toLocaleString() || 0} RWF</h3><p>Balance Due</p></div></div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button onClick={() => setActiveTab('academic')} className="action-btn primary"><i className="fas fa-chart-line"></i> View Grades</button>
          <button onClick={() => setActiveTab('attendance')} className="action-btn warning"><i className="fas fa-calendar-check"></i> View Attendance</button>
          <button onClick={() => setActiveTab('fees')} className="action-btn success"><i className="fas fa-credit-card"></i> Pay Fees</button>
          <button onClick={handleRequestPermission} className="action-btn info"><i className="fas fa-file-alt"></i> Request Permission</button>
          <button onClick={() => handleOpenChat({ name: 'Teacher', role: 'teacher', id: 'teacher' })} className="action-btn secondary"><i className="fas fa-comment"></i> Contact Teacher</button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-content">
            <div className="two-columns">
              <div className="column">
                <div className="data-card">
                  <h3><i className="fas fa-bullhorn"></i> Recent Announcements</h3>
                  {announcements.length === 0 ? <p className="no-data">No announcements yet</p> : announcements.slice(0, 3).map(ann => (
                    <div key={ann._id} className={`announcement-item ${ann.priority}`}>
                      <h4>{ann.title}</h4>
                      <p>{ann.content}</p>
                      <small>{new Date(ann.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
                <div className="data-card">
                  <h3><i className="fas fa-calendar-alt"></i> Upcoming Events</h3>
                  {events.length === 0 ? <p className="no-data">No upcoming events</p> : events.slice(0, 3).map(event => (
                    <div key={event._id} className="event-item">
                      <div className="event-date"><span className="day">{new Date(event.date).getDate()}</span><span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span></div>
                      <div className="event-info"><h4>{event.title}</h4><p>{event.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="column">
                <div className="data-card">
                  <h3><i className="fas fa-chart-simple"></i> Recent Grades</h3>
                  {grades.length === 0 ? <p className="no-data">No grades yet</p> : grades.slice(0, 5).map(grade => (
                    <div key={grade._id} className="grade-preview"><span>{grade.subject}</span><span className={`grade-value ${grade.score >= 80 ? 'A' : grade.score >= 70 ? 'B' : grade.score >= 60 ? 'C' : 'D'}`}>{grade.grade}</span><span>{grade.score}%</span></div>
                  ))}
                </div>
                <div className="data-card">
                  <h3><i className="fas fa-tasks"></i> Recent Homework</h3>
                  {assignments.length === 0 ? <p className="no-data">No homework assigned</p> : assignments.filter(a => a.status === 'pending').slice(0, 3).map(ass => (
                    <div key={ass._id} className="homework-preview"><h4>{ass.title}</h4><p>Due: {new Date(ass.dueDate).toLocaleDateString()}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Academic Performance Tab */}
        {activeTab === 'academic' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-graduation-cap"></i> Academic Performance - {selectedChild?.name}</h2><div className="stats-badge success">Overall Average: {avgGrade}%</div></div>
            <div className="performance-chart"><canvas id="gradeChart"></canvas></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Subject</th><th>Assignment/Exam</th><th>Score</th><th>Grade</th><th>Term</th><th>Teacher Comment</th></tr></thead><tbody>
              {grades.map(grade => (<tr key={grade._id}><td><strong>{grade.subject}</strong></td><td>{grade.assignmentTitle || '-'}</td><td className={grade.score >= 80 ? 'text-success' : grade.score >= 60 ? 'text-warning' : 'text-danger'}>{grade.score}%</td><td className={grade.score >= 80 ? 'text-success' : grade.score >= 70 ? 'text-warning' : 'text-danger'}>{grade.grade}</td><td>{grade.term}</td><td className="feedback-cell">{grade.feedback || '-'}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-calendar-check"></i> Attendance Records - {selectedChild?.name}</h2><div className="stats-badge">{attendanceRate}% Overall</div></div>
            <div className="attendance-summary"><div className="summary-circle"><div className="circle-percent">{attendanceRate}%</div><p>Attendance Rate</p></div>
            <div className="summary-details"><div>✅ Present: {attendance.filter(a => a.status === 'present').length}</div><div>❌ Absent: {attendance.filter(a => a.status === 'absent').length}</div><div>⏰ Late: {attendance.filter(a => a.status === 'late').length}</div><div>📚 Total Days: {attendance.length}</div></div></div>
            <div className="attendance-chart"><canvas id="attendanceChart"></canvas></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Status</th><th>Arrival Time</th><th>Remarks</th></tr></thead><tbody>
              {attendance.map(record => (<tr key={record._id}><td>{new Date(record.date).toLocaleDateString()}</td><td className={`status-${record.status}`}>{record.status.toUpperCase()}</td><td>{record.arrivalTime || '-'}</td><td>{record.remarks || '-'}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Fee & Payments Tab */}
        {activeTab === 'fees' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-money-bill-wave"></i> Fee & Payments - {selectedChild?.name}</h2><button onClick={handlePayOnline} className="pay-now-btn"><i className="fas fa-credit-card"></i> Pay Online</button></div>
            <div className="fee-summary"><div className="fee-card"><h4>Total Fees</h4><div className="amount">{feeStatus?.total?.toLocaleString() || 0} RWF</div></div>
            <div className="fee-card"><h4>Amount Paid</h4><div className="amount success">{feeStatus?.paid?.toLocaleString() || 0} RWF</div></div>
            <div className="fee-card"><h4>Balance Due</h4><div className="amount due">{feeStatus?.balance?.toLocaleString() || 0} RWF</div></div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>
              {feeStatus?.payments?.map(p => (<tr key={p._id}><td>{new Date(p.date).toLocaleDateString()}</td><td>{p.description}</td><td>{p.amount.toLocaleString()} RWF</td><td className="text-success">Paid</td><td><button onClick={() => handleDownloadDocument({ name: `Receipt_${p.receiptNo}`, url: p.receiptUrl })} className="download-icon"><i className="fas fa-download"></i></button></td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Homework Tab */}
        {activeTab === 'homework' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-tasks"></i> Homework & Assignments - {selectedChild?.name}</h2></div>
            {assignments.map(ass => (
              <div key={ass._id} className="assignment-card"><div className="assignment-header"><h3>{ass.title}</h3><span className={`status-badge ${ass.status}`}>{ass.status}</span></div>
              <p>{ass.description}</p><div className="assignment-meta"><span><i className="fas fa-book"></i> {ass.subject}</span><span><i className="fas fa-calendar"></i> Due: {new Date(ass.dueDate).toLocaleDateString()}</span><span><i className="fas fa-star"></i> {ass.totalPoints} pts</span></div>
              {ass.fileUrl && <button onClick={() => handleDownloadDocument({ name: ass.title, url: ass.fileUrl })} className="download-btn"><i className="fas fa-download"></i> Download Materials</button>}
              {ass.submitted && <div className="submission-info"><strong>Submitted:</strong> {new Date(ass.submittedAt).toLocaleDateString()} | <strong>Score:</strong> {ass.score}%</div>}</div>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-calendar-alt"></i> School Events & Activities</h2></div>
            <div className="events-list">{events.map(event => (
              <div key={event._id} className="event-card"><div className="event-date-large"><span className="day">{new Date(event.date).getDate()}</span><span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span></div>
              <div className="event-details"><h3>{event.title}</h3><p>{event.description}</p><div className="event-meta"><span><i className="fas fa-clock"></i> {event.time}</span><span><i className="fas fa-map-marker-alt"></i> {event.location}</span></div>
              {event.permissionRequired && <button className="permission-btn" onClick={handleRequestPermission}>Request Permission</button>}</div></div>
            ))}</div>
          </div>
        )}

        {/* Discipline Tab */}
        {activeTab === 'discipline' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-gavel"></i> Behavior & Discipline - {selectedChild?.name}</h2></div>
            {disciplineRecords.map(record => (
              <div key={record._id} className={`discipline-card ${record.type}`}><div className="discipline-header"><h3>{record.category}</h3><span className={`discipline-badge ${record.status}`}>{record.status}</span></div>
              <p>{record.description}</p><div className="discipline-meta"><span><i className="fas fa-calendar"></i> {new Date(record.date).toLocaleDateString()}</span><span><i className="fas fa-user"></i> Reported by: {record.reportedBy}</span></div>
              {record.action && <div className="action-taken"><strong>Action Taken:</strong> {record.action}</div>}
              {record.reward && <div className="reward-taken"><strong>Reward:</strong> {record.reward}</div>}</div>
            ))}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-folder-open"></i> Documents & Downloads</h2></div>
            <div className="documents-grid">{documents.map(doc => (
              <div key={doc._id} className="document-card"><i className={`fas ${doc.type === 'report_card' ? 'fa-file-alt' : doc.type === 'certificate' ? 'fa-certificate' : 'fa-receipt'}`}></i>
              <div><h4>{doc.name}</h4><p>{doc.date ? new Date(doc.date).toLocaleDateString() : ''}</p></div><button onClick={() => handleDownloadDocument(doc)} className="download-doc"><i className="fas fa-download"></i></button></div>
            ))}</div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="profile-card"><div className="profile-header"><div className="profile-avatar"><i className="fas fa-user-friends"></i></div><h2>{userName}</h2><p className="profile-role">Parent</p></div>
            <div className="profile-details"><div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email</label><p>{localStorage.getItem('userEmail')}</p></div></div>
            <div className="detail-item"><i className="fas fa-phone"></i><div><label>Phone</label><p><input type="tel" defaultValue={localStorage.getItem('userPhone') || ''} placeholder="Update phone number" /></p></div></div>
            <div className="detail-item"><i className="fas fa-bell"></i><div><label>Notification Preferences</label><p><label><input type="checkbox" defaultChecked /> Email Notifications</label><label><input type="checkbox" defaultChecked /> SMS Alerts</label></p></div></div></div>
            <button className="change-password-btn" onClick={() => Swal.fire({ title: 'Change Password', html: `<input type="password" id="new" class="swal2-input" placeholder="New Password"><input type="password" id="confirm" class="swal2-input" placeholder="Confirm">`, confirmButtonText: 'Update', preConfirm: () => { const newPass = document.getElementById('new').value; const confirm = document.getElementById('confirm').value; if (newPass !== confirm) { Swal.showValidationMessage('Passwords do not match'); return false; } return { newPassword: newPass }; } }).then(result => { if (result.isConfirmed) Swal.fire('Success', 'Password updated', 'success'); })}>Change Password</button>
            <button className="update-profile-btn" onClick={() => Swal.fire('Profile Updated', 'Your contact information has been updated', 'success')}>Save Changes</button>
          </div>
        )}
      </main>

      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} recipient={selectedChatUser} onMessageSent={fetchUnreadCount} />

      <style>{`
        .parent-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
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
        .child-selector { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .child-selector-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; }
        .child-dropdown { position: absolute; top: 100%; left: 10px; right: 10px; background: white; border-radius: 8px; color: #333; z-index: 100; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .child-option { display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; border-bottom: 1px solid #eee; }
        .child-option:hover { background: #f0f2f5; }
        .child-option i:first-child { color: #1a3a5c; width: 30px; }
        .child-option strong { display: block; font-size: 0.85rem; }
        .child-option p { margin: 0; font-size: 0.7rem; color: #666; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 20px; background: transparent; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; transition: all 0.3s; }
        .nav-item i { width: 20px; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #ffc107; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: #ffc107; border-right: 3px solid #ffc107; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 8px; }
        .chat-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #3498db; border: none; border-radius: 8px; color: white; cursor: pointer; position: relative; }
        .chat-badge { position: absolute; right: 10px; background: #e74c3c; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; }
        .logout-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .main-content { transition: margin-left 0.3s ease; padding: 20px; min-height: 100vh; }
        .top-bar { background: white; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .top-bar-left { display: flex; align-items: center; gap: 15px; }
        .mobile-menu-btn { display: none; background: #1a3a5c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        .top-bar-right { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
        .child-badge { display: flex; align-items: center; gap: 8px; background: #1a3a5c; color: white; padding: 6px 12px; border-radius: 20px; cursor: pointer; }
        .notification-bell { position: relative; cursor: pointer; font-size: 1.2rem; color: #666; }
        .notification-badge { position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 50%; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .child-info-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 20px; margin-bottom: 20px; color: white; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .child-avatar { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .child-avatar i { font-size: 1.8rem; }
        .child-details h2 { margin: 0 0 5px; font-size: 1.2rem; }
        .child-details p { margin: 0; font-size: 0.8rem; opacity: 0.9; }
        .request-btn { background: #ffc107; color: #1a3a5c; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 20px 25px; margin-bottom: 20px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .welcome-text h1 { font-size: 1.3rem; margin-bottom: 5px; }
        .welcome-date { background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 12px; padding: 15px; display: flex; align-items: center; gap: 12px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .stat-icon { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.2rem; }
        .stat-info h3 { font-size: 1.3rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 2px 0 0; color: #666; font-size: 0.8rem; }
        .stat-trend { font-size: 0.7rem; color: #27ae60; display: block; }
        .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .action-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .action-btn.primary { background: #3498db; color: white; }
        .action-btn.warning { background: #f39c12; color: white; }
        .action-btn.success { background: #27ae60; color: white; }
        .action-btn.info { background: #1abc9c; color: white; }
        .action-btn.secondary { background: #9b59b6; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .data-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
        .announcement-item { padding: 10px; border-radius: 8px; margin-bottom: 10px; background: #f8f9fa; border-left: 3px solid; }
        .announcement-item.urgent { border-left-color: #e74c3c; background: #fdecea; }
        .announcement-item.high { border-left-color: #f39c12; background: #fff3e0; }
        .event-item { display: flex; gap: 12px; padding: 10px; border-bottom: 1px solid #eee; }
        .event-date { text-align: center; background: #1a3a5c; color: white; padding: 8px; border-radius: 8px; min-width: 60px; }
        .event-date .day { display: block; font-size: 1.2rem; font-weight: bold; }
        .event-date .month { font-size: 0.7rem; }
        .grade-preview { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .homework-preview { padding: 10px 0; border-bottom: 1px solid #eee; }
        .homework-preview h4 { margin: 0 0 5px; font-size: 0.9rem; }
        .assignment-card { padding: 15px; border-radius: 10px; background: #f8f9fa; margin-bottom: 15px; }
        .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .status-badge.pending { background: #fff3e0; color: #f39c12; }
        .status-badge.submitted { background: #e3f2fd; color: #3498db; }
        .assignment-meta { display: flex; gap: 15px; margin: 10px 0; font-size: 0.7rem; color: #666; flex-wrap: wrap; }
        .download-btn { background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
        .events-list { display: flex; flex-direction: column; gap: 15px; }
        .event-card { display: flex; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; }
        .event-date-large { text-align: center; background: #1a3a5c; color: white; padding: 10px; border-radius: 10px; min-width: 70px; }
        .event-date-large .day { display: block; font-size: 1.5rem; font-weight: bold; }
        .event-date-large .month { font-size: 0.7rem; }
        .permission-btn { background: #27ae60; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
        .discipline-card { padding: 15px; border-radius: 10px; margin-bottom: 15px; background: #f8f9fa; border-left: 4px solid; }
        .discipline-card.positive { border-left-color: #27ae60; background: #e8f5e9; }
        .discipline-card.negative { border-left-color: #e74c3c; background: #fdecea; }
        .discipline-badge { padding: 3px 8px; border-radius: 20px; font-size: 0.7rem; }
        .discipline-badge.resolved { background: #e8f5e9; color: #27ae60; }
        .discipline-badge.pending { background: #fff3e0; color: #f39c12; }
        .documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .document-card { display: flex; align-items: center; gap: 15px; padding: 12px; background: #f8f9fa; border-radius: 10px; }
        .document-card i { font-size: 1.5rem; color: #1a3a5c; }
        .document-card h4 { margin: 0; font-size: 0.9rem; }
        .document-card p { margin: 0; font-size: 0.7rem; color: #666; }
        .download-doc { background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-left: auto; }
        .profile-card { background: white; border-radius: 16px; overflow: hidden; max-width: 600px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; }
        .profile-avatar { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 2.5rem; color: #ffc107; }
        .profile-details { padding: 20px; }
        .detail-item { display: flex; gap: 15px; padding: 12px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1rem; color: #1a3a5c; width: 25px; }
        .detail-item input { padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 200px; }
        .change-password-btn, .update-profile-btn { width: calc(100% - 40px); margin: 10px 20px; padding: 10px; border: none; border-radius: 8px; cursor: pointer; }
        .change-password-btn { background: #1a3a5c; color: white; }
        .update-profile-btn { background: #27ae60; color: white; }
        .fee-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .fee-card { background: #f8f9fa; padding: 12px; border-radius: 10px; text-align: center; }
        .fee-card .amount { font-size: 1.2rem; font-weight: bold; margin-top: 5px; }
        .pay-now-btn { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
        .attendance-summary { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-circle { text-align: center; }
        .circle-percent { width: 80px; height: 80px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; color: white; margin-bottom: 5px; }
        .summary-details { display: flex; gap: 15px; flex-wrap: wrap; }
        .summary-details div { background: #f8f9fa; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 10px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; font-size: 0.8rem; }
        .data-table td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 0.8rem; }
        .text-success { color: #27ae60; font-weight: 500; }
        .text-danger { color: #e74c3c; font-weight: 500; }
        .text-warning { color: #f39c12; font-weight: 500; }
        .status-present { color: #27ae60; font-weight: bold; }
        .status-absent { color: #e74c3c; font-weight: bold; }
        .status-late { color: #f39c12; font-weight: bold; }
        .no-data { text-align: center; padding: 30px; color: #999; }
        .stats-badge { background: #e8f5e9; color: #27ae60; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; }
        .download-icon { background: none; border: none; cursor: pointer; color: #3498db; }
        @media (max-width: 768px) { .mobile-menu-btn { display: block; } .two-columns { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .quick-actions { flex-direction: column; } .child-info-banner { flex-direction: column; text-align: center; } }
      `}</style>
    </div>
  );
};

export default ParentDashboard;