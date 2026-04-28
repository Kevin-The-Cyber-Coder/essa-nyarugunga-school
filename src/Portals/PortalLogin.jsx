import React, { useState } from 'react';
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

  // Demo credentials for different roles
  const demoCredentials = {
    super_admin: { 
      email: 'admin@essa.rw', 
      password: 'admin123', 
      name: 'Super Administrator', 
      dashboard: '/portal/super-admin', 
      role: 'super_admin' 
    },
    academic_admin: { 
      email: 'academic@essa.rw', 
      password: 'academic123', 
      name: 'Academic Admin', 
      dashboard: '/portal/academic-admin', 
      role: 'academic_admin' 
    },
    discipline_admin: { 
      email: 'discipline@essa.rw', 
      password: 'discipline123', 
      name: 'Discipline Admin', 
      dashboard: '/portal/discipline-admin', 
      role: 'discipline_admin' 
    },
    accounts_admin: { 
      email: 'accounts@essa.rw', 
      password: 'accounts123', 
      name: 'Accounts Admin', 
      dashboard: '/portal/accounts-admin', 
      role: 'accounts_admin' 
    },
    teacher: { 
      email: 'teacher@essa.rw', 
      password: 'teacher123', 
      name: 'Teacher', 
      dashboard: '/portal/teacher', 
      role: 'teacher' 
    },
    student: { 
      email: 'student@essa.rw', 
      password: 'student123', 
      name: 'Student', 
      dashboard: '/portal/student', 
      role: 'student' 
    },
    parent: { 
      email: 'parent@essa.rw', 
      password: 'parent123', 
      name: 'Parent', 
      dashboard: '/portal/parent', 
      role: 'parent' 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For demo purposes, use demo credentials
      const creds = demoCredentials[selectedRole];
      
      // This is for demo - in production, you'd call the API
      if (email === creds.email && password === creds.password) {
        // Store user data in localStorage
        localStorage.setItem('portalToken', 'demo-token-' + Date.now());
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('userName', creds.name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', 'demo-user-id');
        localStorage.setItem('userData', JSON.stringify(creds));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedRole', selectedRole);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedRole');
        }
        
        Swal.fire({
          title: 'Login Successful!',
          text: `Welcome back, ${creds.name}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        setTimeout(() => {
          navigate(creds.dashboard);
        }, 1500);
      } else {
        Swal.fire({
          title: 'Login Failed',
          text: 'Invalid email or password. Please check your credentials.',
          icon: 'error',
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Login Failed',
        text: error.message || 'Invalid email or password',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'your@email.com',
      showCancelButton: true,
      confirmButtonText: 'Send Reset Link',
      confirmButtonColor: '#1e3c72'
    });
    
    if (email) {
      Swal.fire({
        title: 'Reset Link Sent!',
        text: `A password reset link has been sent to ${email}`,
        icon: 'success',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  // Load remembered credentials
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole');
    if (rememberedEmail && rememberedRole) {
      setEmail(rememberedEmail);
      setSelectedRole(rememberedRole);
      setRememberMe(true);
    }
  }, []);

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
              <p><i className="fas fa-info-circle"></i> Demo Credentials:</p>
              <div className="demo-creds">
                <div className="demo-cred">
                  <span className="role-badge super-admin">Super Admin</span>
                  <code>admin@essa.rw / admin123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge academic">Academic Admin</span>
                  <code>academic@essa.rw / academic123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge discipline">Discipline Admin</span>
                  <code>discipline@essa.rw / discipline123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge accounts">Accounts Admin</span>
                  <code>accounts@essa.rw / accounts123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge teacher">Teacher</span>
                  <code>teacher@essa.rw / teacher123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge student">Student</span>
                  <code>student@essa.rw / student123</code>
                </div>
                <div className="demo-cred">
                  <span className="role-badge parent">Parent</span>
                  <code>parent@essa.rw / parent123</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PortalLogin;