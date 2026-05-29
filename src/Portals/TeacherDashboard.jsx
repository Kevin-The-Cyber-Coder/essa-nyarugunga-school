import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const getToken = () => localStorage.getItem('portalToken');
const authHeaders = () => ({ 
  'Content-Type': 'application/json', 
  'Authorization': `Bearer ${getToken()}` 
});

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' }) : '';

const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const getWeekdayLower = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

const roleBadge = (role) => {
  const map = {
    super_admin: { label: 'Super Admin', color: '#ffc107', bg: '#fff8e1' },
    academic_admin: { label: 'Academic Admin', color: '#27ae60', bg: '#e8f5e9' },
    discipline_admin: { label: 'Discipline Admin', color: '#e74c3c', bg: '#fdecea' },
    accounts_admin: { label: 'Accounts Admin', color: '#3498db', bg: '#e3f2fd' },
    teacher: { label: 'Teacher', color: '#9b59b6', bg: '#f3e5f5' },
    student: { label: 'Student', color: '#1abc9c', bg: '#e0f7fa' },
    parent: { label: 'Parent', color: '#e67e22', bg: '#fff3e0' },
  };
  return map[role] || { label: role || '—', color: '#666', bg: '#f0f0f0' };
};

// ─── shared UI atoms ─────────────────────────────────────────────────────────
const Badge = ({ text, color, bg, size = 11 }) => (
  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: size, fontWeight: 700, color, background: bg, whiteSpace: 'nowrap' }}>
    {typeof text === 'string' ? text.replace(/_/g, ' ').toUpperCase() : text}
  </span>
);

const Avatar = ({ name = '?', size = 36, bg = '#1a3a5c', color = '#ffc107', img }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return img
    ? <img src={img} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, letterSpacing: 1 }}>{initials}</div>;
};

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#999', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5, letterSpacing: 0.5 }}>
      {label?.toUpperCase()}{required && <span style={{ color: '#e74c3c' }}> *</span>}
    </label>
    {children}
  </div>
);

const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' };
const Inp = (props) => <input {...props} style={{ ...inputStyle, ...props.style }}
  onFocus={e => e.target.style.borderColor = '#1a3a5c'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />;
const Sel = ({ children, ...props }) => <select {...props} style={{ ...inputStyle, background: 'white', ...props.style }}>{children}</select>;
const Txt = (props) => <textarea {...props} style={{ ...inputStyle, resize: 'vertical', minHeight: 80, ...props.style }}
  onFocus={e => e.target.style.borderColor = '#1a3a5c'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />;

const Btn = ({ children, onClick, icon, color = '#1a3a5c', textColor = 'white', small, danger, disabled, style: s }) => {
  const bg = danger ? '#e74c3c' : disabled ? '#ccc' : color;
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: bg, color: textColor, border: 'none', borderRadius: 8, padding: small ? '6px 13px' : '9px 18px', fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap', ...s }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = 'brightness(1.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; } }}>
      {icon && <i className={icon} style={{ fontSize: 13 }} />}{children}
    </button>
  );
};

