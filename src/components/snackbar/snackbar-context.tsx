import type { ReactNode } from 'react';

import { useMemo, useState, useContext, useCallback, createContext } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

// ======================================================================

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

type SnackbarAction = { label: string; onClick: () => void };

type SnackbarContextType = {
  showSnackbar: (message: string, severity?: SnackbarSeverity, action?: SnackbarAction) => void;
  showSuccess: (message: string, action?: SnackbarAction) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

export function SnackbarProvider({ children }: ProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<SnackbarSeverity>('success');
  const [snackAction, setSnackAction] = useState<SnackbarAction | undefined>(undefined);

  const showSnackbar = useCallback((msg: string, sev: SnackbarSeverity = 'success', act?: SnackbarAction) => {
    setMessage(msg);
    setSeverity(sev);
    setSnackAction(act);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string, act?: SnackbarAction) => showSnackbar(msg, 'success', act), [showSnackbar]);
  const showError = useCallback((msg: string) => showSnackbar(msg, 'error'), [showSnackbar]);
  const showWarning = useCallback((msg: string) => showSnackbar(msg, 'warning'), [showSnackbar]);
  const showInfo = useCallback((msg: string) => showSnackbar(msg, 'info'), [showSnackbar]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const value = useMemo(
    () => ({ showSnackbar, showSuccess, showError, showWarning, showInfo }),
    [showSnackbar, showSuccess, showError, showWarning, showInfo]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={snackAction ? undefined : handleClose}
          severity={severity}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            snackAction ? (
              <Button
                size="small"
                color="inherit"
                sx={{ fontWeight: 700, textTransform: 'none', mr: 1 }}
                onClick={() => { snackAction.onClick(); handleClose(); }}
              >
                {snackAction.label}
              </Button>
            ) : undefined
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
