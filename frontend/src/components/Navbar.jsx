import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, LogOut, User as UserIcon, ShoppingBag, HelpCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setIsOpen(false);
    if (sectionId === 'results') {
      navigate('/results');
      return;
    }
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 68; // height of fixed navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const isTransparent = location.pathname === '/' && !isScrolled;

  return (
    <nav className={`navbar ${isTransparent ? 'navbar--transparent' : 'navbar--solid'}`}>
      <div className="container nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="logo-link">
          <img
            src="/images/logo.webp"
            alt="Agadi Choorna Logo"
            className="logo-img"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          />
          <a
            href="https://wa.me/918139800282?text=Hello,%20I'd%20like%20to%20get%20expert%20guidance%20on%20Agadi%20Choornam."
            target="_blank"
            rel="noopener noreferrer"
            className="support-badge"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', cursor: 'pointer' }}
            title="Chat on WhatsApp"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.676.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.175.2-.301.301-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.927-2.233-.244-.588-.492-.508-.676-.517l-.577-.01c-.2 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.077 2.909 1.227 3.109.151.2 2.12 3.238 5.137 4.542.718.311 1.278.497 1.715.636.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.125-.275-.2-.576-.351m-5.467 7.424h-.008a9.88 9.88 0 0 1-5.033-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885m8.413-18.297A11.815 11.815 0 0 0 12.005 0C5.495 0 .16 5.335.157 11.847c0 2.08.542 4.11 1.571 5.903L0 24l6.417-1.684a11.8 11.8 0 0 0 5.584 1.411h.005c6.514 0 11.847-5.336 11.85-11.849 0-3.167-1.233-6.146-3.477-8.39" />
            </svg>
            <span>24/7 Support</span>
          </a>
        </div>

        <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
          <li>
            <button onClick={() => handleNavClick('hero')} className="nav-link">
              Home
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick('about')} className="nav-link">
              About
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick('benefits')} className="nav-link">
              Benefits
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick('products')} className="nav-link">
              Products
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick('results')} className="nav-link">
              Results
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/enquiry');
              }}
              className="nav-link nav-link--enquiry"
            >
              Enquiry
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick('contact')} className="nav-link">
              Contact
            </button>
          </li>

          {user && !user.isAdmin ? (
            <>
              <li>
                <Link
                  to="/my-orders"
                  onClick={() => setIsOpen(false)}
                  className="nav-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                >
                  <ShoppingBag size={16} />
                  <span>My Orders</span>
                </Link>
              </li>
              <li className="user-nav-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                <UserIcon size={16} className="user-icon" />
                <span>{user.name.split(' ')[0]}</span>
              </li>
              <li>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                    navigate('/');
                  }}
                  className="btn btn-outline nav-btn-logout"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" onClick={() => setIsOpen(false)} className="nav-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="btn btn-primary nav-btn-register" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

        <button
          className={`hamburger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          style={{ position: 'relative', zIndex: 999 }}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
