import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { btnPrimarySx, btnSecondarySx, glassPanelSx } from '../theme';

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
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      slotProps={{
        paper: {
          sx: {
            ...glassPanelSx,
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
            border: '1px solid rgba(99, 102, 241, 0.18)',
            background: 'rgba(20, 22, 33, 0.9)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            backgroundImage: 'none',
          }
        },
        backdrop: {
          sx: {
            background: 'rgba(6, 7, 10, 0.85)',
            backdropFilter: 'blur(8px)',
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          padding: 0,
          fontSize: '1.15rem',
          fontWeight: 800,
          marginBottom: '0.75rem',
          color: '#fff',
          fontFamily: '"Outfit", sans-serif',
        }}
      >
        {title}
      </DialogTitle>
      
      <DialogContent
        sx={{
          padding: 0,
          color: 'text.secondary',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          fontFamily: '"Outfit", sans-serif',
        }}
      >
        {message}
      </DialogContent>
      
      <DialogActions sx={{ padding: 0, gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          sx={{
            ...btnSecondarySx,
            padding: '0.55rem 1rem',
            minWidth: '84px',
            justifyContent: 'center',
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          sx={{
            ...btnPrimarySx,
            padding: '0.55rem 1rem',
            minWidth: '84px',
            justifyContent: 'center',
          }}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
