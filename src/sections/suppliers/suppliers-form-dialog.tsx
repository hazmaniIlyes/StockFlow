import type { Supplier, ProductUnit, SupplierProduct } from 'src/_mock/_data';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { ALL_UNITS, useSettings, useGlobalScan, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type CatalogFormItem = Omit<SupplierProduct, 'id'> & {
  sellPrice: number;
  stock: number;
  unit: ProductUnit;
};

type SupplierFormData = {
  name: string;
  phone: string;
  address: string;
  email: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  status: 'active' | 'inactive';
  catalog: CatalogFormItem[];
  initialDebt: number;
  debtDueDate?: string;
};

type Props = {
  open: boolean;
  supplier?: Supplier | null;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
};

const emptyProduct: CatalogFormItem = {
  name: '',
  buyingPrice: 0,
  category: 'Peripherals',
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  sellPrice: 0,
  stock: 0,
  unit: 'pcs',
};

export function SuppliersFormDialog({ open, supplier, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { setFormOpen } = useGlobalScan();

  useEffect(() => {
    setFormOpen(open);
    return () => setFormOpen(false);
  }, [open, setFormOpen]);
  const { preferences, productCategories } = useSettings();
  const enabledUnits = preferences.enabledUnits ?? ALL_UNITS;
  const isEdit = Boolean(supplier);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [rc, setRc] = useState('');
  const [ai, setAi] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [catalog, setCatalog] = useState<CatalogFormItem[]>([{ ...emptyProduct }]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [initialDebt, setInitialDebt] = useState(0);
  const [debtDueDate, setDebtDueDate] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (supplier) {
        setName(supplier.name);
        setPhone(supplier.phone);
        setAddress(supplier.address);
        setEmail(supplier.email);
        setNif(supplier.nif || '');
        setNis(supplier.nis || '');
        setRc(supplier.rc || '');
        setAi(supplier.ai || '');
        setStatus(supplier.status);
        const hasCatalog = supplier.catalog.length > 0;
        setCatalog(
          hasCatalog
            ? supplier.catalog.map(({ name: n, buyingPrice, category, purchaseDate, unit }) => ({ 
                name: n, 
                buyingPrice, 
                category, 
                purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
                sellPrice: 0,
                stock: 0,
                unit: unit ?? 'pcs',
              }))
            : [{ ...emptyProduct }]
        );
        setShowCatalog(hasCatalog);
      } else {
        setName('');
        setPhone('');
        setAddress('');
        setEmail('');
        setNif('');
        setNis('');
        setRc('');
        setAi('');
        setStatus('active');
        setCatalog([{ ...emptyProduct }]);
        setShowCatalog(false);
        setInitialDebt(0);
        setDebtDueDate('');
      }
    }
  }, [open, supplier]);

  const handleAddProduct = () => {
    setCatalog((prev) => [...prev, { ...emptyProduct }]);
  };

  const handleRemoveProduct = (index: number) => {
    setCatalog((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof CatalogFormItem, value: string | number) => {
    setCatalog((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Validation: name and phone required, catalog optional
  const isValid = name.trim() !== '' && phone.trim() !== '';

  const handleSubmit = () => {
    // Filter out empty catalog entries
    const validCatalog = catalog.filter((p) => p.name.trim() !== '' && p.buyingPrice > 0);
    onSubmit({ 
      name, 
      phone, 
      address, 
      email, 
      nif: nif.trim() || undefined,
      nis: nis.trim() || undefined,
      rc: rc.trim() || undefined,
      ai: ai.trim() || undefined,
      status, 
      catalog: validCatalog, 
      initialDebt,
      debtDueDate: initialDebt > 0 ? debtDueDate : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Basic Info */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <TextField
            sx={{ gridColumn: '1 / -1' }}
            label={t('suppliers.supplierName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label={t('common.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label={t('common.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label={t('common.address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <TextField
            select
            label={t('common.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          >
            <MenuItem value="active">{t('common.active')}</MenuItem>
            <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
          </TextField>

          <Divider sx={{ my: 1, gridColumn: '1 / -1' }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
            {t('suppliers.taxInfoOptional')}
          </Typography>

          <TextField
            label="NIF"
            value={nif}
            onChange={(e) => setNif(e.target.value)}
            placeholder="Numéro d'Identification Fiscale"
          />
          <TextField
            label="NIS"
            value={nis}
            onChange={(e) => setNis(e.target.value)}
            placeholder="Numéro d'Identification Statistique"
          />
          <TextField
            label="RC"
            value={rc}
            onChange={(e) => setRc(e.target.value)}
            placeholder="Registre de Commerce"
          />
          <TextField
            label="AI"
            value={ai}
            onChange={(e) => setAi(e.target.value)}
            placeholder="Article d'Imposition"
          />
        </Box>

        {/* Product Catalog - collapsible, optional */}
        {status === 'active' && (
          <>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showCatalog ? 2 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">{t('suppliers.productCatalog')}</Typography>
                <Typography variant="caption" color="text.secondary">({t('common.optional')})</Typography>
              </Box>
              <Button
                size="small"
                variant={showCatalog ? 'outlined' : 'contained'}
                color={showCatalog ? 'inherit' : 'primary'}
                startIcon={<Iconify icon={showCatalog ? 'solar:minus-circle-bold-duotone' : 'solar:add-circle-bold-duotone'} width={18} />}
                onClick={() => {
                  if (!showCatalog && catalog.length === 0) setCatalog([{ ...emptyProduct }]);
                  setShowCatalog((v) => !v);
                }}
              >
                {showCatalog ? t('suppliers.hideCatalog') : t('suppliers.addProducts')}
              </Button>
            </Box>

            <Collapse in={showCatalog}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {catalog.map((product, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                  }}
                >
                  {/* Row 1: Product name + Category + Remove */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <TextField
                      size="small"
                      label={t('suppliers.productName')}
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                    />
                    <TextField
                      select
                      size="small"
                      label={t('common.category')}
                      value={product.category}
                      onChange={(e) => handleProductChange(index, 'category', e.target.value)}
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
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveProduct(index)}
                      disabled={catalog.length <= 1}
                    >
                      <Iconify icon="solar:close-circle-bold" width={20} />
                    </IconButton>
                  </Box>
                  {/* Row 2: Unit | Buying price | Sell price | Quantity */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      select
                      size="small"
                      label={t('inventory.unit')}
                      value={product.unit ?? 'pcs'}
                      onChange={(e) => handleProductChange(index, 'unit', e.target.value)}
                    >
                      {(enabledUnits.length > 0 ? enabledUnits : ALL_UNITS)
                        .filter((u, _, arr) => arr.includes(u) || u === (product.unit ?? 'pcs'))
                        .concat(
                          product.unit && !enabledUnits.includes(product.unit as ProductUnit)
                            ? [product.unit as ProductUnit]
                            : []
                        )
                        .map((u) => (
                          <MenuItem key={u} value={u}>{t(`units.${u}`).split('(')[0].trim()}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      size="small"
                      label={product.unit !== 'pcs' ? `${t('inventory.buyingPrice')} (DA/${product.unit})` : t('inventory.buyingPrice')}
                      type="number"
                      value={product.buyingPrice || ''}
                      onChange={(e) => handleProductChange(index, 'buyingPrice', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <TextField
                      size="small"
                      label={product.unit !== 'pcs' ? `${t('inventory.sellPrice')} (DA/${product.unit})` : t('inventory.sellPrice')}
                      type="number"
                      placeholder={t('common.optional')}
                      value={product.sellPrice || ''}
                      onChange={(e) => handleProductChange(index, 'sellPrice', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <TextField
                      size="small"
                      label={`${t('common.quantity')}${product.unit !== 'pcs' ? ` (${product.unit})` : ''}`}
                      type="number"
                      placeholder="0"
                      value={product.stock || ''}
                      onChange={(e) => handleProductChange(index, 'stock', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 0, step: product.unit === 'pcs' ? 1 : 0.001 } }}
                    />
                  </Box>
                  {/* Row 3: Expiry Date */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 }}>
                    <DatePicker
                      label={t('inventory.expiryDateOptional')}
                      value={product.expiryDate ? dayjs(product.expiryDate) : null}
                      onChange={(val) => handleProductChange(index, 'expiryDate', val ? val.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={18} />}
                onClick={handleAddProduct}
                sx={{ alignSelf: 'flex-start', mt: 0.5 }}
              >
                {t('suppliers.addProduct')}
              </Button>
            </Box>
            </Collapse>
          </>
        )}

        {/* Amount Owed - show only for new active suppliers when catalog is expanded */}
        {status === 'active' && !isEdit && showCatalog && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label={t('suppliers.amountOwed')}
                type="number"
                value={initialDebt || ''}
                onChange={(e) => setInitialDebt(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0 } }}
                helperText={t('suppliers.amountOwedHelper')}
              />
              {initialDebt > 0 && (
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
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {isEdit ? t('suppliers.saveChanges') : t('suppliers.addSupplier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
