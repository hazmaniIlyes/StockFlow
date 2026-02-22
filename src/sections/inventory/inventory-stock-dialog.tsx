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

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  product: InventoryProduct | null;
  onClose: () => void;
  onSubmit: (productId: string, type: 'add' | 'remove', quantity: number, reason: string) => void;
};

export function InventoryStockDialog({ open, product, onClose, onSubmit }: Props) {
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');

  if (!product) return null;

  const maxRemove = product.stock;

  const handleSubmit = () => {
    onSubmit(product.id, type, quantity, reason);
    setType('add');
    setQuantity(0);
    setReason('');
    onClose();
  };

  const isValid = quantity > 0 && (type === 'add' || quantity <= maxRemove) && reason.trim() !== '';

  const newStock = type === 'add' ? product.stock + quantity : product.stock - quantity;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Adjust Stock</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Product
          </Typography>
          <Typography variant="h6">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Current stock: {product.stock} units
          </Typography>
        </Box>

        <RadioGroup
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'add' | 'remove');
            setQuantity(0);
          }}
        >
          <FormControlLabel value="add" control={<Radio />} label="Add stock (incoming shipment)" />
          <FormControlLabel
            value="remove"
            control={<Radio />}
            label="Remove stock (damaged, lost, etc.)"
          />
        </RadioGroup>

        <TextField
          fullWidth
          label="Quantity"
          type="number"
          value={quantity || ''}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
          slotProps={{
            htmlInput: { min: 1, max: type === 'remove' ? maxRemove : undefined },
          }}
          sx={{ mt: 2 }}
          helperText={
            quantity > 0
              ? `New stock will be: ${newStock} units`
              : type === 'remove'
                ? `Max: ${maxRemove} units`
                : undefined
          }
        />

        <TextField
          fullWidth
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 2 }}
          placeholder="e.g. New shipment from supplier, Damaged items..."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          Confirm Adjustment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
