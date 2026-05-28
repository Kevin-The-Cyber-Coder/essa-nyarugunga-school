import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    // Track mouse position for parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Auto-redirect countdown
    const timer = setInterval(() => {
      if (!isStopped) {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    // Confetti effect on load
    setTimeout(() => {
      createConfetti();
    }, 500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(timer);
    };
  }, [navigate, isStopped]);

  const createConfetti = () => {
    const colors = ['#FFD700', '#1e3a8a', '#ffffff', '#ffed4e', '#4a90e2'];
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 12 + 5 + 'px';
        confetti.style.height = Math.random() * 12 + 5 + 'px';
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 4000);
      }, i * 40);
    }
  };

  const handleReportIssue = () => {
    Swal.fire({
      title: 'Report Broken Link',
      html: `
        <input type="text" id="current-url" class="swal2-input" value="${window.location.href}" readonly>
        <input type="text" id="page-title" class="swal2-input" placeholder="What were you looking for?">
        <textarea id="error-description" class="swal2-textarea" placeholder="Please describe what you were trying to access..."></textarea>
        <select id="error-type" class="swal2-select">
          <option value="broken">Broken Link</option>
          <option value="typo">Typo in URL</option>
          <option value="moved">Page Moved</option>
          <option value="other">Other</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Submit Report',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const pageTitle = document.getElementById('page-title').value;
        const description = document.getElementById('error-description').value;
        const errorType = document.getElementById('error-type').value;
        
        if (!description) {
          Swal.showValidationMessage('Please describe the issue');
          return false;
        }
        
        return { url: window.location.href, pageTitle, description, errorType };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Report Submitted!',
          text: 'Thank you for helping us improve our website. Our team will investigate this issue.',
          icon: 'success',
          confirmButtonColor: '#FFD700',
          background: '#ffffff',
          timer: 3000,
          showConfirmButton: false
        });
      }
    });
  };

  const handleGoBack = () => {
    Swal.fire({
      title: 'Go Back?',
      text: 'Would you like to return to the previous page?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Yes, Go Back',
      cancelButtonText: 'Stay Here'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(-1);
      }
    });
  };

  const handleSearch = () => {
    Swal.fire({
      title: 'Search Website',
      html: `
        <input type="text" id="search-query" class="swal2-input" placeholder="What are you looking for?">
        <select id="search-category" class="swal2-select">
          <option value="all">All Categories</option>
          <option value="academics">Academics</option>
          <option value="admissions">Admissions</option>
          <option value="news">News & Events</option>
          <option value="contact">Contact Info</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Search',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const query = document.getElementById('search-query').value;
        if (!query) {
          Swal.showValidationMessage('Please enter a search term');
          return false;
        }
        return query;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Searching...',
          text: `Looking for "${result.value}"`,
          icon: 'info',
          timer: 2000,
          showConfirmButton: false
        });
        // You can implement actual search functionality here
        setTimeout(() => {
          navigate(`/search?q=${encodeURIComponent(result.value)}`);
        }, 2000);
      }
    });
  };

  const handleStopRedirect = () => {
    setIsStopped(true);
    Swal.fire({
      title: 'Redirect Stopped!',
      text: 'Auto-redirection has been cancelled. You can navigate manually using the buttons below.',
      icon: 'info',
      confirmButtonColor: '#FFD700',
      background: '#ffffff',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const handleResumeRedirect = () => {
    setIsStopped(false);
    Swal.fire({
      title: 'Redirect Resumed!',
      text: 'Auto-redirection has been resumed. You will be redirected to homepage shortly.',
      icon: 'success',
      confirmButtonColor: '#FFD700',
      background: '#ffffff',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Calculate progress percentage
  const progressPercentage = ((30 - countdown) / 30) * 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="not-found-page">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
        <div className="bg-shape shape-5"></div>
      </div>

      <div className="container">
        <div className="error-content" style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}>
          {/* 404 Animation */}
          <div className="error-animation">
            <div className="floating-numbers">
              <span className="number-4">4</span>
              <span className="number-0">0</span>
              <span className="number-4-second">4</span>
            </div>
            <div className="error-circle">
              <div className="circle-ring"></div>
              <div className="circle-ring-2"></div>
              <div className="circle-ring-3"></div>
            </div>
            <div className="error-icons">
              <i className="fas fa-search"></i>
              <i className="fas fa-question-circle"></i>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>

          {/* Error Message */}
          <div className="error-message">
            <h1>Oops! Page Not Found</h1>
            <div className="error-divider">
              <span></span>
              <i className="fas fa-frown-open"></i>
              <span></span>
            </div>
            <p>The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.</p>
            <div className="error-url">
              <i className="fas fa-link"></i>
              <code>{window.location.pathname}</code>
              <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                Swal.fire({
                  title: 'Copied!',
                  text: 'URL copied to clipboard',
                  icon: 'success',
                  timer: 1500,
                  showConfirmButton: false,
                  background: '#ffffff',
                  position: 'top-end',
                  toast: true
                });
              }} className="copy-url-btn">
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="countdown-timer">
            <div className="timer-circle">
              <svg className="progress-ring" width="100" height="100">
                <circle
                  className="progress-ring-circle-bg"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                  fill="transparent"
                  r={radius}
                  cx="50"
                  cy="50"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="#FFD700"
                  strokeWidth="4"
                  fill="transparent"
                  r={radius}
                  cx="50"
                  cy="50"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-dashoffset 1s linear'
                  }}
                />
              </svg>
              <div className="timer-text">
                <span className="countdown-number">{countdown}</span>
                <span className="countdown-label">seconds</span>
              </div>
            </div>
            {!isStopped ? (
              <>
                <p>You will be redirected to <Link to="/">homepage</Link> in <strong className="gold">{countdown} seconds</strong></p>
                <button onClick={handleStopRedirect} className="stop-redirect">
                  <i className="fas fa-times-circle"></i> Cancel Redirect
                </button>
              </>
            ) : (
              <>
                <p>Auto-redirection has been <strong className="gold">cancelled</strong></p>
                <button onClick={handleResumeRedirect} className="resume-redirect">
                  <i className="fas fa-play-circle"></i> Resume Redirect
                </button>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Redirecting in:</span>
              <span>{Math.floor((countdown / 30) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((30 - countdown) / 30) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <Link to="/" className="action-btn home-btn">
              <i className="fas fa-home"></i>
              <span>Back to Home</span>
            </Link>
            <button onClick={handleGoBack} className="action-btn back-btn">
              <i className="fas fa-arrow-left"></i>
              <span>Go Back</span>
            </button>
            <button onClick={handleSearch} className="action-btn search-btn">
              <i className="fas fa-search"></i>
              <span>Search Site</span>
            </button>
            <button onClick={handleReportIssue} className="action-btn report-btn">
              <i className="fas fa-flag"></i>
              <span>Report Issue</span>
            </button>
          </div>

          {/* Quick Links Grid */}
          <div className="quick-links-grid">
            <h3>
              <i className="fas fa-compass"></i>
              Where would you like to go?
            </h3>
            <div className="links-container">
              <Link to="/about" className="quick-link">
                <i className="fas fa-school"></i>
                <span>About Us</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/academics" className="quick-link">
                <i className="fas fa-graduation-cap"></i>
                <span>Academics</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/admissions" className="quick-link">
                <i className="fas fa-file-alt"></i>
                <span>Admissions</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/news" className="quick-link">
                <i className="fas fa-newspaper"></i>
                <span>News & Events</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/gallery" className="quick-link">
                <i className="fas fa-images"></i>
                <span>Gallery</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/contact" className="quick-link">
                <i className="fas fa-envelope"></i>
                <span>Contact Us</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/privacy-policy" className="quick-link">
                <i className="fas fa-shield-alt"></i>
                <span>Privacy Policy</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
              <Link to="/terms-of-use" className="quick-link">
                <i className="fas fa-file-contract"></i>
                <span>Terms of Use</span>
                <i className="fas fa-arrow-right link-arrow"></i>
              </Link>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="fun-fact">
            <i className="fas fa-lightbulb"></i>
            <div>
              <strong>Did you know?</strong>
              <p>The 404 error code was introduced to indicate that the requested page could not be found on the server. It's named after room 404 at CERN where the web was born! You'll be redirected to our homepage in {countdown} seconds.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="error-footer">
            <p>© {new Date().getFullYear()} ESSA Nyarugunga School | All rights reserved</p>
            <div className="footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-use">Terms of Use</Link>
              <Link to="/sitemap">Sitemap</Link>
              <Link to="/accessibility">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .not-found-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a2a 0%, #1a2a4a 50%, #0a1a3a 100%);
          position: relative;
          overflow-x: hidden;
          display: flex;
          align-items: center;
        }

        /* Animated Background Shapes */
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float 20s infinite ease-in-out;
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          background: #FFD700;
          top: -150px;
          left: -150px;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 500px;
          height: 500px;
          background: #1e3a8a;
          bottom: -250px;
          right: -250px;
          animation-delay: 5s;
        }

        .shape-3 {
          width: 200px;
          height: 200px;
          background: #ffffff;
          top: 50%;
          left: 10%;
          animation-delay: 10s;
        }

        .shape-4 {
          width: 400px;
          height: 400px;
          background: #FFD700;
          bottom: 10%;
          right: 5%;
          animation-delay: 15s;
        }

        .shape-5 {
          width: 250px;
          height: 250px;
          background: #4a90e2;
          top: 20%;
          right: 20%;
          animation-delay: 20s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        .error-content {
          transition: transform 0.3s ease-out;
        }

        /* Error Animation */
        .error-animation {
          position: relative;
          text-align: center;
          margin-bottom: 2rem;
        }

        .floating-numbers {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          font-size: 8rem;
          font-weight: bold;
          margin-bottom: 1rem;
          position: relative;
          z-index: 2;
        }

        .number-4, .number-0, .number-4-second {
          animation: floatNumber 2s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(255,215,0,0.5);
        }

        .number-4 {
          color: #FFD700;
          animation-delay: 0s;
        }

        .number-0 {
          color: #ffffff;
          animation-delay: 0.5s;
          font-size: 10rem;
        }

        .number-4-second {
          color: #4a90e2;
          animation-delay: 1s;
        }

        @keyframes floatNumber {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .error-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 250px;
          z-index: 1;
        }

        .circle-ring, .circle-ring-2, .circle-ring-3 {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(255,215,0,0.3);
          animation: pulse 3s ease-in-out infinite;
        }

        .circle-ring {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }

        .circle-ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          animation-delay: 1s;
        }

        .circle-ring-3 {
          width: 60%;
          height: 60%;
          top: 20%;
          left: 20%;
          animation-delay: 2s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
        }

        .error-icons {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2rem;
          font-size: 2rem;
          z-index: 3;
        }

        .error-icons i {
          animation: bounce 2s ease-in-out infinite;
          color: rgba(255,215,0,0.6);
        }

        .error-icons i:nth-child(1) {
          animation-delay: 0s;
        }
        .error-icons i:nth-child(2) {
          animation-delay: 0.5s;
        }
        .error-icons i:nth-child(3) {
          animation-delay: 1s;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Error Message */
        .error-message {
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-message h1 {
          color: #ffffff;
          font-size: 2.5rem;
          margin-bottom: 1rem;
          animation: fadeInUp 0.8s ease;
        }

        .error-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .error-divider span {
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #FFD700, transparent);
        }

        .error-divider i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .error-message p {
          color: #b8b8d0;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .error-url {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255,255,255,0.1);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-top: 1rem;
        }

        .error-url i {
          color: #FFD700;
        }

        .error-url code {
          color: #ffffff;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .copy-url-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: #FFD700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .copy-url-btn:hover {
          background: #FFD700;
          color: #1e3a8a;
          transform: scale(1.05);
        }

        /* Countdown Timer */
        .countdown-timer {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .timer-circle {
          position: relative;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .timer-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .countdown-number {
          display: block;
          font-size: 1.8rem;
          font-weight: bold;
          color: #FFD700;
        }

        .countdown-label {
          display: block;
          font-size: 0.7rem;
          color: #b8b8d0;
        }

        .countdown-timer p {
          color: #b8b8d0;
          margin: 1rem 0;
        }

        .countdown-timer .gold {
          color: #FFD700;
          font-size: 1.1rem;
        }

        .countdown-timer a {
          color: #FFD700;
          text-decoration: none;
          font-weight: bold;
        }

        .stop-redirect, .resume-redirect {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .resume-redirect {
          color: #48bb78;
        }

        .stop-redirect:hover, .resume-redirect:hover {
          transform: scale(1.05);
        }

        /* Progress Bar */
        .progress-bar-container {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .progress-bar-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          color: #b8b8d0;
          font-size: 0.85rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFD700, #ffed4e);
          border-radius: 10px;
          transition: width 1s linear;
          animation: shimmer 1s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .action-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .action-btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .home-btn {
          background: #FFD700;
          color: #1e3a8a;
        }

        .back-btn {
          background: #1e3a8a;
          color: white;
        }

        .search-btn {
          background: #4a90e2;
          color: white;
        }

        .report-btn {
          background: #ef4444;
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        /* Quick Links Grid */
        .quick-links-grid {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .quick-links-grid h3 {
          color: #ffffff;
          text-align: center;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .links-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .quick-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .quick-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: #FFD700;
          transition: width 0.3s ease;
        }

        .quick-link:hover::before {
          width: 100%;
        }

        .quick-link:hover {
          transform: translateX(10px);
          background: rgba(255,255,255,0.2);
        }

        .link-arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .quick-link:hover .link-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Fun Fact */
        .fun-fact {
          display: flex;
          gap: 1rem;
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(30,58,138,0.1));
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(255,215,0,0.3);
        }

        .fun-fact i {
          font-size: 2rem;
          color: #FFD700;
        }

        .fun-fact strong {
          color: #FFD700;
          display: block;
          margin-bottom: 0.5rem;
        }

        .fun-fact p {
          color: #b8b8d0;
          margin: 0;
        }

        /* Error Footer */
        .error-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .error-footer p {
          color: #b8b8d0;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: #b8b8d0;
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: #FFD700;
        }

        /* Confetti Animation */
        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti {
          position: fixed;
          top: -20px;
          pointer-events: none;
          z-index: 1000;
          animation: confettiFall linear forwards;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .floating-numbers {
            font-size: 4rem;
          }

          .number-0 {
            font-size: 5rem;
          }

          .error-message h1 {
            font-size: 1.8rem;
          }

          .action-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .action-btn {
            justify-content: center;
          }

          .links-container {
            grid-template-columns: 1fr;
          }

          .fun-fact {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;