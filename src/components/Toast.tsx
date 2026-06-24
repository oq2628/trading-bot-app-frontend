import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          borderLeft: '4px solid var(--success-color)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
        };
      case 'error':
        return {
          borderLeft: '4px solid var(--error-color)',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)',
        };
      case 'info':
        return {
          borderLeft: '4px solid var(--primary-solid)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--success-color)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--error-color)" />;
      case 'info':
        return <Info size={18} color="var(--primary-solid)" />;
    }
  };

  return createPortal(
    <div className="toast-container">
      <div 
        className="glass-panel animate-fade-in"
        style={{
          pointerEvents: 'auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '400px',
          ...getStyle()
        }}
      >
        {getIcon()}
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff', flex: 1 }}>
          {message}
        </span>
        <button 
          onClick={onClose} 
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.2rem',
            borderRadius: '4px',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
};
export default Toast;
