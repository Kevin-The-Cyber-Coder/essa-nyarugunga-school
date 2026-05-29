import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const getToken = () => localStorage.getItem('portalToken');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' }) : '';

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
    <button onClick={onClick} disabled={disabled} style={{ background: bg, color: textColor, border: 'none', borderRadius: 8, padding: small ? '6px 13px' : '9px 18px', fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'filter .2s, transform .2s', whiteSpace: 'nowrap', ...s }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}>
      {icon && <i className={icon} style={{ fontSize: 13 }} />}{children}
    </button>
  );
};

const StatCard = ({ icon, label, value, sub, accent = '#e74c3c', bg = '#fdecea', onClick }) => (
  <div onClick={onClick} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)', cursor: onClick ? 'pointer' : 'default', transition: 'transform .2s, box-shadow .2s', border: '1px solid #f0f0f0' }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.12)'; } }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; }}>
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
          ? <tr><td colSpan={cols.length} style={{ textAlign: 'center', padding: 36, color: '#bbb', fontSize: 13 }}>{emptyMsg}</td></tr>
          : rows.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }} onMouseEnter={e => e.currentTarget.style.background = '#fafbff'} onMouseLeave={e => e.currentTarget.style.background = ''}>{row}</tr>)}
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
    { value: 'littering', label: '🗑️ Littering' }
  ],
  moderate: [
    { value: 'absenteeism', label: '📅 Absenteeism' },
    { value: 'disrespect', label: '😤 Disrespect to Staff' },
    { value: 'cheating', label: '📝 Cheating/Plagiarism' },
    { value: 'phone_use', label: '📱 Phone in Class' },
    { value: 'minor_fighting', label: '👊 Minor Fighting' },
    { value: 'property_damage_minor', label: '🔨 Property Damage (Minor)' }
  ],
  major: [
    { value: 'bullying', label: '😔 Bullying/Harassment' },
    { value: 'theft', label: '💰 Theft' },
    { value: 'substance_abuse', label: '🍺 Substance Abuse' },
    { value: 'assault', label: '👊 Physical Assault' },
    { value: 'vandalism', label: '🎨 Vandalism' },
    { value: 'threats', label: '⚠️ Threatening Behavior' },
    { value: 'exam_malpractise', label: '📄 Exam Malpractice' },
    { value: 'criminal_activity', label: '⚖️ Criminal Activity' }
  ]
};

// Punishment options
const punishmentOptions = {
  minor: [
    { value: 'verbal_warning', label: '📢 Verbal Warning', duration: 'Immediate' },
    { value: 'written_warning', label: '📝 Written Warning', duration: 'Recorded' },
    { value: 'extra_assignment', label: '📚 Extra Assignment', duration: '1 week' },
    { value: 'cleanup_duty', label: '🧹 Cleanup Duty', duration: '3 days' },
    { value: 'detention_1h', label: '⏰ Detention (1 hour)', duration: '1 day' }
  ],
  moderate: [
    { value: 'community_service', label: '🤝 Community Service', duration: '2-4 weeks' },
    { value: 'loss_privileges', label: '🚫 Loss of Privileges', duration: '2 weeks' },
    { value: 'parent_conference', label: '👪 Parent Conference', duration: 'Scheduled' },
    { value: 'counseling', label: '💬 Counseling', duration: '4 sessions' },
    { value: 'academic_probation', label: '📉 Academic Probation', duration: '1 term' },
    { value: 'detention_1week', label: '⏰ Detention (1 week)', duration: '1 week' }
  ],
  major: [
    { value: 'suspension_3days', label: '🚫 Suspension (3 days)', duration: '3 days' },
    { value: 'suspension_1week', label: '🚫 Suspension (1 week)', duration: '1 week' },
    { value: 'suspension_2weeks', label: '🚫 Suspension (2 weeks)', duration: '2 weeks' },
    { value: 'suspension_1month', label: '🚫 Suspension (1 month)', duration: '1 month' },
    { value: 'expulsion', label: '❌ Expulsion (Permanent)', duration: 'Permanent', requiresPrincipal: true },
    { value: 'legal_referral', label: '⚖️ Legal Referral', duration: 'N/A', requiresPrincipal: true }
  ]
};

