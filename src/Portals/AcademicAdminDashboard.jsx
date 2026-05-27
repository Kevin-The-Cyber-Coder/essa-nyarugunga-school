import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const AcademicAdminDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Chat states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('portalToken');

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
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
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    const userId = localStorage.getItem('userId');
    if (userId) newSocket.emit('join', userId);
    newSocket.on('newMessage', () => {
      fetchUnreadCount();
      if (activeTab === 'messages') fetchUsers();
    });
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (!token || role !== 'academic_admin') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Academic Admin');
      fetchAllData();
      fetchUnreadCount();
      fetchUsers();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const [teachersData, classesData, newsData, galleryData, perfData, classPerfData, annData] = await Promise.all([
        apiRequest('/academic-admin/teachers-list').catch(() => []),
        apiRequest('/academic-admin/classes').catch(() => []),
        apiRequest('/academic-admin/news').catch(() => []),
        apiRequest('/academic-admin/gallery').catch(() => []),
        apiRequest('/academic-admin/students-performance').catch(() => []),
        apiRequest('/academic-admin/class-performance').catch(() => []),
        apiRequest('/announcements').catch(() => [])
      ]);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setNews(Array.isArray(newsData) ? newsData : []);
      setGallery(Array.isArray(galleryData) ? galleryData : []);
      setStudentPerformance(Array.isArray(perfData) ? perfData : []);
      setClassPerformance(Array.isArray(classPerfData) ? classPerfData : []);
      setAnnouncements(Array.isArray(annData) ? annData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('/messages/users').catch(() => []);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const data = await apiRequest(`/messages/user/${userId}`).catch(() => []);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest('/messages/unread/count');
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;
    try {
      const data = await apiRequest('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ receiverId: selectedUser._id, content: messageText })
      });
      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageText('');
        if (socket) socket.emit('sendMessage', { receiverId: selectedUser._id, ...data.message });
        fetchUnreadCount();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to send message', 'error');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  // ==================== TEACHER MANAGEMENT ====================
  const handleCreateTeacher = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Teacher Account',
      html: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="position: relative;">
            <i class="fas fa-user" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="fullName" class="swal2-input" placeholder="Full Name *" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-envelope" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="email" id="email" class="swal2-input" placeholder="Email *" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-lock" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="password" id="password" class="swal2-input" placeholder="Password (default: teacher123)" style="padding-left: 40px;">
          </div>
          <div style="position: relative;">
            <i class="fas fa-book" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="subject" class="swal2-input" placeholder="Subject" style="padding-left: 40px;">
          </div>
          <div style="position: relative;">
            <i class="fas fa-phone" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="tel" id="phone" class="swal2-input" placeholder="Phone Number" style="padding-left: 40px;">
          </div>
        </div>
      `,
      confirmButtonText: 'Create Teacher',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        if (!fullName || !email) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: document.getElementById('password')?.value || 'teacher123',
          subject: document.getElementById('subject')?.value || 'General',
          phone: document.getElementById('phone')?.value || ''
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/academic-admin/create-teacher-credentials', {
          method: 'POST',
          body: JSON.stringify(formValues)
        });
        Swal.fire({
          title: '✅ Teacher Created!',
          html: `
            <div style="text-align: left; background: #f0f4f8; padding: 15px; border-radius: 8px;">
              <p><strong>Name:</strong> ${formValues.fullName}</p>
              <p><strong>Email:</strong> ${formValues.email}</p>
              <p><strong>Password:</strong> <code style="background: #1a3a5c; color: white; padding: 2px 8px; border-radius: 4px;">${formValues.password}</code></p>
              <p><strong>Subject:</strong> ${formValues.subject}</p>
            </div>
          `,
          icon: 'success'
        });
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to create teacher', 'error');
      }
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    const result = await Swal.fire({
      title: 'Delete Teacher?',
      text: `Remove ${teacher.fullName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      try {
        await apiRequest(`/academic-admin/teachers/${teacher._id}`, { method: 'DELETE' });
        Swal.fire('Deleted!', 'Teacher removed successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete teacher', 'error');
      }
    }
  };

  // ==================== CLASS MANAGEMENT ====================
  const handleCreateClass = async () => {
    if (teachers.length === 0) {
      Swal.fire('No Teachers', 'Please create teachers first.', 'warning');
      return;
    }
    
    const teacherOptions = { '': '-- Select Teacher (Optional) --' };
    teachers.forEach(teacher => {
      teacherOptions[teacher._id] = `${teacher.fullName} (${teacher.subject || 'General'})`;
    });
    
    const { value: formValues } = await Swal.fire({
      title: 'Create Class',
      html: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="position: relative;">
            <i class="fas fa-tag" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="className" class="swal2-input" placeholder="Class Name (e.g., A, B, C)" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-layer-group" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <select id="grade" class="swal2-select" style="padding-left: 40px; width: 100%;">
              <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
              <option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option>
            </select>
          </div>
          <div style="position: relative;">
            <i class="fas fa-calendar" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="academicYear" class="swal2-input" placeholder="Academic Year (e.g., 2026)" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-chalkboard-user" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <select id="teacherId" class="swal2-select" style="padding-left: 40px; width: 100%;">
              ${Object.entries(teacherOptions).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      confirmButtonText: 'Create Class',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const className = document.getElementById('className')?.value;
        const grade = document.getElementById('grade')?.value;
        const academicYear = document.getElementById('academicYear')?.value;
        if (!className || !grade || !academicYear) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }
        return { className, grade, academicYear, teacherId: document.getElementById('teacherId')?.value || null };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/academic-admin/classes', {
          method: 'POST',
          body: JSON.stringify(formValues)
        });
        Swal.fire('Success!', 'Class created successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', error.message || 'Failed to create class', 'error');
      }
    }
  };

  const handleDeleteClass = async (classItem) => {
    const result = await Swal.fire({
      title: 'Delete Class?',
      text: `Remove ${classItem.grade} ${classItem.className}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      try {
        await apiRequest(`/academic-admin/classes/${classItem._id}`, { method: 'DELETE' });
        Swal.fire('Deleted!', 'Class removed successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete class', 'error');
      }
    }
  };

  const handleAssignTeacher = async (classItem) => {
    if (teachers.length === 0) {
      Swal.fire({ title: 'No Teachers', text: 'Please create teachers first.', icon: 'warning' });
      return;
    }
    
    const teacherOptions = {};
    teachers.forEach(teacher => {
      teacherOptions[teacher._id] = `${teacher.fullName} (${teacher.subject || 'General'})`;
    });
    teacherOptions['none'] = '-- Remove Teacher --';
    
    const { value: selectedTeacherId } = await Swal.fire({
      title: `Assign Teacher to ${classItem.grade} ${classItem.className}`,
      text: 'Select a teacher:',
      input: 'select',
      inputOptions: teacherOptions,
      showCancelButton: true,
      confirmButtonText: 'Assign',
      confirmButtonColor: '#27ae60',
      preConfirm: (selected) => {
        if (!selected) {
          Swal.showValidationMessage('Please select a teacher');
          return false;
        }
        return selected;
      }
    });
    
    if (selectedTeacherId) {
      const teacherIdToAssign = selectedTeacherId === 'none' ? null : selectedTeacherId;
      try {
        Swal.fire({ title: 'Assigning...', allowOutsideClick: false, showConfirmButton: false, willOpen: () => Swal.showLoading() });
        const data = await apiRequest(`/academic-admin/classes/${classItem._id}/assign-teacher`, {
          method: 'PUT',
          body: JSON.stringify({ teacherId: teacherIdToAssign })
        });
        Swal.close();
        if (data.success) {
          setClasses(prevClasses => prevClasses.map(c => c._id === data.class._id ? data.class : c));
          Swal.fire({ title: 'Success!', text: teacherIdToAssign ? 'Teacher assigned successfully' : 'Teacher removed', icon: 'success', timer: 2000 });
        }
      } catch (error) {
        Swal.close();
        Swal.fire({ title: 'Error', text: error.message || 'Failed to assign teacher', icon: 'error' });
      }
    }
  };

  const handleRefreshClasses = async () => {
    Swal.fire({ title: 'Refreshing...', allowOutsideClick: false, showConfirmButton: false, willOpen: () => Swal.showLoading() });
    try {
      const classesData = await apiRequest('/academic-admin/classes');
      setClasses(Array.isArray(classesData) ? classesData : []);
      Swal.close();
      Swal.fire({ title: 'Refreshed!', text: 'Class list updated', icon: 'success', timer: 1500 });
    } catch (error) {
      Swal.close();
      Swal.fire('Error', 'Failed to refresh', 'error');
    }
  };

  // ==================== NEWS MANAGEMENT ====================
  const handleCreateNews = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create News/Event',
      html: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="position: relative;">
            <i class="fas fa-heading" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="title" class="swal2-input" placeholder="Title" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-align-left" style="position: absolute; left: 12px; top: 15px; color: #999;"></i>
            <textarea id="summary" class="swal2-textarea" placeholder="Short Summary" rows="3" style="padding-left: 40px;" required></textarea>
          </div>
          <div style="position: relative;">
            <i class="fas fa-file-alt" style="position: absolute; left: 12px; top: 15px; color: #999;"></i>
            <textarea id="content" class="swal2-textarea" placeholder="Full Content (optional)" rows="4" style="padding-left: 40px;"></textarea>
          </div>
          <div style="position: relative;">
            <i class="fas fa-image" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="image" class="swal2-input" placeholder="Image URL" style="padding-left: 40px;">
          </div>
          <div style="position: relative;">
            <i class="fas fa-tag" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <select id="category" class="swal2-select" style="padding-left: 40px; width: 100%;">
              <option value="news">📰 News</option>
              <option value="event">🎉 Event</option>
              <option value="announcement">📢 Announcement</option>
            </select>
          </div>
        </div>
      `,
      confirmButtonText: 'Publish',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '550px',
      preConfirm: () => {
        const title = document.getElementById('title')?.value;
        const summary = document.getElementById('summary')?.value;
        if (!title || !summary) {
          Swal.showValidationMessage('Please fill title and summary');
          return false;
        }
        return {
          title, summary,
          content: document.getElementById('content')?.value || summary,
          image: document.getElementById('image')?.value || 'https://via.placeholder.com/800x400/1a3a5c/ffffff?text=News',
          category: document.getElementById('category')?.value
        };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/academic-admin/news', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Published!', 'News/Event added successfully', 'success');
        fetchAllData();
        // Redirect to news page notification
        Swal.fire({
          title: 'View on Website',
          text: 'News has been published. Click OK to view on the news page.',
          icon: 'info',
          confirmButtonText: 'View News Page',
          showCancelButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            window.open('/news', '_blank');
          }
        });
      } catch (error) {
        Swal.fire('Error', 'Failed to publish news', 'error');
      }
    }
  };

  const handleDeleteNews = async (newsItem) => {
    const result = await Swal.fire({
      title: 'Delete News?',
      text: `Remove "${newsItem.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      try {
        await apiRequest(`/academic-admin/news/${newsItem._id}`, { method: 'DELETE' });
        Swal.fire('Deleted!', 'News removed successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete news', 'error');
      }
    }
  };

  // ==================== GALLERY MANAGEMENT ====================
  const handleAddGalleryImage = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add Gallery Image',
      html: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="position: relative;">
            <i class="fas fa-heading" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="title" class="swal2-input" placeholder="Image Title" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-image" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <input type="text" id="image" class="swal2-input" placeholder="Image URL" style="padding-left: 40px;" required>
          </div>
          <div style="position: relative;">
            <i class="fas fa-tag" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;"></i>
            <select id="category" class="swal2-select" style="padding-left: 40px; width: 100%;">
              <option value="academic">📚 Academic</option>
              <option value="sports">⚽ Sports</option>
              <option value="cultural">🎭 Cultural</option>
              <option value="events">🎪 Events</option>
            </select>
          </div>
        </div>
      `,
      confirmButtonText: 'Add Image',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const title = document.getElementById('title')?.value;
        const image = document.getElementById('image')?.value;
        if (!title || !image) {
          Swal.showValidationMessage('Please fill title and image URL');
          return false;
        }
        return { title, image, category: document.getElementById('category')?.value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/academic-admin/gallery', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Added!', 'Image added to gallery', 'success');
        fetchAllData();
        // Redirect to gallery page notification
        Swal.fire({
          title: 'View on Website',
          text: 'Image has been added to gallery. Click OK to view on the gallery page.',
          icon: 'info',
          confirmButtonText: 'View Gallery Page',
          showCancelButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            window.open('/gallery', '_blank');
          }
        });
      } catch (error) {
        Swal.fire('Error', 'Failed to add image', 'error');
      }
    }
  };

  const handleDeleteGalleryImage = async (image) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: `Remove "${image.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Yes, Delete'
    });
    if (result.isConfirmed) {
      try {
        await apiRequest(`/academic-admin/gallery/${image._id}`, { method: 'DELETE' });
        Swal.fire('Deleted!', 'Image removed successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete image', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'teachers', label: 'Teachers', icon: 'fas fa-chalkboard-user', color: '#27ae60' },
    { id: 'classes', label: 'Classes', icon: 'fas fa-school', color: '#9b59b6' },
    { id: 'news', label: 'News & Events', icon: 'fas fa-newspaper', color: '#f39c12' },
    { id: 'gallery', label: 'Gallery', icon: 'fas fa-images', color: '#e74c3c' },
    { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn', color: '#1abc9c' },
    { id: 'performance', label: 'Performance', icon: 'fas fa-chart-bar', color: '#1abc9c' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-comments', color: '#9b59b6' },
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
    <div className="academic-admin-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-user-graduate"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Academic Admin</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-user-graduate"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Academic Administrator</span>
            </div>
          )}
        </div>

        <div className="sidebar-nav-wrapper">
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}>
                <i className={item.icon} style={{ color: item.color }}></i>
                {!sidebarCollapsed && <span>{item.label}</span>}
                {item.id === 'messages' && unreadCount > 0 && !sidebarCollapsed && <span className="nav-badge">{unreadCount}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i>{!sidebarCollapsed && <span>Logout</span>}</button>
        </div>
      </aside>

      <main className="main-content" style={{ marginLeft: isMobile ? '0' : sidebarWidth }}>
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><i className="fas fa-bars"></i></button>
            <h2>Academic Admin Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-user-graduate"></i></div>
              <div className="user-details"><span className="user-name">{userName}</span><span className="user-role-badge">Academic Admin</span></div>
            </div>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-text"><h1>Welcome back, {userName.split(' ')[0]}! 📚</h1><p>Manage teachers, classes, and academic content from your dashboard.</p></div>
          <div className="welcome-date"><i className="fas fa-calendar-alt"></i><span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-chalkboard-user" style={{ color: '#27ae60' }}></i></div><div className="stat-info"><h3>{teachers.length}</h3><p>Teachers</p><span className="stat-trend">Active educators</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd' }}><i className="fas fa-school" style={{ color: '#3498db' }}></i></div><div className="stat-info"><h3>{classes.length}</h3><p>Classes</p><span className="stat-trend">Active classes</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-newspaper" style={{ color: '#f39c12' }}></i></div><div className="stat-info"><h3>{news.length}</h3><p>News & Events</p><span className="stat-trend">Published articles</span></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-images" style={{ color: '#e74c3c' }}></i></div><div className="stat-info"><h3>{gallery.length}</h3><p>Gallery Images</p><span className="stat-trend">Captured moments</span></div></div>
            </div>
            <div className="quick-actions">
              <button onClick={handleCreateTeacher} className="action-btn primary"><i className="fas fa-user-plus"></i> Add Teacher</button>
              <button onClick={handleCreateClass} className="action-btn secondary"><i className="fas fa-plus-circle"></i> Create Class</button>
              <button onClick={handleCreateNews} className="action-btn warning"><i className="fas fa-newspaper"></i> Post News</button>
              <button onClick={handleAddGalleryImage} className="action-btn danger"><i className="fas fa-image"></i> Add to Gallery</button>
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-chalkboard-user"></i> Teachers</h2><button onClick={handleCreateTeacher} className="btn-primary-sm"><i className="fas fa-plus"></i> Add Teacher</button></div>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Teacher</th><th>Email</th><th>Subject</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>
                  {teachers.map(t => <tr key={t._id}><td><strong>{t.fullName}</strong></td><td>{t.email}</td><td>{t.subject || '-'}</td><td>{t.phone || '-'}</td><td><button onClick={() => handleDeleteTeacher(t)} className="delete-btn-sm"><i className="fas fa-trash"></i></button></td></tr>)}
                  {teachers.length === 0 && <tr><td colSpan="5" className="no-data">No teachers yet. Click "Add Teacher" to create one.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-school"></i> Classes</h2>
              <div className="header-actions"><button onClick={handleRefreshClasses} className="btn-secondary-sm"><i className="fas fa-sync-alt"></i> Refresh</button><button onClick={handleCreateClass} className="btn-primary-sm"><i className="fas fa-plus"></i> Create Class</button></div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Grade</th><th>Class Name</th><th>Academic Year</th><th>Teacher</th><th>Actions</th></tr></thead>
                <tbody>
                  {classes.map(c => <tr key={c._id}><td><strong>{c.grade}</strong></td>}<c.className} </td>}<c.academicYear} <td>{c.teacherId && typeof c.teacherId === 'object' && c.teacherId.fullName ? <span className="assigned-badge"><i className="fas fa-chalkboard-user"></i> {c.teacherId.fullName}</span> : <span className="unassigned-badge">Not Assigned</span>} <td><div className="action-buttons"><button onClick={() => handleAssignTeacher(c)} className="assign-btn"><i className="fas fa-user-plus"></i> Assign</button><button onClick={() => handleDeleteClass(c)} className="delete-btn-sm"><i className="fas fa-trash"></i></button></div></td></tr>)}
                  {classes.length === 0 && <tr><td colSpan="5" className="no-data">No classes yet. Click "Create Class" to create one.ERC20</tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-newspaper"></i> News & Events</h2><button onClick={handleCreateNews} className="btn-primary-sm"><i className="fas fa-plus"></i> Post News</button></div>
            <div className="news-list">
              {news.map(item => (
                <div key={item._id} className="news-item">
                  <div className="news-content">
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="news-meta">
                      <span className={`category-badge ${item.category}`}><i className={`fas ${item.category === 'news' ? 'fa-newspaper' : item.category === 'event' ? 'fa-calendar' : 'fa-bullhorn'}`}></i> {item.category}</span>
                      <span><i className="fas fa-calendar"></i> {new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteNews(item)} className="delete-btn-sm"><i className="fas fa-trash"></i></button>
                </div>
              ))}
              {news.length === 0 && <p className="no-data">No news articles yet. Click "Post News" to create one.</p>}
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-images"></i> Gallery</h2><button onClick={handleAddGalleryImage} className="btn-primary-sm"><i className="fas fa-plus"></i> Add Image</button></div>
            {gallery.length === 0 ? <p className="no-data">No images in gallery. Click "Add Image" to upload.</p> : (
              <div className="gallery-grid">
                {gallery.map(img => (
                  <div key={img._id} className="gallery-item">
                    <img src={img.image} alt={img.title} />
                    <div className="gallery-overlay">
                      <h4>{img.title}</h4>
                      <span className="category-tag">{img.category}</span>
                      <button onClick={() => handleDeleteGalleryImage(img)} className="delete-btn"><i className="fas fa-trash"></i> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
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
                    <div><h3>{ann.title}</h3><span className={`priority-badge ${ann.priority}`}>{ann.priority === 'urgent' ? '🔴 URGENT' : ann.priority === 'high' ? '⚠️ HIGH' : 'ℹ️ NORMAL'}</span></div>
                  </div>
                  <p>{ann.content}</p>
                  <div className="announcement-footer"><span><i className="fas fa-clock"></i> {new Date(ann.createdAt).toLocaleDateString()}</span></div>
                </div>
              ))}
              {announcements.length === 0 && <p className="no-data">No announcements yet.</p>}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <div className="data-card">
              <h2><i className="fas fa-chart-line"></i> Class Performance</h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Class</th><th>Teacher</th><th>Students</th><th>Avg Score</th></tr></thead>
                  <tbody>
                    {classPerformance.map((c, i) => <tr key={i}><td><strong>{c.className}</strong></td>}<c.teacher} </td>}<c.studentCount} <td><span className="score-badge">{c.averageScore}%</span></td></tr>)}
                    {classPerformance.length === 0 && <tr><td colSpan="4" className="no-data">No performance data available yet.ERC20</td>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="data-card">
              <h2><i className="fas fa-trophy"></i> Top Students</h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Average</th></tr></thead>
                  <tbody>
                    {studentPerformance.slice(0, 10).map((s, i) => <tr key={i}><td>{s.studentId}</td>}<strong>{s.name}</strong> <td><strong>{s.class}</strong> <td><span className="score-badge success">{s.averageScore}%</span></td></td>)}
                    {studentPerformance.length === 0 && <tr><td colSpan="4" className="no-data">No student performance data available yet.ERC20</tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="messages-container">
            <div className="messages-header">
              <div className="messages-tabs">
                <button className="msg-tab active"><i className="fas fa-inbox"></i> Inbox {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}</button>
                <button className="msg-tab"><i className="fas fa-pen-alt"></i> New Message</button>
              </div>
            </div>
            <div className="inbox-container">
              <div className="conversations-list">
                <div className="search-conversations"><i className="fas fa-search"></i><input type="text" placeholder="Search conversations..." /></div>
                {users.map(user => (
                  <div key={user._id} className={`conversation-item ${selectedUser?._id === user._id ? 'active' : ''}`} onClick={() => handleSelectUser(user)}>
                    <div className="conv-avatar"><i className={`fas ${user.role === 'teacher' ? 'fa-chalkboard-user' : 'fa-user'}`}></i></div>
                    <div className="conv-info"><div className="conv-name">{user.fullName}</div><div className="conv-role">{user.role}</div></div>
                  </div>
                ))}
                {users.length === 0 && <div className="no-conversations">No conversations yet</div>}
              </div>
              <div className="messages-area">
                {selectedUser ? (
                  <>
                    <div className="messages-header-info">
                      <div className="conv-avatar-large"><i className="fas fa-user"></i></div>
                      <div><h3>{selectedUser.fullName}</h3><p>{selectedUser.role}</p></div>
                    </div>
                    <div className="messages-list">
                      {messages.map(msg => (
                        <div key={msg._id} className={`message-bubble ${msg.senderId === localStorage.getItem('userId') ? 'sent' : 'received'}`}>
                          <div className="message-text">{msg.content}</div>
                          <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="message-input-area">
                      <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}></textarea>
                      <button onClick={handleSendMessage}><i className="fas fa-paper-plane"></i></button>
                    </div>
                  </>
                ) : (
                  <div className="no-conversation-selected"><i className="fas fa-comments"></i><h3>No conversation selected</h3><p>Select a user to start messaging</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar"><i className="fas fa-user-graduate"></i></div>
              <h2>{userName}</h2>
              <p className="profile-role">Academic Administrator</p>
            </div>
            <div className="profile-details">
              <div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email Address</label><p>{localStorage.getItem('userEmail') || 'academic@essa.rw'}</p></div></div>
              <div className="detail-item"><i className="fas fa-shield-alt"></i><div><label>Role</label><p>Academic Administrator</p></div></div>
              <div className="detail-item"><i className="fas fa-calendar"></i><div><label>Member Since</label><p>2024</p></div></div>
            </div>
            <button className="change-password-btn" onClick={() => {
              Swal.fire({
                title: 'Change Password',
                html: `<input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password"><input type="password" id="newPassword" class="swal2-input" placeholder="New Password"><input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm New Password">`,
                confirmButtonText: 'Update',
                showCancelButton: true,
                preConfirm: () => {
                  const current = document.getElementById('currentPassword')?.value;
                  const newPass = document.getElementById('newPassword')?.value;
                  const confirm = document.getElementById('confirmPassword')?.value;
                  if (!current || !newPass || !confirm) return false;
                  if (newPass !== confirm) { Swal.showValidationMessage('New passwords do not match'); return false; }
                  if (newPass.length < 6) { Swal.showValidationMessage('Password must be at least 6 characters'); return false; }
                  return { current, newPassword: newPass };
                }
              }).then(result => { if (result.isConfirmed) Swal.fire('Success', 'Password updated successfully!', 'success'); });
            }}><i className="fas fa-key"></i> Change Password</button>
          </div>
        )}
      </main>

      <style>{`
        .academic-admin-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
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
        .sidebar-nav-wrapper::-webkit-scrollbar { width: 4px; }
        .sidebar-nav-wrapper::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .sidebar-nav-wrapper::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
        .sidebar-nav { padding: 0.5rem 0; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 20px; background: transparent; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; transition: all 0.3s; position: relative; }
        .nav-item i { width: 20px; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #ffc107; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: #ffc107; border-right: 3px solid #ffc107; }
        .nav-badge { position: absolute; right: 20px; background: #e74c3c; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; min-width: 18px; text-align: center; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
        .logout-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .logout-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .main-content { transition: margin-left 0.3s ease; padding: 20px; min-height: 100vh; }
        .top-bar { background: white; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .top-bar-left { display: flex; align-items: center; gap: 15px; }
        .mobile-menu-btn { display: none; background: #1a3a5c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 25px 30px; margin-bottom: 25px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .welcome-text h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .welcome-date { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 30px; font-size: 0.85rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s, box-shadow 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.5rem; }
        .stat-info h3 { font-size: 1.5rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 5px 0 0; color: #666; }
        .quick-actions { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; }
        .action-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .action-btn.primary { background: #27ae60; color: white; }
        .action-btn.secondary { background: #3498db; color: white; }
        .action-btn.warning { background: #f39c12; color: white; }
        .action-btn.danger { background: #e74c3c; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .data-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .btn-primary-sm { background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .btn-secondary-sm { background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
        .delete-btn-sm { background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .data-table th { text-align: left; padding: 10px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; font-size: 0.8rem; }
        .data-table td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 0.8rem; }
        .no-data { text-align: center; padding: 40px; color: #999; }
        .assigned-badge { color: #27ae60; font-weight: 500; }
        .unassigned-badge { color: #e74c3c; }
        .score-badge { background: #27ae60; color: white; padding: 2px 6px; border-radius: 20px; font-size: 0.7rem; }
        .news-list { display: flex; flex-direction: column; gap: 15px; }
        .news-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; background: #f8f9fa; border-radius: 10px; }
        .news-content { flex: 1; }
        .news-content h3 { margin: 0 0 5px; font-size: 0.9rem; }
        .news-content p { margin: 0 0 8px; font-size: 0.8rem; color: #666; }
        .news-meta { display: flex; gap: 10px; font-size: 0.7rem; color: #999; }
        .category-badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; }
        .category-badge.news { background: #e3f2fd; color: #3498db; }
        .category-badge.event { background: #fff3e0; color: #f39c12; }
        .category-badge.announcement { background: #e8f5e9; color: #27ae60; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }
        .gallery-item { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 1; cursor: pointer; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .gallery-item:hover img { transform: scale(1.05); }
        .gallery-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 10px; color: white; transform: translateY(100%); transition: transform 0.3s; }
        .gallery-item:hover .gallery-overlay { transform: translateY(0); }
        .gallery-overlay h4 { margin: 0 0 3px; font-size: 0.8rem; }
        .category-tag { display: inline-block; padding: 2px 5px; background: rgba(255,255,255,0.2); border-radius: 3px; font-size: 0.6rem; margin-bottom: 5px; }
        .delete-btn { background: #e74c3c; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 0.6rem; }
        .announcements-list { display: flex; flex-direction: column; gap: 12px; }
        .announcement-item { padding: 12px; border-radius: 10px; background: #f8f9fa; border-left: 3px solid; }
        .announcement-item.urgent { border-left-color: #e74c3c; background: #fdecea; }
        .announcement-item.high { border-left-color: #f39c12; background: #fff3e0; }
        .announcement-header h3 { margin: 0; font-size: 0.9rem; }
        .priority-badge { font-size: 0.6rem; margin-left: 8px; padding: 2px 6px; border-radius: 4px; }
        .priority-badge.urgent { background: #e74c3c; color: white; }
        .priority-badge.high { background: #f39c12; color: white; }
        .priority-badge.normal { background: #27ae60; color: white; }
        .announcement-footer { margin-top: 8px; font-size: 0.65rem; color: #999; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 500px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 30px; text-align: center; }
        .profile-avatar { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 2.5rem; color: #ffc107; }
        .profile-header h2 { margin: 0; font-size: 1.3rem; }
        .profile-role { opacity: 0.9; margin-top: 5px; font-size: 0.8rem; }
        .profile-details { padding: 20px; }
        .detail-item { display: flex; gap: 15px; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1rem; color: #1a3a5c; width: 25px; }
        .detail-item label { display: block; font-size: 0.65rem; color: #999; }
        .detail-item p { margin: 0; font-weight: 500; font-size: 0.8rem; }
        .change-password-btn { width: calc(100% - 40px); margin: 0 20px 20px; padding: 10px; background: #1a3a5c; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .action-buttons { display: flex; gap: 8px; }
        .assign-btn { background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }

        /* Messages Tab Styles */
        .messages-container { background: white; border-radius: 16px; overflow: hidden; height: calc(100vh - 180px); min-height: 500px; display: flex; flex-direction: column; }
        .messages-header { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background: white; }
        .messages-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
        .msg-tab { padding: 8px 20px; background: #f0f2f5; border: none; border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.3s; display: flex; align-items: center; gap: 8px; }
        .msg-tab.active { background: #1a3a5c; color: white; }
        .msg-tab .unread-count { background: #e74c3c; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; margin-left: 5px; }
        .inbox-container { display: flex; flex: 1; overflow: hidden; }
        .conversations-list { width: 320px; border-right: 1px solid #e0e0e0; overflow-y: auto; background: #f8f9fa; flex-shrink: 0; }
        .search-conversations { padding: 15px; position: relative; border-bottom: 1px solid #e0e0e0; }
        .search-conversations i { position: absolute; left: 25px; top: 50%; transform: translateY(-50%); color: #999; }
        .search-conversations input { width: 100%; padding: 8px 8px 8px 35px; border: 1px solid #ddd; border-radius: 20px; font-size: 0.85rem; }
        .conversation-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid #eee; }
        .conversation-item:hover { background: #e8f0fe; }
        .conversation-item.active { background: #e3f2fd; border-left: 3px solid #ffc107; }
        .conv-avatar { width: 40px; height: 40px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-role { font-size: 0.7rem; color: #ffc107; }
        .no-conversations { text-align: center; padding: 40px; color: #999; }
        .messages-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .messages-header-info { display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #e0e0e0; background: white; }
        .conv-avatar-large { width: 50px; height: 50px; background: #1a3a5c; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
        .messages-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f8f9fa; }
        .message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 18px; }
        .message-bubble.sent { align-self: flex-end; background: #1a3a5c; color: white; border-bottom-right-radius: 4px; }
        .message-bubble.received { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .message-time { font-size: 0.6rem; opacity: 0.7; margin-top: 5px; text-align: right; }
        .message-input-area { display: flex; gap: 10px; padding: 15px; border-top: 1px solid #e0e0e0; background: white; }
        .message-input-area textarea { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; resize: none; font-family: inherit; font-size: 0.85rem; }
        .message-input-area textarea:focus { outline: none; border-color: #1a3a5c; }
        .message-input-area button { width: 45px; height: 45px; background: #1a3a5c; color: white; border: none; border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .message-input-area button:hover { background: #ffc107; color: #1a3a5c; transform: scale(1.05); }
        .no-conversation-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; text-align: center; gap: 15px; }
        .no-conversation-selected i { font-size: 4rem; opacity: 0.3; }

        @media (min-width: 1025px) {
          .sidebar { width: 260px; position: fixed; }
          .main-content { margin-left: 260px; width: calc(100% - 260px); }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .gallery-grid { grid-template-columns: repeat(3, 1fr); }
          .conversations-list { width: 280px; }
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .sidebar { width: ${sidebarWidthMobile}; }
          .main-content { margin-left: 0; width: 100%; }
          .stats-grid { grid-template-columns: 1fr; }
          .quick-actions { flex-direction: column; }
          .action-btn { justify-content: center; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .welcome-text h1 { font-size: 1.2rem; }
          .card-header { flex-direction: column; align-items: flex-start; }
          .news-item { flex-direction: column; }
          .news-meta { flex-wrap: wrap; }
          .inbox-container { flex-direction: column; }
          .conversations-list { width: 100%; max-height: 200px; border-right: none; border-bottom: 1px solid #e0e0e0; }
          .message-bubble { max-width: 85%; }
        }
      `}</style>
    </div>
  );
};

export default AcademicAdminDashboard;