import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import images from assets folder
import heroBg from '../assets/hero-bg.jpg';
import campusImage from '../assets/campus.png';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.message) {
      Swal.fire({
        title: 'Incomplete Form',
        text: 'Please fill in all required fields.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        title: 'Invalid Email',
        text: 'Please enter a valid email address.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        Swal.fire({
          title: 'Message Sent!',
          html: `
            <div style="text-align: left;">
              <p>Thank you <strong>${formData.fullName}</strong> for contacting us.</p>
              <p>We have received your message and will respond within 24 hours.</p>
              <hr>
              <p><strong>Reference:</strong> ${result.reference || 'CONF-' + Date.now()}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1e3c72'
        });
        
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to send message. Please try again.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallClick = () => {
    Swal.fire({
      title: 'Call Us',
      text: 'Click OK to call +250 788 123 456',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Call Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#27ae60'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = 'tel:250788123456';
      }
    });
  };

  const handleEmailClick = () => {
    Swal.fire({
      title: 'Email Us',
      text: 'Click OK to send an email to info@essanyarugunga.rw',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Send Email',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3498db'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = 'mailto:info@essanyarugunga.rw';
      }
    });
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/250788123456?text=Hello%20ESSA%20Nyarugunga%2C%20I%20have%20a%20question%20about', '_blank');
  };

  const handleDirectionClick = () => {
    Swal.fire({
      title: 'Get Directions',
      text: 'Open Google Maps for directions to ESSA Nyarugunga?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Open Maps',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1e3c72'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open('https://maps.google.com/?q=Nyarugunga+Sector+Kicukiro+District+Kigali+Rwanda', '_blank');
      }
    });
  };

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (!email) return;
    
    try {
      const response = await fetch(`${API_URL}/subscriptions/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      Swal.fire({
        title: data.success ? 'Subscribed!' : 'Already Subscribed',
        text: data.message || 'You have successfully subscribed to our newsletter.',
        icon: data.success ? 'success' : 'info',
        confirmButtonColor: '#1e3c72'
      });
      e.target.reset();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to subscribe. Please try again.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const contactInfo = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Visit Us',
      details: ['Nyarugunga Sector, Kicukiro District', 'Kigali, Rwanda'],
      action: 'Get Directions',
      actionHandler: handleDirectionClick,
      color: '#e74c3c',
      bgLight: '#fdecea'
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Call Us',
      details: ['+250 788 123 456', '+250 788 123 457'],
      action: 'Call Now',
      actionHandler: handleCallClick,
      color: '#27ae60',
      bgLight: '#e8f5e9'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email Us',
      details: ['info@essanyarugunga.rw', 'admissions@essanyarugunga.rw'],
      action: 'Send Email',
      actionHandler: handleEmailClick,
      color: '#3498db',
      bgLight: '#e3f2fd'
    },
    {
      icon: 'fas fa-clock',
      title: 'Office Hours',
      details: ['Mon-Fri: 8:00 AM - 5:00 PM', 'Saturday: 9:00 AM - 12:00 PM'],
      action: 'Schedule Appointment',
      actionHandler: () => {
        Swal.fire({
          title: 'Schedule Appointment',
          html: `
            <input type="text" id="name" class="swal2-input" placeholder="Your Name">
            <input type="email" id="email" class="swal2-input" placeholder="Your Email">
            <input type="date" id="date" class="swal2-input">
            <select id="time" class="swal2-select">
              <option value="">Select Time</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>2:00 PM</option>
              <option>3:00 PM</option>
            </select>
          `,
          confirmButtonText: 'Request Appointment',
          confirmButtonColor: '#1e3c72',
          preConfirm: () => {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            if (!name || !email || !date || !time) {
              Swal.showValidationMessage('Please fill all fields');
              return false;
            }
            return { name, email, date, time };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire('Appointment Requested!', `We will confirm your appointment for ${result.value.date} at ${result.value.time}.`, 'success');
          }
        });
      },
      color: '#9b59b6',
      bgLight: '#f3e5f5'
    }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://facebook.com', color: '#1877f2' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com', color: '#1da1f2' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com', color: '#e4405f' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://linkedin.com', color: '#0077b5' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com', color: '#ff0000' },
    { name: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/250788123456', color: '#25D366' }
  ];

  const faqs = [
    { q: 'How can I apply for admission?', a: 'You can apply online through our admissions portal or download the application form from the Admissions page.' },
    { q: 'When is the application deadline?', a: 'The application deadline for the 2026-2027 academic year is September 30, 2026.' },
    { q: 'Is there an entrance examination?', a: 'Yes, entrance examinations are held weekly on Saturdays. Please contact the admissions office to schedule.' },
    { q: 'Do you offer scholarships?', a: 'Yes, we offer merit-based and need-based scholarships. Visit our Admissions page for more information.' },
    { q: 'What are the school hours?', a: 'School runs from 7:45 AM to 4:00 PM, Monday through Friday.' },
    { q: 'How do I check my child\'s progress?', a: 'Parents can access the student portal using credentials provided by the school to track academic progress and attendance.' }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Gradient */}
      <section className="contact-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="contact-hero-gradient"></div>
        <div className="container contact-hero-content">
          <div className="hero-badge">
            <i className="fas fa-envelope"></i> GET IN TOUCH
          </div>
          <h1>Contact <span className="highlight">Us</span></h1>
          <p>We'd love to hear from you. Reach out with any questions, feedback, or inquiries.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support Available</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">15min</span>
              <span className="stat-label">Average Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="contact-info-card" style={{ borderBottomColor: info.color, background: info.bgLight }}>
                <div className="info-icon" style={{ background: info.color }}>
                  <i className={info.icon}></i>
                </div>
                <h3>{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx}>{detail}</p>
                ))}
                <button onClick={info.actionHandler} className="info-action-btn" style={{ color: info.color }}>
                  {info.action} <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map Section */}
      <section className="contact-form-section">
        <div className="container">
          <div className="form-map-grid">
            {/* Contact Form */}
            <div className="contact-form-container">
              <div className="form-header">
                <h2><i className="fas fa-paper-plane"></i> Send Us a Message</h2>
                <p>Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <div className="input-icon">
                      <i className="fas fa-user"></i>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address <span className="required">*</span></label>
                    <div className="input-icon">
                      <i className="fas fa-envelope"></i>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-icon">
                      <i className="fas fa-phone"></i>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <div className="input-icon">
                      <i className="fas fa-tag"></i>
                      <select name="subject" value={formData.subject} onChange={handleInputChange}>
                        <option value="">Select a subject</option>
                        <option>General Inquiry</option>
                        <option>Admissions Question</option>
                        <option>Academic Support</option>
                        <option>Complaint/Suggestion</option>
                        <option>Partnership Opportunity</option>
                        <option>Technical Support</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Message <span className="required">*</span></label>
                  <div className="input-icon textarea-icon">
                    <i className="fas fa-comment"></i>
                    <textarea 
                      name="message" 
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Write your message here..."
                      required
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Google Map */}
            <div className="map-container">
              <div className="map-card">
                <h3><i className="fas fa-map-marked-alt"></i> Find Us</h3>
                <div className="map-wrapper">
                  <iframe
                    title="ESSA Nyarugunga Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.4756!2d30.0935!3d-1.9444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca76c8d1e2e5b%3A0x4f5c7e3b2a1d8e9f!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setMapLoaded(true)}
                  ></iframe>
                  {!mapLoaded && (
                    <div className="map-loading">
                      <i className="fas fa-spinner fa-spin"></i> Loading map...
                    </div>
                  )}
                </div>
                <div className="map-address">
                  <p><i className="fas fa-location-dot"></i> Nyarugunga Sector, Kicukiro District, Kigali, Rwanda</p>
                  <button onClick={handleDirectionClick} className="directions-btn">
                    <i className="fas fa-directions"></i> Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-card">
            <div className="newsletter-icon">
              <i className="fas fa-envelope-open-text"></i>
            </div>
            <h3>Subscribe to Our Newsletter</h3>
            <p>Get the latest news, events, and updates directly in your inbox</p>
            <form onSubmit={handleNewsletterSubscribe} className="newsletter-form">
              <input type="email" name="email" placeholder="Your email address" required />
              <button type="submit">Subscribe <i className="fas fa-paper-plane"></i></button>
            </form>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="social-section">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-share-alt"></i> Connect With Us</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Follow us on social media for updates and news</p>
          </div>
          <div className="social-grid">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-card"
                style={{ '--social-color': social.color }}
              >
                <div className="social-icon" style={{ background: social.color }}>
                  <i className={social.icon}></i>
                </div>
                <h3>{social.name}</h3>
                <p>Follow us on {social.name}</p>
                <span className="follow-btn">Follow <i className="fas fa-arrow-right"></i></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion Style */}
      <section className="contact-faq">
        <div className="container">
          <div className="faq-header">
            <i className="fas fa-question-circle"></i>
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-card ${activeFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <div className="faq-question-content">
                    <i className="fas fa-question-circle"></i>
                    <h3>{faq.q}</h3>
                  </div>
                  <i className={`fas fa-chevron-${activeFaq === index ? 'up' : 'down'}`}></i>
                </div>
                <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="faq-more">
            <p>Still have questions? <Link to="/portal/login">Contact our support team</Link></p>
          </div>
        </div>
      </section>

      {/* Emergency Contact Banner */}
      <section className="emergency-banner">
        <div className="container">
          <div className="emergency-content">
            <div className="emergency-icon">
              <i className="fas fa-phone-alt"></i>
            </div>
            <div className="emergency-text">
              <h3>Emergency Contact</h3>
              <p>For urgent matters outside office hours, please call our emergency hotline</p>
            </div>
            <div className="emergency-number">
              <span>+250 788 123 456</span>
              <small>Available 24/7</small>
            </div>
            <button onClick={handleCallClick} className="emergency-btn">
              <i className="fas fa-phone"></i> Call Now
            </button>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        /* Hero Section with Gradient */
        .contact-hero {
          position: relative;
          min-height: 350px;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
        }
        .contact-hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
           background: linear-gradient(
  135deg,
  hsla(220, 60%, 18%, 0.80) 0%,
  hsla(45, 90%, 70%, 0.45) 100%
);
        }
        .contact-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          padding: 3rem 0;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(255,193,7,0.2);
          color: #ffc107;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        .contact-hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .contact-hero-content .highlight {
          color: #ffc107;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .hero-stat .stat-label {
          font-size: 0.8rem;
          opacity: 0.8;
        }
        
        /* Contact Info Cards */
        .contact-info-section {
          padding: 3rem 0;
          background: #f8f9fa;
        }
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .contact-info-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s;
          border-bottom: 3px solid;
        }
        .contact-info-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .info-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        .info-icon i {
          font-size: 1.5rem;
          color: white;
        }
        .contact-info-card h3 {
          margin-bottom: 0.5rem;
          color: #1a3a5c;
        }
        .contact-info-card p {
          font-size: 0.85rem;
          color: #666;
          margin: 0.3rem 0;
        }
        .info-action-btn {
          background: none;
          border: none;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.3s;
        }
        .info-action-btn:hover {
          transform: translateX(5px);
        }
        
        /* Contact Form Section */
        .contact-form-section {
          padding: 3rem 0;
          background: white;
        }
        .form-map-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .contact-form-container {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 20px;
        }
        .form-header {
          margin-bottom: 1.5rem;
        }
        .form-header h2 {
          color: #1a3a5c;
          margin-bottom: 0.5rem;
        }
        .form-header h2 i {
          color: #ffc107;
          margin-right: 10px;
        }
        .form-header p {
          color: #666;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.85rem;
        }
        .required {
          color: #e74c3c;
        }
        .input-icon {
          position: relative;
        }
        .input-icon i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        .input-icon.textarea-icon i {
          top: 18px;
          transform: none;
        }
        .input-icon input, .input-icon select, .input-icon textarea {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: 0.3s;
        }
        .input-icon input:focus, .input-icon select:focus, .input-icon textarea:focus {
          outline: none;
          border-color: #1a3a5c;
          box-shadow: 0 0 0 3px rgba(26,58,92,0.1);
        }
        .submit-btn {
          width: 100%;
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #ffc107;
          color: #1a3a5c;
          transform: translateY(-2px);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        /* Map Section */
        .map-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 20px;
        }
        .map-card h3 {
          margin-bottom: 1rem;
          color: #1a3a5c;
        }
        .map-card h3 i {
          color: #ffc107;
          margin-right: 8px;
        }
        .map-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }
        .map-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .map-address {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .directions-btn {
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .directions-btn:hover {
          background: #ffc107;
          color: #1a3a5c;
        }
        
        /* Newsletter Section */
        .newsletter-section {
          padding: 3rem 0;
          background: linear-gradient(135deg, #1a3a5c, #2a5298);
        }
        .newsletter-card {
          text-align: center;
          color: white;
          max-width: 600px;
          margin: 0 auto;
        }
        .newsletter-icon i {
          font-size: 3rem;
          color: #ffc107;
          margin-bottom: 1rem;
        }
        .newsletter-card h3 {
          margin-bottom: 0.5rem;
        }
        .newsletter-card p {
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        .newsletter-form {
          display: flex;
          gap: 0.5rem;
        }
        .newsletter-form input {
          flex: 1;
          padding: 12px 15px;
          border: none;
          border-radius: 30px;
          font-size: 0.9rem;
        }
        .newsletter-form button {
          background: #ffc107;
          color: #1a3a5c;
          border: none;
          padding: 12px 24px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }
        .newsletter-form button:hover {
          transform: translateY(-2px);
        }
        
        /* Social Section */
        .social-section {
          padding: 3rem 0;
          background: white;
        }
        .section-title {
          text-align: center;
          margin-bottom: 2rem;
        }
        .section-title h2 {
          font-size: 1.8rem;
          color: #1a3a5c;
        }
        .underline {
          width: 80px;
          height: 3px;
          background: #ffc107;
          margin: 0.5rem auto;
        }
        .section-subtitle {
          color: #666;
        }
        .social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .social-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          text-decoration: none;
          transition: 0.3s;
        }
        .social-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .social-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .social-icon i {
          font-size: 1.3rem;
          color: white;
        }
        .social-card h3 {
          color: #333;
          margin-bottom: 0.3rem;
        }
        .social-card p {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        .follow-btn {
          font-size: 0.8rem;
          color: var(--social-color);
          font-weight: 600;
        }
        
        /* FAQ Section */
        .contact-faq {
          padding: 3rem 0;
          background: #f8f9fa;
        }
        .faq-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .faq-header i {
          font-size: 2rem;
          color: #ffc107;
          margin-bottom: 0.5rem;
        }
        .faq-header h2 {
          color: #1a3a5c;
          margin-bottom: 0.3rem;
        }
        .faq-grid {
          max-width: 800px;
          margin: 0 auto;
        }
        .faq-card {
          background: white;
          border-radius: 12px;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: 0.3s;
        }
        .faq-question:hover {
          background: #f0f4f8;
        }
        .faq-question-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .faq-question-content i {
          color: #ffc107;
        }
        .faq-question-content h3 {
          font-size: 1rem;
          margin: 0;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          padding: 0 1.5rem;
        }
        .faq-answer.active {
          max-height: 200px;
          padding: 0 1.5rem 1rem;
        }
        .faq-answer p {
          color: #666;
          line-height: 1.6;
        }
        .faq-more {
          text-align: center;
          margin-top: 2rem;
        }
        .faq-more a {
          color: #ffc107;
          text-decoration: none;
        }
        
        /* Emergency Banner */
        .emergency-banner {
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          padding: 2rem 0;
        }
        .emergency-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .emergency-icon i {
          font-size: 2.5rem;
          color: white;
        }
        .emergency-text h3, .emergency-text p {
          color: white;
          margin: 0;
        }
        .emergency-number span {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        .emergency-number small {
          display: block;
          color: rgba(255,255,255,0.8);
        }
        .emergency-btn {
          background: white;
          color: #e74c3c;
          border: none;
          padding: 10px 24px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }
        .emergency-btn:hover {
          transform: scale(1.05);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .contact-hero-content h1 {
            font-size: 1.8rem;
          }
          .form-map-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .emergency-content {
            flex-direction: column;
            text-align: center;
          }
          .newsletter-form {
            flex-direction: column;
          }
          .contact-info-grid {
            grid-template-columns: 1fr;
          }
          .social-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
};

export default ContactPage;