import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { _suppliers } from 'src/_mock';

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type ProductFormData = {
  name: string;
  sku: string;
  category: string;
  supplierId: string;
  supplierName: string;
  buyingPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
};

type Props = {
  open: boolean;
  product?: InventoryProduct | null;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
};

const CUSTOM_VALUE = '__custom__';
const NEW_SUPPLIER_VALUE = '__new_supplier__';
const CATEGORIES = ['Peripherals', 'Accessories', 'Audio', 'Storage', 'Cables', 'Other'];

export function InventoryFormDialog({ open, product, onClose, onSubmit }: Props) {
  const isEdit = Boolean(product);

  const [supplierId, setSupplierId] = useState(product?.supplierId ?? '');
  const [catalogProductName, setCatalogProductName] = useState(product?.name ?? '');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState(product?.category ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [buyingPrice, setBuyingPrice] = useState(product?.buyingPrice ?? 0);
  const [sellPrice, setSellPrice] = useState(product?.sellPrice ?? 0);
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [minStock, setMinStock] = useState(product?.minStock ?? 10);

  // Quick-add supplier state
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  const activeSuppliers = useMemo(() => _suppliers.filter((s) => s.status === 'active'), []);

  const selectedSupplier = useMemo(
    () => activeSuppliers.find((s) => s.id === supplierId),
    [activeSuppliers, supplierId]
  );

  const catalogProducts = selectedSupplier?.catalog ?? [];

  const selectedCatalogProduct = useMemo(
    () => catalogProducts.find((p) => p.name === catalogProductName),
    [catalogProducts, catalogProductName]
  );

  const handleSupplierChange = (newSupplierId: string) => {
    if (newSupplierId === NEW_SUPPLIER_VALUE) {
      setShowNewSupplier(true);
      setSupplierId('');
      setCatalogProductName('');
      setIsCustom(false);
      return;
    }
    setShowNewSupplier(false);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setSupplierId(newSupplierId);
    setCatalogProductName('');
    setIsCustom(false);
    setCustomName('');
    setBuyingPrice(0);
  };

  const handleSaveNewSupplier = () => {
    // In a real app this would POST to the API and return the new supplier ID.
    // For the UI demo we just close the inline form — the backend will handle persistence.
    setShowNewSupplier(false);
  };

  const handleProductChange = (productName: string) => {
    if (productName === CUSTOM_VALUE) {
      setCatalogProductName(CUSTOM_VALUE);
      setIsCustom(true);
      setCustomName('');
      setBuyingPrice(0);
      return;
    }
    setCatalogProductName(productName);
    setIsCustom(false);
    setCustomName('');
    const catalogItem = catalogProducts.find((p) => p.name === productName);
    if (catalogItem) {
      setBuyingPrice(catalogItem.buyingPrice);
      setCategory(catalogItem.category);
    }
  };

  const finalName = isCustom ? customName : catalogProductName;
  const finalCategory = category || 'Other';

  const margin =
    buyingPrice > 0 ? ((sellPrice - buyingPrice) / buyingPrice) * 100 : 0;

  const isValid =
    supplierId !== '' &&
    finalName.trim() !== '' &&
    sku.trim() !== '' &&
    buyingPrice > 0 &&
    sellPrice > 0 &&
    minStock >= 0;

  const handleSubmit = () => {
    onSubmit({
      name: finalName,
      sku,
      category: finalCategory,
      supplierId,
      supplierName: selectedSupplier?.name ?? '',
      buyingPrice,
      sellPrice,
      stock,
      minStock,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product to Inventory'}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Supplier Selector */}
          {!showNewSupplier ? (
            <TextField
              select
              fullWidth
              label="Supplier"
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              disabled={isEdit}
            >
              <MenuItem value={NEW_SUPPLIER_VALUE} sx={{ color: 'primary.main', fontWeight: 600 }}>
                + New Supplier
              </MenuItem>
              <Divider />
              {activeSuppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'primary.lighter',
                border: '1px dashed',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                Quick Add Supplier
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Supplier Name *"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Address"
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setShowNewSupplier(false);
                    setNewSupName('');
                    setNewSupPhone('');
                    setNewSupAddress('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!newSupName.trim()}
                  onClick={handleSaveNewSupplier}
                >
                  Save &amp; Select
                </Button>
              </Box>
            </Box>
          )}

          {/* Product Selector (filtered by supplier) */}
          <TextField
            select
            fullWidth
            label="Product from Catalog"
            value={catalogProductName}
            onChange={(e) => handleProductChange(e.target.value)}
            disabled={!supplierId || isEdit}
            helperText={!supplierId ? 'Select a supplier first' : undefined}
          >
            {catalogProducts.map((p) => (
              <MenuItem key={p.id} value={p.name}>
                {p.name} — {fCurrency(p.buyingPrice)}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem value={CUSTOM_VALUE} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              + Custom product name
            </MenuItem>
          </TextField>

          {/* Custom product name */}
          {isCustom && (
            <TextField
              fullWidth
              label="Product Name"
              placeholder="Type a product name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}

          {/* Category — always visible once a product is chosen */}
          {(catalogProductName || isCustom) && (
            <TextField
              select
              fullWidth
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              helperText={!isCustom ? 'Auto-filled from catalog — you can change it' : undefined}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* SKU */}
          <TextField
            fullWidth
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. PRD-015"
          />

          {/* Buying Price (auto-filled, editable) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Buying Price"
              type="number"
              value={buyingPrice || ''}
              onChange={(e) => setBuyingPrice(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              fullWidth
              label="Sell Price"
              type="number"
              value={sellPrice || ''}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>

          {/* Margin Display */}
          {sellPrice > 0 && buyingPrice > 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: margin > 0 ? 'success.lighter' : 'error.lighter',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle2" color={margin > 0 ? 'success.dark' : 'error.dark'}>
                Margin: {margin.toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color={margin > 0 ? 'success.dark' : 'error.dark'}>
                Profit per unit: {fCurrency(sellPrice - buyingPrice)}
              </Typography>
            </Box>
          )}

          {/* Stock */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Initial Stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              fullWidth
              label="Min Stock (Alert Threshold)"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {isEdit ? 'Save Changes' : 'Add Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
