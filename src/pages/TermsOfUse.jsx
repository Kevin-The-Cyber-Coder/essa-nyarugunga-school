import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const TermsOfUse = () => {
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

    document.querySelectorAll('.terms-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleAcceptTerms = () => {
    Swal.fire({
      title: 'Accept Terms & Conditions',
      text: 'Do you agree to abide by our Terms of Use?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#FFD700',
      cancelButtonColor: '#1e3a8a',
      confirmButtonText: 'Yes, I Accept',
      cancelButtonText: 'No, Cancel',
      background: '#ffffff',
      showCloseButton: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem('termsAccepted', 'true');
        Swal.fire({
          title: 'Accepted!',
          text: 'Thank you for accepting our Terms of Use.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          background: '#ffffff',
          position: 'top-end',
          toast: true
        });
      }
    });
  };

  const handleReportIssue = () => {
    Swal.fire({
      title: 'Report an Issue',
      html: `
        <input type="text" id="issue-title" class="swal2-input" placeholder="Issue Title">
        <textarea id="issue-description" class="swal2-textarea" placeholder="Describe the issue..."></textarea>
        <select id="issue-type" class="swal2-select">
          <option value="technical">Technical Issue</option>
          <option value="content">Content Error</option>
          <option value="violation">Terms Violation</option>
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
        const title = document.getElementById('issue-title').value;
        const description = document.getElementById('issue-description').value;
        const type = document.getElementById('issue-type').value;
        
        if (!title || !description) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }
        
        return { title, description, type };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Report Submitted!',
          text: 'Thank you for helping us improve. Our team will review your report.',
          icon: 'success',
          confirmButtonColor: '#FFD700',
          background: '#ffffff'
        });
      }
    });
  };

  const handleCopySection = (sectionTitle) => {
    navigator.clipboard.writeText(`${sectionTitle}\n\nFrom ESSA Nyarugunga Terms of Use`);
    Swal.fire({
      title: 'Section Copied!',
      text: `${sectionTitle} has been copied to clipboard`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff',
      position: 'top-end',
      toast: true
    });
  };

  return (
    <div className="terms-of-use-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-gavel"></i> Legal Agreement
          </div>
          <h1 className="hero-title">
            Terms of <span className="gold-text">Use</span>
          </h1>
          <p className="hero-description">
            Please read these terms carefully before using our website and services
          </p>
          <div className="hero-meta">
            <span><i className="fas fa-calendar-alt"></i> Effective Date: January 1, 2024</span>
            <span><i className="fas fa-file-contract"></i> Version 2.0</span>
            <span><i className="fas fa-globe"></i> Applicable Worldwide</span>
          </div>
          <div className="hero-actions">
            <button onClick={handleAcceptTerms} className="accept-btn">
              <i className="fas fa-check-circle"></i> Accept Terms
            </button>
            <button onClick={handleReportIssue} className="report-btn">
              <i className="fas fa-flag"></i> Report Issue
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
          <button onClick={handleAcceptTerms} className="fab-accept" title="Accept Terms">
            <i className="fas fa-check"></i>
          </button>
          <button onClick={handleReportIssue} className="fab-report" title="Report Issue">
            <i className="fas fa-flag"></i>
          </button>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fab-top" title="Back to Top">
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>

        <div className="terms-grid">
          {/* Sidebar Navigation */}
          <aside className="terms-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <i className="fas fa-list-ul"></i>
                <h3>Quick Navigation</h3>
              </div>
              <nav className="sidebar-nav">
                <a href="#agreement" className="nav-link">
                  <i className="fas fa-handshake"></i>
                  <span>Legal Agreement</span>
                </a>
                <a href="#acceptance" className="nav-link">
                  <i className="fas fa-check-double"></i>
                  <span>Acceptance of Terms</span>
                </a>
                <a href="#use" className="nav-link">
                  <i className="fas fa-laptop"></i>
                  <span>Use of Website</span>
                </a>
                <a href="#accounts" className="nav-link">
                  <i className="fas fa-user-circle"></i>
                  <span>User Accounts</span>
                </a>
                <a href="#conduct" className="nav-link">
                  <i className="fas fa-ban"></i>
                  <span>Prohibited Conduct</span>
                </a>
                <a href="#intellectual" className="nav-link">
                  <i className="fas fa-copyright"></i>
                  <span>Intellectual Property</span>
                </a>
                <a href="#content" className="nav-link">
                  <i className="fas fa-file-alt"></i>
                  <span>User Content</span>
                </a>
                <a href="#payments" className="nav-link">
                  <i className="fas fa-credit-card"></i>
                  <span>Payments & Fees</span>
                </a>
                <a href="#privacy" className="nav-link">
                  <i className="fas fa-shield-alt"></i>
                  <span>Privacy</span>
                </a>
                <a href="#liability" className="nav-link">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Limitation of Liability</span>
                </a>
                <a href="#termination" className="nav-link">
                  <i className="fas fa-times-circle"></i>
                  <span>Termination</span>
                </a>
                <a href="#governing" className="nav-link">
                  <i className="fas fa-gavel"></i>
                  <span>Governing Law</span>
                </a>
                <a href="#contact" className="nav-link">
                  <i className="fas fa-envelope"></i>
                  <span>Contact Us</span>
                </a>
              </nav>
            </div>

            <div className="sidebar-card status-card">
              <div className="status-header">
                <i className="fas fa-chart-line"></i>
                <h3>Legal Status</h3>
              </div>
              <div className="status-badge">
                <i className="fas fa-check-circle"></i>
                <span>Legally Compliant</span>
              </div>
              <div className="status-badge">
                <i className="fas fa-shield-alt"></i>
                <span>GDPR Ready</span>
              </div>
              <div className="status-badge">
                <i className="fas fa-file-signature"></i>
                <span>Digitally Signed</span>
              </div>
            </div>

            <div className="sidebar-card need-help">
              <i className="fas fa-headset"></i>
              <h4>Need Help?</h4>
              <p>Our legal team is available to answer your questions</p>
              <button onClick={handleReportIssue} className="help-btn">
                <i className="fas fa-comments"></i> Get Support
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="terms-main">
            <div className="terms-notice">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Important Legal Notice:</strong> These Terms of Use constitute a binding agreement between you and ESSA Nyarugunga School. By accessing our website, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </div>
            </div>

            <section id="agreement" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h2>Legal Agreement</h2>
              <p>Welcome to <span className="gold-text">ESSA Nyarugunga School</span> ("we," "our," "us"). These Terms of Use ("Terms") govern your access to and use of our website, applications, and services (collectively, the "Services"). By using our Services, you agree to be bound by these Terms and our Privacy Policy.</p>
              <div className="info-box gold-bg">
                <i className="fas fa-gavel"></i>
                <div>
                  <strong>Binding Agreement</strong>
                  <p>These Terms create a legally binding agreement. If you do not agree with any part of these Terms, you must not use our Services.</p>
                </div>
              </div>
            </section>

            <section id="acceptance" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-check-double"></i>
              </div>
              <h2>Acceptance of Terms</h2>
              <p>By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. You also agree to comply with all applicable laws and regulations.</p>
              <div className="acceptance-cards">
                <div className="acceptance-card">
                  <i className="fas fa-user-check"></i>
                  <h4>Eligibility</h4>
                  <p>You must be at least 13 years old to use our Services. If you are under 18, you must have parental consent.</p>
                </div>
                <div className="acceptance-card">
                  <i className="fas fa-business-time"></i>
                  <h4>School Relationship</h4>
                  <p>These Terms supplement any separate agreements you may have with our school (e.g., enrollment contracts).</p>
                </div>
                <div className="acceptance-card">
                  <i className="fas fa-sync-alt"></i>
                  <h4>Updates to Terms</h4>
                  <p>We may modify these Terms at any time. Continued use constitutes acceptance of updated Terms.</p>
                </div>
              </div>
            </section>

            <section id="use" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-laptop"></i>
              </div>
              <h2>Use of Website</h2>
              <p>We grant you a limited, non-exclusive, non-transferable, revocable license to access and use our Services for personal, non-commercial purposes, subject to these Terms.</p>
              <div className="permissions-grid">
                <div className="permission-card allowed">
                  <i className="fas fa-check-circle"></i>
                  <h4>Allowed Activities</h4>
                  <ul>
                    <li>Accessing school information</li>
                    <li>Viewing academic calendars</li>
                    <li>Contacting school officials</li>
                    <li>Applying for admissions</li>
                    <li>Accessing educational resources</li>
                  </ul>
                </div>
                <div className="permission-card prohibited">
                  <i className="fas fa-times-circle"></i>
                  <h4>Prohibited Activities</h4>
                  <ul>
                    <li>Commercial use without permission</li>
                    <li>Copying website content</li>
                    <li>Reverse engineering</li>
                    <li>Automated data collection</li>
                    <li>Interfering with website operations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="accounts" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-user-circle"></i>
              </div>
              <h2>User Accounts</h2>
              <p>To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials.</p>
              <div className="account-features">
                <div className="feature-item">
                  <i className="fas fa-lock"></i>
                  <div>
                    <h4>Account Security</h4>
                    <p>You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized access.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-id-card"></i>
                  <div>
                    <h4>Accurate Information</h4>
                    <p>You must provide accurate, current, and complete information during registration and update it promptly.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-exchange-alt"></i>
                  <div>
                    <h4>Account Transfer</h4>
                    <p>Accounts are non-transferable. You may not share your account with others unless authorized by us.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="conduct" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-ban"></i>
              </div>
              <h2>Prohibited Conduct</h2>
              <p>When using our Services, you agree NOT to engage in any of the following prohibited activities:</p>
              <div className="prohibited-grid">
                <div className="prohibited-item">
                  <i className="fas fa-bug"></i>
                  <span>Upload malware or malicious code</span>
                </div>
                <div className="prohibited-item">
                  <i className="fas fa-harassment"></i>
                  <span>Harass, abuse, or harm others</span>
                </div>
                <div className="prohibited-item">
                  <i className="fas fa-copyright"></i>
                  <span>Infringe intellectual property rights</span>
                </div>
                <div className="prohibited-item">
                  <i className="fas fa-dollar-sign"></i>
                  <span>Engage in unauthorized commercial activities</span>
                </div>
                <div className="prohibited-item">
                  <i className="fas fa-user-secret"></i>
                  <span>Impersonate others or provide false information</span>
                </div>
                <div className="prohibited-item">
                  <i className="fas fa-chart-line"></i>
                  <span>Interfere with website security features</span>
                </div>
              </div>
            </section>

            <section id="intellectual" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-copyright"></i>
              </div>
              <h2>Intellectual Property</h2>
              <p>All content on our Services, including text, graphics, logos, images, software, and educational materials, is the property of ESSA Nyarugunga School or its licensors and is protected by intellectual property laws.</p>
              <div className="ip-grid">
                <div className="ip-card">
                  <i className="fas fa-registered"></i>
                  <h4>Trademarks</h4>
                  <p>The ESSA Nyarugunga name, logo, and related marks are registered trademarks. Unauthorized use is prohibited.</p>
                </div>
                <div className="ip-card">
                  <i className="fas fa-file-alt"></i>
                  <h4>Copyrighted Content</h4>
                  <p>All educational materials, curriculum, and original content are protected by copyright law.</p>
                </div>
                <div className="ip-card">
                  <i className="fas fa-download"></i>
                  <h4>Limited License</h4>
                  <p>You may download or print content for personal, non-commercial use only, provided you retain all copyright notices.</p>
                </div>
              </div>
              <div className="info-box blue-bg">
                <i className="fas fa-envelope"></i>
                <div>
                  <strong>Copyright Infringement Claims</strong>
                  <p>If you believe your work has been copied in a way that constitutes copyright infringement, please contact our designated agent.</p>
                  <button onClick={() => handleCopySection('Intellectual Property')} className="copy-section-btn">
                    <i className="fas fa-copy"></i> Copy Section
                  </button>
                </div>
              </div>
            </section>

            <section id="content" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h2>User Content</h2>
              <p>You may have the opportunity to post, submit, or share content on our Services ("User Content"). You retain ownership of your User Content, but grant us a license to use it.</p>
              <div className="content-rules">
                <div className="rule">
                  <i className="fas fa-check-circle gold"></i>
                  <div>
                    <strong>License Grant</strong>
                    <p>By submitting content, you grant us a worldwide, royalty-free license to use, reproduce, modify, and display your content in connection with our Services.</p>
                  </div>
                </div>
                <div className="rule">
                  <i className="fas fa-check-circle gold"></i>
                  <div>
                    <strong>Content Standards</strong>
                    <p>User Content must not be illegal, offensive, defamatory, or infringe on others' rights. We reserve the right to remove any content that violates these standards.</p>
                  </div>
                </div>
                <div className="rule">
                  <i className="fas fa-check-circle gold"></i>
                  <div>
                    <strong>No Obligation to Monitor</strong>
                    <p>We are not obligated to monitor User Content but have the right to review and remove any content at our discretion.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="payments" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-credit-card"></i>
              </div>
              <h2>Payments & Fees</h2>
              <p>Some of our Services may require payment of fees. By using paid Services, you agree to pay all applicable fees.</p>
              <div className="payment-features">
                <div className="payment-card">
                  <i className="fas fa-receipt"></i>
                  <h4>Fee Structure</h4>
                  <p>Tuition, application fees, and other charges are outlined in separate enrollment agreements. All fees are non-refundable unless otherwise stated.</p>
                </div>
                <div className="payment-card">
                  <i className="fas fa-clock"></i>
                  <h4>Payment Terms</h4>
                  <p>Payments must be made according to the schedule provided. Late payments may result in service suspension or additional fees.</p>
                </div>
                <div className="payment-card">
                  <i className="fas fa-shield-alt"></i>
                  <h4>Secure Transactions</h4>
                  <p>We use industry-standard encryption for all payment transactions. We do not store complete payment information.</p>
                </div>
              </div>
            </section>

            <section id="privacy" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h2>Privacy</h2>
              <p>Your privacy is important to us. Our <Link to="/privacy-policy">Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using our Services, you consent to our privacy practices.</p>
              <div className="privacy-highlights">
                <div><i className="fas fa-database"></i> Data Collection & Processing</div>
                <div><i className="fas fa-cookie-bite"></i> Cookies & Tracking Technologies</div>
                <div><i className="fas fa-user-shield"></i> Your Data Protection Rights</div>
                <div><i className="fas fa-globe"></i> International Data Transfers</div>
              </div>
            </section>

            <section id="liability" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2>Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, ESSA Nyarugunga School shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our Services.</p>
              <div className="liability-box">
                <div className="liability-item">
                  <i className="fas fa-ban"></i>
                  <strong>No Warranty</strong>
                  <p>Our Services are provided "as is" without warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
                </div>
                <div className="liability-item">
                  <i className="fas fa-dollar-sign"></i>
                  <strong>Maximum Liability</strong>
                  <p>Our total liability to you shall not exceed the amount you paid us in the past 12 months or $100, whichever is greater.</p>
                </div>
                <div className="liability-item">
                  <i className="fas fa-cloud-sun"></i>
                  <strong>Force Majeure</strong>
                  <p>We are not liable for delays or failures caused by circumstances beyond our reasonable control.</p>
                </div>
              </div>
            </section>

            <section id="termination" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-times-circle"></i>
              </div>
              <h2>Termination</h2>
              <p>We may terminate or suspend your access to our Services immediately, without prior notice, for any reason, including breach of these Terms.</p>
              <div className="termination-effects">
                <h4>Effects of Termination:</h4>
                <ul>
                  <li><i className="fas fa-times"></i> Your right to use Services will immediately cease</li>
                  <li><i className="fas fa-database"></i> We may delete your account and associated data</li>
                  <li><i className="fas fa-gavel"></i> Certain provisions of these Terms will survive termination</li>
                  <li><i className="fas fa-file-invoice"></i> You remain liable for outstanding fees</li>
                </ul>
              </div>
            </section>

            <section id="governing" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-gavel"></i>
              </div>
              <h2>Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of Rwanda, without regard to conflict of law principles.</p>
              <div className="dispute-resolution">
                <h4>Dispute Resolution</h4>
                <p>Any dispute arising from these Terms shall be resolved through binding arbitration in Kigali, Rwanda, unless otherwise agreed by both parties. Each party shall bear its own arbitration costs.</p>
                <div className="resolution-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div>Informal Negotiation (30 days)</div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div>Mediation (if negotiation fails)</div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div>Binding Arbitration (final step)</div>
                  </div>
                </div>
              </div>
            </section>

            <section id="contact" className="terms-section">
              <div className="section-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h2>Contact Us</h2>
              <p>If you have questions about these Terms or need to report a violation, please contact us:</p>
              
              <div className="contact-info-grid">
                <div className="contact-info-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>Physical Address</strong>
                    <p>ESSA Nyarugunga School<br />Nyarugunga Sector, Kicukiro District<br />Kigali, Rwanda</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <strong>Email Address</strong>
                    <p><a href="mailto:legal@essanyarugunga.rw">legal@essanyarugunga.rw</a> (Legal Matters)<br />
                    <a href="mailto:info@essanyarugunga.rw">info@essanyarugunga.rw</a> (General Inquiries)</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <i className="fas fa-phone-alt"></i>
                  <div>
                    <strong>Phone Number</strong>
                    <p><a href="tel:+250737692152">+250 737 692 152</a> (Main)<br />
                    <a href="tel:+250788123456">+250 788 123 456</a> (Legal Department)</p>
                  </div>
                </div>
              </div>

              <div className="legal-team">
                <i className="fas fa-users"></i>
                <div>
                  <h4>Legal Team Contact</h4>
                  <p><strong>Legal Counsel:</strong> Marie Uwimana, Esq.</p>
                  <p><strong>Direct Line:</strong> +250 788 123 457</p>
                  <p><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </section>

            <div className="terms-footer">
              <div className="footer-actions">
                <button onClick={handleAcceptTerms} className="footer-accept-btn">
                  <i className="fas fa-check-circle"></i> I Accept the Terms
                </button>
                <button onClick={() => window.print()} className="footer-print-btn">
                  <i className="fas fa-print"></i> Print Terms
                </button>
              </div>
              <div className="footer-certifications">
                <span><i className="fas fa-check-circle"></i> Legally Binding</span>
                <span><i className="fas fa-shield-alt"></i> Enforceable Agreement</span>
                <span><i className="fas fa-file-signature"></i> Digital Signature Ready</span>
              </div>
              <p className="last-updated">Last Updated: December 31, 2023 | Next Review: December 31, 2024</p>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .terms-of-use-page {
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          background: linear-gradient(135deg, #0a0a2a 0%, #1a2a4a 50%, #0a1a3a 100%);
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
          max-width: 900px;
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
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease 0.4s backwards;
        }

        .hero-meta span {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          animation: fadeInUp 0.8s ease 0.6s backwards;
        }

        .accept-btn, .report-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .accept-btn {
          background: #FFD700;
          color: #1e3a8a;
        }

        .accept-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(255,215,0,0.3);
        }

        .report-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          backdrop-filter: blur(10px);
        }

        .report-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
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

        .fab-accept, .fab-report, .fab-top {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          font-size: 1.2rem;
        }

        .fab-accept {
          background: #FFD700;
          color: #1e3a8a;
        }

        .fab-report {
          background: #ef4444;
          color: white;
        }

        .fab-top {
          background: #1e3a8a;
          color: white;
        }

        .fab-accept:hover, .fab-report:hover, .fab-top:hover {
          transform: scale(1.1) translateY(-5px);
        }

        /* Terms Grid */
        .terms-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          margin: -3rem 0 3rem;
          position: relative;
          z-index: 10;
        }

        /* Sidebar */
        .terms-sidebar {
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

        .sidebar-header, .status-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #FFD700;
        }

        .sidebar-header i, .status-header i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .sidebar-header h3, .status-header h3 {
          margin: 0;
          color: #1e3a8a;
          font-size: 1.2rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
          font-size: 0.9rem;
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

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: #f7fafc;
          border-radius: 10px;
          color: #1e3a8a;
        }

        .status-badge i {
          color: #48bb78;
        }

        .need-help {
          text-align: center;
        }

        .need-help i {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .need-help h4 {
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }

        .need-help p {
          font-size: 0.85rem;
          color: #4a5568;
          margin-bottom: 1rem;
        }

        .help-btn {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #FFD700, #ffed4e);
          border: none;
          border-radius: 10px;
          color: #1e3a8a;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .help-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(255,215,0,0.3);
        }

        /* Main Content */
        .terms-main {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .terms-notice {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border-left: 4px solid #FFD700;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .terms-notice i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .terms-section {
          margin-bottom: 3rem;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
          scroll-margin-top: 2rem;
        }

        .terms-section.section-visible {
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

        .terms-section h2 {
          color: #1e3a8a;
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
        }

        .terms-section p {
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

        .info-box.gold-bg {
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05));
          border-left: 4px solid #FFD700;
        }

        .info-box.blue-bg {
          background: linear-gradient(135deg, rgba(30,58,138,0.1), rgba(30,58,138,0.05));
          border-left: 4px solid #1e3a8a;
        }

        .info-box i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .copy-section-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #FFD700;
          border: none;
          border-radius: 8px;
          color: #1e3a8a;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .copy-section-btn:hover {
          transform: translateY(-2px);
        }

        /* Acceptance Cards */
        .acceptance-cards, .ip-grid, .payment-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .acceptance-card, .ip-card, .payment-card {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .acceptance-card:hover, .ip-card:hover, .payment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .acceptance-card i, .ip-card i, .payment-card i {
          font-size: 2rem;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .acceptance-card h4, .ip-card h4, .payment-card h4 {
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }

        /* Permissions Grid */
        .permissions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .permission-card {
          padding: 1.5rem;
          border-radius: 16px;
        }

        .permission-card.allowed {
          background: linear-gradient(135deg, rgba(72,187,120,0.1), rgba(72,187,120,0.05));
          border: 1px solid #48bb78;
        }

        .permission-card.prohibited {
          background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05));
          border: 1px solid #ef4444;
        }

        .permission-card i {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .permission-card.allowed i {
          color: #48bb78;
        }

        .permission-card.prohibited i {
          color: #ef4444;
        }

        .permission-card h4 {
          margin-bottom: 1rem;
        }

        .permission-card ul {
          list-style: none;
          padding: 0;
        }

        .permission-card li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        /* Account Features */
        .account-features, .liability-box {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .feature-item, .liability-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .feature-item:hover, .liability-item:hover {
          transform: translateX(10px);
          background: #fff;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .feature-item i, .liability-item i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        /* Prohibited Grid */
        .prohibited-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .prohibited-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .prohibited-item:hover {
          transform: translateX(5px);
          background: #fee;
        }

        .prohibited-item i {
          color: #ef4444;
        }

        /* Content Rules */
        .content-rules {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .rule {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
        }

        .rule i {
          font-size: 1.5rem;
        }

        .rule i.gold {
          color: #FFD700;
        }

        /* Privacy Highlights */
        .privacy-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .privacy-highlights div {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 10px;
        }

        .privacy-highlights i {
          color: #FFD700;
        }

        /* Termination Effects */
        .termination-effects {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 16px;
          margin: 1.5rem 0;
        }

        .termination-effects ul {
          list-style: none;
          padding: 0;
        }

        .termination-effects li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .termination-effects li i {
          color: #ef4444;
        }

        /* Dispute Resolution */
        .dispute-resolution {
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(30,58,138,0.05));
          padding: 1.5rem;
          border-radius: 16px;
          margin: 1.5rem 0;
        }

        .resolution-steps {
          display: flex;
          justify-content: space-around;
          margin-top: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .step {
          text-align: center;
          flex: 1;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: #FFD700;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.5rem;
          font-weight: bold;
          color: #1e3a8a;
        }

        /* Contact Info */
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-info-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .contact-info-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .contact-info-item i {
          font-size: 1.5rem;
          color: #FFD700;
        }

        .contact-info-item a {
          color: #1e3a8a;
          text-decoration: none;
        }

        .legal-team {
          display: flex;
          gap: 1rem;
          background: linear-gradient(135deg, #1e3a8a, #2a4a9a);
          padding: 1.5rem;
          border-radius: 16px;
          color: white;
          margin-top: 1.5rem;
        }

        .legal-team i {
          font-size: 2rem;
          color: #FFD700;
        }

        .legal-team a {
          color: #FFD700;
          text-decoration: none;
        }

        /* Terms Footer */
        .terms-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }

        .footer-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .footer-accept-btn, .footer-print-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-accept-btn {
          background: #FFD700;
          color: #1e3a8a;
        }

        .footer-print-btn {
          background: #1e3a8a;
          color: white;
        }

        .footer-accept-btn:hover, .footer-print-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .footer-certifications {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .footer-certifications span {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #4a5568;
        }

        .footer-certifications i {
          color: #48bb78;
        }

        .last-updated {
          font-size: 0.8rem;
          color: #a0aec0;
        }

        /* Responsive */
        @media (max-width: 968px) {
          .terms-grid {
            grid-template-columns: 1fr;
          }

          .terms-sidebar {
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

          .hero-actions {
            flex-direction: column;
          }

          .permissions-grid {
            grid-template-columns: 1fr;
          }

          .resolution-steps {
            flex-direction: column;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }

          .terms-main {
            padding: 1.5rem;
          }

          .legal-team {
            flex-direction: column;
          }

          .footer-actions {
            flex-direction: column;
          }
        }

        @media print {
          .floating-actions, .terms-sidebar, .hero-wave, .hero-actions {
            display: none;
          }

          .terms-main {
            box-shadow: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsOfUse;