import React, { useState, useEffect } from 'react';
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

// Hero slider images (only images, no captions)
const heroSliderImages = [
  heroBg,
  studentsImage,
  classroomImg,
  scienceLabImg,
  graduationImg,
  footballImg,
  campusImage
];

const HomePage = () => {
  const [counterValues, setCounterValues] = useState({ students: 0, teachers: 0, years: 0 });
  const [activeGalleryFilter, setActiveGalleryFilter] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Gallery items with local images
  const galleryItems = [
    { id: 1, category: 'academic', img: classroomImg, title: 'Classroom Session', subtitle: 'Academic Excellence' },
    { id: 2, category: 'sports', img: footballImg, title: 'Football Match', subtitle: 'Sports Day' },
    { id: 3, category: 'cultural', img: musicImg, title: 'Music Concert', subtitle: 'Cultural Event' },
    { id: 4, category: 'academic', img: scienceLabImg, title: 'Science Lab', subtitle: 'Lab Session' },
    { id: 5, category: 'sports', img: basketballImg, title: 'Basketball', subtitle: 'Basketball Tournament' },
    { id: 6, category: 'cultural', img: artImg, title: 'Art Exhibition', subtitle: 'Student Art' },
    { id: 7, category: 'academic', img: libraryImg, title: 'Library', subtitle: 'Reading Session' },
    { id: 8, category: 'events', img: graduationImg, title: 'Graduation', subtitle: 'Graduation Ceremony' }
  ];

  // Clubs with local images
  const clubs = [
    { 
      id: 1, 
      name: 'Debate Club', 
      icon: 'fas fa-microphone-alt', 
      img: debateClubImg, 
      description: 'Develop public speaking, critical thinking, and leadership skills through friendly competitions and inter-school debates.',
      schedule: 'Every Friday, 3:30 PM',
      venue: 'Debate Hall',
      members: 50,
      achievement: '15+ awards'
    },
    { 
      id: 2, 
      name: 'Music Club', 
      icon: 'fas fa-music', 
      img: musicClubImg, 
      description: 'Learn instruments, choir singing, and modern music production. Annual concerts and school performances.',
      schedule: 'Tue & Thu, 4:00 PM',
      venue: 'Music Room',
      members: 38,
      achievement: '2 bands'
    },
    { 
      id: 3, 
      name: 'Sports Club', 
      icon: 'fas fa-futbol', 
      img: sportsClubImg, 
      description: 'Football, basketball, volleyball, athletics, and more. Join school teams and regional tournaments.',
      schedule: 'Mon/Wed/Fri, 3:30 PM',
      venue: 'Playground/Gym',
      members: 120,
      achievement: '8 medals'
    }
  ];

  // Spiritual activities
  const spiritualActivities = [
    { icon: 'fas fa-praying-hands', title: 'Morning Prayer', description: 'Daily assembly starts with prayer and reflection (7:45 AM)' },
    { icon: 'fas fa-bible', title: 'Weekly Mass / Service', description: 'Sunday: Catholic Mass (8 AM) | Protestant Service (10 AM)' },
    { icon: 'fas fa-heart', title: 'Choir Ministry', description: 'Join the school choir for Sunday services and special events' },
    { icon: 'fas fa-hands-helping', title: 'Charity Outreach', description: 'Visit local communities, donate supplies, and serve the needy' },
    { icon: 'fas fa-calendar-week', title: 'Retreats & Recollections', description: 'Termly spiritual retreats for character formation' },
    { icon: 'fas fa-user-graduate', title: 'Guidance & Counseling', description: 'Moral and spiritual guidance sessions every Thursday' }
  ];

  // Auto-slide functionality for background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSliderImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Counter animation
  useEffect(() => {
    const targets = { students: 800, teachers: 20, years: 20 };
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step <= steps) {
        setCounterValues({
          students: Math.floor((targets.students * step) / steps),
          teachers: Math.floor((targets.teachers * step) / steps),
          years: Math.floor((targets.years * step) / steps)
        });
      } else {
        setCounterValues(targets);
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  const handleJoinClub = (clubName) => {
    Swal.fire({
      title: `Join ${clubName}`,
      text: 'Please visit the school administration office to register for this club.',
      icon: 'info',
      confirmButtonText: 'OK, Got it!',
      confirmButtonColor: '#1e3c72'
    });
  };

  const handleViewImage = (img, title) => {
    Swal.fire({
      imageUrl: img,
      imageAlt: title,
      title: title,
      showCloseButton: true,
      showConfirmButton: false,
      width: '800px'
    });
  };

  const filteredGallery = activeGalleryFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeGalleryFilter);

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Background Image Slider - No captions, just images */}
      <section className="hero">
        <div className="hero-slider">
          {heroSliderImages.map((image, index) => (
            <div 
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="hero-overlay"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <i className="fas fa-star-of-life"></i> EXCELLENCE IN EDUCATION
          </div>
          <h1>Shaping Futures, <span className="highlight">Building Leaders</span></h1>
          <p>Welcome to ESSA Nyarugunga – a center of academic excellence, discipline, and holistic development in Kigali.</p>
          <div className="hero-buttons">
            <Link to="/admissions" className="btn btn-primary"><i className="fas fa-user-graduate"></i> Apply Now</Link>
            <Link to="/about" className="btn btn-secondary"><i className="fas fa-play-circle"></i> Learn More</Link>
          </div>
        </div>
        
        {/* Slider Dots - Optional (can remove if not needed) */}
        <div className="slider-dots">
          {heroSliderImages.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* About Section - Left aligned text, right aligned image */}
      <section className="about">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-school"></i> About ESSA Nyarugunga</h2>
            <div className="underline"></div>
          </div>
          <div className="about-grid">
            <div className="about-text">
              <p>Founded with a mission to provide quality education, ESSA Nyarugunga is one of the respected secondary schools in Kigali's Kicukiro District. We offer a nurturing environment where students grow academically, socially, and spiritually.</p>
              <p>Our dedicated staff and modern facilities ensure that every learner reaches their full potential. We follow the Rwandan national curriculum with a focus on Economics, technology, and character formation.</p>
              <div className="features">
                <div><i className="fas fa-check-circle"></i> Modern Facilities</div>
                <div><i className="fas fa-check-circle"></i> Computer Lab with Internet</div>
                <div><i className="fas fa-check-circle"></i> Library & Reading Room</div>
                <div><i className="fas fa-check-circle"></i> Sports Facilities</div>
              </div>
              <div className="stats">
                <div className="stat">
                  <h3>{counterValues.students}+</h3>
                  <p><i className="fas fa-user-graduate"></i> Students</p>
                </div>
                <div className="stat">
                  <h3>{counterValues.teachers}+</h3>
                  <p><i className="fas fa-chalkboard-user"></i> Teachers</p>
                </div>
                <div className="stat">
                  <h3>{counterValues.years}+</h3>
                  <p><i className="fas fa-award"></i> Years Excellence</p>
                </div>
              </div>
            </div>
            <div className="about-image">
              <img src={campusImage} alt="school campus" className="about-real-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Academics Section - Left aligned text */}
      <section className="academics">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-graduation-cap"></i> Academic Programs</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Explore our diverse range of career-focused programs</p>
          </div>
          <div className="cards">
            <div className="card">
              <div className="card-icon"><i className="fas fa-code"></i></div>
              <h3>SOFTWARE DEVELOPMENT</h3>
              <p>A software development class teaches how to design, build, test, and maintain computer programs using programming languages and tools.</p>
              <Link to="/academics" className="card-link">Learn More <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="card">
              <div className="card-icon"><i className="fas fa-calculator"></i></div>
              <h3>ACCOUNTING</h3>
              <p>An accounting class teaches how to record, organize, and analyze financial transactions for individuals or businesses.</p>
              <Link to="/academics" className="card-link">Learn More <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="card">
              <div className="card-icon"><i className="fas fa-microchip"></i></div>
              <h3>COMPUTER SYSTEMS</h3>
              <p>A computer systems and architecture class explains how computer hardware and software interact.</p>
              <Link to="/academics" className="card-link">Learn More <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="card">
              <div className="card-icon"><i className="fas fa-hotel"></i></div>
              <h3>TOURISM</h3>
              <p>Learn about the travel and hospitality industry, customer service, and cultural awareness.</p>
              <Link to="/academics" className="card-link">Learn More <i className="fas fa-arrow-right"></i></Link>
            </div>
          </div>
          <div className="trades-btn-container">
            <Link to="/academics" className="btn-trades"><i className="fas fa-th-large"></i> View All Trades & Programs <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </section>

      {/* Student Life Section - Left aligned content */}
      <section className="student-life">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-users"></i> Student Life at ESSA</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Beyond academics – discover, grow, and belong</p>
          </div>

          <div className="clubs-section">
            <h3 className="section-heading"><i className="fas fa-futbol"></i> Student Clubs & Activities</h3>
            <div className="clubs-grid">
              {clubs.map((club) => (
                <div key={club.id} className="club-card">
                  <img src={club.img} alt={club.name} className="club-real-image" />
                  <h4><i className={club.icon}></i> {club.name}</h4>
                  <p>{club.description}</p>
                  <div className="club-details">
                    <span><i className="fas fa-calendar-week"></i> {club.schedule}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {club.venue}</span>
                  </div>
                  <div className="club-stats">
                    <span><i className="fas fa-users"></i> {club.members}+ members</span>
                    <span><i className="fas fa-trophy"></i> {club.achievement}</span>
                  </div>
                  <button className="join-btn" onClick={() => handleJoinClub(club.name)}><i className="fas fa-hand-peace"></i> Join Club</button>
                </div>
              ))}
            </div>
          </div>

          <div className="spiritual-section">
            <h3 className="section-heading"><i className="fas fa-church"></i> Chapel & Spiritual Life</h3>
            <div className="spiritual-grid">
              {spiritualActivities.map((item, index) => (
                <div key={index} className="spiritual-card">
                  <i className={item.icon}></i>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Centered grid */}
      <section className="gallery">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-images"></i> Our Gallery</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Moments that define our journey</p>
          </div>
          <div className="gallery-filters">
            <button className={`filter-btn ${activeGalleryFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveGalleryFilter('all')}>All</button>
            <button className={`filter-btn ${activeGalleryFilter === 'academic' ? 'active' : ''}`} onClick={() => setActiveGalleryFilter('academic')}>Academic</button>
            <button className={`filter-btn ${activeGalleryFilter === 'sports' ? 'active' : ''}`} onClick={() => setActiveGalleryFilter('sports')}>Sports</button>
            <button className={`filter-btn ${activeGalleryFilter === 'cultural' ? 'active' : ''}`} onClick={() => setActiveGalleryFilter('cultural')}>Cultural</button>
            <button className={`filter-btn ${activeGalleryFilter === 'events' ? 'active' : ''}`} onClick={() => setActiveGalleryFilter('events')}>Events</button>
          </div>
          <div className="gallery-grid">
            {filteredGallery.map((item) => (
              <div key={item.id} className="gallery-item" onClick={() => handleViewImage(item.img, item.title)}>
                <img src={item.img} alt={item.title} className="gallery-real-image" />
                <div className="gallery-overlay">
                  <i className="fas fa-search-plus"></i>
                  <p>{item.subtitle || item.title}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="gallery-btn-container">
            <Link to="/gallery" className="btn btn-outline"><i className="fas fa-images"></i> View All Images <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </section>

      {/* Admissions Section - Left aligned text, right aligned image */}
      <section className="admissions">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-door-open"></i> Admissions</h2>
            <div className="underline"></div>
          </div>
          <div className="admissions-grid">
            <div className="admissions-info">
              <h3>Join Our Family</h3>
              <p>Applications are open for the 2026-2027 academic year. Limited seats available in Technology, Economics, and Computer Science combinations.</p>
              <div className="info-boxes">
                <div className="info-box">
                  <i className="fas fa-calendar-alt"></i>
                  <h4>Application Period</h4>
                  <p>January – September 2026</p>
                </div>
                <div className="info-box">
                  <i className="fas fa-file-alt"></i>
                  <h4>Requirements</h4>
                  <p>Report cards, birth certificate, entrance exam</p>
                </div>
                <div className="info-box">
                  <i className="fas fa-dollar-sign"></i>
                  <h4>Scholarships</h4>
                  <p>Merit-based & need-based available</p>
                </div>
              </div>
              <div className="admissions-buttons">
                <Link to="/admissions" className="btn btn-primary"><i className="fas fa-graduate"></i>Admissions</Link>
                <Link to="/admissions" className="btn btn-outline"><i className="fas fa-globe"></i> Apply Online</Link>
              </div>
            </div>
            <div className="admissions-image">
              <img src={studentsImage} alt="Students studying" className="admissions-real-image" />
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Styles for Hero Slider and other sections */}
      <style>{`
        /* ========== HERO SLIDER STYLES ========== */
        .hero {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        
        .hero-slider {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        
        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 1.2s ease-in-out;
        }
        
        .hero-slide.active {
          opacity: 1;
          z-index: 1;
        }
        
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
    background: linear-gradient(
  135deg,
  hsla(220, 60%, 18%, 0.80) 0%,
  hsla(45, 90%, 70%, 0.45) 100%
);
          z-index: 2;
        }
        
        .hero-content {
          position: relative;
          z-index: 3;
          text-align: center;
          color: white;
          width: 100%;
        }
        
        .hero-badge {
          display: inline-block;
          background: rgba(255,193,7,0.2);
          color: #ffc107;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          backdrop-filter: blur(5px);
        }
        
        .hero-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .hero-content .highlight {
          color: #ffc107;
        }
        
        .hero-content p {
          font-size: 1.2rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn-primary {
          background: #ffc107;
          color: #1e3c72;
          padding: 12px 28px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary:hover {
          background: #e0a800;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: transparent;
          color: white;
          padding: 12px 28px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          border: 2px solid white;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-secondary:hover {
          background: white;
          color: #1e3c72;
          transform: translateY(-2px);
        }
        
        /* Slider Dots */
        .slider-dots {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }
        
        .dot {
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.5);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }
        
        .dot.active {
          background: #ffc107;
          transform: scale(1.3);
        }
        
        .dot:hover {
          background: #ffc107;
        }
        
        /* Section alignment fixes */
        .about-grid,
        .admissions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        .about-text,
        .admissions-info {
          text-align: left;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
          margin: 1.5rem 0;
        }
        
        .features div {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stats {
          display: flex;
          gap: 2rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        
        .stat {
          text-align: center;
          flex: 1;
          min-width: 100px;
        }
        
        .stat h3 {
          font-size: 1.8rem;
          color: #1e3c72;
          margin-bottom: 0.3rem;
        }
        
        /* Cards alignment */
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        
        .card {
          text-align: left;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          transition: transform 0.3s;
        }
        
        .card:hover {
          transform: translateY(-5px);
        }
        
        .card-icon i {
          font-size: 2rem;
          color: #1e3c72;
          margin-bottom: 1rem;
        }
        
        .card h3 {
          font-size: 1.1rem;
          margin-bottom: 0.8rem;
          color: #1e3c72;
        }
        
        .card p {
          font-size: 0.85rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #ffc107;
          text-decoration: none;
          font-weight: 500;
          transition: gap 0.3s;
        }
        
        .card-link:hover {
          gap: 10px;
        }
        
        /* Clubs grid */
        .clubs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        .club-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          text-align: left;
        }
        
        .club-card h4 {
          padding: 1rem 1rem 0.5rem;
          margin: 0;
        }
        
        .club-card p {
          padding: 0 1rem;
          font-size: 0.85rem;
          color: #666;
        }
        
        .club-details, .club-stats {
          padding: 0.5rem 1rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
        }
        
        .club-real-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }
        
        .join-btn {
          margin: 1rem;
          width: calc(100% - 2rem);
          background: #1e3c72;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .join-btn:hover {
          background: #ffc107;
          color: #1e3c72;
        }
        
        /* Spiritual grid */
        .spiritual-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.2rem;
        }
        
        .spiritual-card {
          background: white;
          padding: 1.2rem;
          border-radius: 12px;
          text-align: left;
          border-left: 3px solid #ffc107;
        }
        
        .spiritual-card i {
          font-size: 1.5rem;
          color: #1e3c72;
          margin-bottom: 0.5rem;
        }
        
        /* Gallery */
        .gallery-filters {
          display: flex;
          justify-content: center;
          gap: 0.8rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          padding: 8px 20px;
          border: 1px solid #1e3c72;
          background: transparent;
          color:#1e3c72;
          border-radius: 30px;
          cursor: pointer;
          transition: 0.3s;
        }
        
        .filter-btn.active,
        .filter-btn:hover {
          background: #1e3c72;
          color: white;
        }
        
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.2rem;
        }
        
        .gallery-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          aspect-ratio: 4/3;
        }
        
        .gallery-real-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .gallery-item:hover .gallery-real-image {
          transform: scale(1.05);
        }
        
        .gallery-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          color: white;
          padding: 1rem;
          transform: translateY(100%);
          transition: transform 0.3s;
          text-align: center;
        }
        
        .gallery-item:hover .gallery-overlay {
          transform: translateY(0);
        }
        
        .gallery-btn-container {
          text-align: center;
          margin-top: 2rem;
        }
        
        /* Info boxes */
        .info-boxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }
        
        .info-box {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .admissions-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .hero {
            min-height: 70vh;
          }
          
          .hero-content h1 {
            font-size: 1.8rem;
          }
          
          .hero-content p {
            font-size: 0.9rem;
          }
          
          .about-grid,
          .admissions-grid {
            grid-template-columns: 1fr;
          }
          
          .features {
            grid-template-columns: 1fr;
          }
          
          .stats {
            justify-content: center;
          }
          
          .cards {
            grid-template-columns: 1fr;
          }
          
          .clubs-grid {
            grid-template-columns: 1fr;
          }
          
          .spiritual-grid {
            grid-template-columns: 1fr;
          }
          
          .slider-dots {
            bottom: 15px;
          }
          
          .dot {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default HomePage;