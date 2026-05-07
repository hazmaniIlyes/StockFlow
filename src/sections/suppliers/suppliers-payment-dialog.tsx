import type { Supplier } from 'src/_mock/_data';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fCurrency } from 'src/utils/format-number';

import { useGlobalScan, useTranslation } from 'src/contexts';

// ======================================================================

type Props = {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (supplierId: string, amount: number, note: string) => void;
};

export function SuppliersPaymentDialog({ open, supplier, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setFormOpen } = useGlobalScan();
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    setFormOpen(open);
    return () => setFormOpen(false);
  }, [open, setFormOpen]);

  if (!supplier) return null;

  const remaining = supplier.totalOwed;

  const handleSubmit = () => {
    const payAmount = mode === 'full' ? remaining : amount;
    onSubmit(supplier.id, payAmount, note);
    setMode('full');
    setAmount(0);
    setNote('');
    onClose();
  };

  const isValid = mode === 'full' || (amount > 0 && amount <= remaining);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('suppliers.recordPaymentToSupplier')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('suppliers.supplier')}
          </Typography>
          <Typography variant="h6">{supplier.name}</Typography>
        </Box>

        <Box sx={{ mb: 3, p: 2, borderRadius: 1.5, bgcolor: alpha(theme.palette.error.main, 0.12) }}>
          <Typography variant="subtitle2" color="error.main">
            {t('suppliers.outstandingBalance')}: {fCurrency(remaining)}
          </Typography>
        </Box>

        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'partial')}>
          <FormControlLabel
            value="full"
            control={<Radio />}
            label={`${t('suppliers.clearFullBalance')} (${fCurrency(remaining)})`}
          />
          <FormControlLabel value="partial" control={<Radio />} label={t('suppliers.partialPayment')} />
        </RadioGroup>

        {mode === 'partial' && (
          <TextField
            fullWidth
            label={t('common.amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Math.min(remaining, Number(e.target.value))))}
            slotProps={{ htmlInput: { min: 0, max: remaining } }}
            sx={{ mt: 2 }}
            helperText={
              amount > 0 ? `${t('suppliers.remainingAfter')}: ${fCurrency(remaining - amount)}` : undefined
            }
          />
        )}

        <TextField
          fullWidth
          label={t('suppliers.noteOptional')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
          placeholder={t('suppliers.notePlaceholder')}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {t('suppliers.confirmPayment')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
