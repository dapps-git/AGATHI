import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, ShoppingCart,
  Plus, Edit2, Trash2, Search, X, LogOut, RefreshCw,
  TrendingUp, Package, UserCheck, Menu, Download,
  MessageSquare, Send, MessageCircle, Mic, Volume2, Play, Pause, Headphones,
  Image as ImageIcon, ZoomIn, UploadCloud, CheckCircle2, Eye, Filter,
  Phone, MapPin, Calendar, Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import adminAPI from '../utils/adminApi';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { compressAudioFile } from '../utils/audioCompressor.js';
import CUSTOMER_VOICE_REVIEWS from '../utils/defaultVoiceReviews';
import reviewImages from '../utils/reviewImages';

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
  const [viewingOrder, setViewingOrder] = useState(null);
  const [pdfFilterType, setPdfFilterType] = useState('all');
  const [pdfFromDate, setPdfFromDate] = useState('');
  const [pdfToDate, setPdfToDate] = useState('');

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

  // Audio Reviews State
  const [audioReviews, setAudioReviews] = useState(CUSTOMER_VOICE_REVIEWS);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [editingAudioReview, setEditingAudioReview] = useState(null);
  const [audioForm, setAudioForm] = useState({
    name: '',
    duration: '0:45',
    quote: '',
    location: 'Kerala',
  });
  const [audioPhotoPreview, setAudioPhotoPreview] = useState(null);
  const [audioPhotoBase64, setAudioPhotoBase64] = useState('');
  const [audioUrlPreview, setAudioUrlPreview] = useState('');
  const [playingAdminAudioId, setPlayingAdminAudioId] = useState(null);
  const [compressingAudio, setCompressingAudio] = useState(false);

  // Review Images state (preserves all 176 default images + any dynamic uploads)
  const [reviewImagesList, setReviewImagesList] = useState(() => {
    let localDyn = [];
    try {
      const s = localStorage.getItem('dynamicReviewImages');
      if (s) localDyn = JSON.parse(s);
    } catch (e) {}

    const staticItems = reviewImages.map((img, i) => ({
      _id: `revimg-static-${i + 1}`,
      url: img.startsWith('/') ? img : `/review/${img}`,
      title: img,
      isDefault: true,
      createdAt: '2026-11-01'
    }));

    return [...localDyn, ...staticItems];
  });
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewFilterType, setReviewFilterType] = useState('all'); // 'all', 'dynamic', 'default'
  const [visibleReviewCount, setVisibleReviewCount] = useState(24);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewFiles, setSelectedReviewFiles] = useState([]);
  const [compressingReviewImgs, setCompressingReviewImgs] = useState(false);
  const [uploadingReviewImgs, setUploadingReviewImgs] = useState(false);
  const [zoomReviewImage, setZoomReviewImage] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const DEFAULT_STATS = {
    totalUsers: 0,
    totalProducts: 1,
    totalOrders: 0,
    totalRevenue: 0,
    statusBreakdown: {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    let hasError = false;

    try {
      const statsRes = await adminAPI.get('/stats').catch(() => null);
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(DEFAULT_STATS);
        hasError = true;
      }

      const ordersRes = await adminAPI.get('/orders').catch(() => null);
      if (ordersRes && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      } else {
        setOrders([]);
        hasError = true;
      }

      const productsRes = await adminAPI.get('/products').catch(() => null);
      if (productsRes && Array.isArray(productsRes.data)) {
        setProducts(productsRes.data);
      } else {
        setProducts([]);
      }

      const usersRes = await adminAPI.get('/stats/users').catch(() => null);
      if (usersRes && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else {
        setUsers([]);
      }

      const audioRes = await adminAPI.get('/audio-reviews').catch(() => null);
      if (audioRes && Array.isArray(audioRes.data) && audioRes.data.length > 0) {
        setAudioReviews(audioRes.data);
      }

      const reviewImagesRes = await adminAPI.get('/review-images').catch(() => null);
      if (reviewImagesRes && Array.isArray(reviewImagesRes.data) && reviewImagesRes.data.length > 0) {
        let localDyn = [];
        try {
          const s = localStorage.getItem('dynamicReviewImages');
          if (s) localDyn = JSON.parse(s);
        } catch (e) {}

        const seen = new Set();
        const merged = [];
        for (const item of [...localDyn, ...reviewImagesRes.data]) {
          const key = item._id || item.url;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }
        setReviewImagesList(merged);
      }

      if (hasError) {
        setError('Unable to reach backend API or database. Once you update your MONGO_URI in Namecheap cPanel and click "Restart App", click Refresh to reload.');
      }
    } catch (err) {
      setStats(DEFAULT_STATS);
      setError('Unable to connect to backend server. Please verify your backend deployment and MongoDB URI.');
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
    } else if (pdfFilterType === 'custom') {
      if (!pdfFromDate && !pdfToDate) {
        alert('Please select a From Date or To Date for custom date range!');
        return;
      }
      let start = null;
      let end = null;
      if (pdfFromDate) {
        start = new Date(pdfFromDate);
        start.setHours(0, 0, 0, 0);
      }
      if (pdfToDate) {
        end = new Date(pdfToDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      if (start && end && start > end) {
        alert('From Date cannot be later than To Date!');
        return;
      }

      filteredOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });

      const formatDateStr = (dStr) => new Date(dStr).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

      if (pdfFromDate && pdfToDate) {
        rangeLabel = `From ${formatDateStr(pdfFromDate)} to ${formatDateStr(pdfToDate)}`;
      } else if (pdfFromDate) {
        rangeLabel = `From ${formatDateStr(pdfFromDate)} to Today`;
      } else if (pdfToDate) {
        rangeLabel = `Up to ${formatDateStr(pdfToDate)}`;
      }
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
        0: { cellWidth: 10 },
        1: { cellWidth: 26 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32 },
        4: { cellWidth: 24 },
        5: { cellWidth: 10 },
        6: { cellWidth: 20 },
        7: { cellWidth: 42 },
        8: { cellWidth: 34 },
        9: { cellWidth: 18 },
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
        return `Dear ${name}, your order for ${product} has been CANCELLED. Please contact support at 8139800282 for details.`;
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

  // ── Audio Review Actions ──
  const openAddAudioModal = () => {
    setEditingAudioReview(null);
    setAudioForm({ name: 'Verified Review', duration: '0:45', quote: '', location: 'Kerala' });
    setAudioPhotoPreview('/contact.webp');
    setAudioPhotoBase64('');
    setAudioUrlPreview('');
    setAudioModalOpen(true);
  };

  const openEditAudioModal = (rev) => {
    setEditingAudioReview(rev);
    setAudioForm({
      name: rev.name || '',
      duration: rev.duration || '0:45',
      quote: rev.quote || '',
      location: rev.location || 'Kerala',
    });
    setAudioPhotoPreview(rev.photo || '/contact.webp');
    setAudioPhotoBase64('');
    setAudioUrlPreview(rev.audioUrl || '');
    setAudioModalOpen(true);
  };

  const handleAudioPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError('');
      const webpDataUrl = await compressImageToWebP(file, 400, 400, 0.7);
      setAudioPhotoBase64(webpDataUrl);
      setAudioPhotoPreview(webpDataUrl);
    } catch (err) {
      setError('Failed to compress customer photo.');
    }
  };

  const handleAudioFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setCompressingAudio(true);
    try {
      const result = await compressAudioFile(file);
      setAudioUrlPreview(result.dataUrl);
      if (result.duration) {
        setAudioForm(prev => ({ ...prev, duration: result.duration }));
      }
    } catch (err) {
      console.error('Audio compression error:', err);
      setError('Failed to process audio file. Please try another audio clip.');
    } finally {
      setCompressingAudio(false);
    }
  };

  const handleAudioSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!audioForm.name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!audioUrlPreview) {
      setError('Customer audio file is required.');
      return;
    }

    const photo = audioPhotoBase64 || audioPhotoPreview || '/contact.webp';

    const payload = {
      name: audioForm.name,
      photo,
      audioUrl: audioUrlPreview,
      duration: audioForm.duration || '0:45',
      quote: audioForm.quote,
      location: audioForm.location || 'Kerala',
    };

    try {
      if (editingAudioReview) {
        const { data } = await adminAPI.put(`/audio-reviews/${editingAudioReview._id}`, payload);
        setAudioReviews(prev => prev.map(r => r._id === editingAudioReview._id ? data : r));
        setSuccess('Audio review updated!');
      } else {
        const { data } = await adminAPI.post('/audio-reviews', payload);
        setAudioReviews(prev => [data, ...prev]);
        setSuccess('Audio review created!');
      }
      setAudioModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Audio review action failed.');
    }
  };

  const handleAudioDelete = async (id) => {
    if (window.confirm('Delete this audio review?')) {
      try {
        await adminAPI.delete(`/audio-reviews/${id}`);
        setAudioReviews(audioReviews.filter(r => r._id !== id));
        setSuccess('Audio review deleted.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Delete failed.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const [customerSearch, setCustomerSearch] = useState('');

  const getReviewImgSrc = (img) => {
    if (!img) return '/images/product-pouch.webp';
    const url = typeof img === 'object' && img.url ? img.url : img;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
    return `/review/${url}`;
  };

  const openAddReviewImageModal = () => {
    setSelectedReviewFiles([]);
    setError('');
    setReviewModalOpen(true);
  };

  const handleReviewFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    setError('');
    setCompressingReviewImgs(true);

    try {
      const processed = [];
      for (const file of files) {
        const webpDataUrl = await compressImageToWebP(file, 1200, 1200, 0.82);
        processed.push({
          name: file.name,
          size: file.size,
          previewUrl: webpDataUrl
        });
      }
      setSelectedReviewFiles(prev => [...prev, ...processed]);
    } catch (err) {
      console.error('Review image compression error:', err);
      setError('Failed to optimize some review images.');
    } finally {
      setCompressingReviewImgs(false);
      e.target.value = '';
    }
  };

  const removeSelectedReviewFile = (index) => {
    setSelectedReviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewImagesUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedReviewFiles.length === 0) {
      setError('Please select at least one review image to upload.');
      return;
    }

    setUploadingReviewImgs(true);
    setError('');

    const payload = {
      images: selectedReviewFiles.map((f, idx) => ({
        url: f.previewUrl,
        title: f.name.replace(/\.[^/.]+$/, ''),
        order: idx
      }))
    };

    let newItems = [];
    try {
      const { data } = await adminAPI.post('/review-images', payload);
      newItems = Array.isArray(data.data) ? data.data : [data.data];
    } catch (err) {
      console.warn('Backend API /review-images returned error or 404. Falling back to browser storage sync.', err);
      // Fallback: save to localStorage so the admin doesn't lose their uploads even if backend route is restarting!
      newItems = payload.images.map((img, i) => ({
        _id: `revimg-dyn-${Date.now()}-${i}`,
        url: img.url,
        title: img.title || 'Review Image',
        order: img.order || 0,
        isDefault: false,
        createdAt: new Date().toISOString()
      }));

      try {
        const current = JSON.parse(localStorage.getItem('dynamicReviewImages') || '[]');
        localStorage.setItem('dynamicReviewImages', JSON.stringify([...newItems, ...current]));
      } catch (storageErr) {
        console.error('localStorage save error:', storageErr);
      }
    }

    setReviewImagesList(prev => [...newItems, ...prev]);
    setSuccess(`Successfully added ${newItems.length} review image(s)!`);
    setReviewModalOpen(false);
    setSelectedReviewFiles([]);
    setTimeout(() => setSuccess(''), 3500);
    setUploadingReviewImgs(false);
  };

  const handleDeleteReviewImage = async (reviewItem) => {
    const id = reviewItem._id || reviewItem.url;
    if (!window.confirm('Are you sure you want to remove this review image?')) {
      return;
    }

    setDeletingReviewId(id);
    try {
      await adminAPI.delete(`/review-images/${encodeURIComponent(id)}`).catch(() => null);
    } catch (err) {
      console.warn('Delete review image API call notice:', err);
    }

    // Always clean from localStorage if present
    try {
      const current = JSON.parse(localStorage.getItem('dynamicReviewImages') || '[]');
      const filtered = current.filter(r => r._id !== id && r.url !== reviewItem.url);
      localStorage.setItem('dynamicReviewImages', JSON.stringify(filtered));
    } catch (e) {}

    setReviewImagesList(prev => prev.filter(r => r._id !== id && r.url !== reviewItem.url));
    setSuccess('Review image removed successfully.');
    setTimeout(() => setSuccess(''), 3000);
    setDeletingReviewId(null);
  };

  const filteredReviewImages = reviewImagesList.filter(item => {
    const titleMatch = (item.title || item.url || '').toLowerCase().includes(reviewSearchTerm.toLowerCase());
    if (!titleMatch) return false;
    const isDynamic = !item.isDefault || item.url.startsWith('data:') || item._id?.startsWith('revimg-dyn');
    if (reviewFilterType === 'dynamic') return isDynamic;
    if (reviewFilterType === 'default') return !isDynamic;
    return true;
  });

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
    audioReviews: 'Customer Audio Reviews',
    reviewImages: 'Customer Review Images',
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
            {activeTab === 'audioReviews' && 'Upload and manage customer audio reviews with photo & name.'}
            {activeTab === 'reviewImages' && 'Upload, manage, and view customer transformation screenshots.'}
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

          {activeTab === 'audioReviews' && (
            <button onClick={openAddAudioModal} className="btn btn-primary" style={{ gap: '6px', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}>
              <Plus size={16} />
              <span>Add Audio Review</span>
            </button>
          )}

          {activeTab === 'reviewImages' && (
            <button onClick={openAddReviewImageModal} className="btn btn-primary" style={{ gap: '6px', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}>
              <Plus size={16} />
              <span>Upload Review Images</span>
            </button>
          )}

          {(activeTab === 'dashboard' || activeTab === 'orders') && orders.length > 0 && (
            <button
              onClick={() => {
                setPdfFilterType('all');
                setPdfFromDate('');
                setPdfToDate('');
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
            { id: 'orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
            { id: 'products', icon: <ShoppingBag size={18} />, label: 'Products' },
            { id: 'audioReviews', icon: <Mic size={18} />, label: 'Audio Reviews' },
            { id: 'reviewImages', icon: <ImageIcon size={18} />, label: 'Review Images' },
            { id: 'customers', icon: <UserCheck size={18} />, label: 'Customers' },
            { id: 'users', icon: <Users size={18} />, label: 'Users' },
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
                      <th style={{ minWidth: '140px' }}>Customer</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Phone</th>
                      <th style={{ minWidth: '120px' }}>Product</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Qty</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Total</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Order Time</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr
                        key={order._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewingOrder(order)}
                        title="Click to view full order details"
                      >
                        <td data-label="Customer" style={{ fontWeight: '700', color: '#1e293b' }}>{order.name}</td>
                        <td data-label="Phone" style={{ whiteSpace: 'nowrap' }}>
                          <a
                            href={`tel:${order.phone}`}
                            onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--primary-green)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Phone size={11} /> {order.phone}
                          </a>
                        </td>
                        <td data-label="Product">{order.product?.name || 'Deleted Product'}</td>
                        <td data-label="Qty">{order.quantity}</td>
                        <td data-label="Total" style={{ fontWeight: '700', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>₹{order.totalPrice}</td>
                        <td data-label="Order Time" style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#1e293b' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
                      <th style={{ minWidth: '150px' }}>Customer</th>
                      <th style={{ minWidth: '130px' }}>Product</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Total</th>
                      <th style={{ minWidth: '160px' }}>Delivery Address</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Order Time</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
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
                        <tr
                          key={order._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setViewingOrder(order)}
                          title="Click to view full order details"
                        >
                          <td data-label="Customer" style={{ minWidth: '150px' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.86rem' }}>{order.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <a
                                href={`tel:${order.phone}`}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--primary-green)',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Click to call customer"
                              >
                                <Phone size={11} /> {order.phone}
                              </a>
                            </div>
                            {order.alternatePhone && (
                              <div style={{ fontSize: '0.72rem', color: '#888' }}>Alt: {order.alternatePhone}</div>
                            )}
                            {order.email && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '160px'
                                }}
                                title={order.email}
                              >
                                {order.email}
                              </div>
                            )}
                          </td>
                          <td data-label="Product" style={{ minWidth: '130px' }}>
                            <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.84rem' }}>
                              {order.product?.name || 'Deleted Product'}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              marginTop: '3px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '100px',
                              background: '#f1f5f9',
                              color: '#475569'
                            }}>
                              Qty: {order.quantity}
                            </span>
                          </td>
                          <td data-label="Total" style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: '800', color: 'var(--primary-green)', fontSize: '0.9rem' }}>
                              ₹{order.totalPrice}
                            </div>
                          </td>
                          <td data-label="Address" style={{ minWidth: '160px', maxWidth: '220px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--secondary-green)', fontSize: '0.8rem' }}>
                              {order.district}{order.state ? `, ${order.state}` : ''}{order.pinCode ? ` – ${order.pinCode}` : ''}
                            </div>
                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.25',
                                marginTop: '2px'
                              }}
                              title={`${order.address || ''}${order.landmark ? ', Landmark: ' + order.landmark : ''}, ${order.district || ''}, ${order.state || ''} - ${order.pinCode || ''}`}
                            >
                              {order.address} {order.landmark && `(${order.landmark})`}
                            </div>
                          </td>
                          <td data-label="Order Time" style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#1e293b' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                          </td>
                          <td data-label="Status" onClick={e => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="status-select"
                              style={{
                                padding: '5px 8px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
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
                          <td data-label="Actions" onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setViewingOrder(order)}
                                className="action-btn"
                                style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px' }}
                                title="View full order details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => openMsgModalForOrder(order, 'Custom')}
                                className="action-btn"
                                style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '6px' }}
                                title="Send WhatsApp / SMS message to customer"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                onClick={() => handleOrderDelete(order._id)}
                                className="action-btn action-btn-danger"
                                style={{ padding: '6px' }}
                                aria-label="Delete order"
                                title="Delete order"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No matching orders found.</td></tr>
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

          {/* ── Audio Reviews Tab ── */}
          {activeTab === 'audioReviews' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary-green)' }}>
                  Customer Audio Reviews ({audioReviews.length})
                </h3>
                <button onClick={openAddAudioModal} className="btn btn-primary" style={{ gap: '6px', borderRadius: '8px', padding: '8px 14px', fontSize: '0.82rem' }}>
                  <Plus size={15} /> Add Customer Audio
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Customer Name</th>
                      <th>Audio Preview</th>
                      <th>Duration</th>
                      <th>Quote / Review</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audioReviews.map((rev) => (
                      <tr key={rev._id}>
                        <td data-label="Photo">
                          <img
                            src={rev.photo || '/contact.webp'}
                            alt={rev.name}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-green)', background: '#fff' }}
                            onError={e => { e.target.onerror = null; e.target.src = '/contact.webp'; }}
                          />
                        </td>
                        <td data-label="Customer Name" style={{ fontWeight: '700', color: 'var(--primary-green)' }}>{rev.name}</td>
                        <td data-label="Audio Preview" style={{ minWidth: '220px' }}>
                          <audio controls preload="none" src={rev.audioUrl} style={{ width: '100%', height: '36px' }} />
                        </td>
                        <td data-label="Duration">
                          <span className="badge badge-confirmed" style={{ padding: '4px 10px' }}>{rev.duration || '0:45'}</span>
                        </td>
                        <td data-label="Quote / Review" style={{ fontSize: '0.82rem', maxWidth: '240px', color: 'var(--text-color)' }}>
                          "{rev.quote || 'No quote specified'}"
                        </td>
                        <td data-label="Location" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{rev.location || 'Kerala'}</td>
                        <td data-label="Actions">
                          <div className="actions-cell">
                            <button onClick={() => openEditAudioModal(rev)} className="action-btn" aria-label="Edit review">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => handleAudioDelete(rev._id)} className="action-btn action-btn-danger" aria-label="Delete review">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {audioReviews.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No customer audio reviews uploaded yet. Click <strong>"Add Customer Audio"</strong> to upload your first audio review!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Review Images Tab ── */}
          {activeTab === 'reviewImages' && (
            <div>
              {/* Top controls: Search, Filters, and Stats */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <input
                      type="text"
                      value={reviewSearchTerm}
                      onChange={e => setReviewSearchTerm(e.target.value)}
                      placeholder="Search review images..."
                      style={{ paddingLeft: '38px', height: '38px', fontSize: '0.84rem' }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'inline-flex', background: '#f1f5f0', borderRadius: '8px', padding: '3px' }}>
                    {[
                      { key: 'all', label: `All (${reviewImagesList.length})` },
                      { key: 'dynamic', label: `Dynamic (${reviewImagesList.filter(r => !r.isDefault || r.url.startsWith('data:') || r._id?.startsWith('revimg-dyn')).length})` },
                      { key: 'default', label: `Default (${reviewImagesList.filter(r => r.isDefault && !r.url.startsWith('data:') && !r._id?.startsWith('revimg-dyn')).length})` },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setReviewFilterType(f.key)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          background: reviewFilterType === f.key ? '#fff' : 'transparent',
                          color: reviewFilterType === f.key ? 'var(--primary-green)' : 'var(--text-muted)',
                          boxShadow: reviewFilterType === f.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Showing {Math.min(visibleReviewCount, filteredReviewImages.length)} of {filteredReviewImages.length}
                  </span>
                  <button onClick={openAddReviewImageModal} className="btn btn-primary" style={{ gap: '6px', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem' }}>
                    <Plus size={16} /> Upload New Images
                  </button>
                </div>
              </div>

              {/* Grid of Review Images */}
              {filteredReviewImages.length > 0 ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px'
                  }}>
                    {filteredReviewImages.slice(0, visibleReviewCount).map((rev, idx) => {
                      const isDyn = !rev.isDefault || rev.url.startsWith('data:') || rev._id?.startsWith('revimg-dyn');
                      return (
                        <div
                          key={rev._id || rev.url || idx}
                          style={{
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                        >
                          {/* Image Container with Badges */}
                          <div
                            style={{ position: 'relative', width: '100%', height: '220px', background: '#f5f5f5', cursor: 'pointer', overflow: 'hidden' }}
                            onClick={() => setZoomReviewImage(rev.url)}
                          >
                            <img
                              src={getReviewImgSrc(rev.url)}
                              alt={rev.title || 'Review screenshot'}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.onerror = null; e.target.src = '/images/product-pouch.webp'; }}
                            />

                            {/* Badge */}
                            <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                              {isDyn ? (
                                <span style={{
                                  background: '#15803d',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: '800',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.3px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  DYNAMIC
                                </span>
                              ) : (
                                <span style={{
                                  background: 'rgba(255,255,255,0.92)',
                                  color: 'var(--primary-green)',
                                  fontSize: '0.65rem',
                                  fontWeight: '700',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                  STATIC
                                </span>
                              )}
                            </div>

                            {/* Hover Zoom hint */}
                            <div style={{
                              position: 'absolute', bottom: '8px', right: '8px',
                              background: 'rgba(0,0,0,0.6)', color: '#fff',
                              borderRadius: '50%', padding: '6px', display: 'flex'
                            }}>
                              <ZoomIn size={13} />
                            </div>
                          </div>

                          {/* Footer details & actions */}
                          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fafbfa' }}>
                            <div style={{ overflow: 'hidden' }}>
                              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rev.title || rev.url}>
                                {rev.title || (rev.url?.split('/').pop() || 'Transformation')}
                              </p>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                #{idx + 1}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => setZoomReviewImage(rev.url)}
                                title="Zoom Full Size"
                                className="action-btn"
                                style={{ padding: '5px' }}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteReviewImage(rev)}
                                disabled={deletingReviewId === (rev._id || rev.url)}
                                title="Remove Review Image"
                                className="action-btn action-btn-danger"
                                style={{ padding: '5px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {visibleReviewCount < filteredReviewImages.length && (
                    <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '40px' }}>
                      <button
                        onClick={() => setVisibleReviewCount(prev => prev + 24)}
                        className="btn btn-secondary"
                        style={{ padding: '10px 28px', fontSize: '0.86rem', fontWeight: '700' }}
                      >
                        Load More Images ({filteredReviewImages.length - visibleReviewCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  background: '#fff',
                  border: '1.5px dashed var(--border-color)',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <ImageIcon size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 6px', color: 'var(--primary-green)' }}>No review images match your search</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>Try clearing filters or click below to upload new transformations.</p>
                  <button onClick={openAddReviewImageModal} className="btn btn-primary" style={{ gap: '6px' }}>
                    <Plus size={16} /> Upload Review Images
                  </button>
                </div>
              )}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="pdf-from-date" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-color)' }}>From Date *</label>
                        <input
                          type="date"
                          id="pdf-from-date"
                          value={pdfFromDate}
                          onChange={e => setPdfFromDate(e.target.value)}
                          max={pdfToDate || new Date().toISOString().split('T')[0]}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="pdf-to-date" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-color)' }}>To Date *</label>
                        <input
                          type="date"
                          id="pdf-to-date"
                          value={pdfToDate}
                          onChange={e => setPdfToDate(e.target.value)}
                          min={pdfFromDate || undefined}
                          max={new Date().toISOString().split('T')[0]}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Select start and end dates to filter orders in the PDF report.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setExportModalOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                  <button
                    type="button"
                    onClick={downloadFilteredPDF}
                    className="btn btn-primary"
                    disabled={pdfFilterType === 'custom' && !pdfFromDate && !pdfToDate}
                    style={{ flex: 2, padding: '10px', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Download size={16} />
                    Generate PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Details Modal ── */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-green)', margin: 0 }}>
                    Order Details
                  </h3>
                  <span className={`badge badge-${(viewingOrder.status || 'pending').toLowerCase()}`}>
                    {viewingOrder.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{viewingOrder._id}</span>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="modal-close" aria-label="Close modal" style={{ position: 'static' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
              {/* Order Date & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Calendar size={13} /> Order Placed
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#1e293b', marginTop: '6px' }}>
                    {new Date(viewingOrder.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(viewingOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Update Status
                  </div>
                  <select
                    value={viewingOrder.status}
                    onChange={(e) => {
                      handleStatusChange(viewingOrder._id, e.target.value);
                      setViewingOrder({ ...viewingOrder, status: e.target.value });
                    }}
                    className="status-select"
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    {['Contacted', 'Checked', 'Completed'].includes(viewingOrder.status) && (
                      <option value={viewingOrder.status}>{viewingOrder.status}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Customer Information Card */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: '800', color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customer Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{viewingOrder.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Phone Number</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <a href={`tel:${viewingOrder.phone}`} style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary-green)', textDecoration: 'none' }}>
                        {viewingOrder.phone}
                      </a>
                      <a
                        href={`https://wa.me/${formatPhoneForUrl(viewingOrder.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', textDecoration: 'none' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  </div>
                  {viewingOrder.alternatePhone && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Alternate Phone</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#475569', marginTop: '2px' }}>{viewingOrder.alternatePhone}</div>
                    </div>
                  )}
                  {viewingOrder.email && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                      <div style={{ fontSize: '0.86rem', color: '#475569', marginTop: '2px', wordBreak: 'break-all' }}>{viewingOrder.email}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address Card */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', fontWeight: '800', color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} /> Delivery Address
                </h4>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', lineHeight: '1.6', fontSize: '0.88rem', color: '#334155' }}>
                  <div style={{ fontWeight: '600' }}>{viewingOrder.address}</div>
                  {viewingOrder.landmark && (
                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Landmark: {viewingOrder.landmark}</div>
                  )}
                  <div style={{ fontWeight: '700', color: 'var(--secondary-green)', marginTop: '4px' }}>
                    {viewingOrder.district}, {viewingOrder.state} – {viewingOrder.pinCode}
                  </div>
                </div>
              </div>

              {/* Product & Payment Summary Card */}
              <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.86rem', fontWeight: '800', color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order Summary
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#1e293b' }}>
                      {viewingOrder.product?.name || 'Agadhi Choornam'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Quantity: <span style={{ fontWeight: '700', color: '#1e293b' }}>{viewingOrder.quantity}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-green)' }}>
                      ₹{viewingOrder.totalPrice}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cash on Delivery</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const ord = viewingOrder;
                    setViewingOrder(null);
                    openMsgModalForOrder(ord, 'Custom');
                  }}
                  className="btn btn-primary"
                  style={{ gap: '6px', padding: '9px 16px', fontSize: '0.84rem' }}
                >
                  <MessageSquare size={15} />
                  <span>Send Notification</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="btn btn-outline"
                  style={{ padding: '9px 18px', fontSize: '0.84rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    justifyContent: 'center',
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

      {/* ── Audio Review Modal ── */}
      {audioModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <button onClick={() => setAudioModalOpen(false)} className="modal-close" aria-label="Close modal">
              <X size={22} />
            </button>
            <div className="modal-body" style={{ padding: '28px' }}>
              <div className="modal-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={22} />
                  {editingAudioReview ? 'Edit Audio Review' : 'Upload Customer Audio Review'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Upload customer photo and audio file along with name and quote.
                </p>
              </div>

              {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

              <form onSubmit={handleAudioSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="audio-cust-name" style={{ fontSize: '0.82rem', fontWeight: '600' }}>Customer Name *</label>
                    <input
                      type="text"
                      id="audio-cust-name"
                      value={audioForm.name}
                      onChange={e => setAudioForm({ ...audioForm, name: e.target.value })}
                      placeholder="e.g. Suresh Kumar"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="audio-cust-location" style={{ fontSize: '0.82rem', fontWeight: '600' }}>Location / City</label>
                    <input
                      type="text"
                      id="audio-cust-location"
                      value={audioForm.location}
                      onChange={e => setAudioForm({ ...audioForm, location: e.target.value })}
                      placeholder="e.g. Wayanad, Kerala"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Photo Upload */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Customer Photo</label>
                    <label
                      htmlFor="audio-photo-upload"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', padding: '8px 12px', border: '1.5px dashed var(--border-color)',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem',
                        color: 'var(--primary-green)', fontWeight: '600',
                        background: 'var(--card-bg)', minHeight: '42px',
                      }}
                    >
                      📷 Pick Photo
                    </label>
                    <input
                      type="file"
                      id="audio-photo-upload"
                      accept="image/*"
                      onChange={handleAudioPhotoChange}
                      style={{ display: 'none' }}
                    />
                    {audioPhotoPreview && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={audioPhotoPreview}
                          alt="Preview"
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photo Ready</span>
                      </div>
                    )}
                  </div>

                  {/* Audio File / URL Input */}
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Audio File / Link *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={audioUrlPreview}
                        onChange={e => setAudioUrlPreview(e.target.value)}
                        placeholder="Paste audio URL or click Select Audio..."
                        style={{ flex: 1 }}
                      />
                      <label
                        htmlFor="audio-file-upload"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '4px', padding: '8px 12px', border: '1.5px dashed var(--primary-green)',
                          borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem',
                          color: 'var(--primary-green)', fontWeight: '600',
                          background: 'rgba(47,79,30,0.05)', whiteSpace: 'nowrap'
                        }}
                      >
                        🎙️ Select Audio
                      </label>
                      <input
                        type="file"
                        id="audio-file-upload"
                        accept="audio/*"
                        onChange={handleAudioFileChange}
                        style={{ display: 'none' }}
                        disabled={compressingAudio}
                      />
                    </div>
                    {compressingAudio && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-green)', marginTop: '4px', fontWeight: '600' }}>
                        ⚡ Optimizing audio recording...
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Live Preview Player */}
                {audioUrlPreview && (
                  <div style={{ marginBottom: '16px', background: '#f4faf2', padding: '12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary-green)', marginBottom: '6px' }}>
                      ✓ Audio Preview Test:
                    </div>
                    <audio controls src={audioUrlPreview} style={{ width: '100%', height: '36px' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="audio-cust-duration" style={{ fontSize: '0.82rem', fontWeight: '600' }}>Duration</label>
                    <input
                      type="text"
                      id="audio-cust-duration"
                      value={audioForm.duration}
                      onChange={e => setAudioForm({ ...audioForm, duration: e.target.value })}
                      placeholder="0:45"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="audio-cust-quote" style={{ fontSize: '0.82rem', fontWeight: '600' }}>Customer Quote / Highlight</label>
                    <input
                      type="text"
                      id="audio-cust-quote"
                      value={audioForm.quote}
                      onChange={e => setAudioForm({ ...audioForm, quote: e.target.value })}
                      placeholder="e.g. Gained 5 kgs in 35 days!"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setAudioModalOpen(false)} className="btn btn-outline" style={{ flexGrow: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 2 }}>
                    {editingAudioReview ? 'Save Changes' : 'Upload Audio Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Review Images Modal (Supports Single & Bulk Uploads with WebP Compression) ── */}
      {reviewModalOpen && (
        <div className="modal-overlay" onClick={() => !uploadingReviewImgs && setReviewModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                  Upload Customer Review Images
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Select one or multiple screenshots/photos. All images are automatically compressed to WebP for instant loading.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !uploadingReviewImgs && setReviewModalOpen(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

              {/* Upload Dropzone */}
              <div
                style={{
                  border: '2px dashed #bbf7d0',
                  borderRadius: '12px',
                  background: '#f8fdf9',
                  padding: '28px 16px',
                  textAlign: 'center',
                  cursor: compressingReviewImgs ? 'wait' : 'pointer',
                  marginBottom: '20px',
                  transition: 'background 0.2s',
                }}
                onClick={() => document.getElementById('review-images-file-input')?.click()}
              >
                <input
                  type="file"
                  id="review-images-file-input"
                  multiple
                  accept="image/*"
                  onChange={handleReviewFilesSelected}
                  style={{ display: 'none' }}
                  disabled={compressingReviewImgs || uploadingReviewImgs}
                />
                <UploadCloud size={38} style={{ color: 'var(--primary-green)', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '0.96rem', fontWeight: '700', color: 'var(--primary-green)' }}>
                  {compressingReviewImgs ? 'Optimizing & Compressing Images...' : 'Click to Browse or Drag & Drop Photos'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Supports JPEG, PNG, WebP (Single or Multi-select bulk upload)
                </p>
                {compressingReviewImgs && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary-green)' }}>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Compressing with Canvas to WebP...</span>
                  </div>
                )}
              </div>

              {/* Selected Images Preview Grid */}
              {selectedReviewFiles.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--primary-green)' }}>
                      Ready to Upload ({selectedReviewFiles.length} photos)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReviewFiles([])}
                      style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '12px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '8px',
                    background: '#f9f9f9',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                  }}>
                    {selectedReviewFiles.map((fileObj, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          height: '140px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #d1fae5',
                          background: '#fff'
                        }}
                      >
                        <img
                          src={fileObj.previewUrl}
                          alt={fileObj.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedReviewFile(idx)}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                            border: 'none', borderRadius: '50%',
                            width: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove this photo"
                        >
                          <X size={12} />
                        </button>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(0,0,0,0.5)', color: '#fff',
                          fontSize: '0.62rem', padding: '2px 4px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {fileObj.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={uploadingReviewImgs}
                  className="btn btn-outline"
                  style={{ padding: '9px 18px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewImagesUploadSubmit}
                  disabled={uploadingReviewImgs || selectedReviewFiles.length === 0}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '9px 24px', fontSize: '0.84rem' }}
                >
                  {uploadingReviewImgs ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving Review Images...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Upload &amp; Save ({selectedReviewFiles.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom Full Size Lightbox Modal ── */}
      {zoomReviewImage && (
        <div className="lightbox-overlay" onClick={() => setZoomReviewImage(null)}>
          <div className="lightbox-container" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setZoomReviewImage(null)} aria-label="Close zoom">
              <X size={28} />
            </button>
            <img src={getReviewImgSrc(zoomReviewImage)} alt="Review Zoom" className="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
