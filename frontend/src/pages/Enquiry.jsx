import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, Play, Pause, Video, MessageSquare, Phone, Send,
  CheckCircle2, ShieldCheck, HelpCircle, Sparkles, ArrowLeft, Stethoscope,
  Headphones, FileText, Download, Mic, Users, Star, ChevronDown, ChevronUp,
  Lock, MessageCircle, X
} from 'lucide-react';
import reviewImages from '../utils/reviewImages';

const CUSTOMER_VOICE_REVIEWS = Array.from({ length: 33 }, (_, i) => {
  const index = i + 1;
  const quotes = [
    'After using Agadi Choornam, I gained 5 kgs in 35 days!',
    'Improved appetite and energy levels. Highly recommended!',
    'Natural and effective. No side effects at all.',
    'Gained 4 kgs in 1 month cleanly without bloating.',
    'Very good Ayurvedic medicine for appetite stimulation.',
    'My digestion has improved so much. Gained 6 kgs total.',
    'Great results, taste is very natural and earthy.',
    'Worked wonders for my weight gain journey.',
    'Natural weight gain powder without any chemicals.',
    'Noticeable difference in appetite within one week!',
    'Gained 3.5 kgs naturally. Tastes very authentic.',
    'Best Ayurvedic weight gain choornam I have used.',
    'Helped me build body confidence naturally.',
    'Super fast delivery and authentic herbs!',
    'Consistently gained healthy weight without fat.',
    'Appetite restored within a few days of taking it.',
    '100% safe and effective weight gain formula.',
    'My body feels energetic and healthy every morning.',
    'Highly satisfied with the product results!',
    'Pure natural herbs, no side effects observed.',
    'Gained 5 kgs in 2 months. Absolutely genuine!',
    'Very effective choornam for weak metabolism.',
    'Appetite booster that actually works.',
    'Natural ingredients and trustworthy quality.',
    'Gained clean muscle mass naturally.',
    'Loved the product! Reordering my 2nd pouch.',
    'Excellent digestive support and weight gain.',
    'Visible weight gain in just 3 weeks!',
    'Trusted product recommended by Ayurvedic advisor.',
    'Safe for daily use with lukewarm milk.',
    'Gained healthy appetite and steady weight.',
    '100% natural, very happy with my progress!',
    'Highly recommended for anyone struggling with underweight.'
  ];
  const durations = ['0:45', '0:38', '0:51', '0:42', '0:48', '0:35', '0:40', '0:55', '0:32', '0:36', '0:44', '0:50', '0:41', '0:39', '0:52', '0:37', '0:47', '0:46', '0:43', '0:40', '0:54', '0:33', '0:42', '0:30', '0:53', '0:51', '0:44', '0:31', '0:42', '0:48', '0:38', '0:38', '0:36'];

  return {
    id: index,
    name: `Customer ${index}`,
    location: `Kerala`,
    src: `/images/customer${index}.mp3`,
    duration: durations[i % durations.length],
    quote: quotes[i % quotes.length]
  };
});

