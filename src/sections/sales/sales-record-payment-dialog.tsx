import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { useTranslation } from 'src/contexts';

import type { Invoice } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (amount: number) => void;
};

export function SalesRecordPaymentDialog({ open, invoice, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const maxAmount = invoice?.amountDue ?? 0;

  useEffect(() => {
    if (open && invoice) {
      setAmount(invoice.amountDue.toString());
      setError('');
    }
  }, [open, invoice]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = Number(value);

    if (!value.trim()) {
      setError(t('common.error'));
    } else if (Number.isNaN(numValue) || numValue <= 0) {
      setError(t('common.error'));
    } else if (numValue > maxAmount) {
      setError(`Max: ${fCurrency(maxAmount)}`);
    } else {
      setError('');
    }
  };

  const handleSave = () => {
    const numAmount = Number(amount);
    if (numAmount > 0 && numAmount <= maxAmount) {
      onSave(numAmount);
      onClose();
    }
  };

  const isValid = !error && Number(amount) > 0 && Number(amount) <= maxAmount;

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('sales.recordPayment')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('sales.invoiceNumber')}
          </Typography>
          <Typography variant="subtitle1">{invoice.invoiceNumber}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('sales.client')}
          </Typography>
          <Typography variant="subtitle1">{invoice.client.name}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('common.total')}
            </Typography>
            <Typography variant="subtitle1">{fCurrency(invoice.total)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('sales.amountPaid')}
            </Typography>
            <Typography variant="subtitle1">{fCurrency(invoice.amountPaid)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('sales.amountDue')}
            </Typography>
            <Typography variant="subtitle1" color="error.main">
              {fCurrency(invoice.amountDue)}
            </Typography>
          </Box>
        </Box>

        <TextField
          autoFocus
          fullWidth
          label={t('common.amount')}
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          error={!!error}
          helperText={error || `Max: ${fCurrency(maxAmount)}`}
          slotProps={{ htmlInput: { min: 0, max: maxAmount, step: 0.01 } }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" color="success" onClick={handleSave} disabled={!isValid}>
          {t('sales.recordPayment')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
