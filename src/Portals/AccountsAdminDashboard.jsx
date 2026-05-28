import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import io from 'socket.io-client';
import ChatModal from '../components/ChatModal';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const AccountsAdminDashboard = () => {
  const [userName, setUserName] = useState('');
  const [activeTab  , setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [budget, setBudget] = useState({ total: 0, spent: 0, remaining: 0, transactions: [] });
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [teacherSalaries, setTeacherSalaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [debtors, setDebtors] = useState([]);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chat states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('portalToken');

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`http://localhost:5000/api${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  };

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
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    const userId = localStorage.getItem('userId');
    if (userId) newSocket.emit('join', userId);
    newSocket.on('newMessage', () => fetchUnreadCount());
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    if (!token || role !== 'accounts_admin') {
      navigate('/portal/login');
    } else {
      setUserName(name || 'Accounts Admin');
      fetchAllData();
      fetchUnreadCount();
    }
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      const [budgetData, incomeData, expensesData, feeData, salaryData, classesData, studentsData, debtorsData] = await Promise.all([
        apiRequest('/accounts/budget').catch(() => ({ total: 0, spent: 0, remaining: 0, transactions: [] })),
        apiRequest('/accounts/income').catch(() => []),
        apiRequest('/accounts/expenses').catch(() => []),
        apiRequest('/accounts/fees').catch(() => []),
        apiRequest('/accounts/salaries').catch(() => []),
        apiRequest('/academic-admin/classes').catch(() => []),
        apiRequest('/accounts/students').catch(() => []),
        apiRequest('/accounts/debtors').catch(() => [])
      ]);
      
      setBudget(budgetData);
      setIncome(Array.isArray(incomeData) ? incomeData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setFeeStructures(Array.isArray(feeData) ? feeData : []);
      setTeacherSalaries(Array.isArray(salaryData) ? salaryData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setDebtors(Array.isArray(debtorsData) ? debtorsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const handleOpenChat = (user = null) => {
    if (user) setSelectedChatUser(user);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedChatUser(null);
    fetchUnreadCount();
  };

  // ==================== BUDGET MANAGEMENT ====================
  const handleAddIncome = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add Income',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="source" placeholder="Source (e.g., School Fees, Donation)" required></div>
          <div class="form-group"><i class="fas fa-dollar-sign"></i><input type="number" id="amount" placeholder="Amount (RWF)" required></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Description (optional)" rows="2"></textarea></div>
        </div>
      `,
      confirmButtonText: 'Add Income',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const source = document.getElementById('source').value;
        const amount = document.getElementById('amount').value;
        if (!source || !amount) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { source, amount: parseFloat(amount), date: document.getElementById('date').value, description: document.getElementById('description').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/accounts/income', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Added!', 'Income recorded successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to add income', 'error');
      }
    }
  };

  const handleAddExpense = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add Expense',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="category" placeholder="Category (e.g., Salaries, Utilities)" required></div>
          <div class="form-group"><i class="fas fa-dollar-sign"></i><input type="number" id="amount" placeholder="Amount (RWF)" required></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="date" value="${new Date().toISOString().split('T')[0]}" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Description" rows="2" required></textarea></div>
        </div>
      `,
      confirmButtonText: 'Add Expense',
      confirmButtonColor: '#e74c3c',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const category = document.getElementById('category').value;
        const amount = document.getElementById('amount').value;
        if (!category || !amount) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { category, amount: parseFloat(amount), date: document.getElementById('date').value, description: document.getElementById('description').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/accounts/expenses', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Added!', 'Expense recorded successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to add expense', 'error');
      }
    }
  };

  // ==================== FEE MANAGEMENT ====================
  const handleCreateFeeStructure = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Fee Structure',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-layer-group"></i><select id="classId"><option value="">Select Class</option>${classes.map(c => `<option value="${c._id}">${c.grade} ${c.className}</option>`).join('')}</select></div>
          <div class="form-group"><i class="fas fa-tag"></i><input type="text" id="feeType" placeholder="Fee Type (e.g., Tuition, Lab Fee)" required></div>
          <div class="form-group"><i class="fas fa-dollar-sign"></i><input type="number" id="amount" placeholder="Amount (RWF)" required></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="dueDate" placeholder="Due Date" required></div>
          <div class="form-group"><i class="fas fa-align-left"></i><textarea id="description" placeholder="Description" rows="2"></textarea></div>
        </div>
      `,
      confirmButtonText: 'Create Fee Structure',
      confirmButtonColor: '#3498db',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const classId = document.getElementById('classId').value;
        const feeType = document.getElementById('feeType').value;
        const amount = document.getElementById('amount').value;
        if (!classId || !feeType || !amount) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { classId, feeType, amount: parseFloat(amount), dueDate: document.getElementById('dueDate').value, description: document.getElementById('description').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/accounts/fees', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Created!', 'Fee structure created and students notified', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to create fee structure', 'error');
      }
    }
  };

  const handleNotifyFees = async (fee) => {
    const result = await Swal.fire({
      title: 'Send Fee Reminder',
      text: `Send payment reminder for ${fee.feeType} to all affected students?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Send Now',
      confirmButtonColor: '#3498db'
    });
    
    if (result.isConfirmed) {
      try {
        await apiRequest(`/accounts/fees/${fee._id}/notify`, { method: 'POST' });
        Swal.fire('Sent!', 'Fee reminder sent to students and parents', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to send notifications', 'error');
      }
    }
  };

  // ==================== SALARY MANAGEMENT ====================
  const handleSalaryAction = async (salary, action) => {
    const actionText = action === 'approved' ? 'Approve' : action === 'pending' ? 'Mark as Pending' : 'Reject';
    const result = await Swal.fire({
      title: `${actionText} Salary`,
      text: `${salary.teacherName} - Amount: ${salary.amount.toLocaleString()} RWF`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: actionText,
      confirmButtonColor: action === 'approved' ? '#27ae60' : action === 'rejected' ? '#e74c3c' : '#f39c12'
    });
    
    if (result.isConfirmed) {
      try {
        await apiRequest(`/accounts/salaries/${salary._id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: action })
        });
        Swal.fire('Updated!', `Salary ${action}`, 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to update salary', 'error');
      }
    }
  };

  // ==================== DEBTOR MANAGEMENT ====================
  const handleDebtorAction = async (debtor, action) => {
    if (action === 'suspend') {
      const result = await Swal.fire({
        title: 'Suspend Student',
        text: `Suspend ${debtor.studentName} for fee default? They owe ${debtor.amountDue.toLocaleString()} RWF.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Suspend',
        confirmButtonColor: '#e74c3c'
      });
      
      if (result.isConfirmed) {
        try {
          await apiRequest(`/accounts/debtors/${debtor._id}/suspend`, { method: 'POST' });
          Swal.fire('Suspended!', 'Student has been suspended and parents notified', 'warning');
          fetchAllData();
        } catch (error) {
          Swal.fire('Error', 'Failed to suspend student', 'error');
        }
      }
    } else if (action === 'waive') {
      const { value: waivedAmount } = await Swal.fire({
        title: 'Waive Fee',
        input: 'number',
        inputLabel: 'Amount to waive (RWF)',
        inputValue: debtor.amountDue,
        showCancelButton: true,
        confirmButtonText: 'Waive',
        confirmButtonColor: '#27ae60'
      });
      
      if (waivedAmount) {
        try {
          await apiRequest(`/accounts/debtors/${debtor._id}/waive`, {
            method: 'POST',
            body: JSON.stringify({ amount: parseFloat(waivedAmount) })
          });
          Swal.fire('Waived!', `${waivedAmount.toLocaleString()} RWF waived`, 'success');
          fetchAllData();
        } catch (error) {
          Swal.fire('Error', 'Failed to waive fee', 'error');
        }
      }
    }
  };

  const handleRecordPayment = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Record Payment',
      html: `
        <div class="admin-form">
          <div class="form-group"><i class="fas fa-user"></i><select id="studentId"><option value="">Select Student</option>${students.map(s => `<option value="${s._id}">${s.fullName} - ${s.className || 'N/A'}</option>`).join('')}</select></div>
          <div class="form-group"><i class="fas fa-tag"></i><select id="feeType"><option value="">Select Fee Type</option>${feeStructures.map(f => `<option value="${f.feeType}">${f.feeType} - ${f.amount.toLocaleString()} RWF</option>`).join('')}</select></div>
          <div class="form-group"><i class="fas fa-dollar-sign"></i><input type="number" id="amount" placeholder="Amount Paid (RWF)" required></div>
          <div class="form-group"><i class="fas fa-calendar"></i><input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required></div>
        </div>
      `,
      confirmButtonText: 'Record Payment',
      confirmButtonColor: '#27ae60',
      showCancelButton: true,
      width: '500px',
      preConfirm: () => {
        const studentId = document.getElementById('studentId').value;
        const feeType = document.getElementById('feeType').value;
        const amount = document.getElementById('amount').value;
        if (!studentId || !feeType || !amount) {
          Swal.showValidationMessage('Please fill required fields');
          return false;
        }
        return { studentId, feeType, amount: parseFloat(amount), paymentDate: document.getElementById('paymentDate').value };
      }
    });

    if (formValues) {
      try {
        await apiRequest('/accounts/payments', { method: 'POST', body: JSON.stringify(formValues) });
        Swal.fire('Recorded!', 'Payment recorded successfully', 'success');
        fetchAllData();
      } catch (error) {
        Swal.fire('Error', 'Failed to record payment', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-chart-line', color: '#3498db' },
    { id: 'budget', label: 'Budget', icon: 'fas fa-chart-pie', color: '#27ae60' },
    { id: 'fees', label: 'Fee Management', icon: 'fas fa-money-bill-wave', color: '#f39c12' },
    { id: 'salaries', label: 'Salaries', icon: 'fas fa-wallet', color: '#9b59b6' },
    { id: 'debtors', label: 'Debtors', icon: 'fas fa-exclamation-triangle', color: '#e74c3c' },
    { id: 'records', label: 'Financial Records', icon: 'fas fa-book', color: '#1abc9c' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user-circle', color: '#34495e' }
  ];

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
  const sidebarWidthMobile = mobileMenuOpen ? sidebarWidth : '0px';

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFeesCollected = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = debtors.reduce((sum, d) => sum + d.amountDue, 0);
  const pendingSalaries = teacherSalaries.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="accounts-admin-dashboard">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: isMobile ? sidebarWidthMobile : sidebarWidth }}>
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-area">
              <div className="logo-icon"><i className="fas fa-coins"></i></div>
              <div className="logo-text"><h3>ESSA Portal</h3><p>Accounts Admin</p></div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar"><i className="fas fa-coins"></i></div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <h4>{userName}</h4>
              <span className="user-role">Accounts Administrator</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}>
              <i className={item.icon} style={{ color: item.color }}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.id === 'debtors' && debtors.length > 0 && !sidebarCollapsed && (
                <span className="nav-badge urgent">{debtors.length}</span>
              )}
              {item.id === 'salaries' && pendingSalaries > 0 && !sidebarCollapsed && (
                <span className="nav-badge">{pendingSalaries}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="chat-btn" onClick={() => handleOpenChat()}>
            <i className="fas fa-comments"></i>
            {!sidebarCollapsed && <span>Messages</span>}
            {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
          </button>
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
            <h2>Accounts Admin Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <div className="notification-bell" onClick={() => handleOpenChat()}>
              <i className="fas fa-envelope"></i>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>
            <div className="user-menu">
              <div className="user-avatar-small"><i className="fas fa-coins"></i></div>
              <div className="user-details">
                <span className="user-name">{userName}</span>
                <span className="user-role-badge">Accounts Admin</span>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome, {userName.split(' ')[0]}! 💰</h1>
            <p>Manage school finances, fees, salaries, and financial records.</p>
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
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e8f5e9' }}><i className="fas fa-chart-line" style={{ color: '#27ae60' }}></i></div>
                <div className="stat-info"><h3>{budget.total.toLocaleString()} RWF</h3><p>Total Budget</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#e3f2fd' }}><i className="fas fa-arrow-down" style={{ color: '#3498db' }}></i></div>
                <div className="stat-info"><h3>{totalIncome.toLocaleString()} RWF</h3><p>Total Income</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fdecea' }}><i className="fas fa-arrow-up" style={{ color: '#e74c3c' }}></i></div>
                <div className="stat-info"><h3>{totalExpenses.toLocaleString()} RWF</h3><p>Total Expenses</p></div></div>
              <div className="stat-card"><div className="stat-icon" style={{ background: '#fff3e0' }}><i className="fas fa-wallet" style={{ color: '#f39c12' }}></i></div>
                <div className="stat-info"><h3>{(totalIncome - totalExpenses).toLocaleString()} RWF</h3><p>Net Balance</p></div></div>
            </div>

            <div className="quick-actions">
              <button onClick={handleAddIncome} className="action-btn success"><i className="fas fa-plus-circle"></i> Add Income</button>
              <button onClick={handleAddExpense} className="action-btn danger"><i className="fas fa-minus-circle"></i> Add Expense</button>
              <button onClick={handleCreateFeeStructure} className="action-btn primary"><i className="fas fa-tag"></i> Create Fee</button>
              <button onClick={handleRecordPayment} className="action-btn info"><i className="fas fa-credit-card"></i> Record Payment</button>
            </div>

            <div className="stats-cards">
              <div className="stats-card"><h3><i className="fas fa-chart-pie"></i> Budget Overview</h3>
                <div className="budget-overview"><div className="budget-item"><span>Total Budget</span><strong>{budget.total.toLocaleString()} RWF</strong></div>
                <div className="budget-item"><span>Spent</span><strong className="danger">{totalExpenses.toLocaleString()} RWF</strong><div className="progress-bar"><div className="progress-fill" style={{ width: `${(totalExpenses / budget.total) * 100}%`, background: '#e74c3c' }}></div></div></div>
                <div className="budget-item"><span>Remaining</span><strong className="success">{(budget.total - totalExpenses).toLocaleString()} RWF</strong></div></div>
              </div>
              <div className="stats-card"><h3><i className="fas fa-chart-bar"></i> Monthly Summary</h3>
                <div className="monthly-summary"><div className="month-item"><span>Fees Collected</span><strong>{totalFeesCollected.toLocaleString()} RWF</strong></div>
                <div className="month-item"><span>Salaries Paid</span><strong>{teacherSalaries.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0).toLocaleString()} RWF</strong></div>
                <div className="month-item"><span>Outstanding Debt</span><strong className="danger">{totalDebt.toLocaleString()} RWF</strong></div></div>
              </div>
            </div>

            <div className="recent-transactions">
              <h3><i className="fas fa-history"></i> Recent Transactions</h3>
              {[...income, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(t => (
                <div key={t._id} className="transaction-item">
                  <i className={`fas ${t.source ? 'fa-arrow-down' : 'fa-arrow-up'}`} style={{ color: t.source ? '#27ae60' : '#e74c3c' }}></i>
                  <div><strong>{t.source || t.category}</strong><br/><small>{new Date(t.date).toLocaleDateString()}</small></div>
                  <span className={`amount ${t.source ? 'positive' : 'negative'}`}>{t.source ? '+' : '-'}{t.amount.toLocaleString()} RWF</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div>
            <div className="budget-summary">
              <div className="budget-card"><h4>Total Budget</h4><div className="amount">{budget.total.toLocaleString()} RWF</div><button onClick={async () => { const { value } = await Swal.fire({ title: 'Set Budget', input: 'number', inputValue: budget.total, confirmButtonColor: '#27ae60' }); if (value) { await apiRequest('/accounts/budget', { method: 'PUT', body: JSON.stringify({ total: parseFloat(value) }) }); fetchAllData(); } }} className="edit-btn">Edit Budget</button></div>
              <div className="budget-card"><h4>Total Income</h4><div className="amount success">{totalIncome.toLocaleString()} RWF</div><button onClick={handleAddIncome} className="add-btn">+ Add</button></div>
              <div className="budget-card"><h4>Total Expenses</h4><div className="amount danger">{totalExpenses.toLocaleString()} RWF</div><button onClick={handleAddExpense} className="add-btn">+ Add</button></div>
            </div>
            <div className="data-card"><div className="card-header"><h2><i className="fas fa-list"></i> Income & Expenses</h2><div><select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>)}</select><select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}><option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option></select></div></div>
              <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Category/Source</th><th>Description</th><th>Amount</th></tr></thead><tbody>
                {[...income.filter(i => new Date(i.date).getMonth() + 1 === selectedMonth && new Date(i.date).getFullYear() === selectedYear).map(i => ({ ...i, type: 'income' })),
                  ...expenses.filter(e => new Date(e.date).getMonth() + 1 === selectedMonth && new Date(e.date).getFullYear() === selectedYear).map(e => ({ ...e, type: 'expense' }))]
                  .sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (<tr key={t._id}><td>{new Date(t.date).toLocaleDateString()}</td><td><span className={`type-badge ${t.type}`}>{t.type}</span></td><td>{t.source || t.category}</td><td>{t.description || '-'}</td><td className={t.type === 'income' ? 'text-success' : 'text-danger'}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} RWF</td></tr>))}
              </tbody></table></div>
            </div>
          </div>
        )}

        {/* Fee Management Tab */}
        {activeTab === 'fees' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-money-bill-wave"></i> Fee Structures</h2><button onClick={handleCreateFeeStructure} className="btn-primary-sm"><i className="fas fa-plus"></i> Create Fee</button></div>
            <div className="fee-grid">{feeStructures.map(fee => (<div key={fee._id} className="fee-card"><div className="fee-header"><h3>{fee.feeType}</h3><span className="class-badge">{fee.className || 'All Classes'}</span></div><div className="fee-amount">{fee.amount.toLocaleString()} RWF</div><p>{fee.description}</p><div className="fee-footer"><span>Due: {new Date(fee.dueDate).toLocaleDateString()}</span><button onClick={() => handleNotifyFees(fee)} className="notify-btn"><i className="fas fa-bell"></i> Notify</button></div></div>))}</div>
            <div className="card-header" style={{ marginTop: '30px' }}><h2><i className="fas fa-credit-card"></i> Recent Payments</h2><button onClick={handleRecordPayment} className="btn-primary-sm"><i className="fas fa-plus"></i> Record Payment</button></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Date</th><th>Student</th><th>Fee Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{feePayments.slice(0, 10).map(p => (<tr key={p._id}><td>{new Date(p.paymentDate).toLocaleDateString()}</td><td>{p.studentName}</td><td>{p.feeType}</td><td>{p.amount.toLocaleString()} RWF</td><td><span className="status-badge approved">Paid</span></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* Salaries Tab */}
        {activeTab === 'salaries' && (
          <div className="data-card">
            <div className="card-header"><h2><i className="fas fa-wallet"></i> Teacher Salaries</h2><div className="stats-badge">Pending: {pendingSalaries}</div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Teacher</th><th>Subject</th><th>Month</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {teacherSalaries.map(s => (<tr key={s._id}><td><strong>{s.teacherName}</strong></td><td>{s.subject}</td><td>{s.month}</td><td>{s.amount.toLocaleString()} RWF</td><td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
              <td><div className="action-buttons">{s.status === 'pending' ? (<><button onClick={() => handleSalaryAction(s, 'approved')} className="approve-btn">Approve</button><button onClick={() => handleSalaryAction(s, 'rejected')} className="reject-btn">Reject</button></>) : s.status === 'approved' ? <button onClick={() => handleSalaryAction(s, 'pending')} className="pending-btn">Mark Pending</button> : <button onClick={() => handleSalaryAction(s, 'pending')} className="retry-btn">Retry</button>}</div></td></tr>))}
            </tbody></table></div>
          </div>
        )}

        {/* Debtors Tab */}
{activeTab === 'debtors' && (
  <div className="data-card">
    <div className="card-header">
      <h2><i className="fas fa-exclamation-triangle"></i> Students with Fee Issues</h2>
      <div className="stats-badge urgent">Total Debt: {totalDebt.toLocaleString()} RWF</div>
    </div>
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Parent Contact</th>
            <th>Amount Due</th>
            <th>Days Overdue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {debtors.map(d => (
            <tr key={d._id}>
              <td><strong>{d.studentName}</strong></td>
              <td>{d.className}</td>
              <td>{d.parentPhone}</td>
              <td className="text-danger">{d.amountDue.toLocaleString()} RWF</td>
              <td><span className="overdue-badge">{d.daysOverdue} days</span></td>
              <td>
                <div className="action-buttons">
                  <button onClick={() => handleDebtorAction(d, 'suspend')} className="suspend-btn">
                    <i className="fas fa-ban"></i> Suspend
                  </button>
                  <button onClick={() => handleDebtorAction(d, 'waive')} className="waive-btn">
                    <i className="fas fa-gift"></i> Waive
                  </button>
                  <button onClick={() => handleOpenChat({ name: d.parentName, role: 'parent', id: d.parentId })} className="chat-btn-small">
                    <i className="fas fa-comment"></i> Contact
                  </button>
                </div>{/* ✅ was missing */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* Financial Records Tab */}
{activeTab === 'records' && (
  <div className="data-card">
    <div className="card-header">
      <h2><i className="fas fa-book"></i> Financial Records</h2>
      <div>
        <input
          type="text"
          placeholder="Search records..."
          className="search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category/Source</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {[...income, ...expenses]
            .filter(t =>
              t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.source?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(t => (
              <tr key={t._id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>{/* ✅ removed stray } */}
                <td className={t.source ? 'text-success' : 'text-danger'}>
                  {t.source ? 'Income' : 'Expense'}
                </td>
                <td>{t.source || t.category}</td>
                <td>{t.description || '-'}</td>
                <td className={t.source ? 'text-success' : 'text-danger'}>
                  {t.source ? '+' : '-'}{t.amount.toLocaleString()} RWF
                </td>
                <td>{t.reference || '-'}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-card"><div className="profile-header"><div className="profile-avatar"><i className="fas fa-coins"></i></div><h2>{userName}</h2><p className="profile-role">Accounts Administrator</p></div>
            <div className="profile-details"><div className="detail-item"><i className="fas fa-envelope"></i><div><label>Email</label><p>{localStorage.getItem('userEmail') || 'accounts@essa.rw'}</p></div></div>
            <div className="detail-item"><i className="fas fa-shield-alt"></i><div><label>Role</label><p>Accounts Administrator</p></div></div>
            <div className="detail-item"><i className="fas fa-coins"></i><div><label>Permissions</label><p>Manage budget, fees, salaries, financial records</p></div></div></div>
            <button className="change-password-btn" onClick={() => Swal.fire({ title: 'Change Password', html: `<input type="password" id="current" class="swal2-input" placeholder="Current"><input type="password" id="new" class="swal2-input" placeholder="New"><input type="password" id="confirm" class="swal2-input" placeholder="Confirm">`, confirmButtonText: 'Update', preConfirm: () => { const newPass = document.getElementById('new').value; const confirm = document.getElementById('confirm').value; if (newPass !== confirm) { Swal.showValidationMessage('Passwords do not match'); return false; } return { newPassword: newPass }; } }).then(result => { if (result.isConfirmed) Swal.fire('Success', 'Password updated', 'success'); })}>Change Password</button>
          </div>
        )}
      </main>

      <ChatModal isOpen={isChatModalOpen} onClose={handleCloseChat} recipient={selectedChatUser} onMessageSent={fetchUnreadCount} />

      <style>{`
        .accounts-admin-dashboard { font-family: 'Inter', sans-serif; background: #f0f2f5; min-height: 100vh; }
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
        .collapse-btn { position: absolute; bottom: -12px; right: -12px; width: 24px; height: 24px; background: #ffc107; border: none; border-radius: 50%; cursor: pointer; color: #1a3a5c; }
        .user-profile { padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .user-avatar { width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; }
        .user-avatar i { font-size: 1.8rem; color: #ffc107; }
        .user-info h4 { margin: 0; font-size: 0.9rem; }
        .user-role { font-size: 0.7rem; opacity: 0.8; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 20px; background: transparent; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; transition: all 0.3s; position: relative; }
        .nav-item i { width: 20px; }
        .nav-item:hover { background: rgba(255,255,255,0.1); color: #ffc107; }
        .nav-item.active { background: rgba(255,255,255,0.15); color: #ffc107; border-right: 3px solid #ffc107; }
        .nav-badge { position: absolute; right: 20px; background: #27ae60; color: white; border-radius: 10px; padding: 2px 6px; font-size: 0.7rem; }
        .nav-badge.urgent { background: #e74c3c; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 8px; }
        .chat-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #3498db; border: none; border-radius: 8px; color: white; cursor: pointer; position: relative; }
        .chat-badge { position: absolute; right: 10px; background: #e74c3c; border-radius: 50%; padding: 2px 6px; font-size: 0.7rem; }
        .logout-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .main-content { transition: margin-left 0.3s ease; padding: 20px; min-height: 100vh; }
        .top-bar { background: white; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .top-bar-left { display: flex; align-items: center; gap: 15px; }
        .mobile-menu-btn { display: none; background: #1a3a5c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        .top-bar-right { display: flex; align-items: center; gap: 20px; }
        .notification-bell { position: relative; cursor: pointer; font-size: 1.2rem; color: #666; }
        .notification-badge { position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 50%; }
        .user-menu { display: flex; align-items: center; gap: 10px; }
        .user-avatar-small { width: 35px; height: 35px; background: #1a3a5c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { font-weight: 600; font-size: 0.85rem; }
        .user-role-badge { font-size: 0.7rem; color: #ffc107; }
        .welcome-banner { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); border-radius: 16px; padding: 25px 30px; margin-bottom: 25px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .welcome-text h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .welcome-date { background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 30px; font-size: 0.85rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 15px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-icon { width: 55px; height: 55px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon i { font-size: 1.5rem; }
        .stat-info h3 { font-size: 1.3rem; margin: 0; color: #1a3a5c; }
        .stat-info p { margin: 5px 0 0; color: #666; }
        .quick-actions { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 25px; }
        .action-btn { padding: 12px 24px; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s; }
        .action-btn.success { background: #27ae60; color: white; }
        .action-btn.danger { background: #e74c3c; color: white; }
        .action-btn.primary { background: #3498db; color: white; }
        .action-btn.info { background: #1abc9c; color: white; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .stats-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stats-card { background: white; border-radius: 16px; padding: 20px; }
        .stats-card h3 { margin-bottom: 15px; color: #1a3a5c; }
        .budget-overview .budget-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 5px; }
        .progress-bar { flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; margin-left: 10px; }
        .progress-fill { height: 100%; border-radius: 3px; }
        .text-success { color: #27ae60; }
        .text-danger { color: #e74c3c; }
        .monthly-summary .month-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .recent-transactions { background: white; border-radius: 16px; padding: 20px; }
        .recent-transactions h3 { margin-bottom: 15px; color: #1a3a5c; }
        .transaction-item { display: flex; align-items: center; gap: 15px; padding: 12px 0; border-bottom: 1px solid #eee; }
        .transaction-item .amount { margin-left: auto; font-weight: bold; }
        .transaction-item .amount.positive { color: #27ae60; }
        .transaction-item .amount.negative { color: #e74c3c; }
        .data-card { background: white; border-radius: 16px; padding: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .btn-primary-sm { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .budget-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .budget-card { background: white; border-radius: 16px; padding: 20px; text-align: center; }
        .budget-card h4 { margin-bottom: 10px; color: #666; }
        .budget-card .amount { font-size: 1.5rem; font-weight: bold; color: #1a3a5c; margin-bottom: 15px; }
        .budget-card .amount.success { color: #27ae60; }
        .budget-card .amount.danger { color: #e74c3c; }
        .edit-btn, .add-btn { background: #f0f2f5; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .fee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .fee-card { background: #f8f9fa; border-radius: 12px; padding: 15px; border-left: 4px solid #f39c12; }
        .fee-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .fee-header h3 { margin: 0; color: #1a3a5c; }
        .class-badge { background: #e3f2fd; color: #3498db; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; }
        .fee-amount { font-size: 1.3rem; font-weight: bold; color: #27ae60; margin: 10px 0; }
        .fee-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.75rem; color: #666; }
        .notify-btn { background: #f39c12; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .status-badge.pending { background: #fff3e0; color: #f39c12; }
        .status-badge.approved { background: #e8f5e9; color: #27ae60; }
        .status-badge.rejected { background: #fdecea; color: #e74c3c; }
        .status-badge.paid { background: #e8f5e9; color: #27ae60; }
        .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; }
        .type-badge.income { background: #e8f5e9; color: #27ae60; }
        .type-badge.expense { background: #fdecea; color: #e74c3c; }
        .overdue-badge { background: #fdecea; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; }
        .approve-btn { background: #27ae60; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .reject-btn { background: #e74c3c; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .pending-btn { background: #f39c12; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .retry-btn { background: #3498db; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .suspend-btn { background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; }
        .waive-btn { background: #f39c12; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; }
        .chat-btn-small { background: #3498db; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; }
        .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .search-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; width: 250px; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; max-width: 600px; margin: 0 auto; }
        .profile-header { background: linear-gradient(135deg, #1a3a5c, #2c5f8a); color: white; padding: 40px; text-align: center; }
        .profile-avatar { width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .profile-avatar i { font-size: 3rem; color: #ffc107; }
        .profile-details { padding: 30px; }
        .detail-item { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee; }
        .detail-item i { font-size: 1.2rem; color: #1a3a5c; width: 30px; }
        .change-password-btn { width: calc(100% - 60px); margin: 0 30px 30px; padding: 12px; background: #1a3a5c; color: white; border: none; border-radius: 8px; cursor: pointer; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px; background: #f8f9fa; color: #1a3a5c; font-weight: 600; }
        .data-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .no-data { text-align: center; padding: 40px; color: #999; }
        .stats-badge { background: #e8f5e9; color: #27ae60; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }
        .stats-badge.urgent { background: #fdecea; color: #e74c3c; }
        @media (max-width: 768px) { .mobile-menu-btn { display: block; } .welcome-text h1 { font-size: 1.2rem; } .stats-grid { grid-template-columns: 1fr; } .quick-actions { flex-direction: column; } .budget-summary { grid-template-columns: 1fr; } .fee-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default AccountsAdminDashboard;