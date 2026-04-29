import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const TeacherDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('portalToken');

  // Check mobile screen
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
    
    if (!token || role !== 'teacher') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Teacher');
      fetchData();
      fetchUsers();
      fetchUnreadCount();
    }
  }, [navigate]);

  const fetchData = async () => {
    const token = getToken();
    try {
      const [studentsRes, classesRes, assignmentsRes] = await Promise.all([
        fetch(`${API_URL}/teacher/students`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/teacher/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/teacher/assignments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (classesRes.ok) setClasses(await classesRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
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

  // Create Class
  const handleCreateClass = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Class',
      html: `
        <input type="text" id="className" class="swal2-input" placeholder="Class Name (e.g., A)" required>
        <select id="grade" class="swal2-select">
          <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
          <option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option>
        </select>
        <input type="text" id="academicYear" class="swal2-input" placeholder="Academic Year (e.g., 2026)" required>
      `,
      confirmButtonText: 'Create Class',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const className = document.getElementById('className').value;
        const grade = document.getElementById('grade').value;
        const academicYear = document.getElementById('academicYear').value;
        if (!className || !academicYear) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { className, grade, academicYear };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Class created successfully', 'success');
        fetchData();
      } else {
        Swal.fire('Error', 'Failed to create class', 'error');
      }
    }
  };

  // Create Student
  const handleCreateStudent = async () => {
    if (classes.length === 0) {
      Swal.fire('No Classes', 'Please create a class first', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Create New Student',
      html: `
        <input type="text" id="fullName" class="swal2-input" placeholder="Full Name *" required>
        <input type="email" id="email" class="swal2-input" placeholder="Email Address *" required>
        <input type="password" id="password" class="swal2-input" placeholder="Password (auto-generated if empty)">
        <input type="text" id="studentId" class="swal2-input" placeholder="Student ID *" required>
        <select id="classId" class="swal2-select" required>
          <option value="">Select Class *</option>
          ${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}
        </select>
        <input type="text" id="parentName" class="swal2-input" placeholder="Parent Name (Optional)">
        <input type="email" id="parentEmail" class="swal2-input" placeholder="Parent Email (Optional)">
        <input type="tel" id="parentPhone" class="swal2-input" placeholder="Parent Phone (Optional)">
      `,
      confirmButtonText: 'Create Student',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const studentId = document.getElementById('studentId').value;
        const classId = document.getElementById('classId').value;
        
        if (!fullName || !email || !studentId || !classId) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }
        
        return {
          fullName, email,
          password: document.getElementById('password').value || `student${Math.floor(Math.random() * 10000)}`,
          studentId, classId,
          parentName: document.getElementById('parentName').value,
          parentEmail: document.getElementById('parentEmail').value,
          parentPhone: document.getElementById('parentPhone').value
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/create-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          title: 'Student Created!',
          html: `
            <div style="text-align:left">
              <p><strong>Email:</strong> ${formValues.email}</p>
              <p><strong>Password:</strong> ${formValues.password}</p>
              <p><strong>Student ID:</strong> ${data.student?.studentId || formValues.studentId}</p>
            </div>
          `,
          icon: 'success'
        });
        fetchData();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to create student', 'error');
      }
    }
  };

 // Edit Student
const handleEditStudent = async (student) => {
  // Get current class for the student
  const currentClass = classes.find(c => c._id === student.classId);
  
  const { value: formValues } = await Swal.fire({
    title: 'Edit Student',
    html: `
      <input type="text" id="fullName" class="swal2-input" value="${student.user?.fullName || student.fullName}" required>
      <input type="email" id="email" class="swal2-input" value="${student.user?.email || student.email}" required>
      <select id="classId" class="swal2-select" required>
        <option value="">Select Class</option>
        ${classes.map(c => `<option value="${c._id}" ${student.classId === c._id ? 'selected' : ''}>${c.grade} ${c.className}</option>`).join('')}
      </select>
    `,
    confirmButtonText: 'Update Student',
    confirmButtonColor: '#3498db',
    showCancelButton: true,
    preConfirm: () => {
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const classId = document.getElementById('classId').value;
      if (!fullName || !email || !classId) {
        Swal.showValidationMessage('Please fill required fields');
        return false;
      }
      return { fullName, email, classId };
    }
  });

  if (formValues) {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/teacher/students/${student._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Student updated successfully', 'success');
        fetchData();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to update student', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error', 'error');
    }
  }
};     // API call would go here
    }
  };

 // Delete Student