// ═══════════════════════════════════════════════════════════════════
const DisciplineAdminDashboard = () => {
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
  const [disciplineCases, setDisciplineCases] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [disciplineStats, setDisciplineStats] = useState({ total: 0, pending: 0, resolved: 0, suspended: 0, probation: 0 });
  
  // modals
  const [incidentModal, setIncidentModal] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [massMessageModal, setMassMessageModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // forms
  const [incidentForm, setIncidentForm] = useState({
    studentId: '', category: '', description: '', severity: 'moderate', evidence: ''
  });
  const [permissionForm, setPermissionForm] = useState({
    studentId: '', type: 'medical', reason: '', fromDate: '', toDate: '', attachment: ''
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', audience: 'all', priority: 'normal'
  });
  const [messageForm, setMessageForm] = useState({
    subject: '', content: '', audience: 'all', messageType: 'email'
  });
  
  // filters
  const [caseFilter, setCaseFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // messaging
  const [msgUsers, setMsgUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgTab, setMsgTab] = useState('inbox');
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState(null);
  const [msgSearch, setMsgSearch] = useState('');

  const userName = localStorage.getItem('userName') || 'Discipline Admin';
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
    const token = getToken(); const role = localStorage.getItem('userRole');
    if (!token || role !== 'discipline_admin') { navigate('/portal/login'); return; }
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
    fetchDisciplineCases(), fetchPermissions(), fetchAnnouncements(),
    fetchStudents(), fetchClasses(), fetchTeachers(),
    fetchMsgUsers(), fetchUnread()
  ]).finally(() => setLoading(false));

  const fetchDisciplineCases = () => api('/discipline-admin/cases').then(d => {
    const cases = Array.isArray(d) ? d : [];
    setDisciplineCases(cases);
    const pending = cases.filter(c => c.status === 'pending').length;
    const resolved = cases.filter(c => c.status === 'resolved').length;
    const suspended = cases.filter(c => c.action?.includes('suspension')).length;
    setDisciplineStats({ total: cases.length, pending, resolved, suspended, probation: 0 });
  }).catch(() => setDisciplineCases([]));
  
  const fetchPermissions = () => api('/permissions').then(d => setPermissions(Array.isArray(d) ? d : [])).catch(() => setPermissions([]));
  const fetchAnnouncements = () => api('/announcements').then(d => setAnnouncements(Array.isArray(d) ? d : [])).catch(() => setAnnouncements([]));
  const fetchStudents = () => api('/academic-admin/students').then(d => setStudents(Array.isArray(d) ? d : [])).catch(() => setStudents([]));
  const fetchClasses = () => api('/academic-admin/classes').then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => setClasses([]));
  const fetchTeachers = () => api('/academic-admin/teachers-list').then(d => setTeachers(Array.isArray(d) ? d : [])).catch(() => setTeachers([]));
  
  const fetchMsgUsers = () => api('/messages/users').then(d => {
    const all = Object.values(d.users || d || {}).flat();
    setMsgUsers(all);
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
  
  const sendMassMessage = async () => {
    if (!messageForm.subject || !messageForm.content) {
      Swal.fire('Missing Fields', 'Subject and content required', 'warning');
      return;
    }
    setSaving(true);
    try {
      // Get recipients based on audience
      let recipients = [];
      if (messageForm.audience === 'all_parents') {
        recipients = students.map(s => ({ id: s.userId, name: s.parentName }));
      } else if (messageForm.audience === 'all_teachers') {
        recipients = teachers;
      } else if (messageForm.audience === 'all_students') {
        recipients = students;
      }
      
      // Send mass message (batch)
      for (const recipient of recipients.slice(0, 50)) { // Limit to 50 per batch
        if (recipient.id) {
          await api('/messages/send', {
            method: 'POST',
            body: JSON.stringify({ recipientId: recipient.id, subject: messageForm.subject, content: messageForm.content })
          }).catch(() => {});
        }
      }
      Swal.fire('✅ Messages Sent!', `Messages sent to ${messageForm.audience.replace(/_/g, ' ')}`, 'success');
      setMassMessageModal(false);
      setMessageForm({ subject: '', content: '', audience: 'all_parents', messageType: 'email' });
    } catch (e) { Swal.fire('Error', e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };
  
  const reportIncident = async () => {
    if (!incidentForm.studentId || !incidentForm.category || !incidentForm.description) {
      Swal.fire('Missing Fields', 'Please fill all required fields', 'warning');
      return;
    }
    setSaving(true);
    try {
      const student = students.find(s => s._id === incidentForm.studentId);
      await api('/discipline-admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          studentId: incidentForm.studentId,
          studentName: student?.fullName || 'Unknown',
          className: student?.classId?.className || '',
          category: incidentForm.category,
          description: incidentForm.description,
          status: 'pending'
        })
      });
      Swal.fire('✅ Incident Reported!', 'Case has been recorded', 'success');
      setIncidentModal(false);
      setIncidentForm({ studentId: '', category: '', description: '', severity: 'moderate', evidence: '' });
      fetchDisciplineCases();
    } catch (e) { Swal.fire('Error', e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };
  
  const takeAction = async (caseItem) => {
    const actionOptions = {
      warning: '📢 Warning',
      detention: '⏰ Detention',
      community_service: '🤝 Community Service',
      suspension: '🚫 Suspension',
      expulsion: '❌ Expulsion'
    };
    
    const { value: action } = await Swal.fire({
      title: `Take Action - ${caseItem.studentName}`,
      text: caseItem.description,
      input: 'select',
      inputOptions: actionOptions,
      inputPlaceholder: 'Select punishment',
      showCancelButton: true,
      confirmButtonText: 'Apply',
      confirmButtonColor: '#e74c3c'
    });
    
    if (!action) return;
    
    const { value: details } = await Swal.fire({
      title: 'Additional Details',
      input: 'textarea',
      inputPlaceholder: 'Enter details (duration, conditions, etc.)',
      showCancelButton: true
    });
    
    try {
      await api(`/discipline-admin/cases/${caseItem._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          action,
          actionDetails: details || '',
          status: 'resolved',
          reviewedBy: userId
        })
      });
      Swal.fire('✅ Action Applied!', `Punishment: ${action}`, 'success');
      fetchDisciplineCases();
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
  };
  
  const processPermission = async (permission, status) => {
    const isReject = status === 'rejected';
    const result = await Swal.fire({
      title: `${isReject ? 'Reject' : 'Approve'} Permission Request`,
      text: `${permission.requesterName} - ${permission.reason || permission.type}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isReject ? '❌ Reject' : '✅ Approve',
      confirmButtonColor: isReject ? '#e74c3c' : '#27ae60',
      ...(isReject && { input: 'textarea', inputLabel: 'Reason for rejection' })
    });
    if (!result.isConfirmed) return;
    
    try {
      await api(`/permissions/${permission._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason: result.value || '' })
      });
      Swal.fire(`${isReject ? 'Rejected' : 'Approved'}!`, '', 'success');
      fetchPermissions();
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
  };
  
  const postAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      Swal.fire('Missing Fields', 'Title and content required', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementForm)
      });
      Swal.fire('📢 Posted!', 'Announcement published', 'success');
      setAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', audience: 'all', priority: 'normal' });
      fetchAnnouncements();
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
    finally { setSaving(false); }
  };
  
  const requestPermission = async () => {
    if (!permissionForm.type || !permissionForm.reason) {
      Swal.fire('Missing Fields', 'Please fill required fields', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api('/permissions', {
        method: 'POST',
        body: JSON.stringify({
          type: permissionForm.type,
          reason: permissionForm.reason,
          fromDate: permissionForm.fromDate,
          toDate: permissionForm.toDate
        })
      });
      Swal.fire('✅ Request Submitted!', 'Your permission request has been sent to Super Admin', 'success');
      setPermissionModal(false);
      setPermissionForm({ studentId: '', type: 'medical', reason: '', fromDate: '', toDate: '', attachment: '' });
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
    finally { setSaving(false); }
  };

  const filteredCases = disciplineCases.filter(c => {
    if (caseFilter !== 'all' && c.status !== caseFilter) return false;
    if (classFilter && c.className !== classFilter) return false;
    if (searchTerm && !c.studentName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  
  const filteredUsers = msgUsers.filter(u =>
    u.fullName?.toLowerCase().includes(msgSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(msgSearch.toLowerCase())
  );
  
  const pendingPermissions = permissions.filter(p => p.status === 'pending').length;
  const pendingCases = disciplineCases.filter(c => c.status === 'pending').length;
  const resolvedCases = disciplineCases.filter(c => c.status === 'resolved').length;

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'cases', label: 'Discipline Cases', icon: 'fas fa-gavel', badge: pendingCases },
    { id: 'permissions', label: 'Permission Requests', icon: 'fas fa-file-signature', badge: pendingPermissions },
    { id: 'students', label: 'Students', icon: 'fas fa-user-graduate' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-comments', badge: unread },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-shield' },
  ];

  const sideW = isMobile ? 0 : sidebarOpen ? 260 : 72;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg,#0d2b42,#1a3a5c)', color: 'white', gap: 20 }}>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.15)', borderTopColor: '#ffc107', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <p style={{ margin: 0, fontSize: 16 }}>Loading Discipline Portal…</p>
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
        @media(max-width:768px){.hide-mobile{display:none!important}}
      `}</style>

      {isMobile && mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 998 }} />}

      {/* ─── SIDEBAR ─── */}
      <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 999, width: isMobile ? (mobileOpen ? 260 : 0) : sideW, background: 'linear-gradient(180deg,#0d1f33 0%,#1a3a5c 100%)', color: 'white', display: 'flex', flexDirection: 'column', transition: 'width .3s ease', overflow: 'hidden', boxShadow: '3px 0 20px rgba(0,0,0,.18)' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: '#ffc107', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fas fa-gavel" style={{ fontSize: 16, color: '#1a3a5c' }} />
          </div>
          {(sidebarOpen || isMobile) && <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600 }}>ESSA Portal</div><div style={{ fontSize: 10, opacity: .6, letterSpacing: 1 }}>DISCIPLINE ADMIN</div></div>}
          {!isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}><i className={`fas fa-chevron-${sidebarOpen ? 'left' : 'right'}`} /></button>}
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Avatar name={userName} size={36} bg='rgba(255,193,7,.2)' color='#ffc107' />
          {(sidebarOpen || isMobile) && <div><div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div><div style={{ fontSize: 10, color: '#ffc107' }}>Discipline Admin</div></div>}
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
          <button onClick={() => { localStorage.clear(); navigate('/portal/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'rgba(231,76,60,.2)', border: '1px solid rgba(231,76,60,.3)', borderRadius: 9, color: '#ff8a80', cursor: 'pointer', fontSize: 13 }}>
            <i className="fas fa-sign-out-alt" style={{ fontSize: 13 }} />{(sidebarOpen || isMobile) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : sideW, transition: 'margin-left .3s', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'white', padding: '11px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}><i className="fas fa-bars" /></button>}
            <div>
              <div style={{ fontSize: 10, color: '#aaa', letterSpacing: .5 }}>ESSA NYARUGUNGA</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>{menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setPermissionModal(true)} style={{ background: '#fdecea', border: 'none', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#e74c3c', cursor: 'pointer' }}>
              <i className="fas fa-file-alt" style={{ marginRight: 5 }} /> Request Permission
            </button>
            {unread > 0 && <button onClick={() => setActiveTab('messages')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 17 }}>
              <i className="fas fa-bell" />
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#e74c3c', color: 'white', borderRadius: '50%', fontSize: 9, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>
            </button>}
            <Avatar name={userName} size={32} />
            <div className="hide-mobile">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{userName}</div>
              <div style={{ fontSize: 10, color: '#ffc107' }}>DISCIPLINE ADMIN</div>
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
                  <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Georgia, serif', marginBottom: 5 }}>Welcome, {userName.split(' ')[0]}! ⚖️</div>
                  <div style={{ fontSize: 12, opacity: .75 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Btn onClick={() => setIncidentModal(true)} icon="fas fa-exclamation-triangle" color="#e74c3c">Report Incident</Btn>
                  <Btn onClick={() => setAnnouncementModal(true)} icon="fas fa-bullhorn" color="rgba(255,255,255,.15)" textColor="white">Post Announcement</Btn>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>
                <StatCard icon="fas fa-clock" label="Pending Cases" value={pendingCases} sub="Awaiting review" accent="#f39c12" bg="#fff3e0" onClick={() => setActiveTab('cases')} />
                <StatCard icon="fas fa-check-circle" label="Resolved Cases" value={resolvedCases} sub="Completed" accent="#27ae60" bg="#e8f5e9" onClick={() => setActiveTab('cases')} />
                <StatCard icon="fas fa-file-signature" label="Permission Requests" value={pendingPermissions} sub="Pending approval" accent="#3498db" bg="#e3f2fd" onClick={() => setActiveTab('permissions')} />
                <StatCard icon="fas fa-ban" label="Suspensions" value={disciplineStats.suspended || 0} sub="Active" accent="#e74c3c" bg="#fdecea" />
                <StatCard icon="fas fa-users" label="Total Students" value={students.length} sub="Enrolled" accent="#9b59b6" bg="#f3e5f5" onClick={() => setActiveTab('students')} />
              </div>
              
              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <Btn onClick={() => setIncidentModal(true)} icon="fas fa-plus" color="#e74c3c">New Incident</Btn>
                <Btn onClick={() => setMassMessageModal(true)} icon="fas fa-envelope" color="#3498db">Mass Message</Btn>
                <Btn onClick={() => setAnnouncementModal(true)} icon="fas fa-bullhorn" color="#1a3a5c">Post Announcement</Btn>
                <Btn onClick={() => setReportModal(true)} icon="fas fa-chart-bar" color="#27ae60">Generate Report</Btn>
              </div>
              
              {/* Recent Cases */}
              <div style={{ background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#1a3a5c', fontWeight: 600 }}><i className="fas fa-gavel" style={{ marginRight: 7, color: '#e74c3c' }} />Recent Cases</h3>
                  <Btn small onClick={() => setActiveTab('cases')} color="#1a3a5c">View All</Btn>
                </div>
                {disciplineCases.slice(0, 5).map(c => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.studentName}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{c.category} · {fmt(c.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge text={c.status} color={c.status === 'pending' ? '#f39c12' : '#27ae60'} bg={c.status === 'pending' ? '#fff3e0' : '#e8f5e9'} />
                      {c.status === 'pending' && <Btn small onClick={() => takeAction(c)} icon="fas fa-hammer" color="#e74c3c">Act</Btn>}
                    </div>
                  </div>
                ))}
                {disciplineCases.length === 0 && <p style={{ textAlign: 'center', color: '#bbb', padding: 20 }}>No cases reported</p>}
              </div>
            </div>
          )}

          {/* ══ DISCIPLINE CASES ══ */}
          {activeTab === 'cases' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Discipline Cases</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{filteredCases.length} cases found</p></div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Btn onClick={() => setIncidentModal(true)} icon="fas fa-plus" color="#e74c3c">Report Incident</Btn>
                  <select value={caseFilter} onChange={e => setCaseFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}>
                    <option value="all">All Cases</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search student..." style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12, width: 180 }} />
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <Table cols={['Student', 'Class', 'Offense', 'Reported', 'Status', 'Action']} emptyMsg="No discipline cases found"
                  rows={filteredCases.map(c => (
                    <><TD><div style={{ fontWeight: 600, fontSize: 13 }}>{c.studentName}</div></TD>
                      <TD style={{ fontSize: 12 }}>{c.className || '—'}</TD>
                      <TD><Badge text={c.category} color="#9b59b6" bg="#f3e5f5" /></TD>
                      <TD style={{ fontSize: 12, color: '#aaa' }}>{fmt(c.createdAt)}</TD>
                      <TD><Badge text={c.status} color={c.status === 'pending' ? '#f39c12' : '#27ae60'} bg={c.status === 'pending' ? '#fff3e0' : '#e8f5e9'} /></TD>
                      <TD>{c.status === 'pending' ? <Btn small onClick={() => takeAction(c)} icon="fas fa-hammer" color="#e74c3c">Take Action</Btn> : <span style={{ fontSize: 11, color: '#aaa' }}>{c.action || 'Resolved'}</span>}</TD></>
                  ))}
                />
              </div>
            </div>
          )}

          {/* ══ PERMISSION REQUESTS ══ */}
          {activeTab === 'permissions' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Permission Requests</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{pendingPermissions} pending · {permissions.filter(p => p.status === 'approved').length} approved · {permissions.filter(p => p.status === 'rejected').length} rejected</p></div>
              <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <Table cols={['Requester', 'Type', 'Reason', 'Date Range', 'Status', 'Actions']} emptyMsg="No permission requests"
                  rows={permissions.map(p => (
                    <><TD><div style={{ fontWeight: 600, fontSize: 13 }}>{p.requesterName}</div><div style={{ fontSize: 11, color: '#aaa' }}>{roleBadge(p.requesterRole).label}</div></TD>
                      <TD><Badge text={p.type} color="#3498db" bg="#e3f2fd" /></TD>
                      <TD style={{ fontSize: 12, maxWidth: 200 }}>{p.reason || '—'}</TD>
                      <TD style={{ fontSize: 12 }}>{fmt(p.fromDate)} - {fmt(p.toDate)}</TD>
                      <TD><Badge text={p.status} color={p.status === 'pending' ? '#f39c12' : p.status === 'approved' ? '#27ae60' : '#e74c3c'} bg={p.status === 'pending' ? '#fff3e0' : p.status === 'approved' ? '#e8f5e9' : '#fdecea'} /></TD>
                      <TD>{p.status === 'pending' && <div style={{ display: 'flex', gap: 6 }}><Btn small onClick={() => processPermission(p, 'approved')} color="#27ae60">Approve</Btn><Btn small onClick={() => processPermission(p, 'rejected')} danger>Reject</Btn></div>}</TD></>
                  ))}
                />
              </div>
            </div>
          )}

          {/* ══ STUDENTS VIEWER ══ */}
          {activeTab === 'students' && (
            <div>
              <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Student Directory</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{students.length} students enrolled</p></div>
              <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <Table cols={['Student', 'Class', 'Parent', 'Contact', 'Status', 'Actions']} emptyMsg="No students found"
                  rows={students.map(s => {
                    const studentCases = disciplineCases.filter(c => c.studentName === s.fullName);
                    const hasPending = studentCases.some(c => c.status === 'pending');
                    return (
                      <><TD><div style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</div><div style={{ fontSize: 11, color: '#aaa' }}>{s.studentId || ''}</div></TD>
                        <TD>{s.classId ? <Badge text={`${s.classId.grade || ''} ${s.classId.className || ''}`} color="#3498db" bg="#e3f2fd" /> : '—'}</TD>
                        <TD style={{ fontSize: 12 }}>{s.parentName || '—'}</TD>
                        <TD style={{ fontSize: 12 }}>{s.parentPhone || '—'}</TD>
                        <TD>{hasPending ? <Badge text="Active Case" color="#e74c3c" bg="#fdecea" /> : <Badge text="Clear" color="#27ae60" bg="#e8f5e9" />}</TD>
                        <TD><Btn small icon="fas fa-history" color="#3498db" onClick={() => {
                          const cases = disciplineCases.filter(c => c.studentName === s.fullName);
                          Swal.fire({ title: `Cases for ${s.fullName}`, html: cases.map(c => `<div><b>${c.category}</b>: ${c.status} - ${fmt(c.createdAt)}</div>`).join('') || 'No cases', icon: 'info' });
                        }}>History</Btn></TD></>
                    );
                  })}
                />
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══ */}
          {activeTab === 'announcements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div><h2 style={{ margin: 0, fontSize: 19, color: '#1a3a5c', fontFamily: 'Georgia, serif' }}>Announcements</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>{announcements.length} total</p></div>
                <Btn onClick={() => setAnnouncementModal(true)} icon="fas fa-plus" color="#1a3a5c">Post Announcement</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.length === 0 && <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 14, color: '#bbb' }}><i className="fas fa-bullhorn" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .3 }} />No announcements yet</div>}
                {announcements.map(ann => {
                  const pc = ann.priority === 'urgent' ? '#e74c3c' : ann.priority === 'high' ? '#f39c12' : '#27ae60';
                  return (
                    <div key={ann._id} style={{ background: 'white', borderRadius: 12, padding: '15px 18px', borderLeft: `4px solid ${pc}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
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
                <Btn small onClick={() => setMassMessageModal(true)} icon="fas fa-users" color="#3498db">Mass Message</Btn>
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
                          <button onClick={sendMessage} disabled={!msgText.trim()} style={{ width: 40, height: 40, background: msgText.trim() ? '#1a3a5c' : '#ddd', border: 'none', borderRadius: '50%', cursor: msgText.trim() ? 'pointer' : 'default', color: 'white', fontSize: 15, flexShrink: 0 }}><i className="fas fa-paper-plane" /></button>
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
                <div style={{ fontSize: 11, opacity: .7, letterSpacing: 1 }}>DISCIPLINE ADMINISTRATOR</div>
                <div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>{localStorage.getItem('userEmail') || 'discipline@essa.rw'}</div>
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
      
      {/* Report Incident Modal */}
      <Modal open={incidentModal} onClose={() => setIncidentModal(false)} title="Report New Incident" width={560}>
        <Field label="Student" required>
          <Sel value={incidentForm.studentId} onChange={e => setIncidentForm(p => ({ ...p, studentId: e.target.value }))}>
            <option value="">Select student…</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.classId?.grade || ''} {s.classId?.className || ''})</option>)}
          </Sel>
        </Field>
        <Field label="Offense Category" required>
          <Sel value={incidentForm.category} onChange={e => setIncidentForm(p => ({ ...p, category: e.target.value, severity: e.target.value.includes('major') ? 'major' : e.target.value.includes('moderate') ? 'moderate' : 'minor' }))}>
            <option value="">Select category…</option>
            <optgroup label="Minor Offenses">
              {offenseCategories.minor.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
            <optgroup label="Moderate Offenses">
              {offenseCategories.moderate.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
            <optgroup label="Major Offenses">
              {offenseCategories.major.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          </Sel>
        </Field>
        <Field label="Description" required>
          <Txt value={incidentForm.description} rows={4} placeholder="Detailed description of the incident..." onChange={e => setIncidentForm(p => ({ ...p, description: e.target.value }))} />
        </Field>
        <Field label="Evidence (Optional)">
          <Inp type="text" value={incidentForm.evidence} placeholder="Link to evidence or witness statements" onChange={e => setIncidentForm(p => ({ ...p, evidence: e.target.value }))} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setIncidentModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={reportIncident} icon="fas fa-exclamation-triangle" color="#e74c3c" disabled={saving}>{saving ? 'Reporting…' : 'Report Incident'}</Btn>
        </div>
      </Modal>

      {/* Permission Request Modal (for admin to request from super admin) */}
      <Modal open={permissionModal} onClose={() => setPermissionModal(false)} title="Request Permission" width={500}>
        <Field label="Request Type" required>
          <Sel value={permissionForm.type} onChange={e => setPermissionForm(p => ({ ...p, type: e.target.value }))}>
            <option value="medical">🏥 Medical Appointment</option>
            <option value="emergency">🚨 Family Emergency</option>
            <option value="travel">✈️ Travel Permission</option>
            <option value="bereavement">💔 Bereavement</option>
            <option value="other">📋 Other</option>
          </Sel>
        </Field>
        <Field label="Reason" required>
          <Txt value={permissionForm.reason} rows={3} placeholder="Explain why you need permission..." onChange={e => setPermissionForm(p => ({ ...p, reason: e.target.value }))} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="From Date" required><Inp type="date" value={permissionForm.fromDate} onChange={e => setPermissionForm(p => ({ ...p, fromDate: e.target.value }))} /></Field>
          <Field label="To Date" required><Inp type="date" value={permissionForm.toDate} onChange={e => setPermissionForm(p => ({ ...p, toDate: e.target.value }))} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setPermissionModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={requestPermission} icon="fas fa-paper-plane" color="#3498db" disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</Btn>
        </div>
      </Modal>

      {/* Post Announcement Modal */}
      <Modal open={announcementModal} onClose={() => setAnnouncementModal(false)} title="Post Announcement" width={540}>
        <Field label="Title" required><Inp value={announcementForm.title} placeholder="Announcement title" onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} /></Field>
        <Field label="Content" required><Txt value={announcementForm.content} rows={4} placeholder="Write your announcement here..." onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Audience">
            <Sel value={announcementForm.audience} onChange={e => setAnnouncementForm(p => ({ ...p, audience: e.target.value }))}>
              <option value="all">📢 All Users</option>
              <option value="students">🎓 Students</option>
              <option value="teachers">👨‍🏫 Teachers</option>
              <option value="parents">👪 Parents</option>
            </Sel>
          </Field>
          <Field label="Priority">
            <Sel value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="normal">ℹ️ Normal</option>
              <option value="high">⚠️ High</option>
              <option value="urgent">🔴 Urgent</option>
            </Sel>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setAnnouncementModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={postAnnouncement} icon="fas fa-bullhorn" color="#1a3a5c" disabled={saving}>{saving ? 'Posting…' : 'Post Announcement'}</Btn>
        </div>
      </Modal>

      {/* Mass Message Modal */}
      <Modal open={massMessageModal} onClose={() => setMassMessageModal(false)} title="Mass Message" width={540}>
        <Field label="Subject" required><Inp value={messageForm.subject} placeholder="Message subject" onChange={e => setMessageForm(p => ({ ...p, subject: e.target.value }))} /></Field>
        <Field label="Audience" required>
          <Sel value={messageForm.audience} onChange={e => setMessageForm(p => ({ ...p, audience: e.target.value }))}>
            <option value="all_parents">👪 All Parents</option>
            <option value="all_teachers">👨‍🏫 All Teachers</option>
            <option value="all_students">🎓 All Students</option>
          </Sel>
        </Field>
        <Field label="Message" required>
          <Txt value={messageForm.content} rows={5} placeholder="Type your message here..." onChange={e => setMessageForm(p => ({ ...p, content: e.target.value }))} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn onClick={() => setMassMessageModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={sendMassMessage} icon="fas fa-envelope" color="#3498db" disabled={saving}>{saving ? 'Sending…' : 'Send Message'}</Btn>
        </div>
      </Modal>
    </div>
  );
};

export default DisciplineAdminDashboard;