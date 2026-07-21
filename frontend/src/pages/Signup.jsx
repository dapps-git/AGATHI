import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const { user, register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
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

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'name') {
      if (!value.trim()) {
        errorMsg = 'Name is required.';
      } else if (value.trim().length < 2) {
        errorMsg = 'Name must be at least 2 characters.';
      }
    } else if (name === 'email') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!value) {
        errorMsg = 'Email is required.';
      } else if (!emailRegex.test(value)) {
        errorMsg = 'Please enter a valid email address.';
      }
    } else if (name === 'phone') {
      if (!value) {
        errorMsg = 'Mobile number is required.';
      } else if (!/^\d{10}$/.test(value)) {
        errorMsg = 'Mobile number must contain exactly 10 digits.';
      }
    } else if (name === 'password') {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (!passwordRegex.test(value)) {
        errorMsg = 'Password must be at least 6 characters and contain both letters and numbers.';
      }
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setGeneralError('');

    // Clear or set field-specific validation errors dynamically
    const err = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: err,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      password: validateField('password', formData.password),
      confirmPassword: '',
    };

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      return;
    }

    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.phone,
      formData.password,
      formData.confirmPassword
    );
    setLoading(false);

    if (!result.success) {
      setGeneralError(result.message);
    }
  };

  const showConfirmFeedback = formData.confirmPassword.length > 0;
  const isPasswordMatch = formData.password === formData.confirmPassword;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
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
            <label htmlFor="reg-name">Full Name *</label>
            <input
              type="text"
              id="reg-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone">Mobile Number (10 digits) *</label>
              <input
                type="tel"
                id="reg-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                maxLength={10}
                required
              />
              {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars"
                required
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="reg-confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
              />
              {showConfirmFeedback && (
                isPasswordMatch ? (
                  <span className="field-success">Passwords match.</span>
                ) : (
                  <span className="field-error">Passwords do not match.</span>
                )
              )}
              {fieldErrors.confirmPassword && !showConfirmFeedback && (
                <span className="field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? (
              <span>Registering account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
