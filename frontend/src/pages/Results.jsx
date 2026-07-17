import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, X, ZoomIn } from 'lucide-react';
import reviewImages from '../utils/reviewImages';

const Results = () => {
  const [visibleCount, setVisibleCount] = useState(16);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 16);
  };

  return (
    <div className="results-page" style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      {/* Decorative background element */}
      <div className="results-bg-pattern" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '350px',
        backgroundImage: 'radial-gradient(var(--primary-green) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Back navigation */}
        <div style={{ marginBottom: '32px' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-secondary" 
            style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-green)', background: 'var(--accent-green)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '16px' }}>
            <Star size={12} fill="currentColor" /> 100% VERIFIED RESULTS
          </div>
          <h1 className="section-title" style={{ fontSize: '2.4rem', color: 'var(--primary-green)', fontWeight: '800', marginBottom: '12px' }}>Customer Transformations</h1>
          <p className="section-subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)' }}>
            Real before-and-after results, chat feedbacks, and weight progress screenshot archives reported by our customers across Kerala.
          </p>
        </div>

        {/* Results Grid */}
        <div className="results-grid">
          {reviewImages.slice(0, visibleCount).map((img, index) => (
            <div key={index} className="result-card" onClick={() => setSelectedImage(img)}>
              <img src={`/review/${img}`} alt={`Customer Result ${index + 1}`} loading="lazy" />
              <div className="result-card-overlay" style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(47, 79, 30, 0.4)',
                opacity: 0,
                display: 'flex',
                alignItems: 'center',
                justifycontent: 'center',
                transition: 'opacity 0.25s',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ background: '#fff', color: 'var(--primary-green)', padding: '8px', borderRadius: '50%', display: 'flex', boxShadow: 'var(--shadow-md)' }}>
                  <ZoomIn size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleCount < reviewImages.length && (
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button onClick={handleLoadMore} className="btn btn-primary" style={{ minWidth: '220px', padding: '14px 32px' }}>
              Load More Transformations
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)} aria-label="Close image zoom">
              <X size={28} />
            </button>
            <img src={`/review/${selectedImage}`} alt="Customer Result Zoomed" className="lightbox-img" />
          </div>
        </div>
      )}

      {/* CSS overrides for hover overlay */}
      <style>{`
        .result-card { position: relative; }
        .result-card:hover .result-card-overlay { opacity: 1 !important; display: flex !important; justify-content: center !important; align-items: center !important; }
      `}</style>
    </div>
  );
};

export default Results;
