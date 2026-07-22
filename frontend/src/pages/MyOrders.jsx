import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Clock, Package, CheckCircle, RefreshCw, ArrowLeft, AlertCircle, Truck, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/orders/myorders');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyOrders();
  }, [user, navigate]);

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    let bg = '#fef3c7';
    let color = '#92400e';
    let icon = <Clock size={14} />;

    if (s === 'confirmed') {
      bg = '#d1fae5';
      color = '#065f46';
      icon = <CheckCircle size={14} />;
    } else if (s === 'processing' || s === 'contacted' || s === 'checked') {
      bg = '#eff6ff';
      color = '#1d4ed8';
      icon = <Package size={14} />;
    } else if (s === 'shipped') {
      bg = '#f3e8ff';
      color = '#6b21a8';
      icon = <Truck size={14} />;
    } else if (s === 'delivered' || s === 'completed') {
      bg = '#d1fae5';
      color = '#065f46';
      icon = <CheckCircle size={14} />;
    } else if (s === 'cancelled') {
      bg = '#fef2f2';
      color = '#991b1b';
      icon = <XCircle size={14} />;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '100px',
          fontSize: '0.82rem',
          fontWeight: '700',
          background: bg,
          color: color,
          letterSpacing: '0.3px',
          textTransform: 'capitalize'
        }}
      >
        {icon}
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '85vh', padding: '100px 0 60px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary-green)', fontWeight: '600', marginBottom: '8px', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-green)', margin: 0 }}>
              My Orders
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Track all your order history and live status updates.
            </p>
          </div>
          <button
            onClick={fetchMyOrders}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-color)',
              background: '#fff',
              color: 'var(--primary-green)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)'
            }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh Status</span>
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <RefreshCw size={32} style={{ color: 'var(--primary-green)', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Fetching your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-green)', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShoppingBag size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', fontWeight: '700', marginBottom: '8px' }}>No Orders Placed Yet</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
              Looks like you haven't ordered Agadi Choorna yet. Experience natural weight gain today!
            </p>
            <Link to="/" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => (
              <div
                key={order._id}
                style={{
                  background: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  transition: 'var(--transition)'
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: '#fcfdfa',
                    borderBottom: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                      Order ID
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--primary-green)', fontFamily: 'monospace' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                      Order Date
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-color)' }}>
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Details Body */}
                <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  {/* Product Info */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: '1 1 280px' }}>
                    <img
                      src={order.product?.images?.[0] || '/images/product-pouch.webp'}
                      alt={order.product?.name || 'Agadi Choorna'}
                      style={{
                        width: '72px',
                        height: '72px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: '#f9fbf8',
                        padding: '4px',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100/f0f3ee/2f4f1e?text=Agadi';
                      }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary-green)', marginBottom: '4px' }}>
                        {order.product?.name || 'Agadi Choorna Formulation'}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        Quantity: <strong>{order.quantity}</strong>
                      </p>
                      <div style={{ fontSize: '0.82rem', color: 'var(--secondary-green)', fontWeight: '600', marginTop: '2px' }}>
                        Payment Method: COD / WhatsApp Express
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Snapshot */}
                  <div style={{ flex: '1 1 240px', fontSize: '0.82rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-green)', paddingLeft: '14px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary-green)', marginBottom: '2px', fontSize: '0.85rem' }}>
                      Delivery Address:
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-color)' }}>{order.name} ({order.phone})</div>
                    <div>{order.address}</div>
                    {order.landmark && <div>Landmark: {order.landmark}</div>}
                    <div>{order.district}, {order.state} – {order.pinCode}</div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary-green)', marginTop: '2px' }}>
                      ₹{order.totalPrice || 0}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MyOrders;
