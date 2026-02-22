import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import type { Invoice, InvoiceProduct } from 'src/_mock/_data';

// ======================================================================

type ProductRow = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'>) => void;
  editInvoice?: Invoice | null;
};

const emptyProduct = (): ProductRow => ({
  id: `new-${Date.now()}-${Math.random()}`,
  name: '',
  quantity: 1,
  unitPrice: 0,
});

export function SalesNewInvoiceDialog({ open, onClose, onSave, editInvoice }: Props) {
  const isEdit = !!editInvoice;

  const [clientName, setClientName] = useState(editInvoice?.client.name ?? '');
  const [clientPhone, setClientPhone] = useState(editInvoice?.client.phone ?? '');
  const [clientAddress, setClientAddress] = useState(editInvoice?.client.address ?? '');
  const [tvaRate, setTvaRate] = useState(editInvoice?.tvaRate ?? 19);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partly-paid' | 'unpaid'>(
    editInvoice?.status ?? 'unpaid'
  );
  const [amountPaid, setAmountPaid] = useState(editInvoice?.amountPaid ?? 0);
  const [products, setProducts] = useState<ProductRow[]>(
    editInvoice?.products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    })) ?? [emptyProduct()]
  );

  const handleProductChange = (id: string, field: keyof ProductRow, value: string | number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddProduct = () => {
    setProducts((prev) => [...prev, emptyProduct()]);
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const subtotal = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const tvaAmount = subtotal * (tvaRate / 100);
  const total = subtotal + tvaAmount;

  const handleSave = () => {
    const invoiceProducts: InvoiceProduct[] = products
      .filter((p) => p.name.trim())
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: p.quantity * p.unitPrice,
      }));

    const finalAmountPaid = paymentStatus === 'paid' ? total : paymentStatus === 'unpaid' ? 0 : amountPaid;

    onSave({
      invoiceNumber: editInvoice?.invoiceNumber ?? `INV-${Date.now().toString().slice(-4)}`,
      client: { name: clientName, phone: clientPhone, address: clientAddress },
      products: invoiceProducts,
      subtotal,
      tvaRate,
      tvaAmount,
      total,
      amountPaid: finalAmountPaid,
      amountDue: total - finalAmountPaid,
      status: paymentStatus,
      createdAt: editInvoice?.createdAt ?? new Date().toLocaleDateString('en-US'),
      dueDate: editInvoice?.dueDate ?? (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-US');
      })(),
    });

    onClose();
  };

  const isValid = clientName.trim() && products.some((p) => p.name.trim() && p.quantity > 0 && p.unitPrice > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {/* Client Info */}
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Client Information
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Phone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Address"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Products */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">Products</Typography>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
            onClick={handleAddProduct}
          >
            Add Product
          </Button>
        </Box>

        {products.map((product, index) => (
          <Grid container spacing={2} key={product.id} sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                label={`Product ${index + 1}`}
                value={product.name}
                onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Qty"
                type="number"
                value={product.quantity}
                onChange={(e) =>
                  handleProductChange(product.id, 'quantity', Math.max(1, Number(e.target.value)))
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Unit Price"
                type="number"
                value={product.unitPrice || ''}
                onChange={(e) =>
                  handleProductChange(product.id, 'unitPrice', Math.max(0, Number(e.target.value)))
                }
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ typography: 'subtitle2', flexGrow: 1 }}>
                {fCurrency(product.quantity * product.unitPrice)}
              </Box>
              {products.length > 1 && (
                <IconButton size="small" onClick={() => handleRemoveProduct(product.id)} color="error">
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Totals */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="TVA Rate (%)"
              type="number"
              value={tvaRate}
              onChange={(e) => setTvaRate(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              helperText="Default: 19%"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2">{fCurrency(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  TVA ({tvaRate}%)
                </Typography>
                <Typography variant="body2">{fCurrency(tvaAmount)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Total</Typography>
                <Typography variant="subtitle1">{fCurrency(total)}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Payment Status */}
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Payment Status
        </Typography>
        <RadioGroup
          row
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as Invoice['status'])}
        >
          <FormControlLabel value="paid" control={<Radio />} label="Fully Paid" />
          <FormControlLabel value="partly-paid" control={<Radio />} label="Partly Paid" />
          <FormControlLabel value="unpaid" control={<Radio />} label="Not Paid" />
        </RadioGroup>

        {paymentStatus === 'partly-paid' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Amount Paid"
              type="number"
              size="small"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Math.max(0, Math.min(total, Number(e.target.value))))}
              slotProps={{ htmlInput: { min: 0, max: total } }}
              sx={{ width: 200 }}
            />
            <Typography variant="body2" color="text.secondary">
              Remaining: <strong>{fCurrency(total - amountPaid)}</strong>
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid}>
          {isEdit ? 'Update Invoice' : 'Save Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
