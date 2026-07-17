import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, ShoppingCart,
  Plus, Edit2, Trash2, Search, X, LogOut, RefreshCw,
  TrendingUp, Package, UserCheck
} from 'lucide-react';
import adminAPI from '../utils/adminApi';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminDashboard = () => {
  const { admin, logoutAdmin } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    images: '/images/product-500g.png',
    benefits: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminAPI.get('/stats');
      setStats(statsRes.data);
      const ordersRes = await adminAPI.get('/orders');
      setOrders(ordersRes.data);
      const productsRes = await adminAPI.get('/products');
      setProducts(productsRes.data);
      const usersRes = await adminAPI.get('/stats/users');
      setUsers(usersRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin-login');
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await adminAPI.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? data : o));
      setSuccess('Order status updated!');
      setTimeout(() => setSuccess(''), 3000);
      const statsRes = await adminAPI.get('/stats');
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to update status.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleProductDelete = async (productId) => {
    if (window.confirm('Delete this product?')) {
      try {
        await adminAPI.delete(`/products/${productId}`);
        setProducts(products.filter(p => p._id !== productId));
        setSuccess('Product deleted.');
        setTimeout(() => setSuccess(''), 3000);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Delete this user?')) {
      try {
        await adminAPI.delete(`/stats/users/${userId}`);
        setUsers(users.filter(u => u._id !== userId));
        setSuccess('User deleted.');
        setTimeout(() => setSuccess(''), 3000);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', description: '', images: '/images/product-500g.png', benefits: '' });
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      description: prod.description,
      images: prod.images.join(', '),
      benefits: prod.benefits.join(', '),
    });
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      description: productForm.description,
      images: productForm.images.split(',').map(img => img.trim()),
      benefits: productForm.benefits.split(',').map(b => b.trim()).filter(b => b !== ''),
    };
    try {
      if (editingProduct) {
        const { data } = await adminAPI.put(`/products/${editingProduct._id}`, payload);
        setProducts(products.map(p => p._id === editingProduct._id ? data : p));
        setSuccess('Product updated!');
      } else {
        const { data } = await adminAPI.post('/products', payload);
        setProducts([data, ...products]);
        setSuccess('Product created!');
      }
      setProductModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Product action failed.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  );

  const tabLabels = {
    dashboard: 'Dashboard Overview',
    orders: 'Manage Orders',
    products: 'Product Inventory',
    users: 'User Accounts',
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px', background: '#fafbfa' }}>
        <RefreshCw size={36} style={{ color: '#2F4F1E', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#2F4F1E', fontWeight: '600', fontSize: '1rem' }}>Loading Admin Panel...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* ── Topbar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/images/logo.png" alt="Agadhi Logo" style={{ maxHeight: '46px', objectFit: 'contain' }} />
        </div>
        <div className="admin-topbar-actions">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-green)' }}>
              {admin?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>Admin Portal</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }} />
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              fontSize: '0.82rem', fontWeight: '600',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              background: 'var(--card-bg)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--card-bg)'; }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar">
          {/* sidebar section label */}
          <div style={{ padding: '0 18px 16px', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Main Menu
          </div>

          {[
            { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { id: 'orders',    icon: <ShoppingCart size={18} />,    label: 'Orders' },
            { id: 'products',  icon: <ShoppingBag size={18} />,     label: 'Products' },
            { id: 'users',     icon: <Users size={18} />,           label: 'Users' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ padding: '16px 18px 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--primary-green)' }}>Agadhi Admin</strong><br />
              v1.0 — MVP Panel
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="admin-content">
          {/* Page header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 className="admin-content-title" style={{ margin: 0 }}>{tabLabels[activeTab]}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                {activeTab === 'dashboard' && 'A real-time snapshot of your business metrics.'}
                {activeTab === 'orders' && 'Track and manage all WhatsApp orders placed by customers.'}
                {activeTab === 'products' && 'Add, edit, or remove products from your catalog.'}
                {activeTab === 'users' && 'View and manage registered customer accounts.'}
              </p>
            </div>
            {activeTab === 'products' && (
              <button onClick={openAddProductModal} className="btn btn-primary" style={{ gap: '8px', borderRadius: '10px', padding: '11px 22px' }}>
                <Plus size={17} />
                <span>Add Product</span>
              </button>
            )}
            {activeTab !== 'products' && (
              <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--card-bg)', cursor: 'pointer' }}>
                <RefreshCw size={15} />
                Refresh
              </button>
            )}
          </div>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{stats.totalOrders}</h3>
                    <p>Total Orders</p>
                  </div>
                  <div className="stat-icon"><ShoppingCart size={24} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{stats.totalProducts}</h3>
                    <p>Products</p>
                  </div>
                  <div className="stat-icon"><Package size={24} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Registered Users</p>
                  </div>
                  <div className="stat-icon"><UserCheck size={24} /></div>
                </div>
              </div>

              {/* Recent Orders */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontWeight: '700', color: 'var(--primary-green)', fontSize: '1.1rem' }}>Recent Orders</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest 5 WhatsApp orders received</p>
                </div>
                <button onClick={() => setActiveTab('orders')} style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  View All <TrendingUp size={14} />
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order._id}>
                        <td style={{ fontWeight: '600' }}>{order.name}</td>
                        <td>{order.phone}</td>
                        <td>{order.product?.name || 'Deleted Product'}</td>
                        <td>{order.quantity}</td>
                        <td style={{ fontWeight: '700', color: 'var(--primary-green)' }}>₹{order.totalPrice}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No orders placed yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === 'orders' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Address</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: '600' }}>{order.name}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{order.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.phone}</div>
                        {order.alternatePhone && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Alt: {order.alternatePhone}</div>}
                      </td>
                      <td>{order.product?.name || 'Deleted Product'}</td>
                      <td>{order.quantity}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary-green)' }}>₹{order.totalPrice}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '200px' }}>
                        <div>{order.address}</div>
                        {order.landmark && <div style={{ color: '#aaa' }}>{order.landmark}</div>}
                        <div style={{ color: 'var(--secondary-green)', fontWeight: '600' }}>{order.district}, {order.state} – {order.pinCode}</div>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select value={order.status} onChange={e => handleStatusChange(order._id, e.target.value)} className="status-select">
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Products Tab ── */}
          {activeTab === 'products' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Benefits</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod._id}>
                      <td>
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)', padding: '4px' }}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Agadhi'; }}
                        />
                      </td>
                      <td style={{ fontWeight: '600', maxWidth: '180px' }}>{prod.name}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '240px', color: 'var(--text-muted)' }}>{prod.description}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>₹{prod.price}</td>
                      <td>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {prod.benefits.slice(0, 3).map((b, i) => (
                            <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>• {b}</li>
                          ))}
                          {prod.benefits.length > 3 && <li style={{ fontSize: '0.75rem', color: 'var(--secondary-green)' }}>+{prod.benefits.length - 3} more</li>}
                        </ul>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button onClick={() => openEditProductModal(prod)} className="action-btn" aria-label="Edit">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleProductDelete(prod._id)} className="action-btn action-btn-danger" aria-label="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products in catalog.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px', marginBottom: '22px' }}>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or mobile..."
                  style={{ paddingLeft: '42px' }}
                />
                <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Shipping Address</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: '600' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td style={{ maxWidth: '220px', whiteSpace: 'normal', lineHeight: '1.4', fontSize: '0.82rem', color: u.address ? 'var(--text-color)' : 'var(--text-muted)' }}>
                          {u.address || <span style={{ fontStyle: 'italic' }}>No order yet</span>}
                        </td>
                        <td>
                          <span className={`badge ${u.isAdmin ? 'badge-completed' : 'badge-pending'}`}>
                            {u.isAdmin ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          {!u.isAdmin ? (
                            <button onClick={() => handleUserDelete(u._id)} className="action-btn action-btn-danger" aria-label="Delete user">
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--card-bg)', padding: '4px 10px', borderRadius: '100px', border: '1px solid var(--border-color)' }}>Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Product Editor Modal ── */}
      {productModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <button onClick={() => setProductModalOpen(false)} className="modal-close" aria-label="Close modal">
              <X size={22} />
            </button>
            <div className="modal-body">
              <div className="modal-header">
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <p>{editingProduct ? 'Update the product details below.' : 'Fill in the details to add a new product to your catalog.'}</p>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleProductSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="prod-name">Product Name *</label>
                  <input type="text" id="prod-name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Agadhi Choorna 500g" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="prod-price">Price (₹) *</label>
                    <input type="number" id="prod-price" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="1250" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-images">Image Paths *</label>
                    <input type="text" id="prod-images" value={productForm.images} onChange={e => setProductForm({ ...productForm, images: e.target.value })} placeholder="Comma-separated paths" required />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="prod-description">Description *</label>
                  <textarea id="prod-description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Short marketing description" rows={3} style={{ resize: 'none' }} required />
                </div>
                <div className="form-group" style={{ marginBottom: '28px' }}>
                  <label htmlFor="prod-benefits">Key Benefits (Comma separated)</label>
                  <textarea id="prod-benefits" value={productForm.benefits} onChange={e => setProductForm({ ...productForm, benefits: e.target.value })} placeholder="100% Ayurvedic, Boosts Appetite, Builds Muscle" rows={2} style={{ resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <button type="button" onClick={() => setProductModalOpen(false)} className="btn btn-outline" style={{ flexGrow: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 2 }}>
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
