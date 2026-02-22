import { useState } from 'react';

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

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (supplierId: string, amount: number, note: string) => void;
};

export function SuppliersPaymentDialog({ open, supplier, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

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
      <DialogTitle>Record Payment to Supplier</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Supplier
          </Typography>
          <Typography variant="h6">{supplier.name}</Typography>
        </Box>

        <Box sx={{ mb: 3, p: 2, borderRadius: 1.5, bgcolor: 'error.lighter' }}>
          <Typography variant="subtitle2" color="error.dark">
            Outstanding Balance: {fCurrency(remaining)}
          </Typography>
        </Box>

        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'partial')}>
          <FormControlLabel
            value="full"
            control={<Radio />}
            label={`Clear full balance (${fCurrency(remaining)})`}
          />
          <FormControlLabel value="partial" control={<Radio />} label="Partial payment" />
        </RadioGroup>

        {mode === 'partial' && (
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Math.min(remaining, Number(e.target.value))))}
            slotProps={{ htmlInput: { min: 0, max: remaining } }}
            sx={{ mt: 2 }}
            helperText={
              amount > 0 ? `Remaining after: ${fCurrency(remaining - amount)}` : undefined
            }
          />
        )}

        <TextField
          fullWidth
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
          placeholder="e.g. Cash, Bank transfer, Check..."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          Confirm Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
