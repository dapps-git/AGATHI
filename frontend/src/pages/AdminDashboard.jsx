import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, ShoppingCart,
  Plus, Edit2, Trash2, Search, X, LogOut, RefreshCw,
  TrendingUp, Package, UserCheck, Menu, Download,
  MessageSquare, Send, MessageCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import adminAPI from '../utils/adminApi';
import { AdminAuthContext } from '../context/AdminAuthContext';

const compressImageToWebP = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const AdminDashboard = () => {
  const { admin, logoutAdmin } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [pdfFilterType, setPdfFilterType] = useState('all');
  const [pdfFromDate, setPdfFromDate] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    benefits: '',
  });
  const [imagePreview, setImagePreview] = useState(null);  // base64 or existing URL
  const [imageBase64, setImageBase64] = useState('');      // base64 to submit

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

  const downloadFilteredPDF = () => {
    let filteredOrders = [...orders];
    const now = new Date();
    let rangeLabel = 'All Time';

    if (pdfFilterType === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= todayStart);
      rangeLabel = 'Today';
    } else if (pdfFilterType === 'weekly') {
      const weeklyStart = new Date();
      weeklyStart.setDate(now.getDate() - 7);
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= weeklyStart);
      rangeLabel = 'Last 7 Days';
    } else if (pdfFilterType === 'monthly') {
      const monthlyStart = new Date();
      monthlyStart.setDate(now.getDate() - 30);
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= monthlyStart);
      rangeLabel = 'Last 30 Days';
    } else if (pdfFilterType === 'custom' && pdfFromDate) {
      const start = new Date(pdfFromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      filteredOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      });
      rangeLabel = `From ${new Date(pdfFromDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} to Today`;
    }

    if (filteredOrders.length === 0) {
      alert('No orders found in the selected date range!');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    // Header block
    doc.setFillColor(47, 79, 30);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Agadi Choorna — Orders Report (${rangeLabel})`, 14, 14);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 215, 14);

    // Table
    autoTable(doc, {
      startY: 28,
      head: [['#', 'Customer Name', 'Phone', 'Email', 'Product', 'Qty', 'Total (Rs.)', 'Address', 'District / State / PIN', 'Status', 'Order Date']],
      body: filteredOrders.map((order, idx) => [
        idx + 1,
        order.name || '—',
        order.phone || '—',
        order.email || '—',
        order.product?.name || 'Deleted Product',
        order.quantity,
        `Rs. ${order.totalPrice || 0}`,
        [order.address, order.landmark].filter(Boolean).join(', ') || '—',
        `${order.district || ''}, ${order.state || ''} – ${order.pinCode || ''}`,
        order.status || '—',
        order.createdAt
          ? new Date(order.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—',
      ]),
      styles: {
        fontSize: 6.5,
        cellPadding: 3,
        valign: 'middle',
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [47, 79, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.5,
      },
      alternateRowStyles: {
        fillColor: [247, 251, 247],
      },
      columnStyles: {
        0:  { cellWidth: 10 },
        1:  { cellWidth: 26 },
        2:  { cellWidth: 24 },
        3:  { cellWidth: 32 },
        4:  { cellWidth: 24 },
        5:  { cellWidth: 10 },
        6:  { cellWidth: 20 },
        7:  { cellWidth: 42 },
        8:  { cellWidth: 34 },
        9:  { cellWidth: 18 },
        10: { cellWidth: 29 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer page count
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  |  Total Orders: ${filteredOrders.length}`, 14, doc.internal.pageSize.getHeight() - 6);
    }

    const today = new Date().toISOString().split('T')[0];
    doc.save(`agadi-orders-${pdfFilterType}-${today}.pdf`);
    setExportModalOpen(false);
  };

  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [msgOrder, setMsgOrder] = useState(null);
  const [msgText, setMsgText] = useState('');

  const formatPhoneForUrl = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    return cleaned;
  };

  const getTemplateMsg = (order, type) => {
    if (!order) return '';
    const name = order.name || 'Customer';
    const product = order.product?.name || 'Agadi Choorna';
    switch (type) {
      case 'Confirmed':
        return `Dear ${name}, your order for ${product} (₹${order.totalPrice}) has been CONFIRMED! We are preparing your package. Thank you for choosing Agadi Choorna!`;
      case 'Processing':
        return `Dear ${name}, your order for ${product} is currently being PROCESSED and packed. Thank you for your patience!`;
      case 'Shipped':
        return `Dear ${name}, your order for ${product} has been SHIPPED! It is on its way to ${order.district || 'your address'}. Thank you for your trust!`;
      case 'Delivered':
        return `Dear ${name}, your order for ${product} has been DELIVERED successfully! Thank you for trusting Agadi Choorna.`;
      case 'Cancelled':
        return `Dear ${name}, your order for ${product} has been CANCELLED. Please contact support at 9072888825 for details.`;
      case 'Delay':
        return `Dear ${name}, regarding your order for ${product}: there is a slight delay in dispatch due to high demand. We are expediting it and will share tracking updates soon. Thank you for your patience!`;
      default:
        return `Dear ${name}, regarding your order for ${product}: status is updated to ${type}. Thank you for choosing Agadi Choorna!`;
    }
  };

  const openMsgModalForOrder = (order, defaultType = 'Custom') => {
    setMsgOrder(order);
    if (defaultType && defaultType !== 'Custom') {
      setMsgText(getTemplateMsg(order, defaultType));
    } else {
      setMsgText(`Dear ${order.name || 'Customer'}, regarding your order for ${order.product?.name || 'Agadi Choorna'}: `);
    }
    setMsgModalOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await adminAPI.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? data : o));
      setSuccess(`Order status updated to ${newStatus}!`);
      setTimeout(() => setSuccess(''), 3000);
      const statsRes = await adminAPI.get('/stats');
      setStats(statsRes.data);

      // Automatically open notification modal pre-filled with status update message
      const updatedOrder = data || orders.find(o => o._id === orderId);
      if (updatedOrder) {
        setMsgOrder(updatedOrder);
        setMsgText(getTemplateMsg(updatedOrder, newStatus));
        setMsgModalOpen(true);
      }
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

  const handleOrderDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await adminAPI.delete(`/orders/${orderId}`);
        setOrders(orders.filter(o => o._id !== orderId));
        setSuccess('Order deleted.');
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
    setProductForm({ name: '', price: '', description: '', benefits: '' });
    setImagePreview(null);
    setImageBase64('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      description: prod.description,
      benefits: prod.benefits.join(', '),
    });
    // Show existing image as preview (keep it; only replaced if admin picks a new file)
    setImagePreview(prod.images[0] || null);
    setImageBase64('');
    setProductModalOpen(true);
  };

  // Convert selected file → WebP Base64 and compress
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      const webpDataUrl = await compressImageToWebP(file, 1000, 1000, 0.7);
      setImageBase64(webpDataUrl);
      setImagePreview(webpDataUrl);
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Failed to compress and convert image to WebP.');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Determine final images array:
    // - If admin picked a new file → use new Base64
    // - Else if editing → keep existing images
    // - Else (new product, no file) → error
    let finalImages;
    if (imageBase64) {
      finalImages = [imageBase64];
    } else if (editingProduct && imagePreview) {
      finalImages = editingProduct.images;  // unchanged
    } else {
      setError('Please select a product image.');
      return;
    }

    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      description: productForm.description,
      images: finalImages,
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

  const [customerSearch, setCustomerSearch] = useState('');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  );

  // Compute Customers (only users/contacts who placed 1+ orders)
  const customerMap = {};
  orders.forEach(order => {
    const key = order.email || order.phone || order.name;
    if (!key) return;
    if (!customerMap[key]) {
      customerMap[key] = {
        _id: order.user?._id || order.user || key,
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: [order.address, order.landmark, order.district, order.state, order.pinCode].filter(Boolean).join(', '),
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt,
      };
    }
    customerMap[key].orderCount += 1;
    customerMap[key].totalSpent += (order.totalPrice || 0);
    if (new Date(order.createdAt) > new Date(customerMap[key].lastOrderDate)) {
      customerMap[key].lastOrderDate = order.createdAt;
    }
  });
  const customersList = Object.values(customerMap).filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const tabLabels = {
    dashboard: 'Dashboard Overview',
    orders: 'Manage Orders',
    products: 'Product Inventory',
    customers: 'Customer Accounts (1+ Orders)',
    users: 'Registered Users',
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
      <header className="admin-topbar" style={{ position: 'fixed' }}>
        {/* Left: Logo + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '250px', flexShrink: 0 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="admin-hamburger"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--primary-green)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <Menu size={24} />
          </button>
          <img src="/images/logo.webp" alt="Agadi Logo" style={{ maxHeight: '64px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Center: Page title absolutely centered */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-green)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {tabLabels[activeTab]}
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px', whiteSpace: 'nowrap' }}>
            {activeTab === 'dashboard' && 'A real-time snapshot of your business metrics.'}
            {activeTab === 'orders' && 'Track and manage all orders placed by customers.'}
            {activeTab === 'products' && 'Add, edit, or remove products from your catalog.'}
            {activeTab === 'customers' && 'Users who have successfully placed at least one order.'}
            {activeTab === 'users' && 'View all registered user accounts.'}
          </p>
        </div>

        {/* Right: Action buttons only */}
        <div className="admin-topbar-actions" style={{ marginLeft: 'auto' }}>
          {activeTab === 'products' && (
            <button onClick={openAddProductModal} className="btn btn-primary" style={{ gap: '6px', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}>
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}

          {(activeTab === 'dashboard' || activeTab === 'orders') && orders.length > 0 && (
            <button
              onClick={() => {
                setPdfFilterType('all');
                setPdfFromDate('');
                setExportModalOpen(true);
              }}
              title="Download orders report as PDF"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem', fontWeight: '700',
                color: '#fff',
                background: 'var(--primary-green)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(47,79,30,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a3d0f'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-green)'; }}
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
          )}

          <button
            onClick={() => { fetchData(); }}
            title="Refresh data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', background: '#fff', cursor: 'pointer' }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* ── Sidebar ── */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>

          {/* Close button inside sidebar on mobile */}
          <div style={{ display: 'none', justifyContent: 'flex-end', padding: '0 16px 16px' }} className="admin-sidebar-close">
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
          {/* sidebar section label */}
          <div style={{ padding: '0 18px 12px', fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Main Menu
          </div>

          {[
            { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { id: 'orders',    icon: <ShoppingCart size={18} />,    label: 'Orders' },
            { id: 'products',  icon: <ShoppingBag size={18} />,     label: 'Products' },
            { id: 'customers', icon: <UserCheck size={18} />,       label: 'Customers' },
            { id: 'users',     icon: <Users size={18} />,           label: 'Users' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%',
                padding: '11px 16px',
                border: '1.5px solid #fca5a5',
                borderRadius: '10px',
                fontSize: '0.875rem', fontWeight: '600',
                color: '#b91c1c',
                cursor: 'pointer',
                background: '#fef2f2',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Sidebar backdrop overlay on mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 998,
            }}
          />
        )}

        {/* ── Main Content ── */}
        <main className="admin-content">


          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : 0}</h3>
                    <p>Total Revenue</p>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#16a34a' }}><TrendingUp size={24} /></div>
                </div>
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

              {/* Status Breakdown Section */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--primary-green)', fontSize: '1.1rem', marginBottom: '16px' }}>Order Status Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Pending', count: stats.statusBreakdown?.pending || 0, color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
                    { label: 'Confirmed', count: stats.statusBreakdown?.confirmed || 0, color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
                    { label: 'Contacted', count: stats.statusBreakdown?.contacted || 0, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: 'Checked', count: stats.statusBreakdown?.checked || 0, color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
                    { label: 'Shipped', count: stats.statusBreakdown?.shipped || 0, color: '#6b21a8', bg: '#f3e8ff', border: '#e9d5ff' },
                    { label: 'Completed', count: stats.statusBreakdown?.completed || 0, color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' },
                    { label: 'Cancelled', count: stats.statusBreakdown?.cancelled || 0, color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: '#fff',
                      border: `1.5px solid ${item.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: item.color }}>{item.count}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                    </div>
                  ))}
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
                      <th>Order Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order._id}>
                        <td data-label="Customer" style={{ fontWeight: '600' }}>{order.name}</td>
                        <td data-label="Phone">{order.phone}</td>
                        <td data-label="Product">{order.product?.name || 'Deleted Product'}</td>
                        <td data-label="Qty">{order.quantity}</td>
                        <td data-label="Total" style={{ fontWeight: '700', color: 'var(--primary-green)' }}>₹{order.totalPrice}</td>
                        <td data-label="Order Time">
                          <div style={{ fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td data-label="Status">
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
            <div>
              {/* Search Bar for Orders */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search orders by customer, phone, status, product, PIN..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 42px',
                      fontSize: '0.875rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      background: '#fff',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Showing {orders.filter((o) => {
                    if (!orderSearch.trim()) return true;
                    const q = orderSearch.toLowerCase().trim();
                    return (
                      (o.name && o.name.toLowerCase().includes(q)) ||
                      (o.phone && o.phone.toLowerCase().includes(q)) ||
                      (o.email && o.email.toLowerCase().includes(q)) ||
                      (o.address && o.address.toLowerCase().includes(q)) ||
                      (o.district && o.district.toLowerCase().includes(q)) ||
                      (o.state && o.state.toLowerCase().includes(q)) ||
                      (o.pinCode && o.pinCode.toLowerCase().includes(q)) ||
                      (o.status && o.status.toLowerCase().includes(q)) ||
                      (o.product?.name && o.product.name.toLowerCase().includes(q))
                    );
                  }).length} of {orders.length} orders
                </div>
              </div>

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
                      <th>Order Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => {
                        if (!orderSearch.trim()) return true;
                        const q = orderSearch.toLowerCase().trim();
                        return (
                          (o.name && o.name.toLowerCase().includes(q)) ||
                          (o.phone && o.phone.toLowerCase().includes(q)) ||
                          (o.email && o.email.toLowerCase().includes(q)) ||
                          (o.address && o.address.toLowerCase().includes(q)) ||
                          (o.district && o.district.toLowerCase().includes(q)) ||
                          (o.state && o.state.toLowerCase().includes(q)) ||
                          (o.pinCode && o.pinCode.toLowerCase().includes(q)) ||
                          (o.status && o.status.toLowerCase().includes(q)) ||
                          (o.product?.name && o.product.name.toLowerCase().includes(q))
                        );
                      })
                      .map((order) => (
                        <tr key={order._id}>
                          <td data-label="Customer" style={{ fontWeight: '600' }}>{order.name}</td>
                          <td data-label="Contact">
                            <div style={{ fontSize: '0.875rem' }}>{order.email}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.phone}</div>
                            {order.alternatePhone && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Alt: {order.alternatePhone}</div>}
                          </td>
                          <td data-label="Product">{order.product?.name || 'Deleted Product'}</td>
                          <td data-label="Qty">{order.quantity}</td>
                          <td data-label="Total" style={{ fontWeight: '700', color: 'var(--primary-green)' }}>₹{order.totalPrice}</td>
                          <td data-label="Address" style={{ fontSize: '0.82rem', maxWidth: '200px' }}>
                            <div>{order.address}</div>
                            {order.landmark && <div style={{ color: '#aaa' }}>{order.landmark}</div>}
                            <div style={{ color: 'var(--secondary-green)', fontWeight: '600' }}>{order.district}, {order.state} – {order.pinCode}</div>
                          </td>
                          <td data-label="Order Time">
                            <div style={{ fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td data-label="Status">
                            <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} className="status-select">
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              {['Contacted', 'Checked', 'Completed'].includes(order.status) && (
                                <option value={order.status}>{order.status}</option>
                              )}
                            </select>
                          </td>
                          <td data-label="Actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openMsgModalForOrder(order, 'Custom')}
                              className="action-btn"
                              style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
                              title="Send WhatsApp / SMS message to customer"
                            >
                              <MessageSquare size={15} />
                            </button>
                            <button onClick={() => handleOrderDelete(order._id)} className="action-btn action-btn-danger" aria-label="Delete order" title="Delete order">
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {orders.filter((o) => {
                      if (!orderSearch.trim()) return true;
                      const q = orderSearch.toLowerCase().trim();
                      return (
                        (o.name && o.name.toLowerCase().includes(q)) ||
                        (o.phone && o.phone.toLowerCase().includes(q)) ||
                        (o.email && o.email.toLowerCase().includes(q)) ||
                        (o.address && o.address.toLowerCase().includes(q)) ||
                        (o.district && o.district.toLowerCase().includes(q)) ||
                        (o.state && o.state.toLowerCase().includes(q)) ||
                        (o.pinCode && o.pinCode.toLowerCase().includes(q)) ||
                        (o.status && o.status.toLowerCase().includes(q)) ||
                        (o.product?.name && o.product.name.toLowerCase().includes(q))
                      );
                    }).length === 0 && (
                      <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No matching orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                      <td data-label="Image">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)', padding: '4px' }}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Agadi'; }}
                        />
                      </td>
                      <td data-label="Name" style={{ fontWeight: '600', maxWidth: '180px' }}>{prod.name}</td>
                      <td data-label="Description" style={{ fontSize: '0.82rem', maxWidth: '240px', color: 'var(--text-muted)' }}>{prod.description}</td>
                      <td data-label="Price" style={{ fontWeight: '700', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>₹{prod.price}</td>
                      <td data-label="Benefits">
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {prod.benefits.slice(0, 3).map((b, i) => (
                            <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>• {b}</li>
                          ))}
                          {prod.benefits.length > 3 && <li style={{ fontSize: '0.75rem', color: 'var(--secondary-green)' }}>+{prod.benefits.length - 3} more</li>}
                        </ul>
                      </td>
                      <td data-label="Actions">
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

          {/* ── Customers Tab ── */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px', marginBottom: '22px' }}>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email, or phone..."
                  style={{ paddingLeft: '42px' }}
                />
                <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Shipping Address</th>
                      <th>Orders Placed</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map(c => (
                      <tr key={c._id || c.email || c.phone}>
                        <td data-label="Customer Name" style={{ fontWeight: '700', color: 'var(--primary-green)' }}>{c.name}</td>
                        <td data-label="Email">{c.email}</td>
                        <td data-label="Phone">{c.phone}</td>
                        <td data-label="Shipping Address" style={{ maxWidth: '240px', whiteSpace: 'normal', lineHeight: '1.4', fontSize: '0.82rem' }}>
                          {c.address || '—'}
                        </td>
                        <td data-label="Orders Placed" style={{ textAlign: 'center', fontWeight: '700' }}>
                          <span className="badge badge-processing" style={{ padding: '4px 10px' }}>
                            {c.orderCount} {c.orderCount === 1 ? 'Order' : 'Orders'}
                          </span>
                        </td>
                        <td data-label="Total Spent" style={{ fontWeight: '800', color: 'var(--primary-green)' }}>
                          ₹{c.totalSpent.toLocaleString('en-IN')}
                        </td>
                        <td data-label="Last Order">
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {customersList.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No customers with orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                        <td data-label="Name" style={{ fontWeight: '600' }}>{u.name}</td>
                        <td data-label="Email">{u.email}</td>
                        <td data-label="Phone">{u.phone}</td>
                        <td data-label="Shipping Address" style={{ maxWidth: '220px', whiteSpace: 'normal', lineHeight: '1.4', fontSize: '0.82rem', color: u.address ? 'var(--text-color)' : 'var(--text-muted)' }}>
                          {u.address || <span style={{ fontStyle: 'italic' }}>No order yet</span>}
                        </td>
                        <td data-label="Role">
                          <span className={`badge ${u.isAdmin ? 'badge-completed' : 'badge-pending'}`}>
                            {u.isAdmin ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                        <td data-label="Joined">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td data-label="Actions">
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
                    <label htmlFor="prod-image-upload">Product Image *</label>
                    <label
                      htmlFor="prod-image-upload"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', padding: '8px 12px', border: '1.5px dashed var(--border-color)',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem',
                        color: 'var(--primary-green)', fontWeight: '600',
                        background: 'var(--card-bg)', transition: 'var(--transition)',
                        minHeight: '42px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-green)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      📁 {imagePreview ? 'Change Image' : 'Choose Image'}
                    </label>
                    <input
                      type="file"
                      id="prod-image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    {imagePreview && (
                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', padding: '4px' }}
                        />
                        {imageBase64 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--secondary-green)', marginTop: '4px' }}>✓ New image ready</div>
                        )}
                      </div>
                    )}
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

      {/* ── PDF Export Modal ── */}
      {exportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '440px' }}>
            <button onClick={() => setExportModalOpen(false)} className="modal-close" aria-label="Close modal">
              <X size={22} />
            </button>
            <div className="modal-body" style={{ padding: '28px' }}>
              <div className="modal-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', fontWeight: '700' }}>Export Orders Report</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Generate a landscape PDF report with custom date filters.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="pdf-filter-select" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-color)' }}>Date Range *</label>
                  <select
                    id="pdf-filter-select"
                    value={pdfFilterType}
                    onChange={e => setPdfFilterType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem', background: '#fff' }}
                  >
                    <option value="all">All Orders (No Filter)</option>
                    <option value="today">Today's Orders (Daily)</option>
                    <option value="weekly">Last 7 Days (Weekly)</option>
                    <option value="monthly">Last 30 Days (Monthly)</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {pdfFilterType === 'custom' && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease' }}>
                    <label htmlFor="pdf-from-date" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-color)' }}>From Date (Start Date) *</label>
                    <input
                      type="date"
                      id="pdf-from-date"
                      value={pdfFromDate}
                      onChange={e => setPdfFromDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>The report will include orders from this date up to today.</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setExportModalOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                  <button
                    type="button"
                    onClick={downloadFilteredPDF}
                    className="btn btn-primary"
                    disabled={pdfFilterType === 'custom' && !pdfFromDate}
                    style={{ flex: 2, padding: '10px', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Download size={16} />
                    Generate PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
      {/* ── Customer Notification Modal (WhatsApp / SMS) ── */}
      {msgModalOpen && msgOrder && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <button onClick={() => setMsgModalOpen(false)} className="modal-close" aria-label="Close modal">
              <X size={22} />
            </button>
            <div className="modal-body" style={{ padding: '28px' }}>
              <div className="modal-header" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} /> Notify Customer
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Send order status update or custom message to <strong>{msgOrder.name}</strong> ({msgOrder.phone}).
                </p>
              </div>

              {/* Quick Template Buttons */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Quick Message Templates:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: 'Confirmed', type: 'Confirmed', bg: '#d1fae5', color: '#065f46' },
                    { label: 'Shipped', type: 'Shipped', bg: '#f3e8ff', color: '#6b21a8' },
                    { label: 'Delivered', type: 'Delivered', bg: '#dcfce7', color: '#15803d' },
                    { label: 'Delay Notice', type: 'Delay', bg: '#fef3c7', color: '#92400e' },
                  ].map(t => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setMsgText(getTemplateMsg(msgOrder, t.type))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: 'none',
                        background: t.bg,
                        color: t.color,
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Message Text Area */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '6px', display: 'block' }}>
                  Message Text (Customizable):
                </label>
                <textarea
                  rows={4}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Type your message here..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              {msgOrder.alternatePhone && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', background: '#f8faf8', padding: '8px 12px', borderRadius: '6px' }}>
                  Primary Phone: <strong>{msgOrder.phone}</strong> | Alt: <strong>{msgOrder.alternatePhone}</strong>
                </div>
              )}

              {/* Send Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={`https://wa.me/${formatPhoneForUrl(msgOrder.phone)}?text=${encodeURIComponent(msgText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    padding: '11px',
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justify.content: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={18} />
                  Send via WhatsApp
                </a>

                <a
                  href={`sms:+${formatPhoneForUrl(msgOrder.phone)}?body=${encodeURIComponent(msgText)}`}
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    padding: '11px',
                    background: '#4f46e5',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <Send size={16} />
                  Send Normal SMS
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
