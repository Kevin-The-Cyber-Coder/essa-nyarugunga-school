import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Import background image
import campusBg from '../assets/campus.png';

const PortalLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      Swal.fire({
        title: 'Missing Credentials',
        text: 'Please enter both email and password.',
        icon: 'warning',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        Swal.fire({
          title: 'Login Successful!',
          text: `Welcome back, ${data.fullName}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
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
        Swal.fire({
          title: 'Login Failed',
          text: data.message || 'Invalid email or password',
          icon: 'error',
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Connection Error',
        text: 'Unable to connect to server',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="portal-login-container">
      {/* LEFT SIDE - BRAND SECTION WITH BACKGROUND IMAGE */}
      <div className="portal-login-left" style={{ backgroundImage: `url(${campusBg})` }}>
        <div className="overlay"></div>
        <div className="brand-section">
          <div className="school-badge">
            <i className="fas fa-graduation-cap"></i>
            <h1>ESSA Nyarugunga</h1>
          </div>
          <p className="tagline">École Secondaire des Sciences et Administrative</p>
          <div className="divider"></div>
          <div className="quote">
            <i className="fas fa-quote-left"></i>
            <p>Shaping Futures, Building Leaders</p>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-number">40+</span>
              <span className="stat-label">Teachers</span>
            </div>
            <div className="stat">
              <span className="stat-number">20+</span>
              <span className="stat-label">Years</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN SECTION */}
      <div className="portal-login-right">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to access your portal dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            
            <div className="options-row">
              <label className="checkbox">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                Swal.fire({
                  title: 'Reset Password',
                  text: 'Contact your administrator to reset your password.',
                  icon: 'info',
                  confirmButtonColor: '#1e3c72'
                });
              }}>Forgot Password?</a>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <span>Login</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p><i className="fas fa-shield-alt"></i> Secure Portal Access</p>
            <p className="copyright">© {new Date().getFullYear()} ESSA Nyarugunga School</p>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .portal-login-container {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* LEFT SIDE - BRAND SECTION WITH BACKGROUND IMAGE */
        .portal-login-left {
          flex: 1;
          position: relative;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(26, 58, 92, 0.92) 0%, rgba(13, 43, 66, 0.88) 100%);
          z-index: 1;
        }

        .brand-section {
          text-align: center;
          color: white;
          position: relative;
          z-index: 2;
          max-width: 400px;
        }

        .school-badge {
          margin-bottom: 1.5rem;
        }

        .school-badge i {
          font-size: 3.5rem;
          color: #ffc107;
          margin-bottom: 0.5rem;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .school-badge h1 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .divider {
          width: 60px;
          height: 3px;
          background: #ffc107;
          margin: 0 auto 2rem;
        }

        .quote i {
          font-size: 1.5rem;
          color: #ffc107;
          opacity: 0.6;
          margin-bottom: 0.5rem;
          display: block;
        }

        .quote p {
          font-size: 1rem;
          font-style: italic;
          font-weight: 300;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 1.3rem;
          font-weight: 700;
          color: #ffc107;
        }

        .stat-label {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        /* RIGHT SIDE - LOGIN SECTION */
        .portal-login-right {
          flex: 1;
          background: #f8f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-box {
          max-width: 420px;
          width: 100%;
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          animation: fadeInUp 0.5s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          font-size: 1.8rem;
          color: #1a3a5c;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: #6c757d;
          font-size: 0.9rem;
        }

        /* Input Fields */
        .input-field {
          position: relative;
          margin-bottom: 1.2rem;
        }

        .input-field i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #adb5bd;
          font-size: 1rem;
          transition: color 0.3s;
          z-index: 1;
        }

        .input-field input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          border: 1.5px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.95rem;
          transition: all 0.3s;
          background: #f8f9fc;
        }

        .input-field input:focus {
          outline: none;
          border-color: #ffc107;
          background: white;
          box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
        }

        .input-field input:focus + i {
          color: #ffc107;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #adb5bd;
          font-size: 1rem;
          transition: color 0.3s;
        }

        .password-toggle:hover {
          color: #1a3a5c;
        }

        /* Options Row */
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.8rem;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #ffc107;
        }

        .checkbox span {
          font-size: 0.85rem;
          color: #495057;
        }

        .options-row a {
          font-size: 0.85rem;
          color: #ffc107;
          text-decoration: none;
          transition: color 0.3s;
        }

        .options-row a:hover {
          text-decoration: underline;
        }

        /* Login Button */
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-bottom: 1.5rem;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(26, 58, 92, 0.3);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Footer */
        .login-footer {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .login-footer p {
          font-size: 0.75rem;
          color: #6c757d;
        }

        .login-footer i {
          margin-right: 6px;
        }

        .copyright {
          margin-top: 0.5rem;
          font-size: 0.7rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .portal-login-container {
            flex-direction: column;
          }
          
          .portal-login-left {
            min-height: 40vh;
            padding: 2rem 1.5rem;
          }
          
          .school-badge i {
            font-size: 2.5rem;
          }
          
          .school-badge h1 {
            font-size: 1.5rem;
          }
          
          .tagline {
            font-size: 0.8rem;
          }
          
          .quote p {
            font-size: 0.9rem;
          }
          
          .stats {
            gap: 1.5rem;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
          }
          
          .stat-number {
            font-size: 1.1rem;
          }
          
          .login-box {
            padding: 1.8rem;
          }
          
          .login-header h2 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .portal-login-left {
            min-height: 35vh;
          }
          
          .stats {
            gap: 1rem;
          }
          
          .stat-number {
            font-size: 1rem;
          }
          
          .stat-label {
            font-size: 0.6rem;
          }
          
          .login-box {
            padding: 1.5rem;
          }
          
          .options-row {
            flex-direction: column;
            gap: 0.8rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default PortalLogin;