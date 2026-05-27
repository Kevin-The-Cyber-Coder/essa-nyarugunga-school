import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import images
import heroBg from '../assets/hero-bg.jpg';
import campusImage from '../assets/campus.png';
import studentsImage from '../assets/students.png';
import classroomImg from '../assets/classroom.png';
import libraryImg from '../assets/library.png';
import footballImg from '../assets/football.png';
import basketballImg from '../assets/basketball.png';
import scienceLabImg from '../assets/science-lab.png';
import musicImg from '../assets/music.png';
import artImg from '../assets/art.png';
import graduationImg from '../assets/graduation.png';
import debateClubImg from '../assets/debate-club.png';
import musicClubImg from '../assets/music-club.png';
import sportsClubImg from '../assets/sports-club.png';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const AdmissionsPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Student Information
    fullName: '',
    dateOfBirth: '',
    nationality: 'Rwandan',
    nationalId: '',
    email: '',
    phone: '',
    address: '',
    // Step 2: Academic Information
    level: '',
    previousSchool: '',
    lastAverage: '',
    achievements: '',
    // Step 3: Parent/Guardian Information
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    // Step 4: Additional Info
    applyScholarship: false,
    hearAboutUs: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^(\+250|0)[7-9][0-9]{8}$/.test(formData.phone)) newErrors.phone = 'Invalid Rwanda phone number';
    if (!formData.address) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.level) newErrors.level = 'Please select a level';
    if (!formData.previousSchool) newErrors.previousSchool = 'Previous school is required';
    if (!formData.lastAverage) newErrors.lastAverage = 'Last year average is required';
    else if (formData.lastAverage < 0 || formData.lastAverage > 100) newErrors.lastAverage = 'Average must be between 0 and 100';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.parentName) newErrors.parentName = 'Parent/Guardian name is required';
    if (!formData.parentPhone) newErrors.parentPhone = 'Parent phone is required';
    else if (!/^(\+250|0)[7-9][0-9]{8}$/.test(formData.parentPhone)) newErrors.parentPhone = 'Invalid Rwanda phone number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep4()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/admissions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          title: 'Application Submitted!',
          html: `
            <div style="text-align: left;">
              <p>Thank you <strong>${formData.fullName}</strong> for applying to ESSA Nyarugunga.</p>
              <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
              <p><strong>Status:</strong> <span style="color: #ffc107;">Pending Review</span></p>
              <hr>
              <p>We have sent a confirmation email to <strong>${formData.email}</strong>.</p>
              <p>Our team will contact you within 3-5 business days.</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1e3c72'
        });
        
        // Reset form
        setFormData({
          fullName: '',
          dateOfBirth: '',
          nationality: 'Rwandan',
          nationalId: '',
          email: '',
          phone: '',
          address: '',
          level: '',
          previousSchool: '',
          lastAverage: '',
          achievements: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          parentOccupation: '',
          applyScholarship: false,
          hearAboutUs: '',
          agreeTerms: false
        });
        setCurrentStep(1);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      Swal.fire({
        title: 'Submission Failed',
        text: error.message || 'Failed to submit application. Please try again.',
        icon: 'error',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScholarshipApply = () => {
    Swal.fire({
      title: 'Scholarship Application',
      text: 'Please complete the online application form below to apply for a scholarship.',
      icon: 'info',
      confirmButtonText: 'Continue to Form',
      confirmButtonColor: '#1e3c72'
    });
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    { q: 'When does the application process start?', a: 'Applications open on January 10, 2026 and close on September 30, 2026. We encourage early application as seats are limited.' },
    { q: 'Is there an entrance examination?', a: 'Yes, entrance examinations are held weekly on Saturdays. The exam covers English, Mathematics, and General Knowledge.' },
    { q: 'Can I pay fees in installments?', a: 'Yes, we offer flexible payment plans. Please contact the finance office to discuss an installment plan that works for your family.' },
    { q: 'Is accommodation available?', a: 'Yes, we offer boarding facilities for students who live far from the school. Limited spaces available.' },
    { q: 'What is the school uniform policy?', a: 'All students are required to wear the official ESSA Nyarugunga uniform. Uniforms can be purchased from the school store.' },
    { q: 'How do I check my application status?', a: 'You can check your application status by contacting the admissions office via phone or email with your application reference number.' }
  ];

  const feeStructures = [
    { level: 'Ordinary Level', grades: 'S1 - S3', amount: '304,000', features: ['Tuition', 'Library Access', 'Computer Lab', 'Science Lab Materials', 'Sports Activities'], popular: false, note: '* Additional: Uniform (30,000 RWF) one-time' },
    { level: 'Advanced Level - ICT', grades: 'L3 - L5 SOD and CSA', amount: '349,000', features: ['Tuition', 'Library Access', 'Advanced Computer Labs', 'Internship Placement', 'Career Guidance', 'Certification Prep'], popular: true, note: '* ICT students get laptop learning access' },
    { level: 'Advanced Level - Others', grades: 'Accounting, Tourism, Food and Beverages Operation', amount: '400,000', features: ['Tuition', 'Library Access', 'Laboratory Access', 'Field Trips', 'Study Materials'], popular: false, note: '* Payment plans available upon request' }
  ];

  const hearAboutOptions = ['Social Media', 'Friend/Family', 'School Website', 'Radio/TV', 'School Event', 'Other'];

  const getStepProgress = () => {
    return ((currentStep - 1) / 3) * 100;
  };

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="admissions-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="admissions-hero-overlay"></div>
        <div className="container admissions-hero-content">
          <div className="hero-badge">
            <i className="fas fa-door-open"></i> BEGIN YOUR JOURNEY
          </div>
          <h1>Begin Your Journey to <span className="highlight">Excellence</span> at ESSA Nyarugunga</h1>
          <div className="hero-notice">
            <i className="fas fa-exclamation-triangle"></i> Limited Seats Available - Apply Early!
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="container">
          <div className="welcome-card">
            <h2><i className="fas fa-star-of-life"></i> Welcome Future Leaders!</h2>
            <p>We are delighted that you are considering ESSA Nyarugunga for your secondary education. Our admissions process is designed to be simple, transparent, and accessible to all qualified students. We look forward to welcoming you to our family!</p>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="application-process">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-clipboard-list"></i> Application Process</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Follow these simple steps to join ESSA Nyarugunga</p>
          </div>
          <div className="process-steps">
            {['Get Application Form', 'Fill & Submit', 'Entrance Assessment', 'Admission Decision', 'Enrollment'].map((step, idx) => (
              <div key={idx} className="step">
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">
                  <h3>{step}</h3>
                  <p>{idx === 0 ? 'Download the form from our website or collect it from the school administration office.' :
                     idx === 1 ? 'Complete the application form with accurate information and attach required documents.' :
                     idx === 2 ? 'Take the entrance examination (English, Mathematics, General Knowledge).' :
                     idx === 3 ? 'Receive admission notification within 7-10 working days.' :
                     'Complete registration, pay fees, and join our academic community.'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Grid */}
      <section className="requirements-section">
        <div className="container">
          <div className="requirements-grid">
            <div className="requirement-card">
              <i className="fas fa-graduation-cap"></i>
              <h3>Academic Requirements</h3>
              <ul>
                <li><i className="fas fa-check"></i> Completion of Primary 6 (for O-Level)</li>
                <li><i className="fas fa-check"></i> Completion of S3 (for A-Level)</li>
                <li><i className="fas fa-check"></i> Minimum 70% average in previous year</li>
                <li><i className="fas fa-check"></i> Passing score on entrance exam</li>
              </ul>
            </div>
            <div className="requirement-card">
              <i className="fas fa-file-alt"></i>
              <h3>Required Documents</h3>
              <ul>
                <li><i className="fas fa-check"></i> Birth Certificate (2 copies)</li>
                <li><i className="fas fa-check"></i> Last 2 years' Report Cards</li>
                <li><i className="fas fa-check"></i> 4 Passport Photos</li>
                <li><i className="fas fa-check"></i> Medical Certificate</li>
                <li><i className="fas fa-check"></i> Parent/Guardian ID copies</li>
              </ul>
            </div>
            <div className="requirement-card">
              <i className="fas fa-calendar-alt"></i>
              <h3>Important Dates</h3>
              <ul>
                <li><i className="fas fa-check"></i> Applications Open: Jan 10, 2026</li>
                <li><i className="fas fa-check"></i> Deadline: Sept 30, 2026</li>
                <li><i className="fas fa-check"></i> Entrance Exams: Weekly on Saturdays</li>
                <li><i className="fas fa-check"></i> Classes Begin: Oct 15, 2026</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Structure */}
      <section className="fee-structure">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-money-bill-wave"></i> Fee Structure</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Affordable quality education - 2026 Academic Year</p>
          </div>
          <div className="fee-grid">
            {feeStructures.map((fee, index) => (
              <div key={index} className={`fee-card ${fee.popular ? 'popular' : ''}`}>
                {fee.popular && <div className="popular-badge">Most Popular</div>}
                <div className="fee-header">
                  <h3>{fee.level}</h3>
                  <p className="fee-grades">{fee.grades}</p>
                  <div className="fee-amount">
                    <span className="currency">RWF</span>
                    <span className="amount">{fee.amount}</span>
                    <span className="period">per term</span>
                  </div>
                </div>
                <div className="fee-features">
                  <ul>
                    {fee.features.map((feature, idx) => (
                      <li key={idx}><i className="fas fa-check-circle"></i> {feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="fee-note">
                  <p>{fee.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="payment-methods">
            <p><i className="fas fa-university"></i> Bank Transfer: Bank of Kigali - Account: 000123456789</p>
            <p><i className="fas fa-mobile-alt"></i> Mobile Money: Airtel Money | MoMo Pay</p>
          </div>
        </div>
      </section>

      {/* Financial Aid */}
      <section className="financial-aid">
        <div className="container">
          <div className="aid-header">
            <i className="fas fa-hand-holding-heart"></i>
            <h2>Scholarships & Financial Aid</h2>
            <p>ESSA Nyarugunga believes that every talented student deserves access to quality education regardless of financial background.</p>
          </div>
          <div className="aid-grid">
            <div className="aid-card">
              <i className="fas fa-trophy"></i>
              <h3>Merit Scholarship</h3>
              <p>For top-performing students</p>
              <span className="aid-percent">50-100% fee waiver</span>
            </div>
            <div className="aid-card">
              <i className="fas fa-heart"></i>
              <h3>Need-Based Scholarship</h3>
              <p>For students from low-income families</p>
              <span className="aid-percent">25-75% fee waiver</span>
            </div>
            <div className="aid-card">
              <i className="fas fa-futbol"></i>
              <h3>Sports & Talent Scholarship</h3>
              <p>For exceptional athletes and artists</p>
              <span className="aid-percent">30% fee waiver</span>
            </div>
          </div>
          <div className="aid-action">
            <button onClick={handleScholarshipApply} className="btn btn-primary">
              <i className="fas fa-graduation-cap"></i> Apply for Scholarship
            </button>
            <p className="scholarship-note">* Limited scholarships available per academic year</p>
          </div>
        </div>
      </section>

      {/* Online Application Form - MULTI-STEP WIZARD */}
      <section id="application-form" className="online-application">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-globe"></i> Online Application</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Complete the multi-step form below to apply for admission</p>
          </div>
          
          <div className="application-form-container">
            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${getStepProgress()}%` }}></div>
              <div className="progress-steps">
                <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                  <div className="step-icon">1</div>
                  <span>Student Info</span>
                </div>
                <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                  <div className="step-icon">2</div>
                  <span>Academic Info</span>
                </div>
                <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                  <div className="step-icon">3</div>
                  <span>Parent Info</span>
                </div>
                <div className={`progress-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
                  <div className="step-icon">4</div>
                  <span>Review & Submit</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="application-form">
              {/* Step 1: Student Information */}
              <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                <div className="form-section">
                  <div className="section-header">
                    <i className="fas fa-user-graduate"></i>
                    <h3>Student Information</h3>
                    <span className="required-badge">All fields with * are required</span>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input 
                          type="text" 
                          name="fullName" 
                          value={formData.fullName} 
                          onChange={handleInputChange} 
                          placeholder="Enter full name"
                        />
                      </div>
                      {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                    </div>
                    <div className="form-group">
                      <label>Date of Birth <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-calendar-alt input-icon"></i>
                        <input 
                          type="date" 
                          name="dateOfBirth" 
                          value={formData.dateOfBirth} 
                          onChange={handleInputChange}
                        />
                      </div>
                      {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nationality <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-flag input-icon"></i>
                        <select name="nationality" value={formData.nationality} onChange={handleInputChange}>
                          <option>Rwandan</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>National ID</label>
                      <div className="input-wrapper">
                        <i className="fas fa-id-card input-icon"></i>
                        <input 
                          type="text" 
                          name="nationalId" 
                          value={formData.nationalId} 
                          onChange={handleInputChange} 
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="student@example.com"
                        />
                      </div>
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label>Phone Number <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input 
                          type="tel" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          placeholder="0788 123 456"
                        />
                      </div>
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Current Address <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <input 
                        type="text" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        placeholder="Full address"
                      />
                    </div>
                    {errors.address && <span className="error-text">{errors.address}</span>}
                  </div>
                </div>
              </div>

              {/* Step 2: Academic Information */}
              <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                <div className="form-section">
                  <div className="section-header">
                    <i className="fas fa-graduation-cap"></i>
                    <h3>Academic Information</h3>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Applying for Level <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-layer-group input-icon"></i>
                        <select name="level" value={formData.level} onChange={handleInputChange}>
                          <option value="">Select Level</option>
                          <option>Ordinary Level (S1-S3)</option>
                          <option>Advanced Level - Software Development</option>
                          <option>Advanced Level - Accounting</option>
                          <option>Advanced Level - Computer Systems</option>
                          <option>Advanced Level - Tourism</option>
                        </select>
                      </div>
                      {errors.level && <span className="error-text">{errors.level}</span>}
                    </div>
                    <div className="form-group">
                      <label>Previous School <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-school input-icon"></i>
                        <input 
                          type="text" 
                          name="previousSchool" 
                          value={formData.previousSchool} 
                          onChange={handleInputChange} 
                          placeholder="Name of previous school"
                        />
                      </div>
                      {errors.previousSchool && <span className="error-text">{errors.previousSchool}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Last Year Average (%) <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-chart-line input-icon"></i>
                        <input 
                          type="number" 
                          name="lastAverage" 
                          value={formData.lastAverage} 
                          onChange={handleInputChange} 
                          step="0.1" 
                          min="0" 
                          max="100" 
                          placeholder="e.g., 85.5"
                        />
                      </div>
                      {errors.lastAverage && <span className="error-text">{errors.lastAverage}</span>}
                    </div>
                    <div className="form-group">
                      <label>Achievements/Awards</label>
                      <div className="input-wrapper">
                        <i className="fas fa-trophy input-icon"></i>
                        <textarea 
                          name="achievements" 
                          value={formData.achievements} 
                          onChange={handleInputChange} 
                          rows="2" 
                          placeholder="List any academic, sports, or other achievements (optional)"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Parent/Guardian Information */}
              <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                <div className="form-section">
                  <div className="section-header">
                    <i className="fas fa-users"></i>
                    <h3>Parent/Guardian Information</h3>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Parent/Guardian Name <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-user-friends input-icon"></i>
                        <input 
                          type="text" 
                          name="parentName" 
                          value={formData.parentName} 
                          onChange={handleInputChange} 
                          placeholder="Full name"
                        />
                      </div>
                      {errors.parentName && <span className="error-text">{errors.parentName}</span>}
                    </div>
                    <div className="form-group">
                      <label>Parent Phone <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone-alt input-icon"></i>
                        <input 
                          type="tel" 
                          name="parentPhone" 
                          value={formData.parentPhone} 
                          onChange={handleInputChange} 
                          placeholder="0788 123 456"
                        />
                      </div>
                      {errors.parentPhone && <span className="error-text">{errors.parentPhone}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Parent Email</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                          type="email" 
                          name="parentEmail" 
                          value={formData.parentEmail} 
                          onChange={handleInputChange} 
                          placeholder="parent@example.com"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Parent Occupation</label>
                      <div className="input-wrapper">
                        <i className="fas fa-briefcase input-icon"></i>
                        <input 
                          type="text" 
                          name="parentOccupation" 
                          value={formData.parentOccupation} 
                          onChange={handleInputChange} 
                          placeholder="Occupation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Review & Submit */}
              <div className={`form-step ${currentStep === 4 ? 'active' : ''}`}>
                <div className="form-section">
                  <div className="section-header">
                    <i className="fas fa-clipboard-list"></i>
                    <h3>Review Your Application</h3>
                    <span className="required-badge">Please review before submitting</span>
                  </div>

                  <div className="review-section">
                    <h4>Student Information</h4>
                    <div className="review-grid">
                      <div className="review-item"><strong>Full Name:</strong> {formData.fullName || 'Not provided'}</div>
                      <div className="review-item"><strong>Date of Birth:</strong> {formData.dateOfBirth || 'Not provided'}</div>
                      <div className="review-item"><strong>Nationality:</strong> {formData.nationality}</div>
                      <div className="review-item"><strong>Email:</strong> {formData.email || 'Not provided'}</div>
                      <div className="review-item"><strong>Phone:</strong> {formData.phone || 'Not provided'}</div>
                      <div className="review-item"><strong>Address:</strong> {formData.address || 'Not provided'}</div>
                    </div>
                    
                    <h4>Academic Information</h4>
                    <div className="review-grid">
                      <div className="review-item"><strong>Level:</strong> {formData.level || 'Not selected'}</div>
                      <div className="review-item"><strong>Previous School:</strong> {formData.previousSchool || 'Not provided'}</div>
                      <div className="review-item"><strong>Last Average:</strong> {formData.lastAverage ? `${formData.lastAverage}%` : 'Not provided'}</div>
                      <div className="review-item"><strong>Achievements:</strong> {formData.achievements || 'None'}</div>
                    </div>
                    
                    <h4>Parent/Guardian Information</h4>
                    <div className="review-grid">
                      <div className="review-item"><strong>Parent Name:</strong> {formData.parentName || 'Not provided'}</div>
                      <div className="review-item"><strong>Parent Phone:</strong> {formData.parentPhone || 'Not provided'}</div>
                      <div className="review-item"><strong>Parent Email:</strong> {formData.parentEmail || 'Not provided'}</div>
                      <div className="review-item"><strong>Parent Occupation:</strong> {formData.parentOccupation || 'Not provided'}</div>
                    </div>
                  </div>

                  <div className="form-checkboxes">
                    <label className="checkbox-label">
                      <input type="checkbox" name="applyScholarship" checked={formData.applyScholarship} onChange={handleInputChange} />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">I wish to apply for a scholarship</span>
                    </label>
                    
                    <div className="form-group">
                      <label>How did you hear about us?</label>
                      <select name="hearAboutUs" value={formData.hearAboutUs} onChange={handleInputChange}>
                        <option value="">Select an option</option>
                        {hearAboutOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <label className="checkbox-label">
                      <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">I confirm that the information provided is accurate and I agree to the <Link to="/terms">terms and conditions</Link>. <span className="required">*</span></span>
                    </label>
                    {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {currentStep > 1 && (
                  <button type="button" className="btn-prev" onClick={prevStep}>
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                )}
                {currentStep < 4 && (
                  <button type="button" className="btn-next" onClick={nextStep}>
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                )}
                {currentStep === 4 && (
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Submitting Application...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-question-circle"></i> Frequently Asked Questions</h2>
            <div className="underline"></div>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <h3>{faq.q}</h3>
                  <i className={`fas fa-chevron-${activeFaq === index ? 'up' : 'down'}`}></i>
                </div>
                <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="support-section">
        <div className="container">
          <div className="support-card">
            <i className="fas fa-headset"></i>
            <h3>Need Help with Your Application?</h3>
            <p>Contact our admissions office for assistance. We're here to help you every step of the way.</p>
            <div className="support-contact">
              <div><i className="fas fa-phone-alt"></i> +250 788 123 456</div>
              <div><i className="fas fa-envelope"></i> admissions@essanyarugunga.rw</div>
              <div><i className="fas fa-clock"></i> Mon-Fri: 8AM - 5PM</div>
            </div>
            <Link to="/contact" className="btn btn-primary">Contact Us <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        /* Multi-Step Wizard Styles */
        .progress-container {
          margin-bottom: 2rem;
          padding: 0 1rem;
        }
        
        .progress-bar {
          height: 4px;
          background: linear-gradient(90deg, #1a3a5c, #ffc107);
          border-radius: 2px;
          transition: width 0.3s ease;
          margin-bottom: 1rem;
        }
        
        .progress-steps {
          display: flex;
          justify-content: space-between;
        }
        
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        
        .step-icon {
          width: 40px;
          height: 40px;
          background: #e0e0e0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #666;
          transition: all 0.3s ease;
          margin-bottom: 0.5rem;
        }
        
        .progress-step.active .step-icon {
          background: #1a3a5c;
          color: white;
          transform: scale(1.1);
        }
        
        .progress-step.completed .step-icon {
          background: #4caf50;
          color: white;
        }
        
        .progress-step span {
          font-size: 0.75rem;
          color: #666;
        }
        
        .progress-step.active span {
          color: #1a3a5c;
          font-weight: bold;
        }
        
        /* Form Steps */
        .form-step {
          display: none;
          animation: fadeIn 0.4s ease;
        }
        
        .form-step.active {
          display: block;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Form Navigation */
        .form-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
          gap: 1rem;
        }
        
        .btn-prev, .btn-next {
          padding: 12px 28px;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-prev {
          background: #f0f2f5;
          color: #666;
        }
        
        .btn-prev:hover {
          background: #e0e0e0;
          transform: translateX(-2px);
        }
        
        .btn-next {
          background: #1a3a5c;
          color: white;
          margin-left: auto;
        }
        
        .btn-next:hover {
          background: #ffc107;
          color: #1a3a5c;
          transform: translateX(2px);
        }
        
        /* Review Section */
        .review-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .review-section h4 {
          color: #1a3a5c;
          margin: 1rem 0 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #ffc107;
          display: inline-block;
        }
        
        .review-section h4:first-child {
          margin-top: 0;
        }
        
        .review-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .review-item {
          font-size: 0.85rem;
          padding: 0.5rem;
          background: white;
          border-radius: 8px;
        }
        
        /* Error Styles */
        .error-text {
          color: #dc2626;
          font-size: 0.7rem;
          margin-top: 5px;
          display: block;
        }
        
        .input-wrapper input.error,
        .input-wrapper select.error {
          border-color: #dc2626;
        }
        
        /* Required Field */
        .required {
          color: #dc2626;
        }
        
        /* Form Section Styles */
        .form-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.5rem;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid #f0f0f0;
          flex-wrap: wrap;
        }
        
        .section-header i {
          font-size: 1.3rem;
          color: #ffc107;
        }
        
        .section-header h3 {
          margin: 0;
          color: rgb(6, 33, 62);
        }
        
        .required-badge, .info-text {
          font-size: 0.7rem;
          color: #999;
          margin-left: auto;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        
        .input-wrapper input, .input-wrapper select, .input-wrapper textarea {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        
        .input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus {
          outline: none;
          border-color: #1a3a5c;
          box-shadow: 0 0 0 3px rgba(26,58,92,0.1);
        }
        
        .input-wrapper textarea {
          padding: 12px 12px 12px 40px;
          resize: vertical;
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
        
        .full-width {
          grid-column: span 2;
        }
        
        .form-checkboxes {
          margin: 1rem 0;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
          cursor: pointer;
        }
        
        .checkbox-label input {
          display: none;
        }
        
        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 4px;
          position: relative;
          transition: all 0.3s;
        }
        
        .checkbox-label input:checked + .checkbox-custom {
          background: #1a3a5c;
          border-color: #1a3a5c;
        }
        
        .checkbox-label input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
        }
        
        .checkbox-text {
          font-size: 0.85rem;
          color: #555;
        }
        
        .submit-btn {
          width: 100%;
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
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
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .full-width {
            grid-column: span 1;
          }
          
          .review-grid {
            grid-template-columns: 1fr;
          }
          
          .progress-step span {
            font-size: 0.6rem;
          }
          
          .step-icon {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }
          
          .btn-prev, .btn-next {
            padding: 10px 20px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </>
  );
};

export default AdmissionsPage;