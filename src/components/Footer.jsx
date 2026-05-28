import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoWhite from '../assets/logo-white.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Add your newsletter subscription logic here
      setNewsletterStatus('Subscribed successfully!');
      setEmail('');
      setTimeout(() => setNewsletterStatus(''), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-waves">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#1a1a2e" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>
      
      <div className="container">
        <div className="footer-grid">
          {/* About Section */}
          <div className="footer-section about-section">
            <div className="footer-logo">
              <img src={logoWhite} alt="ESSA Logo" className="logo-img" />
              <h3>ESSA <span>Nyarugunga</span></h3>
            </div>
            <p className="footer-description">
              École Secondaire Des Science et Administrative (ESSA) NYARUGUNGA - Committed to excellence in education, character formation, and holistic development.
            </p>
            <div className="footer-badges">
              <span className="badge">
                <i className="fas fa-graduation-cap"></i> Ministry of Education
              </span>
              <span className="badge">
                <i className="fas fa-certificate"></i> RTB Accredited
              </span>
            </div>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4><i className="fas fa-link"></i> Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/"><i className="fas fa-angle-right"></i> Home</Link></li>
              <li><Link to="/about"><i className="fas fa-angle-right"></i> About Us</Link></li>
              <li><Link to="/academics"><i className="fas fa-angle-right"></i> Academics</Link></li>
              <li><Link to="/admissions"><i className="fas fa-angle-right"></i> Admissions</Link></li>
              <li><Link to="/news"><i className="fas fa-angle-right"></i> News & Events</Link></li>
              <li><Link to="/gallery"><i className="fas fa-angle-right"></i> Gallery</Link></li>
              <li><Link to="/contact"><i className="fas fa-angle-right"></i> Contact</Link></li>
              <li><Link to="/faq"><i className="fas fa-angle-right"></i> FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4><i className="fas fa-address-card"></i> Contact Info</h4>
            <ul className="contact-info">
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <strong>Address</strong>
                  <a href="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.477860813629!2d30.109888!3d-1.977408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca76c8d5b5b5b%3A0x8b5b5b5b5b5b5b5b!2sNyarugunga%2C%20Kigali!5e0!3m2!1sen!2srw!4v1700000000000!5m2!1sen!2srw" target="_blank" rel="noopener noreferrer">
                    Nyarugunga Sector, Kicukiro District, Kigali, Rwanda
                  </a>
                </div>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <div>
                  <strong>Email Us</strong>
                  <a href="mailto:info@essanyarugunga.rw">info@essanyarugunga.rw</a>
                </div>
              </li>
              <li>
                <i className="fas fa-phone-alt"></i>
                <div>
                  <strong>Call Us</strong>
                  <a href="tel:+250737692152">+250 737 692 152</a>
                </div>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <div>
                  <strong>Working Hours</strong>
                  <span>Mon - Fri: 8:00 AM - 5:00 PM</span>
                </div>
              </li>
              <li>
                <i className="fas fa-globe"></i>
                <div>
                  <strong>Website</strong>
                  <a href="https://www.essanyarugunga.rw" target="_blank" rel="noopener noreferrer">www.essanyarugunga.rw</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter & Emergency */}
          <div className="footer-section">
            <h4><i className="fas fa-newspaper"></i> Newsletter</h4>
            <p className="newsletter-text">Subscribe to get updates on events, results, and news directly to your inbox.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              {newsletterStatus && <p className="newsletter-status">{newsletterStatus}</p>}
            </form>
            
            <div className="emergency-contact">
              <div className="emergency-header">
                <i className="fas fa-shield-alt"></i>
                <h5>Emergency Contact</h5>
              </div>
              <p className="emergency-phone">
                <i className="fas fa-phone-volume"></i> +250 737 692 152
              </p>
              <p className="emergency-note">Available 24/7 for urgent matters</p>
            </div>

            <div className="app-download">
              <p>Download Our App</p>
              <div className="app-buttons">
                <a href="#" className="app-btn">
                  <i className="fab fa-google-play"></i> Google Play
                </a>
                <a href="#" className="app-btn">
                  <i className="fab fa-apple"></i> App Store
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="copyright">
            <p>
              &copy; {new Date().getFullYear()} ESSA Nyarugunga School. 
              <span className="separator">|</span> 
              All rights reserved. 
              <span className="separator">|</span>
              Developed with <i className="fas fa-heart"></i> by 
              <a href="http://wa.me/250737692152" target="_blank" rel="noopener noreferrer"> Mukeshiamana Kevin</a>
            </p>
          </div>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-use">Terms of Use</Link>
            <Link to="/sitemap">Sitemap</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
          color: #ffffff;
          position: relative;
          margin-top: 4rem;
        }

        .footer-waves {
          position: absolute;
          top: -100px;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }

        .footer-waves svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 100px;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 2rem 1.5rem;
          position: relative;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2.5rem;
          margin-bottom: 3rem;
        }

        .footer-section {
          animation: fadeInUp 0.6s ease-out;
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

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .logo-img {
          width: 50px;
          height: 50px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .footer-logo h3 {
          font-size: 1.5rem;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #a8a8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-logo h3 span {
          font-weight: 300;
        }

        .footer-description {
          color: #b8b8d0;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .footer-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
        }

        .social-icon:hover {
          background: #4a90e2;
          transform: translateY(-3px);
        }

        .footer-section h4 {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 0.75rem;
        }

        .footer-section h4:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, #4a90e2, #a8a8ff);
        }

        .footer-links, .contact-info {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li, .contact-info li {
          margin-bottom: 0.75rem;
        }

        .footer-links a, .contact-info a {
          color: #b8b8d0;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-links a:hover, .contact-info a:hover {
          color: #4a90e2;
          transform: translateX(5px);
        }

        .contact-info li {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .contact-info li i {
          color: #4a90e2;
          font-size: 1.1rem;
          margin-top: 0.2rem;
        }

        .contact-info li div {
          flex: 1;
        }

        .contact-info li strong {
          display: block;
          font-size: 0.8rem;
          color: #a8a8ff;
          margin-bottom: 0.2rem;
        }

        .contact-info li span {
          color: #b8b8d0;
          font-size: 0.85rem;
        }

        .newsletter-text {
          color: #b8b8d0;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .input-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .input-group input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: white;
          outline: none;
        }

        .input-group input:focus {
          border-color: #4a90e2;
        }

        .input-group button {
          padding: 0.75rem 1rem;
          background: #4a90e2;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .input-group button:hover {
          background: #357abd;
          transform: scale(1.05);
        }

        .newsletter-status {
          color: #4ade80;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        .emergency-contact {
          background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(168, 168, 255, 0.1));
          border-radius: 12px;
          padding: 1rem;
          margin: 1.5rem 0;
          border: 1px solid rgba(74, 144, 226, 0.3);
        }

        .emergency-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .emergency-header i {
          color: #ff4757;
          font-size: 1.2rem;
        }

        .emergency-header h5 {
          margin: 0;
          font-size: 0.9rem;
        }

        .emergency-phone {
          font-size: 1.1rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #ff4757;
        }

        .emergency-note {
          font-size: 0.7rem;
          color: #b8b8d0;
          margin: 0;
        }

        .app-download {
          margin-top: 1rem;
        }

        .app-download p {
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .app-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .app-btn {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 0.75rem;
          transition: all 0.3s ease;
        }

        .app-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .copyright p {
          margin: 0;
          font-size: 0.85rem;
          color: #b8b8d0;
        }

        .copyright i {
          color: #ff4757;
        }

        .copyright a {
          color: #4a90e2;
          text-decoration: none;
        }

        .separator {
          margin: 0 0.5rem;
        }

        .footer-bottom-links {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .footer-bottom-links a {
          color: #b8b8d0;
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }

        .footer-bottom-links a:hover {
          color: #4a90e2;
        }

        @media (max-width: 768px) {
          .container {
            padding: 2rem 1rem 1rem;
          }
          
          .footer-grid {
            gap: 2rem;
          }
          
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          
          .footer-bottom-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;