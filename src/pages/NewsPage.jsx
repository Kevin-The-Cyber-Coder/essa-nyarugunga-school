import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Import images
import heroBg from '../assets/hero-bg.jpg';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const NewsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const itemsPerPage = 6;

  // News categories with enhanced styling
  const categories = [
    { id: 'all', name: 'All News', icon: 'fas fa-newspaper', color: '#1a3a5c', bgLight: '#e8f0fe' },
    { id: 'achievement', name: 'Achievements', icon: 'fas fa-trophy', color: '#27ae60', bgLight: '#e8f5e9' },
    { id: 'announcement', name: 'Announcements', icon: 'fas fa-bullhorn', color: '#e74c3c', bgLight: '#fdecea' },
    { id: 'event', name: 'Events', icon: 'fas fa-calendar-alt', color: '#3498db', bgLight: '#e3f2fd' },
    { id: 'academic', name: 'Academic', icon: 'fas fa-graduation-cap', color: '#9b59b6', bgLight: '#f3e5f5' },
    { id: 'sports', name: 'Sports', icon: 'fas fa-futbol', color: '#f39c12', bgLight: '#fff3e0' }
  ];

  // Fetch news from API
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/news/public`);
      const data = await response.json();
      
      if (data.success) {
        setNewsItems(data.data);
      } else {
        setNewsItems([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to load news. Please try again later.');
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter news based on category and search
  const filteredNews = newsItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsClick = async (news) => {
    // Increment view count
    try {
      await fetch(`${API_URL}/news/${news._id}/view`, { method: 'POST' });
    } catch (e) { console.error(e); }
    
    setSelectedNews(news);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
    document.body.style.overflow = 'auto';
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (email) {
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
          confirmButtonColor: '#1a3a5c'
        });
        e.target.reset();
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to subscribe. Please try again.',
          icon: 'error',
          confirmButtonColor: '#1a3a5c'
        });
      }
    }
  };

  const handleShare = (news) => {
    Swal.fire({
      title: 'Share Article',
      html: `
        <div style="text-align: center;">
          <p>Share "${news.title}" with your friends</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
            <button id="share-facebook" class="swal2-confirm swal2-styled" style="background: #1877f2;">Facebook</button>
            <button id="share-twitter" class="swal2-confirm swal2-styled" style="background: #1da1f2;">Twitter</button>
            <button id="share-whatsapp" class="swal2-confirm swal2-styled" style="background: #25D366;">WhatsApp</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      didOpen: () => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(news.title);
        
        document.getElementById('share-facebook')?.addEventListener('click', () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
          Swal.close();
        });
        document.getElementById('share-twitter')?.addEventListener('click', () => {
          window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank');
          Swal.close();
        });
        document.getElementById('share-whatsapp')?.addEventListener('click', () => {
          window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
          Swal.close();
        });
      }
    });
  };

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat || categories[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading latest news...</p>
        </div>
        <Footer />
      </>
    );
  }

  const hasNews = newsItems.length > 0;
  const featuredNews = hasNews ? newsItems[0] : null;

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Gradient */}
      <section className="news-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="news-hero-gradient"></div>
        <div className="container news-hero-content">
          <div className="hero-badge">
            <i className="fas fa-newspaper"></i> STAY INFORMED
          </div>
          <h1>News & <span className="highlight">Events</span></h1>
          <p>Stay updated with the latest happenings, achievements, and announcements from ESSA Nyarugunga</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{newsItems.length}</span>
              <span className="stat-label">Articles</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{categories.filter(c => c.id !== 'all').length}</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{newsItems.reduce((sum, item) => sum + (item.views || 0), 0)}</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscribe Bar */}
      <section className="newsletter-bar">
        <div className="container">
          <div className="newsletter-wrapper">
            <div className="newsletter-text">
              <i className="fas fa-envelope"></i>
              <div>
                <h3>Subscribe to Newsletter</h3>
                <p>Get the latest news directly in your inbox</p>
              </div>
            </div>
            <form onSubmit={handleSubscribe} className="newsletter-form-inline">
              <input type="email" name="email" placeholder="Your email address" required />
              <button type="submit">Subscribe <i className="fas fa-paper-plane"></i></button>
            </form>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="news-search-section">
        <div className="container">
          <div className="search-filter-container">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search news articles..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
          
          <div className="category-pills">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
                style={{ 
                  '--category-color': category.color,
                  background: activeCategory === category.id ? category.color : 'transparent'
                }}
              >
                <i className={category.icon}></i>
                <span>{category.name}</span>
                <span className="category-count">
                  {activeCategory === category.id ? filteredNews.length : 
                   category.id === 'all' ? newsItems.length : 
                   newsItems.filter(n => n.category === category.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* No News Message */}
      {!hasNews && (
        <section className="no-news-section">
          <div className="container">
            <div className="no-news-card">
              <div className="no-news-icon">
                <i className="fas fa-newspaper"></i>
              </div>
              <h3>No News Published Yet</h3>
              <p>There are currently no news articles or announcements. Please check back later for updates from ESSA Nyarugunga.</p>
              <div className="no-news-illustration">
                <i className="fas fa-clock"></i>
                <span>Stay tuned for upcoming events and achievements!</span>
              </div>
              <button onClick={() => window.location.reload()} className="refresh-btn">
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured News Section */}
      {hasNews && activeCategory === 'all' && searchTerm === '' && featuredNews && (
        <section className="featured-news">
          <div className="container">
            <div className="featured-card">
              <div className="featured-image">
                <img src={featuredNews.image || 'https://via.placeholder.com/800x450/1a3a5c/ffffff?text=ESSA+News'} alt={featuredNews.title} />
                <div className="featured-overlay">
                  <div className="featured-badge">
                    <i className={getCategoryInfo(featuredNews.category).icon}></i>
                    Featured Story
                  </div>
                </div>
              </div>
              <div className="featured-content">
                <div className="news-category" style={{ background: getCategoryInfo(featuredNews.category).color }}>
                  <i className={getCategoryInfo(featuredNews.category).icon}></i>
                  {featuredNews.category?.toUpperCase() || 'NEWS'}
                </div>
                <h2>{featuredNews.title}</h2>
                <div className="news-meta">
                  <span><i className="fas fa-calendar-alt"></i> {formatDate(featuredNews.date || featuredNews.createdAt)}</span>
                  <span><i className="fas fa-user"></i> {featuredNews.author || 'ESSA Admin'}</span>
                  <span><i className="fas fa-eye"></i> {featuredNews.views || 0} views</span>
                  <span><i className="fas fa-heart"></i> {featuredNews.likes || 0} likes</span>
                </div>
                <p>{featuredNews.summary}</p>
                <button onClick={() => handleNewsClick(featuredNews)} className="read-more-btn">
                  Read Full Story <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* News Grid/List Section */}
      {hasNews && (
        <section className="news-grid-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>
                  {activeCategory === 'all' ? 'Latest News' : getCategoryInfo(activeCategory).name}
                </h2>
                <p className="section-subtitle">
                  {filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="results-info">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {filteredNews.length > 0 ? (
              <>
                <div className={`news-${viewMode}`}>
                  {paginatedNews.map((news, index) => {
                    const categoryInfo = getCategoryInfo(news.category);
                    return (
                      <div 
                        key={news._id || news.id} 
                        className={`news-card ${viewMode === 'list' ? 'list-view' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="news-image-wrapper">
                          <img 
                            src={news.image || 'https://via.placeholder.com/400x250/1a3a5c/ffffff?text=ESSA+News'} 
                            alt={news.title} 
                            loading="lazy"
                          />
                          <div className="news-category-tag" style={{ background: categoryInfo.color }}>
                            <i className={categoryInfo.icon}></i>
                            {news.category}
                          </div>
                        </div>
                        <div className="news-card-content">
                          <div className="news-date">
                            <i className="fas fa-calendar-alt"></i> {formatDate(news.date || news.createdAt)}
                          </div>
                          <h3>{news.title}</h3>
                          <p>{news.summary?.substring(0, 120)}...</p>
                          <div className="news-card-footer">
                            <div className="news-stats">
                              <span><i className="fas fa-eye"></i> {news.views || 0}</span>
                              <span><i className="fas fa-heart"></i> {news.likes || 0}</span>
                            </div>
                            <button onClick={() => handleNewsClick(news)} className="read-more">
                              Read More <i className="fas fa-arrow-right"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="page-btn prev"
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <div className="page-numbers">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="page-dots">...</span>
                          <button onClick={() => handlePageChange(totalPages)} className="page-number">
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      className="page-btn next"
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <h3>No news found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onClick={() => { setActiveCategory('all'); setSearchTerm(''); }} className="btn btn-primary">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      <section className="upcoming-events">
        <div className="container">
          <div className="section-title">
            <h2><i className="fas fa-calendar-alt"></i> Upcoming Events</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Mark your calendars for these important dates</p>
          </div>
          <div className="events-list">
            <div className="event-item">
              <div className="event-date">
                <span className="event-day">15</span>
                <span className="event-month">MAY</span>
              </div>
              <div className="event-details">
                <h3>Parent-Teacher Conference</h3>
                <p><i className="fas fa-clock"></i> 8:00 AM - 5:00 PM | School Auditorium</p>
                <span className="event-status upcoming">Upcoming</span>
              </div>
            </div>
            <div className="event-item">
              <div className="event-date">
                <span className="event-day">20</span>
                <span className="event-month">MAY</span>
              </div>
              <div className="event-details">
                <h3>Science Fair Exhibition</h3>
                <p><i className="fas fa-clock"></i> 9:00 AM - 3:00 PM | Science Laboratory</p>
                <span className="event-status upcoming">Upcoming</span>
              </div>
            </div>
            <div className="event-item">
              <div className="event-date">
                <span className="event-day">10</span>
                <span className="event-month">JUN</span>
              </div>
              <div className="event-details">
                <h3>Term 2 Examinations Begin</h3>
                <p><i className="fas fa-clock"></i> All Day | Various Classrooms</p>
                <span className="event-status upcoming">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Modal */}
      {isModalOpen && selectedNews && (
        <div className="news-modal" onClick={closeModal}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            <div className="modal-image">
              <img src={selectedNews.image || 'https://via.placeholder.com/800x400/1a3a5c/ffffff?text=ESSA+News'} alt={selectedNews.title} />
              <div className="modal-category" style={{ background: getCategoryInfo(selectedNews.category).color }}>
                <i className={getCategoryInfo(selectedNews.category).icon}></i>
                {selectedNews.category?.toUpperCase() || 'NEWS'}
              </div>
            </div>
            <div className="modal-body">
              <h2>{selectedNews.title}</h2>
              <div className="modal-meta">
                <span><i className="fas fa-calendar-alt"></i> {formatDate(selectedNews.date || selectedNews.createdAt)}</span>
                <span><i className="fas fa-user"></i> {selectedNews.author || 'ESSA Admin'}</span>
                <span><i className="fas fa-eye"></i> {selectedNews.views || 0} views</span>
              </div>
              <div className="modal-content-text">
                <p>{selectedNews.content || selectedNews.summary}</p>
              </div>
              <div className="modal-actions">
                <button onClick={() => handleShare(selectedNews)} className="modal-share-btn">
                  <i className="fas fa-share-alt"></i> Share Article
                </button>
                <button className="modal-print-btn" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top-color: #1a3a5c;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Hero Section */
        .news-hero {
          position: relative;
          min-height: 350px;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
        }
        .news-hero-gradient {
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
        .news-hero-content {
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
        .news-hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .news-hero-content .highlight {
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
        
        /* Newsletter Bar */
        .newsletter-bar {
          background: #1a3a5c;
          padding: 1.5rem 0;
        }
        .newsletter-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .newsletter-text {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }
        .newsletter-text i {
          font-size: 2rem;
          color: #ffc107;
        }
        .newsletter-text h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        .newsletter-text p {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.8;
        }
        .newsletter-form-inline {
          display: flex;
          gap: 0.5rem;
        }
        .newsletter-form-inline input {
          padding: 10px 15px;
          border: none;
          border-radius: 30px;
          width: 250px;
        }
        .newsletter-form-inline button {
          background: #ffc107;
          color: #1a3a5c;
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }
        .newsletter-form-inline button:hover {
          transform: translateY(-2px);
        }
        
        /* Search and Filter */
        .news-search-section {
          padding: 2rem 0;
          background: #f8f9fa;
        }
        .search-filter-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .search-box {
          flex: 1;
          max-width: 400px;
          position: relative;
        }
        .search-box i {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
        .search-box input {
          width: 100%;
          padding: 12px 40px 12px 45px;
          border: 1px solid #e0e0e0;
          border-radius: 30px;
          font-size: 0.9rem;
        }
        .clear-search {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
        }
        .view-toggle {
          display: flex;
          gap: 0.5rem;
        }
        .view-btn {
          width: 40px;
          height: 40px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .view-btn.active {
          background: #1a3a5c;
          color: white;
          border-color: #1a3a5c;
        }
        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        .category-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border: 1px solid #e0e0e0;
          border-radius: 40px;
          background: white;
          cursor: pointer;
          transition: 0.3s;
          font-size: 0.85rem;
        }
        .category-pill i {
          font-size: 0.9rem;
        }
        .category-pill.active {
          background: var(--category-color);
          color: white;
          border-color: var(--category-color);
        }
        .category-count {
          background: rgba(0,0,0,0.1);
          border-radius: 20px;
          padding: 2px 6px;
          font-size: 0.7rem;
        }
        .category-pill.active .category-count {
          background: rgba(255,255,255,0.2);
        }
        
        /* Featured News */
        .featured-news {
          padding: 3rem 0;
        }
        .featured-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .featured-image {
          position: relative;
          height: 100%;
          min-height: 300px;
        }
        .featured-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .featured-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
        }
        .featured-badge {
          background: #ffc107;
          color: #1a3a5c;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .featured-content {
          padding: 2rem;
        }
        .news-category {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .featured-content h2 {
          font-size: 1.5rem;
          margin-bottom: 0.8rem;
          color: #1a3a5c;
        }
        .news-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.75rem;
          color: #888;
        }
        .read-more-btn {
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 10px 25px;
          border-radius: 30px;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.3s;
        }
        .read-more-btn:hover {
          background: #ffc107;
          color: #1a3a5c;
          transform: translateX(5px);
        }
        
        /* News Grid */
        .news-grid-section {
          padding: 3rem 0;
          background: #f8f9fa;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .section-header h2 {
          font-size: 1.5rem;
          color: #1a3a5c;
          margin-bottom: 0.3rem;
        }
        .section-subtitle {
          color: #666;
          font-size: 0.85rem;
        }
        .results-info {
          color: #888;
          font-size: 0.85rem;
        }
        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .news-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .news-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .news-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .news-card.list-view {
          display: grid;
          grid-template-columns: 280px 1fr;
        }
        .news-image-wrapper {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .news-card.list-view .news-image-wrapper {
          height: 180px;
        }
        .news-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .news-card:hover .news-image-wrapper img {
          transform: scale(1.05);
        }
        .news-category-tag {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          border-radius: 20px;
          color: white;
          font-size: 0.65rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .news-card-content {
          padding: 1.2rem;
        }
        .news-date {
          font-size: 0.7rem;
          color: #999;
          margin-bottom: 0.5rem;
        }
        .news-card-content h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #1a3a5c;
          line-height: 1.4;
        }
        .news-card-content p {
          font-size: 0.85rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .news-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .news-stats {
          display: flex;
          gap: 0.8rem;
          font-size: 0.7rem;
          color: #999;
        }
        .read-more {
          background: none;
          border: none;
          color: #ffc107;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }
        .read-more:hover {
          transform: translateX(3px);
        }
        
        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.8rem;
          margin-top: 2.5rem;
          flex-wrap: wrap;
        }
        .page-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .page-btn:hover:not(:disabled) {
          background: #1a3a5c;
          color: white;
          border-color: #1a3a5c;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-numbers {
          display: flex;
          gap: 0.5rem;
        }
        .page-number {
          width: 38px;
          height: 38px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .page-number.active {
          background: #1a3a5c;
          color: white;
          border-color: #1a3a5c;
        }
        .page-dots {
          padding: 0 5px;
          color: #999;
        }
        
        /* Upcoming Events */
        .upcoming-events {
          padding: 3rem 0;
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
        .events-list {
          max-width: 700px;
          margin: 0 auto;
        }
        .event-item {
          display: flex;
          gap: 1rem;
          background: white;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .event-date {
          text-align: center;
          background: #1a3a5c;
          color: white;
          padding: 0.8rem;
          border-radius: 12px;
          min-width: 70px;
        }
        .event-day {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .event-month {
          font-size: 0.7rem;
        }
        .event-details {
          flex: 1;
        }
        .event-details h3 {
          margin-bottom: 0.3rem;
          color: #1a3a5c;
        }
        .event-details p {
          font-size: 0.8rem;
          color: #666;
        }
        .event-status {
          display: inline-block;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 20px;
          margin-top: 0.3rem;
        }
        .event-status.upcoming {
          background: #e8f5e9;
          color: #4caf50;
        }
        
        /* Modal */
        .news-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .news-modal-content {
          background: white;
          border-radius: 20px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: white;
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
        }
        .modal-image {
          position: relative;
        }
        .modal-image img {
          width: 100%;
          height: 250px;
          object-fit: cover;
        }
        .modal-category {
          position: absolute;
          bottom: -15px;
          left: 20px;
          padding: 5px 15px;
          border-radius: 20px;
          color: white;
          font-size: 0.7rem;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-meta {
          display: flex;
          gap: 1rem;
          margin: 0.5rem 0 1rem;
          font-size: 0.75rem;
          color: #999;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        .modal-share-btn, .modal-print-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .modal-share-btn {
          background: #1a3a5c;
          color: white;
        }
        .modal-print-btn {
          background: #f0f2f5;
        }
        
        /* No News Section */
        .no-news-section {
          padding: 4rem 0;
        }
        .no-news-card {
          text-align: center;
          background: white;
          border-radius: 20px;
          padding: 3rem;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        .no-news-icon i {
          font-size: 4rem;
          color: #1a3a5c;
          margin-bottom: 1rem;
        }
        .no-results {
          text-align: center;
          padding: 3rem;
        }
        .refresh-btn {
          margin-top: 1rem;
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 30px;
          cursor: pointer;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .news-hero-content h1 {
            font-size: 1.8rem;
          }
          .featured-card {
            grid-template-columns: 1fr;
          }
          .news-grid {
            grid-template-columns: 1fr;
          }
          .news-card.list-view {
            grid-template-columns: 1fr;
          }
          .newsletter-wrapper {
            flex-direction: column;
            text-align: center;
          }
          .newsletter-form-inline {
            flex-direction: column;
            width: 100%;
          }
          .newsletter-form-inline input {
            width: 100%;
          }
          .search-filter-container {
            flex-direction: column;
          }
          .search-box {
            max-width: 100%;
            width: 100%;
          }
          .category-pills {
            justify-content: center;
          }
          .pagination {
            gap: 0.5rem;
          }
          .page-number {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </>
  );
};

export default NewsPage;