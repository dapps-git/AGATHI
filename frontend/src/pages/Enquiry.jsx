import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Play, Pause, Video, MessageSquare, Phone, Send, CheckCircle2, ShieldCheck, HelpCircle, Sparkles, ArrowLeft } from 'lucide-react';

const Enquiry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedProduct = location.state?.product;

  // Audio player state
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Video player state
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  // Handle Audio Autoplay on page load
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
            // Try playing with mute first, then unmute
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

    // Trigger autoplay immediately
    tryAutoplay();

    // Trigger on first click / touch / scroll anywhere on page if paused
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

  // Time format helper (seconds -> mm:ss)
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

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      // Pause audio if video starts playing to prevent overlapping sound
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Format WhatsApp message as backup quick action
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

  return (
    <div className="enquiry-page">
      {/* Hidden Audio Element with Event Listeners */}
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
        onError={(e) => {
          console.log('Audio loading error:', e);
        }}
      >
        <source src="/images/WhatsApp Audio 2026-07-29 at 3.56.51 PM.mp4" />
        <source src="/images/enquiry-audio.mp3" type="audio/mp3" />
      </audio>

      {/* Floating Audio Bar / Header Notice */}
      <div className={`audio-floating-bar ${isPlaying ? 'active' : ''}`}>
        <div className="container audio-bar-content">
          <div className="audio-info">
            <div className={`audio-equalizer ${isPlaying ? 'playing' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="audio-text-wrap">
              <span className="audio-label">Agadi Choorna Audio Guide</span>
              <span className="audio-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>

          <div className="audio-seek-container">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="audio-seek-bar"
            />
          </div>

          <div className="audio-controls">
            <button
              onClick={toggleMute}
              className="audio-control-btn"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={togglePlay}
              className="audio-control-btn audio-control-btn--play"
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Hero / Header Section */}
      <div className="enquiry-hero section-padding">
        <div className="container">
          <button onClick={() => navigate('/')} className="back-link-btn">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <div className="text-center" style={{ marginTop: '16px' }}>
            <span className="enquiry-badge">
              <Sparkles size={14} /> Product Enquiry &amp; Guidance
            </span>
            <h1 className="enquiry-title">Enquire About Agadi Choorna</h1>
            <p className="enquiry-subtitle">
              Listen to our expert audio overview below, watch our video demonstration, or reach out directly to our Ayurvedic specialists.
            </p>
          </div>

          {autoplayBlocked && (
            <div className="autoplay-notice-banner">
              <p>🔊 Click the Play button in the audio toolbar to start listening to the Agadi Choorna audio guide!</p>
              <button onClick={togglePlay} className="btn btn-primary btn-sm">
                <Play size={14} /> Listen Audio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media & Enquiry Form Grid Section */}
      <div className="container enquiry-container section-padding" style={{ paddingTop: '0' }}>
        <div className="enquiry-grid">
          
          {/* Left Column: Audio & Video Showcase */}
          <div className="enquiry-media-column">
            
            {/* Audio Card */}
            <div className="media-card audio-card">
              <div className="media-card-header">
                <div className="media-card-icon audio-icon-bg">
                  <Volume2 size={24} />
                </div>
                <div>
                  <h3>Audio Explanation</h3>
                  <p>Listen to benefits, usage instructions &amp; ingredients</p>
                </div>
              </div>

              <div className="custom-audio-player">
                <div className="player-main">
                  <button onClick={togglePlay} className="player-play-btn">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
                  </button>
                  <div className="player-progress-area">
                    <div className="player-title">Agadi Choorna Voice Guide</div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="player-slider"
                    />
                    <div className="player-timestamps">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  <button onClick={toggleMute} className="player-mute-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Card */}
            <div className="media-card video-card">
              <div className="media-card-header">
                <div className="media-card-icon video-icon-bg">
                  <Video size={24} />
                </div>
                <div>
                  <h3>Product Video Overview</h3>
                  <p>Watch Agadi Choorna product details and presentation</p>
                </div>
              </div>

              <div className="video-player-wrapper">
                <video
                  ref={videoRef}
                  src={videoSource}
                  controls
                  playsInline
                  preload="metadata"
                  onPlay={() => {
                    setIsVideoPlaying(true);
                    if (audioRef.current && isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    }
                  }}
                  onPause={() => setIsVideoPlaying(false)}
                  className="enquiry-video-element"
                />
              </div>
            </div>

            {/* Direct Contact Cards */}
            <div className="enquiry-quick-contacts">
              <a
                href="https://wa.me/918139800282?text=Hello,%20I%20have%20an%20enquiry%20regarding%20Agadi%20Choorna."
                target="_blank"
                rel="noopener noreferrer"
                className="quick-contact-card whatsapp-card"
              >
                <MessageSquare size={24} />
                <div>
                  <strong>WhatsApp Consultation</strong>
                  <span>Instant reply from healthcare advisor</span>
                </div>
              </a>

              <a href="tel:+919072888825" className="quick-contact-card phone-card">
                <Phone size={24} />
                <div>
                  <strong>Call Helpline (+91 9072888825)</strong>
                  <span>Direct phone support (9 AM - 8 PM)</span>
                </div>
              </a>
            </div>

          </div>

          {/* Right Column: Interactive Enquiry Form */}
          <div className="enquiry-form-column">
            <div className="enquiry-form-card">
              <div className="form-header">
                <h3>Submit an Enquiry</h3>
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

        </div>
      </div>
    </div>
  );
};

export default Enquiry;
