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

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!product) {
      fetchProduct();
    }
  }, [id, product]);

  const handleBuyNow = () => {
    if (user && user.isAdmin) {
      alert('Admin accounts cannot place orders. Please sign in with a customer account.');
      return;
    }
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading product details...</p>
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
    <div className="product-detail-page section-padding" style={{ backgroundColor: 'var(--bg-color)', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '1050px' }}>
        {/* Back Link / Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: 'var(--primary-green)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '4px 0'
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
          padding: '28px'
        }} className="product-detail-grid">

          {/* Left: Inner Page Image Directly */}
          <div style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: '#ffffff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              color: '#1e293b',
              margin: 0,
              lineHeight: 1.3
            }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-green)' }}>
                ₹{product.price}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                About This Product
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7', margin: 0 }}>
                {product.description}
              </p>
            </div>

            {/* Key Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div style={{ background: '#fbfcfb', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--primary-green)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Key Benefits & Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {product.benefits.map((benefit, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: '#334155' }}>
                      <Check size={15} style={{ color: 'var(--primary-green)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Buy Now & WhatsApp Enquiry */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn btn-primary"
                style={{
                  flex: '1 1 200px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
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

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{
                  flex: '1 1 180px',
                  padding: '12px 20px',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderColor: '#25D366',
                  color: '#15803d'
                }}
              >
                <MessageCircle size={18} style={{ color: '#25D366' }} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Trust Points */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginBottom: '2px' }}>✓ 100% Herbal</div>
                No Side Effects
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginBottom: '2px' }}>✓ Kerala Sourced</div>
                Authentic Herbs
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginBottom: '2px' }}>✓ Fast Delivery</div>
                Dispatched in 24 Hrs
              </div>
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
