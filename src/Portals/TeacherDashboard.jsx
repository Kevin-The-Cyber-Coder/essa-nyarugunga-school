import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const TeacherDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
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

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (!token || role !== 'teacher') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Teacher');
      fetchAllData();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    const token = getToken();
    try {
      const [classesRes, studentsRes, assignmentsRes] = await Promise.all([
        fetch(`${API_URL}/teacher/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/teacher/students`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/teacher/assignments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (classesRes.ok) setClasses(await classesRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create Class
  const handleCreateClass = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create New Class',
      html: `
        <div style="text-align: left;">
          <input type="text" id="className" class="swal2-input" placeholder="Class Name (e.g., A, B, C)" required>
          <select id="grade" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;">
            <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
            <option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option>
          </select>
          <input type="text" id="academicYear" class="swal2-input" placeholder="Academic Year (e.g., 2026)" required>
        </div>
      `,
      confirmButtonText: 'Create Class',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const className = document.getElementById('className').value;
        const grade = document.getElementById('grade').value;
        const academicYear = document.getElementById('academicYear').value;
        if (!className || !grade || !academicYear) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { className, grade, academicYear };
      }
    });

    if (formValues) {
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/create-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire('Success!', 'Class created successfully', 'success');
        fetchAllData();
      } else {
        Swal.fire('Error', 'Failed to create class', 'error');
      }
    }
  };

  // Add Student
  const handleAddStudent = async () => {
    if (classes.length === 0) {
      Swal.fire('No Classes', 'Please create a class first', 'warning');
      return;
    }
    
    const { value: formValues } = await Swal.fire({
      title: 'Add Student',
      html: `
        <div style="text-align: left;">
          <input type="text" id="fullName" class="swal2-input" placeholder="Full Name" required>
          <input type="email" id="email" class="swal2-input" placeholder="Email" required>
          <input type="text" id="studentId" class="swal2-input" placeholder="Student ID" required>
          <select id="classId" class="swal2-select" style="width: 100%; padding: 8px; margin: 5px 0;" required>
            <option value="">Select Class</option>
            ${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}
          </select>
          <input type="text" id="parentName" class="swal2-input" placeholder="Parent Name">
          <input type="text" id="parentPhone" class="swal2-input" placeholder="Parent Phone">
        </div>
      `,
      confirmButtonText: 'Add Student',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
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
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/add-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formValues)
      });
      
      if (response.ok) {
        Swal.fire({
          title: 'Student Added!',
          html: `<p><strong>Email:</strong> ${formValues.email}</p><p><strong>Password:</strong> student123</p>`,
          icon: 'success'
        });
        fetchAllData();
      } else {
        Swal.fire('Error', 'Failed to add student', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'classes', label: 'My Classes', icon: 'fas fa-school', color: '#27ae60' },
    { id: 'students', label: 'My Students', icon: 'fas fa-users', color: '#9b59b6' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1a3a5c' }}></i>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Sidebar similar to Academic Admin */}
      <aside style={{ width: sidebarWidth, background: '#1a3a5c', color: 'white', position: 'fixed', left: 0, top: 0, bottom: 0, transition: 'width 0.3s', overflow: 'hidden', zIndex: 999 }}>
        {/* Sidebar content similar */}
        <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '60px', height: '60px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <i className="fas fa-chalkboard-user" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
          </div>
          <h3>{userName}</h3>
          <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Teacher</p>
        </div>
        
        <nav style={{ padding: '1rem 0' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 20px', background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <i className={item.icon} style={{ width: '20px', color: item.color }}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'absolute', bottom: 0, width: '100%' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: sidebarWidth, padding: '20px' }}>
        <h1>Welcome, {userName}! 👨‍🏫</h1>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-school" style={{ fontSize: '2rem', color: '#27ae60' }}></i>
                <h3>{classes.length}</h3>
                <p>My Classes</p>
                <button onClick={() => setActiveTab('classes')} style={{ marginTop: '10px', background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Manage</button>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '2rem', color: '#3498db' }}></i>
                <h3>{students.length}</h3>
                <p>My Students</p>
                <button onClick={() => setActiveTab('students')} style={{ marginTop: '10px', background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Manage</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Create Class
              </button>
              <button onClick={handleAddStudent} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                <i className="fas fa-user-plus"></i> Add Student
              </button>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>My Classes</h2>
              <button onClick={handleCreateClass} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Create Class
              </button>
            </div>
            {classes.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>No classes yet. Click "Create Class" to start.</p>
            ) : (
              classes.map(c => (
                <div key={c._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                  <h3>{c.grade} {c.className}</h3>
                  <p>Academic Year: {c.academicYear}</p>
                  <button onClick={() => Swal.fire('Info', `Manage ${c.grade} ${c.className}`, 'info')} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Manage Class
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>My Students</h2>
              <button onClick={handleAddStudent} style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-plus"></i> Add Student
              </button>
            </div>
            {students.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>No students yet. Click "Add Student" to enroll.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '10px' }}>Student ID</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '10px' }}>{s.studentId}</td>
                      <td style={{ padding: '10px' }}>{s.fullName}</td>
                      <td style={{ padding: '10px' }}>{s.email}</td>
                      <td style={{ padding: '10px' }}>{s.classId?.grade} {s.classId?.className}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <i className="fas fa-chalkboard-user" style={{ fontSize: '2.5rem', color: '#1a3a5c' }}></i>
            </div>
            <h2>{userName}</h2>
            <p>Teacher</p>
            <hr />
            <p><strong>Email:</strong> {localStorage.getItem('userEmail')}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;