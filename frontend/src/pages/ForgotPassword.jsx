import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

const ForgotPassword = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { email, phone, password, confirmPassword } = formData;

    if (!email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Mobile number must contain exactly 10 digits.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password', {
        email,
        phone,
        password,
        confirmPassword,
      });
      setSuccess(data.message || 'Password reset successfully!');
      setFormData({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header" style={{ marginBottom: '28px', textAlign: 'center' }}>
          <img 
            src="/images/logo.png" 
            alt="Agadhi Logo" 
            style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} 
          />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-green)', fontWeight: '700', marginBottom: '4px' }}>Reset Password</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter your registered details to set a new password</p>
        </div>

        {error && <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} /><span>{error}</span></div>}
        {success && (
          <div className="alert alert-success" style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '600', marginBottom: '8px' }}>{success}</p>
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', marginTop: '4px' }}>Go to Login</Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="reset-email">Registered Email Address *</label>
              <input
                type="email"
                id="reset-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="reset-phone">Registered Mobile Number *</label>
              <input
                type="tel"
                id="reset-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                maxLength="10"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="reset-password">New Password *</label>
              <input
                type="password"
                id="reset-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="reset-confirm">Confirm New Password *</label>
              <input
                type="password"
                id="reset-confirm"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (
                <span>Resetting...</span>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer-text" style={{ marginTop: '20px' }}>
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
