import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Storefront } from './pages/Storefront';
import { ProductDetail } from './pages/ProductDetail';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import { About } from './pages/About';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { MyTopUps } from './pages/MyTopUps';
import { Box, CircularProgress, Container, Typography } from '@mui/material';


// Protected Route wrapper for regular users/buyers
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Protected Route wrapper for Admin panel
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Box component="main" sx={{ minHeight: 'calc(100vh - 180px)' }}>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/top-ups" 
            element={
              <PrivateRoute>
                <MyTopUps />
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
      </Box>
      
      <Box 
        component="footer" 
        sx={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          marginTop: '4rem',
          color: 'text.secondary',
          fontSize: '0.85rem'
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1600px !important' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
            © {new Date().getFullYear()} AlgoForge Marketplace. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
            Built for professional quantitative traders. Secure physical asset storage & verification active.
          </Typography>
        </Container>
      </Box>
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
