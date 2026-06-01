import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import all images directly from assets folder
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

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const leadershipTeam = [
    { 
      name: 'Ingabire Jolly', 
      title: 'Headmistress / Director', 
      image: campusImage,
      education: 'Experienced in Educational Leadership',
      experience: '10+ years experience'
    },
    { 
      name: 'Lenah', 
      title: 'Assistant Administrator', 
      image: studentsImage,
      education: 'Experience in Educational and Social Affairs Management',
      experience: '10+ years experience'
    },
    { 
      name: 'Kabutore Boniface', 
      title: 'Director of Studies', 
      image: graduationImg,
      education: 'Experience in Curriculum Development and Academic Management',
      experience: '12+ years experience'
    },
    { 
      name: 'AineByoona James', 
      title: 'Dean of Discipline', 
      image: graduationImg,
      education: 'Experience in Behaviours Management and Discipline Conduct',
      experience: '15+ years experience'
    },
    { 
      name: 'Coming Soon.....', 
      title: 'Dean of Discipline', 
      image: graduationImg,
      education: 'Experience in Behaviours Management and Discipline Conduct',
      experience: '11+ years experience'
    },
    { 
      name: 'Coming Soon.....', 
      title: 'Accountant', 
      image: graduationImg,
      education: 'Experience in Accounting and Budgeting',
      experience: '12+ years experience'
    }
  ];

  const stats = [
    { number: '2006', label: 'Year Founded', icon: 'fas fa-calendar-alt' },
    { number: '800+', label: 'Current Students', icon: 'fas fa-user-graduate' },
    { number: '20+', label: 'Qualified Teachers', icon: 'fas fa-chalkboard-user' },
    { number: '8  5%', label: 'Pass Rate', icon: 'fas fa-chart-line' }
  ];

  const facilities = [
    { name: 'Modern Classrooms', description: 'Spacious, well-lit classrooms with smart boards for interactive learning', icon: 'fas fa-chalkboard', image: classroomImg },
    { name: 'Modern Dormitories', description: 'Comfortable boarding facilities for both boys and girls with 24/7 supervision', icon: 'fas fa-bed', image: scienceLabImg },
    { name: 'Computer Lab', description: 'State-of-the-art computers with high-speed internet and modern software', icon: 'fas fa-laptop-code', image: libraryImg },
    { name: 'Library', description: 'Well-stocked library with reference books, textbooks, and e-resources', icon: 'fas fa-book', image: libraryImg },
    { name: 'Sports Complex', description: 'Football field, basketball court, volleyball court, and athletic facilities', icon: 'fas fa-futbol', image: footballImg },
    { name: 'Main Hall', description: '500+ seat multipurpose hall for assemblies, events, and meetings', icon: 'fas fa-building', image: graduationImg }
  ];

  const handleContactClick = () => {
    Swal.fire({
      title: 'Contact Us',
      text: 'Would you like to visit our school or speak with admissions?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Call Admissions',
      cancelButtonText: 'Email Us',
      confirmButtonColor: '#1e3c72'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Call Us',
          text: 'Call +250 788 123 456 to speak with our admissions office.',
          icon: 'info',
          confirmButtonColor: '#1e3c72'
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Email Us',
          text: 'Send an email to admissions@essanyarugunga.rw',
          icon: 'info',
          confirmButtonColor: '#1e3c72'
        });
      }
    });
  };

  const handleLeadershipClick = (leader) => {
    Swal.fire({
      title: leader.name,
      html: `
        <div style="text-align: left;">
          <p><strong>Position:</strong> ${leader.title}</p>
          <p><strong>Education:</strong> ${leader.education}</p>
          <p><strong>Experience:</strong> ${leader.experience}</p>
          <hr>
          <p>${leader.name} is dedicated to providing quality education and leadership at ESSA Nyarugunga.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#1e3c72'
    });
  };

  return (
    <>
      <Navbar />
      
      {/* Hero Section - Centered */}
      <section className="about-hero" style={{ backgroundImage: `url(${heroBg})` }}>
       
        <div className="about-hero-overlay"></div>
        <div className="container about-hero-content">
          <div className="hero-badge">
            <i className="fas fa-info-circle"></i> ABOUT OUR SCHOOL
          </div>
          <h1>Excellence in <span className="highlight">Technology & Administrative</span> Education</h1>
          <p>For over 20 years, we have been shaping the future leaders of Rwanda through quality education, discipline, and holistic development.</p>
          <div className="hero-buttons">
            <button onClick={handleContactClick} className="btn btn-primary"><i className="fas fa-phone-alt"></i> Contact Admissions</button>
            <Link to="/admissions" className="btn btn-secondary"><i className="fas fa-user-graduate"></i> Apply Now</Link>
          </div>
        </div>
        
      </section>

      {/* Stats Bar Section */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <i className={stat.icon}></i>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section - Left aligned text, right aligned image */}
      <section className="our-story">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-history"></i> Our Story</h2>
            <div className="underline"></div>
            <p className="section-subtitle">The journey of excellence since 2006</p>
          </div>
          <div className="story-grid">
            <div className="story-text">
              <p>ESSA Nyarugunga (Ecole Secondaire des Sciences et Administrative) was established in <strong>2006</strong> with a vision to provide quality secondary education in Kigali's Kicukiro District. What started as a small institution has now grown into one of the most respected secondary schools in Rwanda.</p>
              <p>Over the years, we have consistently produced outstanding graduates who have gone on to excel in top universities and various professional fields. Our commitment to <strong>academic excellence, character formation, and holistic development</strong> has made us a school of choice for parents seeking quality education for their children.</p>
              <p>Today, ESSA Nyarugunga serves over <strong>800 students</strong> with a dedicated team of <strong>30+ qualified teachers</strong>, offering programs in Software Development, Accounting, Computer Systems and Architecture, Building and Construction, Food and Beverages Operation, and Tourism & Hospitality.</p>
              <div className="story-highlights">
                <div className="highlight-item">
                  <i className="fas fa-trophy"></i>
                  <div>
                    <h4>Rank Recognition</h4>
                    <p>Ranked among top schools in Kigali for Technology education</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <i className="fas fa-award"></i>
                  <div>
                    <h4>Ministry Accredited</h4>
                    <p>Fully accredited by the Ministry of Education, REB, and RTB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="story-image">
              <img src={campusImage} alt="ESSA Nyarugunga Campus" />
              <div className="experience-badge">
                <span>20+</span>
                <p>Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Vision Values Section */}
      <section className="mission-vision">
        <div className="container">
          <div className="mvv-grid">
            <div className="mvv-card mission">
              <div className="mvv-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h3>Our Mission</h3>
              <p>To provide holistic education that nurtures intellectual curiosity, moral integrity, and leadership skills, preparing students for higher education and responsible citizenship in Rwanda and beyond.</p>
            </div>
            <div className="mvv-card vision">
              <div className="mvv-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Our Vision</h3>
              <p>To be a center of excellence in Technology and Administrative Education, producing graduates who are innovative, ethical, and ready to contribute to national development.</p>
            </div>
            <div className="mvv-card values">
              <div className="mvv-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Core Values</h3>
              <ul>
                <li><i className="fas fa-check-circle"></i> Excellence - Striving for the highest standards</li>
                <li><i className="fas fa-check-circle"></i> Integrity - Upholding honesty and moral principles</li>
                <li><i className="fas fa-check-circle"></i> Community - Fostering an inclusive environment</li>
                <li><i className="fas fa-check-circle"></i> Innovation - Embracing new ideas and technologies</li>
                <li><i className="fas fa-check-circle"></i> Discipline - Building strong character and work ethic</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section - Grid layout */}
      <section className="facilities">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-building"></i> Our Facilities</h2>
            <div className="underline"></div>
            <p className="section-subtitle">State-of-the-art infrastructure for modern education</p>
          </div>
          <div className="facilities-grid">
            {facilities.map((facility, index) => (
              <div key={index} className="facility-card">
                <div className="facility-image">
                  <img src={facility.image} alt={facility.name} />
                  <div className="facility-overlay">
                    <i className={facility.icon}></i>
                  </div>
                </div>
                <div className="facility-info">
                  <h4><i className={facility.icon}></i> {facility.name}</h4>
                  <p>{facility.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="leadership">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-users"></i> Administration Leaders</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Dedicated leaders committed to excellence</p>
          </div>
          <div className="leadership-grid">
            {leadershipTeam.map((leader, index) => (
              <div key={index} className="leader-card" onClick={() => handleLeadershipClick(leader)}>
                <div className="leader-image">
                  <img src={leader.image} alt={leader.name} />
                </div>
                <h4>{leader.name}</h4>
                <p className="leader-title">{leader.title}</p>
                <div className="leader-details">
                  <span><i className="fas fa-graduation-cap"></i> {leader.education.substring(0, 40)}...</span>
                </div>
                <button className="read-more-btn">View Profile <i className="fas fa-arrow-right"></i></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Life Section - Left aligned */}
      <section className="student-life-preview">
        <div className="container">
          <div className="student-life-grid">
            <div className="student-life-content">
              <div className="section-title left">
                <h2><i className="fas fa-users"></i> Student Life at ESSA</h2>
                <div className="underline left-underline"></div>
              </div>
              <p>At ESSA Nyarugunga, we believe education extends beyond the classroom. Our students enjoy a vibrant campus life with numerous opportunities for personal growth, leadership, and recreation.</p>
              <div className="activities-list">
                <div className="activity-item">
                  <i className="fas fa-microphone-alt"></i>
                  <div>
                    <h4>Clubs & Societies</h4>
                    <p>Debate, Music, Sports, Science, and more</p>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="fas fa-church"></i>
                  <div>
                    <h4>Spiritual Growth</h4>
                    <p>Daily prayers, weekly services, and retreats</p>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="fas fa-heart"></i>
                  <div>
                    <h4>Community Service</h4>
                    <p>Outreach programs and charitable activities</p>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="fas fa-trophy"></i>
                  <div>
                    <h4>Competitions</h4>
                    <p>Academic, sports, and cultural events</p>
                  </div>
                </div>
              </div>
              <Link to="/gallery" className="btn btn-outline">View Gallery <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="student-life-image">
              <img src={studentsImage} alt="Students at ESSA" />
              <div className="floating-card">
                <i className="fas fa-smile"></i>
                <p>95% Student Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section - Centered */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Join ESSA Nyarugunga?</h2>
            <p>Take the first step towards a bright future. Applications are now open for the 2026-2027 academic year.</p>
            <div className="cta-buttons">
              <Link to="/admissions" className="btn btn-primary"><i className="fas fa-download"></i> Download Application</Link>
              <Link to="/contact" className="btn btn-secondary"><i className="fas fa-calendar-alt"></i> Schedule a Visit</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Styles for alignment */}
      <style>{`
        /* Stats Bar Section */
        .stats-bar {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 3rem 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }
        
        .stat-item i {
          font-size: 2rem;
          color: #ffc107;
          margin-bottom: 0.5rem;
          display: inline-block;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        
        .stat-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }
        
        /* Story Grid */
        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        .story-text {
          text-align: left;
        }
        
        .story-text p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: #555;
        }
        
        .story-highlights {
          margin-top: 1.5rem;
        }
        
        .highlight-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .highlight-item i {
          font-size: 1.8rem;
          color: #ffc107;
        }
        
        .highlight-item h4 {
          margin-bottom: 0.3rem;
          color: #1e3c72;
        }
        
        .highlight-item p {
          font-size: 0.85rem;
          margin: 0;
        }
        
        .story-image {
          position: relative;
        }
        
        .story-image img {
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .experience-badge {
          position: absolute;
          bottom: -20px;
          right: -20px;
          background: #ffc107;
          color: #1e3c72;
          padding: 1rem;
          border-radius: 50%;
          width: 100px;
          height: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .experience-badge span {
          font-size: 1.8rem;
          font-weight: 700;
        }
        
        .experience-badge p {
          font-size: 0.7rem;
          text-align: center;
          margin: 0;
        }
        
        /* Mission Vision Grid */
        .mvv-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        
        .mvv-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        
        .mvv-card:hover {
          transform: translateY(-5px);
        }
        
        .mvv-icon {
          width: 70px;
          height: 70px;
          background: #1e3c72;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        
        .mvv-icon i {
          font-size: 1.8rem;
          color: #ffc107;
        }
        
        .mvv-card h3 {
          margin-bottom: 1rem;
          color: #1e3c72;
        }
        
        .mvv-card p {
          color: #666;
          line-height: 1.6;
        }
        
        .mvv-card ul {
          text-align: left;
          list-style: none;
          padding: 0;
        }
        
        .mvv-card ul li {
          margin: 0.5rem 0;
          font-size: 0.85rem;
        }
        
        .mvv-card ul li i {
          color: #ffc107;
          margin-right: 8px;
        }
        
        /* Facilities Grid */
        .facilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        .facility-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0,0,0,0.05);
          transition: transform 0.3s;
        }
        
        .facility-card:hover {
          transform: translateY(-3px);
        }
        
        .facility-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .facility-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .facility-card:hover .facility-image img {
          transform: scale(1.05);
        }
        
        .facility-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(30,60,114,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .facility-card:hover .facility-overlay {
          opacity: 1;
        }
        
        .facility-overlay i {
          font-size: 2rem;
          color: #ffc107;
        }
        
        .facility-info {
          padding: 1rem;
          text-align: left;
        }
        
        .facility-info h4 {
          margin-bottom: 0.5rem;
          color: #1e3c72;
        }
        
        .facility-info h4 i {
          margin-right: 8px;
          color: #ffc107;
        }
        
        .facility-info p {
          font-size: 0.85rem;
          color: #666;
          line-height: 1.5;
        }
        
        /* Leadership Grid */
        .leadership-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .leader-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          text-align: center;
          cursor: pointer;
          transition: transform 0.3s;
          box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        
        .leader-card:hover {
          transform: translateY(-5px);
        }
        
        .leader-image {
          height: 250px;
          overflow: hidden;
        }
        
        .leader-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .leader-card h4 {
          margin: 1rem 0 0.3rem;
          color: #1e3c72;
        }
        
        .leader-title {
          color: #ffc107;
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        
        .leader-details {
          padding: 0 1rem;
          font-size: 0.75rem;
          color: #666;
        }
        
        .read-more-btn {
          margin: 1rem;
          background: #f0f2f5;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: 0.3s;
        }
        
        .read-more-btn:hover {
          background: #1e3c72;
          color: white;
        }
        
        /* Student Life Grid */
        .student-life-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        .student-life-content {
          text-align: left;
        }
        
        .section-title.left {
          text-align: left;
        }
        
        .left-underline {
          margin: 10px 0 0 0;
        }
        
        .activities-list {
          margin: 1.5rem 0;
        }
        
        .activity-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.8rem;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .activity-item i {
          font-size: 1.3rem;
          color: #ffc107;
        }
        
        .activity-item h4 {
          margin-bottom: 0.2rem;
          color: #1e3c72;
        }
        
        .activity-item p {
          font-size: 0.8rem;
          color: #666;
          margin: 0;
        }
        
        .student-life-image {
          position: relative;
        }
        
        .student-life-image img {
          width: 100%;
          border-radius: 16px;
        }
        
        .floating-card {
          position: absolute;
          bottom: -20px;
          left: -20px;
          background: #ffc107;
          color: #1e3c72;
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .floating-card i {
          font-size: 1.5rem;
        }
        
        .floating-card p {
          margin: 0;
          font-weight: 600;
        }
        
        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 4rem 0;
          text-align: center;
        }
        
        .cta-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        .cta-content p {
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        /* Section spacing */
        .our-story, .mission-vision, .facilities, .leadership, .student-life-preview {
          padding: 4rem 0;
        }
        
        .mission-vision {
          background: #f8f9fa;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .story-grid,
          .mvv-grid,
          .student-life-grid {
            grid-template-columns: 1fr;
          }
          
          .story-image {
            order: -1;
          }
          
          .experience-badge {
            width: 80px;
            height: 80px;
            bottom: -10px;
            right: -10px;
          }
          
          .experience-badge span {
            font-size: 1.2rem;
          }
          
          .floating-card {
            bottom: -10px;
            left: -10px;
            padding: 0.5rem;
          }
          
          .cta-content h2 {
            font-size: 1.5rem;
          }
          
          .facilities-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default AboutPage;