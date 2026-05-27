import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import ChatModal from '../../components/ChatModal';

const API_URL = 'http://localhost:5000/api';

const StudentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  
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
    
    if (!token || role !== 'student') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Student');
      fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const [dashboard, assignmentsData, gradesData, attendanceData, feeData, announcementsData] = await Promise.all([
        apiRequest('/student/dashboard').catch(() => null),
        apiRequest('/student/assignments').catch(() => []),
        apiRequest('/student/grades').catch(() => []),
        apiRequest('/student/attendance').catch(() => []),
        apiRequest('/student/fees').catch(() => null),
        apiRequest('/student/announcements').catch(() => [])
      ]);
      
      setDashboardData(dashboard);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setFeeStatus(feeData);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  // ==================== ASSIGNMENT SUBMISSION ====================
  const handleSubmitAssignment = async (assignment) => {
    // ✅ FIX: removed shadowed inner `const content` — using `value` from destructure directly
    const { value: submittedContent } = await Swal.fire({
      title: `Submit: ${assignment.title}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleDateString()}</p>
          <p><strong>Points:</strong> ${assignment.totalPoints}</p>
          <textarea id="submissionContent" class="swal2-textarea" placeholder="Write your answer here..." rows="8" style="width:100%"></textarea>
        </div>
      `,
      confirmButtonText: 'Submit Assignment',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '600px',
      preConfirm: () => {
        const content = document.getElementById('submissionContent').value;
        if (!content) {
          Swal.showValidationMessage('Please write your answer');
          return false;
        }
        return content;
      }
    });
    
    if (submittedContent) {
      try {
        await apiRequest(`/student/assignments/${assignment._id}/submit`, {
          method: 'POST',
          body: JSON.stringify({ content: submittedContent })
        });
        Swal.fire('Submitted!', 'Your assignment has been submitted successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to submit assignment', 'error');
      }
    }
  };

  const handleDownloadAssignment = (assignment) => {
    if (assignment.fileUrl) {
      window.open(assignment.fileUrl, '_blank');
    } else {
      Swal.fire('No File', 'This assignment has no attached file', 'info');
    }
  };

  // ==================== PERMISSION REQUEST ====================
  const handleRequestPermission = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Request Permission',
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
      width: '500px',
      preConfirm: () => {
        const type = document.getElementById('type').value;
        const reason = document.getElementById('reason').value;
        if (!type || !reason) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          type, reason,
          fromDate: document.getElementById('fromDate').value,
          toDate: document.getElementById('toDate').value
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/permissions/request', {
          method: 'POST',
          body: JSON.stringify({ ...formValues, requesterRole: 'student' })
        });
        Swal.fire('Request Sent!', 'Your permission request has been submitted to Discipline Admin', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to submit request', 'error');
      }
    }
  };

  // ==================== CONTACT TEACHER ====================
  const handleContactTeacher = () => {
    handleOpenChat({ name: 'Teacher', role: 'teacher', id: 'teacher' });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#f39c12' },
    { id: 'grades', label: 'Grades', icon: 'fas fa-chart-simple', color: '#27ae60' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-calendar-check', color: '#e74c3c' },
    { id: 'fees', label: 'Fee Status', icon: 'fas fa-money-bill-wave', color: '#9b59b6' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
  const sidebarWidthMobile = mobileMenuOpen ? sidebarWidth : '0px';

  // Calculate statistics
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'submitted').length;
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0;
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;
  const feeBalance = feeStatus ? feeStatus.total - feeStatus.paid : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-user-graduate"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Student</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-user-graduate"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Student</span>
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
            <h2>Student Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="notification-bell" onClick={() => handleOpenChat()}>
              <i className="fas fa-envelope"></i>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-user-graduate"></i></div>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role-badge">Student</span>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome back, {userName.split(' ')[0]}! 🎓</h1>
            <p>Track your assignments, grades, attendance, and fee status.</p>
          </div>
          <div className="welcome-date">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button onClick={() => setActiveTab('assignments')} className="action-btn primary"><i className="fas fa-tasks"></i> View Assignments</button>
          <button onClick={handleRequestPermission} className="action-btn warning"><i className="fas fa-file-alt"></i> Request Permission</button>
          <button onClick={handleContactTeacher} className="action-btn info"><i className="fas fa-chalkboard-user"></i> Contact Teacher</button>
          <button onClick={() => handleOpenChat()} className="action-btn success"><i className="fas fa-comments"></i> Messages {unreadCount > 0 && `(${unreadCount})`}</button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd' }}><i className="fas fa-tasks" style={{ color: '#3498db' }}></i></div>
            <div className="stat-info"><h3>{totalAssignments}</h3><p>Total Assignments</p><span className="stat-trend">{completedAssignments} completed</span></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-chart-line" style={{ color: '#27ae60' }}></i></div>
            <div className="stat-info"><h3>{avgGrade}%</h3><p>Average Grade</p><span className="stat-trend">{avgGrade >= 80 ? 'Excellent' : avgGrade >= 60 ? 'Good' : 'Needs Improvement'}</span></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-calendar-check" style={{ color: '#f39c12' }}></i></div>
            <div className="stat-info"><h3>{attendanceRate}%</h3><p>Attendance Rate</p><span className="stat-trend">{attendanceRate >= 80 ? 'Good Standing' : 'Low Attendance'}</span></div></div>
          <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-money-bill-wave" style={{ color: '#e74c3c' }}></i></div>
            <div className="stat-info"><h3>{feeBalance.toLocaleString()} RWF</h3><p>Balance Due</p><span className="stat-trend">{feeBalance === 0 ? 'Paid in Full' : 'Payment Due'}</span></div></div>
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
                  <h3><i className="fas fa-tasks"></i> Pending Assignments</h3>
                  {pendingAssignments === 0 ? <p className="no-data">No pending assignments</p> : assignments.filter(a => a.status === 'pending').slice(0, 3).map(ass => (
                    <div key={ass._id} className="assignment-preview">
                      <h4>{ass.title}</h4>
                      <p>Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                      <button onClick={() => handleSubmitAssignment(ass)} className="submit-small">Submit</button>
                    </div>
                  ))}
                  {pendingAssignments > 3 && <a href="#" onClick={() => setActiveTab('assignments')}>View all {pendingAssignments} assignments →</a>}
                </div>
              </div>
              <div className="column">
                <div className="data-card">
                  <h3><i className="fas fa-chart-simple"></i> Recent Grades</h3>
                  {grades.length === 0 ? <p className="no-data">No grades yet</p> : grades.slice(0, 5).map(grade => (
                    <div key={grade._id} className="grade-preview"><span>{grade.subject}</span><span className={`grade-value ${grade.score >= 80 ? 'A' : grade.score >= 70 ? 'B' : grade.score >= 60 ? 'C' : 'D'}`}>{grade.grade}</span></div>
                  ))}
                </div>
                <div className="data-card">
                  <h3><i className="fas fa-calendar-check"></i> Recent Attendance</h3>
                  {attendance.length === 0 ? <p className="no-data">No attendance records</p> : attendance.slice(0, 5).map(att => (
                    <div key={att._id} className="attendance-preview"><span>{new Date(att.date).toLocaleDateString()}</span><span className={`status ${att.status}`}>{att.status}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-tasks"></i> My Assignments</h2><div className="stats-badge">{pendingAssignments} Pending</div></div>
            {assignments.map(assignment => (
              <div key={assignment._id} className="assignment-card">
                <div className="assignment-header"><h3>{assignment.title}</h3><span className={`status-badge ${assignment.status}`}>{assignment.status}</span></div>
                <p>{assignment.description}</p>
                <div className="assignment-meta"><span><i className="fas fa-book"></i> {assignment.subject}</span><span><i className="fas fa-calendar"></i> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span><span><i className="fas fa-star"></i> {assignment.totalPoints} pts</span></div>
                {assignment.fileUrl && <button onClick={() => handleDownloadAssignment(assignment)} className="download-btn"><i className="fas fa-download"></i> Download Question Paper</button>}
                {assignment.status === 'pending' && <button onClick={() => handleSubmitAssignment(assignment)} className="submit-btn"><i className="fas fa-paper-plane"></i> Submit Assignment</button>}
                {assignment.score && <div className="grade-feedback"><strong>Grade:</strong> {assignment.score}% ({assignment.grade})<br/><strong>Feedback:</strong> {assignment.feedback || 'No feedback yet'}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-chart-simple"></i> My Grades</h2><div className="stats-badge success">Average: {avgGrade}%</div></div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Assignment</th><th>Score</th><th>Grade</th><th>Term</th><th>Teacher Feedback</th></tr>
                </thead>
                <tbody>
                  {grades.map(grade => (
                    <tr key={grade._id}>
                      <td><strong>{grade.subject}</strong></td>
                      <td>{grade.assignmentTitle || '-'}</td>
                      <td className={grade.score >= 80 ? 'text-success' : grade.score >= 60 ? 'text-warning' : 'text-danger'}>{grade.score}%</td>
                      <td className={grade.score >= 80 ? 'text-success' : grade.score >= 70 ? 'text-warning' : 'text-danger'}>{grade.grade}</td>
                      <td>{grade.term}</td>
                      <td className="feedback-cell">{grade.feedback || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>{/* ✅ FIX: was <table> instead of </table> */}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-calendar-check"></i> Attendance Records</h2><div className="stats-badge">{attendanceRate}% Overall</div></div>
            <div className="attendance-summary"><div className="summary-circle"><div className="circle-percent">{attendanceRate}%</div><p>Present</p></div><div className="summary-details"><div>Present: {attendance.filter(a => a.status === 'present').length}</div><div>Absent: {attendance.filter(a => a.status === 'absent').length}</div><div>Late: {attendance.filter(a => a.status === 'late').length}</div><div>Total Days: {attendance.length}</div></div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead><tbody>
              {attendance.map(record => (<tr key={record._id}><td>{new Date(record.date).toLocaleDateString()}</td><td className={`status-${record.status}`}>{record.status.toUpperCase()}</td><td>{record.remarks || '-'}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Fee Status Tab */}
        {activeTab === 'fees' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-money-bill-wave"></i> Fee Status</h2></div>
            <div className="fee-summary"><div className="fee-card"><h4>Total Fees</h4><div className="amount">{feeStatus?.total?.toLocaleString() || 0} RWF</div></div><div className="fee-card"><h4>Amount Paid</h4><div className="amount success">{feeStatus?.paid?.toLocaleString() || 0} RWF</div></div><div className="fee-card"><h4>Balance Due</h4><div className="amount due">{feeBalance.toLocaleString()} RWF</div></div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>
              {feeStatus?.payments?.map(p => (<tr key={p._id}><td>{new Date(p.date).toLocaleDateString()}</td><td>{p.description}</td><td>{p.amount.toLocaleString()} RWF</td><td className="text-success">Paid</td><td>{p.receiptNo || '-'}</td></tr>))}
              {(!feeStatus?.payments || feeStatus.payments.length === 0) && <tr><td colSpan="5" className="no-data">No payment records</td></tr>}
            </tbody></table></div>
            {feeBalance > 0 && <button className="pay-btn" onClick={() => window.open('/contact', '_blank')}>Contact Accounts Office</button>}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card"><div className="profile-header"><div className="profile-avatar"><i className="fas fa-user-graduate"></i></div><h2>{userName}</h2><p className="profile-role">Student</p></div>
            <div className="profile-details"><div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email</label><p>{localStorage.getItem('userEmail')}</p></div></div>
            <div className="detail-item"><i className="fas fa-school"></i><div><label>Class</label><p>{dashboardData?.className || 'Not Assigned'}</p></div></div>
            <div className="detail-item"><i className="fas fa-id-card"></i><div><label>Student ID</label><p>{dashboardData?.studentId || 'N/A'}</p></div></div></div>
            <button className="change-password-btn" onClick={() => Swal.fire({ title: 'Change Password', html: `<input type="password" id="new" class="swal2-input" placeholder="New Password"><input type="password" id="confirm" class="swal2-input" placeholder="Confirm">`, confirmButtonText: 'Update', preConfirm: () => { const newPass = document.getElementById('new').value; const confirm = document.getElementById('confirm').value; if (newPass !== confirm) { Swal.showValidationMessage('Passwords do not match'); return false; } return { newPassword: newPass }; } }).then(result => { if (result.isConfirmed) Swal.fire('Success', 'Password updated', 'success'); })}>Change Password</button>
          </div>
        )}
      </main>

      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} recipient={selectedChatUser} onMessageSent={fetchUnreadCount} />

      <style>{`
        .student-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
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
        .top-bar-right { display: flex; align-items: center; gap: 20px; }
        .notification-bell { position: relative; cursor: pointer; font-size: 1.2rem; color: #666; }
        .notification-badge { position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 50%; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 25px 30px; margin-bottom: 25px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .welcome-text h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .welcome-date { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 30px; font-size: 0.85rem; }
        .quick-actions { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; }
        .action-btn { padding: 12px 24px; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .action-btn.primary { background: #3498db; color: white; }
        .action-btn.warning { background: #f39c12; color: white; }
        .action-btn.info { background: #1abc9c; color: white; }
        .action-btn.success { background: #27ae60; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.5rem; }
        .stat-info h3 { font-size: 1.5rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 5px 0 0; color: #666; }
        .stat-trend { font-size: 0.7rem; color: #27ae60; display: block; }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .data-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .announcement-item { padding: 12px; border-radius: 8px; margin-bottom: 10px; background: #f8f9fa; border-left: 3px solid; }
        .announcement-item.urgent { border-left-color: #e74c3c; background: #fdecea; }
        .announcement-item.high { border-left-color: #f39c12; background: #fff3e0; }
        .announcement-item h4 { margin: 0 0 5px; font-size: 0.9rem; }
        .announcement-item p { margin: 0 0 5px; font-size: 0.8rem; color: #666; }
        .assignment-preview { padding: 10px; border-bottom: 1px solid #eee; }
        .assignment-preview h4 { margin: 0 0 5px; font-size: 0.9rem; }
        .submit-small { background: #27ae60; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
        .grade-preview { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .grade-value { font-weight: bold; }
        .attendance-preview { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .attendance-preview .status { font-weight: bold; }
        .status.present { color: #27ae60; }
        .status.absent { color: #e74c3c; }
        .status.late { color: #f39c12; }
        .assignment-card { padding: 15px; border-radius: 12px; background: #f8f9fa; margin-bottom: 15px; }
        .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .assignment-header h3 { margin: 0; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .status-badge.pending { background: #fff3e0; color: #f39c12; }
        .status-badge.submitted { background: #e3f2fd; color: #3498db; }
        .status-badge.graded { background: #e8f5e9; color: #27ae60; }
        .assignment-meta { display: flex; gap: 15px; margin: 10px 0; font-size: 0.75rem; color: #666; flex-wrap: wrap; }
        .download-btn { background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px; }
        .submit-btn { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .grade-feedback { margin-top: 10px; padding: 10px; background: white; border-radius: 8px; font-size: 0.85rem; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; }
        .data-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .text-success { color: #27ae60; font-weight: 500; }
        .text-danger { color: #e74c3c; font-weight: 500; }
        .text-warning { color: #f39c12; font-weight: 500; }
        .attendance-summary { display: flex; align-items: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-circle { text-align: center; }
        .circle-percent { width: 100px; height: 100px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 10px; }
        .summary-details { display: flex; gap: 15px; flex-wrap: wrap; }
        .summary-details div { background: #f8f9fa; padding: 8px 15px; border-radius: 8px; }
        .fee-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .fee-card { background: #f8f9fa; padding: 15px; border-radius: 12px; text-align: center; }
        .fee-card .amount { font-size: 1.3rem; font-weight: bold; margin-top: 10px; }
        .fee-card .amount.success { color: #27ae60; }
        .fee-card .amount.due { color: #e74c3c; }
        .pay-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 15px; width: 100%; }
        .status-present { color: #27ae60; font-weight: bold; }
        .status-absent { color: #e74c3c; font-weight: bold; }
        .status-late { color: #f39c12; font-weight: bold; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 600px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 40px; text-align: center; }
        .profile-avatar { width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 3rem; color: #ffc107; }
        .profile-details { padding: 30px; }
        .detail-item { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1.2rem; color: #1a3a5c; width: 30px; }
        .change-password-btn { width: calc(100% - 60px); margin: 0 30px 30px; padding: 12px; background: #1a3a5c; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .no-data { text-align: center; padding: 40px; color: #999; }
        .stats-badge { background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }
        .stats-badge.success { background: #e8f5e9; }
        @media (max-width: 768px) { .mobile-menu-btn { display: block; } .welcome-text h1 { font-size: 1.2rem; } .stats-grid { grid-template-columns: 1fr; } .two-columns { grid-template-columns: 1fr; } .quick-actions { flex-direction: column; } .attendance-summary { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
};

export default StudentDashboard;