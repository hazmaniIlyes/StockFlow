import { useState, useMemo, useEffect } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useTheme, alpha } from '@mui/material/styles';

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

import { Iconify } from 'src/components/iconify';

import { useSettings, useSuppliers, useTranslation, useInventory } from 'src/contexts';

import type { InventoryProduct, ProductUnit } from 'src/_mock/_data';

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
  unit: ProductUnit;
  expiryDate?: string;
};

type Props = {
  open: boolean;
  product?: InventoryProduct | null;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
};

const CUSTOM_VALUE = '__custom__';
const NEW_SUPPLIER_VALUE = '__new_supplier__';

export function InventoryFormDialog({ open, product, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const currencySymbol = language === 'ar' ? 'د.ج' : 'DA';
  const isEdit = Boolean(product);
  const { productCategories, preferences } = useSettings();
  const { activeSuppliers, addSupplier, getSupplier, addProductToCatalog, recordPurchase, updateSupplier } = useSuppliers();
  const { getProductByName, updateProduct, addBatch, adjustStock } = useInventory();

  const [supplierId, setSupplierId] = useState(product?.supplierId ?? '');
  const [catalogProductName, setCatalogProductName] = useState(product?.name ?? '');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState(product?.category ?? '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'pcs');
  const [buyingPrice, setBuyingPrice] = useState(product?.buyingPrice ?? 0);
  const [sellPrice, setSellPrice] = useState(product?.sellPrice ?? 0);
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [minStock, setMinStock] = useState(product?.minStock ?? 10);
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate ?? '');
  const [amountOwed, setAmountOwed] = useState(0);
  const [debtDueDate, setDebtDueDate] = useState('');
  const [showPriceConflictDialog, setShowPriceConflictDialog] = useState(false);

  // Quick-add supplier state
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupNif, setNewSupNif] = useState('');
  const [newSupNis, setNewSupNis] = useState('');
  const [newSupRc, setNewSupRc] = useState('');
  const [newSupAi, setNewSupAi] = useState('');

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (product) {
        setSupplierId(product.supplierId);
        setCatalogProductName(product.name);
        setCustomName(product.name); // Set customName for editing
        setCategory(product.category);
        setUnit(product.unit ?? 'pcs');
        setBuyingPrice(product.buyingPrice);
        setSellPrice(product.sellPrice);
        setStock(product.stock);
        setMinStock(product.minStock);
        setExpiryDate(product.expiryDate ?? '');
        setIsCustom(true); // Editing always uses custom name mode
      } else {
        setSupplierId('');
        setCatalogProductName('');
        setCategory('');
        setUnit('pcs');
        setBuyingPrice(0);
        setSellPrice(0);
        setStock(0);
        setMinStock(preferences.lowStockThreshold);
        setExpiryDate('');
        setIsCustom(false);
        setCustomName('');
        setAmountOwed(0);
        setDebtDueDate('');
      }
      setShowNewSupplier(false);
      setNewSupName('');
      setNewSupPhone('');
      setNewSupAddress('');
    }
  }, [open, product]);

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
    setNewSupNif('');
    setNewSupNis('');
    setNewSupRc('');
    setNewSupAi('');
    setSupplierId(newSupplierId);
    setCatalogProductName('');
    setIsCustom(false);
    setCustomName('');
    setBuyingPrice(0);
  };

  const handleSaveNewSupplier = () => {
    if (!newSupName.trim()) return;
    
    const newSupplier = addSupplier({
      name: newSupName.trim(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim(),
      email: '',
      nif: newSupNif.trim() || undefined,
      nis: newSupNis.trim() || undefined,
      rc: newSupRc.trim() || undefined,
      ai: newSupAi.trim() || undefined,
      status: 'active',
      totalOwed: 0,
      totalPurchased: 0,
    });
    
    setSupplierId(newSupplier.id);
    setShowNewSupplier(false);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setNewSupNif('');
    setNewSupNis('');
    setNewSupRc('');
    setNewSupAi('');
    setIsCustom(true); // New suppliers have no catalog, so use custom product name
  };

  const handleProductChange = (productName: string) => {
    if (productName === '' || productName === CUSTOM_VALUE) {
      setCatalogProductName('');
      setIsCustom(true);
      setCustomName('');
      setBuyingPrice(0);
      setCategory('');
      return;
    }
    setCatalogProductName(productName);
    setIsCustom(false);
    const catalogItem = catalogProducts.find((p) => p.name === productName);
    if (catalogItem) {
      setCustomName(catalogItem.name);
      setBuyingPrice(catalogItem.buyingPrice);
      setCategory(catalogItem.category);
      if (catalogItem.unit) setUnit(catalogItem.unit);
      if (catalogItem.expiryDate) setExpiryDate(catalogItem.expiryDate);
      // Also fill sellPrice, minStock from existing inventory product if found
      const existingProduct = getProductByName(catalogItem.name);
      if (existingProduct) {
        setSellPrice(existingProduct.sellPrice);
        setMinStock(existingProduct.minStock);
      }
    }
  };

  const finalCategory = category || 'Other';

  const existingInventoryProduct = customName.trim()
    ? getProductByName(customName.trim())
    : undefined;

  const hasPriceConflict =
    !isEdit &&
    !!existingInventoryProduct &&
    (buyingPrice !== existingInventoryProduct.buyingPrice || sellPrice !== existingInventoryProduct.sellPrice);

  const margin =
    buyingPrice > 0 ? ((sellPrice - buyingPrice) / buyingPrice) * 100 : 0;

  // Validation
  const isValid =
    customName.trim() !== '' &&
    buyingPrice > 0 &&
    sellPrice > 0 &&
    minStock >= 0;

  const handleSubmit = () => {
    if (hasPriceConflict) {
      setShowPriceConflictDialog(true);
      return;
    }
    doSubmit();
  };

  const resetForm = () => {
    setSupplierId('');
    setCatalogProductName('');
    setCategory('');
    setUnit('pcs');
    setBuyingPrice(0);
    setSellPrice(0);
    setStock(0);
    setMinStock(preferences.lowStockThreshold);
    setExpiryDate('');
    setIsCustom(false);
    setCustomName('');
    setAmountOwed(0);
    setDebtDueDate('');
    setShowNewSupplier(false);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
  };

  const doSubmit = (keepOpen = false) => {
    // If a supplier is selected and this product is not from their existing catalog, add it
    const productExistsInCatalog = catalogProducts.some((p) => p.name === customName.trim());
    if (supplierId && !productExistsInCatalog && !isEdit) {
      addProductToCatalog(supplierId, {
        name: customName.trim(),
        category: finalCategory,
        buyingPrice,
        purchaseDate: new Date().toISOString().split('T')[0],
        unit,
      });
    }

    // Record purchase if adding new product with stock and a supplier
    if (supplierId && !isEdit && stock > 0) {
      const totalCost = buyingPrice * stock;
      const amountPaid = Math.max(0, totalCost - amountOwed);
      recordPurchase(
        supplierId,
        [{
          productName: customName.trim(),
          quantity: stock,
          unitPrice: buyingPrice,
        }],
        amountPaid
      );
      // Store the debt due date on the supplier if provided
      if (amountOwed > 0 && debtDueDate) {
        updateSupplier(supplierId, { debtDueDate });
      }
    }

    onSubmit({
      name: customName.trim(),
      sku: '', // SKU will be auto-generated in context
      category: finalCategory,
      supplierId: supplierId || '',
      supplierName: selectedSupplier?.name ?? '',
      buyingPrice,
      sellPrice,
      stock,
      minStock,
      unit,
      expiryDate: expiryDate || undefined,
    });
    if (keepOpen) {
      resetForm();
    } else {
      onClose();
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? t('inventory.editProduct') : t('inventory.addProductToInventory')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Supplier Selector */}
          {!showNewSupplier ? (
            <TextField
              select
              fullWidth
              label={t('inventory.supplierOptional')}
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              disabled={isEdit}
              helperText={activeSuppliers.length === 0 ? t('inventory.addSupplierOrLeaveEmpty') : undefined}
            >
              <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('inventory.noSupplierManual')}
              </MenuItem>
              <MenuItem value={NEW_SUPPLIER_VALUE} sx={{ color: 'primary.main', fontWeight: 600 }}>
                {t('inventory.newSupplier')}
              </MenuItem>
              {activeSuppliers.length > 0 && <Divider />}
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
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                border: '1px dashed',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                {t('inventory.quickAddSupplier')}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('inventory.supplierNameRequired')}
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('common.phone')}
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('common.address')}
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider>
                    <Typography variant="caption" color="text.secondary">{t('suppliers.taxInfoOptional')}</Typography>
                  </Divider>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="NIF"
                    placeholder="Numéro d'Identification Fiscale"
                    value={newSupNif}
                    onChange={(e) => setNewSupNif(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="NIS"
                    placeholder="Numéro d'Identification Statistique"
                    value={newSupNis}
                    onChange={(e) => setNewSupNis(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="RC"
                    placeholder="Registre de Commerce"
                    value={newSupRc}
                    onChange={(e) => setNewSupRc(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="AI"
                    placeholder="Article d'Imposition"
                    value={newSupAi}
                    onChange={(e) => setNewSupAi(e.target.value)}
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
                    setNewSupNif('');
                    setNewSupNis('');
                    setNewSupRc('');
                    setNewSupAi('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!newSupName.trim()}
                  onClick={handleSaveNewSupplier}
                >
                  {t('inventory.saveAndSelect')}
                </Button>
              </Box>
            </Box>
          )}

          {/* Catalog Product Selector - only show if supplier has catalog items */}
          {selectedSupplier && catalogProducts.length > 0 && !isEdit && (
            <TextField
              select
              fullWidth
              label={t('inventory.selectFromCatalog')}
              value={catalogProductName}
              onChange={(e) => handleProductChange(e.target.value)}
              helperText={t('inventory.catalogHelperText')}
            >
              <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('inventory.customProductManual')}
              </MenuItem>
              <Divider />
              {catalogProducts.map((cp) => (
                <MenuItem key={cp.id || cp.name} value={cp.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{cp.name}</span>
                    <Typography variant="caption" color="text.secondary" sx={{ marginInlineStart: 2 }}>
                      {cp.category} • {fCurrency(cp.buyingPrice)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Product Name */}
          <TextField
            fullWidth
            label={t('inventory.productName')}
            placeholder={t('inventory.productNamePlaceholder')}
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              setIsCustom(true);
            }}
          />

          {/* Category */}
          <TextField
            select
            fullWidth
            label={t('inventory.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {productCategories.length === 0 ? (
              <MenuItem disabled value="">
                <em>{t('settings.noCategoriesDropdown')}</em>
              </MenuItem>
            ) : (
              productCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.label}>
                  {cat.label}
                </MenuItem>
              ))
            )}
          </TextField>

          {/* SKU auto-generated - no field needed */}

          {/* Unit */}
          <TextField
            select
            fullWidth
            label={t('inventory.unit')}
            value={unit}
            onChange={(e) => setUnit(e.target.value as ProductUnit)}
          >
            {([
              { value: 'pcs', label: t('units.pcs') },
              { value: 'g', label: t('units.g') },
              { value: 'kg', label: t('units.kg') },
              { value: 'mg', label: t('units.mg') },
              { value: 'ton', label: t('units.ton') },
              { value: 'quintar', label: t('units.quintar') },
              { value: 'l', label: t('units.l') },
              { value: 'ml', label: t('units.ml') },
              { value: 'm', label: t('units.m') },
              { value: 'cm', label: t('units.cm') },
              { value: 'mm', label: t('units.mm') },
            ] as { value: ProductUnit; label: string }[])
              .filter((opt) =>
                (preferences.enabledUnits ?? []).includes(opt.value) || opt.value === unit
              )
              .map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Buying Price (auto-filled, editable) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label={unit !== 'pcs' ? `${t('inventory.buyingPrice')} (DA/${unit})` : t('inventory.buyingPrice')}
              type="number"
              value={buyingPrice || ''}
              onChange={(e) => setBuyingPrice(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              fullWidth
              label={unit !== 'pcs' ? `${t('inventory.sellPrice')} (DA/${unit})` : t('inventory.sellPrice')}
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
                bgcolor: alpha(margin > 0 ? theme.palette.success.main : theme.palette.error.main, 0.12),
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle2" color={margin > 0 ? 'success.dark' : 'error.dark'}>
                {t('inventory.margin')}: {margin.toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color={margin > 0 ? 'success.dark' : 'error.dark'}>
                {t('inventory.profitPerUnit')}: {fCurrency(sellPrice - buyingPrice).replace('DA', currencySymbol)} / {t(`units.${unit}`).split('(')[0].trim()}
              </Typography>
            </Box>
          )}

          {/* Stock */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label={unit !== 'pcs' ? `${t('inventory.initialStock')} (${unit})` : t('inventory.initialStock')}
              type="number"
              value={stock}
              onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0, step: unit === 'pcs' ? 1 : 0.001 } }}
            />
            <TextField
              fullWidth
              label={unit !== 'pcs' ? `${t('inventory.minStockAlert')} (${unit})` : t('inventory.minStockAlert')}
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0, step: unit === 'pcs' ? 1 : 0.001 } }}
            />
          </Box>
          {/* Expiry Date */}
          <DatePicker
            label={t('inventory.expiryDateOptional')}
            value={expiryDate ? dayjs(expiryDate) : null}
            onChange={(val) => setExpiryDate(val ? val.format('YYYY-MM-DD') : '')}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: t('inventory.expiryDateHelper'),
              },
            }}
          />

          {existingInventoryProduct && !isEdit && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -1 }}>
              <Iconify
                icon={existingInventoryProduct.stock <= 0 ? 'solar:danger-triangle-bold-duotone' : 'solar:box-bold-duotone'}
                width={15}
                sx={{ color: existingInventoryProduct.stock <= 0 ? 'error.main' : existingInventoryProduct.stock <= existingInventoryProduct.minStock ? 'warning.main' : 'success.main' }}
              />
              <Typography
                variant="caption"
                sx={{ color: existingInventoryProduct.stock <= 0 ? 'error.main' : existingInventoryProduct.stock <= existingInventoryProduct.minStock ? 'warning.main' : 'text.secondary' }}
              >
                {existingInventoryProduct.stock <= 0
                  ? `Already in inventory — currently out of stock`
                  : `Already in inventory — ${existingInventoryProduct.stock} ${existingInventoryProduct.unit} currently in stock`}
              </Typography>
            </Box>
          )}

          {/* Amount Owed - show only for new products with supplier */}
          {!isEdit && supplierId && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label={t('suppliers.amountOwed')}
                  type="number"
                  value={amountOwed || ''}
                  onChange={(e) => setAmountOwed(Math.max(0, Number(e.target.value)))}
                  slotProps={{ htmlInput: { min: 0 } }}
                  helperText={t('suppliers.amountOwedHelper')}
                />
                {amountOwed > 0 && (
                  <DatePicker
                    label={t('suppliers.debtDueDate')}
                    value={debtDueDate ? dayjs(debtDueDate) : null}
                    onChange={(val) => setDebtDueDate(val ? val.format('YYYY-MM-DD') : '')}
                    slotProps={{
                      textField: { fullWidth: true, helperText: t('suppliers.debtDueDateHelper') },
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {isEdit ? t('inventory.saveChanges') : t('inventory.addProduct')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* ── Price Conflict Dialog ── */}
    <Dialog
      open={showPriceConflictDialog}
      onClose={() => setShowPriceConflictDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Iconify icon="solar:danger-triangle-bold-duotone" width={26} sx={{ color: 'warning.main', flexShrink: 0 }} />
        {t('inventory.priceConflictTitle')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('inventory.priceConflictDesc')}
        </Typography>

        {/* Old vs New price comparison */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center' }}>
          <Box
            sx={{
              flex: 1, p: 2, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              border: '1px solid', borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('inventory.priceConflictOldPrices')}
            </Typography>
            <Typography variant="subtitle2">
              {t('inventory.buyingPrice')}: {fCurrency(existingInventoryProduct?.buyingPrice ?? 0)}
            </Typography>
            <Typography variant="subtitle2">
              {t('inventory.sellPrice')}: {fCurrency(existingInventoryProduct?.sellPrice ?? 0)}
            </Typography>
          </Box>

          <Iconify icon={language === 'ar' ? 'solar:arrow-left-bold' : 'solar:arrow-right-bold'} width={20} sx={{ color: 'text.disabled', flexShrink: 0 }} />

          <Box
            sx={{
              flex: 1, p: 2, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: '1px solid', borderColor: 'primary.light',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('inventory.priceConflictNewPrices')}
            </Typography>
            <Typography variant="subtitle2" color="primary.dark">
              {t('inventory.buyingPrice')}: {fCurrency(buyingPrice)}
            </Typography>
            <Typography variant="subtitle2" color="primary.dark">
              {t('inventory.sellPrice')}: {fCurrency(sellPrice)}
            </Typography>
          </Box>
        </Box>

        {/* Option 1 — Update price */}
        <Box
          onClick={() => {
            if (existingInventoryProduct) {
              // Merge all existing batch quantities + new stock into a single total,
              // then clear batches so the FIFO card disappears from the detail page.
              const existingBatchTotal = existingInventoryProduct.batches
                ? existingInventoryProduct.batches.reduce((sum, b) => sum + b.quantity, 0)
                : existingInventoryProduct.stock;
              const mergedTotal = existingBatchTotal + stock;

              updateProduct(existingInventoryProduct.id, {
                buyingPrice,
                sellPrice,
                stock: mergedTotal,
                batches: undefined,
              });

              // Record purchase with supplier if applicable
              if (supplierId && stock > 0) {
                const totalCost = buyingPrice * stock;
                const amountPaid = Math.max(0, totalCost - amountOwed);
                recordPurchase(
                  supplierId,
                  [{ productName: customName.trim(), quantity: stock, unitPrice: buyingPrice }],
                  amountPaid
                );
                if (amountOwed > 0 && debtDueDate) updateSupplier(supplierId, { debtDueDate });
              }
            }
            setShowPriceConflictDialog(false);
            onClose();
          }}
          sx={{
            p: 2, mb: 1.5, borderRadius: 2, cursor: 'pointer',
            border: '1.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
            transition: 'all 0.15s',
            '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) },
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:refresh-bold-duotone" width={22} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('inventory.priceConflictUpdateAll')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('inventory.priceConflictUpdateAllDesc')}
            </Typography>
          </Box>
        </Box>

        {/* Option 2 — FIFO */}
        <Box
          onClick={() => {
            if (existingInventoryProduct) {
              // Add new batch to the existing product (no price change to old stock)
              addBatch(existingInventoryProduct.id, {
                buyingPrice,
                sellPrice,
                quantity: stock,
                purchaseDate: new Date().toISOString().split('T')[0],
              });
              // Record the purchase with the supplier if one is selected
              if (supplierId && stock > 0) {
                const totalCost = buyingPrice * stock;
                const amountPaid = Math.max(0, totalCost - amountOwed);
                recordPurchase(
                  supplierId,
                  [{ productName: customName.trim(), quantity: stock, unitPrice: buyingPrice }],
                  amountPaid
                );
                if (amountOwed > 0 && debtDueDate) {
                  updateSupplier(supplierId, { debtDueDate });
                }
              }
            }
            setShowPriceConflictDialog(false);
            onClose();
          }}
          sx={{
            p: 2, borderRadius: 2, cursor: 'pointer',
            border: '1.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
            transition: 'all 0.15s',
            '&:hover': { borderColor: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05) },
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: 'info.main',
            }}
          >
            <Iconify icon="solar:layers-minimalistic-bold-duotone" width={22} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('inventory.priceConflictFifo')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('inventory.priceConflictFifoDesc')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={() => setShowPriceConflictDialog(false)}>
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
