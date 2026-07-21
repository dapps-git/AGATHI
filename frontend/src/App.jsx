import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider, AdminAuthContext } from './context/AdminAuthContext';

// Public Components & Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Results from './pages/Results';
import Policies from './pages/Policies';
import MyOrders from './pages/MyOrders';

// Admin Components & Pages (completely separate)
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// ─── Admin Route Guard (uses AdminAuthContext, NOT AuthContext) ───────────────
const AdminRoute = ({ children }) => {
  const { admin, loading } = useContext(AdminAuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#2F4F1E' }}>
        Loading Admin Panel...
      </div>
    );
  }

  if (!admin || !admin.isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

// ─── Public App Layout (uses AuthContext for customers only) ──────────────────
function PublicAppContent() {
  const location = useLocation();
  const hideLayout = ['/login', '/signup', '/forgot-password'].includes(location.pathname);

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideLayout && <Navbar />}
      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/results" element={<Results />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/privacy-policy" element={<Policies />} />
          <Route path="/terms-and-conditions" element={<Policies />} />
          <Route path="/refund-policy" element={<Policies />} />
          <Route path="/shipping-policy" element={<Policies />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}

// ─── Admin App Layout (uses AdminAuthContext, no public navbar/footer) ────────
function AdminAppContent() {
  return (
    <Routes>
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      {/* Redirect unknown admin paths back to admin login */}
      <Route path="*" element={<Navigate to="/admin-login" replace />} />
    </Routes>
  );
}

// ─── Root App: decides public vs admin based on path ─────────────────────────
function AppRouter() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath) {
    return (
      <AdminAuthProvider>
        <AdminAppContent />
      </AdminAuthProvider>
    );
  }

  return (
    <AuthProvider>
      <PublicAppContent />
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;
