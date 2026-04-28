import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ChatModal from '../components/ChatModal';

const StudentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const navigate = useNavigate();

  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const getToken = () => localStorage.getItem('portalToken');

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

  // Fetch conversations
  const fetchConversations = async () => {
    const token = getToken();
    try {
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch teachers and admins for messaging
  const fetchUsers = async () => {
    const token = getToken();
    try {
      const [teachersRes, adminsRes] = await Promise.all([
        fetch('http://localhost:5000/api/messages/users/teacher', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/messages/admins', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const teachers = await teachersRes.json();
      const admins = await adminsRes.json();
      
      setTeachersList(teachers);
      setAdminsList(admins);
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
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const id = localStorage.getItem('userId');
    
    if (!token || role !== 'student') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Student');
      setUserEmail(email || 'student@essa.rw');
      setUserId(id || '');
      fetchDashboardData(token);
      fetchConversations();
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

  const calculateAverageScore = () => {
    if (!dashboardData?.grades || dashboardData.grades.length === 0) return 0;
    const sum = dashboardData.grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / dashboardData.grades.length).toFixed(1);
  };

  const calculateAttendanceRate = () => {
    if (!dashboardData?.attendance || dashboardData.attendance.length === 0) return 0;
    const present = dashboardData.attendance.filter(a => a.status === 'Present').length;
    return ((present / dashboardData.attendance.length) * 100).toFixed(1);
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db', description: 'Dashboard summary' },
    { id: 'grades', label: 'Grades', icon: 'fas fa-chart-simple', color: '#27ae60', description: 'View all grades' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock', color: '#f39c12', description: 'Attendance records' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', color: '#9b59b6', description: 'Homework & submissions' },
    { id: 'timetable', label: 'Timetable', icon: 'fas fa-calendar-alt', color: '#e74c3c', description: 'Class schedule' },
    { id: 'exams', label: 'Exams', icon: 'fas fa-file-alt', color: '#1abc9c', description: 'Exam schedule' },
    { id: 'fees', label: 'Fees', icon: 'fas fa-money-bill-wave', color: '#e67e22', description: 'Fee payment status' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope', color: '#9b59b6', description: 'View messages' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e', description: 'Personal information' }
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

  const sidebarWidth = sidebarCollapsed ? '80px' : '260px';
  const sidebarWidthMobile = mobileMenuOpen ? '260px' : '0px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          fetchConversations();
          fetchUnreadCount();
        }}
        recipient={selectedRecipient}
        onMessageSent={() => {
          fetchConversations();
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
                <i className="fas fa-graduation-cap" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Student</p>
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
              <i className="fas fa-graduation-cap" style={{ fontSize: '1.2rem', color: '#1a3a5c' }}></i>
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
                <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold', color: '#333' }}>Teachers</div>
                {teachersList.map(teacher => (
                  <div
                    key={teacher._id}
                    onClick={() => handleOpenChat({ id: teacher._id, name: teacher.fullName, role: 'teacher' })}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                  >
                    <div><strong>{teacher.fullName}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Teacher</div>
                  </div>
                ))}
                <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold', color: '#333' }}>Admins</div>
                {adminsList.map(admin => (
                  <div
                    key={admin._id}
                    onClick={() => handleOpenChat({ id: admin._id, name: admin.fullName, role: 'admin' })}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
                  >
                    <div><strong>{admin.fullName}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Admin</div>
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
                  fetchConversations();
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
              <p style={{ fontSize: '0.7rem', color: '#666' }}>
                {menuItems.find(i => i.id === activeTab)?.description}
              </p>
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
              <div>
                <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{userName}</div>
                <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Student</div>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ padding: '1.5rem' }}>
          {/* Welcome Banner */}
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
                    <h3 style={{ fontSize: '1.5rem', color: '#1a3a5c' }}>{calculateAverageScore()}%</h3>
                    <p>Average Grade</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#e8f8f5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-calendar-check" style={{ fontSize: '1.5rem', color: '#27ae60' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#27ae60' }}>{calculateAttendanceRate()}%</h3>
                    <p>Attendance Rate</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#fef9e7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '1.5rem', color: '#f39c12' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#f39c12' }}>{dashboardData?.completedAssignments || 0}/{dashboardData?.totalAssignments || 0}</h3>
                    <p>Assignments Done</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', background: '#f5eef8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-trophy" style={{ fontSize: '1.5rem', color: '#9b59b6' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', color: '#9b59b6' }}>{dashboardData?.grades?.length || 0}</h3>
                    <p>Total Grades</p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Recent Grades</h3>
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
                      {dashboardData?.grades?.slice(0, 5).map((grade, idx) => (
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

              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ color: '#1a3a5c' }}>Recent Attendance</h3>
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
              <h3 style={{ color: '#1a3a5c' }}>All Grades</h3>
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
              <h3 style={{ color: '#1a3a5c' }}>All Attendance Records</h3>
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
              <h3 style={{ color: '#1a3a5c' }}>Assignments</h3>
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
                        {assignment.status === 'pending' ? 'Pending Submission' : assignment.score ? `Graded: ${assignment.score}%` : 'Submitted'}
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
              <h3 style={{ color: '#1a3a5c' }}>Weekly Timetable</h3>
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
                      <div style={{ marginBottom: '8px' }}>
                        <div><strong>11:30 - 1:00</strong></div>
                        <div>Physics</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Dr. Claude - Science Lab</div>
                      </div>
                      <div>
                        <div><strong>2:00 - 3:30</strong></div>
                        <div>Computer Science</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Mr. Eric N - Comp Lab</div>
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
              <h3 style={{ color: '#1a3a5c' }}>Upcoming Exams</h3>
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
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ color: '#1a3a5c' }}>Fee Status</h3>
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
                    <td style={{ padding: '12px' }}>Term 1 2026</td>
                    <td style={{ padding: '12px' }}>150,000</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>Paid</span></td>
                    <td style={{ padding: '12px' }}>Feb 15, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>Term 2 2026</td>
                    <td style={{ padding: '12px' }}>150,000</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' }}>Pending</span></td>
                    <td style={{ padding: '12px' }}>May 15, 2026</td>
                  </tr>
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
                  onClick={() => {
                    fetchConversations();
                    fetchUnreadCount();
                  }}
                  style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>

                {/* Conversations List */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ color: '#1a3a5c', marginBottom: '1rem' }}>Your Conversations</h4>
                  {conversations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No messages yet. Start a conversation!</p>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv._id}
                        onClick={() => handleOpenChat({ 
                          id: conv.participant.id, 
                          name: conv.participant.name, 
                          role: conv.participant.role 
                        })}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          background: conv.unreadCount > 0 ? '#f0f4f8' : 'white',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal' }}>
                            {conv.participant.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#999' }}>
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                          {conv.lastMessage.content?.substring(0, 60)}...
                        </div>
                        {conv.unreadCount > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>
                              {conv.unreadCount} new
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {showChatList && (
                  <div style={{ marginTop: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: '#f8f9fa', fontWeight: 'bold' }}>Send Message to:</div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold' }}>Teachers</div>
                      {teachersList.map(teacher => (
                        <div
                          key={teacher._id}
                          onClick={() => handleOpenChat({ id: teacher._id, name: teacher.fullName, role: 'teacher' })}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        >
                          <div><strong>{teacher.fullName}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>Teacher</div>
                        </div>
                      ))}
                      <div style={{ padding: '8px 12px', background: '#f8f9fa', fontWeight: 'bold' }}>Admins</div>
                      {adminsList.map(admin => (
                        <div
                          key={admin._id}
                          onClick={() => handleOpenChat({ id: admin._id, name: admin.fullName, role: 'admin' })}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                        >
                          <div><strong>{admin.fullName}</strong></div>
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>Admin</div>
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
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Combination</label>
                  <p>{dashboardData?.student?.combination || 'Software Development'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;