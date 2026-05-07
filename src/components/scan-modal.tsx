import { useCallback } from 'react';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { useBarcodeScan } from 'src/hooks/use-barcode-scan';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ---------------------------------------------------------------------------

const pulse = keyframes`
  0%   { transform: scale(1);    opacity: 1;   }
  50%  { transform: scale(1.12); opacity: 0.7; }
  100% { transform: scale(1);    opacity: 1;   }
`;

// ---------------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (sku: string) => void;
};

/**
 * Reusable barcode-scan modal.
 * While open it listens for keyboard-buffered scanner input via `useBarcodeScan`.
 * When a scan is detected it calls `onScan(sku)` and closes itself.
 */
export function ScanModal({ open, onClose, onScan }: Props) {
  const { t } = useTranslation();

  const handleScan = useCallback(
    (sku: string) => {
      onClose();
      onScan(sku);
    },
    [onScan, onClose]
  );

  // The hook is only active while the modal is open
  useBarcodeScan(open, handleScan);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>{t('scanModal.dialogTitle')}</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
            gap: 2.5,
          }}
        >
          {/* Animated scanner icon */}
          <Box
            sx={(theme) => ({
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              animation: `${pulse} 1.6s ease-in-out infinite`,
            })}
          >
            <Iconify icon="solar:scanner-bold-duotone" width={40} />
          </Box>

          <Typography variant="subtitle1" fontWeight={600}>
            {t('scanModal.title')}
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t('scanModal.subtitle')}
          </Typography>

          <Box
            sx={(theme) => ({
              mt: 1,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              border: '1px dashed',
              borderColor: 'divider',
            })}
          >
            <Typography variant="caption" color="text.disabled">
              {t('scanModal.waiting')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('scanModal.cancel')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
