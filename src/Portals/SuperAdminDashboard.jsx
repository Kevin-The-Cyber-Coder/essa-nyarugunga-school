import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const SuperAdminDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [disciplineCases, setDisciplineCases] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';
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
    
    console.log('SuperAdminDashboard mounted');
    console.log('Token:', token ? 'exists' : 'not found');
    console.log('Role:', role);
    
    if (!token || role !== 'super_admin') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Super Administrator');
      fetchAllData();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    const token = getToken();
    
    if (!token) {
      console.error('No token found');
      setLoading(false);
      return;
    }

    await Promise.all([
      fetchAdmins(),
      fetchAnnouncements(),
      fetchDisciplineCases(),
      fetchPermissions()
    ]);
    
    setLoading(false);
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_URL}/super-admin/admins`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
        console.log('Admins fetched:', data);
      } else {
        console.error('Failed to fetch admins:', response.status);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_URL}/super-admin/announcements`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
        console.log('Announcements fetched:', data);
      } else {
        console.error('Failed to fetch announcements:', response.status);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchDisciplineCases = async () => {
    try {
      const response = await fetch(`${API_URL}/super-admin/discipline-cases`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDisciplineCases(data.cases || []);
        console.log('Discipline cases fetched:', data);
      } else {
        console.error('Failed to fetch discipline cases:', response.status);
      }
    } catch (error) {
      console.error('Error fetching discipline cases:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${API_URL}/super-admin/permissions`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
        console.log('Permissions fetched:', data);
      } else {
        console.error('Failed to fetch permissions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleCreateAdmin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Sub-Admin',
      html: `
        <input type="text" id="fullName" class="swal2-input" placeholder="Full Name" required>
        <input type="email" id="email" class="swal2-input" placeholder="Email" required>
        <input type="password" id="password" class="swal2-input" placeholder="Password" value="admin123">
        <input type="tel" id="phone" class="swal2-input" placeholder="Phone Number">
        <select id="role" class="swal2-select">
          <option value="academic_admin">Academic Admin</option>
          <option value="discipline_admin">Discipline Admin</option>
          <option value="accounts_admin">Accounts Admin</option>
        </select>
      `,
      confirmButtonText: 'Create Admin',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      preConfirm: () => {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const phone = document.getElementById('phone').value;
        const role = document.getElementById('role').value;
        
        if (!fullName || !email) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { fullName, email, password, phone, role };
      }
    });

    if (formValues) {
      try {
        const response = await fetch(`${API_URL}/super-admin/create-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(formValues)
        });

        if (response.ok) {
          const result = await response.json();
          Swal.fire('Success!', `${formValues.role} created successfully. They can login with email: ${formValues.email} and password: ${formValues.password}`, 'success');
          fetchAdmins(); // Refresh the list
        } else {
          const error = await response.json();
          Swal.fire('Error', error.message || 'Failed to create admin', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error. Please try again.', 'error');
      }
    }
  };

  const handlePostAnnouncement = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Post Announcement',
      html: `
        <input type="text" id="title" class="swal2-input" placeholder="Title" required>
        <textarea id="content" class="swal2-textarea" placeholder="Content" required></textarea>
        <select id="priority" class="swal2-select">
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      `,
      confirmButtonText: 'Post Announcement',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const priority = document.getElementById('priority').value;
        
        if (!title || !content) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }
        return { title, content, audience: ['all'], priority };
      }
    });

    if (formValues) {
      try {
        const response = await fetch(`${API_URL}/super-admin/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(formValues)
        });

        if (response.ok) {
          const result = await response.json();
          Swal.fire('Success!', 'Announcement posted successfully', 'success');
          fetchAnnouncements(); // Refresh the list
        } else {
          const error = await response.json();
          Swal.fire('Error', error.message || 'Failed to post announcement', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Network error. Please try again.', 'error');
      }
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'admins', label: 'Manage Admins', icon: 'fas fa-users-cog', color: '#27ae60' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn', color: '#f39c12' },
    { id: 'discipline', label: 'Discipline Cases', icon: 'fas fa-gavel', color: '#e74c3c' },
    { id: 'permissions', label: 'Permissions', icon: 'fas fa-file-alt', color: '#9b59b6' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

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
                <i className="fas fa-crown" style={{ fontSize: '2rem', color: '#1a3a5c' }}></i>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{userName}</h3>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Super Admin</p>
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
              <i className="fas fa-crown" style={{ fontSize: '1.2rem', color: '#1a3a5c' }}></i>
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

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              width: '100%',
              padding: '12px',
              background: '#e74c3c',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
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
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#1a3a5c' }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h2 style={{ color: '#1a3a5c', fontSize: '1.2rem' }}>Super Admin Dashboard</h2>
              <p style={{ fontSize: '0.7rem', color: '#666' }}>Manage school operations</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fas fa-crown"></i>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#1a3a5c' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: '#ffc107' }}>Super Admin</div>
            </div>
          </div>
        </nav>

        <div style={{ padding: '1.5rem' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', color: 'white' }}>
                <h2>Welcome, {userName}! 👑</h2>
                <p>You have full control over the school management system</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#1a3a5c' }}>{admins.length}</h3>
                  <p>Sub-Admins</p>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#1a3a5c' }}>{disciplineCases.length}</h3>
                  <p>Discipline Cases</p>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#1a3a5c' }}>{permissions.length}</h3>
                  <p>Permission Requests</p>
                </div>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#1a3a5c' }}>{announcements.length}</h3>
                  <p>Announcements</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={handleCreateAdmin} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  <i className="fas fa-user-plus"></i> Create Sub-Admin
                </button>
                <button onClick={handlePostAnnouncement} style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  <i className="fas fa-bullhorn"></i> Post Announcement
                </button>
              </div>
            </div>
          )}

          {/* Manage Admins Tab */}
          {activeTab === 'admins' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>System Administrators</h3>
                <button onClick={handleCreateAdmin} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Add Admin
                </button>
              </div>
              {admins.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No admins created yet. Click "Add Admin" to create.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{admin.fullName}</td>
                        <td style={{ padding: '12px' }}>{admin.email}</td>
                        <td style={{ padding: '12px' }}>{admin.role}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: admin.isActive ? '#d4edda' : '#f8d7da', 
                            color: admin.isActive ? '#155724' : '#721c24', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem' 
                          }}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>School Announcements</h3>
                <button onClick={handlePostAnnouncement} style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> New Announcement
                </button>
              </div>
              {announcements.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No announcements yet. Click "New Announcement" to post.</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann._id} style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#1a3a5c' }}>{ann.title}</h4>
                      <span style={{ 
                        background: ann.priority === 'urgent' ? '#e74c3c' : ann.priority === 'high' ? '#f39c12' : '#27ae60', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.7rem' 
                      }}>
                        {ann.priority}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.5rem', color: '#666' }}>{ann.content}</p>
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem' }}>
                      Posted on {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Discipline Cases Tab */}
          {activeTab === 'discipline' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ marginBottom: '1rem' }}>Discipline Cases</h3>
              {disciplineCases.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No discipline cases reported.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: 'white' }}>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplineCases.map(c => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{c.studentId?.fullName || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>{c.category}</td>
                        <td style={{ padding: '12px' }}>{c.description}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: c.status === 'pending' ? '#fff3cd' : '#d4edda', 
                            color: c.status === 'pending' ? '#856404' : '#155724', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem' 
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{c.action || 'Pending review'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
              <h3 style={{ marginBottom: '1rem' }}>Permission Requests</h3>
              {permissions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No permission requests.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: 'white' }}>
                      <th style={{ padding: '12px' }}>Requester</th>
                      <th style={{ padding: '12px' }}>Type</th>
                      <th style={{ padding: '12px' }}>Reason</th>
                      <th style={{ padding: '12px' }}>From - To</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{p.requesterName}</td>
                        <td style={{ padding: '12px' }}>{p.type}</td>
                        <td style={{ padding: '12px' }}>{p.reason}</td>
                        <td style={{ padding: '12px' }}>
                          {new Date(p.fromDate).toLocaleDateString()} - {new Date(p.toDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: p.status === 'pending' ? '#fff3cd' : p.status === 'approved' ? '#d4edda' : '#f8d7da', 
                            color: p.status === 'pending' ? '#856404' : p.status === 'approved' ? '#155724' : '#721c24', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem' 
                          }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '100px', height: '100px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <i className="fas fa-crown" style={{ fontSize: '3rem', color: 'white' }}></i>
                </div>
                <h2>{userName}</h2>
                <p style={{ color: '#ffc107' }}>Super Administrator</p>
              </div>
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Full Name</label>
                  <p>{userName}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Email</label>
                  <p>admin@essa.rw</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#666' }}>Role</label>
                  <p>Super Administrator</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;