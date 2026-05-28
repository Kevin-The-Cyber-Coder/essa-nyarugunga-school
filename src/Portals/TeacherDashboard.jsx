import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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
  const [myClasses, setMyClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('portalToken');
  const currentUserId = localStorage.getItem('userId');

  // API Request function
  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 1024) setMobileMenuOpen(false);
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
    try {
      setLoading(true);
      // Fetch classes (only view, not create)
      const classesData = await apiRequest('/teacher/classes').catch(() => []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      
      // Fetch my assigned classes
      const myClassesData = await apiRequest('/teacher/my-classes').catch(() => []);
      setMyClasses(Array.isArray(myClassesData) ? myClassesData : []);
      
      // Fetch students in my classes
      const studentsData = await apiRequest('/teacher/students').catch(() => []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      
      // Fetch assignments
      const assignmentsData = await apiRequest('/teacher/assignments').catch(() => []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      
      // Fetch announcements
      const announcementsData = await apiRequest('/announcements').catch(() => []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // View class details
  const handleViewClass = (classItem) => {
    setSelectedClass(classItem);
    setActiveTab('class-detail');
  };

  // Create assignment for a class
  const handleCreateAssignment = async () => {
    if (!selectedClass) {
      Swal.fire('Error', 'Please select a class first', 'warning');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Create Assignment',
      html: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <input type="text" id="title" class="swal2-input" placeholder="Assignment Title *" required>
          <textarea id="description" class="swal2-textarea" placeholder="Description" rows="3"></textarea>
          <input type="date" id="dueDate" class="swal2-input" placeholder="Due Date">
          <input type="number" id="totalPoints" class="swal2-input" placeholder="Total Points" value="100">
        </div>
      `,
      confirmButtonText: 'Create Assignment',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('title')?.value;
        if (!title) {
          Swal.showValidationMessage('Please enter assignment title');
          return false;
        }
        return {
          title: title.trim(),
          description: document.getElementById('description')?.value || '',
          dueDate: document.getElementById('dueDate')?.value,
          totalPoints: parseInt(document.getElementById('totalPoints')?.value) || 100,
          classId: selectedClass._id
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/teacher/assignments', {
          method: 'POST',
          body: JSON.stringify(formValues)
        });
        Swal.fire('Success!', 'Assignment created successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to create assignment', 'error');
      }
    }
  };

  // Grade assignment submission
  const handleGradeSubmission = async (assignmentId, studentId, currentScore) => {
    const { value: score } = await Swal.fire({
      title: 'Grade Submission',
      input: 'number',
      inputLabel: 'Enter score',
      inputValue: currentScore || 0,
      inputAttributes: {
        min: 0,
        max: 100,
        step: 1
      },
      showCancelButton: true,
      confirmButtonText: 'Submit Grade'
    });

    if (score !== undefined) {
      try {
        await apiRequest(`/teacher/assignments/${assignmentId}/grade`, {
          method: 'PUT',
          body: JSON.stringify({ studentId, score })
        });
        Swal.fire('Success!', 'Grade submitted successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to submit grade', 'error');
      }
    }
  };

  // Mark attendance
  const handleMarkAttendance = async () => {
    if (!selectedClass) {
      Swal.fire('Error', 'Please select a class first', 'warning');
      return;
    }

    // Fetch students in the class
    const classStudents = students.filter(s => s.classId === selectedClass._id);
    
    if (classStudents.length === 0) {
      Swal.fire('No Students', 'No students enrolled in this class yet', 'info');
      return;
    }

    let attendanceHtml = '<div style="max-height: 400px; overflow-y: auto;">';
    classStudents.forEach((student, index) => {
      attendanceHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
          <span><strong>${student.fullName}</strong> (${student.studentId})</span>
          <select id="status_${student._id}" style="padding: 5px 10px; border-radius: 5px;">
            <option value="present">✅ Present</option>
            <option value="absent">❌ Absent</option>
            <option value="late">⏰ Late</option>
            <option value="excused">📝 Excused</option>
          </select>
        </div>
      `;
    });
    attendanceHtml += '</div>';

    const { value: confirm } = await Swal.fire({
      title: `Mark Attendance - ${selectedClass.grade} ${selectedClass.className}`,
      html: attendanceHtml,
      confirmButtonText: 'Save Attendance',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px'
    });

    if (confirm) {
      const attendanceData = classStudents.map(student => ({
        studentId: student._id,
        status: document.getElementById(`status_${student._id}`).value,
        date: new Date().toISOString().split('T')[0],
        classId: selectedClass._id
      }));

      try {
        await apiRequest('/teacher/attendance', {
          method: 'POST',
          body: JSON.stringify({ attendance: attendanceData })
        });
        Swal.fire('Success!', 'Attendance recorded successfully', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to record attendance', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'my-classes', label: 'My Classes', icon: 'fas fa-chalkboard', color: '#27ae60' },
    { id: 'students', label: 'My Students', icon: 'fas fa-users', color: '#9b59b6' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#f39c12' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-calendar-check', color: '#e74c3c' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '260px';
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

        <div className="sidebar-nav-wrapper">
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button 
                key={item.id} 
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
                onClick={() => { 
                  setActiveTab(item.id); 
                  setSelectedClass(null);
                  if (isMobile) setMobileMenuOpen(false); 
                }}
              >
                <i className={item.icon} style={{ color: item.color }}></i>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
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
            <h1>Welcome back, {userName.split(' ')[0]}! 📚</h1>
            <p>Manage your classes, assignments, and students from your dashboard.</p>
          </div>
          <div className="welcome-date">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e8f5e9' }}>
                  <i className="fas fa-chalkboard" style={{ color: '#27ae60' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{myClasses.length}</h3>
                  <p>My Classes</p>
                  <span className="stat-trend">Assigned classes</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  <i className="fas fa-users" style={{ color: '#3498db' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{students.length}</h3>
                  <p>Total Students</p>
                  <span className="stat-trend">Across all classes</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fff3e0' }}>
                  <i className="fas fa-tasks" style={{ color: '#f39c12' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{assignments.length}</h3>
                  <p>Assignments</p>
                  <span className="stat-trend">Created</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fdecea' }}>
                  <i className="fas fa-calendar-check" style={{ color: '#e74c3c' }}></i>
                </div>
                <div className="stat-info">
                  <h3>{new Date().toLocaleDateString()}</h3>
                  <p>Today's Date</p>
                  <span className="stat-trend">Mark attendance</span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <button onClick={() => setActiveTab('my-classes')} className="action-btn primary">
                <i className="fas fa-chalkboard"></i> View My Classes
              </button>
              {selectedClass && (
                <>
                  <button onClick={handleCreateAssignment} className="action-btn secondary">
                    <i className="fas fa-plus-circle"></i> Create Assignment
                  </button>
                  <button onClick={handleMarkAttendance} className="action-btn warning">
                    <i className="fas fa-calendar-check"></i> Mark Attendance
                  </button>
                </>
              )}
            </div>

            {/* Recent Announcements */}
            {announcements.length > 0 && (
              <div className="data-card">
                <h3><i className="fas fa-bullhorn"></i> Recent Announcements</h3>
                <div className="announcements-list">
                  {announcements.slice(0, 3).map(ann => (
                    <div key={ann._id} className="announcement-item">
                      <h4>{ann.title}</h4>
                      <p>{ann.content}</p>
                      <small>{new Date(ann.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Classes Tab - VIEW ONLY (NO CREATE BUTTON) */}
        {activeTab === 'my-classes' && (
          <div className="data-card">
            <div className="card-header">
              <h2><i className="fas fa-chalkboard"></i> My Classes</h2>
              <p className="info-text">Classes assigned by Academic Admin</p>
            </div>
            
            {myClasses.length === 0 ? (
              <div className="no-data">
                <i className="fas fa-info-circle"></i>
                <p>No classes assigned yet. Please contact Academic Admin to assign you to classes.</p>
              </div>
            ) : (
              <div className="classes-grid">
                {myClasses.map(cls => (
                  <div key={cls._id} className="class-card" onClick={() => handleViewClass(cls)}>
                    <div className="class-icon">
                      <i className="fas fa-school"></i>
                    </div>
                    <div className="class-info">
                      <h3>{cls.grade} {cls.className}</h3>
                      <p>Academic Year: {cls.academicYear}</p>
                      <p>Students: {cls.studentCount || 0}</p>
                      <span className="view-details">Click to view details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Also show all classes available (read-only) */}
            {classes.length > 0 && (
              <>
                <h3 style={{ marginTop: '30px' }}><i className="fas fa-globe"></i> All School Classes</h3>
                <div className="classes-grid">
                  {classes.map(cls => (
                    <div key={cls._id} className="class-card readonly">
                      <div className="class-icon">
                        <i className="fas fa-building"></i>
                      </div>
                      <div className="class-info">
                        <h3>{cls.grade} {cls.className}</h3>
                        <p>Teacher: {cls.teacherId?.fullName || 'Not Assigned'}</p>
                        <p>Academic Year: {cls.academicYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Class Detail Tab */}
        {activeTab === 'class-detail' && selectedClass && (
          <div className="data-card">
            <div className="card-header">
              <button className="back-btn" onClick={() => setActiveTab('my-classes')}>
                <i className="fas fa-arrow-left"></i> Back to Classes
              </button>
              <h2>{selectedClass.grade} {selectedClass.className}</h2>
            </div>
            
            <div className="class-detail-content">
              <div className="class-info-section">
                <p><strong>Academic Year:</strong> {selectedClass.academicYear}</p>
                <p><strong>Teacher:</strong> {selectedClass.teacherId?.fullName || userName}</p>
              </div>
              
              <div className="action-buttons">
                <button onClick={handleCreateAssignment} className="btn-primary">
                  <i className="fas fa-plus"></i> Create Assignment
                </button>
                <button onClick={handleMarkAttendance} className="btn-secondary">
                  <i className="fas fa-calendar-check"></i> Mark Attendance
                </button>
              </div>

              {/* Students in this class */}
              <h3>Students Enrolled</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.classId === selectedClass._id).map(student => (
                      <tr key={student._id}>
                        <td>{student.studentId}</td>
                        <td><strong>{student.fullName}</strong></td>
                        <td>{student.parentPhone || 'N/A'}</td>
                      </tr>
                    ))}
                    {students.filter(s => s.classId === selectedClass._id).length === 0 && (
                      <tr>
                        <td colSpan="3" className="no-data">No students enrolled yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Assignments for this class */}
              <h3>Assignments</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Due Date</th>
                      <th>Total Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.filter(a => a.classId === selectedClass._id).map(assignment => (
                      <tr key={assignment._id}>
                        <td>{assignment.title}</td>
                        <td>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</td>
                        <td>{assignment.totalPoints}</td>
                        <td>
                          <button 
                            className="view-btn"
                            onClick={() => Swal.fire('Assignment Details', assignment.description || 'No description', 'info')}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignments.filter(a => a.classId === selectedClass._id).length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-data">No assignments yet. Create one!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="data-card">
            <h2><i className="fas fa-users"></i> My Students</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Parent Name</th>
                    <th>Parent Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>
                      <td><strong>{student.fullName}</strong></td>
                      <td>{student.className || 'N/A'}</td>
                      <td>{student.parentName || 'N/A'}</td>
                      <td>{student.parentPhone || 'N/A'}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">No students assigned yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="data-card">
            <div className="card-header">
              <h2><i className="fas fa-tasks"></i> My Assignments</h2>
              {selectedClass && (
                <button onClick={handleCreateAssignment} className="btn-primary-sm">
                  <i className="fas fa-plus"></i> New Assignment
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Due Date</th>
                    <th>Points</th>
                    <th>Submissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => {
                    const classInfo = myClasses.find(c => c._id === assignment.classId);
                    const submissionsCount = assignment.submissions?.length || 0;
                    return (
                      <tr key={assignment._id}>
                        <td><strong>{assignment.title}</strong></td>
                        <td>{classInfo ? `${classInfo.grade} ${classInfo.className}` : 'N/A'}</td>
                        <td>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</td>
                        <td>{assignment.totalPoints}</td>
                        <td>{submissionsCount}</td>
                        <td>
                          <button 
                            className="view-btn"
                            onClick={() => Swal.fire('Assignment', assignment.description || 'No description', 'info')}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="no-data">No assignments created yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="data-card">
            <h2><i className="fas fa-calendar-check"></i> Mark Attendance</h2>
            <div className="classes-selector">
              <label>Select Class:</label>
              <select onChange={(e) => {
                const classId = e.target.value;
                const found = myClasses.find(c => c._id === classId);
                setSelectedClass(found);
              }} value={selectedClass?._id || ''}>
                <option value="">-- Select a class --</option>
                {myClasses.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.grade} {cls.className}
                  </option>
                ))}
              </select>
            </div>
            {selectedClass && (
              <button onClick={handleMarkAttendance} className="btn-primary" style={{ marginTop: '20px' }}>
                <i className="fas fa-calendar-check"></i> Mark Attendance for {selectedClass.grade} {selectedClass.className}
              </button>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="data-card">
            <h2><i className="fas fa-bullhorn"></i> School Announcements</h2>
            <div className="announcements-list">
              {announcements.map(ann => (
                <div key={ann._id} className={`announcement-item ${ann.priority}`}>
                  <div className="announcement-header">
                    <h3>{ann.title}</h3>
                    <span className={`priority-badge ${ann.priority}`}>
                      {ann.priority === 'urgent' ? '🔴 URGENT' : ann.priority === 'high' ? '⚠️ HIGH' : 'ℹ️ NORMAL'}
                    </span>
                  </div>
                  <p>{ann.content}</p>
                  <div className="announcement-footer">
                    <span><i className="fas fa-clock"></i> {new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="no-data">No announcements yet.</p>}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar"><i className="fas fa-chalkboard-user"></i></div>
              <h2>{userName}</h2>
              <p className="profile-role">Teacher</p>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <label>Email Address</label>
                  <p>{localStorage.getItem('userEmail') || 'teacher@essa.rw'}</p>
                </div>
              </div>
              <div className="detail-item">
                <i className="fas fa-shield-alt"></i>
                <div>
                  <label>Role</label>
                  <p>Teacher</p>
                </div>
              </div>
            </div>
            <button className="change-password-btn" onClick={() => {
              Swal.fire({
                title: 'Change Password',
                html: `<input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password">
                       <input type="password" id="newPassword" class="swal2-input" placeholder="New Password">
                       <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm New Password">`,
                confirmButtonText: 'Update',
                showCancelButton: true,
                preConfirm: () => {
                  const newPass = document.getElementById('newPassword')?.value;
                  const confirm = document.getElementById('confirmPassword')?.value;
                  if (newPass !== confirm) {
                    Swal.showValidationMessage('Passwords do not match');
                    return false;
                  }
                  return { newPassword: newPass };
                }
              }).then(result => {
                if (result.isConfirmed) {
                  Swal.fire('Success', 'Password updated successfully!', 'success');
                }
              });
            }}>
              <i className="fas fa-key"></i> Change Password
            </button>
          </div>
        )}
      </main>

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
        .collapse-btn { position: absolute; bottom: -12px; right: -12px; width: 24px; height: 24px; background: #ffc107; border: none; border-radius: 50%; cursor: pointer; color: #1a3a5c; display: flex; align-items: center; justify-content: center; }
        .user-profile { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .user-avatar { width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; }
        .user-avatar i { font-size: 1.8rem; color: #ffc107; }
        .user-info h4 { margin: 0; font-size: 0.9rem; }
        .user-role { font-size: 0.7rem; opacity: 0.8; }
        .sidebar-nav-wrapper { flex: 1; overflow-y: auto; overflow-x: hidden; }
        .sidebar-nav { padding: 0.5rem 0; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 20px; background: transparent; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; transition: all 0.3s; }
        .nav-item i { width: 20px; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #ffc107; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: #ffc107; border-right: 3px solid #ffc107; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .logout-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .main-content { transition: margin-left 0.3s ease; padding: 20px; min-height: 100vh; }
        .top-bar { background: white; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .top-bar-left { display: flex; align-items: center; gap: 15px; }
        .mobile-menu-btn { display: none; background: #1a3a5c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 25px 30px; margin-bottom: 25px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.5rem; }
        .stat-info h3 { font-size: 1.5rem; margin: 0; color: #1a3a5c; }
        .data-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
        .class-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: white; cursor: pointer; transition: transform 0.3s; }
        .class-card:hover { transform: translateY(-5px); }
        .class-card.readonly { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); cursor: default; }
        .class-icon { font-size: 2rem; margin-bottom: 10px; }
        .class-info h3 { margin: 0 0 5px; font-size: 1.1rem; }
        .view-details { font-size: 0.8rem; opacity: 0.9; margin-top: 10px; display: inline-block; }
        .back-btn { background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .btn-primary { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-left: 10px; }
        .action-buttons { display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }
        .info-text { color: #6c757d; font-size: 0.85rem; margin: 0; }
        .classes-selector { margin: 20px 0; }
        .classes-selector select { padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-left: 10px; }
        .quick-actions { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; }
        .action-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; }
        .action-btn.primary { background: #27ae60; color: white; }
        .action-btn.secondary { background: #3498db; color: white; }
        .action-btn.warning { background: #f39c12; color: white; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px; background: #f8f9fa; font-weight: 600; }
        .data-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .table-responsive { overflow-x: auto; }
        .no-data { text-align: center; padding: 40px; color: #999; }
        .announcement-item { padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px; border-left: 3px solid #1a3a5c; }
        .announcement-item.urgent { border-left-color: #e74c3c; background: #fdecea; }
        .announcement-item.high { border-left-color: #f39c12; background: #fff3e0; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 500px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; }
        .profile-avatar { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 2.5rem; color: #ffc107; }
        .profile-details { padding: 20px; }
        .detail-item { display: flex; gap: 15px; padding: 10px 0; border-bottom: 1px solid #eee; }
        .change-password-btn { width: calc(100% - 40px); margin: 0 20px 20px; padding: 10px; background: #1a3a5c; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .view-btn { background: #3498db; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .stats-grid { grid-template-columns: 1fr; }
          .quick-actions { flex-direction: column; }
          .action-buttons { flex-direction: column; }
          .btn-secondary { margin-left: 0; margin-top: 10px; }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;