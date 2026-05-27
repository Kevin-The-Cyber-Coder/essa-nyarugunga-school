import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import images directly from assets folder
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

// Fallback image URLs
const fallbackImages = {
  heroBg: heroBg,
  campusImage: campusImage,
  studentsImage: studentsImage,
  classroomImg: classroomImg,
  libraryImg: libraryImg,
  scienceLabImg: scienceLabImg,
  footballImg: footballImg,
  musicImg: musicImg,
  graduationImg: graduationImg
};

const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('ordinary');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLearnMore = (programName) => {
    Swal.fire({
      title: programName,
      text: `For more information about ${programName}, please contact the academic office or visit the school.`,
      icon: 'info',
      confirmButtonText: 'Contact Admissions',
      confirmButtonColor: '#1e3c72'
    });
  };

  const combinations = [
    {
      id: 1,
      name: 'Software Development',
      icon: 'fas fa-code',
      subtitle: 'ICT Option',
      subjects: ['Computer Science', 'Mathematics', 'Physics', 'Programming Languages'],
      careerPath: 'Software Engineer, Web Developer, IT Consultant, Database Administrator',
      color: '#3498db'
    },
    {
      id: 2,
      name: 'Accounting',
      icon: 'fas fa-chart-line',
      subtitle: 'Economics Option',
      subjects: ['Accounting', 'Economics', 'Mathematics', 'Entrepreneurship'],
      careerPath: 'Accountant, Auditor, Financial Analyst, Tax Consultant, Banker',
      color: '#27ae60'
    },
    {
      id: 3,
      name: 'Computer Systems & Architecture',
      icon: 'fas fa-microchip',
      subtitle: 'ICT Option',
      subjects: ['Computer Architecture', 'Networking', 'Mathematics', 'Electronics'],
      careerPath: 'Network Engineer, Systems Administrator, Hardware Engineer, IT Support',
      color: '#9b59b6'
    },
    {
      id: 4,
      name: 'Tourism & Hospitality',
      icon: 'fas fa-umbrella-beach',
      subtitle: 'Languages Option',
      subjects: ['Tourism', 'Hospitality Management', 'French', 'English'],
      careerPath: 'Tour Operator, Hotel Manager, Travel Agent, Event Planner',
      color: '#e74c3c'
    },
    {
      id: 5,
      name: 'Building and Construction',
      icon: 'fas fa-building',
      subtitle: 'BDC Option',
      subjects: ['Stone Structure', 'Building Management', 'Physics', 'Mathematics'],
      careerPath: 'Building Engineer, Construction Manager, Site Supervisor',
      color: '#f39c12'
    },
    {
      id: 6,
      name: 'Food and Beverages Operation',
      icon: 'fas fa-utensils',
      subtitle: 'FBO Option',
      subjects: ['Food Preparation', 'Beverages Management', 'French', 'English'],
      careerPath: 'Kitchen Operator, Cook, Restaurant Manager, Event Planner',
      color: '#1abc9c'
    }
  ];

  const departments = [
    { name: 'ICT Department', icon: 'fas fa-laptop-code', hod: 'Mr. Elissa Ntihinduka', teachers: 6, description: 'Programming, networking, database management, and computer maintenance.' },
    { name: 'Economics Department', icon: 'fas fa-chart-line', hod: 'Coming Soon....', teachers: 5, description: 'Accounting, economics, entrepreneurship, and business studies.' },
    { name: 'Tourism Department', icon: 'fas fa-umbrella-beach', hod: 'Coming Soon....', teachers: 4, description: 'Tourism management, hospitality, customer service, and cultural studies.' },
    { name: 'Food and Beverages', icon: 'fas fa-utensils', hod: 'Mama Culinary', teachers: 4, description: 'Food Preparation, Kitchen Management, Beverages Operation.' },
    { name: 'Building and Construction', icon: 'fas fa-building', hod: 'Delphin and Phocus', teachers: 5, description: 'Cement Workflows, Stone Structure, Chemistry, Physics, Mathematics.' },
    { name: 'Ordinary Level', icon: 'fas fa-book', hod: 'Coming Soon......', teachers: 10, description: 'Biology, Physics, Chemistry, Mathematics, History, Geography, etc.' }
  ];

  const calendarEvents = [
    { month: 'Sept', day: '10', title: 'Term 1 Begins', description: 'Opening ceremony and classes commence' },
    { month: 'Nov', day: '25-30', title: 'Term 1 Exams', description: 'End of term examinations' },
    { month: 'Jan', day: '10', title: 'Term 2 Begins', description: 'Start of second term' },
    { month: 'Mar', day: '10-20', title: 'Term 2 Exams', description: 'Mid-year examinations' },
    { month: 'April', day: '20', title: 'Term 3 Begins', description: 'Final term of the academic year' },
    { month: 'June', day: '1-5', title: 'National Practical Exams', description: 'L3 & L5 National Practical Examinations' },
    { month: 'June', day: '15', title: 'NESA School Exams', description: 'End of Year NESA prepared Exams' },
    { month: 'July', day: '12', title: 'National Theory Exams', description: 'All Candidates Theory National Examinations' },
    { month: 'Aug', day: '5', title: 'Academic Year Ends', description: 'End of year closure' }
  ];

  const resources = [
    { name: 'School Library', icon: 'fas fa-book', description: 'Over 5,000 books including textbooks, references, fiction, and periodicals.', detail: 'Mon-Fri: 8AM - 5PM' },
    { name: 'Computer Labs', icon: 'fas fa-laptop', description: 'Three modern computer labs with 50+ computers and high-speed internet.', detail: '3 Labs | 50+ PCs' },
    { name: 'Science Laboratory', icon: 'fas fa-flask', description: 'Fully equipped Physics, Chemistry, and Biology laboratories.', detail: '3 Specialized Labs' },
    { name: 'E-Learning Platform', icon: 'fas fa-wifi', description: 'Access to online resources, digital assignments, and virtual classrooms.', detail: '24/7 Access' }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Gradient Overlay */}
      <section className="academics-hero" style={{ backgroundImage: `url(${fallbackImages.heroBg})` }}>
        <div className="academics-hero-gradient"></div>
        <div className="container academics-hero-content">
          <div className="hero-badge">
            <i className="fas fa-graduation-cap"></i> ACADEMIC EXCELLENCE
          </div>
          <h1>Academics at <span className="highlight">ESSA Nyarugunga</span></h1>
          <p>Excellence in Education | Diverse Programs | Holistic Development</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Pass Rate</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">6+</span>
              <span className="stat-label">Programs</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">30+</span>
              <span className="stat-label">Teachers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Overview - Left aligned */}
      <section className="academics-overview">
        <div className="container">
          <div className="overview-grid">
            <div className="overview-content">
              <div className="section-badge">Academic Excellence</div>
              <h2>Quality Education <span className="highlight">For Every Student</span></h2>
              <p>At ESSA Nyarugunga, we follow the Rwandan national curriculum enhanced with modern teaching methodologies. Our academic programs are designed to develop critical thinking, problem-solving skills, and practical knowledge.</p>
              <p>We offer both Ordinary Level (S1-S3) and Advanced Level (S4-S6) programs with various combinations to suit different career paths.</p>
              <div className="academic-stats">
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Pass Rate</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">6+</span>
                  <span className="stat-label">Programs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">30+</span>
                  <span className="stat-label">Teachers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">1:15</span>
                  <span className="stat-label">Teacher Ratio</span>
                </div>
              </div>
            </div>
            <div className="overview-image">
              <img src={fallbackImages.studentsImage} alt="Students in class" />
            </div>
          </div>
        </div>
      </section>

      {/* Academic Levels Tabs */}
      <section className="academics-levels">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-layer-group"></i> Academic Levels</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Choose your path to success</p>
          </div>
          
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'ordinary' ? 'active' : ''}`} onClick={() => setActiveTab('ordinary')}>
              Ordinary Level (S1-S3)
            </button>
            <button className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>
              Advanced Level (L3-L5)
            </button>
          </div>

          {/* Ordinary Level Content */}
          {activeTab === 'ordinary' && (
            <div className="tab-content">
              <div className="level-grid">
                <div className="level-card">
                  <i className="fas fa-book-open"></i>
                  <h3>Core Subjects</h3>
                  <ul>
                    <li><i className="fas fa-check"></i> Mathematics</li>
                    <li><i className="fas fa-check"></i> English Language</li>
                    <li><i className="fas fa-check"></i> French</li>
                    <li><i className="fas fa-check"></i> Kinyarwanda</li>
                    <li><i className="fas fa-check"></i> Sciences (Physics, Chemistry, Biology)</li>
                    <li><i className="fas fa-check"></i> Social Studies</li>
                    <li><i className="fas fa-check"></i> Computer Science</li>
                    <li><i className="fas fa-check"></i> Religion & Ethics</li>
                  </ul>
                </div>
                <div className="level-card">
                  <i className="fas fa-chart-line"></i>
                  <h3>Electives</h3>
                  <ul>
                    <li><i className="fas fa-check"></i> Entrepreneurship</li>
                    <li><i className="fas fa-check"></i> Art & Design</li>
                    <li><i className="fas fa-check"></i> Music</li>
                    <li><i className="fas fa-check"></i> Physical Education</li>
                    <li><i className="fas fa-check"></i> Agriculture</li>
                    <li><i className="fas fa-check"></i> Home Economics</li>
                  </ul>
                </div>
                <div className="level-card">
                  <i className="fas fa-clock"></i>
                  <h3>Assessment</h3>
                  <ul>
                    <li><i className="fas fa-check"></i> Continuous Assessment (30%)</li>
                    <li><i className="fas fa-check"></i> Term Exams (30%)</li>
                    <li><i className="fas fa-check"></i> National Exams (40%)</li>
                    <li><i className="fas fa-check"></i> Projects & Practicals</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Level Content */}
          {activeTab === 'advanced' && (
            <div className="tab-content">
              <div className="advanced-intro">
                <p>At Advanced Level, students choose combinations based on their career aspirations. Each combination is carefully designed to prepare students for university education and professional careers.</p>
              </div>
              
              <div className="combinations-grid">
                {combinations.map(combo => (
                  <div key={combo.id} className="combination-card" style={{ borderTop: `4px solid ${combo.color}` }}>
                    <div className="combination-icon" style={{ background: combo.color }}>
                      <i className={combo.icon}></i>
                    </div>
                    <h3>{combo.name}</h3>
                    <p className="combination-subtitle">{combo.subtitle}</p>
                    <div className="subjects">
                      <h4>Subjects:</h4>
                      <ul>
                        {combo.subjects.map((subject, idx) => (
                          <li key={idx}>{subject}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="career-path">
                      <h4>Career Path:</h4>
                      <p>{combo.careerPath}</p>
                    </div>
                    <button className="learn-more" onClick={() => handleLearnMore(combo.name)}>
                      Learn More <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Academic Departments */}
      <section className="academics-departments">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-building"></i> Academic Departments</h2>
            <div className="underline"></div>
          </div>
          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div key={index} className="dept-card">
                <i className={dept.icon}></i>
                <h3>{dept.name}</h3>
                <p>{dept.description}</p>
                <div className="dept-staff">
                  <span><i className="fas fa-user-tie"></i> HOD: {dept.hod}</span>
                  <span><i className="fas fa-chalkboard-user"></i> {dept.teachers} Teachers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Calendar */}
      <section className="academics-calendar">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-calendar-alt"></i> Academic Calendar 2026</h2>
            <div className="underline"></div>
          </div>
          <div className="calendar-grid">
            {calendarEvents.map((event, index) => (
              <div key={index} className="calendar-item">
                <div className="calendar-date">
                  <span className="month">{event.month}</span>
                  <span className="day">{event.day}</span>
                </div>
                <div className="calendar-event">
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="calendar-note">
            <i className="fas fa-info-circle"></i>
            <p>Dates are subject to change. Parents and students will be notified of any changes.</p>
          </div>
        </div>
      </section>

      {/* Grading System */}
      <section className="academics-grading">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-chart-simple"></i> Grading System</h2>
            <div className="underline"></div>
          </div>
          <div className="grading-grid">
            <div className="grading-card">
              <h3>Ordinary Level (S1-S3)</h3>
              <table className="grading-table">
                <thead>
                  <tr><th>Grade</th><th>Percentage</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td>A</td><td>80-100%</td><td>Excellent</td></tr>
                  <tr><td>B</td><td>70-79%</td><td>Very Good</td></tr>
                  <tr><td>C</td><td>60-69%</td><td>Good</td></tr>
                  <tr><td>D</td><td>50-59%</td><td>Satisfactory</td></tr>
                  <tr><td>E</td><td>40-49%</td><td>Pass</td></tr>
                  <tr><td>F</td><td>Below 40%</td><td>Fail</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grading-card">
              <h3>Advanced Level (L3-L5)</h3>
              <table className="grading-table">
                <thead>
                  <tr><th>Grade</th><th>Points</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td>A</td><td>6</td><td>Excellent</td></tr>
                  <tr><td>B+</td><td>5</td><td>Very Good</td></tr>
                  <tr><td>B</td><td>4</td><td>Good</td></tr>
                  <tr><td>C</td><td>3</td><td>Satisfactory</td></tr>
                  <tr><td>D</td><td>2</td><td>Pass</td></tr>
                  <tr><td>E</td><td>1</td><td>Marginal Pass</td></tr>
                  <tr><td>F</td><td>0</td><td>Fail</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Resources */}
      <section className="academics-resources">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-book-open"></i> Learning Resources</h2>
            <div className="underline"></div>
          </div>
          <div className="resources-grid">
            {resources.map((resource, index) => (
              <div key={index} className="resource-card">
                <i className={resource.icon}></i>
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <span className="resource-hours"><i className="fas fa-clock"></i> {resource.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Support */}
      <section className="academics-support">
        <div className="container">
          <div className="support-box">
            <div className="support-icon">
              <i className="fas fa-chalkboard-user"></i>
            </div>
            <div className="support-content">
              <h3>Academic Support & Remedial Classes</h3>
              <p>We offer extra classes, tutoring, and academic counseling to ensure every student succeeds. Remedial programs are available for students who need additional support in any subject.</p>
              <div className="support-features">
                <span><i className="fas fa-clock"></i> After-school Tutoring</span>
                <span><i className="fas fa-users"></i> Peer Mentoring</span>
                <span><i className="fas fa-chart-line"></i> Progress Tracking</span>
                <span><i className="fas fa-calendar"></i> Saturday Classes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Styles */}
      <style>{`
        /* Hero Section with Gradient Overlay */
        .academics-hero {
          position: relative;
          min-height: 400px;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        
        .academics-hero-gradient {
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
        
        .academics-hero-content {
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
        
        .academics-hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .academics-hero-content .highlight {
          color: #ffc107;
        }
        
        .academics-hero-content p {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }
        
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
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
        
        /* Overview Section */
        .academics-overview {
          padding: 4rem 0;
          background: white;
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        .overview-content {
          text-align: left;
        }
        
        .section-badge {
          display: inline-block;
          background: #ffc10720;
          color: #ffc107;
          padding: 0.3rem 1rem;
          border-radius: 30px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .overview-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #1e3c72;
        }
        
        .overview-content .highlight {
          color: #ffc107;
        }
        
        .overview-content p {
          color: #555;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .academic-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .stat-item {
          text-align: center;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 12px;
        }
        
        .stat-item .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e3c72;
        }
        
        .stat-item .stat-label {
          font-size: 0.75rem;
          color: #666;
        }
        
        .overview-image img {
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        /* Tabs Section */
        .academics-levels {
          padding: 4rem 0;
          background: #f8f9fa;
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .section-title h2 {
          font-size: 2rem;
          color: #1e3c72;
        }
        
        .section-title h2 i {
          color: #ffc107;
          margin-right: 10px;
        }
        
        .underline {
          width: 80px;
          height: 3px;
          background: #ffc107;
          margin: 10px auto;
        }
        
        .section-subtitle {
          color: #666;
          font-size: 0.9rem;
        }
        
        .tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .tab-btn {
          padding: 0.8rem 2rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .tab-btn.active {
          background: #1e3c72;
          border-color: #1e3c72;
          color: white;
        }
        
        .level-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        
        .level-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: left;
        }
        
        .level-card i {
          font-size: 2rem;
          color: #1e3c72;
          margin-bottom: 1rem;
        }
        
        .level-card h3 {
          margin-bottom: 1rem;
          color: #1e3c72;
        }
        
        .level-card ul {
          list-style: none;
          padding: 0;
        }
        
        .level-card ul li {
          margin: 0.5rem 0;
          font-size: 0.85rem;
        }
        
        .level-card ul li i {
          font-size: 0.8rem;
          color: #ffc107;
          margin-right: 8px;
        }
        
        /* Combinations Grid */
        .advanced-intro {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
        }
        
        .combinations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .combination-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          transition: transform 0.3s;
          text-align: left;
        }
        
        .combination-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .combination-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .combination-icon i {
          font-size: 1.5rem;
          color: white;
        }
        
        .combination-card h3 {
          margin-bottom: 0.3rem;
          color: #1e3c72;
        }
        
        .combination-subtitle {
          color: #ffc107;
          font-weight: 600;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .subjects, .career-path {
          margin: 1rem 0;
        }
        
        .subjects h4, .career-path h4 {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .subjects ul {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          list-style: none;
          padding: 0;
        }
        
        .subjects ul li {
          background: #f0f2f5;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        
        .career-path p {
          font-size: 0.85rem;
          color: #555;
        }
        
        .learn-more {
          background: none;
          border: none;
          color: #ffc107;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        
        /* Departments Grid */
        .academics-departments {
          padding: 4rem 0;
          background: white;
        }
        
        .departments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .dept-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: left;
        }
        
        .dept-card i {
          font-size: 2rem;
          color: #1e3c72;
          margin-bottom: 1rem;
        }
        
        .dept-card h3 {
          margin-bottom: 0.5rem;
          color: #1e3c72;
        }
        
        .dept-card p {
          color: #666;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }
        
        .dept-staff {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #888;
        }
        
        /* Calendar */
        .academics-calendar {
          padding: 4rem 0;
          background: #f8f9fa;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .calendar-item {
          display: flex;
          gap: 1rem;
          background: white;
          padding: 1rem;
          border-radius: 12px;
        }
        
        .calendar-date {
          text-align: center;
          background: #1e3c72;
          color: white;
          padding: 0.8rem;
          border-radius: 12px;
          min-width: 70px;
        }
        
        .calendar-date .month {
          display: block;
          font-size: 0.7rem;
        }
        
        .calendar-date .day {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .calendar-event h4 {
          margin-bottom: 0.3rem;
          color: #1e3c72;
        }
        
        .calendar-event p {
          font-size: 0.8rem;
          color: #666;
        }
        
        .calendar-note {
          margin-top: 2rem;
          background: #fff8e7;
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        
        /* Grading */
        .academics-grading {
          padding: 4rem 0;
          background: white;
        }
        
        .grading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .grading-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 16px;
        }
        
        .grading-card h3 {
          text-align: center;
          margin-bottom: 1rem;
          color: #1e3c72;
        }
        
        .grading-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .grading-table th, .grading-table td {
          padding: 0.8rem;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .grading-table th {
          background: #1e3c72;
          color: white;
        }
        
        /* Resources */
        .academics-resources {
          padding: 4rem 0;
          background: #f8f9fa;
        }
        
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .resource-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: center;
        }
        
        .resource-card i {
          font-size: 2rem;
          color: #1e3c72;
          margin-bottom: 1rem;
        }
        
        .resource-card h3 {
          margin-bottom: 0.5rem;
          color: #1e3c72;
        }
        
        .resource-card p {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 1rem;
        }
        
        .resource-hours {
          font-size: 0.75rem;
          color: #ffc107;
        }
        
        /* Support */
        .academics-support {
          padding: 4rem 0;
          background: linear-gradient(135deg, #1e3c72, #2a5298);
          color: white;
        }
        
        .support-box {
          display: flex;
          gap: 2rem;
          align-items: center;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .support-icon i {
          font-size: 3rem;
          color: #ffc107;
        }
        
        .support-content h3 {
          margin-bottom: 0.5rem;
        }
        
        .support-content p {
          opacity: 0.9;
          margin-bottom: 1rem;
        }
        
        .support-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        
        .support-features span {
          background: rgba(255,255,255,0.15);
          padding: 0.3rem 1rem;
          border-radius: 30px;
          font-size: 0.75rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          
          .level-grid {
            grid-template-columns: 1fr;
          }
          
          .academic-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .tabs {
            flex-direction: column;
            align-items: center;
          }
          
          .support-box {
            flex-direction: column;
            text-align: center;
          }
          
          .combinations-grid {
            grid-template-columns: 1fr;
          }
          
          .hero-stats {
            gap: 1rem;
          }
          
          .academics-hero-content h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </>
  );
};

export default AcademicsPage;