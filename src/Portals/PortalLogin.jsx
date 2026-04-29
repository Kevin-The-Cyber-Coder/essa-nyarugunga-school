import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PortalLogin = () => {
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole');
    if (rememberedEmail && rememberedRole) {
      setEmail(rememberedEmail);
      setSelectedRole(rememberedRole);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('portalToken', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.fullName);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userId', data._id);
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedRole', selectedRole);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedRole');
        }
        
        Swal.fire({
          title: 'Login Successful!',
          text: `Welcome back, ${data.fullName}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Navigate based on role
        setTimeout(() => {
          switch(data.role) {
            case 'super_admin':
              navigate('/portal/super-admin');
              break;
            case 'academic_admin':
              navigate('/portal/academic-admin');
              break;
            case 'discipline_admin':
              navigate('/portal/discipline-admin');
              break;
            case 'accounts_admin':
              navigate('/portal/accounts-admin');
              break;
            case 'teacher':
              navigate('/portal/teacher');
              break;
            case 'student':
              navigate('/portal/student');
              break;
            case 'parent':
              navigate('/portal/parent');
              break;
            default:
              navigate('/portal/login');
          }
        }, 1500);
      } else {
        Swal.fire({
          title: 'Login Failed',
          text: data.message || 'Invalid email or password',
          icon: 'error',
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Login Failed',
        text: 'Network error. Please try again.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: emailAddress } = await Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'your@email.com',
      showCancelButton: true,
      confirmButtonText: 'Send Reset Link',
      confirmButtonColor: '#1e3c72'
    });
    
    if (emailAddress) {
      Swal.fire({
        title: 'Reset Link Sent!',
        text: `A password reset link has been sent to ${emailAddress}`,
        icon: 'success',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="portal-login-page">
        <div className="container">
          <div className="login-container">
            <div className="login-header">
              <div className="login-logo">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h1>Portal Login</h1>
              <p>Access your personalized dashboard</p>
            </div>
            
            <div className="role-selector">
              <button 
                className={`role-btn ${selectedRole === 'super_admin' ? 'active' : ''}`}
                onClick={() => setSelectedRole('super_admin')}
              >
                <i className="fas fa-crown"></i>
                <span>Super Admin</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'academic_admin' ? 'active' : ''}`}
                onClick={() => setSelectedRole('academic_admin')}
              >
                <i className="fas fa-chalkboard-user"></i>
                <span>Academic Admin</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'discipline_admin' ? 'active' : ''}`}
                onClick={() => setSelectedRole('discipline_admin')}
              >
                <i className="fas fa-gavel"></i>
                <span>Discipline Admin</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'accounts_admin' ? 'active' : ''}`}
                onClick={() => setSelectedRole('accounts_admin')}
              >
                <i className="fas fa-chart-line"></i>
                <span>Accounts Admin</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'teacher' ? 'active' : ''}`}
                onClick={() => setSelectedRole('teacher')}
              >
                <i className="fas fa-chalkboard-user"></i>
                <span>Teacher</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'student' ? 'active' : ''}`}
                onClick={() => setSelectedRole('student')}
              >
                <i className="fas fa-user-graduate"></i>
                <span>Student</span>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'parent' ? 'active' : ''}`}
                onClick={() => setSelectedRole('parent')}
              >
                <i className="fas fa-users"></i>
                <span>Parent</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <i className="fas fa-lock"></i>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              
              <div className="form-options">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-password" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </>
                )}
              </button>
            </form>

<div className="demo-info">
  <p><i className="fas fa-info-circle"></i> Default Admin Credentials:</p>
  <div className="demo-creds">
    <div className="demo-cred">
      <span className="role-badge super-admin">Super Admin</span>
      <code>admin@essa.rw / admin123</code>
    </div>
  </div>
  <p className="note">⚠️ Note: This is the only default account. All other users (Academic Admin, Discipline Admin, Accounts Admin, Teachers, Students, Parents) must be created by the Super Admin.</p>
</div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PortalLogin;