const handleDeleteStudent = async (student) => {
  const result = await Swal.fire({
    title: 'Delete Student?',
    text: `Are you sure you want to delete ${student.user?.fullName || student.fullName}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel'
  });
  
  if (result.isConfirmed) {
    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/teacher/students/${student._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        Swal.fire('Deleted!', 'Student has been removed successfully.', 'success');
        fetchData(); // Refresh the students list
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to delete student', 'error');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      Swal.fire('Error', 'Network error. Please try again.', 'error');
    }
  }
};

  // View Credentials
  const handleViewCredentials = (student) => {
    Swal.fire({
      title: `${student.user?.fullName || student.fullName}'s Credentials`,
      html: `
        <div style="text-align:left">
          <p><strong>Email:</strong> ${student.user?.email || student.email}</p>
          <p><strong>Default Password:</strong> student123</p>
          <p><strong>Student ID:</strong> ${student.studentId}</p>
          <p><strong>Login URL:</strong> ${window.location.origin}/portal/login</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Print',
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html><head><title>Student Credentials</title>
          <style>body{font-family:Arial;padding:40px}</style></head>
          <body>
            <h1>ESSA Nyarugunga School</h1>
            <h3>Student Login Credentials</h3>
            <p><strong>Name:</strong> ${student.user?.fullName || student.fullName}</p>
            <p><strong>Email:</strong> ${student.user?.email || student.email}</p>
            <p><strong>Password:</strong> student123</p>
            <p><strong>Login URL:</strong> ${window.location.origin}/portal/login</p>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    });
  };

  // Reset Password
  const handleResetPassword = async (student) => {
    const { value: newPassword } = await Swal.fire({
      title: `Reset Password for ${student.user?.fullName || student.fullName}`,
      input: 'password',
      inputLabel: 'New password',
      inputPlaceholder: 'Enter new password',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#e74c3c',
      preConfirm: (pwd) => {
        if (!pwd || pwd.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }
        return pwd;
      }
    });
    
    if (newPassword) {
      const token = getToken();
      try {
        const response = await fetch(`${API_URL}/teacher/students/${student._id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ newPassword })
        });
        
        if (response.ok) {
          Swal.fire('Success!', 'Password has been reset.', 'success');
        } else {
          Swal.fire('Error', 'Failed to reset password', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error', 'error');
      }
    }
  };

  // Request Permission
  const handleRequestPermission = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Request Permission',
      html: `
        <select id="type" class="swal2-select">
          <option value="leave">Leave</option>
          <option value="early_dismissal">Early Dismissal</option>
          <option value="sports">Sports Event</option>
          <option value="event">School Event</option>
          <option value="other">Other</option>
        </select>
        <textarea id="reason" class="swal2-textarea" placeholder="Reason for permission" required></textarea>
        <input type="date" id="fromDate" class="swal2-input" required>
        <input type="date" id="toDate" class="swal2-input" required>
      `,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const type = document.getElementById('type').value;
        const reason = document.getElementById('reason').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        if (!reason || !fromDate || !toDate) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { type, reason, fromDate, toDate };
      }
    });

    if (formValues) {
      Swal.fire('Request Submitted!', 'Your permission request has been sent to Discipline Admin.', 'success');
    }
  };

  // Report Misconduct
  const handleReportMisconduct = async () => {
    if (students.length === 0) {
      Swal.fire('No Students', 'No students available to report', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Report Student Misconduct',
      html: `
        <select id="studentId" class="swal2-select" required>
          <option value="">Select Student</option>
          ${students.map(s => `<option value="${s._id}">${s.user?.fullName || s.fullName}</option>`).join('')}
        </select>
        <select id="category" class="swal2-select">
          <option value="Late">Late to Class</option>
          <option value="Misbehavior">Misbehavior</option>
          <option value="Uniform Violation">Uniform Violation</option>
          <option value="Academic Dishonesty">Academic Dishonesty</option>
          <option value="Fighting">Fighting</option>
          <option value="Other">Other</option>
        </select>
        <textarea id="description" class="swal2-textarea" placeholder="Describe the incident" required></textarea>
        <input type="date" id="incidentDate" class="swal2-input" value="${new Date().toISOString().split('T')[0]}" required>
      `,
      confirmButtonText: 'Report Incident',
      confirmButtonColor: '#e74c3c',
      showCancelButton: true,
      preConfirm: () => {
        const studentId = document.getElementById('studentId').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const incidentDate = document.getElementById('incidentDate').value;
        if (!studentId || !description) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { studentId, category, description, incidentDate };
      }
    });

    if (formValues) {
      Swal.fire('Report Submitted!', 'The discipline case has been reported to Discipline Admin.', 'success');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'classes', label: 'Classes', icon: 'fas fa-chalkboard', color: '#27ae60' },
    { id: 'students', label: 'Students', icon: 'fas fa-users', color: '#9b59b6' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#f39c12' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#e74c3c' },
    { id: 'permissions', label: 'Permissions', icon: 'fas fa-file-alt', color: '#1abc9c' },
    { id: 'discipline', label: 'Report', icon: 'fas fa-gavel', color: '#e74c3c' },
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
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 998
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? (mobileMenuOpen ? sidebarWidth : '0px') : sidebarWidth,
        background: '#1a3a5c', color: 'white', position: 'fixed', left: 0, top: 0, bottom: 0,
        transition: 'width 0.3s ease', overflow: 'hidden', display: 'flex',
        flexDirection: 'column', zIndex: 999, boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: sidebarCollapsed ? '1rem 0' : '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ width: '60px', height: '60px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <i className="fas fa-chalkboard-user" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3 style={{ fontSize: '0.9rem' }}>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Teacher</p>
            </>
          )}
          {sidebarCollapsed && (
            <div style={{ width: '50px', height: '50px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <i className="fas fa-chalkboard-user" style={{ fontSize: '1.5rem', color: '#1a3a5c' }}></i>
            </div>
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
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap'
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
        {/* Top Navbar */}
        <div style={{
          background: 'white', padding: '10px 15px', borderRadius: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: isMobile ? 'block' : 'none' }}>
              <i className="fas fa-bars"></i>
            </button>
            <h2 style={{ color: '#1a3a5c', fontSize: '1.2rem', margin: 0 }}>
              {menuItems.find(i => i.id === activeTab)?.label} Dashboard
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fas fa-chalkboard-user"></i>
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Teacher</div>
            </div>
          </div>
        </div>

        <h1 style={{ color: '#1a3a5c', fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '20px' }}>Welcome, {userName}! 👋</h1>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: '1rem', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{students.length}</h3><p>Students</p>
                <button onClick={() => setActiveTab('students')} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>View</button>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{classes.length}</h3><p>Classes</p>
                <button onClick={() => setActiveTab('classes')} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>View</button>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <h3>{assignments.length}</h3><p>Assignments</p>
                <button onClick={() => setActiveTab('assignments')} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>View</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-plus"></i> Create Class</button>
              <button onClick={handleCreateStudent} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-user-plus"></i> Add Student</button>
              <button onClick={handleRequestPermission} style={{ background: '#1abc9c', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-file-alt"></i> Request Permission</button>
              <button onClick={handleReportMisconduct} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-gavel"></i> Report Misconduct</button>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
              <h2>My Classes</h2>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-plus"></i> New Class</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#1a3a5c', color: 'white' }}>
                <th style={{ padding: '12px' }}>Grade</th><th style={{ padding: '12px' }}>Class Name</th>
                <th style={{ padding: '12px' }}>Academic Year</th><th style={{ padding: '12px' }}>Students</th>
              </tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>{c.grade}</td>
                    <td style={{ padding: '12px' }}>{c.className}</td>
                    <td style={{ padding: '12px' }}>{c.academicYear}</td>
                    <td style={{ padding: '12px' }}>{c.students?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Students Tab with CRUD Operations */}
        {activeTab === 'students' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
              <h2>My Students</h2>
              <button onClick={handleCreateStudent} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-plus"></i> Add Student</button>
            </div>
            <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#1a3a5c', color: 'white' }}>
                <th style={{ padding: '10px' }}>ID</th><th style={{ padding: '10px' }}>Name</th><th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Class</th><th style={{ padding: '10px' }}>Actions</th>
              </tr></thead>
              <tbody>
                {students.map(s => {
                  const studentClass = classes.find(c => c._id === s.classId);
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '10px' }}><code>{s.studentId}</code></td>
                      <td style={{ padding: '10px' }}>{s.user?.fullName || s.fullName}</td>
                      <td style={{ padding: '10px' }}>{s.user?.email || s.email}</td>
                      <td style={{ padding: '10px' }}>{studentClass ? `${studentClass.grade} ${studentClass.className}` : '-'}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleViewCredentials(s)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Credentials"><i className="fas fa-key"></i></button>
                          <button onClick={() => handleEditStudent(s)} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Edit"><i className="fas fa-edit"></i></button>
                          <button onClick={() => handleResetPassword(s)} style={{ background: '#9b59b6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Reset Password"><i className="fas fa-sync-alt"></i></button>
                          <button onClick={() => handleDeleteStudent(s)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Delete"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
              <h2>Assignments</h2>
              <button onClick={handleCreateAssignment} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}><i className="fas fa-plus"></i> New Assignment</button>
            </div>
            {assignments.map(a => (
              <div key={a._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <p><strong>Due:</strong> {new Date(a.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <i className="fas fa-file-alt" style={{ fontSize: '3rem', color: '#1abc9c', marginBottom: '1rem' }}></i>
            <h3>Request Permission</h3>
            <p>Submit a permission request to the Discipline Admin</p>
            <button onClick={handleRequestPermission} style={{ background: '#1abc9c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
              <i className="fas fa-paper-plane"></i> Request Permission
            </button>
          </div>
        )}

        {/* Discipline Report Tab */}
        {activeTab === 'discipline' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <i className="fas fa-gavel" style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '1rem' }}></i>
            <h3>Report Student Misconduct</h3>
            <p>Report any student behavioral issues to the Discipline Admin</p>
            <button onClick={handleReportMisconduct} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
              <i className="fas fa-flag"></i> Report Incident
            </button>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : '70vh' }}>
            <div style={{ width: isMobile ? '100%' : '30%', borderRight: isMobile ? 'none' : '1px solid #e0e0e0', borderBottom: isMobile ? '1px solid #e0e0e0' : 'none', overflowY: 'auto', maxHeight: isMobile ? '200px' : 'auto' }}>
              <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}><h3>Chats</h3></div>
              {users.map(user => (
                <div key={user._id} onClick={() => { setSelectedUser(user); fetchMessages(user._id); }}
                  style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', cursor: 'pointer', background: selectedUser?._id === user._id ? '#f0f4f8' : 'white' }}>
                  <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.role}</div>
                </div>
              ))}
            </div>
            
            <div style={{ width: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column', height: isMobile ? '400px' : '100%' }}>
              {selectedUser ? (
                <>
                  <div style={{ padding: '1rem', background: '#1a3a5c', color: 'white' }}><h3>{selectedUser.fullName}</h3></div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {messages.map(msg => (
                      <div key={msg._id} style={{ textAlign: msg.senderId === localStorage.getItem('userId') ? 'right' : 'left', marginBottom: '1rem' }}>
                        <div style={{ display: 'inline-block', maxWidth: '70%', padding: '0.5rem 1rem', borderRadius: '12px', background: msg.senderId === localStorage.getItem('userId') ? '#1a3a5c' : '#f0f4f8', color: msg.senderId === localStorage.getItem('userId') ? 'white' : '#333' }}>
                          <div><strong>{msg.senderName}</strong></div>
                          <div>{msg.content}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <button onClick={handleSendMessage} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>Select a user to start chatting</div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
            <h2>Profile Information</h2>
            <p><strong>Name:</strong> {userName}</p>
            <p><strong>Email:</strong> {localStorage.getItem('userEmail')}</p>
            <p><strong>Role:</strong> Teacher</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;