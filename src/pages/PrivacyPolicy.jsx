import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const PrivacyPolicy = () => {
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    // Add animation to sections as they come into view
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.policy-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleContactClick = (type) => {
    Swal.fire({
      title: `${type} Support`,
      text: `How can we help you with your privacy concerns?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Send Email',
      cancelButtonText: 'Call Us',
      showCloseButton: true,
      background: '#ffffff',
      backdrop: `rgba(0,0,0,0.8)`,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        content: 'custom-swal-text'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = 'mailto:privacy@essanyarugunga.rw';
        Swal.fire({
          title: 'Email Client Opening',
          text: 'Your email client will open shortly.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff'
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Call Us',
          text: '+250 737 692 152',
          icon: 'info',
          confirmButtonColor: '#FFD700',
          background: '#ffffff'
        });
      }
    });
  };

  const handlePrint = () => {
    Swal.fire({
      title: 'Print Policy',
      text: 'Would you like to print the privacy policy?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Yes, Print',
      cancelButtonText: 'Cancel',
      background: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
        Swal.fire({
          title: 'Print Prepared!',
          text: 'Your print dialog should now open.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff'
        });
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    Swal.fire({
      title: 'Link Copied!',
      text: 'Privacy policy link copied to clipboard',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      position: 'top-end',
      toast: true
    });
  };

  return (
    <div className="privacy-policy-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-shield-alt"></i> Your Privacy Matters
          </div>
          <h1 className="hero-title">
            Privacy <span className="gold-text">Policy</span>
          </h1>
          <p className="hero-description">
            Learn how we protect, collect, and handle your personal information
          </p>
          <div className="hero-meta">
            <span><i className="fas fa-calendar-alt"></i> Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span><i className="fas fa-clock"></i> Version 2.0</span>
            <button onClick={handleCopyLink} className="copy-link-btn">
              <i className="fas fa-link"></i> Copy Link
            </button>
          </div>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      <div className="container">
        {/* Floating Action Buttons */}
        <div className="floating-actions">
          <button onClick={handlePrint} className="fab-print" title="Print Policy">
            <i className="fas fa-print"></i>
          </button>
          <button onClick={() => handleContactClick('Privacy')} className="fab-contact" title="Contact Support">
            <i className="fas fa-headset"></i>
          </button>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fab-top" title="Back to Top">
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>

        <div className="policy-grid">
          {/* Sidebar Navigation */}
          <aside className="policy-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <i className="fas fa-bars-staggered"></i>
                <h3>Contents</h3>
              </div>
              <nav className="sidebar-nav">
                <a href="#introduction" className="nav-link">
                  <i className="fas fa-flag-checkered"></i>
                  <span>Introduction</span>
                </a>
                <a href="#information" className="nav-link">
                  <i className="fas fa-database"></i>
                  <span>Information We Collect</span>
                </a>
                <a href="#usage" className="nav-link">
                  <i className="fas fa-chart-line"></i>
                  <span>How We Use Information</span>
                </a>
                <a href="#sharing" className="nav-link">
                  <i className="fas fa-share-alt"></i>
                  <span>Information Sharing</span>
                </a>
                <a href="#security" className="nav-link">
                  <i className="fas fa-lock"></i>
                  <span>Data Security</span>
                </a>
                <a href="#rights" className="nav-link">
                  <i className="fas fa-user-check"></i>
                  <span>Your Rights</span>
                </a>
                <a href="#cookies" className="nav-link">
                  <i className="fas fa-cookie-bite"></i>
                  <span>Cookies & Tracking</span>
                </a>
                <a href="#children" className="nav-link">
                  <i className="fas fa-child"></i>
                  <span>Children's Privacy</span>
                </a>
                <a href="#changes" className="nav-link">
                  <i className="fas fa-sync-alt"></i>
                  <span>Changes to Policy</span>
                </a>
                <a href="#contact" className="nav-link">
                  <i className="fas fa-envelope"></i>
                  <span>Contact Us</span>
                </a>
              </nav>
            </div>

            <div className="sidebar-card quick-contact">
              <div className="sidebar-header">
                <i className="fas fa-headset"></i>
                <h3>Quick Support</h3>
              </div>
              <p>Need immediate assistance? Our privacy team is here to help.</p>
              <button onClick={() => handleContactClick('Privacy')} className="support-btn">
                <i className="fas fa-comments"></i> Contact Support
              </button>
              <div className="support-hours">
                <i className="fas fa-clock"></i>
                <span>Available 24/7 for privacy concerns</span>
              </div>
            </div>

            <div className="sidebar-card trust-badge">
              <div className="trust-icons">
                <i className="fas fa-shield-heart"></i>
                <i className="fas fa-lock"></i>
                <i className="fas fa-check-double"></i>
              </div>
              <p>GDPR Compliant</p>
              <p>Data Protection Registered</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="policy-main">
            <section id="introduction" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-flag-checkered"></i>
              </div>
              <h2>Introduction</h2>
              <p>Welcome to <span className="gold-text">ESSA Nyarugunga School</span> — where excellence meets integrity. We are deeply committed to protecting your personal information and your right to privacy. This comprehensive Privacy Policy explains how we collect, use, disclose, and safeguard your information when you interact with our website and school services.</p>
              <div className="info-box blue-bg">
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Our Commitment</strong>
                  <p>We believe in transparency and accountability. Every piece of information you share with us is treated with the highest level of confidentiality and respect.</p>
                </div>
              </div>
            </section>

            <section id="information" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-database"></i>
              </div>
              <h2>Information We Collect</h2>
              <p>We collect various types of information to provide and improve our educational services:</p>
              
              <div className="info-cards">
                <div className="info-card">
                  <i className="fas fa-user-graduate"></i>
                  <h4>Student Information</h4>
                  <ul>
                    <li><i className="fas fa-check-circle"></i> Academic records & transcripts</li>
                    <li><i className="fas fa-check-circle"></i> Attendance & behavior reports</li>
                    <li><i className="fas fa-check-circle"></i> Medical information (with consent)</li>
                    <li><i className="fas fa-check-circle"></i> Learning progress & assessments</li>
                  </ul>
                </div>
                <div className="info-card">
                  <i className="fas fa-users"></i>
                  <h4>Parent/Guardian Data</h4>
                  <ul>
                    <li><i className="fas fa-check-circle"></i> Contact details & relationships</li>
                    <li><i className="fas fa-check-circle"></i> Emergency contact information</li>
                    <li><i className="fas fa-check-circle"></i> Communication preferences</li>
                    <li><i className="fas fa-check-circle"></i> Payment & fee records</li>
                  </ul>
                </div>
                <div className="info-card">
                  <i className="fas fa-laptop-code"></i>
                  <h4>Technical Data</h4>
                  <ul>
                    <li><i className="fas fa-check-circle"></i> IP addresses & device info</li>
                    <li><i className="fas fa-check-circle"></i> Browser type & settings</li>
                    <li><i className="fas fa-check-circle"></i> Usage patterns & preferences</li>
                    <li><i className="fas fa-check-circle"></i> Location data (approximate)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="usage" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h2>How We Use Your Information</h2>
              <div className="usage-grid">
                <div className="usage-item">
                  <i className="fas fa-graduation-cap"></i>
                  <h4>Educational Excellence</h4>
                  <p>Personalize learning experiences, track academic progress, and provide targeted support for student success.</p>
                </div>
                <div className="usage-item">
                  <i className="fas fa-comments"></i>
                  <h4>Effective Communication</h4>
                  <p>Send important updates, event notifications, and maintain strong parent-school partnerships.</p>
                </div>
                <div className="usage-item">
                  <i className="fas fa-shield-virus"></i>
                  <h4>Safety & Security</h4>
                  <p>Ensure campus safety, emergency response, and protect the well-being of our community.</p>
                </div>
                <div className="usage-item">
                  <i className="fas fa-chart-bar"></i>
                  <h4>Continuous Improvement</h4>
                  <p>Analyze trends, enhance services, and develop better educational programs.</p>
                </div>
              </div>
            </section>

            <section id="sharing" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-share-alt"></i>
              </div>
              <h2>Information Sharing</h2>
              <p>We value your trust and never sell your personal information. However, we may share data in these limited circumstances:</p>
              <div className="sharing-grid">
                <div className="sharing-card">
                  <i className="fas fa-university"></i>
                  <h4>Ministry of Education</h4>
                  <p>Required reporting for compliance and educational standards</p>
                </div>
                <div className="sharing-card">
                  <i className="fas fa-handshake"></i>
                  <h4>Trusted Partners</h4>
                  <p>Service providers bound by strict confidentiality agreements</p>
                </div>
                <div className="sharing-card">
                  <i className="fas fa-gavel"></i>
                  <h4>Legal Requirements</h4>
                  <p>When mandated by law or court orders</p>
                </div>
                <div className="sharing-card">
                  <i className="fas fa-ambulance"></i>
                  <h4>Emergency Situations</h4>
                  <p>For health, safety, or security emergencies</p>
                </div>
              </div>
            </section>

            <section id="security" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-lock"></i>
              </div>
              <h2>Data Security</h2>
              <p>We implement enterprise-grade security measures to protect your information:</p>
              <div className="security-features">
                <div className="security-item">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <h4>256-bit Encryption</h4>
                    <p>Military-grade encryption for all data transmission</p>
                  </div>
                </div>
                <div className="security-item">
                  <i className="fas fa-user-secret"></i>
                  <div>
                    <h4>Access Controls</h4>
                    <p>Role-based access with regular audits</p>
                  </div>
                </div>
                <div className="security-item">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <h4>24/7 Monitoring</h4>
                    <p>Real-time threat detection and response</p>
                  </div>
                </div>
                <div className="security-item">
                  <i className="fas fa-database"></i>
                  <div>
                    <h4>Secure Backups</h4>
                    <p>Regular encrypted backups with redundancy</p>
                  </div>
                </div>
              </div>
              <div className="info-box gold-bg">
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>ISO Certified Security</strong>
                  <p>Our security practices meet international standards for data protection.</p>
                </div>
              </div>
            </section>

            <section id="rights" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-user-check"></i>
              </div>
              <h2>Your Rights</h2>
              <p>You have comprehensive rights regarding your personal information:</p>
              <div className="rights-grid">
                <div className="right-card">
                  <i className="fas fa-eye"></i>
                  <h4>Right to Access</h4>
                  <p>Request a copy of your data anytime</p>
                </div>
                <div className="right-card">
                  <i className="fas fa-pen"></i>
                  <h4>Right to Rectify</h4>
                  <p>Correct inaccurate information</p>
                </div>
                <div className="right-card">
                  <i className="fas fa-trash"></i>
                  <h4>Right to Delete</h4>
                  <p>Request data deletion (subject to legal requirements)</p>
                </div>
                <div className="right-card">
                  <i className="fas fa-download"></i>
                  <h4>Data Portability</h4>
                  <p>Transfer your data to another service</p>
                </div>
                <div className="right-card">
                  <i className="fas fa-ban"></i>
                  <h4>Right to Object</h4>
                  <p>Opt-out of certain processing</p>
                </div>
                <div className="right-card">
                  <i className="fas fa-clock"></i>
                  <h4>Right to Restrict</h4>
                  <p>Limit how we use your data</p>
                </div>
              </div>
              <button onClick={() => handleContactClick('Data Rights')} className="exercise-rights-btn">
                <i className="fas fa-gavel"></i> Exercise Your Rights
              </button>
            </section>

            <section id="cookies" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-cookie-bite"></i>
              </div>
              <h2>Cookies & Tracking Technologies</h2>
              <p>We use cookies to enhance your browsing experience:</p>
              <div className="cookie-table">
                <div className="cookie-header">
                  <div>Cookie Type</div>
                  <div>Purpose</div>
                  <div>Duration</div>
                </div>
                <div className="cookie-row">
                  <div><i className="fas fa-cookie"></i> Essential</div>
                  <div>Required for basic site functionality</div>
                  <div>Session</div>
                </div>
                <div className="cookie-row">
                  <div><i className="fas fa-chart-simple"></i> Analytics</div>
                  <div>Understand how visitors use our site</div>
                  <div>2 Years</div>
                </div>
                <div className="cookie-row">
                  <div><i className="fas fa-user-check"></i> Functional</div>
                  <div>Remember your preferences</div>
                  <div>1 Year</div>
                </div>
                <div className="cookie-row">
                  <div><i className="fas fa-bullseye"></i> Marketing</div>
                  <div>Relevant content and offers</div>
                  <div>90 Days</div>
                </div>
              </div>
              <div className="cookie-controls">
                <button className="cookie-btn">Cookie Preferences</button>
                <button className="cookie-btn gold">Accept All</button>
              </div>
            </section>

            <section id="children" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-child"></i>
              </div>
              <h2>Children's Privacy</h2>
              <div className="children-banner">
                <i className="fas fa-shield-heart"></i>
                <div>
                  <h4>Protecting Young Learners</h4>
                  <p>We take special care to protect children's information. Parental consent is always obtained before collecting any data from minors. Parents have full access to review, modify, or delete their child's information at any time.</p>
                </div>
              </div>
              <div className="children-features">
                <div><i className="fas fa-check-circle"></i> Parental consent required for minors</div>
                <div><i className="fas fa-check-circle"></i> No direct marketing to children</div>
                <div><i className="fas fa-check-circle"></i> Educational purposes only</div>
                <div><i className="fas fa-check-circle"></i> Full parental access rights</div>
              </div>
            </section>

            <section id="changes" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-sync-alt"></i>
              </div>
              <h2>Changes to This Policy</h2>
              <p>We continuously improve our privacy practices. When we make significant changes, we will:</p>
              <div className="changes-timeline">
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="fas fa-envelope-open-text"></i>
                  </div>
                  <div>
                    <h4>Email Notification</h4>
                    <p>Direct notification to all registered users</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="fas fa-bell"></i>
                  </div>
                  <div>
                    <h4>Website Notice</h4>
                    <p>Prominent banner on our website</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="fas fa-calendar-week"></i>
                  </div>
                  <div>
                    <h4>30-Day Notice</h4>
                    <p>Advance notice before material changes</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="contact" className="policy-section">
              <div className="section-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h2>Contact Us</h2>
              <p>Our dedicated privacy team is here to assist you with any questions or concerns:</p>
              
              <div className="contact-grid">
                <div className="contact-card">
                  <i className="fas fa-map-marker-alt"></i>
                  <h4>Visit Us</h4>
                  <p>ESSA Nyarugunga School<br />Nyarugunga Sector<br />Kicukiro District, Kigali<br />Rwanda</p>
                  <button onClick={() => window.open('https://maps.google.com', '_blank')} className="contact-card-btn">
                    Get Directions <i className="fas fa-arrow-right"></i>
                  </button>
                </div>

                <div className="contact-card">
                  <i className="fas fa-envelope"></i>
                  <h4>Email Us</h4>
                  <p><strong>Privacy Matters:</strong><br /><a href="mailto:privacy@essanyarugunga.rw">privacy@essanyarugunga.rw</a></p>
                  <p><strong>General Inquiries:</strong><br /><a href="mailto:info@essanyarugunga.rw">info@essanyarugunga.rw</a></p>
                  <button onClick={() => handleContactClick('Privacy')} className="contact-card-btn gold">
                    Send Email <i className="fas fa-paper-plane"></i>
                  </button>
                </div>

                <div className="contact-card">
                  <i className="fas fa-phone-alt"></i>
                  <h4>Call Us</h4>
                  <p><strong>Main Line:</strong><br /><a href="tel:+250737692152">+250 737 692 152</a></p>
                  <p><strong>DPO Direct:</strong><br /><a href="tel:+250788123456">+250 788 123 456</a></p>
                  <button onClick={() => handleContactClick('Call')} className="contact-card-btn">
                    Request Callback <i className="fas fa-phone"></i>
                  </button>
                </div>

                <div className="contact-card">
                  <i className="fas fa-clock"></i>
                  <h4>Office Hours</h4>
                  <p><strong>Monday - Friday:</strong><br />8:00 AM - 5:00 PM</p>
                  <p><strong>Saturday:</strong><br />9:00 AM - 12:00 PM</p>
                  <p><strong>Emergency:</strong><br />24/7 Support Available</p>
                </div>
              </div>

              <div className="dpo-section">
                <div className="dpo-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div className="dpo-info">
                  <h4>Data Protection Officer (DPO)</h4>
                  <p><strong>John Niyomugabo</strong> - Certified Data Protection Professional</p>
                  <p><i className="fas fa-envelope"></i> <a href="mailto:dpo@essanyarugunga.rw">dpo@essanyarugunga.rw</a></p>
                  <p><i className="fas fa-phone"></i> <a href="tel:+250788123456">+250 788 123 456</a></p>
                  <button onClick={() => handleContactClick('DPO')} className="dpo-contact-btn">
                    Contact DPO Directly
                  </button>
                </div>
              </div>
            </section>

            <div className="policy-footer">
              <div className="footer-certifications">
                <i className="fas fa-certificate"></i>
                <i className="fas fa-shield-alt"></i>
                <i className="fas fa-lock"></i>
                <i className="fas fa-check-double"></i>
              </div>
              <p>This Privacy Policy is compliant with GDPR, Rwanda Data Protection Act, and international privacy standards.</p>
              <div className="footer-links">
                <Link to="/">Home</Link>
                <Link to="/terms-of-use">Terms of Use</Link>
                <Link to="/accessibility">Accessibility</Link>
                <button onClick={handlePrint}>Print Policy</button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .privacy-policy-page {
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
               height: 100%;
    background: linear-gradient(
  135deg,
  hsla(220, 60%, 18%, 0.80) 0%,
  hsla(45, 90%, 70%, 0.45) 100%
);
          color: white;
          padding: 4rem 0 6rem;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255,215,0,0.1) 0%, transparent 50%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255,215,0,0.2);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(10px);
          animation: fadeInDown 0.8s ease;
        }

        .hero-title {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: fadeInUp 0.8s ease;
        }

        .gold-text {
          color: #FFD700;
          text-shadow: 0 0 20px rgba(255,215,0,0.3);
        }

        .hero-description {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
          animation: fadeInUp 0.8s ease 0.2s backwards;
        }

        .hero-meta {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 0.9rem;
          animation: fadeInUp 0.8s ease 0.4s backwards;
        }

        .hero-meta span, .copy-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .copy-link-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .copy-link-btn:hover {
          background: #FFD700;
          color: #0a0a2a;
          transform: scale(1.05);
        }

        .hero-wave {
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }

        .hero-wave svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 80px;
        }

        /* Animations */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
        }

        /* Floating Actions */
        .floating-actions {
          position: fixed;
          right: 2rem;
          bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 100;
        }

        .fab-print, .fab-contact, .fab-top {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          font-size: 1.2rem;
        }

        .fab-print {
          background: #1e3a8a;
          color: white;
        }

        .fab-contact {
          background: #FFD700;
          color: #1e3a8a;
        }

        .fab-top {
          background: #ffffff;
          color: #1e3a8a;
        }

        .fab-print:hover, .fab-contact:hover, .fab-top:hover {
          transform: scale(1.1) translateY(-5px);
        }

        /* Policy Grid */
        .policy-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          margin: -3rem 0 3rem;
          position: relative;
          z-index: 10;
        }

        /* Sidebar */
        .policy-sidebar {
          position: sticky;
          top: 2rem;
          height: fit-content;
        }

        .sidebar-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .sidebar-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #FFD700;
        }

        .sidebar-header i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .sidebar-header h3 {
          margin: 0;
          color: #1e3a8a;
          font-size: 1.2rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .nav-link i {
          width: 24px;
          color: #FFD700;
        }

        .nav-link:hover {
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(30,58,138,0.05));
          transform: translateX(5px);
          color: #1e3a8a;
        }

        .quick-contact p {
          color: #4a5568;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .support-btn {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #FFD700, #ffed4e);
          border: none;
          border-radius: 12px;
          color: #1e3a8a;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .support-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(255,215,0,0.3);
        }

        .support-hours {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #4a5568;
        }

        .trust-badge {
          text-align: center;
        }

        .trust-icons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .trust-icons i {
          font-size: 2rem;
          color: #FFD700;
        }

        /* Main Content */
        .policy-main {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .policy-section {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
          scroll-margin-top: 2rem;
        }

        .policy-section.section-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .section-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #FFD700, #ffed4e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .section-icon i {
          font-size: 1.8rem;
          color: #1e3a8a;
        }

        .policy-section h2 {
          color: #1e3a8a;
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
        }

        .policy-section p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        /* Info Boxes */
        .info-box {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .info-box.blue-bg {
          background: linear-gradient(135deg, rgba(30,58,138,0.1), rgba(30,58,138,0.05));
          border-left: 4px solid #1e3a8a;
        }

        .info-box.gold-bg {
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05));
          border-left: 4px solid #FFD700;
        }

        .info-box i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        /* Cards Grid */
        .info-cards, .sharing-grid, .rights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .info-card, .sharing-card, .right-card {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .info-card:hover, .sharing-card:hover, .right-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .info-card i, .sharing-card i, .right-card i {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .info-card h4, .sharing-card h4, .right-card h4 {
          color: #1e3a8a;
          margin-bottom: 1rem;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
        }

        .info-card li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-card li i {
          font-size: 0.8rem;
          margin: 0;
          color: #48bb78;
        }

        /* Usage Grid */
        .usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .usage-item {
          text-align: center;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .usage-item:hover {
          transform: translateY(-5px);
          background: #fff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .usage-item i {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .usage-item h4 {
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }

        /* Security Features */
        .security-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .security-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .security-item:hover {
          transform: translateX(10px);
          background: #fff;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .security-item i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        /* Cookie Table */
        .cookie-table {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin: 1.5rem 0;
        }

        .cookie-header, .cookie-row {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          padding: 1rem;
        }

        .cookie-header {
          background: linear-gradient(135deg, #1e3a8a, #2a4a9a);
          color: white;
          font-weight: bold;
        }

        .cookie-row {
          border-bottom: 1px solid #e2e8f0;
        }

        .cookie-row:last-child {
          border-bottom: none;
        }

        .cookie-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .cookie-btn {
          padding: 0.5rem 1rem;
          background: #e2e8f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cookie-btn.gold {
          background: #FFD700;
          color: #1e3a8a;
        }

        .cookie-btn:hover {
          transform: translateY(-2px);
        }

        /* Children Section */
        .children-banner {
          display: flex;
          gap: 1rem;
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(30,58,138,0.05));
          padding: 1.5rem;
          border-radius: 16px;
          margin: 1.5rem 0;
        }

        .children-banner i {
          font-size: 3rem;
          color: #FFD700;
        }

        .children-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .children-features div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
        }

        .children-features i {
          color: #48bb78;
        }

        /* Changes Timeline */
        .changes-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .timeline-icon {
          width: 50px;
          height: 50px;
          background: #f7fafc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          font-size: 1.2rem;
        }

        /* Contact Grid */
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-card {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .contact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .contact-card i {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .contact-card h4 {
          color: #1e3a8a;
          margin-bottom: 1rem;
        }

        .contact-card a {
          color: #1e3a8a;
          text-decoration: none;
        }

        .contact-card-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #1e3a8a;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .contact-card-btn.gold {
          background: #FFD700;
          color: #1e3a8a;
        }

        .contact-card-btn:hover {
          transform: scale(1.05);
        }

        /* DPO Section */
        .dpo-section {
          display: flex;
          gap: 1.5rem;
          background: linear-gradient(135deg, #1e3a8a, #2a4a9a);
          padding: 2rem;
          border-radius: 20px;
          margin: 2rem 0;
          color: white;
        }

        .dpo-icon i {
          font-size: 3rem;
          color: #FFD700;
        }

        .dpo-info a {
          color: #FFD700;
          text-decoration: none;
        }

        .dpo-contact-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #FFD700;
          color: #1e3a8a;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dpo-contact-btn:hover {
          transform: scale(1.05);
        }

        /* Policy Footer */
        .policy-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }

        .footer-certifications {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .footer-certifications i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .footer-links a, .footer-links button {
          color: #1e3a8a;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .footer-links a:hover, .footer-links button:hover {
          color: #FFD700;
        }

        .exercise-rights-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #FFD700, #ffed4e);
          border: none;
          border-radius: 12px;
          color: #1e3a8a;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .exercise-rights-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255,215,0,0.3);
        }

        /* Responsive */
        @media (max-width: 968px) {
          .policy-grid {
            grid-template-columns: 1fr;
          }

          .policy-sidebar {
            position: static;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-meta {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }

          .policy-main {
            padding: 1.5rem;
          }

          .dpo-section {
            flex-direction: column;
          }
        }

        @media print {
          .floating-actions, .policy-sidebar, .hero-wave {
            display: none;
          }

          .policy-main {
            box-shadow: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;