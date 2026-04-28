import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ChatModal from '../components/ChatModal';

const TeacherDashboard = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [usersList, setUsersList] = useState({ admins: [], students: [], parents: [] });
  const [showChatList, setShowChatList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const navigate = useNavigate();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('portalToken');

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/messages/unread/count', {
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

  // Fetch users for chatting
  const fetchUsers = async () => {
    const token = getToken();
    try {
      const [adminsRes, studentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/messages/admins', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/messages/users/student', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const admins = await adminsRes.json();
      const students = await studentsRes.json();
      
      setUsersList({ admins, students, parents: [] });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenChat = (recipient) => {
    setSelectedRecipient(recipient);
    setShowChatModal(true);
    setShowChatList(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Fetch unread count periodically
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    
    if (!token || role !== 'teacher') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Mukansanga Marie');
      setUserEmail(email || 'teacher@essa.rw');
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    
    try {
      // Fetch students
      const studentsRes = await fetch('http://localhost:5000/api/teacher/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      
      // Fetch assignments
      const assignmentsRes = await fetch('http://localhost:5000/api/teacher/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }
      
      // Fetch grades
      const gradesRes = await fetch('http://localhost:5000/api/teacher/grades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData);
      }
      
      // Fetch attendance
      const attendanceRes = await fetch('http://localhost:5000/api/teacher/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendanceRecords(attendanceData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/portal/login');
      }
    });
  };

  const handleAddGrade = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add Grade',
      html: `
        <select id="studentId" class="swal2-select" style="width:100%; padding:8px; margin-bottom:10px;">
          <option value="">Select Student</option>
          ${students.map(s => `<option value="${s.studentId || s._id}">${s.name}</option>`).join('')}
        </select>
        <input type="text" id="studentName" class="swal2-input" placeholder="Student Name" style="width:100%; padding:8px; margin-bottom:10px;" readonly>
        <input type="text" id="subject" class="swal2-input" placeholder="Subject" style="width:100%; padding:8px; margin-bottom:10px;">
        <input type="number" id="score" class="swal2-input" placeholder="Score (0-100)" style="width:100%; padding:8px; margin-bottom:10px;">
        <select id="term" class="swal2-select" style="width:100%; padding:8px;">
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      `,
      confirmButtonText: 'Add Grade',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      didOpen: () => {
        const studentSelect = document.getElementById('studentId');
        const studentNameInput = document.getElementById('studentName');
        studentSelect.addEventListener('change', () => {
          const selectedStudent = students.find(s => (s.studentId || s._id) == studentSelect.value);
          if (selectedStudent) {
            studentNameInput.value = selectedStudent.name;
          }
        });
      },
      preConfirm: () => {
        const studentId = document.getElementById('studentId').value;
        const studentName = document.getElementById('studentName').value;
        const subject = document.getElementById('subject').value;
        const score = parseInt(document.getElementById('score').value);
        const term = document.getElementById('term').value;
        
        if (!studentId || !subject || !score) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        if (score < 0 || score > 100) {
          Swal.showValidationMessage('Score must be between 0 and 100');
          return false;
        }
        return { studentId, studentName, subject, score, term, year: 2026 };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/teacher/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Grade added successfully', 'success');
        fetchData();
      } else {
        Swal.fire('Error', 'Failed to add grade', 'error');
      }
    }
  };

  const handleCreateAssignment = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Assignment',
      html: `
        <input type="text" id="title" class="swal2-input" placeholder="Assignment Title" style="width:100%; padding:8px; margin-bottom:10px;">
        <textarea id="description" class="swal2-textarea" placeholder="Description" style="width:100%; padding:8px; margin-bottom:10px;"></textarea>
        <input type="text" id="subject" class="swal2-input" placeholder="Subject" style="width:100%; padding:8px; margin-bottom:10px;">
        <input type="date" id="dueDate" class="swal2-input" placeholder="Due Date" style="width:100%; padding:8px; margin-bottom:10px;">
        <input type="number" id="totalPoints" class="swal2-input" placeholder="Total Points" value="100" style="width:100%; padding:8px;">
      `,
      confirmButtonText: 'Create Assignment',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const subject = document.getElementById('subject').value;
        const dueDate = document.getElementById('dueDate').value;
        const totalPoints = parseInt(document.getElementById('totalPoints').value);
        
        if (!title || !subject || !dueDate) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }
        return { title, description, subject, className: 'Software Development', dueDate, totalPoints };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Assignment created successfully', 'success');
        fetchData();
      } else {
        Swal.fire('Error', 'Failed to create assignment', 'error');
      }
    }
  };

  const handleMarkAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { value: attendanceData } = await Swal.fire({
      title: 'Mark Attendance',
      html: `
        <input type="date" id="date" class="swal2-input" value="${today}" style="width:100%; padding:8px; margin-bottom:10px;">
        <input type="text" id="subject" class="swal2-input" placeholder="Subject" style="width:100%; padding:8px; margin-bottom:10px;">
        <div style="max-height: 300px; overflow-y: auto;">
          ${students.map(student => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
              <span>${student.name}</span>
              <select id="attendance-${student._id}" style="padding: 4px 8px; border-radius: 4px;">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
          `).join('')}
        </div>
      `,
      confirmButtonText: 'Save Attendance',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const date = document.getElementById('date').value;
        const subject = document.getElementById('subject').value;
        
        if (!date || !subject) {
          Swal.showValidationMessage('Please fill date and subject');
          return false;
        }
        
        const records = students.map(student => ({
          studentId: student._id,
          studentName: student.name,
          date,
          subject,
          status: document.getElementById(`attendance-${student._id}`).value
        }));
        
        return { records };
      }
    });

    if (attendanceData) {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Attendance marked successfully', 'success');
        fetchData();
      } else {
        Swal.fire('Error', 'Failed to mark attendance', 'error');
      }
    }
  };

  const handleEditGrade = async (grade) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Grade',
      html: `
        <input type="text" id="subject" class="swal2-input" value="${grade.subject}" placeholder="Subject">
        <input type="number" id="score" class="swal2-input" value="${grade.score}" placeholder="Score (0-100)">
        <select id="term" class="swal2-select">
          <option value="Term 1" ${grade.term === 'Term 1' ? 'selected' : ''}>Term 1</option>
          <option value="Term 2" ${grade.term === 'Term 2' ? 'selected' : ''}>Term 2</option>
          <option value="Term 3" ${grade.term === 'Term 3' ? 'selected' : ''}>Term 3</option>
        </select>
      `,
      confirmButtonText: 'Update Grade',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const subject = document.getElementById('subject').value;
        const score = parseInt(document.getElementById('score').value);
        const term = document.getElementById('term').value;
        
        if (!subject || !score) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { subject, score, term };
      }
    });

    if (formValues) {
      Swal.fire('Success!', 'Grade updated successfully', 'success');
      // Update in UI (would need API endpoint)
      const updatedGrades = grades.map(g => 
        g._id === grade._id ? { ...g, ...formValues } : g
      );
      setGrades(updatedGrades);
    }
  };

  const handleDeleteAssignment = async (assignmentId, title) => {
    const result = await Swal.fire({
      title: 'Delete Assignment?',
      text: `Are you sure you want to delete "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      setAssignments(assignments.filter(a => a._id !== assignmentId));
      Swal.fire('Deleted!', 'Assignment has been deleted.', 'success');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'students', label: 'My Students', icon: 'fas fa-users', color: '#27ae60' },
    { id: 'grades', label: 'Manage Grades', icon: 'fas fa-chart-simple', color: '#f39c12' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#9b59b6' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#e74c3c' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const calculateClassAverage = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / grades.length).toFixed(1);
  };

  const calculateOverallAttendance = () => {
    if (students.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + (s.attendance || 0), 0);
    return (sum / students.length).toFixed(1);
  };

  const sidebarWidth = sidebarCollapsed ? '80px' : '260px';
  const sidebarWidthMobile = mobileMenuOpen ? '260px' : '0px';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1a3a5c' }}></i>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        recipient={selectedRecipient}
        onMessageSent={() => {
          fetchUnreadCount();
        }}
      />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? sidebarWidthMobile : sidebarWidth,
        background: '#1a3a5c',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 999,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          padding: sidebarCollapsed ? '1rem 0' : '1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          position: 'relative'
        }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: '#ffc107', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem' 
              }}>
                <i className="fas fa-chalkboard-user" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Teacher</p>
            </>
          )}
          {sidebarCollapsed && (
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: '#ffc107', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto' 
            }}>
              <i className="fas fa-chalkboard-user" style={{ fontSize: '1.2rem', color: '#1a3a5c' }}></i>
            </div>
          )}
          
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                position: 'absolute',
                bottom: '-12px',
                right: '-12px',
                width: '24px',
                height: '24px',
                background: '#ffc107',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a3a5c'
              }}
            >
              <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`} style={{ fontSize: '0.7rem' }}></i>
            </button>
          )}
        </div>

        {/* Messages Button in Sidebar */}
        <div style={{ padding: '0 10px', marginBottom: '10px' }}>
          <button 
            onClick={() => {
              fetchUsers();
              setShowChatList(!showChatList);
            }} 
            style={{ 
              background: '#9b59b6', 
              color: 'white', 
              border: 'none', 
              padding: '10px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative'
            }}
          >
            <i className="fas fa-comment-dots"></i>
            {!sidebarCollapsed && <span>Messages</span>}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showChatList && (
            <div style={{
              position: 'absolute',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
              width: '260px',
              zIndex: 200,
              marginTop: '5px',
              left: sidebarCollapsed ? '70px' : '260px'
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', fontWeight: 'bold', color: '#333' }}>
                Send Message to:
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold', color: '#333' }}>Admins</div>
                {usersList.admins.map(admin => (
                  <div
                    key={admin._id}
                    onClick={() => handleOpenChat({ id: admin._id, name: admin.fullName, role: 'admin' })}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                  >
                    <div><strong>{admin.fullName}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Admin</div>
                  </div>
                ))}
                <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold', color: '#333' }}>Students</div>
                {students.map(student => (
                  <div
                    key={student._id}
                    onClick={() => handleOpenChat({ id: student._id, name: student.name, role: 'student' })}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                  >
                    <div><strong>{student.name}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Student</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileMenuOpen(false);
                if (item.id === 'messages') {
                  fetchUsers();
                  setShowChatList(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                width: '100%',
                padding: sidebarCollapsed ? '12px' : '12px 24px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                textAlign: 'left',
                position: 'relative'
              }}
            >
              <i className={item.icon} style={{ width: '20px', color: item.color, fontSize: '1.1rem' }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.id === 'messages' && unreadCount > 0 && !sidebarCollapsed && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#e74c3c',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: sidebarCollapsed ? '1rem' : '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              width: '100%',
              padding: sidebarCollapsed ? '12px' : '12px',
              background: '#e74c3c',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem'
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? '0' : sidebarWidth,
        transition: 'margin-left 0.3s ease',
        width: '100%'
      }}>
        <nav style={{
          background: 'white',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#1a3a5c'
              }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h2 style={{ color: '#1a3a5c', fontSize: '1.2rem' }}>
                {menuItems.find(i => i.id === activeTab)?.label} Dashboard
              </h2>
              <p style={{ fontSize: '0.7rem', color: '#666' }}>Manage your teaching activities</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#1a3a5c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <i className="fas fa-chalkboard-user"></i>
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{userName}</div>
                <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Teacher</div>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ padding: '1.5rem' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                color: 'white'
              }}>
                <h2 style={{ marginBottom: '0.5rem' }}>Welcome back, {userName}! 👋</h2>
                <p>Manage your classes, grade assignments, and track student progress</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#e8f4fd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-users" style={{ fontSize: '1.5rem', color: '#1a3a5c' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#1a3a5c' }}>{students.length}</h3>
                    <p>Total Students</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#e8f8f5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '1.5rem', color: '#27ae60' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#27ae60' }}>{assignments.length}</h3>
                    <p>Active Assignments</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#fef9e7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '1.5rem', color: '#f39c12' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#f39c12' }}>{calculateClassAverage()}%</h3>
                    <p>Class Average</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#f5eef8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-calendar-check" style={{ fontSize: '1.5rem', color: '#9b59b6' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#9b59b6' }}>{calculateOverallAttendance()}%</h3>
                    <p>Overall Attendance</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={handleAddGrade} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Add Grade
                </button>
                <button onClick={handleCreateAssignment} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Create Assignment
                </button>
                <button onClick={handleMarkAttendance} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  <i className="fas fa-calendar-check"></i> Mark Attendance
                </button>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Upcoming Deadlines</h3>
                <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                  {assignments.map(assignment => (
                    <div key={assignment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div>
                        <strong>{assignment.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ background: '#e8f4fd', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>
                          {assignment.submissions?.length || 0}/{students.length} submitted
                        </span>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment._id, assignment.title)}
                          style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ color: '#1a3a5c' }}>My Students</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Class</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Average Score</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Attendance</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>{student.name}</td>
                      <td style={{ padding: '12px' }}>{student.grade} {student.className}</td>
                      <td style={{ padding: '12px', color: (student.avgScore || 85) >= 80 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>{student.avgScore || 85}%</td>
                      <td style={{ padding: '12px' }}>{student.attendance || 92}%</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => handleOpenChat({ id: student._id, name: student.name, role: 'student' })}
                          style={{ background: '#1abc9c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fas fa-comment"></i> Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Student Grades</h3>
                <button onClick={handleAddGrade} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Add Grade
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Grade</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Term</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(grade => (
                    <tr key={grade._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>{grade.studentName}</td>
                      <td style={{ padding: '12px' }}>{grade.subject}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: grade.score >= 80 ? '#27ae60' : '#e74c3c' }}>{grade.score}%</td>
                      <td style={{ padding: '12px' }}><span style={{ background: grade.score >= 80 ? '#27ae60' : '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{grade.grade}</span></td>
                      <td style={{ padding: '12px' }}>{grade.term}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleEditGrade(grade)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Assignments</h3>
                <button onClick={handleCreateAssignment} style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Create Assignment
                </button>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {assignments.map(assignment => (
                  <div key={assignment._id} style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4>{assignment.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#666' }}>{assignment.subject} | Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{assignment.description}</p>
                        <p style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: '4px' }}>
                          <i className="fas fa-check-circle"></i> {assignment.submissions?.length || 0}/{students.length} submitted
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment._id, assignment.title)}
                        style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Attendance Records</h3>
                <button onClick={handleMarkAttendance} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  <i className="fas fa-calendar-check"></i> Mark Attendance
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Student Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Overall Attendance</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const todayRecord = attendanceRecords.find(r => r.studentId === student._id && new Date(r.date).toDateString() === new Date().toDateString());
                    return (
                      <tr key={student._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{student.name}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <progress value={student.attendance || 92} max="100" style={{ width: '100px', height: '8px', borderRadius: '4px' }}></progress>
                            <span style={{ fontWeight: 'bold', color: (student.attendance || 92) >= 90 ? '#27ae60' : (student.attendance || 92) >= 75 ? '#f39c12' : '#e74c3c' }}>{student.attendance || 92}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: todayRecord?.status === 'Present' ? '#d4edda' : todayRecord?.status === 'Late' ? '#fff3cd' : '#e8f4fd',
                            color: todayRecord?.status === 'Present' ? '#155724' : todayRecord?.status === 'Late' ? '#856404' : '#1a3a5c',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem'
                          }}>
                            {todayRecord?.status || 'Not Marked'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ color: '#1a3a5c' }}>Messages</h3>
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => {
                    fetchUsers();
                    setShowChatList(!showChatList);
                  }}
                  style={{ background: '#9b59b6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}
                >
                  <i className="fas fa-plus"></i> New Message
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
                
                {showChatList && (
                  <div style={{ marginTop: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: '#f8f9fa', fontWeight: 'bold' }}>Send Message to:</div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold' }}>Admins</div>
                      {usersList.admins.map(admin => (
                        <div
                          key={admin._id}
                          onClick={() => handleOpenChat({ id: admin._id, name: admin.fullName, role: 'admin' })}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        >
                          <div><strong>{admin.fullName}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>Admin</div>
                        </div>
                      ))}
                      <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold' }}>Students</div>
                      {students.map(student => (
                        <div
                          key={student._id}
                          onClick={() => handleOpenChat({ id: student._id, name: student.name, role: 'student' })}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        >
                          <div><strong>{student.name}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>Student</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '100px', height: '100px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <i className="fas fa-chalkboard-user" style={{ fontSize: '3rem', color: 'white' }}></i>
                </div>
                <h2>{userName}</h2>
                <p style={{ color: '#ffc107' }}>Teacher</p>
              </div>
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Full Name</label>
                  <p>{userName}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Email</label>
                  <p>{userEmail}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Department</label>
                  <p>Science Department</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Subjects</label>
                  <p>Mathematics, Computer Science</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Qualification</label>
                  <p>Master's Degree in Mathematics Education</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;