import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import type { Supplier, SupplierProduct } from 'src/_mock/_data';

// ======================================================================

const CATEGORIES = ['Peripherals', 'Accessories', 'Audio', 'Storage', 'Cables', 'Other'];

type SupplierFormData = {
  name: string;
  phone: string;
  address: string;
  email: string;
  status: 'active' | 'inactive';
  catalog: Omit<SupplierProduct, 'id'>[];
};

type Props = {
  open: boolean;
  supplier?: Supplier | null;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
};

const emptyProduct: Omit<SupplierProduct, 'id'> = {
  name: '',
  buyingPrice: 0,
  category: 'Peripherals',
};

export function SuppliersFormDialog({ open, supplier, onClose, onSubmit }: Props) {
  const isEdit = Boolean(supplier);

  const [name, setName] = useState(supplier?.name ?? '');
  const [phone, setPhone] = useState(supplier?.phone ?? '');
  const [address, setAddress] = useState(supplier?.address ?? '');
  const [email, setEmail] = useState(supplier?.email ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(supplier?.status ?? 'active');
  const [catalog, setCatalog] = useState<Omit<SupplierProduct, 'id'>[]>(
    supplier?.catalog.map(({ name: n, buyingPrice, category }) => ({ name: n, buyingPrice, category })) ?? [{ ...emptyProduct }]
  );

  const handleAddProduct = () => {
    setCatalog((prev) => [...prev, { ...emptyProduct }]);
  };

  const handleRemoveProduct = (index: number) => {
    setCatalog((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof Omit<SupplierProduct, 'id'>, value: string | number) => {
    setCatalog((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const isValid =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    email.trim() !== '' &&
    catalog.length > 0 &&
    catalog.every((p) => p.name.trim() !== '' && p.buyingPrice > 0);

  const handleSubmit = () => {
    onSubmit({ name, phone, address, email, status, catalog });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Basic Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Supplier Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>

          <TextField
            fullWidth
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <TextField
            select
            fullWidth
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Product Catalog */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">Product Catalog</Typography>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
            onClick={handleAddProduct}
          >
            Add Product
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {catalog.map((product, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.neutral',
              }}
            >
              <TextField
                size="small"
                label="Product Name"
                value={product.name}
                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                select
                size="small"
                label="Category"
                value={product.category}
                onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                sx={{ flex: 1, minWidth: 120 }}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Buying Price"
                type="number"
                value={product.buyingPrice || ''}
                onChange={(e) => handleProductChange(index, 'buyingPrice', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0 } }}
                sx={{ flex: 1, minWidth: 110 }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveProduct(index)}
                disabled={catalog.length <= 1}
              >
                <Iconify icon="solar:close-circle-bold" width={20} />
              </IconButton>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {isEdit ? 'Save Changes' : 'Add Supplier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
