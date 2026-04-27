import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Student data
  const [grades, setGrades] = useState([
    { subject: 'Mathematics', score: 85, grade: 'A', term: 'Term 1', teacher: 'Mr. Eric' },
    { subject: 'English', score: 78, grade: 'B+', term: 'Term 1', teacher: 'Mme. Chantal' },
    { subject: 'Physics', score: 92, grade: 'A', term: 'Term 1', teacher: 'Dr. Claude' },
    { subject: 'Chemistry', score: 88, grade: 'A-', term: 'Term 1', teacher: 'Mme. Jeanne' },
    { subject: 'Computer Science', score: 95, grade: 'A', term: 'Term 1', teacher: 'Mr. Eric N' },
    { subject: 'Kinyarwanda', score: 82, grade: 'B+', term: 'Term 1', teacher: 'Mme. Alice' }
  ]);

  const [attendance, setAttendance] = useState([
    { date: '2026-04-22', status: 'Present', subject: 'Mathematics' },
    { date: '2026-04-23', status: 'Present', subject: 'English' },
    { date: '2026-04-24', status: 'Present', subject: 'Physics' },
    { date: '2026-04-25', status: 'Late', subject: 'Chemistry' },
    { date: '2026-04-26', status: 'Present', subject: 'Computer Science' },
    { date: '2026-04-27', status: 'Absent', subject: 'Mathematics' },
    { date: '2026-04-28', status: 'Present', subject: 'English' },
    { date: '2026-04-29', status: 'Present', subject: 'Physics' },
    { date: '2026-04-30', status: 'Present', subject: 'Chemistry' },
    { date: '2026-05-01', status: 'Present', subject: 'Computer Science' }
  ]);

  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Math Project', subject: 'Mathematics', dueDate: '2026-05-10', status: 'Pending', score: null, priority: 'high' },
    { id: 2, title: 'Essay Writing', subject: 'English', dueDate: '2026-05-05', status: 'Submitted', score: 85, priority: 'medium' },
    { id: 3, title: 'Physics Lab Report', subject: 'Physics', dueDate: '2026-05-15', status: 'Pending', score: null, priority: 'high' },
    { id: 4, title: 'Programming Assignment', subject: 'Computer Science', dueDate: '2026-05-08', status: 'Submitted', score: 92, priority: 'medium' },
    { id: 5, title: 'Chemistry Quiz', subject: 'Chemistry', dueDate: '2026-05-12', status: 'Pending', score: null, priority: 'low' }
  ]);

  const [timetable, setTimetable] = useState([
    { day: 'Monday', time: '8:00 - 9:30', subject: 'Mathematics', teacher: 'Mr. Eric', room: 'Rm 101' },
    { day: 'Monday', time: '9:45 - 11:15', subject: 'English', teacher: 'Mme. Chantal', room: 'Rm 102' },
    { day: 'Monday', time: '11:30 - 1:00', subject: 'Physics', teacher: 'Dr. Claude', room: 'Science Lab' },
    { day: 'Monday', time: '2:00 - 3:30', subject: 'Computer Science', teacher: 'Mr. Eric N', room: 'Comp Lab' },
    { day: 'Tuesday', time: '8:00 - 9:30', subject: 'Chemistry', teacher: 'Mme. Jeanne', room: 'Science Lab' },
    { day: 'Tuesday', time: '9:45 - 11:15', subject: 'Mathematics', teacher: 'Mr. Eric', room: 'Rm 101' },
    { day: 'Tuesday', time: '11:30 - 1:00', subject: 'Kinyarwanda', teacher: 'Mme. Alice', room: 'Rm 103' },
    { day: 'Tuesday', time: '2:00 - 3:30', subject: 'Physical Education', teacher: 'Coach Peter', room: 'Playground' },
    { day: 'Wednesday', time: '8:00 - 9:30', subject: 'Physics', teacher: 'Dr. Claude', room: 'Science Lab' },
    { day: 'Wednesday', time: '9:45 - 11:15', subject: 'English', teacher: 'Mme. Chantal', room: 'Rm 102' },
    { day: 'Wednesday', time: '11:30 - 1:00', subject: 'Chemistry', teacher: 'Mme. Jeanne', room: 'Science Lab' },
    { day: 'Wednesday', time: '2:00 - 3:30', subject: 'Mathematics', teacher: 'Mr. Eric', room: 'Rm 101' },
    { day: 'Thursday', time: '8:00 - 9:30', subject: 'Computer Science', teacher: 'Mr. Eric N', room: 'Comp Lab' },
    { day: 'Thursday', time: '9:45 - 11:15', subject: 'Mathematics', teacher: 'Mr. Eric', room: 'Rm 101' },
    { day: 'Thursday', time: '11:30 - 1:00', subject: 'English', teacher: 'Mme. Chantal', room: 'Rm 102' },
    { day: 'Thursday', time: '2:00 - 3:30', subject: 'Library', teacher: 'Librarian', room: 'Library' },
    { day: 'Friday', time: '8:00 - 9:30', subject: 'Chemistry', teacher: 'Mme. Jeanne', room: 'Science Lab' },
    { day: 'Friday', time: '9:45 - 11:15', subject: 'Physics', teacher: 'Dr. Claude', room: 'Science Lab' },
    { day: 'Friday', time: '11:30 - 1:00', subject: 'Kinyarwanda', teacher: 'Mme. Alice', room: 'Rm 103' },
    { day: 'Friday', time: '2:00 - 3:30', subject: 'Sports', teacher: 'Coach Peter', room: 'Playground' }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('portalToken');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'student') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Student');
      setUserEmail(email || 'student@essa.rw');
      setUserAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=1a3a5c&color=fff`);
    }
  }, [navigate]);

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

  const calculateAverage = () => {
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return (sum / grades.length).toFixed(1);
  };

  const calculateAttendanceRate = () => {
    const present = attendance.filter(a => a.status === 'Present').length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  const getGradeColor = (score) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 70) return '#3498db';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const handleSubmitAssignment = () => {
    Swal.fire({
      title: 'Submit Assignment',
      html: `
        <input type="file" id="file" class="swal2-file" accept=".pdf,.doc,.docx">
        <textarea id="comment" class="swal2-textarea" placeholder="Add a comment (optional)"></textarea>
      `,
      confirmButtonText: 'Submit',
      confirmButtonColor: '#1a3a5c',
      preConfirm: () => {
        const file = document.getElementById('file').files[0];
        if (!file) {
          Swal.showValidationMessage('Please select a file to upload');
          return false;
        }
        return { fileName: file.name };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Submitted!', `Your assignment has been submitted.`, 'success');
      }
    });
  };

  const getTodaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return timetable.filter(item => item.day === today);
  };

  const todaySchedule = getTodaySchedule();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Dashboard Navbar */}
      <nav style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#1a3a5c' }}><i className="fas fa-graduation-cap" style={{ color: '#1a3a5c' }}></i> ESSA Nyarugunga</h2>
            <p style={{ fontSize: '0.7rem', color: '#666' }}>Student Portal</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={userAvatar} alt={userName} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{userName}</div>
                <div style={{ fontSize: '0.75rem', color: '#ffc107' }}>Student</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', background: '#f0f4f8' }}>
        {/* Sidebar */}
        <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e0e0e0', padding: '2rem 0' }}>
          <ul style={{ listStyle: 'none' }}>
            <li>
              <button onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'overview' ? '#1a3a5c' : '#555', background: activeTab === 'overview' ? '#f0f4f8' : 'transparent', fontWeight: activeTab === 'overview' ? '600' : 'normal' }}>
                <i className="fas fa-chart-line"></i> Overview
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('grades')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'grades' ? '#1a3a5c' : '#555', background: activeTab === 'grades' ? '#f0f4f8' : 'transparent', fontWeight: activeTab === 'grades' ? '600' : 'normal' }}>
                <i className="fas fa-chart-simple"></i> Grades
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('assignments')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'assignments' ? '#1a3a5c' : '#555', background: activeTab === 'assignments' ? '#f0f4f8' : 'transparent', fontWeight: activeTab === 'assignments' ? '600' : 'normal' }}>
                <i className="fas fa-tasks"></i> Assignments
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('timetable')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'timetable' ? '#1a3a5c' : '#555', background: activeTab === 'timetable' ? '#f0f4f8' : 'transparent', fontWeight: activeTab === 'timetable' ? '600' : 'normal' }}>
                <i className="fas fa-calendar-alt"></i> Timetable
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('attendance')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: activeTab === 'attendance' ? '#1a3a5c' : '#555', background: activeTab === 'attendance' ? '#f0f4f8' : 'transparent', fontWeight: activeTab === 'attendance' ? '600' : 'normal' }}>
                <i className="fas fa-clock"></i> Attendance
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem' }}>
          {/* Welcome Banner */}
          <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'white' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Welcome back, {userName}! 👋</h2>
              <p>Here's your academic summary for Term 1, 2026</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <i className="fas fa-calendar-alt"></i> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '55px', height: '55px', background: '#e8f4fd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '1.8rem', color: '#1a3a5c' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', color: '#1a3a5c', marginBottom: '5px' }}>{calculateAverage()}%</h3>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>Average Grade</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '55px', height: '55px', background: '#e8f8f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-calendar-check" style={{ fontSize: '1.8rem', color: '#27ae60' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', color: '#27ae60', marginBottom: '5px' }}>{calculateAttendanceRate()}%</h3>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>Attendance Rate</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '55px', height: '55px', background: '#fef9e7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-tasks" style={{ fontSize: '1.8rem', color: '#f39c12' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', color: '#f39c12', marginBottom: '5px' }}>{assignments.filter(a => a.status === 'Submitted').length}/{assignments.length}</h3>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>Assignments Completed</p>
                  </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '55px', height: '55px', background: '#f5eef8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-trophy" style={{ fontSize: '1.8rem', color: '#9b59b6' }}></i>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', color: '#9b59b6', marginBottom: '5px' }}>Top 15%</h3>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>Class Rank</p>
                  </div>
                </div>
              </div>

              {/* Recent Grades */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-chart-line"></i> Recent Grades</h3>
                <div>
                  {grades.slice(0, 4).map((grade, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8f9fa', borderRadius: '12px', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{grade.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{grade.teacher}</div>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getGradeColor(grade.score) }}>{grade.score}% <span style={{ fontSize: '0.8rem' }}>({grade.grade})</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Schedule */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-calendar-day"></i> Today's Schedule</h3>
                <div>
                  {todaySchedule.length > 0 ? todaySchedule.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '0.5rem' }}>
                      <div style={{ minWidth: '100px', fontWeight: '600', color: '#1a3a5c' }}>{item.time}</div>
                      <div style={{ flex: 1, fontWeight: '500' }}>{item.subject}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666' }}>
                        <span><i className="fas fa-chalkboard-user"></i> {item.teacher}</span>
                        <span><i className="fas fa-door-open"></i> {item.room}</span>
                      </div>
                    </div>
                  )) : <p>No classes scheduled for today</p>}
                </div>
              </div>

              {/* Pending Assignments */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-clock"></i> Pending Assignments</h3>
                <div>
                  {assignments.filter(a => a.status === 'Pending').slice(0, 3).map(assignment => (
                    <div key={assignment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff3cd', borderRadius: '10px', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ marginBottom: '0.25rem', color: '#856404' }}>{assignment.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#856404' }}>{assignment.subject}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#856404' }}>Due: {assignment.dueDate}</div>
                        <button onClick={handleSubmitAssignment} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer', marginTop: '0.25rem' }}>Submit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'grades' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-chart-line"></i> Complete Grade Report</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Teacher</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Grade</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{grade.subject}</td>
                        <td style={{ padding: '12px' }}>{grade.teacher}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: getGradeColor(grade.score) }}>{grade.score}%</td>
                        <td style={{ padding: '12px' }}><span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '6px', background: getGradeColor(grade.score), color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}>{grade.grade}</span></td>
                        <td style={{ padding: '12px' }}>{grade.term}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-tasks"></i> All Assignments</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {assignments.map(assignment => (
                  <div key={assignment.id} style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1rem', transition: 'transform 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4>{assignment.title}</h4>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', background: assignment.status === 'Submitted' ? '#d4edda' : '#fff3cd', color: assignment.status === 'Submitted' ? '#155724' : '#856404' }}>
                        {assignment.status === 'Submitted' ? <i className="fas fa-check"></i> : <i className="fas fa-clock"></i>} {assignment.status}
                      </span>
                    </div>
                    <p style={{ marginBottom: '0.75rem' }}><i className="fas fa-book"></i> {assignment.subject}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                      <span><i className="fas fa-calendar"></i> Due: {assignment.dueDate}</span>
                      {assignment.status === 'Pending' && (
                        <button onClick={handleSubmitAssignment} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}>Submit</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timetable' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-calendar-alt"></i> Weekly Timetable</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', overflowX: 'auto' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} style={{ background: '#f8f9fa', borderRadius: '12px', overflow: 'hidden', minWidth: '200px' }}>
                    <h4 style={{ background: '#1a3a5c', color: 'white', padding: '0.5rem', textAlign: 'center', margin: 0 }}>{day}</h4>
                    {timetable.filter(item => item.day === day).map((item, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem' }}>{item.time}</div>
                        <div style={{ fontWeight: '500' }}>{item.subject}</div>
                        <div style={{ fontSize: '0.65rem', color: '#888' }}>{item.teacher} | {item.room}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1a3a5c', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ffc107', display: 'inline-block' }}><i className="fas fa-clock"></i> Attendance Record</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{record.date}</td>
                        <td style={{ padding: '12px' }}>{record.subject}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', background: record.status === 'Present' ? '#d4edda' : record.status === 'Late' ? '#fff3cd' : '#f8d7da', color: record.status === 'Present' ? '#155724' : record.status === 'Late' ? '#856404' : '#721c24' }}>
                            {record.status === 'Present' && <i className="fas fa-check-circle"></i>}
                            {record.status === 'Late' && <i className="fas fa-clock"></i>}
                            {record.status === 'Absent' && <i className="fas fa-times-circle"></i>}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;