const StatCard = ({ icon, label, value, sub, accent = '#9b59b6', bg = '#f3e5f5', onClick }) => (
  <div onClick={onClick} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', border: '1px solid #f0f0f0' }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; } }}>
    <div style={{ width: 50, height: 50, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className={icon} style={{ fontSize: 20, color: accent }} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a3a5c', lineHeight: 1, fontFamily: 'Georgia, serif' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

const Table = ({ cols, rows, emptyMsg = 'No data found' }) => (
  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #f0f0f0' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
      <thead>
        <tr style={{ background: '#f7f9fb' }}>
          {cols.map((c, i) => <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: .8, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{c.toUpperCase()}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length} style={{ textAlign: 'center', padding: 36, color: '#bbb', fontSize: 13 }}>{emptyMsg}</tr></tr>
          : rows.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafbff'} onMouseLeave={e => e.currentTarget.style.background = ''}>{row}</tr>)}
      </tbody>
    </table>
  </div>
);
const TD = ({ children, style }) => <td style={{ padding: '10px 14px', fontSize: 13, color: '#333', ...style }}>{children}</td>;

// Offense categories
const offenseCategories = {
  minor: [
    { value: 'tardiness', label: '⏰ Tardiness/Lateness' },
    { value: 'uniform_violation', label: '👕 Uniform Violation' },
    { value: 'missing_homework', label: '📚 Missing Homework' },
    { value: 'classroom_disruption', label: '🗣️ Classroom Disruption' },
    { value: 'phone_use', label: '📱 Phone Use in Class' }
  ],
  moderate: [
    { value: 'absenteeism', label: '📅 Absenteeism' },
    { value: 'disrespect', label: '😤 Disrespect to Teacher' },
    { value: 'cheating', label: '📝 Cheating/Plagiarism' },
    { value: 'bullying_verbal', label: '😔 Verbal Bullying' },
    { value: 'property_damage_minor', label: '🔨 Minor Property Damage' }
  ],
  major: [
    { value: 'assault', label: '👊 Physical Assault' },
    { value: 'theft', label: '💰 Theft' },
    { value: 'substance_abuse', label: '🍺 Substance Abuse' },
    { value: 'cyber_bullying', label: '💻 Cyber Bullying' },
    { value: 'threats', label: '⚠️ Threatening Behavior' }
  ]
};

const assignmentTypes = [
  { value: 'homework', label: '📚 Homework' },
  { value: 'classwork', label: '📝 Classwork' },
  { value: 'project', label: '🎯 Project' },
  { value: 'quiz', label: '📋 Quiz' }
];

// ═══════════════════════════════════════════════════════════════════
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const msgEndRef = useRef(null);

  // layout
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  
  // modals
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [disciplineModal, setDisciplineModal] = useState(false);
  const [lessonModal, setLessonModal] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // forms
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', classId: '', type: 'homework', dueDate: '', totalPoints: 100
  });
  const [attendanceForm, setAttendanceForm] = useState({ date: new Date().toISOString().split('T')[0], classId: '', records: [] });
  const [disciplineForm, setDisciplineForm] = useState({
    studentId: '', category: '', description: '', incidentDate: new Date().toISOString().split('T')[0]
  });
  const [lessonForm, setLessonForm] = useState({
    title: '', topic: '', objectives: '', materials: '', shareWithStudents: true
  });
  const [studentForm, setStudentForm] = useState({
    fullName: '', email: '', parentName: '', parentPhone: '', password: ''
  });
  
  // file states
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [lessonFile, setLessonFile] = useState(null);
  
  // messaging
  const [msgUsers, setMsgUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgTab, setMsgTab] = useState('inbox');
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState(null);
  const [msgSearch, setMsgSearch] = useState('');

  const userName = localStorage.getItem('userName') || 'Teacher';
  const userId = localStorage.getItem('userId');

  // responsive
  useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth <= 1024); if (window.innerWidth > 1024) setMobileOpen(false); };
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, []);

  // socket
  useEffect(() => {
    const token = getToken(); if (!token) return;
    const sock = io(SOCKET_URL, { auth: { token } });
    setSocket(sock);
    if (userId) sock.emit('join', userId);
    sock.on('new_message', () => { fetchUnread(); fetchMsgUsers(); });
    sock.on('newMessage', () => { fetchUnread(); fetchMsgUsers(); });
    return () => sock.disconnect();
  }, [userId]);

  // auth + load
  useEffect(() => {
    const token = getToken(); 
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'teacher') { 
      navigate('/portal/login'); 
      return; 
    }
    loadAll();
  }, [navigate]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ─── API ──────────────────────────────────────────────────────────
  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...opts });
    if (!res.ok) return Promise.reject(await res.json());
    return res.json();
  }, []);

  const loadAll = () => Promise.all([
    fetchClasses(), fetchStudents(), fetchAssignments(), fetchAnnouncements(),
    fetchLessonPlans(), fetchMsgUsers(), fetchUnread()
  ]).finally(() => setLoading(false));

  const fetchClasses = () => api('/academic-admin/classes').then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => setClasses([]));
  const fetchStudents = () => api('/academic-admin/students').then(d => setStudents(Array.isArray(d) ? d : [])).catch(() => setStudents([]));
  const fetchAssignments = () => api('/teacher/assignments').then(d => setAssignments(Array.isArray(d) ? d : [])).catch(() => setAssignments([]));
  const fetchAnnouncements = () => api('/announcements').then(d => setAnnouncements(Array.isArray(d) ? d : [])).catch(() => setAnnouncements([]));
  const fetchLessonPlans = () => api('/teacher/lesson-plans').then(d => setLessonPlans(Array.isArray(d) ? d : [])).catch(() => setLessonPlans([]));
  
  const fetchMsgUsers = () => api('/messages/users').then(d => {
    const all = Object.values(d.users || d || {});
    setMsgUsers(Array.isArray(all) ? all.flat() : []);
  }).catch(() => setMsgUsers([]));
  
  const fetchUnread = () => api('/messages/unread-count').then(d => setUnread(d.count || 0)).catch(() => {});
  const fetchConversation = (uid) => api(`/messages/conversation/${uid}`).then(d => setMessages(Array.isArray(d.messages) ? d.messages : [])).catch(() => setMessages([]));
  
  const sendMessage = async () => {
    if (!msgText.trim() || !selectedUser) return;
    try {
      const res = await api('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipientId: selectedUser._id, subject: 'Direct Message', content: msgText.trim() })
      });
      setMessages(prev => [...prev, res.message]);
      setMsgText('');
      if (socket) socket.emit('sendMessage', { receiverId: selectedUser._id, ...res.message });
      fetchUnread();
    } catch (e) { console.error('Send error:', e); }
  };
  
  // Create Assignment with File Upload
  const createAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.classId || !assignmentForm.dueDate) {
      Swal.fire('Missing Fields', 'Title, class and due date required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', assignmentForm.title);
      formData.append('description', assignmentForm.description);
      formData.append('classId', assignmentForm.classId);
      formData.append('type', assignmentForm.type);
      formData.append('dueDate', assignmentForm.dueDate);
      formData.append('totalPoints', assignmentForm.totalPoints);
      if (assignmentFile) {
        formData.append('file', assignmentFile);
      }
      
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/assignments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) throw await response.json();
      
      Swal.fire('✅ Assignment Created!', 'Assignment published successfully', 'success');
      setAssignmentModal(false);
      setAssignmentForm({ title: '', description: '', classId: '', type: 'homework', dueDate: '', totalPoints: 100 });
      setAssignmentFile(null);
      fetchAssignments();
    } catch (e) { 
      Swal.fire('Error', e.message || 'Failed to create assignment', 'error'); 
    }
    finally { setSaving(false); }
  };
  
  // Upload Lesson Plan with File
  const uploadLessonPlan = async () => {
    if (!lessonForm.title || !lessonForm.topic) {
      Swal.fire('Missing Fields', 'Title and topic required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', lessonForm.title);
      formData.append('topic', lessonForm.topic);
      formData.append('objectives', lessonForm.objectives);
      formData.append('materials', lessonForm.materials);
      formData.append('shareWithStudents', lessonForm.shareWithStudents);
      if (lessonFile) {
        formData.append('file', lessonFile);
      }
      
      const token = getToken();
      const response = await fetch(`${API_URL}/teacher/lesson-plans`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) throw await response.json();
      
      Swal.fire('✅ Lesson Plan Uploaded!', 'Materials shared with students', 'success');
      setLessonModal(false);
      setLessonForm({ title: '', topic: '', objectives: '', materials: '', shareWithStudents: true });
      setLessonFile(null);
      fetchLessonPlans();
    } catch (e) { 
      Swal.fire('Error', e.message || 'Failed to upload', 'error'); 
    }
    finally { setSaving(false); }
  };
  
  // Add Student to Class
  const addStudent = async () => {
    if (!studentForm.fullName || !studentForm.parentPhone) {
      Swal.fire('Missing Fields', 'Student name and parent phone required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const studentData = { 
        ...studentForm, 
        classId: selectedClass?._id,
        password: studentForm.password || 'student123'
      };
      await api('/academic-admin/students', { method: 'POST', body: JSON.stringify(studentData) });
      Swal.fire('✅ Student Added!', `Student ${studentForm.fullName} added successfully. Password: ${studentData.password}`, 'success');
      setStudentModal(false);
      setStudentForm({ fullName: '', email: '', parentName: '', parentPhone: '', password: '' });
      fetchStudents();
    } catch (e) { 
      Swal.fire('Error', e.message || 'Failed to add student', 'error'); 
    }
    finally { setSaving(false); }
  };
  
  const reportIncident = async () => {
    if (!disciplineForm.studentId || !disciplineForm.category || !disciplineForm.description) {
      Swal.fire('Missing Fields', 'Please fill all required fields', 'warning');
      return;
    }
    setSaving(true);
    try {
      const student = students.find(s => s._id === disciplineForm.studentId);
      await api('/discipline-admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          studentId: disciplineForm.studentId,
          studentName: student?.fullName || 'Unknown',
          className: student?.classId?.className || '',
          category: disciplineForm.category,
          description: disciplineForm.description,
          status: 'pending'
        })
      });
      Swal.fire('✅ Incident Reported!', 'Report sent to Discipline Admin', 'success');
      setDisciplineModal(false);
      setDisciplineForm({ studentId: '', category: '', description: '', incidentDate: new Date().toISOString().split('T')[0] });
    } catch (e) { 
      Swal.fire('Error', e.message || 'Failed to report', 'error'); 
    }
    finally { setSaving(false); }
  };
  
  const openAttendanceModal = (cls) => {
    const classStudents = students.filter(s => s.classId?._id === cls._id);
    const records = classStudents.map(s => ({ studentId: s._id, studentName: s.fullName, status: 'present' }));
    setAttendanceForm({ date: new Date().toISOString().split('T')[0], classId: cls._id, records });
    setAttendanceModal(true);
  };
  
  const updateAttendanceStatus = (studentId, status) => {
    setAttendanceForm(prev => ({
      ...prev,
      records: prev.records.map(r => r.studentId === studentId ? { ...r, status } : r)
    }));
  };
  
  const saveAttendance = async () => {
    if (!attendanceForm.classId || !attendanceForm.records.length) {
      Swal.fire('Missing Fields', 'Please mark attendance', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api('/teacher/attendance', { method: 'POST', body: JSON.stringify(attendanceForm) });
      Swal.fire('✅ Attendance Saved!', 'Attendance recorded successfully', 'success');
      setAttendanceModal(false);
    } catch (e) { 
      Swal.fire('Error', e.message || 'Failed to save', 'error'); 
    }
    finally { setSaving(false); }
  };
  
  const filteredUsers = msgUsers.filter(u =>
    u.fullName?.toLowerCase().includes(msgSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(msgSearch.toLowerCase())
  );
  
  const pendingAssignments = assignments.filter(a => new Date(a.dueDate) > new Date()).length;
  const totalStudents = students.length;
  const today = getFormattedDate();
  const todayName = getWeekdayLower();
  
  // Sample timetable data
  const timetable = [
    { time: '8:00 - 8:45', monday: 'Mathematics - S3A', tuesday: 'Physics - S4B', wednesday: 'Mathematics - S3A', thursday: 'Staff Meeting', friday: 'Mathematics - S3A' },
    { time: '8:45 - 9:30', monday: 'Mathematics - S3A', tuesday: 'Physics - S4B', wednesday: 'Mathematics - S3A', thursday: 'Physics - S4B', friday: 'Mathematics - S3A' },
    { time: '9:30 - 10:00', monday: '☕ Break', tuesday: '☕ Break', wednesday: '☕ Break', thursday: '☕ Break', friday: '☕ Break' },
    { time: '10:00 - 10:45', monday: 'Physics - S4B', tuesday: 'Mathematics - S3A', wednesday: 'Physics - S4B', thursday: 'Mathematics - S3A', friday: 'Free Period' },
    { time: '10:45 - 11:30', monday: 'Physics - S4B', tuesday: 'Mathematics - S3A', wednesday: 'Physics - S4B', thursday: 'Mathematics - S3A', friday: 'Free Period' },
    { time: '11:30 - 12:30', monday: '🍽️ Lunch', tuesday: '🍽️ Lunch', wednesday: '🍽️ Lunch', thursday: '🍽️ Lunch', friday: '🍽️ Lunch' },
    { time: '12:30 - 13:15', monday: 'Planning Time', tuesday: 'Physics Lab', wednesday: 'Department Meeting', thursday: 'Extra Class', friday: 'Free Period' },
    { time: '13:15 - 14:00', monday: 'Planning Time', tuesday: 'Grading', wednesday: 'Planning Time', thursday: 'Grading', friday: 'Early Dismissal' }
  ];
  
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'classes', label: 'My Classes', icon: 'fas fa-school' },
    { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks', badge: pendingAssignments },
    { id: 'students', label: 'Students', icon: 'fas fa-user-graduate' },
    { id: 'discipline', label: 'Report Issue', icon: 'fas fa-exclamation-triangle' },
    { id: 'materials', label: 'Study Materials', icon: 'fas fa-book' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-comments', badge: unread },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-shield' },
  ];

  const sideW = isMobile ? 0 : sidebarOpen ? 260 : 72;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg,#0d2b42,#1a3a5c)', color: 'white', gap: 20 }}>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.15)', borderTopColor: '#ffc107', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <p style={{ margin: 0, fontSize: 16 }}>Loading Teacher Portal…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f3f8', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .tab-anim{animation:fadeIn .22s ease}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
        .sent-bubble{background:#1a3a5c;color:white;border-radius:18px 18px 4px 18px;padding:10px 15px;max-width:70%;align-self:flex-end;font-size:13px}
        .recv-bubble{background:white;color:#333;border-radius:18px 18px 18px 4px;padding:10px 15px;max-width:70%;align-self:flex-start;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
        button, .btn-hover{cursor:pointer;transition:all 0.2s ease}
        button:hover, .btn-hover:hover{filter:brightness(1.05);transform:translateY(-1px)}
        @media(max-width:768px){.hide-mobile{display:none!important}}
      `}</style>

      {isMobile && mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 998 }} />}

      {/* ─── SIDEBAR ─── */}
      <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 999, width: isMobile ? (mobileOpen ? 260 : 0) : sideW, background: 'linear-gradient(180deg,#0d1f33 0%,#1a3a5c 100%)', color: 'white', display: 'flex', flexDirection: 'column', transition: 'width .3s ease', overflow: 'hidden', boxShadow: '3px 0 20px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: '#ffc107', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-chalkboard-user" style={{ fontSize: 16, color: '#1a3a5c' }} />
          </div>
          {(sidebarOpen || isMobile) && <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600 }}>ESSA Portal</div><div style={{ fontSize: 10, opacity: .6, letterSpacing: 1 }}>TEACHER</div></div>}
          {!isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}><i className={`fas fa-chevron-${sidebarOpen ? 'left' : 'right'}`} /></button>}
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Avatar name={userName} size={36} bg='rgba(255,193,7,.2)' color='#ffc107' />
          {(sidebarOpen || isMobile) && <div><div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div><div style={{ fontSize: 10, color: '#ffc107' }}>Teacher</div></div>}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {menuItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if (isMobile) setMobileOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 16px', background: active ? 'rgba(255,193,7,.15)' : 'transparent', border: 'none', borderRight: active ? '3px solid #ffc107' : '3px solid transparent', color: active ? '#ffc107' : 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all .2s', textAlign: 'left' }}>
                <i className={item.icon} style={{ fontSize: 15, width: 18, flexShrink: 0 }} />
                {(sidebarOpen || isMobile) && <span style={{ flex: 1 }}>{item.label}</span>}
                {item.badge > 0 && (sidebarOpen || isMobile) && <span style={{ background: '#e74c3c', color: 'white', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <button onClick={() => { localStorage.clear(); navigate('/portal/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'rgba(231,76,60,.2)', border: '1px solid rgba(231,76,60,.3)', borderRadius: 9, color: '#ff8a80', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,.2)'; e.currentTarget.style.transform = ''; }}>
            <i className="fas fa-sign-out-alt" style={{ fontSize: 13 }} />{(sidebarOpen || isMobile) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : sideW, transition: 'margin-left .3s', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'white', padding: '11px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = ''}>
              <i className="fas fa-bars" />
            </button>}
            <div>
              <div style={{ fontSize: 10, color: '#aaa', letterSpacing: .5 }}>ESSA NYARUGUNGA</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>{menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {unread > 0 && <button onClick={() => setActiveTab('messages')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 17, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a3a5c'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}>
              <i className="fas fa-bell" />
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#e74c3c', color: 'white', borderRadius: '50%', fontSize: 9, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>
            </button>}
            <Avatar name={userName} size={32} />
            <div className="hide-mobile">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{userName}</div>
              <div style={{ fontSize: 10, color: '#ffc107' }}>TEACHER</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }} className="tab-anim">

          {/* ══ OVERVIEW DASHBOARD ══ */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#0d1f33,#1a3a5c)', borderRadius: 18, padding: '24px 28px', marginBottom: 22, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, boxShadow: '0 6px 24px rgba(26,58,92,.35)' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Georgia, serif', marginBottom: 5 }}>Welcome back, {userName.split(' ')[0]}! 👨‍🏫</div>
                  <div style={{ fontSize: 12, opacity: .75 }}>{today}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Btn onClick={() => setAssignmentModal(true)} icon="fas fa-plus" color="#ffc107" textColor="#1a3a5c">Create Assignment</Btn>
                  <Btn onClick={() => setLessonModal(true)} icon="fas fa-upload" color="rgba(255,255,255,.15)" textColor="white">Upload Lesson</Btn>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>
                <StatCard icon="fas fa-school" label="My Classes" value={classes.length} sub="Assigned classes" accent="#9b59b6" bg="#f3e5f5" onClick={() => setActiveTab('classes')} />
                <StatCard icon="fas fa-user-graduate" label="Students" value={totalStudents} sub="Under my care" accent="#1abc9c" bg="#e0f7fa" onClick={() => setActiveTab('students')} />
                <StatCard icon="fas fa-tasks" label="Pending Assignments" value={pendingAssignments} sub="Need grading" accent="#f39c12" bg="#fff3e0" onClick={() => setActiveTab('assignments')} />
                <StatCard icon="fas fa-book" label="Lesson Plans" value={lessonPlans.length} sub="Uploaded" accent="#3498db" bg="#e3f2fd" onClick={() => setActiveTab('materials')} />
              </div>
              
              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <Btn onClick={() => setAssignmentModal(true)} icon="fas fa-tasks" color="#9b59b6">Create Assignment</Btn>
                <Btn onClick={() => setDisciplineModal(true)} icon="fas fa-exclamation-triangle" color="#e74c3c">Report Issue</Btn>
                <Btn onClick={() => setLessonModal(true)} icon="fas fa-book" color="#3498db">Upload Lesson</Btn>
              </div>
              
              {/* Today's Timetable */}
              <div style={{ background: 'white', borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,.05)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#1a3a5c', fontWeight: 600 }}>
                  <i className="fas fa-clock" style={{ marginRight: 7, color: '#ffc107' }} /> Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={{ padding: '8px', textAlign: 'left', background: '#f7f9fb' }}>Time</th><th style={{ padding: '8px', textAlign: 'left', background: '#f7f9fb' }}>Activity</th></tr>
                  </thead>
                  <tbody>
                    {timetable.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: 12 }}>{row.time}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: 12, fontWeight: row[todayName]?.includes('Break') || row[todayName]?.includes('Lunch') ? 'normal' : 500 }}>
                          {row[todayName]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Recent Announcements */}
              <div style={{ background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#1a3a5c', fontWeight: 600 }}><i className="fas fa-bullhorn" style={{ marginRight: 7, color: '#ffc107' }} />Recent Announcements</h3>
                  <Btn small onClick={() => setActiveTab('announcements')} color="#1a3a5c">View All</Btn>
                </div>
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann._id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ann.title}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{fmt(ann.createdAt)}</div>
                  </div>
                ))}
                {announcements.length === 0 && <p style={{ textAlign: 'center', color: '#bbb', padding: 20 }}>No announcements yet</p>}
              </div>
            </div>
          )}

          {/* ══ MY CLASSES ══ */}
          {activeTab === 'classes' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>My Classes</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{classes.length} classes assigned</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
                {classes.map(cls => {
                  const classStudents = students.filter(s => s.classId?._id === cls._id);
                  return (
                    <div key={cls._id} style={{ background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,.05)', borderLeft: `4px solid #9b59b6`, transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = ''}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, color: '#1a3a5c' }}>{cls.grade} {cls.className}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>Academic Year: {cls.academicYear}</p>
                        </div>
                        <Badge text={`${classStudents.length} students`} color="#3498db" bg="#e3f2fd" />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <Btn small onClick={() => { setSelectedClass(cls); setStudentModal(true); }} icon="fas fa-user-plus" color="#27ae60">Add Student</Btn>
                        <Btn small onClick={() => openAttendanceModal(cls)} icon="fas fa-calendar-check" color="#f39c12">Take Attendance</Btn>
                        <Btn small onClick={() => { setAssignmentForm(prev => ({ ...prev, classId: cls._id })); setAssignmentModal(true); }} icon="fas fa-tasks" color="#9b59b6">Create Assignment</Btn>
                      </div>
                    </div>
                  );
                })}
                {classes.length === 0 && <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 14, color: '#bbb' }}><i className="fas fa-school" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: .3 }} />No classes assigned yet</div>}
              </div>
            </div>
          )}

          {/* ══ ASSIGNMENTS ══ */}
          {activeTab === 'assignments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Assignments</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{assignments.length} total, {pendingAssignments} pending</p></div>
                <Btn onClick={() => setAssignmentModal(true)} icon="fas fa-plus" color="#9b59b6">Create Assignment</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assignments.length === 0 && <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 14, color: '#bbb' }}><i className="fas fa-tasks" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: .3 }} />No assignments created yet</div>}
                {assignments.map(a => {
                  const isDue = new Date(a.dueDate) < new Date();
                  return (
                    <div key={a._id} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', borderLeft: `4px solid ${isDue ? '#e74c3c' : '#27ae60'}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = ''}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14, color: '#1a3a5c' }}>{a.title}</h3>
                          <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                            <Badge text={a.type} color="#9b59b6" bg="#f3e5f5" />
                            <Badge text={`Due: ${fmt(a.dueDate)}`} color={isDue ? '#e74c3c' : '#f39c12'} bg={isDue ? '#fdecea' : '#fff3e0'} />
                            <Badge text={`${a.totalPoints} pts`} color="#3498db" bg="#e3f2fd" />
                          </div>
                        </div>
                        <Btn small icon="fas fa-eye" color="#3498db" onClick={() => Swal.fire({ title: a.title, html: `<p>${a.description || 'No description'}</p>${a.fileUrl ? `<a href="${a.fileUrl}" target="_blank">Download Attachment</a>` : ''}`, width: 500 })}>View</Btn>
                      </div>
                      {a.description && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>{a.description.substring(0, 100)}...</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ STUDENTS ══ */}
          {activeTab === 'students' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>My Students</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{students.length} students enrolled</p></div>
              <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)', overflowX: 'auto' }}>
                <Table cols={['Student', 'Class', 'Parent', 'Contact', 'Actions']} emptyMsg="No students found"
                  rows={students.map(s => (
                    <><TD><div style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</div><div style={{ fontSize: 11, color: '#aaa' }}>{s.studentId || ''}</div></TD>
                      <TD>{s.classId ? <Badge text={`${s.classId.grade || ''} ${s.classId.className || ''}`} color="#3498db" bg="#e3f2fd" /> : '—'}</TD>
                      <TD style={{ fontSize: 12 }}>{s.parentName || '—'}</TD>
                      <TD style={{ fontSize: 12 }}>{s.parentPhone || '—'}</TD>
                      <TD><Btn small icon="fas fa-comment" color="#3498db" onClick={() => { setSelectedUser(s); setActiveTab('messages'); }}>Message</Btn></TD></>
                  ))}
                />
              </div>
            </div>
          )}

          {/* ══ DISCIPLINE (REPORT ISSUE) ══ */}
          {activeTab === 'discipline' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Report Student Issue</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>Report misbehavior to Discipline Admin</p></div>
              <div style={{ background: 'white', borderRadius: 14, padding: 24, maxWidth: 600, margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <Field label="Student" required>
                  <Sel value={disciplineForm.studentId} onChange={e => setDisciplineForm(p => ({ ...p, studentId: e.target.value }))}>
                    <option value="">Select student…</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.classId?.grade || ''} {s.classId?.className || ''})</option>)}
                  </Sel>
                </Field>
                <Field label="Offense Category" required>
                  <Sel value={disciplineForm.category} onChange={e => setDisciplineForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select category…</option>
                    <optgroup label="Minor Offenses">{offenseCategories.minor.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
                    <optgroup label="Moderate Offenses">{offenseCategories.moderate.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
                    <optgroup label="Major Offenses">{offenseCategories.major.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
                  </Sel>
                </Field>
                <Field label="Description" required>
                  <Txt value={disciplineForm.description} rows={4} placeholder="Describe the incident in detail..." onChange={e => setDisciplineForm(p => ({ ...p, description: e.target.value }))} />
                </Field>
                <Field label="Incident Date"><Inp type="date" value={disciplineForm.incidentDate} onChange={e => setDisciplineForm(p => ({ ...p, incidentDate: e.target.value }))} /></Field>
                <Btn onClick={reportIncident} icon="fas fa-paper-plane" color="#e74c3c" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>{saving ? 'Reporting…' : 'Report Incident'}</Btn>
              </div>
            </div>
          )}

          {/* ══ STUDY MATERIALS ══ */}
          {activeTab === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Study Materials</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{lessonPlans.length} resources shared</p></div>
                <Btn onClick={() => setLessonModal(true)} icon="fas fa-plus" color="#3498db">Upload Lesson Plan</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lessonPlans.length === 0 && <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 14, color: '#bbb' }}><i className="fas fa-book" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: .3 }} />No study materials uploaded yet</div>}
                {lessonPlans.map(lp => (
                  <div key={lp._id} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}>
                    <h3 style={{ margin: 0, fontSize: 14, color: '#1a3a5c' }}>{lp.title}</h3>
                    <p style={{ margin: '5px 0 0', fontSize: 12, color: '#666' }}>{lp.topic}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <Badge text={lp.shareWithStudents ? 'Shared with Students' : 'Draft'} color={lp.shareWithStudents ? '#27ae60' : '#f39c12'} bg={lp.shareWithStudents ? '#e8f5e9' : '#fff3e0'} />
                      {lp.fileUrl && <Btn small icon="fas fa-download" color="#3498db" onClick={() => window.open(lp.fileUrl)}>Download</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══ */}
          {activeTab === 'announcements' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>School Announcements</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{announcements.length} total</p></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.length === 0 && <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 14, color: '#bbb' }}><i className="fas fa-bullhorn" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .3 }} />No announcements yet</div>}
                {announcements.map(ann => {
                  const pc = ann.priority === 'urgent' ? '#e74c3c' : ann.priority === 'high' ? '#f39c12' : '#27ae60';
                  return (
                    <div key={ann._id} style={{ background: 'white', borderRadius: 12, padding: '15px 18px', borderLeft: `4px solid ${pc}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = ''}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 14, color: '#1a3a5c' }}>{ann.title}</h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Badge text={ann.priority} color={pc} bg={pc + '22'} />
                          <span style={{ fontSize: 11, color: '#aaa' }}>{fmt(ann.createdAt)}</span>
                        </div>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{ann.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {activeTab === 'messages' && (
            <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['inbox', 'compose'].map(t => (
                  <button key={t} onClick={() => { setMsgTab(t); if (t === 'compose') { setSelectedUser(null); setMessages([]); } }}
                    style={{ padding: '7px 18px', borderRadius: 30, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: msgTab === t ? '#1a3a5c' : '#f0f3f8', color: msgTab === t ? 'white' : '#666', transition: 'all .2s' }}>
                    {t === 'inbox' ? <><i className="fas fa-inbox" style={{ marginRight: 6 }} />Inbox{unread > 0 && <span style={{ marginLeft: 6, background: '#e74c3c', color: 'white', borderRadius: 20, fontSize: 10, padding: '1px 6px' }}>{unread}</span>}</> : <><i className="fas fa-pen" style={{ marginRight: 6 }} />New Message</>}
                  </button>
                ))}
              </div>
              {msgTab === 'inbox' ? (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: 260, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fafbff', flexShrink: 0 }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ position: 'relative' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#ccc', fontSize: 11 }} />
                        <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', padding: '7px 10px 7px 28px', border: '1px solid #eee', borderRadius: 20, fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: 28, color: '#ccc', fontSize: 13 }}>No users found</div>}
                      {filteredUsers.map(u => (
                        <div key={u._id} onClick={() => { setSelectedUser(u); fetchConversation(u._id); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', cursor: 'pointer', background: selectedUser?._id === u._id ? '#e8f0fe' : 'transparent', borderLeft: selectedUser?._id === u._id ? '3px solid #ffc107' : '3px solid transparent', transition: 'background .15s' }}>
                          <Avatar name={u.fullName} size={34} img={u.profileImage} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</div>
                            <div style={{ fontSize: 10, color: '#ffc107', fontWeight: 700 }}>{roleBadge(u.role).label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedUser ? (
                      <>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 11 }}>
                          <Avatar name={selectedUser.fullName} size={38} img={selectedUser.profileImage} />
                          <div><div style={{ fontWeight: 600, fontSize: 14, color: '#1a3a5c' }}>{selectedUser.fullName}</div><div style={{ fontSize: 11, color: '#ffc107', fontWeight: 700 }}>{roleBadge(selectedUser.role).label}</div></div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f9ff' }}>
                          {messages.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', paddingTop: 40 }}><i className="fas fa-comments" style={{ fontSize: 30, display: 'block', marginBottom: 8 }} />Start a conversation</div>}
                          {messages.map(m => (
                            <div key={m._id} className={m.senderId === userId ? 'sent-bubble' : 'recv-bubble'}>
                              <div>{m.content}</div>
                              <div style={{ fontSize: 10, opacity: .6, marginTop: 4, textAlign: 'right' }}>{fmtTime(m.createdAt)}</div>
                            </div>
                          ))}
                          <div ref={msgEndRef} />
                        </div>
                        <div style={{ padding: '10px 14px', borderTop: '1px solid #eee', display: 'flex', gap: 9, background: 'white', alignItems: 'flex-end' }}>
                          <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder={`Message ${selectedUser.fullName}…`} rows={2}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 12, resize: 'none', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                          <button onClick={sendMessage} disabled={!msgText.trim()} style={{ width: 40, height: 40, background: msgText.trim() ? '#1a3a5c' : '#ddd', border: 'none', borderRadius: '50%', cursor: msgText.trim() ? 'pointer' : 'default', color: 'white', fontSize: 15, flexShrink: 0, transition: 'all 0.2s' }}
                            onMouseEnter={e => { if (msgText.trim()) e.currentTarget.style.background = '#ffc107'; }}
                            onMouseLeave={e => { if (msgText.trim()) e.currentTarget.style.background = '#1a3a5c'; }}>
                            <i className="fas fa-paper-plane" />
                          </button>
                        </div>
                      </>
                    ) : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', gap: 10 }}><i className="fas fa-comments" style={{ fontSize: 44, opacity: .3 }} /><div style={{ fontSize: 14 }}>Select a user to message</div></div>}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, padding: 24, maxWidth: 580, margin: '0 auto', width: '100%', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 18px', color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>New Message</h3>
                  <Field label="Recipient" required>
                    <Sel value={selectedUser?._id || ''} onChange={e => setSelectedUser(msgUsers.find(u => u._id === e.target.value) || null)}>
                      <option value="">Select user…</option>
                      {msgUsers.map(u => <option key={u._id} value={u._id}>{u.fullName} — {roleBadge(u.role).label}</option>)}
                    </Sel>
                  </Field>
                  <Field label="Message" required>
                    <Txt value={msgText} onChange={e => setMsgText(e.target.value)} rows={7} placeholder="Type your message…" />
                  </Field>
                  <Btn icon="fas fa-paper-plane" color="#1a3a5c" style={{ width: '100%', justifyContent: 'center', padding: 11, marginTop: 4 }}
                    onClick={async () => { if (!selectedUser || !msgText.trim()) { Swal.fire('Error', 'Select recipient and enter message', 'warning'); return; } await sendMessage(); Swal.fire('✅ Sent!', '', 'success'); setMsgTab('inbox'); }}>Send Message</Btn>
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div style={{ background: 'linear-gradient(135deg,#0d1f33,#1a3a5c)', borderRadius: 18, padding: '30px', textAlign: 'center', marginBottom: 18, color: 'white' }}>
                <Avatar name={userName} size={72} bg='rgba(255,193,7,.2)' color='#ffc107' />
                <h2 style={{ margin: '14px 0 3px', fontFamily: 'Georgia, serif', fontSize: 22 }}>{userName}</h2>
                <div style={{ fontSize: 11, opacity: .7, letterSpacing: 1 }}>TEACHER</div>
                <div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{localStorage.getItem('userEmail') || 'teacher@essa.rw'}</div>
              </div>
              <div style={{ background: 'white', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#1a3a5c', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-lock" style={{ color: '#ffc107' }} />Change Password
                </h3>
                {[['Current Password', 'currentPw'], ['New Password', 'newPw'], ['Confirm New Password', 'confirmPw']].map(([label, id]) => (
                  <Field key={id} label={label} required><Inp type="password" id={id} placeholder={`Enter ${label.toLowerCase()}`} /></Field>
                ))}
                <Btn icon="fas fa-key" color="#1a3a5c" onClick={() => {
                  const cur = document.getElementById('currentPw')?.value;
                  const nw = document.getElementById('newPw')?.value;
                  const cf = document.getElementById('confirmPw')?.value;
                  if (!cur || !nw || !cf) { Swal.fire('Error', 'All fields required', 'warning'); return; }
                  if (nw !== cf) { Swal.fire('Error', 'Passwords do not match', 'error'); return; }
                  if (nw.length < 6) { Swal.fire('Error', 'Min 6 characters', 'error'); return; }
                  api('/user/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) })
                    .then(() => Swal.fire('✅ Password Updated!', '', 'success'))
                    .catch(e => Swal.fire('Error', e.message || 'Current password incorrect', 'error'));
                }}>Update Password</Btn>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS ─── */}
      
      {/* Create Assignment Modal */}
      <Modal open={assignmentModal} onClose={() => setAssignmentModal(false)} title="Create Assignment" width={560}>
        <Field label="Title" required><Inp value={assignmentForm.title} placeholder="Assignment title" onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Class" required>
          <Sel value={assignmentForm.classId} onChange={e => setAssignmentForm(p => ({ ...p, classId: e.target.value }))}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.grade} {c.className}</option>)}
          </Sel>
        </Field>
        <Field label="Assignment Type">
          <Sel value={assignmentForm.type} onChange={e => setAssignmentForm(p => ({ ...p, type: e.target.value }))}>
            {assignmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Sel>
        </Field>
        <Field label="Description"><Txt value={assignmentForm.description} rows={4} placeholder="Instructions for students..." onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))} /></Field>
        <Field label="Due Date" required><Inp type="datetime-local" value={assignmentForm.dueDate} onChange={e => setAssignmentForm(p => ({ ...p, dueDate: e.target.value }))} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Total Points"><Inp type="number" value={assignmentForm.totalPoints} onChange={e => setAssignmentForm(p => ({ ...p, totalPoints: parseInt(e.target.value) }))} /></Field>
          <Field label="Attachment (PDF/DOC)"><input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => setAssignmentFile(e.target.files[0])} style={{ fontSize: 13, padding: '6px 0' }} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setAssignmentModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={createAssignment} icon="fas fa-paper-plane" color="#9b59b6" disabled={saving}>{saving ? 'Creating…' : 'Create Assignment'}</Btn>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal open={studentModal} onClose={() => setStudentModal(false)} title={`Add Student to ${selectedClass?.grade || ''} ${selectedClass?.className || ''}`} width={500}>
        <Field label="Full Name" required><Inp value={studentForm.fullName} placeholder="Student full name" onChange={e => setStudentForm(p => ({ ...p, fullName: e.target.value }))} /></Field>
        <Field label="Email"><Inp type="email" value={studentForm.email} placeholder="student@essa.rw" onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} /></Field>
        <Field label="Parent/Guardian Name"><Inp value={studentForm.parentName} placeholder="Parent/Guardian name" onChange={e => setStudentForm(p => ({ ...p, parentName: e.target.value }))} /></Field>
        <Field label="Parent Phone" required><Inp value={studentForm.parentPhone} placeholder="+250 788 000 000" onChange={e => setStudentForm(p => ({ ...p, parentPhone: e.target.value }))} /></Field>
        <Field label="Password"><Inp type="password" value={studentForm.password} placeholder="Leave blank for auto-generate" onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} /></Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setStudentModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={addStudent} icon="fas fa-user-plus" color="#27ae60" disabled={saving}>{saving ? 'Adding…' : 'Add Student'}</Btn>
        </div>
      </Modal>

      {/* Report Incident Modal */}
      <Modal open={disciplineModal} onClose={() => setDisciplineModal(false)} title="Report Student Misbehavior" width={560}>
        <Field label="Student" required>
          <Sel value={disciplineForm.studentId} onChange={e => setDisciplineForm(p => ({ ...p, studentId: e.target.value }))}>
            <option value="">Select student…</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.classId?.grade || ''} {s.classId?.className || ''})</option>)}
          </Sel>
        </Field>
        <Field label="Offense Category" required>
          <Sel value={disciplineForm.category} onChange={e => setDisciplineForm(p => ({ ...p, category: e.target.value }))}>
            <option value="">Select category…</option>
            {[...offenseCategories.minor, ...offenseCategories.moderate, ...offenseCategories.major].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Sel>
        </Field>
        <Field label="Description" required><Txt value={disciplineForm.description} rows={4} placeholder="Describe what happened..." onChange={e => setDisciplineForm(p => ({ ...p, description: e.target.value }))} /></Field>
        <Field label="Incident Date"><Inp type="date" value={disciplineForm.incidentDate} onChange={e => setDisciplineForm(p => ({ ...p, incidentDate: e.target.value }))} /></Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setDisciplineModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={reportIncident} icon="fas fa-exclamation-triangle" color="#e74c3c" disabled={saving}>{saving ? 'Reporting…' : 'Report Incident'}</Btn>
        </div>
      </Modal>

      {/* Take Attendance Modal */}
      <Modal open={attendanceModal} onClose={() => setAttendanceModal(false)} title="Take Attendance" width={600}>
        <Field label="Date"><Inp type="date" value={attendanceForm.date} onChange={e => setAttendanceForm(p => ({ ...p, date: e.target.value }))} /></Field>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {attendanceForm.records.map(record => (
            <div key={record.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: 13 }}>{record.studentName}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['present', 'absent', 'late', 'excused'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateAttendanceStatus(record.studentId, status)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: '1px solid #ddd',
                      background: record.status === status ? (status === 'present' ? '#27ae60' : status === 'absent' ? '#e74c3c' : status === 'late' ? '#f39c12' : '#3498db') : 'white',
                      color: record.status === status ? 'white' : '#666',
                      cursor: 'pointer',
                      fontSize: 11,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (record.status !== status) e.currentTarget.style.background = '#f0f0f0'; }}
                    onMouseLeave={e => { if (record.status !== status) e.currentTarget.style.background = 'white'; }}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn onClick={() => setAttendanceModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={saveAttendance} icon="fas fa-save" color="#27ae60" disabled={saving}>{saving ? 'Saving…' : 'Save Attendance'}</Btn>
        </div>
      </Modal>

      {/* Upload Lesson Plan Modal */}
      <Modal open={lessonModal} onClose={() => setLessonModal(false)} title="Upload Lesson Plan / Study Materials" width={540}>
        <Field label="Lesson Title" required><Inp value={lessonForm.title} placeholder="Lesson title" onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Topic/Chapter" required><Inp value={lessonForm.topic} placeholder="Topic or chapter name" onChange={e => setLessonForm(p => ({ ...p, topic: e.target.value }))} /></Field>
        <Field label="Learning Objectives"><Txt value={lessonForm.objectives} rows={2} placeholder="What students will learn..." onChange={e => setLessonForm(p => ({ ...p, objectives: e.target.value }))} /></Field>
        <Field label="Materials Needed"><Inp value={lessonForm.materials} placeholder="Required materials/resources" onChange={e => setLessonForm(p => ({ ...p, materials: e.target.value }))} /></Field>
        <Field label="File Attachment (PDF/DOC/PPT)"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png" onChange={e => setLessonFile(e.target.files[0])} style={{ fontSize: 13, padding: '6px 0' }} /></Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <input type="checkbox" checked={lessonForm.shareWithStudents} onChange={e => setLessonForm(p => ({ ...p, shareWithStudents: e.target.checked }))} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 12, color: '#666' }}>Share with students immediately</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setLessonModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={uploadLessonPlan} icon="fas fa-upload" color="#3498db" disabled={saving}>{saving ? 'Uploading…' : 'Upload Lesson'}</Btn>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;