import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, MapPin, Mail, ArrowRight, ShieldCheck, Dumbbell, Apple, UtensilsCrossed, Star, X, Leaf } from 'lucide-react';
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

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products');
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
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
        {/* Floating background decorative leaves for mobile view */}
        <div className="hero-deco-leaf-1 mobile-only">
          <Leaf size={120} />
        </div>
        <div className="hero-deco-leaf-2 mobile-only">
          <Leaf size={140} />
        </div>

        <div className="container hero-grid">
          <div className="hero-content">
            <div className="hero-logo-mobile">
              <img src="/images/logo.png" alt="Agadi Choorna Logo" />
            </div>
            <div className="hero-tag">
              <ShieldCheck size={16} />
              <span>100% Ayurvedic & Certified Powder</span>
            </div>
            <h1 className="hero-title">
              Gain Healthy Weight, <br />
              <span style={{ color: 'var(--secondary-green)' }}>Naturally & Safely</span>
            </h1>
            <p className="hero-subtitle">
              Agadi Choorna blends ancient Ayurvedic science with potent adaptogenic herbs like Cherukura and Venga to naturally enhance your appetite, improve nutrient absorption, and build lean muscle mass.
            </p>
            <div className="hero-buttons">
              <button
                onClick={() => {
                  const element = document.getElementById('products');
                  if (element) {
                    window.scrollTo({
                      top: element.offsetTop - 80,
                      behavior: 'smooth',
                    });
                  }
                }}
                className="btn btn-primary"
              >
                <span>Order Now</span>
                <ArrowRight size={18} />
              </button>
              <a href="tel:+919072888825" className="btn btn-outline">
                <Phone size={18} />
                <span>Call Expert</span>
              </a>
            </div>
          </div>

          <div className="hero-image-container">
            <img
              src="/images/product-pouch.jpg"
              alt="Agadi Choorna Weight Gain Powder"
              className="hero-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/product-pouch-alt.jpg';
              }}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section-padding">
        <div className="container about-grid">
          <div className="about-img-container">
            <img
              src="/images/herbs-ingredients.jpg"
              alt="Ayurvedic Natural Ingredients"
              className="about-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/product-pouch.jpg';
              }}
            />
          </div>
          <div className="about-content">
            <h2 className="section-title" style={{ display: 'block', margin: '0 0 16px 0' }}>About Agadi Choorna</h2>
            <h3 style={{ marginBottom: '16px' }}>Empowering Your Weight Gain Journey Authentically</h3>
            <p>
              Weight gain is not about loaded fats or artificial sugars; it is about building clean muscle bulk, normalizing metabolism, and nourishing bodily tissues (Dhatus).
            </p>
            <p style={{ marginBottom: '24px' }}>
              Agadi Choorna is an age-old herbal recipe that targets the root cause of underweight conditions—poor digestive fire (Agni) and low metabolism. By restoring metabolic balance, it increases your nutritional capacity, helping you gain weight steadily and hold it permanently.
            </p>

            {/* Ingredients */}
            <div className="about-info-block">
              <div className="about-info-label">
                <span className="about-dot"></span>
                Active Ingredients
              </div>
              <p className="about-info-text">
                Karinkali, Koduveli root, Thriphala, Iratti madhuram, Cherukura, Venga, Amukuram, Satavari, Neikumbalam.
              </p>
            </div>

            {/* Directions */}
            <div className="about-info-block">
              <div className="about-info-label">
                <span className="about-dot"></span>
                Directions for Use
              </div>
              <p className="about-info-text">
                Consume 1 spoon with milk twice daily after food (Morning &amp; Night). Can also be taken with lukewarm water.
              </p>
            </div>

            {/* Quick facts row */}
            <div className="about-facts-row">
              <span className="about-fact-pill">
                <ShieldCheck size={13} /> 100% Chemical Free
              </span>
              <span className="about-fact-pill">
                <ShieldCheck size={13} /> No Side-effects
              </span>
              <span className="about-fact-pill">
                <ShieldCheck size={13} /> Store Cool &amp; Dry
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits section-padding">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Key Health Benefits</h2>
            <p className="section-subtitle">
              Engineered with ancient Ayurvedic principles to support complete health transformation.
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon-container">
                <UtensilsCrossed size={28} />
              </div>
              <h3>Stimulates Appetite</h3>
              <p>Naturally triggers hunger receptors and ignites digestive enzymes to make sure you consume healthy meals consistently.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-container">
                <Apple size={28} />
              </div>
              <h3>Optimizes Digestion</h3>
              <p>Improves intestinal absorption capacity so every bit of nutrient and micro-element goes straight to building tissues.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-container">
                <Dumbbell size={28} />
              </div>
              <h3>Promotes Muscle Mass</h3>
              <p>Stimulates synthesis of muscle fibers instead of fat accumulation, ensuring an aesthetically healthy build.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-container">
                <ShieldCheck size={28} />
              </div>
              <h3>Regulates Metabolism</h3>
              <p>Balances the hyperactive thyroid glands and stress markers to block unnecessary calorie combustion.</p>
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
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: 'var(--primary-green)' }}>
              Loading products...
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
              View All 1000+ Customer Results &rarr;
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
              <a href="https://wa.me/919072888825?text=Hello,%20I'd%20like%20to%20place%20an%20order%20for%20Agadi%20Choornam." target="_blank" rel="noopener noreferrer" className="contact-card">
                <div className="contact-icon-wrapper">
                  <MessageSquare size={24} />
                </div>
                <div className="contact-details">
                  <h4>WhatsApp Order Support</h4>
                  <p>Chat directly with our support team to place orders or ask queries.</p>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>Click to chat &rarr;</strong>
                </div>
              </a>

              <a href="tel:+919072888825" className="contact-card">
                <div className="contact-icon-wrapper">
                  <Phone size={24} />
                </div>
                <div className="contact-details">
                  <h4>Phone Hotline</h4>
                  <p>Call directly to consult with our healthcare advisors.</p>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>+91 9072888825 &rarr;</strong>
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
                  <label htmlFor="contact-email">Email Address</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="name@example.com"
                    required
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
      <a href="tel:+919072888825" className="floating-call" aria-label="Call Support Now">
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
    </div>
  );
};

export default Home;
