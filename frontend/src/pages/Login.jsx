import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { user, login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const validateEmail = (value) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!value) {
      return 'Email is required.';
    } else if (!emailRegex.test(value)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required.';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setGeneralError('');
    setFieldErrors(prev => ({
      ...prev,
      email: validateEmail(val)
    }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setGeneralError('');
    setFieldErrors(prev => ({
      ...prev,
      password: validatePassword(val)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setGeneralError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <img 
            src="/images/logo.webp" 
            alt="Agadi Logo" 
            style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
          />
        </div>

        {generalError && <div className="alert alert-danger">{generalError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={handleEmailChange}
              placeholder="name@example.com"
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: '8px' }}>
              <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: '600' }}
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account? <Link to="/signup">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
