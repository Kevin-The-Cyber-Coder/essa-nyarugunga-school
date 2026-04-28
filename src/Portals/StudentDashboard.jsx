import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('portalToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    
    if (!token || role !== 'student') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Student');
      setUserEmail(email || 'student@essa.rw');
      fetchDashboardData(token);
    }
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard:', data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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

  const getGradeColor = (score) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 70) return '#3498db';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getAttendanceBadge = (status) => {
    const styles = {
      Present: { background: '#d4edda', color: '#155724', icon: 'fa-check-circle' },
      Late: { background: '#fff3cd', color: '#856404', icon: 'fa-clock' },
      Absent: { background: '#f8d7da', color: '#721c24', icon: 'fa-times-circle' }
    };
    const s = styles[status] || styles.Present;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', background: s.background, color: s.color }}>
        <i className={`fas ${s.icon}`}></i> {status}
      </span>
    );
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'grades', label: 'Grades', icon: 'fas fa-chart-simple', color: '#27ae60' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#f39c12' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#9b59b6' },
    { id: 'timetable', label: 'Timetable', icon: 'fas fa-calendar-alt', color: '#e74c3c' },
    { id: 'exams', label: 'Exams', icon: 'fas fa-file-alt', color: '#1abc9c' },
    { id: 'fees', label: 'Fees', icon: 'fas fa-money-bill-wave', color: '#e67e22' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

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
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            display: 'block'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0px',
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
        {/* Sidebar Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: '#ffc107', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <i className="fas fa-graduation-cap" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
          </div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{userName}</h3>
          <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Student</p>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 24px',
                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <i className={item.icon} style={{ width: '20px', color: item.color }}></i>
              <span>{item.label}</span>
              {activeTab === item.id && (
                <div style={{ marginLeft: 'auto', width: '4px', height: '20px', background: '#ffc107', borderRadius: '2px' }}></div>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button at Bottom */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              background: '#e74c3c',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '280px' : '0',
        transition: 'margin-left 0.3s ease',
        width: '100%'
      }}>
        {/* Top Navbar */}
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#1a3a5c',
                display: 'block'
              }}
            >
              <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            <div>
              <h2 style={{ color: '#1a3a5c', fontSize: '1.2rem' }}>Student Dashboard</h2>
              <p style={{ fontSize: '0.7rem', color: '#666' }}>Welcome back, {userName}</p>
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
                <i className="fas fa-user-graduate"></i>
              </div>
              <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{userName}</div>
                <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Student</div>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div style={{ padding: '1.5rem' }}>
          {/* Welcome Banner - Only on Overview */}
          {activeTab === 'overview' && (
            <div style={{
              background: 'linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Welcome back, {userName}! 👋</h2>
              <p>Here's your academic summary for {dashboardData?.student?.grade} {dashboardData?.student?.className}</p>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#e8f4fd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '1.5rem', color: '#1a3a5c' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#1a3a5c' }}>{dashboardData?.averageScore || 0}%</h3>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Average Grade</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#e8f8f5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-calendar-check" style={{ fontSize: '1.5rem', color: '#27ae60' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#27ae60' }}>{dashboardData?.attendanceRate || 0}%</h3>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Attendance Rate</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#fef9e7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '1.5rem', color: '#f39c12' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#f39c12' }}>{dashboardData?.completedAssignments || 0}/{dashboardData?.totalAssignments || 0}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Assignments Done</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#f5eef8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-trophy" style={{ fontSize: '1.5rem', color: '#9b59b6' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#9b59b6' }}>Top 15%</h3>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Class Rank</p>
                  </div>
                </div>
              </div>

              {/* Recent Grades */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Recent Grades</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Subject</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Score</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Grade</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.grades?.slice(0, 4).map((grade, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '10px' }}>{grade.subject}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: getGradeColor(grade.score) }}>{grade.score}%</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ background: getGradeColor(grade.score), color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{grade.grade}</span>
                          </td>
                          <td style={{ padding: '10px', fontSize: '0.85rem', color: '#666' }}>{grade.teacherName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Attendance */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Recent Attendance</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Subject</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.attendance?.slice(0, 5).map((record, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '10px' }}>{new Date(record.date).toLocaleDateString()}</td>
                          <td style={{ padding: '10px' }}>{record.subject}</td>
                          <td style={{ padding: '10px' }}>{getAttendanceBadge(record.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>All Grades</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Grade</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Term</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.grades?.map((grade, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{grade.subject}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: getGradeColor(grade.score) }}>{grade.score}%</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: getGradeColor(grade.score), color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{grade.grade}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{grade.term} {grade.year}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>{grade.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>All Attendance Records</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.attendance?.map((record, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '12px' }}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>{record.subject}</td>
                      <td style={{ padding: '12px' }}>{getAttendanceBadge(record.status)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>{record.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Assignments</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {dashboardData?.assignments?.map((assignment, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: assignment.status === 'pending' ? '#fff3cd' : '#d4edda',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>{assignment.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>{assignment.subject}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Due: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        background: assignment.status === 'pending' ? '#e74c3c' : '#27ae60',
                        color: 'white'
                      }}>
                        {assignment.status === 'pending' ? 'Pending Submission' : 'Submitted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timetable Tab */}
          {activeTab === 'timetable' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Weekly Timetable</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1a3a5c', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{day}</div>
                    <div style={{ padding: '10px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <div><strong>8:00 - 9:30</strong></div>
                        <div>Mathematics</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Mr. Eric - Rm 101</div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div><strong>9:45 - 11:15</strong></div>
                        <div>English</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Mme. Chantal - Rm 102</div>
                      </div>
                      <div>
                        <div><strong>11:30 - 1:00</strong></div>
                        <div>Physics</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Dr. Claude - Science Lab</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Upcoming Exams</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4>Mathematics Final Exam</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Comprehensive exam covering all topics</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>May 20, 2026</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>8:00 AM - 11:00 AM</div>
                  </div>
                </div>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4>Physics Practical</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Laboratory examination</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>May 22, 2026</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>2:00 PM - 5:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Fee Status</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a3a5c', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Term</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount (RWF)</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>Term 1</td>
                    <td style={{ padding: '12px' }}>150,000</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>Paid</span></td>
                    <td style={{ padding: '12px' }}>Feb 15, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>Term 2</td>
                    <td style={{ padding: '12px' }}>150,000</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>Pending</span></td>
                    <td style={{ padding: '12px' }}>May 15, 2026</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}>Term 3</td>
                    <td style={{ padding: '12px' }}>150,000</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>Pending</span></td>
                    <td style={{ padding: '12px' }}>Sep 15, 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '100px', height: '100px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <i className="fas fa-user-graduate" style={{ fontSize: '3rem', color: 'white' }}></i>
                </div>
                <h2>{userName}</h2>
                <p style={{ color: '#ffc107' }}>Student</p>
              </div>
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Full Name</label>
                  <p>{userName}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Email Address</label>
                  <p>{userEmail}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Student ID</label>
                  <p>{dashboardData?.student?.studentId || 'STU2024001'}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Class</label>
                  <p>{dashboardData?.student?.grade} {dashboardData?.student?.className}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;