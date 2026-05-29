
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const getToken = () => localStorage.getItem('portalToken');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

// ─── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-RW', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-RW', { hour:'2-digit', minute:'2-digit' }) : '';
const roleBadge = (role) => {
  const map = {
    super_admin:      { label:'Super Admin',     color:'#ffc107', bg:'#fff8e1' },
    academic_admin:   { label:'Academic Admin',  color:'#27ae60', bg:'#e8f5e9' },
    discipline_admin: { label:'Discipline Admin',color:'#e74c3c', bg:'#fdecea' },
    accounts_admin:   { label:'Accounts Admin',  color:'#3498db', bg:'#e3f2fd' },
    teacher:          { label:'Teacher',         color:'#9b59b6', bg:'#f3e5f5' },
    student:          { label:'Student',         color:'#1abc9c', bg:'#e0f7fa' },
    parent:           { label:'Parent',          color:'#e67e22', bg:'#fff3e0' },
  };
  return map[role] || { label: role || '—', color:'#666', bg:'#f0f0f0' };
};
const statusColor = (s) => {
  if (s === 'pending')  return { color:'#f39c12', bg:'#fff3e0' };
  if (s === 'approved' || s === 'resolved') return { color:'#27ae60', bg:'#e8f5e9' };
  if (s === 'rejected') return { color:'#e74c3c', bg:'#fdecea' };
  return { color:'#666', bg:'#f0f0f0' };
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ text, color, bg, size = 11 }) => (
  <span style={{
    display:'inline-block', padding:'2px 9px', borderRadius:20,
    fontSize:size, fontWeight:700, letterSpacing:0.3,
    color, background:bg,
  }}>{text?.replace(/_/g,' ').toUpperCase()}</span>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 32, color = '#ffc107' }) => (
  <div style={{
    width:size, height:size, border:`3px solid rgba(255,255,255,.15)`,
    borderTopColor:color, borderRadius:'50%', animation:'spin 0.8s linear infinite',
    margin:'0 auto',
  }} />
);

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name = '?', size = 36, bg = '#1a3a5c', color = '#ffc107', img }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  return img
    ? <img src={img} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }} />
    : <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color, display:'flex',
        alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.38,
        flexShrink:0, fontFamily:'Georgia, serif', letterSpacing:1 }}>
        {initials}
      </div>;
};

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'white', borderRadius:16, width:'100%', maxWidth:width,
        maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.25)',
      }}>
        <div style={{
          padding:'18px 22px', borderBottom:'1px solid #e8e8e8',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:'white', zIndex:1, borderRadius:'16px 16px 0 0',
        }}>
          <h3 style={{ margin:0, fontSize:16, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>{title}</h3>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer', fontSize:20,
            color:'#999', lineHeight:1, padding:'0 4px',
          }}>×</button>
        </div>
        <div style={{ padding:'20px 22px' }}>{children}</div>
      </div>
    </div>
  );
};

// ─── FormField ────────────────────────────────────────────────────────────────
const Field = ({ label, children, required }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5, letterSpacing:.4 }}>
      {label?.toUpperCase()}{required && <span style={{ color:'#e74c3c' }}> *</span>}
    </label>
    {children}
  </div>
);
const Input = (props) => (
  <input {...props} style={{
    width:'100%', padding:'9px 12px', border:'1.5px solid #e0e0e0',
    borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none',
    transition:'border-color .2s', boxSizing:'border-box',
    ...props.style,
  }}
  onFocus={e => e.target.style.borderColor = '#1a3a5c'}
  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
  />
);
const Select = ({ children, ...props }) => (
  <select {...props} style={{
    width:'100%', padding:'9px 12px', border:'1.5px solid #e0e0e0',
    borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none',
    background:'white', boxSizing:'border-box', ...props.style,
  }}>{children}</select>
);
const Textarea = (props) => (
  <textarea {...props} style={{
    width:'100%', padding:'9px 12px', border:'1.5px solid #e0e0e0',
    borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none',
    resize:'vertical', minHeight:90, boxSizing:'border-box',
    transition:'border-color .2s', ...props.style,
  }}
  onFocus={e => e.target.style.borderColor = '#1a3a5c'}
  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
  />
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent = '#1a3a5c', bg = '#e8f5e9', onClick }) => (
  <div onClick={onClick} style={{
    background:'white', borderRadius:16, padding:'20px 22px',
    display:'flex', alignItems:'center', gap:16,
    boxShadow:'0 2px 12px rgba(0,0,0,.06)', cursor:onClick?'pointer':'default',
    transition:'transform .2s, box-shadow .2s', border:'1px solid #f0f0f0',
  }}
  onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(0,0,0,.12)'; }}}
  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.06)'; }}
  >
    <div style={{ width:52, height:52, borderRadius:14, background:bg, display:'flex',
      alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <i className={icon} style={{ fontSize:22, color:accent }} />
    </div>
    <div>
      <div style={{ fontSize:26, fontWeight:700, color:'#1a3a5c', lineHeight:1,
        fontFamily:"'Crimson Text', Georgia, serif" }}>{value ?? '—'}</div>
      <div style={{ fontSize:13, color:'#888', marginTop:3 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:accent, marginTop:4, fontWeight:600 }}>{sub}</div>}
    </div>
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────
const Table = ({ cols, rows, emptyMsg = 'No data found' }) => (
  <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #f0f0f0' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:540 }}>
      <thead>
        <tr style={{ background:'#f7f9fb' }}>
          {cols.map((c,i) => (
            <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:11,
              fontWeight:700, color:'#888', letterSpacing:.8, borderBottom:'1px solid #eee',
              whiteSpace:'nowrap' }}>{c.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length} style={{ textAlign:'center', padding:'36px', color:'#bbb', fontSize:13 }}>{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom:'1px solid #f5f5f5', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
              onMouseLeave={e => e.currentTarget.style.background=''}
            >{row}</tr>
          ))
        }
      </tbody>
    </table>
  </div>
);
const TD = ({ children, style }) => (
  <td style={{ padding:'11px 14px', fontSize:13, color:'#333', ...style }}>{children}</td>
);

