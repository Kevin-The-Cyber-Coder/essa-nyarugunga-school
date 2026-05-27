import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import ChatModal from '../../components/ChatModal';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const TeacherDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  
  // Chart data
  const [classPerformance, setClassPerformance] = useState([]);
  
  // Chat states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('portalToken');

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  };

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
    
    if (!token || role !== 'teacher') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Teacher');
      fetchAllData();
      fetchUnreadCount();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const [classesData, studentsData, assignmentsData, attendanceData, gradesData, performanceData] = await Promise.all([
        apiRequest('/teacher/classes').catch(() => []),
        apiRequest('/teacher/students').catch(() => []),
        apiRequest('/teacher/assignments').catch(() => []),
        apiRequest('/teacher/attendance').catch(() => []),
        apiRequest('/teacher/grades').catch(() => []),
        apiRequest('/teacher/class-performance').catch(() => [])
      ]);
      
      setClasses(Array.isArray(classesData) ? classesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setClassPerformance(Array.isArray(performanceData) ? performanceData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest('/messages/unread/count');
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

  // ==================== CLASS MANAGEMENT ====================
  const handleCreateClass = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create New Class',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="className" placeholder="Class Name (e.g., A, B, C)" required></div>
          <div class="form-group"><i class="fas fa-layer-group"></i>
            <select id="grade"><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option><option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option></select>
          </div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="text" id="academicYear" placeholder="Academic Year (e.g., 2026)" required></div>
        </div>
      `,
      confirmButtonText: 'Create Class',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const className = document.getElementById('className').value;
        const grade = document.getElementById('grade').value;
        const academicYear = document.getElementById('academicYear').value;
        if (!className || !academicYear) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { className, grade, academicYear };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/teacher/create-class', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Success!', 'Class created successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to create class', 'error');
      }
    }
  };

  // ==================== STUDENT MANAGEMENT ====================
  const handleAddStudent = async () => {
    if (classes.length === 0) {
      Swal.fire('No Classes', 'Please create a class first', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Add Student',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-user"></i><input type="text" id="fullName" placeholder="Full Name" required></div>
          <div class="form-group"><i class="fas fa-envelope"></i><input type="email" id="email" placeholder="Email" required></div>
          <div class="form-group"><i class="fas fa-id-card"></i><input type="text" id="studentId" placeholder="Student ID" required></div>
          <div class="form-group"><i class="fas fa-school"></i>
            <select id="classId">${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}</select>
          </div>
          <div class="form-group"><i class="fas fa-user-friends"></i><input type="text" id="parentName" placeholder="Parent Name"></div>
          <div class="form-group"><i class="fas fa-phone"></i><input type="text" id="parentPhone" placeholder="Parent Phone"></div>
        </div>
      `,
      confirmButtonText: 'Add Student',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const studentId = document.getElementById('studentId').value;
        const classId = document.getElementById('classId').value;
        if (!fullName || !email || !studentId || !classId) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          fullName, email, studentId, classId,
          password: 'student123',
          parentName: document.getElementById('parentName').value,
          parentPhone: document.getElementById('parentPhone').value
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/teacher/add-student', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire({
          title: 'Student Added!',
          html: `<p><strong>Email:</strong> ${formValues.email}</p><p><strong>Password:</strong> student123</p>`,
          icon: 'success'
        });
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to add student', 'error');
      }
    }
  };

  // ==================== ATTENDANCE MANAGEMENT ====================
  const handleMarkAttendance = async () => {
    if (classes.length === 0) {
      Swal.fire('No Classes', 'Please create a class first', 'warning');
      return;
    }
    
    const selectedClass = await Swal.fire({
      title: 'Select Class',
      input: 'select',
      inputOptions: Object.fromEntries(classes.map(c => [c._id, `${c.grade} ${c.className}`])),
      inputPlaceholder: 'Select class',
      showCancelButton: true
    });
    
    if (!selectedClass.value) return;
    
    const classStudents = students.filter(s => s.classId?._id === selectedClass.value || s.classId === selectedClass.value);
    
    if (classStudents.length === 0) {
      Swal.fire('No Students', 'No students in this class', 'warning');
      return;
    }
    
    const attendanceHtml = classStudents.map(s => `
      <div class="attendance-row">
        <span style="width: 200px; display: inline-block;">${s.fullName}</span>
        <select id="status_${s._id}" class="attendance-select">
          <option value="present">✅ Present</option>
          <option value="absent">❌ Absent</option>
          <option value="late">⏰ Late</option>
        </select>
      </div>
    `).join('');
    
    const { value: date } = await Swal.fire({
      title: 'Mark Attendance',
      html: `<div>Date: <input type="date" id="attendanceDate" value="${new Date().toISOString().split('T')[0]}" style="padding: 8px; border-radius: 6px; border: 1px solid #ddd;"></div><div style="margin-top: 15px; max-height: 400px; overflow-y: auto;">${attendanceHtml}</div>`,
      confirmButtonText: 'Save Attendance',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const records = classStudents.map(s => ({
          studentId: s._id,
          status: document.getElementById(`status_${s._id}`).value
        }));
        return { date: document.getElementById('attendanceDate').value, records };
      }
    });
    
    if (date) {
      try {
        await apiRequest('/teacher/attendance', { method: 'POST', body: JSON.stringify({ classId: selectedClass.value, date: date.date, records: date.records }) });
        Swal.fire('Saved!', 'Attendance recorded successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to save attendance', 'error');
      }
    }
  };

  // ==================== ASSIGNMENT MANAGEMENT ====================
  const handleCreateAssignment = async () => {
    if (classes.length === 0) {
      Swal.fire('No Classes', 'Please create a class first', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Create Assignment',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="title" placeholder="Assignment Title" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Description" rows="3" required></textarea></div>
          <div class="form-group"><i class="fas fa-book"></i><input type="text" id="subject" placeholder="Subject" required></div>
          <div class="form-group"><i class="fas fa-school"></i>
            <select id="classId">${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}</select>
          </div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="dueDate" required></div>
          <div class="form-group"><i class="fas fa-star"></i><input type="number" id="totalPoints" placeholder="Total Points" value="100"></div>
        </div>
      `,
      confirmButtonText: 'Create Assignment',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        if (!title || !description) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          title, description,
          subject: document.getElementById('subject').value,
          classId: document.getElementById('classId').value,
          dueDate: document.getElementById('dueDate').value,
          totalPoints: parseInt(document.getElementById('totalPoints').value)
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/teacher/assignments', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Created!', 'Assignment created and sent to students', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to create assignment', 'error');
      }
    }
  };

  const handleGradeAssignment = async (assignment) => {
    const submissions = assignment.submissions || [];
    if (submissions.length === 0) {
      Swal.fire('No Submissions', 'No students have submitted this assignment yet', 'info');
      return;
    }
    
    const gradingHtml = submissions.map(sub => `
      <div class="grading-row">
        <span style="width: 200px; display: inline-block;">${sub.studentName}</span>
        <input type="number" id="score_${sub.studentId}" value="${sub.score || 0}" min="0" max="${assignment.totalPoints}" style="width: 80px; padding: 5px;">
        <span> / ${assignment.totalPoints}</span>
        <textarea id="feedback_${sub.studentId}" placeholder="Feedback" style="width: 200px; margin-left: 10px;">${sub.feedback || ''}</textarea>
      </div>
    `).join('');
    
    const { value } = await Swal.fire({
      title: `Grade Assignment: ${assignment.title}`,
      html: `<div style="max-height: 400px; overflow-y: auto;">${gradingHtml}</div>`,
      confirmButtonText: 'Save Grades',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '700px',
      preConfirm: () => {
        return submissions.map(sub => ({
          studentId: sub.studentId,
          score: parseInt(document.getElementById(`score_${sub.studentId}`).value) || 0,
          feedback: document.getElementById(`feedback_${sub.studentId}`).value
        }));
      }
    });
    
    if (value) {
      try {
        await apiRequest(`/teacher/assignments/${assignment._id}/grade`, { method: 'PUT', body: JSON.stringify({ grades: value }) });
        Swal.fire('Saved!', 'Grades submitted successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to save grades', 'error');
      }
    }
  };

  // ==================== DISCIPLINE REPORTING ====================
  const handleReportDiscipline = async () => {
    if (students.length === 0) {
      Swal.fire('No Students', 'No students in your classes', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Report Discipline Case',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-user"></i>
            <select id="studentId">${students.map(s => `<option value="${s._id}">${s.fullName} - ${s.classId?.grade} ${s.classId?.className}</option>`).join('')}</select>
          </div>
          <div class="form-group"><i class="fas fa-tag"></i>
            <select id="category">
              <option value="Misconduct">Misconduct</option>
              <option value="Uniform Violation">Uniform Violation</option>
              <option value="Truancy">Truancy</option>
              <option value="Disrespect">Disrespect</option>
              <option value="Cheating">Cheating</option>
            </select>
          </div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Detailed description" rows="4" required></textarea></div>
        </div>
      `,
      confirmButtonText: 'Report to Discipline Admin',
      confirmButtonColor: '#e74c3c',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const description = document.getElementById('description').value;
        if (!description) {
          Swal.showValidationMessage('Please provide description');
          return false;
        }
        return {
          studentId: document.getElementById('studentId').value,
          category: document.getElementById('category').value,
          description
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/discipline-admin/cases/report', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Reported!', 'Case sent to Discipline Admin for review', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to report case', 'error');
      }
    }
  };

  // ==================== PERMISSION REQUESTS ====================
  const handleRequestPermission = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Request Permission',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="type" placeholder="Permission Type (e.g., Leave, Event)" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="reason" placeholder="Reason" rows="3" required></textarea></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="fromDate" required></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="toDate" required></div>
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
        return { type, reason, fromDate: document.getElementById('fromDate').value, toDate: document.getElementById('toDate').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/permissions/request', { method: 'POST', body: JSON.stringify({ ...formValues, requesterRole: 'teacher' }) });
        Swal.fire('Request Sent!', 'Your permission request has been submitted to Discipline Admin', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to submit request', 'error');
      }
    }
  };

  // ==================== FINANCIAL REQUEST ====================
  const handleFinancialRequest = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Financial Request to Accounts',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="purpose" placeholder="Purpose" required></div>
          <div class="form-group"><i class="fas fa-dollar-sign"></i><input type="number" id="amount" placeholder="Amount (RWF)" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Description" rows="3" required></textarea></div>
        </div>
      `,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const purpose = document.getElementById('purpose').value;
        const amount = document.getElementById('amount').value;
        if (!purpose || !amount) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { purpose, amount: parseFloat(amount), description: document.getElementById('description').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/accounts/requests', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Request Sent!', 'Your financial request has been submitted to Accounts Admin', 'success');
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
    { id: 'classes', label: 'My Classes', icon: 'fas fa-school', color: '#27ae60' },
    { id: 'students', label: 'My Students', icon: 'fas fa-users', color: '#9b59b6' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-calendar-check', color: '#f39c12' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#1abc9c' },
    { id: 'grades', label: 'Grades', icon: 'fas fa-chart-line', color: '#e74c3c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
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
    <div className="teacher-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-chalkboard-user"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Teacher</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-chalkboard-user"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Teacher</span>
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
            <h2>Teacher Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="notification-bell" onClick={() => handleOpenChat()}>
              <i className="fas fa-envelope"></i>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-chalkboard-user"></i></div>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role-badge">Teacher</span>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome back, {userName.split(' ')[0]}! 👨‍🏫</h1>
            <p>Manage your classes, students, assignments, and more.</p>
          </div>
          <div className="welcome-date">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="quick-actions">
          <button onClick={handleCreateClass} className="action-btn success"><i className="fas fa-plus-circle"></i> Create Class</button>
          <button onClick={handleAddStudent} className="action-btn primary"><i className="fas fa-user-plus"></i> Add Student</button>
          <button onClick={handleMarkAttendance} className="action-btn warning"><i className="fas fa-calendar-check"></i> Mark Attendance</button>
          <button onClick={handleCreateAssignment} className="action-btn info"><i className="fas fa-tasks"></i> Create Assignment</button>
          <button onClick={handleReportDiscipline} className="action-btn danger"><i className="fas fa-gavel"></i> Report Issue</button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-school" style={{ color: '#27ae60' }}></i></div>
                <div className="stat-info"><h3>{classes.length}</h3><p>My Classes</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd' }}><i className="fas fa-users" style={{ color: '#3498db' }}></i></div>
                <div className="stat-info"><h3>{students.length}</h3><p>Students</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-tasks" style={{ color: '#f39c12' }}></i></div>
                <div className="stat-info"><h3>{assignments.length}</h3><p>Assignments</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-chart-line" style={{ color: '#e74c3c' }}></i></div>
                <div className="stat-info"><h3>{students.filter(s => s.attendanceRate < 75).length}</h3><p>Low Attendance</p></div></div>
            </div>

            <div className="performance-chart">
              <h3><i className="fas fa-chart-bar"></i> Class Performance Overview</h3>
              <div className="chart-container">
                {classPerformance.map(c => (
                  <div key={c.className} className="chart-item">
                    <div className="chart-label">{c.className}</div>
                    <div className="chart-bar"><div className="chart-fill" style={{ width: `${c.averageScore}%`, background: c.averageScore >= 80 ? '#27ae60' : c.averageScore >= 60 ? '#f39c12' : '#e74c3c' }}></div></div>
                    <div className="chart-value">{c.averageScore}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-buttons-group">
              <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={handleRequestPermission} className="action-sm"><i className="fas fa-file-alt"></i> Request Permission</button>
                <button onClick={handleFinancialRequest} className="action-sm"><i className="fas fa-money-bill"></i> Financial Request</button>
                <button onClick={() => handleOpenChat({ name: 'Discipline Admin', role: 'discipline_admin', id: 'discipline' })} className="action-sm"><i className="fas fa-gavel"></i> Contact Discipline</button>
                <button onClick={() => handleOpenChat({ name: 'Accounts Admin', role: 'accounts_admin', id: 'accounts' })} className="action-sm"><i className="fas fa-coins"></i> Contact Accounts</button>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-school"></i> My Classes</h2><button onClick={handleCreateClass} className="btn-primary-sm"><i className="fas fa-plus"></i> Create Class</button></div>
            {classes.length === 0 ? <p className="no-data">No classes yet. Click "Create Class" to start.</p> : (
              <div className="classes-grid">{classes.map(c => (<div key={c._id} className="class-card"><h3>{c.grade} {c.className}</h3><p><i className="fas fa-calendar"></i> {c.academicYear}</p><div className="class-stats"><span><i className="fas fa-users"></i> {students.filter(s => s.classId?._id === c._id).length} Students</span><span><i className="fas fa-tasks"></i> {assignments.filter(a => a.classId === c._id).length} Assignments</span></div><button onClick={() => setActiveTab('students')} className="view-btn">View Students</button></div>))}</div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-users"></i> My Students</h2><button onClick={handleAddStudent} className="btn-primary-sm"><i className="fas fa-plus"></i> Add Student</button></div>
            {students.length === 0 ? <p className="no-data">No students yet. Click "Add Student" to enroll.</p> : (
              <div className="table-responsive"><table className="data-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Class</th><th>Attendance</th><th>Actions</th></tr></thead><tbody>
                {students.map(s => (<tr key={s._id}><td>{s.studentId}</td><td><strong>{s.fullName}</strong></td><td>{s.email}</td><td>{s.classId?.grade} {s.classId?.className}</td><td className={s.attendanceRate > 75 ? 'text-success' : 'text-danger'}>{s.attendanceRate || 95}%</td><td><button onClick={() => handleOpenChat({ name: s.fullName, role: 'student', id: s.userId })} className="chat-icon"><i className="fas fa-comment"></i></button></td></tr>))}
              </tbody></table></div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-calendar-check"></i> Attendance Records</h2><button onClick={handleMarkAttendance} className="btn-primary-sm"><i className="fas fa-plus"></i> Mark Attendance</button></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Rate</th></tr></thead><tbody>
              {attendance.map(a => (<tr key={a._id}><td>{new Date(a.date).toLocaleDateString()}</td><td>{a.className}</td><td className="text-success">{a.present}</td><td className="text-danger">{a.absent}</td><td className="text-warning">{a.late}</td><td>{a.total}</td><td className={a.rate >= 80 ? 'text-success' : 'text-danger'}>{a.rate}%</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-tasks"></i> Assignments</h2><button onClick={handleCreateAssignment} className="btn-primary-sm"><i className="fas fa-plus"></i> Create Assignment</button></div>
            {assignments.map(a => (<div key={a._id} className="assignment-card"><h3>{a.title}</h3><p>{a.description}</p><div className="assignment-meta"><span><i className="fas fa-book"></i> {a.subject}</span><span><i className="fas fa-school"></i> {a.className}</span><span><i className="fas fa-calendar"></i> Due: {new Date(a.dueDate).toLocaleDateString()}</span><span><i className="fas fa-star"></i> {a.totalPoints} pts</span></div><div className="assignment-stats"><span><i className="fas fa-users"></i> {a.submissions?.length || 0}/{students.filter(s => s.classId?._id === a.classId).length} Submitted</span><span><i className="fas fa-chart-line"></i> Avg Score: {a.averageScore || 0}%</span></div><button onClick={() => handleGradeAssignment(a)} className="grade-btn"><i className="fas fa-edit"></i> Grade Submissions</button></div>))}
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-chart-line"></i> Student Grades</h2>
              <select onChange={(e) => {}}><option value="">All Classes</option>{classes.map(c => <option key={c._id} value={c._id}>{c.grade} {c.className}</option>)}</select>
            </div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Assignment</th><th>Score</th><th>Grade</th><th>Feedback</th></tr></thead><tbody>
              {grades.map(g => (<tr key={g._id}><td>{g.studentName}</td><td>{g.className}</td><td>{g.subject}</td><td>{g.assignmentTitle}</td><td className={g.score >= 80 ? 'text-success' : g.score >= 60 ? 'text-warning' : 'text-danger'}>{g.score}%</td><td className={g.score >= 80 ? 'text-success' : g.score >= 60 ? 'text-warning' : 'text-danger'}>{g.grade}</td><td>{g.feedback || '-'}</td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card"><div className="profile-header"><div className="profile-avatar"><i className="fas fa-chalkboard-user"></i></div><h2>{userName}</h2><p className="profile-role">Teacher</p></div>
            <div className="profile-details"><div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email</label><p>{localStorage.getItem('userEmail')}</p></div></div>
            <div className="detail-item"><i className="fas fa-school"></i><div><label>Classes</label><p>{classes.length} classes, {students.length} students</p></div></div></div>
            <button className="change-password-btn" onClick={() => Swal.fire({ title: 'Change Password', html: `<input type="password" id="new" class="swal2-input" placeholder="New Password"><input type="password" id="confirm" class="swal2-input" placeholder="Confirm">`, confirmButtonText: 'Update', preConfirm: () => { const newPass = document.getElementById('new').value; const confirm = document.getElementById('confirm').value; if (newPass !== confirm) { Swal.showValidationMessage('Passwords do not match'); return false; } return { newPassword: newPass }; } }).then(result => { if (result.isConfirmed) Swal.fire('Success', 'Password updated', 'success'); })}>Change Password</button>
          </div>
        )}
      </main>

      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} recipient={selectedChatUser} onMessageSent={fetchUnreadCount} />

      <style>{`
        .teacher-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
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
        .action-btn.success { background: #27ae60; color: white; }
        .action-btn.primary { background: #3498db; color: white; }
        .action-btn.warning { background: #f39c12; color: white; }
        .action-btn.info { background: #1abc9c; color: white; }
        .action-btn.danger { background: #e74c3c; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.5rem; }
        .stat-info h3 { font-size: 1.8rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 5px 0 0; color: #666; }
        .performance-chart { background: white; border-radius: 16px; padding: 20px; margin-bottom: 25px; }
        .performance-chart h3 { margin-bottom: 20px; color: #1a3a5c; }
        .chart-item { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
        .chart-label { width: 100px; font-size: 0.85rem; }
        .chart-bar { flex: 1; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; }
        .chart-fill { height: 100%; border-radius: 15px; transition: width 0.3s; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 0.7rem; }
        .chart-value { width: 50px; text-align: right; font-weight: bold; }
        .action-buttons-group { background: white; border-radius: 16px; padding: 20px; margin-bottom: 25px; }
        .action-buttons-group h3 { margin-bottom: 15px; color: #1a3a5c; }
        .action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-sm { background: #f0f2f5; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .action-sm:hover { background: #1a3a5c; color: white; }
        .data-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .btn-primary-sm { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .class-card { background: #f8f9fa; border-radius: 12px; padding: 15px; border-left: 4px solid #27ae60; }
        .class-card h3 { margin-bottom: 5px; color: #1a3a5c; }
        .class-stats { display: flex; gap: 15px; margin: 10px 0; font-size: 0.75rem; color: #666; }
        .view-btn { background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; }
        .data-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .text-success { color: #27ae60; font-weight: 500; }
        .text-danger { color: #e74c3c; font-weight: 500; }
        .text-warning { color: #f39c12; font-weight: 500; }
        .chat-icon { background: #3498db; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; }
        .assignment-card { background: #f8f9fa; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
        .assignment-card h3 { margin-bottom: 5px; color: #1a3a5c; }
        .assignment-meta { display: flex; gap: 15px; margin: 10px 0; font-size: 0.75rem; color: #666; flex-wrap: wrap; }
        .assignment-stats { display: flex; gap: 15px; margin: 10px 0; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 0.75rem; }
        .grade-btn { background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 600px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 40px; text-align: center; }
        .profile-avatar { width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 3rem; color: #ffc107; }
        .profile-details { padding: 30px; }
        .detail-item { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1.2rem; color: #1a3a5c; width: 30px; }
        .change-password-btn { width: calc(100% - 60px); margin: 0 30px 30px; padding: 12px; background: #1a3a5c; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .no-data { text-align: center; padding: 40px; color: #999; }
        @media (max-width: 768px) { .mobile-menu-btn { display: block; } .welcome-text h1 { font-size: 1.2rem; } .stats-grid { grid-template-columns: 1fr; } .quick-actions { flex-direction: column; } .classes-grid { grid-template-columns: 1fr; } .action-buttons { flex-direction: column; } }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;