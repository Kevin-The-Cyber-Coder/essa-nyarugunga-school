import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
        confirmButtonColor: '#1a3a5c',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
          text:`You Can now access Your Portal`,
          text: `Welcome back, ${data.fullName}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          const dashboards = {
            super_admin: '/portal/super-admin',
            academic_admin: '/portal/academic-admin',
            discipline_admin: '/portal/discipline-admin',
            accounts_admin: '/portal/accounts-admin',
            teacher: '/portal/teacher',
            student: '/portal/student',
            parent: '/portal/parent',
          };
          const redirectPath = dashboards[data.role] || '/portal/login';
          navigate(redirectPath);
        }, 1500);
      } else {
        Swal.fire({
          title: 'Login Failed',
          text: data.message || 'Invalid email or password',
          icon: 'error',
          confirmButtonColor: '#1a3a5c',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        title: 'Connection Error',
        text: 'Please check your internet connection.',
        icon: 'error',
        confirmButtonColor: '#1a3a5c',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Reset Password',
      text: 'Contact your administrator to reset your password.',
      icon: 'info',
      confirmButtonColor: '#1a3a5c',
    });
  };

  return (
    <div className="portal-login-container">
      {/* LEFT — brand panel */}
      <div
        className="portal-login-left"
        style={{ backgroundImage: `url(${campusBg})` }}
      >
        <div className="overlay" />
        <div className="brand-section">
          <div className="school-badge">
            <i className="fas fa-graduation-cap" aria-hidden="true" />
            <h1>ESSA Nyarugunga</h1>
          </div>
          <p className="tagline">
            École Secondaire des Sciences et Administrative
          </p>
          <div className="brand-divider" />
          <div className="quote">
            <i className="fas fa-quote-left" aria-hidden="true" />
            <p>Shaping Futures, Building Leaders</p>
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="portal-login-right">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to access your portal dashboard</p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="input-field">
              <i className="fas fa-envelope" aria-hidden="true" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="input-field">
              <i className="fas fa-lock" aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Options row */}
            <div className="options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={handleForgotPassword}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <i className="fas fa-spinner fa-spin" aria-hidden="true" />
              ) : (
                <>
                  <span>Login</span>
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              <i className="fas fa-shield-alt" aria-hidden="true" />
              Secure Portal Access
            </p>
            <p className="copyright">
              &copy; {new Date().getFullYear()} ESSA Nyarugunga School
            </p>
          </div>
        </div>
      </div>

      <style>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .portal-login-container {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
            Roboto, sans-serif;
        }

        /* ── LEFT PANEL ── */
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
          inset: 0;
            background: linear-gradient(
  135deg,
  hsla(220, 60%, 18%, 0.80) 0%,
  hsla(45, 90%, 70%, 0.45) 100%
);
          z-index: 1;
        }

        .brand-section {
          text-align: center;
          color: #fff;
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
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }

        .school-badge h1 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .brand-divider {
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

        /* ── RIGHT PANEL ── */
        .portal-login-right {
          flex: 1;
          background: #f8f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-box {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          animation: fadeInUp 0.45s ease both;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          font-size: 1.75rem;
          color: #1a3a5c;
          margin-bottom: 0.4rem;
          font-weight: 700;
        }

        .login-header p {
          color: #6c757d;
          font-size: 0.875rem;
        }

        /* ── INPUT FIELDS ── */
        .input-field {
          position: relative;
          margin-bottom: 1.2rem;
        }

        /* Icon sits before the input — use :focus-within on the wrapper */
        .input-field > i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #adb5bd;
          font-size: 1rem;
          pointer-events: none;
          transition: color 0.25s ease;
          z-index: 1;
        }

        .input-field:hover > i {
          color: #1a3a5c;
        }

        .input-field:focus-within > i {
          color: #ffc107;
        }

        .input-field input {
          width: 100%;
          padding: 13px 46px 13px 46px;
          border: 1.5px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.925rem;
          background: #f8f9fc;
          color: #212529;
          transition: border-color 0.25s ease, background 0.25s ease,
            box-shadow 0.25s ease;
        }

        /* Placeholder — no transform (browsers ignore it on ::placeholder) */
        .input-field input::placeholder {
          color: #adb5bd;
          opacity: 1;
          transition: color 0.25s ease, opacity 0.25s ease;
        }

        .input-field input:hover::placeholder {
          color: #1a3a5c;
        }

        .input-field input:focus::placeholder {
          color: #b8930a;
          opacity: 0.75;
        }

        .input-field input:hover {
          border-color: #ffc107;
          background: #fff;
        }

        .input-field input:focus {
          outline: none;
          border-color: #ffc107;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.15);
        }

        /* Password toggle — sits after the input, no conflict with icon */
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #adb5bd;
          font-size: 1rem;
          padding: 4px;
          line-height: 1;
          transition: color 0.25s ease;
        }

        .password-toggle:hover {
          color: #1a3a5c;
        }

        /* ── OPTIONS ROW ── */
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type='checkbox'] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #ffc107;
          flex-shrink: 0;
        }

        .checkbox-label span {
          font-size: 0.85rem;
          color: #495057;
        }

        .options-row a {
          font-size: 0.85rem;
          color: #ffc107;
          text-decoration: none;
          transition: text-decoration 0.2s;
        }

        .options-row a:hover {
          text-decoration: underline;
        }

        /* ── LOGIN BUTTON ── */
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1a3a5c 0%, #2c5f8a 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          margin-bottom: 1.5rem;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(26, 58, 92, 0.3);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .login-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* ── FOOTER ── */
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
          margin-right: 5px;
        }

        .copyright {
          margin-top: 0.4rem;
          font-size: 0.7rem;
        }

        /* ── RESPONSIVE ── */
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
            font-size: 0.875rem;
          }

          .login-box {
            padding: 1.75rem;
          }

          .login-header h2 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .portal-login-left {
            min-height: 35vh;
          }

          .login-box {
            padding: 1.5rem;
          }

          .options-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default PortalLogin;