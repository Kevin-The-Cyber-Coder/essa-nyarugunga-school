import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      <div className="page-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="container">
        <div className="policy-content">
          <div className="policy-sidebar">
            <div className="policy-toc">
              <h3>Contents</h3>
              <ul>
                <li><a href="#introduction">1. Introduction</a></li>
                <li><a href="#information">2. Information We Collect</a></li>
                <li><a href="#usage">3. How We Use Your Information</a></li>
                <li><a href="#sharing">4. Information Sharing</a></li>
                <li><a href="#security">5. Data Security</a></li>
                <li><a href="#rights">6. Your Rights</a></li>
                <li><a href="#cookies">7. Cookies & Tracking</a></li>
                <li><a href="#children">8. Children's Privacy</a></li>
                <li><a href="#changes">9. Changes to Policy</a></li>
                <li><a href="#contact">10. Contact Us</a></li>
              </ul>
            </div>

            <div className="policy-quick-contact">
              <h4><i className="fas fa-envelope"></i> Quick Contact</h4>
              <p>For privacy-related concerns:</p>
              <a href="mailto:privacy@essanyarugunga.rw" className="contact-btn">
                <i className="fas fa-envelope"></i> privacy@essanyarugunga.rw
              </a>
            </div>
          </div>

          <div className="policy-main">
            <section id="introduction">
              <h2>1. Introduction</h2>
              <p>Welcome to ESSA Nyarugunga School ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or interact with our school services.</p>
              <p>Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or provide us with your personal information.</p>
            </section>

            <section id="information">
              <h2>2. Information We Collect</h2>
              <p>We collect several types of information from and about users of our website and services:</p>
              
              <h3>Personal Information You Provide</h3>
              <ul>
                <li><strong>Contact Information:</strong> Name, email address, phone number, mailing address</li>
                <li><strong>Student Information:</strong> Academic records, attendance, grades, behavioral reports (for enrolled students)</li>
                <li><strong>Parent/Guardian Information:</strong> Contact details, emergency contacts, relationship to student</li>
                <li><strong>Application Information:</strong> Admission applications, transcripts, recommendations</li>
                <li><strong>Communication Records:</strong> Emails, messages, feedback, support requests</li>
                <li><strong>Newsletter Subscription:</strong> Email address for receiving updates and announcements</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <ul>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, navigation patterns</li>
                <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
                <li><strong>Cookies:</strong> Small data files stored on your device</li>
              </ul>
            </section>

            <section id="usage">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes:</p>
              <ul>
                <li><strong>Educational Services:</strong> To provide, maintain, and improve our educational programs and services</li>
                <li><strong>Communication:</strong> To send important notices, academic updates, event invitations, and newsletters</li>
                <li><strong>Admission Process:</strong> To process applications, manage enrollment, and communicate admission decisions</li>
                <li><strong>Parent-Teacher Communication:</strong> To facilitate communication between parents and teachers</li>
                <li><strong>Safety & Security:</strong> To ensure the safety of students, staff, and visitors</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and regulatory requirements</li>
                <li><strong>Website Improvement:</strong> To analyze usage patterns and enhance user experience</li>
                <li><strong>Emergency Response:</strong> To contact parents/guardians during emergencies</li>
              </ul>
            </section>

            <section id="sharing">
              <h2>4. Information Sharing</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. However, we may share information in the following circumstances:</p>
              
              <h3>Trusted Third Parties</h3>
              <ul>
                <li><strong>Ministry of Education:</strong> As required for educational reporting and compliance</li>
                <li><strong>Service Providers:</strong> Vendors who assist with website hosting, data analytics, email delivery, and other services</li>
                <li><strong>Emergency Services:</strong> In case of medical emergencies or safety concerns</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              </ul>

              <h3>School-Related Sharing</h3>
              <ul>
                <li><strong>Teachers & Staff:</strong> Information shared internally for educational purposes</li>
                <li><strong>Other Parents:</strong> Limited information for school events and parent committees</li>
                <li><strong>Accrediting Bodies:</strong> As required for maintaining accreditation</li>
              </ul>
            </section>

            <section id="security">
              <h2>5. Data Security</h2>
              <p>We implement appropriate technical and organizational security measures to protect your personal information:</p>
              <ul>
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                <li><strong>Access Controls:</strong> Restricted access to personal information based on need</li>
                <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
                <li><strong>Staff Training:</strong> Regular training on data protection best practices</li>
                <li><strong>Incident Response:</strong> Procedures for handling data breaches</li>
              </ul>
              <p>While we strive to protect your information, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
            </section>

            <section id="rights">
              <h2>6. Your Rights</h2>
              <p>Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Restriction:</strong> Request restriction of processing your information</li>
                <li><strong>Portability:</strong> Request transfer of your information to another service</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
              </ul>
              <p>To exercise these rights, please contact us using the information in the "Contact Us" section.</p>
            </section>

            <section id="cookies">
              <h2>7. Cookies & Tracking</h2>
              <p>We use cookies and similar tracking technologies to enhance your experience on our website:</p>
              
              <h3>Types of Cookies We Use</h3>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Collect anonymous usage data (e.g., Google Analytics)</li>
              </ul>

              <h3>Managing Cookies</h3>
              <p>You can control cookies through your browser settings. Most browsers allow you to:</p>
              <ul>
                <li>See what cookies are stored</li>
                <li>Delete all cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
              </ul>
              <p>Please note that blocking cookies may affect website functionality.</p>
            </section>

            <section id="children">
              <h2>8. Children's Privacy</h2>
              <p>We are committed to protecting children's privacy. Our website and services are designed for use by parents, guardians, and students under appropriate supervision:</p>
              <ul>
                <li><strong>Parental Consent:</strong> We obtain parental consent before collecting personal information from children under 13</li>
                <li><strong>Limited Collection:</strong> We collect only information necessary for educational purposes</li>
                <li><strong>Parental Access:</strong> Parents can review, modify, or request deletion of their child's information</li>
                <li><strong>No Marketing:</strong> We do not market directly to children</li>
              </ul>
              <p>If you believe we have collected information from a child without proper consent, please contact us immediately.</p>
            </section>

            <section id="changes">
              <h2>9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. When we make changes, we will:</p>
              <ul>
                <li>Update the "Last Updated" date at the top of this page</li>
                <li>Post the new policy on this page</li>
                <li>Notify users of significant changes via email or website notice</li>
              </ul>
              <p>We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.</p>
            </section>

            <section id="contact">
              <h2>10. Contact Us</h2>
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              
              <div className="contact-info-box">
                <div className="contact-method">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <strong>Physical Address:</strong>
                    <p>ESSA Nyarugunga School<br />
                    Nyarugunga Sector, Kicukiro District<br />
                    Kigali, Rwanda</p>
                  </div>
                </div>

                <div className="contact-method">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <strong>Email:</strong>
                    <p><a href="mailto:privacy@essanyarugunga.rw">privacy@essanyarugunga.rw</a> (Privacy Matters)<br />
                    <a href="mailto:info@essanyarugunga.rw">info@essanyarugunga.rw</a> (General Inquiries)</p>
                  </div>
                </div>

                <div className="contact-method">
                  <i className="fas fa-phone-alt"></i>
                  <div>
                    <strong>Phone:</strong>
                    <p><a href="tel:+250737692152">+250 737 692 152</a> (Main)<br />
                    +250 788 123 456 (Data Protection Officer)</p>
                  </div>
                </div>

                <div className="contact-method">
                  <i className="fas fa-clock"></i>
                  <div>
                    <strong>Office Hours:</strong>
                    <p>Monday - Friday: 8:00 AM - 5:00 PM<br />
                    Saturday: 9:00 AM - 12:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="data-officer">
                <h4><i className="fas fa-user-shield"></i> Data Protection Officer</h4>
                <p>Our Data Protection Officer is available to address privacy concerns:</p>
                <p><strong>Name:</strong> John Niyomugabo<br />
                <strong>Email:</strong> <a href="mailto:dpo@essanyarugunga.rw">dpo@essanyarugunga.rw</a><br />
                <strong>Direct Line:</strong> +250 788 123 456</p>
              </div>
            </section>

            <div className="policy-footer-note">
              <p><strong>Note:</strong> This Privacy Policy applies solely to information collected through our website and school operations. We are not responsible for the privacy practices of third-party websites linked from our site.</p>
            </div>
          </div>
        </div>

        <div className="policy-actions">
          <Link to="/" className="btn-home">
            <i className="fas fa-home"></i> Back to Home
          </Link>
          <button onClick={() => window.print()} className="btn-print">
            <i className="fas fa-print"></i> Print Policy
          </button>
        </div>
      </div>

      <style jsx>{`
        .privacy-policy-page {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .page-header {
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
          color: white;
          padding: 4rem 0 3rem;
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem;
        }

        .page-header p {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .policy-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          margin: 2rem 0;
        }

        .policy-sidebar {
          position: sticky;
          top: 2rem;
          height: fit-content;
        }

        .policy-toc {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }

        .policy-toc h3 {
          color: #1a1a2e;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #4a90e2;
        }

        .policy-toc ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .policy-toc li {
          margin-bottom: 0.75rem;
        }

        .policy-toc a {
          color: #4a5568;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .policy-toc a:hover {
          color: #4a90e2;
          padding-left: 5px;
        }

        .policy-quick-contact {
          background: linear-gradient(135deg, #4a90e2, #357abd);
          color: white;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .policy-quick-contact h4 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
        }

        .policy-quick-contact p {
          font-size: 0.9rem;
          margin-bottom: 1rem;
          opacity: 0.95;
        }

        .contact-btn {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .contact-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateX(5px);
        }

        .policy-main {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .policy-main section {
          margin-bottom: 2.5rem;
          scroll-margin-top: 2rem;
        }

        .policy-main h2 {
          color: #1a1a2e;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .policy-main h3 {
          color: #2d3748;
          font-size: 1.2rem;
          margin: 1.5rem 0 1rem;
        }

        .policy-main p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .policy-main ul {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .policy-main li {
          margin-bottom: 0.5rem;
        }

        .contact-info-box {
          margin: 1.5rem 0;
        }

        .contact-method {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .contact-method i {
          font-size: 1.5rem;
          color: #4a90e2;
          margin-top: 0.25rem;
        }

        .contact-method strong {
          color: #1a1a2e;
          display: block;
          margin-bottom: 0.5rem;
        }

        .contact-method p {
          margin: 0;
        }

        .contact-method a {
          color: #4a90e2;
          text-decoration: none;
        }

        .contact-method a:hover {
          text-decoration: underline;
        }

        .data-officer {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #4a90e2;
          margin-top: 1.5rem;
        }

        .data-officer h4 {
          color: #1a1a2e;
          margin: 0 0 1rem;
          font-size: 1.1rem;
        }

        .policy-footer-note {
          margin-top: 2rem;
          padding: 1rem;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }

        .policy-footer-note p {
          color: #856404;
          margin: 0;
          font-size: 0.9rem;
        }

        .policy-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin: 2rem 0 3rem;
        }

        .btn-home, .btn-print {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-home {
          background: #4a90e2;
          color: white;
        }

        .btn-home:hover {
          background: #357abd;
          transform: translateY(-2px);
        }

        .btn-print {
          background: #48bb78;
          color: white;
        }

        .btn-print:hover {
          background: #38a169;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }

          .page-header {
            padding: 2rem 0 1.5rem;
          }

          .page-header h1 {
            font-size: 1.8rem;
          }

          .policy-content {
            grid-template-columns: 1fr;
          }

          .policy-sidebar {
            position: static;
          }

          .policy-main {
            padding: 1.5rem;
          }

          .policy-actions {
            flex-direction: column;
            align-items: center;
          }

          .btn-home, .btn-print {
            width: 100%;
            justify-content: center;
          }
        }

        @media print {
          .policy-sidebar,
          .policy-actions,
          .page-header {
            display: none;
          }

          .policy-main {
            box-shadow: none;
            padding: 0;
          }

          .container {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;