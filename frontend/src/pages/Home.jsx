import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, MessageCircle, MapPin, Mail, ArrowRight, ShieldCheck, Dumbbell, Apple, UtensilsCrossed, Star, X, Leaf, Users2, Users, Video, Stethoscope, Mic, Play, Pause, TrendingUp, Sun, Moon, Volume2 } from 'lucide-react';
import API from '../utils/api';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import { AuthContext } from '../context/AuthContext';
import reviewImages from '../utils/reviewImages';

const REVIEWS = [
  {
    name: 'Suresh Kumar',
    location: 'Wayanad, Kerala',
    text: 'I was struggling with low weight and weak appetite for years. After using Agadi Choorna for 2 months, I gained 6 kgs naturally. My digestion is much better now!',
    rating: 5,
  },
  {
    name: 'Anjali Menon',
    location: 'Ernakulam, Kerala',
    text: 'Highly recommended! Unlike other weight gain powders, this did not cause any bloating or side-effects. It is 100% natural, and the taste is very earthy and herbal.',
    rating: 5,
  },
];

const DEFAULT_AGADI_PRODUCT = {
  _id: 'agadi-choorna-default',
  name: 'Agadi Choorna (Weight Gain Formula)',
  price: 1550,
  description: 'Pure 100% Ayurvedic herbal blend for natural weight gain, appetite stimulation, and gut health.',
  images: ['/images/product-pouch.webp'],
  benefits: [
    'Naturally Stimulates Appetite & Digestion',
    'Promotes Healthy Weight & Muscle Gain',
    '100% Herbal & Chemical Free Formula',
    'Improves Intestinal Nutrient Absorption'
  ]
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([DEFAULT_AGADI_PRODUCT]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Home Customer Voice state
  const homeVoiceAudioRef = useRef(null);
  const [playingHomeVoiceId, setPlayingHomeVoiceId] = useState(null);

  // Video Modal state
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Hero image slider state
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderImages = [
    '/images/product-pouch.webp',
    '/images/product-pouch-alt.webp'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const location = useLocation();

  const onScrollTo = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setTimeout(() => {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, []);

  // Handle routing scroll state
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      onScrollTo(location.state.scrollTo);
    }
  }, [location]);

  const DEFAULT_CUSTOMER_VOICES = [
    { _id: '1', name: 'Verified Review', photo: '/contact.webp', audioUrl: '/images/customer1.mp3', duration: '0:28', quote: 'Gained 4 kg in 15 days' },
    { _id: '2', name: 'Verified Review', photo: '/contact.webp', audioUrl: '/images/customer2.mp3', duration: '0:32', quote: 'Appetite increased a lot' },
    { _id: '3', name: 'Verified Review', photo: '/contact.webp', audioUrl: '/images/customer3.mp3', duration: '0:26', quote: 'Very good result, happy' }
  ];
  const [customerVoices, setCustomerVoices] = useState(DEFAULT_CUSTOMER_VOICES);

  // Fetch products (updates dynamically if API available, else keeps static DEFAULT_AGADI_PRODUCT)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products');
        if (data && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      } catch (error) {
        // Keeps static DEFAULT_AGADI_PRODUCT seamlessly
      }
    };
    fetchProducts();
  }, []);

  // Fetch audio reviews (updates dynamically if API available, else keeps static DEFAULT_CUSTOMER_VOICES)
  useEffect(() => {
    const fetchAudioReviews = async () => {
      try {
        const { data } = await API.get('/audio-reviews');
        if (data && Array.isArray(data) && data.length > 0) {
          setCustomerVoices(data);
        }
      } catch (error) {
        // Keeps static DEFAULT_CUSTOMER_VOICES seamlessly
      }
    };
    fetchAudioReviews();
  }, []);

  // Auto-open order modal if user clicked Buy Now as a guest and has logged in
  useEffect(() => {
    const savedProductId = localStorage.getItem('selectedProductId');
    if (savedProductId && user && !user.isAdmin && products.length > 0) {
      const prod = products.find(p => p._id === savedProductId);
      if (prod) {
        setSelectedProduct(prod);
      }
      localStorage.removeItem('selectedProductId');
    }
  }, [user, products]);

  const handleBuyNow = (product) => {
    if (!user) {
      localStorage.setItem('selectedProductId', product._id);
      navigate('/login');
    } else if (user.isAdmin) {
      alert('Admin accounts cannot place orders. Please log out and sign in with a customer account.');
    } else {
      setSelectedProduct(product);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-banner-wrap">
          {/* Desktop hero image */}
          <img
            src="/images/hero-banner.webp"
            alt="Agadi Choornam - Natural Weight Gain The Ayurvedic Way"
            className="hero-banner-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          {/* Mobile hero image */}
          <img
            src="/images/mobilehero.webp"
            alt="Agadi Choornam - Natural Weight Gain The Ayurvedic Way"
            className="hero-banner-img-mobile"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          {/* Mobile-only: buttons overlaid at bottom of image */}
          <div className="hero-mobile-cta">
            <button
              onClick={() => {
                const element = document.getElementById('products');
                if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
              }}
              className="hero-mobile-btn"
            >
              <span>Order Now</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="https://wa.me/918139800282?text=Hello,%20I'd%20like%20to%20get%20expert%20guidance%20on%20Agadi%20Choornam."
              target="_blank"
              rel="noopener noreferrer"
              className="hero-mobile-btn hero-mobile-btn--outline"
            >
              <MessageCircle size={16} />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>

        {/* Desktop-only: green bar below image */}
        <div className="hero-banner-cta">
          <button
            onClick={() => {
              const element = document.getElementById('products');
              if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
            }}
            className="btn btn-primary hero-banner-btn"
          >
            <span>Order Now</span>
            <ArrowRight size={18} />
          </button>
          <a
            href="https://wa.me/918139800282?text=Hello,%20I'd%20like%20to%20get%20expert%20guidance%20on%20Agadi%20Choornam."
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline hero-banner-btn"
          >
            <MessageCircle size={18} />
            <span>WhatsApp Support</span>
          </a>
        </div>
      </section>

      {/* Consolidated 1-Page Customer Catchy Showcase Section */}
      <section id="about" className="compact-showcase-section">
        <div id="benefits" className="container compact-showcase-container">
          
          {/* 1. Why Choose Agadi Choornam? */}
          <div className="showcase-block">
            <h2 className="showcase-title">Why Choose Agadi Choornam?</h2>
            <div className="why-choose-grid">
              <div className="why-card">
                <div className="why-icon-wrap">
                  <UtensilsCrossed size={34} className="why-icon" />
                </div>
                <h3 className="why-card-title">Improves Appetite</h3>
                <p className="why-card-desc">Helps you eat better and get essential nutrients.</p>
              </div>

              <div className="why-card">
                <div className="why-icon-wrap">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="why-icon">
                    <path d="M12 3a4.5 4.5 0 0 0-4.5 4.5c0 1.8.8 3.2.8 5 0 2.5-2 3.5-2 5.5A4 4 0 0 0 10.3 22h3.4A4 4 0 0 0 17.7 18c0-2-2-3-2-5.5 0-1.8.8-3.2.8-5A4.5 4.5 0 0 0 12 3Z" />
                    <path d="M9 13.5c1 1.2 2 1.2 3 0" />
                  </svg>
                </div>
                <h3 className="why-card-title">Supports Digestion</h3>
                <p className="why-card-desc">Helps in better nutrient absorption.</p>
              </div>

              <div className="why-card">
                <div className="why-icon-wrap">
                  <TrendingUp size={34} className="why-icon" />
                </div>
                <h3 className="why-card-title">Supports Healthy Weight Gain</h3>
                <p className="why-card-desc">Nourishes the body naturally.</p>
              </div>

              <div className="why-card">
                <div className="why-icon-wrap">
                  <Leaf size={34} className="why-icon" />
                </div>
                <h3 className="why-card-title">Ayurvedic Ingredients</h3>
                <p className="why-card-desc">Made with traditional herbs.</p>
              </div>
            </div>
          </div>

          <div className="showcase-divider"></div>

          {/* 2. How to Use */}
          <div className="showcase-block">
            <h2 className="showcase-title">How to Use</h2>
            <div className="how-to-use-layout">
              <div className="how-steps-grid">
                <div className="how-step-card">
                  <div className="how-icon-box">
                    <span className="how-step-emoji">🥄</span>
                  </div>
                  <span className="how-step-label">1 Spoon</span>
                </div>

                <div className="how-step-card">
                  <div className="how-icon-box">
                    <span className="how-step-emoji">🥛</span>
                  </div>
                  <span className="how-step-label">With Lukewarm<br />Milk / Water</span>
                </div>

                <div className="how-step-card">
                  <div className="how-icon-box">
                    <Sun size={34} className="how-sun-icon" />
                  </div>
                  <span className="how-step-label">Morning<br />After Food</span>
                </div>

                <div className="how-step-card">
                  <div className="how-icon-box">
                    <Moon size={34} className="how-moon-icon" />
                  </div>
                  <span className="how-step-label">Night<br />After Food</span>
                </div>
              </div>

              <div className="how-additional-card">
                <h4 className="how-additional-title">Additional Instructions</h4>
                <ul className="how-additional-list">
                  <li>Milk can be normal or milk powder.</li>
                  <li>Can also be taken with lukewarm water.</li>
                  <li>Prefer after food.</li>
                </ul>
                <button
                  onClick={() => {
                    const element = document.getElementById('products');
                    if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
                  }}
                  className="how-read-more-btn"
                >
                  <span>Read Full Instructions</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="showcase-divider"></div>

          {/* 3. Traditional Ayurvedic Ingredients (Aligned like Image 1) */}
          <div className="showcase-block">
            <div className="ingredients-layout">
              <div className="ingredients-text-side">
                <h3 className="ingredients-heading">
                  Traditional Ayurvedic Ingredients
                </h3>
                <div className="ingredients-list-wrap">
                  <p className="ingredients-line">
                    Karinkali &bull; Koduveli Root &bull; Triphala &bull; Iratti Madhuram
                  </p>
                  <p className="ingredients-line">
                    Cherukura &bull; Venga &bull; Amukuram &bull; Shatavari &bull; Neikumbalam
                  </p>
                </div>
              </div>
              <div className="ingredients-image-side">
                <img
                  src="/images/herbs-ingredients.jpg"
                  alt="Traditional Ayurvedic Ingredients"
                  className="ingredients-banner-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/product-pouch.webp';
                  }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Benefits Trust Highlight Banner */}
        <div className="benefits-trust-banner">
          <div className="trust-banner-item">
            <span className="trust-banner-number">10,000+</span>
            <span className="trust-banner-text">Trusted Users</span>
          </div>
          <div className="trust-banner-divider"></div>
          <div className="trust-banner-item">
            <span className="trust-banner-number">Proven Results</span>
            <span className="trust-banner-text">With Pure Herbs</span>
          </div>
          <div className="trust-banner-divider"></div>
          <div className="trust-banner-item">
            <span className="trust-banner-number">100% Safe</span>
            <span className="trust-banner-text">Natural Formula</span>
          </div>
        </div>

        {/* Customer Voice Reviews & Doctor's Explanation Section (Aligned like Image 2) */}
        <div className="container voice-and-doctor-container">
          
          {/* Header Row */}
          <div className="voice-section-header">
            <div className="voice-section-title-wrap">
              <Volume2 size={18} className="voice-speaker-icon" />
              <h3 className="voice-section-title">Customer Voice Reviews</h3>
            </div>
            <button onClick={() => navigate('/enquiry')} className="listen-more-btn">
              <span>More Audios</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* 3 Voice Cards in 1 Row */}
          <div className="voice-compact-grid">
            {customerVoices.slice(0, 3).map((voice) => {
              const voiceId = voice._id || voice.id;
              const audioSrc = voice.audioUrl || voice.src;
              const isPlayingThis = playingHomeVoiceId === voiceId;
              return (
                <div key={voiceId} className={`voice-compact-card ${isPlayingThis ? 'playing-card' : ''}`}>
                  <button
                    onClick={() => {
                      if (isPlayingThis) {
                        if (homeVoiceAudioRef.current) homeVoiceAudioRef.current.pause();
                        setPlayingHomeVoiceId(null);
                        return;
                      }

                      if (homeVoiceAudioRef.current) {
                        homeVoiceAudioRef.current.pause();
                      }

                      const newAudio = new Audio(audioSrc);
                      homeVoiceAudioRef.current = newAudio;

                      newAudio.onended = () => setPlayingHomeVoiceId(null);
                      newAudio.onerror = () => setPlayingHomeVoiceId(null);

                      newAudio.play()
                        .then(() => setPlayingHomeVoiceId(voiceId))
                        .catch(() => setPlayingHomeVoiceId(null));
                    }}
                    className={`voice-compact-play-btn ${isPlayingThis ? 'playing' : ''}`}
                    title={isPlayingThis ? 'Pause Voice' : 'Play Voice'}
                    aria-label={isPlayingThis ? 'Pause Voice' : 'Play Voice'}
                  >
                    {isPlayingThis ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                  </button>

                  <div className="voice-compact-details">
                    <div className="voice-waveform-row">
                      <div className={`voice-waveform-bars ${isPlayingThis ? 'animating' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="voice-time-text">{voice.duration || '0:28'}</span>
                    </div>
                    <p className="voice-compact-quote">"{voice.quote}"</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Doctor's Explanation Horizontal Card */}
          <div className="doctor-compact-card">
            <div className="doctor-thumb-wrap" onClick={() => setShowVideoModal(true)}>
              <img src="/doctor.webp" alt="Doctor Advice Logo" className="doctor-thumb-img" />
              <div className="doctor-play-circle">
                <Play size={16} style={{ fill: '#ffffff', marginLeft: '2px' }} />
              </div>
            </div>
            <div className="doctor-compact-content">
              <h3 className="doctor-compact-title">Doctor's Explanation</h3>
              <p className="doctor-compact-desc">
                Watch certified Ayurvedic doctor explain about Agadi Choornam, ingredients and benefits.
              </p>
              <button onClick={() => setShowVideoModal(true)} className="doctor-watch-btn">
                <span>Watch Video</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Product Section */}
      <section id="products" className="products section-padding" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Our Premium Formulations</h2>
            <p className="section-subtitle">
              Choose the package that aligns with your goal. Freshly processed herbs sealed for freshness.
            </p>
          </div>

          {loading ? (
            <div className="products-grid products-grid--single">
              <div className="product-skeleton-card">
                <div className="skeleton-box" style={{ width: '100%', height: '220px', borderRadius: '14px' }} />
                <div className="skeleton-box" style={{ width: '65%', height: '24px', borderRadius: '6px', marginTop: '6px' }} />
                <div className="skeleton-box" style={{ width: '95%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <div className="skeleton-box" style={{ width: '55%', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '50%', height: '14px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div className="skeleton-box" style={{ width: '85px', height: '30px', borderRadius: '6px' }} />
                  <div className="skeleton-box" style={{ width: '125px', height: '40px', borderRadius: '25px' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`products-grid${products.length === 1 ? ' products-grid--single' : ''}`}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} onBuyNow={handleBuyNow} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews section-padding">
        <div className="container" style={{ maxWidth: '100%', padding: '0' }}>
          <div className="text-center" style={{ padding: '0 24px' }}>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Real results reported by real people from across Kerala.
            </p>
          </div>

          {/* Animated sliding train (Marquee) */}
          <div className="reviews-marquee-container">
            <div className="reviews-marquee-track">
              {reviewImages.slice(0, 18).map((img, i) => (
                <img
                  key={i}
                  src={`/review/${img}`}
                  alt="Customer Review screenshot"
                  className="marquee-img"
                  onClick={() => setSelectedImage(img)}
                />
              ))}
              {/* Duplicate list for seamless infinite loop */}
              {reviewImages.slice(0, 18).map((img, i) => (
                <img
                  key={`dup-${i}`}
                  src={`/review/${img}`}
                  alt="Customer Review screenshot"
                  className="marquee-img"
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/results')} className="view-all-results-link">
              View All 10,000+ Customer Results &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact section-padding">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Connect With Us</h2>
            <p className="section-subtitle">
              Have questions about dosage or duration? Reach out to our Ayurvedic practitioners.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <a href="https://wa.me/918139800282?text=Hello,%20I'd%20like%20to%20place%20an%20order%20for%20Agadi%20Choornam." target="_blank" rel="noopener noreferrer" className="contact-card">
                <div className="contact-icon-wrapper">
                  <MessageSquare size={24} />
                </div>
                <div className="contact-details">
                  <h4>WhatsApp Order Support</h4>
                  <p>Chat directly with our support team to place orders or ask queries.</p>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>Click to chat &rarr;</strong>
                </div>
              </a>

              <a href="tel:+918139800282" className="contact-card">
                <div className="contact-icon-wrapper">
                  <Phone size={24} />
                </div>
                <div className="contact-details">
                  <h4>Phone Hotline</h4>
                  <p>Call directly to consult with our healthcare advisors.</p>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>+91 81398 00282 &rarr;</strong>
                </div>
              </a>
            </div>

            <div className="contact-form-container">
              <h3>Drop Us a Message</h3>
              {contactSuccess && (
                <div className="alert alert-success">Your message has been sent successfully. We will get back to you soon!</div>
              )}
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="contact-name">Your Name</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email Address (Optional)</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    placeholder="Tell us what you need..."
                    rows={4}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Call Button */}
      <a href="tel:+918139800282" className="floating-call" aria-label="Call Support Now">
        <Phone size={20} />
      </a>

      {/* Order Modal */}
      {selectedProduct && (
        <OrderModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

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

      {/* Doctor Video Modal Popup */}
      {showVideoModal && (
        <div className="lightbox-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setShowVideoModal(false)} aria-label="Close video player">
              <X size={32} />
            </button>
            <video
              src="/images/WhatsApp Video 2026-07-29 at 3.56.51 PM.mp4"
              autoPlay
              controls
              playsInline
              className="modal-video-element"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
