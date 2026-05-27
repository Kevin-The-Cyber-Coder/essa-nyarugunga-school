import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

// Import images for hero background
import heroBg from '../assets/hero-bg.jpg';

// API Base URL
const API_URL = 'http://localhost:5000/api';

const GalleryPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or masonry

  // Gallery categories with enhanced styling
  const categories = [
    { id: 'all', name: 'All Photos', icon: 'fas fa-th-large', color: '#1a3a5c', bgLight: '#e8f0fe' },
    { id: 'academic', name: 'Academic', icon: 'fas fa-graduation-cap', color: '#27ae60', bgLight: '#e8f5e9' },
    { id: 'sports', name: 'Sports', icon: 'fas fa-futbol', color: '#f39c12', bgLight: '#fff3e0' },
    { id: 'cultural', name: 'Cultural', icon: 'fas fa-music', color: '#9b59b6', bgLight: '#f3e5f5' },
    { id: 'events', name: 'Events', icon: 'fas fa-calendar-alt', color: '#e74c3c', bgLight: '#fdecea' }
  ];

  // Fetch gallery from API
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/gallery/public`);
      const data = await response.json();
      
      if (data.success) {
        setGalleryItems(data.data);
      } else {
        setGalleryItems([]);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setError('Failed to load gallery. Please try again later.');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeFilter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  const openLightbox = (item) => {
    setSelectedImage(item);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const navigateImage = (direction) => {
    const currentIndex = filteredItems.findIndex(item => item._id === selectedImage._id);
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      if (newIndex >= filteredItems.length) newIndex = 0;
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = filteredItems.length - 1;
    }
    setSelectedImage(filteredItems[newIndex]);
  };

  const handleImageDownload = async (image) => {
    Swal.fire({
      title: 'Download Image',
      text: `Would you like to download "${image.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Download',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1a3a5c'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${API_URL}/gallery/${image._id}/download`, { method: 'POST' });
        } catch (e) {
          console.error('Download tracking error:', e);
        }
        
        window.open(image.image, '_blank');
        Swal.fire('Download Started', 'Your image download will begin shortly.', 'success');
      }
    });
  };

  const handleImageShare = (image) => {
    Swal.fire({
      title: 'Share Image',
      html: `
        <div style="text-align: center;">
          <p>Share "${image.title}" with your friends</p>
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
        const title = encodeURIComponent(image.title);
        
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

  const handleImageInfo = (image) => {
    Swal.fire({
      title: image.title,
      html: `
        <div style="text-align: left;">
          <p><strong>📝 Description:</strong> ${image.description || 'No description available'}</p>
          <p><strong>📅 Date:</strong> ${formatDate(image.date)}</p>
          <p><strong>📸 Photographer:</strong> ${image.photographer || 'School Media Team'}</p>
          <p><strong>🏷️ Category:</strong> ${image.category?.toUpperCase() || 'GENERAL'}</p>
          <p><strong>👁️ Views:</strong> ${image.views || 0}</p>
          <p><strong>⬇️ Downloads:</strong> ${image.downloads || 0}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#1a3a5c'
    });
  };

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat || categories[0];
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return galleryItems.length;
    return galleryItems.filter(item => item.category === categoryId).length;
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
          <p>Loading beautiful moments...</p>
        </div>
        <Footer />
      </>
    );
  }

  const hasImages = galleryItems.length > 0;

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Gradient */}
      <section className="gallery-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="gallery-hero-gradient"></div>
        <div className="container gallery-hero-content">
          <div className="hero-badge">
            <i className="fas fa-camera"></i> CAPTURED MOMENTS
          </div>
          <h1>Our <span className="highlight">Gallery</span></h1>
          <p>Explore memorable moments from our school life - academics, sports, cultural events, and celebrations</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{galleryItems.length}</span>
              <span className="stat-label">Moments</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{categories.length - 1}</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{galleryItems.reduce((sum, item) => sum + (item.views || 0), 0)}</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="gallery-categories">
        <div className="container">
          <div className="search-filter-container">
            <div className="category-filters">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-btn ${activeFilter === category.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(category.id)}
                  style={{
                    '--category-color': category.color,
                    background: activeFilter === category.id ? category.color : 'transparent'
                  }}
                >
                  <i className={category.icon}></i>
                  <span>{category.name}</span>
                  <span className="count" style={{ background: activeFilter === category.id ? 'rgba(255,255,255,0.2)' : '#f0f0f0' }}>
                    {getCategoryCount(category.id)}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button 
                className={`view-btn ${viewMode === 'masonry' ? 'active' : ''}`}
                onClick={() => setViewMode('masonry')}
              >
                <i className="fas fa-water"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* No Images Message */}
      {!hasImages && (
        <section className="no-gallery-section">
          <div className="container">
            <div className="no-gallery-card">
              <div className="no-gallery-icon">
                <i className="fas fa-images"></i>
              </div>
              <h3>No Photos in Gallery Yet</h3>
              <p>There are currently no photos in the gallery. Please check back later for updates from ESSA Nyarugunga.</p>
              <div className="no-gallery-illustration">
                <i className="fas fa-camera"></i>
                <span>Moments will be captured and shared soon!</span>
              </div>
              <button onClick={() => window.location.reload()} className="refresh-btn">
                <i className="fas fa-sync-alt"></i> Refresh Gallery
              </button>
              <div className="contact-admin">
                <p>Want to share your memories?</p>
                <Link to="/contact" className="contact-admin-link">
                  <i className="fas fa-envelope"></i> Contact the Media Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Grid */}
      {hasImages && (
        <section className="gallery-grid-section">
          <div className="container">
            <div className="gallery-stats-bar">
              <div className="stats-left">
                <i className="fas fa-images"></i>
                <span>Showing {filteredItems.length} of {galleryItems.length} photos</span>
              </div>
              <div className="stats-right">
                <span><i className="fas fa-download"></i> Click to download</span>
              </div>
            </div>
            
            <div className={`gallery-${viewMode}`}>
              {filteredItems.map((item, index) => {
                const categoryInfo = getCategoryInfo(item.category);
                return (
                  <div 
                    key={item._id} 
                    className="gallery-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="gallery-image-wrapper">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/500x350/1a3a5c/ffffff?text=Image+Not+Found';
                        }}
                      />
                      <div className="gallery-overlay-actions">
                        <button onClick={() => openLightbox(item)} className="overlay-btn" title="View Full Size">
                          <i className="fas fa-search-plus"></i>
                        </button>
                        <button onClick={() => handleImageInfo(item)} className="overlay-btn" title="Image Info">
                          <i className="fas fa-info-circle"></i>
                        </button>
                        <button onClick={() => handleImageShare(item)} className="overlay-btn" title="Share">
                          <i className="fas fa-share-alt"></i>
                        </button>
                        <button onClick={() => handleImageDownload(item)} className="overlay-btn" title="Download">
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                      <div className="gallery-category-tag" style={{ background: categoryInfo.color }}>
                        <i className={categoryInfo.icon}></i>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <div className="gallery-info">
                      <h3>{item.title}</h3>
                      <p>{item.description || 'Beautiful moment captured at ESSA Nyarugunga'}</p>
                      <div className="gallery-meta">
                        <span><i className="fas fa-calendar-alt"></i> {formatDate(item.date)}</span>
                        <span><i className="fas fa-camera"></i> {item.photographer || 'School Media Team'}</span>
                        <span><i className="fas fa-eye"></i> {item.views || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="no-results">
                <i className="fas fa-images"></i>
                <h3>No photos in this category</h3>
                <p>Try selecting a different category</p>
                <button onClick={() => setActiveFilter('all')} className="btn btn-primary">
                  View All Photos
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedImage && (
        <div className="lightbox-modal" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <i className="fas fa-times"></i>
            </button>
            <button className="lightbox-prev" onClick={() => navigateImage('prev')}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="lightbox-image-container">
              <img src={selectedImage.image} alt={selectedImage.title} />
              <div className="lightbox-caption">
                <h3>{selectedImage.title}</h3>
                <p>{selectedImage.description || 'Beautiful moment at ESSA Nyarugunga'}</p>
                <div className="lightbox-meta">
                  <span><i className="fas fa-calendar-alt"></i> {formatDate(selectedImage.date)}</span>
                  <span><i className="fas fa-camera"></i> {selectedImage.photographer || 'School Media Team'}</span>
                  <span><i className="fas fa-tag"></i> {selectedImage.category}</span>
                  <span><i className="fas fa-eye"></i> {selectedImage.views || 0} views</span>
                </div>
                <div className="lightbox-actions">
                  <button onClick={() => handleImageDownload(selectedImage)}>
                    <i className="fas fa-download"></i> Download
                  </button>
                  <button onClick={() => handleImageShare(selectedImage)}>
                    <i className="fas fa-share-alt"></i> Share
                  </button>
                  <button onClick={() => handleImageInfo(selectedImage)}>
                    <i className="fas fa-info-circle"></i> Info
                  </button>
                </div>
              </div>
            </div>
            <button className="lightbox-next" onClick={() => navigateImage('next')}>
              <i className="fas fa-chevron-right"></i>
            </button>
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
        .gallery-hero {
          position: relative;
          min-height: 350px;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
        }
        .gallery-hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(26,58,92,0.95) 0%, rgba(42,82,152,0.85) 100%);
        }
        .gallery-hero-content {
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
        .gallery-hero-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .gallery-hero-content .highlight {
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
        
        /* Category Filters */
        .gallery-categories {
          padding: 2rem 0;
          background: #f8f9fa;
        }
        .search-filter-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        .category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 1px solid #e0e0e0;
          border-radius: 40px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.85rem;
        }
        .category-btn i {
          font-size: 0.9rem;
        }
        .category-btn.active {
          color: white;
          border-color: var(--category-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .category-btn .count {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
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
        
        /* Gallery Grid */
        .gallery-grid-section {
          padding: 3rem 0;
          background: white;
        }
        .gallery-stats-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .stats-left i, .stats-right i {
          color: #ffc107;
          margin-right: 5px;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .gallery-masonry {
          column-count: 3;
          column-gap: 1.5rem;
        }
        .gallery-card {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .gallery-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        .gallery-image-wrapper {
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .gallery-image-wrapper img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .gallery-card:hover .gallery-image-wrapper img {
          transform: scale(1.05);
        }
        .gallery-overlay-actions {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(26,58,92,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .gallery-image-wrapper:hover .gallery-overlay-actions {
          opacity: 1;
        }
        .overlay-btn {
          width: 45px;
          height: 45px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #1a3a5c;
        }
        .overlay-btn:hover {
          background: #ffc107;
          transform: scale(1.1);
        }
        .gallery-category-tag {
          position: absolute;
          bottom: 15px;
          right: 15px;
          padding: 5px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .gallery-info {
          padding: 1rem;
        }
        .gallery-info h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #1a3a5c;
        }
        .gallery-info p {
          font-size: 0.8rem;
          color: #666;
          line-height: 1.4;
          margin-bottom: 0.8rem;
        }
        .gallery-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          font-size: 0.7rem;
          color: #999;
        }
        
        /* No Gallery Section */
        .no-gallery-section {
          padding: 4rem 0;
          background: #f8f9fa;
        }
        .no-gallery-card {
          text-align: center;
          background: white;
          border-radius: 24px;
          padding: 3rem;
          max-width: 550px;
          margin: 0 auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .no-gallery-icon i {
          font-size: 5rem;
          color: #1a3a5c;
          margin-bottom: 1rem;
        }
        .no-gallery-card h3 {
          font-size: 1.5rem;
          color: #1a3a5c;
          margin-bottom: 1rem;
        }
        .no-gallery-card p {
          color: #666;
          margin-bottom: 1.5rem;
        }
        .no-gallery-illustration {
          background: #f0f4f8;
          padding: 15px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 1rem 0;
        }
        .no-gallery-illustration i {
          font-size: 1.2rem;
          margin: 0;
          color: #ffc107;
        }
        .refresh-btn {
          background: #1a3a5c;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 30px;
          cursor: pointer;
          margin: 1rem 0;
          transition: 0.3s;
        }
        .refresh-btn:hover {
          background: #ffc107;
          color: #1a3a5c;
        }
        .contact-admin {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .contact-admin p {
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }
        .contact-admin-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ffc107;
          text-decoration: none;
          font-weight: 500;
        }
        
        /* Lightbox Modal */
        .lightbox-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.95);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
        }
        .lightbox-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
        }
        .lightbox-prev, .lightbox-next {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          border: none;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }
        .lightbox-prev { left: -60px; }
        .lightbox-next { right: -60px; }
        .lightbox-prev:hover, .lightbox-next:hover {
          background: #ffc107;
          color: #1a3a5c;
        }
        .lightbox-image-container img {
          max-width: 100%;
          max-height: 70vh;
          border-radius: 8px;
        }
        .lightbox-caption {
          background: rgba(0,0,0,0.8);
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          color: white;
        }
        .lightbox-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.8rem;
          margin: 0.5rem 0;
        }
        .lightbox-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .lightbox-actions button {
          background: rgba(255,255,255,0.2);
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          cursor: pointer;
        }
        .lightbox-actions button:hover {
          background: #ffc107;
          color: #1a3a5c;
        }
        .no-results {
          text-align: center;
          padding: 3rem;
        }
        
        /* Responsive */
        @media (max-width: 992px) {
          .gallery-masonry {
            column-count: 2;
          }
        }
        @media (max-width: 768px) {
          .gallery-hero-content h1 {
            font-size: 1.8rem;
          }
          .gallery-grid {
            grid-template-columns: 1fr;
          }
          .gallery-masonry {
            column-count: 1;
          }
          .category-filters {
            justify-content: center;
          }
          .search-filter-container {
            flex-direction: column;
          }
          .lightbox-prev { left: -40px; }
          .lightbox-next { right: -40px; }
          .lightbox-prev, .lightbox-next {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </>
  );
};

export default GalleryPage;