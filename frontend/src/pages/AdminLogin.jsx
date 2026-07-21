import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminLogin = () => {
  const { admin, loginAdmin } = useContext(AdminAuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already logged in as admin → go straight to dashboard
  useEffect(() => {
    if (admin && admin.isAdmin) {
      navigate('/admin');
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const result = await loginAdmin(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
    // On success the useEffect above will redirect to /admin
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img
            src="/images/logo.webp"
            alt="Agadi Choorna Logo"
            style={{ maxHeight: '120px', maxWidth: '100%', display: 'block', margin: '0 auto 20px', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-green)', fontWeight: '700', marginBottom: '8px' }}>Admin Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter administrator credentials to proceed</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="admin-email">Admin Email</label>
            <input
              type="email"
              id="admin-email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@agadi.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span>Authorizing...</span> : <><LogIn size={18} /><span>Secure Log In</span></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
