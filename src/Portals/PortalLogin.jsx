import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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
        
        Swal.fire({ title: 'Login Successful!', text: `Welcome ${data.fullName}!`, icon: 'success', timer: 1500, showConfirmButton: false });
        
        setTimeout(() => {
          const dashboards = {
            super_admin: '/portal/super-admin',
            academic_admin: '/portal/academic-admin',
            teacher: '/portal/teacher',
            student: '/portal/student',
            parent: '/portal/parent'
          };
          navigate(dashboards[data.role] || '/portal/login');
        }, 1500);
      } else {
        Swal.fire({ title: 'Login Failed', text: data.message, icon: 'error', confirmButtonColor: '#1e3c72' });
      }
    } catch (error) {
      Swal.fire({ title: 'Login Failed', text: 'Network error', icon: 'error', confirmButtonColor: '#1e3c72' });
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'super_admin', label: 'Super Admin', icon: 'fas fa-crown' },
    { id: 'academic_admin', label: 'Academic Admin', icon: 'fas fa-chalkboard-user' },
    { id: 'teacher', label: 'Teacher', icon: 'fas fa-chalkboard-user' },
    { id: 'student', label: 'Student', icon: 'fas fa-user-graduate' },
    { id: 'parent', label: 'Parent', icon: 'fas fa-users' }
  ];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <i className="fas fa-graduation-cap"></i>
          <h1>ESSA Nyarugunga</h1>
          <p>Portal Login</p>
        </div>
        
        <div className="role-selector">
          {roles.map(role => (
            <button key={role.id} className={`role-btn ${selectedRole === role.id ? 'active' : ''}`} onClick={() => setSelectedRole(role.id)}>
              <i className={role.icon}></i>
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <i className="fas fa-envelope"></i>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <i className="fas fa-lock"></i>
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          
          <label className="remember-me">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span>Remember me</span>
          </label>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Login</>}
          </button>
        </form>

        <div className="demo-info">
          <p><i className="fas fa-info-circle"></i> Default Credentials:</p>
          <code>admin@essa.rw / admin123</code>
          <small>(Super Admin)</small>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .login-container {
          max-width: 500px;
          width: 100%;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header i {
          font-size: 3rem;
          color: #1a3a5c;
          margin-bottom: 10px;
        }
        .login-header h1 { color: #1a3a5c; margin-bottom: 5px; }
        .login-header p { color: #666; }
        .role-selector { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 30px; }
        .role-btn { padding: 10px; background: #f0f4f8; border: 2px solid #e0e0e0; border-radius: 10px; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .role-btn.active { background: #1a3a5c; border-color: #1a3a5c; color: white; }
        .role-btn i { font-size: 1.2rem; }
        .role-btn span { font-size: 0.7rem; }
        .input-group { position: relative; margin-bottom: 20px; }
        .input-group i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #999; }
        .input-group input { width: 100%; padding: 12px 15px 12px 45px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; }
        .toggle-password { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #999; }
        .remember-me { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; cursor: pointer; }
        .login-btn { width: 100%; padding: 12px; background: #1a3a5c; color: white; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
        .login-btn:hover { background: #2c5f8a; }
        .demo-info { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; text-align: center; font-size: 0.85rem; }
        .demo-info code { background: white; padding: 2px 8px; border-radius: 4px; display: inline-block; margin: 5px 0; }
        @media (max-width: 600px) { .role-selector { grid-template-columns: repeat(3, 1fr); } .login-container { padding: 25px; } }
      `}</style>
    </div>
  );
};

export default PortalLogin;