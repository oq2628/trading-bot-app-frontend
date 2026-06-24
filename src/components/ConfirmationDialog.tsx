import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6, 7, 10, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '1.5rem',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(99, 102, 241, 0.18)'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          {title}
        </h3>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '0.55rem 1rem', minWidth: '84px', justifyContent: 'center' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '0.55rem 1rem', minWidth: '84px', justifyContent: 'center' }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationDialog;
