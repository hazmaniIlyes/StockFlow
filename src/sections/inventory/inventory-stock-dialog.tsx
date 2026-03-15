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

import { useTranslation } from 'src/contexts';

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type Props = {
  open: boolean;
  product: InventoryProduct | null;
  onClose: () => void;
  onSubmit: (productId: string, type: 'add' | 'remove', quantity: number, reason: string) => void;
};

export function InventoryStockDialog({ open, product, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
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

  const isValid = quantity > 0 && (type === 'add' || quantity <= maxRemove);

  const newStock = type === 'add' ? product.stock + quantity : product.stock - quantity;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('inventory.adjustStock')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('common.product')}
          </Typography>
          <Typography variant="h6">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('inventory.currentStock')}: {product.stock} {product.unit ?? 'pcs'}
          </Typography>
        </Box>

        <RadioGroup
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'add' | 'remove');
            setQuantity(0);
          }}
        >
          <FormControlLabel value="add" control={<Radio />} label={t('inventory.addStockIncoming')} />
          <FormControlLabel
            value="remove"
            control={<Radio />}
            label={t('inventory.removeStockDamaged')}
          />
        </RadioGroup>

        <TextField
          fullWidth
          label={`${t('common.quantity')} (${product.unit ?? 'pcs'})`}
          type="number"
          value={quantity || ''}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
          slotProps={{
            htmlInput: { min: 0, step: product.unit === 'pcs' ? 1 : 0.001, max: type === 'remove' ? maxRemove : undefined },
          }}
          sx={{ mt: 2 }}
          helperText={
            quantity > 0
              ? product.unit && product.unit !== 'pcs'
                ? t('inventory.newStockWillBeUnit', { count: newStock, unit: product.unit })
                : t('inventory.newStockWillBe', { count: newStock })
              : type === 'remove'
                ? product.unit && product.unit !== 'pcs'
                  ? t('inventory.maxRemoveUnit', { count: maxRemove, unit: product.unit })
                  : t('inventory.maxUnits', { count: maxRemove })
                : undefined
          }
        />

        <TextField
          fullWidth
          label={t('inventory.reasonOptional')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 2 }}
          placeholder={t('inventory.reasonPlaceholder')}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {t('inventory.confirmAdjustment')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
