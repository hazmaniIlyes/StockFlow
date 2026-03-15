import { useState, useEffect, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { useInventory, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

type PurchaseItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  isNew: boolean;
  category: string;
  unit: string;
};

type Props = {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (
    supplierId: string,
    items: { productName: string; quantity: number; unitPrice: number }[],
    amountPaid: number
  ) => void;
};

const CATEGORIES = ['Peripherals', 'Accessories', 'Audio', 'Storage', 'Cables', 'Electronics', 'Other'];

export function SuppliersPurchaseDialog({ open, supplier, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { products } = useInventory();
  const [items, setItems] = useState<PurchaseItem[]>([
    { productName: '', quantity: 1, unitPrice: 0, isNew: false, category: 'Other', unit: 'pcs' },
  ]);
  const [amountPaid, setAmountPaid] = useState(0);

  // Get products from this supplier's inventory
  const supplierProducts = useMemo(() => {
    if (!supplier) return [];
    return products.filter((p) => p.supplierId === supplier.id);
  }, [products, supplier]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setItems([{ productName: '', quantity: 1, unitPrice: 0, isNew: false, category: 'Other', unit: 'pcs' }]);
      setAmountPaid(0);
    }
  }, [open]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productName: '', quantity: 1, unitPrice: 0, isNew: false, category: 'Other', unit: 'pcs' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number | boolean
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productName' && typeof value === 'string') {
          // Check if it's an existing product
          const existing = supplierProducts.find((p) => p.name === value);
          if (existing) {
            return {
              ...item,
              productName: value,
              unitPrice: existing.buyingPrice,
              isNew: false,
              category: existing.category,
              unit: existing.unit ?? 'pcs',
            };
          }
          return { ...item, productName: value, isNew: true };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const remaining = Math.max(0, total - amountPaid);

  const handleSubmit = () => {
    if (!supplier) return;
    const validItems = items
      .filter((item) => item.productName.trim() && item.quantity > 0 && item.unitPrice > 0)
      .map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
    if (validItems.length > 0) {
      onSubmit(supplier.id, validItems, amountPaid);
    }
    onClose();
  };

  const isValid = items.some(
    (item) => item.productName.trim() && item.quantity > 0 && item.unitPrice > 0
  );

  if (!supplier) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('suppliers.recordPurchaseFrom', { name: supplier.name })}</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('suppliers.purchaseDescription')}
        </Typography>

        {/* Items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {items.map((item, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <TextField
                size="small"
                label={t('suppliers.product')}
                value={item.productName}
                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                select={supplierProducts.length > 0}
                sx={{ flex: 2, minWidth: 200 }}
                helperText={item.isNew ? t('suppliers.newProduct') : ''}
              >
                {supplierProducts.map((p) => (
                  <MenuItem key={p.id} value={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem value="" disabled>
                  {t('suppliers.typeToAddNew')}
                </MenuItem>
              </TextField>

              {item.isNew && (
                <TextField
                  select
                  size="small"
                  label={t('common.category')}
                  value={item.category}
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                size="small"
                label={`${t('suppliers.qty')}${item.unit !== 'pcs' ? ` (${item.unit})` : ''}`}
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', item.unit === 'pcs' ? (parseInt(e.target.value, 10) || 0) : (parseFloat(e.target.value) || 0))}
                slotProps={{ htmlInput: { min: item.unit === 'pcs' ? 1 : 0.001, step: item.unit === 'pcs' ? 1 : 0.001 } }}
                sx={{ width: 100 }}
              />

              <TextField
                size="small"
                label={t('suppliers.unitPrice')}
                type="number"
                value={item.unitPrice || ''}
                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                slotProps={{
                  htmlInput: { min: 0 },
                  input: { endAdornment: <InputAdornment position="end">DA</InputAdornment> },
                }}
                sx={{ width: 140 }}
              />

              <Typography
                variant="body2"
                sx={{
                  minWidth: 100,
                  textAlign: 'end',
                  alignSelf: 'center',
                  fontWeight: 600,
                }}
              >
                {fCurrency(item.quantity * item.unitPrice)}
              </Typography>

              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveItem(index)}
                disabled={items.length <= 1}
              >
                <Iconify icon="solar:close-circle-bold" width={20} />
              </IconButton>
            </Box>
          ))}

          <Button
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
            onClick={handleAddItem}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('suppliers.addItem')}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Payment Section */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label={t('suppliers.amountPaidNow')}
            type="number"
            value={amountPaid || ''}
            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
            slotProps={{
              htmlInput: { min: 0, max: total },
              input: { endAdornment: <InputAdornment position="end">DA</InputAdornment> },
            }}
            helperText={t('suppliers.leaveZeroIfLater')}
            sx={{ width: 200 }}
          />

          <Box sx={{ flex: 1, textAlign: 'end' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.total')}:
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {fCurrency(total)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('suppliers.remaining')}:
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={remaining > 0 ? 'error.main' : 'success.main'}
              >
                {fCurrency(remaining)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {t('suppliers.recordPurchase')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