const Enquiry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedProduct = location.state?.product;

  // Main Audio player state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Video Modal state
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Customer voices audio state
  const customerAudioRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [showAllVoices, setShowAllVoices] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: selectedProduct ? selectedProduct.name : 'Agadi Choorna (Weight Gain Formula)',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Media source paths in public/images/
  const videoSource = '/images/WhatsApp Video 2026-07-29 at 3.56.51 PM.mp4';
  const audioSource = '/images/WhatsApp Audio 2026-07-29 at 3.56.51 PM.mp4';

  // Handle Main Audio Autoplay on page load
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryAutoplay = () => {
      audio.muted = false;
      setIsMuted(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((error) => {
            console.log('Unmuted autoplay prevented by browser policy:', error);
            audio.muted = true;
            setIsMuted(true);
            audio.play()
              .then(() => {
                setIsPlaying(true);
                setTimeout(() => {
                  audio.muted = false;
                  setIsMuted(false);
                }, 300);
              })
              .catch((err) => {
                console.log('Autoplay blocked:', err);
                setIsPlaying(false);
                setAutoplayBlocked(true);
              });
          });
      }
    };

    tryAutoplay();

    const handleUserInteraction = () => {
      if (audioRef.current && (audioRef.current.paused || audioRef.current.muted)) {
        audioRef.current.muted = false;
        setIsMuted(false);
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {});
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, []);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (customerAudioRef.current) customerAudioRef.current.pause();
      setPlayingVoiceId(null);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => console.log('Audio play error:', err));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMutedState = !isMuted;
    audioRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleWatchDoctorVideo = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (customerAudioRef.current) {
      customerAudioRef.current.pause();
      setPlayingVoiceId(null);
    }
    setShowVideoModal(true);
  };

  const voiceAudioRef = useRef(null);

  const toggleVoicePlay = (voice) => {
    if (playingVoiceId === voice.id) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
    }

    const newAudio = new Audio(voice.src);
    voiceAudioRef.current = newAudio;

    newAudio.onended = () => setPlayingVoiceId(null);
    newAudio.onerror = () => {
      console.log('Customer voice audio error:', voice.src);
      setPlayingVoiceId(null);
    };

    newAudio.play()
      .then(() => setPlayingVoiceId(voice.id))
      .catch((err) => {
        console.log('Customer voice play error:', err);
        setPlayingVoiceId(null);
      });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const text = encodeURIComponent(
      `*New Enquiry from Website*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Email:* ${formData.email || 'N/A'}\n` +
      `*Product:* ${formData.product}\n` +
      `*Message:* ${formData.message}`
    );
    window.open(`https://wa.me/918139800282?text=${text}`, '_blank');
  };

  const visibleVoices = showAllVoices ? CUSTOMER_VOICE_REVIEWS : CUSTOMER_VOICE_REVIEWS.slice(0, 4);

  return (
    <div className="enquiry-page model-page">
      {/* Hidden Main Audio Element */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      >
        <source src="/images/WhatsApp Audio 2026-07-29 at 3.56.51 PM.mp4" />
        <source src="/images/enquiry-audio.mp3" type="audio/mp3" />
      </audio>

      {/* Hidden Customer Voice Audio Element */}
      <audio
        ref={customerAudioRef}
        onEnded={() => setPlayingVoiceId(null)}
        onError={() => setPlayingVoiceId(null)}
      />

      {/* Floating Audio Bar */}
      <div className={`audio-floating-bar ${isPlaying ? 'active' : ''}`}>
        <div className="container audio-bar-content">
          <div className="audio-info">
            <div className={`audio-equalizer ${isPlaying ? 'playing' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="audio-text-wrap">
              <span className="audio-label">Listen to Product Details</span>
              <span className="audio-time">{formatTime(currentTime)} / {formatTime(duration || 168)}</span>
            </div>
          </div>

          <div className="audio-seek-container">
            <input
              type="range"
              min="0"
              max={duration || 168}
              value={currentTime}
              onChange={handleSeek}
              className="audio-seek-bar"
            />
          </div>

          <div className="audio-controls">
            <button onClick={toggleMute} className="audio-control-btn" title={isMuted ? 'Unmute Audio' : 'Mute Audio'}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={togglePlay}
              className="audio-control-btn audio-control-btn--play"
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
              style={{ width: 'auto', padding: '0 14px', borderRadius: '100px', gap: '5px' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Pretty Hero Banner */}
      <div className="pretty-enquiry-hero">
        <div className="container text-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button onClick={() => navigate('/')} className="back-link-btn">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>

            {isPlaying && (
              <button
                onClick={togglePlay}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  padding: '6px 16px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <Pause size={14} style={{ fill: '#fff' }} />
                <span>Pause Audio Guide</span>
              </button>
            )}
          </div>

          <div className="hero-pill-badge">
            <Sparkles size={14} style={{ color: '#fbbf24' }} />
            <span>Official Agadi Choorna Product Guidance</span>
          </div>

          <h1 className="pretty-hero-title">
            Agadi Choorna Guidance &amp; Voice Center
          </h1>
          <p className="pretty-hero-subtitle">
            Listen to complete audio details, watch doctor explanation videos, view 10,000+ happy customer transformations, and hear authentic voice reviews from Kerala customers.
          </p>
        </div>
      </div>

      {/* Main Model Sections Container */}
      <div className="container model-sections-container">
        
        {/* ROW 1: Doctor's Explanation */}
        <div className="model-card">
          <div className="model-card-info" style={{ maxWidth: '680px' }}>
            <div className="model-card-header-row">
              <div className="model-icon-circle doctor-bg">
                <img src="/doctor.webp" alt="Doctor Advice Logo" className="doctor-logo-img" />
              </div>
              <h2 className="model-card-title">Doctor's Explanation</h2>
            </div>
            <p className="model-card-desc">
              Watch the doctor's complete explanation about AGADI CHOORNAM and how it helps in healthy weight gain.
            </p>
            <button onClick={handleWatchDoctorVideo} className="btn btn-primary model-cta-btn">
              <Play size={16} style={{ fill: '#fff' }} />
              <span>Watch Now</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Listen to Product Details */}
        <div className="model-card">
          <div className="model-card-grid">
            <div className="model-card-info">
              <div className="model-card-header-row">
                <div className="model-icon-circle audio-bg">
                  <Headphones size={24} />
                </div>
                <h2 className="model-card-title">Listen to Product Details</h2>
              </div>
              <p className="model-card-desc">
                Listen to the complete product details, ingredients, benefits, dosage and usage instructions.
              </p>

              <div className="model-audio-player">
                <div className="player-main">
                  <button onClick={togglePlay} className="player-play-btn">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                  </button>
                  <div className="player-progress-area">
                    <div className="player-title">Agadi Choorna Voice Guide</div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 168}
                      value={currentTime}
                      onChange={handleSeek}
                      className="player-slider"
                    />
                    <div className="player-timestamps">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration || 168)}</span>
                    </div>
                  </div>
                </div>
                <div className="audio-duration-meta">
                  <Volume2 size={14} /> Duration: 2:48 min
                </div>
              </div>
            </div>

            <div className="model-card-media">
              <div className="model-product-img-wrap">
                <img
                  src="/images/product-pouch.webp"
                  alt="Agadi Choorna Product Pack"
                  className="model-product-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/herbs-ingredients.jpg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: 10,000+ Customer Results */}
        <div className="model-card">
          <div className="model-card-grid">
            <div className="model-card-info">
              <div className="model-card-header-row">
                <div className="model-icon-circle pdf-bg">
                  <FileText size={24} />
                </div>
                <h2 className="model-card-title">10,000+ Customer Results</h2>
              </div>
              <p className="model-card-desc">
                Real results from real people. See 100+ pages of amazing weight gain transformations from our happy customers across Kerala.
              </p>
              <div className="results-pages-subtext" style={{ color: 'var(--primary-green)', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> 100+ Pages of Before &amp; After Transformations
              </div>
            </div>

            <div className="model-card-media">
              <div className="model-results-preview-wrap" onClick={() => navigate('/results')} style={{ cursor: 'pointer' }}>
                <img
                  src={`/review/${reviewImages[0] || '1.webp'}`}
                  alt="Customer Weight Gain Transformations"
                  className="model-results-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/product-pouch.webp';
                  }}
                />
                <div className="results-preview-overlay">
                  <span className="badge-10k">10,000+ Happy Transformations</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-green)', marginTop: '4px' }}>Explore All 10,000+ Results &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: Customer Voices */}
        <div className="model-card">
          <div className="model-card-grid">
            <div className="model-card-info">
              <div className="model-card-header-row">
                <div className="model-icon-circle mic-bg">
                  <Mic size={24} />
                </div>
                <h2 className="model-card-title">Customer Voices</h2>
              </div>
              <p className="model-card-desc">
                Hear what our real customers have to say about their experience with AGADI CHOORNAM.
              </p>
              <div className="model-voices-stats">
                <div className="stat-pill">
                  <Users size={14} />
                  <span>500+ Voice Messages</span>
                </div>
                <div className="stat-pill rating-pill">
                  <Star size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                  <span>4.9★ Customer Rating</span>
                </div>
              </div>
            </div>

            <div className="model-card-media">
              <div className="customer-voices-list">
                {visibleVoices.map((voice) => (
                  <div key={voice.id} className={`voice-review-item ${playingVoiceId === voice.id ? 'active-playing' : ''}`}>
                    <img src="/contact.webp" alt="Customer Contact" className="voice-contact-img" />
                    <div className="voice-review-body">
                      <div className="voice-user-header">
                        <strong>Customer {voice.id}</strong>
                        <span className="voice-duration-badge">{voice.duration}</span>
                      </div>
                      <p className="voice-quote">"{voice.quote}"</p>
                    </div>
                    <button
                      onClick={() => toggleVoicePlay(voice)}
                      className={`voice-play-btn ${playingVoiceId === voice.id ? 'playing' : ''}`}
                      title={playingVoiceId === voice.id ? 'Pause Voice' : 'Play Voice'}
                    >
                      {playingVoiceId === voice.id ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setShowAllVoices(!showAllVoices)}
                  className="view-more-voices-btn"
                >
                  <span>{showAllVoices ? 'Show Less Voices' : `View More Voices (${CUSTOMER_VOICE_REVIEWS.length} total)`}</span>
                  {showAllVoices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Need Help? WhatsApp Support Bar */}
        <div className="model-card whatsapp-help-card">
          <div className="model-card-grid">
            <div className="model-card-info">
              <div className="model-card-header-row">
                <div className="model-icon-circle whatsapp-bg">
                  <MessageSquare size={24} />
                </div>
                <h2 className="model-card-title" style={{ color: '#166534' }}>Need Help?</h2>
              </div>
              <p className="model-card-desc">
                Our Ayurvedic support team is here to help you. Chat with us on WhatsApp for any queries or orders.
              </p>
              <a
                href="https://wa.me/918139800282?text=Hello,%20I%20have%20an%20enquiry%20regarding%20Agadi%20Choornam."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp model-cta-btn"
              >
                <MessageCircle size={18} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="model-card-media">
              <div className="whatsapp-help-box">
                <div className="help-box-sub">We are just a message away!</div>
                <div className="help-phone-number">+91 81398 00282</div>
                <div className="help-trust-pills">
                  <span>⚡ Quick Reply</span>
                  <span>💚 Friendly Support</span>
                  <span>🔒 100% Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Form Submission */}
        <div className="enquiry-form-card" style={{ marginTop: '36px' }}>
          <div className="form-header">
            <h3>Submit an Enquiry Message</h3>
            <p>Fill out the form below for personalized product information or bulk order requests.</p>
          </div>

          {submitted ? (
            <div className="enquiry-success-message">
              <CheckCircle2 size={48} className="success-icon" />
              <h4>Enquiry Sent Successfully!</h4>
              <p>Thank you for reaching out. Our team has received your enquiry and will contact you via WhatsApp or Phone shortly.</p>
              <button onClick={() => setSubmitted(false)} className="btn btn-outline btn-sm" style={{ marginTop: '16px' }}>
                Send Another Enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="enquiry-form">
              <div className="form-group">
                <label htmlFor="enquiry-name">Your Full Name *</label>
                <input
                  type="text"
                  id="enquiry-name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="enquiry-phone">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  id="enquiry-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="enquiry-email">Email Address (Optional)</label>
                <input
                  type="email"
                  id="enquiry-email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="enquiry-product">Selected Product</label>
                <select
                  id="enquiry-product"
                  name="product"
                  value={formData.product}
                  onChange={handleFormChange}
                >
                  <option value="Agadi Choorna (Weight Gain Formula)">Agadi Choorna (Weight Gain Formula) - ₹1550</option>
                  <option value="Agadi Choorna 500g Pack">Agadi Choorna 500g Pack</option>
                  <option value="Agadi Choorna 1kg Family Pack">Agadi Choorna 1kg Family Pack</option>
                  <option value="General Health / Dosage Consultation">General Health / Dosage Consultation</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="enquiry-message">Your Question / Details *</label>
                <textarea
                  id="enquiry-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleFormChange}
                  placeholder="Ask about dosage, ingredients, delivery time, or diet suggestions..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary submit-enquiry-btn">
                <Send size={18} />
                <span>Submit &amp; Connect on WhatsApp</span>
              </button>

              <div className="form-trust-footer">
                <ShieldCheck size={16} />
                <span>100% Confidential &amp; Verified Ayurvedic Support</span>
              </div>
            </form>
          )}
        </div>

      </div>

      {/* Doctor Video Modal Popup */}
      {showVideoModal && (
        <div className="lightbox-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setShowVideoModal(false)} aria-label="Close video player">
              <X size={32} />
            </button>
            <video
              src={videoSource}
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

export default Enquiry;
