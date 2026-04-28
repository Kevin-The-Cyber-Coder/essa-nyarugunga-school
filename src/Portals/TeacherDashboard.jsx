import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('portalToken');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          ${students.map(s => `<option value="${s.studentId}">${s.name}</option>`).join('')}
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
          const selectedStudent = students.find(s => s.studentId == studentSelect.value);
          if (selectedStudent) {
            studentNameInput.value = selectedStudent.name;
          }
        });
      },
      preConfirm: () => {
        const studentId = parseInt(document.getElementById('studentId').value);
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
              <select id="attendance-${student.studentId}" style="padding: 4px 8px; border-radius: 4px;">
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
          studentId: student.studentId,
          studentName: student.name,
          date,
          subject,
          status: document.getElementById(`attendance-${student.studentId}`).value
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'students', label: 'My Students', icon: 'fas fa-users', color: '#27ae60' },
    { id: 'grades', label: 'Manage Grades', icon: 'fas fa-chart-simple', color: '#f39c12' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#9b59b6' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#e74c3c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const calculateClassAverage = () => {
    if (students.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + (s.avgScore || 0), 0);
    return (sum / students.length).toFixed(1);
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

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileMenuOpen(false);
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
                      <span style={{ background: '#e8f4fd', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>
                        {assignment.submissions?.length || 0}/{students.length} submitted
                      </span>
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
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>{student.name}</td>
                      <td style={{ padding: '12px' }}>{student.grade} {student.className}</td>
                      <td style={{ padding: '12px', color: student.avgScore >= 80 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>{student.avgScore}%</td>
                      <td style={{ padding: '12px' }}>{student.attendance}%</td>
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
                    <div>
                      <h4>{assignment.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>{assignment.subject} | Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{assignment.description}</p>
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
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>{student.name}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <progress value={student.attendance} max="100" style={{ width: '100px', height: '8px', borderRadius: '4px' }}></progress>
                          <span style={{ fontWeight: 'bold', color: student.attendance >= 90 ? '#27ae60' : student.attendance >= 75 ? '#f39c12' : '#e74c3c' }}>{student.attendance}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;