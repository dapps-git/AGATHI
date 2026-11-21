import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, Check, ShieldCheck } from 'lucide-react';
import API from '../utils/api';
import OrderModal from '../components/OrderModal';
import { AuthContext } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(() => {
    if (location.state?.product) return location.state.product;
    try {
      const cached = localStorage.getItem('agadi_products_cache');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          const found = list.find(p => p._id === id);
          if (found) return found;
        }
      }
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(!product);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    // Always start at the top of the product detail page, never scrolled down or near the footer
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        if (data) {
          setProduct(data);
          try {
            const cached = localStorage.getItem('agadi_products_cache');
            if (cached) {
              const list = JSON.parse(cached);
              if (Array.isArray(list)) {
                const idx = list.findIndex(p => p._id === id);
                if (idx !== -1) {
                  list[idx] = data;
                } else {
                  list.push(data);
                }
                localStorage.setItem('agadi_products_cache', JSON.stringify(list));
              }
            }
          } catch (storageErr) {}
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBuyNow = () => {
    if (user && user.isAdmin) {
      alert('Admin accounts cannot place orders. Please sign in with a customer account.');
      return;
    }
    setShowOrderModal(true);
  };

  // Full-layout skeleton if loading on direct link without cache
  if (loading && !product) {
    return (
      <div className="product-detail-page section-padding" style={{ paddingTop: '90px', minHeight: '80vh' }}>
        <div className="container">
          <div className="skeleton-box" style={{ width: '130px', height: '22px', marginBottom: '24px', borderRadius: '6px' }} />
          <div className="product-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', minHeight: '320px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton-box" style={{ width: '75%', height: '32px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '35%', height: '28px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '70px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '48px', borderRadius: '10px', marginTop: '16px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section-padding text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--primary-green)', marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The product you are looking for might have been removed or is unavailable.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  // Only show the inner page image directly
  const innerImage = (product.images && (product.images[1] || product.images[0])) || '/images/product-pouch.webp';

  const waMessage = `Hello, I'd like to ask a question about *${product.name}* (₹${product.price}).`;
  const waUrl = `https://wa.me/919539416003?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="product-detail-page section-padding" style={{ backgroundColor: 'var(--bg-color)', minHeight: '85vh', paddingTop: '86px' }}>
      <div className="container" style={{ maxWidth: '980px', padding: '0 16px' }}>
        {/* Back Link / Breadcrumb */}
        <div style={{ marginBottom: '18px', paddingTop: '4px' }}>
          <button
            onClick={() => navigate('/', { state: { scrollTo: 'products' } })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: 'var(--primary-green)',
              fontWeight: '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '6px 0'
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </button>
        </div>

        {/* Product Inner Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr',
          gap: '32px',
          padding: '24px'
        }} className="product-detail-grid">

          {/* Left: Inner Page Image Directly (border box removed) */}
          <div style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: '0',
            border: 'none',
            background: 'transparent',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0'
          }}>
            <img
              src={innerImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/product-pouch.webp';
              }}
            />
          </div>

          {/* Right: Product Info & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title (reduced font size and weight) */}
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0,
              lineHeight: 1.3
            }}>
              {product.name}
            </h1>

            {/* Price (reduced font size and weight) */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--primary-green)' }}>
                ₹{product.price}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                About This Product
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0 }}>
                {product.description}
              </p>
            </div>

            {/* Key Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div style={{ background: '#fbfcfb', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--primary-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} /> Key Benefits & Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {product.benefits.map((benefit, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                      <Check size={14} style={{ color: 'var(--primary-green)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button: Only Buy Now Button */}
            <div style={{ marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(47, 79, 30, 0.2)'
                }}
              >
                <ShoppingBag size={18} />
                <span>Buy Now • ₹{product.price}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal on Buy Now */}
      {showOrderModal && (
        <OrderModal
          product={product}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Responsive Grid CSS for Product Detail */}
      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
