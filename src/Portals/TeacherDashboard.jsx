import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const TeacherDashboard = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
  
  const getToken = () => localStorage.getItem('portalToken');

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    
    if (!token) {
      navigate('/portal/login');
      return;
    }
    
    if (role !== 'teacher') {
      navigate('/portal/login');
      return;
    }
    
    setUserName(name || 'Teacher');
    setUserEmail(email || 'teacher@essa.rw');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      console.error('No token found');
      setLoading(false);
      return;
    }
    
    try {
      // Fetch students
      const studentsRes = await fetch(`${API_URL}/teacher/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students:', studentsRes.status);
      }
      
      // Fetch classes
      const classesRes = await fetch(`${API_URL}/teacher/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data);
      } else {
        console.error('Failed to fetch classes:', classesRes.status);
      }
      
      // Fetch assignments
      const assignmentsRes = await fetch(`${API_URL}/teacher/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      } else {
        console.error('Failed to fetch assignments:', assignmentsRes.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        <div style="text-align: left;">
          <input type="text" id="fullName" class="swal2-input" placeholder="Full Name *" required>
          <input type="email" id="email" class="swal2-input" placeholder="Email Address *" required>
          <input type="password" id="password" class="swal2-input" placeholder="Password (auto-generated if empty)">
          <input type="text" id="studentId" class="swal2-input" placeholder="Student ID *" required>
          <select id="classId" class="swal2-select" required>
            <option value="">Select Class *</option>
            ${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}
          </select>
        </div>
      `,
      confirmButtonText: 'Create Student',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
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
          studentId, classId
        };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  // Delete Student
  const handleDeleteStudent = async (student) => {
    const result = await Swal.fire({
      title: 'Delete Student?',
      text: `Are you sure you want to delete ${student.user?.fullName || student.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Delete'
    });
    
    if (result.isConfirmed) {
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/students/${student._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        Swal.fire('Deleted!', 'Student removed', 'success');
        fetchData();
      } else {
        Swal.fire('Error', 'Failed to delete student', 'error');
      }
    }
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
      confirmButtonText: 'OK'
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'students', label: 'Students', icon: 'fas fa-users', color: '#9b59b6' },
    { id: 'classes', label: 'Classes', icon: 'fas fa-school', color: '#27ae60' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#f39c12' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '260px';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1a3a5c' }}></i>
        <p style={{ marginLeft: '10px' }}>Loading dashboard...</p>
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
              <h3>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Teacher</p>
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
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap'
              }}>
              <i className={item.icon} style={{ width: '20px', color: item.color }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
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
          background: 'white', padding: '10px 15px', borderRadius: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: isMobile ? 'block' : 'none' }}>
              <i className="fas fa-bars"></i>
            </button>
            <h2 style={{ color: '#1a3a5c', margin: 0 }}>Teacher Dashboard</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', background: '#1a3a5c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fas fa-chalkboard-user"></i>
            </div>
            <div>
              <div style={{ fontWeight: '600' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Teacher</div>
            </div>
          </div>
        </div>

        <h1 style={{ color: '#1a3a5c', marginBottom: '20px' }}>Welcome, {userName}! 👋</h1>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: '1rem', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '2rem', color: '#3498db' }}></i>
                <h3>{students.length}</h3>
                <p>Students</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-school" style={{ fontSize: '2rem', color: '#27ae60' }}></i>
                <h3>{classes.length}</h3>
                <p>Classes</p>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-tasks" style={{ fontSize: '2rem', color: '#f39c12' }}></i>
                <h3>{assignments.length}</h3>
                <p>Assignments</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Create Class
              </button>
              <button onClick={handleCreateStudent} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-user-plus"></i> Add Student
              </button>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <h2>My Students</h2>
              <button onClick={handleCreateStudent} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Add Student
              </button>
            </div>
            {students.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No students yet. Click "Add Student" to create one.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '10px' }}>Student ID</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Class</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
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
                            <button onClick={() => handleViewCredentials(s)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Credentials">
                              <i className="fas fa-key"></i>
                            </button>
                            <button onClick={() => handleResetPassword(s)} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Reset Password">
                              <i className="fas fa-sync-alt"></i>
                            </button>
                            <button onClick={() => handleDeleteStudent(s)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Delete">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>My Classes</h2>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Add Class
              </button>
            </div>
            {classes.length === 0 ? (
              <p>No classes created yet. Click "Add Class" to create one.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '10px' }}>Grade</th>
                    <th style={{ padding: '10px' }}>Class Name</th>
                    <th style={{ padding: '10px' }}>Academic Year</th>
                    <th style={{ padding: '10px' }}>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '10px' }}>{c.grade}</td>
                      <td style={{ padding: '10px' }}>{c.className}</td>
                      <td style={{ padding: '10px' }}>{c.academicYear}</td>
                      <td style={{ padding: '10px' }}>{c.students?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>Assignments</h2>
              <button onClick={() => setActiveTab('classes')} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Create Assignment
              </button>
            </div>
            {assignments.length === 0 ? (
              <p>No assignments yet. Create a class first.</p>
            ) : (
              assignments.map(a => (
                <div key={a._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <p><strong>Due:</strong> {new Date(a.dueDate).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '80px', height: '80px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <i className="fas fa-chalkboard-user" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h2>{userName}</h2>
              <p style={{ color: '#ffc107' }}>Teacher</p>
            </div>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <p><strong>Email:</strong> {userEmail}</p>
              <p><strong>Role:</strong> Teacher</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;