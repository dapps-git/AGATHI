import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, LogOut, User as UserIcon, ShoppingBag } from 'lucide-react';
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
        <div onClick={handleLogoClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} className="logo-link">
          <img src="/images/logo.webp" alt="Agadi Choorna Logo" className="logo-img" />
          <span className="support-badge">24/7 Support</span>
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

        <button className="hamburger" onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative', zIndex: 999 }}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