// ─── BtnPrimary ───────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, icon, color='#1a3a5c', textColor='white', small, danger, style: s }) => {
  const bg = danger ? '#e74c3c' : color;
  return (
    <button onClick={onClick} style={{
      background:bg, color:textColor, border:'none', borderRadius:8,
      padding: small ? '6px 14px' : '9px 18px',
      fontSize: small ? 12 : 13, fontWeight:600, cursor:'pointer',
      display:'inline-flex', alignItems:'center', gap:6,
      transition:'filter .2s, transform .2s', whiteSpace:'nowrap', ...s,
    }}
    onMouseEnter={e=>{ e.currentTarget.style.filter='brightness(1.1)'; e.currentTarget.style.transform='translateY(-1px)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.transform=''; }}
    >
      {icon && <i className={icon} style={{ fontSize:14 }} />}
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // ─── layout
  const [activeTab, setActiveTab]       = useState('overview');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [isMobile, setIsMobile]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [loading, setLoading]           = useState(true);

  // ─── data
  const [stats, setStats]               = useState({});
  const [admins, setAdmins]             = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [disciplineCases, setDisciplineCases] = useState([]);
  const [disciplineStats, setDisciplineStats] = useState({});
  const [permissions, setPermissions]   = useState([]);

  // ─── messaging
  const [msgUsers, setMsgUsers]         = useState([]);
  const [msgTab, setMsgTab]             = useState('inbox'); // inbox | compose
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [msgText, setMsgText]           = useState('');
  const [unread, setUnread]             = useState(0);
  const [socket, setSocket]             = useState(null);
  const [msgSearch, setMsgSearch]       = useState('');

  // ─── modals
  const [adminModal, setAdminModal]     = useState(false);
  const [annoModal, setAnnoModal]       = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [adminForm, setAdminForm]       = useState({ fullName:'', email:'', password:'', phone:'', role:'academic_admin' });
  const [annoForm, setAnnoForm]         = useState({ title:'', content:'', audience:'all', priority:'normal' });
  const [profileForm, setProfileForm]   = useState({ fullName:'', phone:'' });
  const [pwForm, setPwForm]             = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving]             = useState(false);

  // ─── user info
  const userName  = localStorage.getItem('userName') || 'Head Master';
  const userEmail = localStorage.getItem('userEmail') || 'admin@essa.rw';
  const userId    = localStorage.getItem('userId');

  // ─── responsive
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 1024) setMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── socket
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const sock = io(SOCKET_URL, { auth: { token } });
    setSocket(sock);
    if (userId) sock.emit('join', userId);
    sock.on('new_message', () => { fetchUnread(); fetchMsgUsers(); });
    sock.on('newMessage',  () => { fetchUnread(); fetchMsgUsers(); });
    return () => sock.disconnect();
  }, [userId]);

  // ─── auth guard
  useEffect(() => {
    const token = getToken();
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'super_admin') { navigate('/portal/login'); return; }
    Promise.all([
      fetchStats(), fetchAdmins(), fetchAnnouncements(),
      fetchDiscipline(), fetchPermissions(), fetchMsgUsers(), fetchUnread(),
    ]).finally(() => setLoading(false));
  }, [navigate]);

  // ─── scroll messages to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // ─── API calls ─────────────────────────────────────────────────────────────
  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_URL}${path}`, { headers: headers(), ...opts });
    return res.ok ? res.json() : Promise.reject(await res.json());
  }, []);

  const fetchStats        = () => api('/super-admin/stats').then(d => setStats(d)).catch(()=>{});
  const fetchAdmins       = () => api('/super-admin/admins').then(d => setAdmins(Array.isArray(d)?d:[])).catch(()=>{});
  const fetchAnnouncements= () => api('/super-admin/announcements').then(d => setAnnouncements(Array.isArray(d)?d:[])).catch(()=>{});
  const fetchDiscipline   = () => api('/discipline-admin/cases').then(d => {
    setDisciplineCases(Array.isArray(d) ? d : []);
    const total = (Array.isArray(d)?d:[]).length;
    const pending  = (Array.isArray(d)?d:[]).filter(c=>c.status==='pending').length;
    const resolved = total - pending;
    setDisciplineStats({ total, pending, resolved });
  }).catch(()=>{});
  const fetchPermissions  = () => api('/permissions').then(d => setPermissions(Array.isArray(d)?d:[])).catch(()=>{});
  const fetchMsgUsers     = () => api('/messages/users').then(d => {
    const all = Object.values(d.users || d || {}).flat();
    setMsgUsers(all);
  }).catch(()=>{});
  const fetchUnread       = () => api('/messages/unread-count').then(d => setUnread(d.count||0)).catch(()=>{});
  const fetchConversation = (uid) => api(`/messages/conversation/${uid}`).then(d => setMessages(Array.isArray(d.messages)?d.messages:[])).catch(()=>{});

  const refreshAll = () => Promise.all([fetchStats(),fetchAdmins(),fetchAnnouncements(),fetchDiscipline(),fetchPermissions()]);

  // ─── CRUD actions ──────────────────────────────────────────────────────────
  const createAdmin = async () => {
    if (!adminForm.fullName || !adminForm.email) {
      Swal.fire('Missing Fields','Please fill in Name and Email','warning'); return;
    }
    setSaving(true);
    try {
      await api('/super-admin/create-admin', { method:'POST', body: JSON.stringify(adminForm) });
      Swal.fire({
        title:'✅ Admin Created!',
        html:`<p><b>${adminForm.fullName}</b> (${adminForm.role.replace(/_/g,' ')})<br>Email: <code>${adminForm.email}</code><br>Password: <code>${adminForm.password||'admin123'}</code></p>`,
        icon:'success',
      });
      setAdminModal(false);
      setAdminForm({ fullName:'', email:'', password:'', phone:'', role:'academic_admin' });
      fetchAdmins(); fetchStats();
    } catch (e) {
      Swal.fire('Error', e.message || 'Failed to create admin','error');
    } finally { setSaving(false); }
  };

  const deleteAdmin = async (admin) => {
    const ok = await Swal.fire({
      title:`Remove ${admin.fullName}?`, text:'This action cannot be undone.',
      icon:'warning', showCancelButton:true, confirmButtonColor:'#e74c3c', confirmButtonText:'Delete',
    });
    if (!ok.isConfirmed) return;
    await api(`/super-admin/admins/${admin._id}`, { method:'DELETE' });
    Swal.fire('Deleted!','','success');
    fetchAdmins(); fetchStats();
  };

  const postAnnouncement = async () => {
    if (!annoForm.title || !annoForm.content) {
      Swal.fire('Missing Fields','Title and content are required','warning'); return;
    }
    setSaving(true);
    try {
      await api('/super-admin/announcements', { method:'POST', body: JSON.stringify(annoForm) });
      Swal.fire('📢 Posted!','Announcement sent to all users','success');
      setAnnoModal(false);
      setAnnoForm({ title:'', content:'', audience:'all', priority:'normal' });
      fetchAnnouncements();
    } catch (e) {
      Swal.fire('Error', e.message || 'Failed','error');
    } finally { setSaving(false); }
  };

  const deleteAnnouncement = async (id) => {
    const ok = await Swal.fire({ title:'Delete?', icon:'warning', showCancelButton:true, confirmButtonColor:'#e74c3c', confirmButtonText:'Delete' });
    if (!ok.isConfirmed) return;
    await api(`/super-admin/announcements/${id}`, { method:'DELETE' });
    Swal.fire('Deleted!','','success');
    fetchAnnouncements();
  };

  const disciplineAction = async (c) => {
    const { value: action } = await Swal.fire({
      title:`Action for ${c.studentName || 'Student'}`,
      html:`<p style="text-align:left;font-size:13px;color:#555">${c.description||''}</p>`,
      input:'select',
      inputOptions:{ warning:'⚠️ Warning', detention:'📝 Detention', community_service:'🤝 Community Service', suspension:'🚫 Suspension', expulsion:'❌ Expulsion' },
      inputPlaceholder:'Select action', showCancelButton:true, confirmButtonText:'Apply',confirmButtonColor:'#e74c3c',
    });
    if (!action) return;
    const { value: details } = await Swal.fire({
      title:'Additional Details', input:'textarea', inputPlaceholder:'e.g., Suspended for 3 days...',
      showCancelButton:true, confirmButtonText:'Submit',
    });
    await api(`/discipline-admin/cases/${c._id}`, { method:'PUT', body: JSON.stringify({ action, actionDetails:details||'', status:'resolved', reviewedBy: userId }) });
    Swal.fire('✅ Action Applied!', `Student: ${action}`, 'success');
    fetchDiscipline(); fetchStats();
  };

  const permissionAction = async (p, status) => {
    const isReject = status === 'rejected';
    const result = await Swal.fire({
      title:`${isReject?'Reject':'Approve'} Permission?`,
      text:`${p.requesterName} — ${p.reason||p.type}`,
      icon:'question', showCancelButton:true,
      confirmButtonText: isReject ? '❌ Reject' : '✅ Approve',
      confirmButtonColor: isReject ? '#e74c3c' : '#27ae60',
      ...(isReject && { input:'textarea', inputLabel:'Reason for rejection (optional)' }),
    });
    if (!result.isConfirmed) return;
    await api(`/permissions/${p._id}`, { method:'PUT', body: JSON.stringify({ status, rejectionReason: result.value || '' }) });
    Swal.fire(`${isReject?'Rejected':'Approved'}!`, '', 'success');
    fetchPermissions(); fetchStats();
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedUser) return;
    try {
      const res = await api('/messages/send', { method:'POST', body: JSON.stringify({
        recipientId: selectedUser._id,
        subject: 'Direct Message',
        content: msgText.trim(),
      })});
      setMessages(prev => [...prev, res.message]);
      setMsgText('');
      if (socket) socket.emit('sendMessage', { receiverId: selectedUser._id, ...res.message });
      fetchUnread(); fetchMsgUsers();
    } catch {}
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api('/user/profile', { method:'PUT', body: JSON.stringify(profileForm) });
      Swal.fire('✅ Profile Updated!','','success');
      setProfileModal(false);
    } catch (e) { Swal.fire('Error', e.message,'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      Swal.fire('Error','Passwords do not match','error'); return;
    }
    if (pwForm.newPassword.length < 6) {
      Swal.fire('Error','Password must be at least 6 characters','error'); return;
    }
    setSaving(true);
    try {
      await api('/user/change-password', { method:'PUT', body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      Swal.fire('✅ Password Changed!','','success');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (e) { Swal.fire('Error', e.message || 'Current password is incorrect','error'); }
    finally { setSaving(false); }
  };

  // ─── menu items ────────────────────────────────────────────────────────────
  const menuItems = [
    { id:'overview',      label:'Overview',      icon:'fas fa-chart-line' },
    { id:'admins',        label:'Sub-Admins',    icon:'fas fa-users-cog' },
    { id:'announcements', label:'Announcements', icon:'fas fa-bullhorn' },
    { id:'discipline',    label:'Discipline',    icon:'fas fa-gavel' },
    { id:'permissions',   label:'Permissions',   icon:'fas fa-file-signature' },
    { id:'messages',      label:'Messages',      icon:'fas fa-comments', badge: unread },
    { id:'profile',       label:'My Profile',    icon:'fas fa-user-shield' },
  ];

  // ─── filtered users for message search ────────────────────────────────────
  const filteredUsers = msgUsers.filter(u =>
    u.fullName?.toLowerCase().includes(msgSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(msgSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:'100vh', background:'linear-gradient(135deg,#0d2b42,#1a3a5c)',
        color:'white', gap:20, fontFamily:"'Crimson Text', Georgia, serif" }}>
        <Spinner size={48} />
        <p style={{ margin:0, fontSize:18, letterSpacing:1 }}>Loading Portal…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const sideW = isMobile ? 0 : sidebarOpen ? 260 : 72;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f3f8', fontFamily:"'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
        .tab-content{animation:fadeIn .25s ease}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
        .msg-bubble-sent{background:#1a3a5c;color:white;border-radius:18px 18px 4px 18px;padding:10px 15px;max-width:70%;align-self:flex-end;font-size:13px;line-height:1.5}
        .msg-bubble-received{background:white;color:#333;border-radius:18px 18px 18px 4px;padding:10px 15px;max-width:70%;align-self:flex-start;font-size:13px;line-height:1.5;box-shadow:0 1px 4px rgba(0,0,0,.08)}
      `}</style>

      {/* ── Mobile overlay ── */}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:998 }} />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside style={{
        position:'fixed', top:0, left:0, bottom:0, zIndex:999,
        width: isMobile ? (mobileOpen?260:0) : sideW,
        background:'linear-gradient(180deg,#0d1f33 0%,#1a3a5c 100%)',
        color:'white', display:'flex', flexDirection:'column',
        transition:'width .3s ease', overflow:'hidden',
        boxShadow:'3px 0 20px rgba(0,0,0,.18)',
      }}>
        {/* logo */}
        <div style={{ padding:'22px 18px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:40, height:40, background:'#ffc107', borderRadius:12, display:'flex',
            alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="fas fa-crown" style={{ fontSize:18, color:'#1a3a5c' }} />
          </div>
          {(sidebarOpen || isMobile) && (
            <div>
              <div style={{ fontFamily:"'Crimson Text', Georgia, serif", fontSize:16, fontWeight:600, lineHeight:1.2 }}>ESSA Portal</div>
              <div style={{ fontSize:10, opacity:.6, letterSpacing:1 }}>SUPER ADMIN</div>
            </div>
          )}
          {!isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,.5)',
                cursor:'pointer', fontSize:14, flexShrink:0 }}>
              <i className={`fas fa-chevron-${sidebarOpen?'left':'right'}`} />
            </button>
          )}
        </div>

        {/* user */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <Avatar name={userName} size={38} bg='rgba(255,193,7,.2)' color='#ffc107' />
          {(sidebarOpen || isMobile) && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userName}</div>
              <div style={{ fontSize:10, color:'#ffc107', letterSpacing:.5 }}>HEAD MASTER</div>
            </div>
          )}
        </div>

        {/* nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 0' }}>
          {menuItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if(isMobile) setMobileOpen(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  width:'100%', padding:'11px 18px',
                  background: active ? 'rgba(255,193,7,.15)' : 'transparent',
                  border:'none', borderRight: active ? '3px solid #ffc107' : '3px solid transparent',
                  color: active ? '#ffc107' : 'rgba(255,255,255,.7)',
                  cursor:'pointer', fontSize:13, fontWeight: active?600:400,
                  transition:'all .2s', textAlign:'left',
                  fontFamily:"'DM Sans', sans-serif",
                }}>
                <i className={item.icon} style={{ fontSize:16, width:20, flexShrink:0 }} />
                {(sidebarOpen || isMobile) && <span style={{ flex:1, whiteSpace:'nowrap' }}>{item.label}</span>}
                {item.badge > 0 && (sidebarOpen || isMobile) && (
                  <span style={{ background:'#e74c3c', color:'white', borderRadius:20,
                    fontSize:10, fontWeight:700, padding:'1px 7px', minWidth:18, textAlign:'center' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* logout */}
        <div style={{ padding:14, borderTop:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
          <button onClick={() => { localStorage.clear(); navigate('/portal/login'); }}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px',
              background:'rgba(231,76,60,.2)', border:'1px solid rgba(231,76,60,.3)', borderRadius:10,
              color:'#ff8a80', cursor:'pointer', fontSize:13, transition:'all .2s',
              fontFamily:"'DM Sans', sans-serif",
            }}>
            <i className="fas fa-sign-out-alt" style={{ fontSize:14 }} />
            {(sidebarOpen || isMobile) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main style={{ flex:1, marginLeft: isMobile?0:sideW, transition:'margin-left .3s', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* ── Top Bar ── */}
        <div style={{ background:'white', padding:'12px 24px', display:'flex', justifyContent:'space-between',
          alignItems:'center', borderBottom:'1px solid #eee', position:'sticky', top:0, zIndex:100,
          boxShadow:'0 1px 8px rgba(0,0,0,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(!mobileOpen)}
                style={{ background:'#1a3a5c', color:'white', border:'none', padding:'7px 10px', borderRadius:8, cursor:'pointer' }}>
                <i className="fas fa-bars" />
              </button>
            )}
            <div>
              <div style={{ fontSize:11, color:'#aaa', letterSpacing:.5 }}>ESSA NYARUGUNGA</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>
                {menuItems.find(m=>m.id===activeTab)?.label || 'Dashboard'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            {unread > 0 && (
              <button onClick={() => setActiveTab('messages')}
                style={{ position:'relative', background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:18 }}>
                <i className="fas fa-bell" />
                <span style={{ position:'absolute', top:-4, right:-4, background:'#e74c3c',
                  color:'white', borderRadius:'50%', fontSize:9, fontWeight:700,
                  width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{unread}</span>
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Avatar name={userName} size={34} />
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#333' }}>{userName}</div>
                <div style={{ fontSize:10, color:'#ffc107', letterSpacing:.5 }}>SUPER ADMIN</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex:1, padding:24, overflowY:'auto' }} className="tab-content">

          {/* ╔══ OVERVIEW ══╗ */}
          {activeTab === 'overview' && (
            <div>
              {/* Welcome */}
              <div style={{
                background:'linear-gradient(135deg,#0d1f33,#1a3a5c)',
                borderRadius:20, padding:'28px 32px', marginBottom:24,
                display:'flex', justifyContent:'space-between', alignItems:'center',
                flexWrap:'wrap', gap:16, boxShadow:'0 6px 24px rgba(26,58,92,.35)',
              }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:600, color:'white',
                    fontFamily:"'Crimson Text', Georgia, serif", marginBottom:6 }}>
                    Welcome back, {userName.split(' ')[0]}! 👑
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>
                    {new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <Btn onClick={() => setAdminModal(true)} icon="fas fa-user-plus" color="#ffc107" textColor="#1a3a5c">New Admin</Btn>
                  <Btn onClick={() => setAnnoModal(true)} icon="fas fa-bullhorn" color="rgba(255,255,255,.15)" textColor="white">Announce</Btn>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
                <StatCard icon="fas fa-users-cog" label="Sub-Admins" value={admins.length}
                  sub={`${admins.filter(a=>a.isActive!==false).length} active`} accent="#27ae60" bg="#e8f5e9"
                  onClick={() => setActiveTab('admins')} />
                <StatCard icon="fas fa-bullhorn" label="Announcements" value={announcements.length}
                  sub={`${announcements.filter(a=>a.priority==='urgent').length} urgent`} accent="#e74c3c" bg="#fdecea"
                  onClick={() => setActiveTab('announcements')} />
                <StatCard icon="fas fa-gavel" label="Discipline Cases" value={disciplineStats.total||0}
                  sub={`${disciplineStats.pending||0} pending review`} accent="#9b59b6" bg="#f3e5f5"
                  onClick={() => setActiveTab('discipline')} />
                <StatCard icon="fas fa-file-signature" label="Permissions" value={permissions.length}
                  sub={`${permissions.filter(p=>p.status==='pending').length} awaiting`} accent="#3498db" bg="#e3f2fd"
                  onClick={() => setActiveTab('permissions')} />
                <StatCard icon="fas fa-user-graduate" label="Students" value={stats.totalStudents||0}
                  sub="enrolled & active" accent="#1abc9c" bg="#e0f7fa" />
                <StatCard icon="fas fa-chalkboard-teacher" label="Teachers" value={stats.totalTeachers||0}
                  sub={`${stats.totalClasses||0} classes`} accent="#e67e22" bg="#fff3e0" />
              </div>

              {/* Pending review panels */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:20 }}>
                {/* Pending discipline */}
                <div style={{ background:'white', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:'#1a3a5c', display:'flex', alignItems:'center', gap:8 }}>
                      <i className="fas fa-gavel" style={{ color:'#9b59b6' }} /> Pending Discipline
                    </h3>
                    <Badge text={`${disciplineCases.filter(c=>c.status==='pending').length} open`} color="#9b59b6" bg="#f3e5f5" />
                  </div>
                  {disciplineCases.filter(c=>c.status==='pending').slice(0,5).map(c => (
                    <div key={c._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#333' }}>{c.studentName||'Student'}</div>
                        <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{c.category} · {fmt(c.createdAt)}</div>
                      </div>
                      <Btn small onClick={() => disciplineAction(c)} icon="fas fa-hammer" color="#9b59b6">Review</Btn>
                    </div>
                  ))}
                  {disciplineCases.filter(c=>c.status==='pending').length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'#bbb', fontSize:13 }}>
                      <i className="fas fa-check-circle" style={{ fontSize:28, marginBottom:8, display:'block', color:'#27ae60' }} />
                      All clear — no pending cases
                    </div>
                  )}
                </div>

                {/* Pending permissions */}
                <div style={{ background:'white', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:'#1a3a5c', display:'flex', alignItems:'center', gap:8 }}>
                      <i className="fas fa-file-signature" style={{ color:'#3498db' }} /> Pending Permissions
                    </h3>
                    <Badge text={`${permissions.filter(p=>p.status==='pending').length} open`} color="#3498db" bg="#e3f2fd" />
                  </div>
                  {permissions.filter(p=>p.status==='pending').slice(0,5).map(p => (
                    <div key={p._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'10px 0', borderBottom:'1px solid #f5f5f5', gap:10 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#333' }}>{p.requesterName}</div>
                        <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{p.type} · {fmt(p.createdAt)}</div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <Btn small onClick={() => permissionAction(p,'approved')} color="#27ae60">✓</Btn>
                        <Btn small onClick={() => permissionAction(p,'rejected')} danger>✗</Btn>
                      </div>
                    </div>
                  ))}
                  {permissions.filter(p=>p.status==='pending').length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'#bbb', fontSize:13 }}>
                      <i className="fas fa-check-circle" style={{ fontSize:28, marginBottom:8, display:'block', color:'#27ae60' }} />
                      No pending permissions
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ╔══ ADMINS ══╗ */}
          {activeTab === 'admins' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:20, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>System Administrators</h2>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>{admins.length} admin accounts registered</p>
                </div>
                <Btn onClick={() => setAdminModal(true)} icon="fas fa-plus" color="#1a3a5c">Add Sub-Admin</Btn>
              </div>
              <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden' }}>
                <Table
                  cols={['Admin','Email','Role','Phone','Status','Actions']}
                  emptyMsg="No sub-admins created yet"
                  rows={admins.map(a => (
                    <>
                      <TD><div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={a.fullName} size={34} />
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{a.fullName}</div>
                          <div style={{ fontSize:11, color:'#aaa' }}>Created {fmt(a.createdAt)}</div>
                        </div>
                      </div></TD>
                      <TD><span style={{ color:'#3498db', fontSize:12 }}>{a.email}</span></TD>
                      <TD><Badge {...roleBadge(a.role)} text={roleBadge(a.role).label} /></TD>
                      <TD style={{ fontSize:12 }}>{a.phone||'—'}</TD>
                      <TD><Badge text={a.isActive!==false?'Active':'Inactive'}
                        color={a.isActive!==false?'#27ae60':'#e74c3c'}
                        bg={a.isActive!==false?'#e8f5e9':'#fdecea'} /></TD>
                      <TD>
                        <div style={{ display:'flex', gap:6 }}>
                          <Btn small icon="fas fa-comment" color="#3498db"
                            onClick={() => { setSelectedUser(a); setActiveTab('messages'); fetchConversation(a._id); }}>
                            Message
                          </Btn>
                          <Btn small danger icon="fas fa-trash" onClick={() => deleteAdmin(a)}>Delete</Btn>
                        </div>
                      </TD>
                    </>
                  ))}
                />
              </div>
            </div>
          )}

         {/* ╔══ ANNOUNCEMENTS ══╗ */}
{activeTab === 'announcements' && (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
      <div>
        <h2 style={{ margin:0, fontSize:20, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>School Announcements</h2>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>
          {Array.isArray(announcements) ? announcements.length : 0} total announcements
        </p>
      </div>
      <Btn onClick={() => setAnnoModal(true)} icon="fas fa-bullhorn" color="#1a3a5c">Post Announcement</Btn>
    </div>
    
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {(!Array.isArray(announcements) || announcements.length === 0) && (
        <div style={{ textAlign:'center', padding:60, color:'#bbb', background:'white', borderRadius:16 }}>
          <i className="fas fa-bullhorn" style={{ fontSize:36, marginBottom:12, display:'block', opacity:.3 }} />
          No announcements yet
        </div>
      )}
      
      {Array.isArray(announcements) && announcements.map(ann => {
        // Safe priority handling with fallback
        const priority = ann?.priority || 'normal';
        const pColor = priority === 'urgent' ? '#e74c3c' : priority === 'high' ? '#f39c12' : '#27ae60';
        const pBg = priority === 'urgent' ? '#fdecea' : priority === 'high' ? '#fff3e0' : '#e8f5e9';
        
        return (
          <div key={ann?._id || Math.random()} style={{
            background:'white', borderRadius:14, padding:'18px 20px',
            borderLeft:`4px solid ${pColor}`, boxShadow:'0 2px 10px rgba(0,0,0,.05)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:10 }}>
              <div>
                <h3 style={{ margin:0, fontSize:15, color:'#1a3a5c' }}>{ann?.title || 'Untitled'}</h3>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                  <Badge text={priority} color={pColor} bg={pBg} />
                  <Badge text={ann?.audience === 'all' ? 'All Users' : (ann?.audience || 'All Users')} color="#888" bg="#f5f5f5" />
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'#aaa' }}>{ann?.createdAt ? fmt(ann.createdAt) : 'Just now'}</span>
                <Btn small danger icon="fas fa-trash" onClick={() => ann?._id && deleteAnnouncement(ann._id)} />
              </div>
            </div>
            <p style={{ margin:0, fontSize:13, color:'#555', lineHeight:1.7 }}>{ann?.content || 'No content provided'}</p>
          </div>
        );
      })}
    </div>
  </div>
)}

          {/* ╔══ DISCIPLINE ══╗ */}
          {activeTab === 'discipline' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize:20, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>Discipline Cases</h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>Review and take action on student conduct reports</p>
              </div>
              <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                {[['Total',disciplineStats.total||0,'#1a3a5c','#e8f0fb'],
                  ['Pending',disciplineStats.pending||0,'#f39c12','#fff3e0'],
                  ['Resolved',disciplineStats.resolved||0,'#27ae60','#e8f5e9'],
                ].map(([l,v,c,bg]) => (
                  <div key={l} style={{ background:bg, borderRadius:12, padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:22, fontWeight:700, color:c, fontFamily:"'Crimson Text', Georgia, serif" }}>{v}</div>
                    <div style={{ fontSize:12, color:c, opacity:.8, fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden' }}>
                <Table
                  cols={['Student','Category','Description','Reported By','Date','Status','Action']}
                  emptyMsg="No discipline cases reported"
                  rows={disciplineCases.map(c => (
                    <>
                      <TD><div style={{ fontWeight:600, fontSize:13 }}>{c.studentName||'—'}</div>
                          <div style={{ fontSize:11, color:'#aaa' }}>{c.className||''}</div></TD>
                      <TD><Badge text={c.category||'—'} color="#9b59b6" bg="#f3e5f5" /></TD>
                      <TD><div style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'#555' }}>
                        {c.description||'—'}
                      </div></TD>
                      <TD style={{ fontSize:12 }}>{c.reporterName||'—'}</TD>
                      <TD style={{ fontSize:12, color:'#aaa' }}>{fmt(c.createdAt)}</TD>
                      <TD><Badge text={c.status} {...statusColor(c.status)} /></TD>
                      <TD>{c.status==='pending'
                        ? <Btn small onClick={() => disciplineAction(c)} icon="fas fa-hammer" color="#9b59b6">Act</Btn>
                        : <span style={{ fontSize:11, color:'#aaa' }}>{c.action||c.status}</span>}
                      </TD>
                    </>
                  ))}
                />
              </div>
            </div>
          )}

          {/* ╔══ PERMISSIONS ══╗ */}
          {activeTab === 'permissions' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ margin:0, fontSize:20, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>Permission Requests</h2>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>Approve or reject submitted permission requests</p>
              </div>
              <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                {[['Pending',permissions.filter(p=>p.status==='pending').length,'#f39c12','#fff3e0'],
                  ['Approved',permissions.filter(p=>p.status==='approved').length,'#27ae60','#e8f5e9'],
                  ['Rejected',permissions.filter(p=>p.status==='rejected').length,'#e74c3c','#fdecea'],
                ].map(([l,v,c,bg]) => (
                  <div key={l} style={{ background:bg, borderRadius:12, padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:22, fontWeight:700, color:c, fontFamily:"'Crimson Text', Georgia, serif" }}>{v}</div>
                    <div style={{ fontSize:12, color:c, opacity:.8, fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden' }}>
                <Table
                  cols={['Requester','Type','Reason','From','To','Status','Actions']}
                  emptyMsg="No permission requests submitted"
                  rows={permissions.map(p => (
                    <>
                      <TD><div style={{ fontWeight:600, fontSize:13 }}>{p.requesterName}</div>
                          <Badge {...roleBadge(p.requesterRole)} text={roleBadge(p.requesterRole).label} size={10} /></TD>
                      <TD style={{ fontSize:12 }}>{p.type||'—'}</TD>
                      <TD><div style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'#555' }}>
                        {p.reason||'—'}
                      </div></TD>
                      <TD style={{ fontSize:12, color:'#aaa' }}>{fmt(p.fromDate)}</TD>
                      <TD style={{ fontSize:12, color:'#aaa' }}>{fmt(p.toDate)}</TD>
                      <TD><Badge text={p.status} {...statusColor(p.status)} /></TD>
                      <TD>
                        {p.status === 'pending'
                          ? <div style={{ display:'flex', gap:6 }}>
                              <Btn small onClick={() => permissionAction(p,'approved')} color="#27ae60">Approve</Btn>
                              <Btn small onClick={() => permissionAction(p,'rejected')} danger>Reject</Btn>
                            </div>
                          : <span style={{ fontSize:11, color:'#aaa' }}>{p.rejectionReason ? 'Rejected: '+p.rejectionReason.substring(0,30) : p.status}</span>
                        }
                      </TD>
                    </>
                  ))}
                />
              </div>
            </div>
          )}

          {/* ╔══ MESSAGES ══╗ */}
          {activeTab === 'messages' && (
            <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)',
              overflow:'hidden', height:'calc(100vh - 150px)', display:'flex', flexDirection:'column' }}>
              {/* tabs */}
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #eee', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                {['inbox','compose'].map(t => (
                  <button key={t} onClick={() => { setMsgTab(t); if(t==='compose'){ setSelectedUser(null); setMessages([]); } }}
                    style={{
                      padding:'7px 18px', borderRadius:30, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                      background: msgTab===t ? '#1a3a5c' : '#f0f3f8', color: msgTab===t ? 'white' : '#666',
                      transition:'all .2s',
                    }}>
                    {t === 'inbox' ? <><i className="fas fa-inbox" style={{ marginRight:6 }} />Inbox{unread>0&&<span style={{ marginLeft:6, background:'#e74c3c', color:'white', borderRadius:20, fontSize:10, padding:'1px 7px' }}>{unread}</span>}</> : <><i className="fas fa-pen" style={{ marginRight:6 }} />New Message</>}
                  </button>
                ))}
              </div>

              {msgTab === 'inbox' ? (
                <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                  {/* user list */}
                  <div style={{ width:280, borderRight:'1px solid #eee', display:'flex', flexDirection:'column', background:'#fafbff', flexShrink:0, overflow:'hidden' }}>
                    <div style={{ padding:'12px 14px', borderBottom:'1px solid #eee' }}>
                      <div style={{ position:'relative' }}>
                        <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#ccc', fontSize:12 }} />
                        <input value={msgSearch} onChange={e=>setMsgSearch(e.target.value)}
                          placeholder="Search users…" style={{ width:'100%', padding:'7px 10px 7px 30px',
                          border:'1px solid #eee', borderRadius:20, fontSize:12, boxSizing:'border-box',
                          background:'white', outline:'none' }} />
                      </div>
                    </div>
                    <div style={{ flex:1, overflowY:'auto' }}>
                      {filteredUsers.length === 0 && <div style={{ textAlign:'center', padding:30, color:'#ccc', fontSize:13 }}>No users found</div>}
                      {filteredUsers.map(u => (
                        <div key={u._id} onClick={() => { setSelectedUser(u); fetchConversation(u._id); }}
                          style={{
                            display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer',
                            background: selectedUser?._id === u._id ? '#e8f0fe' : 'transparent',
                            borderLeft: selectedUser?._id === u._id ? '3px solid #ffc107' : '3px solid transparent',
                            transition:'background .15s',
                          }}>
                          <Avatar name={u.fullName} size={36} img={u.profileImage} />
                          <div style={{ overflow:'hidden' }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#333', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.fullName}</div>
                            <div style={{ fontSize:10, color:'#ffc107', fontWeight:700, letterSpacing:.3 }}>{roleBadge(u.role).label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* conversation */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    {selectedUser ? (
                      <>
                        <div style={{ padding:'14px 18px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:12, background:'white' }}>
                          <Avatar name={selectedUser.fullName} size={40} img={selectedUser.profileImage} />
                          <div>
                            <div style={{ fontWeight:600, fontSize:14, color:'#1a3a5c' }}>{selectedUser.fullName}</div>
                            <div style={{ fontSize:11, color:'#ffc107', fontWeight:700 }}>{roleBadge(selectedUser.role).label}</div>
                          </div>
                        </div>
                        <div style={{ flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:12, background:'#f8f9ff' }}>
                          {messages.length === 0 && (
                            <div style={{ textAlign:'center', color:'#ccc', paddingTop:40 }}>
                              <i className="fas fa-comments" style={{ fontSize:32, marginBottom:8, display:'block' }} />
                              <div style={{ fontSize:13 }}>Start a conversation with {selectedUser.fullName}</div>
                            </div>
                          )}
                          {messages.map(m => (
                            <div key={m._id} className={m.senderId === userId ? 'msg-bubble-sent' : 'msg-bubble-received'}>
                              <div>{m.content}</div>
                              <div style={{ fontSize:10, opacity:.6, marginTop:4, textAlign:'right' }}>{fmtTime(m.createdAt)}</div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                        <div style={{ padding:'12px 16px', borderTop:'1px solid #eee', display:'flex', gap:10, background:'white', alignItems:'flex-end' }}>
                          <textarea value={msgText} onChange={e=>setMsgText(e.target.value)}
                            placeholder={`Message ${selectedUser.fullName}…`}
                            rows={2} onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }}}
                            style={{ flex:1, padding:'10px 14px', border:'1.5px solid #e0e0e0', borderRadius:12,
                              resize:'none', fontFamily:'inherit', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                          <button onClick={sendMessage} disabled={!msgText.trim()}
                            style={{ width:42, height:42, background: msgText.trim()?'#1a3a5c':'#ddd',
                              border:'none', borderRadius:'50%', cursor: msgText.trim()?'pointer':'default',
                              color:'white', fontSize:16, transition:'all .2s', flexShrink:0 }}>
                            <i className="fas fa-paper-plane" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#ccc', gap:12 }}>
                        <i className="fas fa-comments" style={{ fontSize:48, opacity:.3 }} />
                        <div style={{ fontSize:14 }}>Select a user to start messaging</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* compose */
                <div style={{ flex:1, padding:28, maxWidth:600, margin:'0 auto', width:'100%', overflowY:'auto' }}>
                  <h3 style={{ margin:'0 0 20px', color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif" }}>New Message</h3>
                  <Field label="Recipient" required>
                    <Select value={selectedUser?._id||''} onChange={e => {
                      const u = msgUsers.find(x=>x._id===e.target.value);
                      setSelectedUser(u||null);
                    }}>
                      <option value="">Select a user…</option>
                      {msgUsers.map(u => <option key={u._id} value={u._id}>{u.fullName} — {roleBadge(u.role).label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Message" required>
                    <Textarea value={msgText} onChange={e=>setMsgText(e.target.value)} rows={8} placeholder="Type your message…" />
                  </Field>
                  <Btn icon="fas fa-paper-plane" color="#1a3a5c" style={{ width:'100%', justifyContent:'center', padding:'12px' }}
                    onClick={async () => {
                      if (!selectedUser || !msgText.trim()) { Swal.fire('Error','Select recipient and enter message','warning'); return; }
                      await sendMessage();
                      Swal.fire('✅ Sent!','','success');
                      setMsgTab('inbox');
                    }}>Send Message</Btn>
                </div>
              )}
            </div>
          )}

          {/* ╔══ PROFILE ══╗ */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth:640, margin:'0 auto' }}>
              {/* header card */}
              <div style={{ background:'linear-gradient(135deg,#0d1f33,#1a3a5c)', borderRadius:20, padding:'32px', textAlign:'center',
                marginBottom:20, color:'white', boxShadow:'0 6px 24px rgba(26,58,92,.35)' }}>
                <Avatar name={userName} size={80} bg='rgba(255,193,7,.2)' color='#ffc107' />
                <h2 style={{ margin:'16px 0 4px', fontFamily:"'Crimson Text', Georgia, serif", fontSize:24 }}>{userName}</h2>
                <div style={{ fontSize:12, opacity:.7, letterSpacing:1 }}>SUPER ADMINISTRATOR</div>
                <div style={{ fontSize:13, opacity:.7, marginTop:6 }}>{userEmail}</div>
              </div>

              {/* edit profile */}
              <div style={{ background:'white', borderRadius:16, padding:'24px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,.06)' }}>
                <h3 style={{ margin:'0 0 18px', fontSize:16, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif",
                  display:'flex', alignItems:'center', gap:8 }}>
                  <i className="fas fa-user-edit" style={{ color:'#ffc107' }} /> Edit Profile
                </h3>
                <Field label="Full Name">
                  <Input value={profileForm.fullName} placeholder={userName}
                    onChange={e=>setProfileForm(p=>({...p,fullName:e.target.value}))} />
                </Field>
                <Field label="Phone">
                  <Input value={profileForm.phone} placeholder="+250 …"
                    onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} />
                </Field>
                <Btn onClick={saveProfile} icon="fas fa-save" color="#1a3a5c" style={{ marginTop:4 }}>
                  {saving?'Saving…':'Save Changes'}
                </Btn>
              </div>

              {/* change password */}
              <div style={{ background:'white', borderRadius:16, padding:'24px', boxShadow:'0 2px 10px rgba(0,0,0,.06)' }}>
                <h3 style={{ margin:'0 0 18px', fontSize:16, color:'#1a3a5c', fontFamily:"'Crimson Text', Georgia, serif",
                  display:'flex', alignItems:'center', gap:8 }}>
                  <i className="fas fa-lock" style={{ color:'#ffc107' }} /> Change Password
                </h3>
                <Field label="Current Password" required>
                  <Input type="password" value={pwForm.currentPassword}
                    onChange={e=>setPwForm(p=>({...p,currentPassword:e.target.value}))} />
                </Field>
                <Field label="New Password" required>
                  <Input type="password" value={pwForm.newPassword}
                    onChange={e=>setPwForm(p=>({...p,newPassword:e.target.value}))} />
                </Field>
                <Field label="Confirm New Password" required>
                  <Input type="password" value={pwForm.confirmPassword}
                    onChange={e=>setPwForm(p=>({...p,confirmPassword:e.target.value}))} />
                </Field>
                <Btn onClick={changePassword} icon="fas fa-key" color="#9b59b6" style={{ marginTop:4 }}>
                  {saving?'Saving…':'Update Password'}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ════ MODAL: Create Admin ════ */}
      <Modal open={adminModal} onClose={() => setAdminModal(false)} title="Create Sub-Admin" width={500}>
        <Field label="Full Name" required>
          <Input value={adminForm.fullName} placeholder="e.g. Jean Pierre Habimana"
            onChange={e=>setAdminForm(p=>({...p,fullName:e.target.value}))} />
        </Field>
        <Field label="Email Address" required>
          <Input type="email" value={adminForm.email} placeholder="email@essa.rw"
            onChange={e=>setAdminForm(p=>({...p,email:e.target.value}))} />
        </Field>
        <Field label="Password">
          <Input type="password" value={adminForm.password} placeholder="Leave blank for admin123"
            onChange={e=>setAdminForm(p=>({...p,password:e.target.value}))} />
        </Field>
        <Field label="Phone">
          <Input value={adminForm.phone} placeholder="+250 788 000 000"
            onChange={e=>setAdminForm(p=>({...p,phone:e.target.value}))} />
        </Field>
        <Field label="Role" required>
          <Select value={adminForm.role} onChange={e=>setAdminForm(p=>({...p,role:e.target.value}))}>
            <option value="academic_admin">📚 Academic Admin</option>
            <option value="discipline_admin">⚖️ Discipline Admin</option>
            <option value="accounts_admin">💰 Accounts Admin</option>
          </Select>
        </Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <Btn onClick={() => setAdminModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={createAdmin} icon="fas fa-user-plus" color="#1a3a5c" style={{ minWidth:130, justifyContent:'center' }}>
            {saving ? 'Creating…' : 'Create Admin'}
          </Btn>
        </div>
      </Modal>

      {/* ════ MODAL: Post Announcement ════ */}
      <Modal open={annoModal} onClose={() => setAnnoModal(false)} title="Post Announcement" width={540}>
        <Field label="Title" required>
          <Input value={annoForm.title} placeholder="e.g. School closed on Friday"
            onChange={e=>setAnnoForm(p=>({...p,title:e.target.value}))} />
        </Field>
        <Field label="Content" required>
          <Textarea value={annoForm.content} placeholder="Write your announcement here…" rows={5}
            onChange={e=>setAnnoForm(p=>({...p,content:e.target.value}))} />
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Audience">
            <Select value={annoForm.audience} onChange={e=>setAnnoForm(p=>({...p,audience:e.target.value}))}>
              <option value="all">📢 All Users</option>
              <option value="students">🎓 Students</option>
              <option value="teachers">👨‍🏫 Teachers</option>
              <option value="parents">👪 Parents</option>
              <option value="admins">👑 Admins Only</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={annoForm.priority} onChange={e=>setAnnoForm(p=>({...p,priority:e.target.value}))}>
              <option value="normal">ℹ️ Normal</option>
              <option value="high">⚠️ High</option>
              <option value="urgent">🔴 Urgent</option>
            </Select>
          </Field>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <Btn onClick={() => setAnnoModal(false)} color="#f0f0f0" textColor="#666">Cancel</Btn>
          <Btn onClick={postAnnouncement} icon="fas fa-bullhorn" color="#1a3a5c" style={{ minWidth:150, justifyContent:'center' }}>
            {saving ? 'Posting…' : 'Post Announcement'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;