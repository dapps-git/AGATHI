import React from 'react';
import { Leaf, Phone, Mail, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Brand Column */}
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <img src="/images/logo.png" alt="Agadi Choorna Logo" className="footer-logo" />
          </div>
          <p className="footer-brand-desc">
            Premium Ayurvedic weight gain powder formulated using natural adaptogenic herbs.
            Boost your appetite, digest better, and gain lean muscle mass safely.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">Quick Links</h4>
          <ul className="footer-links">
            <li><button onClick={() => handleNavClick('hero')} className="footer-link">Home</button></li>
            <li><button onClick={() => handleNavClick('about')} className="footer-link">About Us</button></li>
            <li><button onClick={() => handleNavClick('benefits')} className="footer-link">Health Benefits</button></li>
            <li><button onClick={() => handleNavClick('products')} className="footer-link">Our Products</button></li>
            <li><button onClick={() => handleNavClick('contact')} className="footer-link">Contact Us</button></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contact Info</h4>
          <ul className="footer-contact-list">
            <li>
              <MapPin size={16} className="footer-contact-icon" />
              <span>Agadi Choornam, Palakkad, Kerala, India</span>
            </li>
            <li>
              <Phone size={16} className="footer-contact-icon" />
              <a
                href="tel:+919072888821"
              >
                +91 9072888821
              </a>
            </li>
            <li>
              <Mail size={16} className="footer-contact-icon" />
              <a href="mailto:agadichoornam@gmail.com">agadichoornam@gmail.com</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Agadi Choorna. All Rights Reserved.</p>
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://wa.me/919072888821" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
