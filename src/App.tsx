import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Storefront } from './pages/Storefront';
import { ProductDetail } from './pages/ProductDetail';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';

// Protected Route wrapper for regular users/buyers
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--primary-solid)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Protected Route wrapper for Admin panel
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--primary-solid)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }
  
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 180px)' }}>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        marginTop: '4rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          <p>© {new Date().getFullYear()} AlgoForge Marketplace. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            Built for professional quantitative traders. Secure physical asset storage & verification active.
          </p>
        </div>
      </footer>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
