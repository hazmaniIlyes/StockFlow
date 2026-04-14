import { useState, useEffect } from 'react';

import { useTheme, alpha } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { useTranslation, useGlobalScan } from 'src/contexts';

import type { Client } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSubmit: (clientId: string, amount: number, note: string) => void;
};

export function ClientsPaymentDialog({ open, client, onClose, onSubmit }: Props) {
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

  if (!client) return null;

  const remaining = client.remainingBalance;

  const handleSubmit = () => {
    const payAmount = mode === 'full' ? remaining : amount;
    onSubmit(client.id, payAmount, note);
    setMode('full');
    setAmount(0);
    setNote('');
    onClose();
  };

  const isValid = mode === 'full' || (amount > 0 && amount <= remaining);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('clients.recordPayment')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('sales.client')}
          </Typography>
          <Typography variant="h6">{client.name}</Typography>
        </Box>

        <Box sx={{ mb: 3, p: 2, borderRadius: 1.5, bgcolor: alpha(theme.palette.error.main, 0.12) }}>
          <Typography variant="subtitle2" color="error.main">
            {t('clients.outstandingBalance')}: {fCurrency(remaining)}
          </Typography>
        </Box>

        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'partial')}>
          <FormControlLabel
            value="full"
            control={<Radio />}
            label={`${t('clients.clearFullBalance')} (${fCurrency(remaining)})`}
          />
          <FormControlLabel value="partial" control={<Radio />} label={t('clients.partialPayment')} />
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
              amount > 0 ? `${t('clients.remainingAfter')}: ${fCurrency(remaining - amount)}` : undefined
            }
          />
        )}

        <TextField
          fullWidth
          label={t('clients.noteOptional')}
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
          {t('clients.confirmPayment')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
