import type { Client, Invoice, ProductUnit, InvoiceProduct, InventoryProduct } from 'src/_mock/_data';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import Tabs from '@mui/material/Tabs';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fCurrency } from 'src/utils/format-number';

import { useClients, useSettings, useInventory, useGlobalScan, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { ScanModal } from 'src/components/scan-modal';
import { useSnackbar } from 'src/components/snackbar';

import { useInvoices } from './context/invoice-context';

// ======================================================================

type ProductRow = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  inventoryId?: string;
  availableStock?: number;
  unit?: ProductUnit;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (
    invoice: Omit<Invoice, 'id'>,
    options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery'; isRetail?: boolean; autoPrint?: boolean }
  ) => void;
  editInvoice?: Invoice | null;
};

const emptyProduct = (): ProductRow => ({
  id: `new-${Date.now()}-${Math.random()}`,
  name: '',
  quantity: 1,
  unitPrice: 0,
});

type FormErrors = {
  clientName?: string;
  products?: string;
  stockErrors?: string[];
};

export function SalesNewInvoiceDialog({ open, onClose, onSave, editInvoice }: Props) {
  const isEdit = !!editInvoice;
  const { t } = useTranslation();

  const { clients } = useClients();
  const { products: inventoryProducts } = useInventory();
  const { getNextInvoiceNumber } = useInvoices();
  const { invoice: invoiceSettings } = useSettings();
  const { showError } = useSnackbar();
  const { setFormOpen } = useGlobalScan();
  const theme = useTheme();

  useEffect(() => {
    setFormOpen(open);
    return () => setFormOpen(false);
  }, [open, setFormOpen]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [clientNis, setClientNis] = useState('');
  const [clientRc, setClientRc] = useState('');
  const [clientAi, setClientAi] = useState('');
  const [tvaRate, setTvaRate] = useState(19);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partly-paid' | 'unpaid'>('paid');
  const [amountPaid, setAmountPaid] = useState(0);
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [products, setProducts] = useState<ProductRow[]>([emptyProduct()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [activeTab, setActiveTab] = useState<'wholesale' | 'retail'>('wholesale');

  // SKU scan state
  const [skuInput, setSkuInput] = useState('');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [lastFilledId, setLastFilledId] = useState<string | null>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens or editInvoice changes
  useEffect(() => {
    if (open) {
      if (editInvoice) {
        const existingClient = clients.find(
          (c) => c.name.toLowerCase() === editInvoice.client.name.toLowerCase()
        );
        setSelectedClient(existingClient || null);
        setClientName(editInvoice.client.name);
        setClientPhone(editInvoice.client.phone);
        setClientAddress(editInvoice.client.address);
        setClientNif(editInvoice.client.nif || '');
        setClientNis(editInvoice.client.nis || '');
        setClientRc(editInvoice.client.rc || '');
        setClientAi(editInvoice.client.ai || '');
        setTvaRate(editInvoice.tvaRate);
        setPaymentStatus(editInvoice.status);
        setAmountPaid(editInvoice.amountPaid);
        setDueDate(
          editInvoice.dueDate
            ? (() => { try { return new Date(editInvoice.dueDate).toISOString().split('T')[0]; } catch { return defaultDueDate(); } })()
            : defaultDueDate()
        );
        setProducts(
          editInvoice.products.map((p) => {
            const invProduct = inventoryProducts.find(
              (ip) => ip.name.toLowerCase() === p.name.toLowerCase()
            );
            return {
              id: p.id,
              name: p.name,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              inventoryId: invProduct?.id,
              availableStock: invProduct ? invProduct.stock + p.quantity : undefined,
              unit: p.unit ?? invProduct?.unit,
            };
          })
        );
      } else {
        setSelectedClient(null);
        setClientName('');
        setClientPhone('');
        setClientAddress('');
        setClientNif('');
        setClientNis('');
        setClientRc('');
        setClientAi('');
        setTvaRate(invoiceSettings.tvaRate);
        setPaymentStatus('paid');
        setAmountPaid(0);
        setDueDate(defaultDueDate());
        setProducts([emptyProduct()]);
      }
      setErrors({});
      setTouched(false);
      setActiveTab('wholesale');
    }
  }, [open, editInvoice, clients, inventoryProducts]);

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone);
      setClientAddress(client.address);
      setClientNif(client.nif || '');
      setClientNis(client.nis || '');
      setClientRc(client.rc || '');
      setClientAi(client.ai || '');
    }
  };

  // added: pure helper — computes the FIFO-weighted sell price and a per-batch breakdown for display.
  // This is READ-ONLY: it does not modify any state. The actual stock deduction still happens
  // in deductStockForInvoice when the invoice is saved.
  const computeFifoInfo = (invProduct: InventoryProduct, qty: number) => { // added
    if (!invProduct.batches || invProduct.batches.length === 0) { // added: no FIFO batches — return flat sell price
      return { weightedPrice: invProduct.sellPrice, breakdown: null as null | { qty: number; price: number }[] }; // added
    }
    let remaining = qty; // added: units still to be allocated across batches
    let fifoTotal = 0; // added: running sell-price total across consumed batch slices
    const slices: { qty: number; price: number }[] = []; // added: individual batch contributions
    for (const batch of invProduct.batches) { // added: walk oldest-first (invariant guaranteed by addBatch)
      if (remaining <= 0) break; // added: demand satisfied — stop early
      const taken = Math.min(batch.quantity, remaining); // added: consume as many units as this batch holds
      slices.push({ qty: taken, price: batch.sellPrice }); // added: record this slice for the breakdown note
      fifoTotal += taken * batch.sellPrice; // added: accumulate revenue at this batch's sell price
      remaining -= taken; // added: reduce remaining demand
    }
    return {
      weightedPrice: qty > 0 ? fifoTotal / qty : invProduct.sellPrice, // added: blended unit price; falls back to sellPrice when qty is 0
      breakdown: slices.length > 1 ? slices : null, // added: only expose when > 1 batch consumed (i.e. real FIFO splitting occurred)
    };
  }; // added

  const handleProductSelect = (rowId: string, product: InventoryProduct | null) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== rowId) return p;
        if (!product) {
          return { ...p, name: '', unitPrice: 0, inventoryId: undefined, availableStock: undefined };
        }
        return {
          ...p,
          name: product.name,
          unitPrice: computeFifoInfo(product, p.quantity).weightedPrice, // added: FIFO-weighted average for the current quantity; equals sellPrice when only one batch is consumed
          inventoryId: product.id,
          availableStock: product.stock,
          unit: product.unit,
        };
      })
    );
  };

  const handleProductChange = (id: string, field: keyof ProductRow, value: string | number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };

        if (field === 'name') {
          const invProduct = inventoryProducts.find(
            (ip) => ip.name.toLowerCase() === String(value).toLowerCase()
          );
          if (invProduct) {
            updated.inventoryId = invProduct.id;
            updated.availableStock = invProduct.stock;
            if (!updated.unitPrice) {
              updated.unitPrice = invProduct.sellPrice;
            }
          } else {
            updated.inventoryId = undefined;
            updated.availableStock = undefined;
          }
        }

        // added: when the user changes the quantity and the product has FIFO batches, recalculate the weighted price in real time
        if (field === 'quantity' && updated.inventoryId) { // added: only applies to quantity edits on inventory-linked rows
          const invProd = inventoryProducts.find((ip) => ip.id === updated.inventoryId); // added: look up the full product record for its batches
          if (invProd) { // added: guard in case the product was removed from inventory since the row was added
            updated.unitPrice = computeFifoInfo(invProd, Number(value)).weightedPrice; // added: replace unit price with live FIFO-weighted average
          } // added
        } // added

        return updated;
      })
    );
  };

  const handleAddProduct = () => {
    setProducts((prev) => [...prev, emptyProduct()]);
  };

  // ── SKU lookup — shared by manual Enter key and scanner ─────────────
  const handleSkuLookup = useCallback((rawSku: string) => {
    const trimmed = rawSku.trim();
    if (!trimmed) return;

    const matched = inventoryProducts.find(
      (ip) => ip.sku === trimmed
    );

    if (!matched) {
      showError('Product not found');
      setSkuInput('');
      return;
    }

    // Find the first empty product row, or capture the index for a new append
    setProducts((prev) => {
      const emptyIdx = prev.findIndex((p) => !p.name.trim());
      const isAppend = emptyIdx === -1;
      const targetId = isAppend
        ? `new-${Date.now()}-${Math.random()}`
        : prev[emptyIdx].id;

      const newRow: ProductRow = {
        id: targetId,
        name: matched.name,
        quantity: 1,
        unitPrice: matched.sellPrice,
        inventoryId: matched.id,
        availableStock: matched.stock,
        unit: matched.unit,
      };

      // Record which row to focus BEFORE the state update resolves
      // (We use a synchronous write so the next render attaches the ref correctly)
      setLastFilledId(targetId);

      return isAppend
        ? [...prev, newRow]
        : prev.map((p, i) => (i === emptyIdx ? newRow : p));
    });

    setSkuInput(trimmed);

    // Focus the quantity field after React has re-rendered with the ref attached
    setTimeout(() => quantityInputRef.current?.focus(), 50);
  }, [inventoryProducts, showError]);

  const handleRemoveProduct = (id: string) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Price entered is HT (before tax); TVA is added on top
  const subtotalHT = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const tvaAmount = subtotalHT * (tvaRate / 100);
  const total = subtotalHT + tvaAmount; // TTC = HT + TVA

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const stockErrors: string[] = [];

    if (activeTab === 'wholesale' && !clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    const validProducts = products.filter((p) => p.name.trim() && p.quantity > 0 && p.unitPrice > 0);
    if (validProducts.length === 0) {
      newErrors.products = 'At least one product with name, quantity, and price is required';
    }

    for (const product of validProducts) {
      if (product.inventoryId && product.availableStock !== undefined) {
        if (product.quantity > product.availableStock) {
          stockErrors.push(
            `"${product.name}": Only ${product.availableStock} in stock, requested ${product.quantity}`
          );
        }
      }
    }

    if (stockErrors.length > 0) {
      newErrors.stockErrors = stockErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (printMode?: 'invoice' | 'delivery', autoPrint?: boolean) => {
    setTouched(true);

    if (!validate()) return;

    const invoiceProducts: InvoiceProduct[] = products
      .filter((p) => p.name.trim())
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        total: p.quantity * p.unitPrice,
        unit: p.unit,
      }));

    const isRetail = activeTab === 'retail';
    const finalAmountPaid = isRetail
      ? total
      : paymentStatus === 'paid' ? total : paymentStatus === 'unpaid' ? 0 : amountPaid;
    const finalStatus = isRetail ? 'paid' : paymentStatus;

    onSave(
      {
        invoiceNumber: editInvoice?.invoiceNumber ?? getNextInvoiceNumber(),
        type: isRetail ? 'retail' : 'wholesale',
        client: isRetail
          ? { name: t('sales.walkInCustomer'), phone: '', address: '' }
          : {
              name: clientName,
              phone: clientPhone,
              address: clientAddress,
              nif: clientNif || undefined,
              nis: clientNis || undefined,
              rc: clientRc || undefined,
              ai: clientAi || undefined,
            },
        products: invoiceProducts,
        subtotal: subtotalHT,
        tvaRate,
        tvaAmount,
        total,
        amountPaid: finalAmountPaid,
        amountDue: total - finalAmountPaid,
        status: finalStatus,
        createdAt: editInvoice?.createdAt ?? new Date().toISOString().split('T')[0],
        dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
      },
      { isEdit, originalProducts: editInvoice?.products, printMode, isRetail, autoPrint }
    );
  };

  const availableProducts = useMemo(() => {
    const selectedNames = products.map((p) => p.name.toLowerCase());
    return inventoryProducts.filter(
      (ip) => ip.stock > 0 || selectedNames.includes(ip.name.toLowerCase())
    );
  }, [inventoryProducts, products]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: isEdit ? 2 : 0 }}>
        {isEdit ? t('common.edit') : t('sales.newInvoice')}
        {!isEdit && (
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ mt: 1 }}
          >
            <Tab
              value="wholesale"
              label={t('sales.wholesaleTab')}
              icon={<Iconify icon="solar:bill-list-bold-duotone" width={18} />}
              iconPosition="start"
              sx={{ minHeight: 42 }}
            />
            <Tab
              value="retail"
              label={t('sales.retailTab')}
              icon={<Iconify icon="solar:shop-bold-duotone" width={18} />}
              iconPosition="start"
              sx={{ minHeight: 42 }}
            />
          </Tabs>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {/* Client Info — wholesale only */}
        {activeTab === 'wholesale' && (
          <>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {t('clients.title')}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={clients}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              value={selectedClient}
              onChange={(_, newValue) => {
                if (typeof newValue === 'string') {
                  setClientName(newValue);
                  setSelectedClient(null);
                } else {
                  handleClientSelect(newValue);
                }
              }}
              onInputChange={(_, newInputValue) => {
                if (!selectedClient || selectedClient.name !== newInputValue) {
                  setClientName(newInputValue);
                }
              }}
              inputValue={clientName}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="subtitle2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.phone} • Balance: {fCurrency(option.remainingBalance)}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('clients.clientName')}
                  required
                  error={touched && !!errors.clientName}
                  helperText={touched && errors.clientName}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label={t('common.phone')}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label={t('common.address')}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </Grid>

          {/* Tax Information - show when not selecting existing client or always show input */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {t('clients.taxFields.nif')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="NIF"
              value={clientNif}
              onChange={(e) => setClientNif(e.target.value)}
              placeholder="Numéro d'Identification Fiscale"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="NIS"
              value={clientNis}
              onChange={(e) => setClientNis(e.target.value)}
              placeholder="Numéro d'Identification Statistique"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="RC"
              value={clientRc}
              onChange={(e) => setClientRc(e.target.value)}
              placeholder="Registre de Commerce"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="AI"
              value={clientAi}
              onChange={(e) => setClientAi(e.target.value)}
              placeholder="Article d'Imposition"
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />
          </>
        )}

        {/* Products */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">{t('sales.products')}</Typography>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
            onClick={handleAddProduct}
          >
            {t('sales.addProduct')}
          </Button>
        </Box>

        {touched && errors.products && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2 }}>
            {errors.products}
          </Typography>
        )}

        {touched && errors.stockErrors && errors.stockErrors.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.12), borderRadius: 1 }}>
            <Typography variant="subtitle2" color="error" sx={{ mb: 0.5 }}>
              {t('common.stock')}:
            </Typography>
            {errors.stockErrors.map((err, idx) => (
              <Typography key={idx} variant="caption" color="error" sx={{ display: 'block' }}>
                • {err}
              </Typography>
            ))}
          </Box>
        )}

        {products.map((product, index) => (
          <Grid container spacing={2} key={product.id} sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={availableProducts}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                value={
                  product.inventoryId
                    ? inventoryProducts.find((p) => p.id === product.inventoryId) || null
                    : null
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    handleProductChange(product.id, 'name', newValue);
                  } else {
                    handleProductSelect(product.id, newValue);
                  }
                }}
                onInputChange={(_, newInputValue) => {
                  if (!product.inventoryId) {
                    handleProductChange(product.id, 'name', newInputValue);
                  }
                }}
                inputValue={product.name}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option.id}
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fCurrency(option.sellPrice)} / {option.unit ?? 'pcs'}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${option.stock} ${option.unit ?? 'pcs'}`}
                      color={option.stock <= option.minStock ? 'warning' : 'default'}
                      sx={{ marginInlineStart: 1 }}
                    />
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t('common.product')} ${index + 1}`}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {product.availableStock !== undefined && (
                              <Chip
                                size="small"
                                label={`${product.availableStock} ${product.unit ?? 'pcs'}`}
                                color={
                                  product.quantity > product.availableStock ? 'error' : 'success'
                                }
                                sx={{ marginInlineEnd: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size="small"
                label={product.unit && product.unit !== 'pcs' ? `${t('common.quantity')} (${product.unit})` : t('common.quantity')}
                type="number"
                value={product.quantity}
                onChange={(e) =>
                  handleProductChange(product.id, 'quantity', Math.max(product.unit === 'pcs' || !product.unit ? 1 : 0.001, Number(e.target.value)))
                }
                error={
                  product.availableStock !== undefined && product.quantity > product.availableStock
                }
                slotProps={{
                  htmlInput: {
                    min: product.unit === 'pcs' || !product.unit ? 1 : 0.001,
                    step: product.unit === 'pcs' || !product.unit ? 1 : 0.001,
                    // Attach the focus ref directly to the quantity field that was just filled by a scan
                    ...(product.id === lastFilledId ? { ref: quantityInputRef } : {}),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label={product.unit && product.unit !== 'pcs' ? `${t('common.price')} DA/${product.unit}` : t('common.price')}
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
                <IconButton
                  size="small"
                  onClick={() => handleRemoveProduct(product.id)}
                  color="error"
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              )}
            </Grid>
            {/* added: FIFO breakdown note — rendered only when the ordered quantity spans more than one batch */}
            {(() => { // added: IIFE keeps the breakdown logic self-contained without polluting the map callback
              const invProdForNote = product.inventoryId // added: look up the inventory product for its batch data
                ? inventoryProducts.find((ip) => ip.id === product.inventoryId) // added
                : undefined; // added
              if (!invProdForNote) return null; // added: product not linked to inventory — nothing to show
              const fifoNoteInfo = computeFifoInfo(invProdForNote, product.quantity); // added: compute breakdown (read-only)
              if (!fifoNoteInfo.breakdown) return null; // added: only one batch consumed — no split explanation needed
              const parts = fifoNoteInfo.breakdown // added: build the human-readable breakdown string
                .map((s) => `${s.qty} × ${fCurrency(s.price)}`) // added: format each slice as "qty × price"
                .join(' + '); // added: join slices with a plus sign
              return ( // added
                <Grid size={{ xs: 12 }}> {/* added: full-width row so the note sits below all input columns */}
                  <Typography // added
                    variant="caption" // added: small unobtrusive text
                    color="text.secondary" // added: muted colour — clearly secondary information
                    sx={{ display: 'block', mt: -0.5, mb: 0.5 }} // added: tight spacing relative to the input row above
                  >
                    {`⚡ FIFO: ${parts} = ${fCurrency(fifoNoteInfo.weightedPrice)} avg`} {/* added: the readable FIFO breakdown note */}
                  </Typography>
                </Grid>
              ); // added
            })()} {/* added: end of IIFE */}
          </Grid>
        ))}

        {/* SKU scan row */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label="SKU"
            placeholder="Type or scan a SKU…"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSkuLookup(skuInput);
              }
            }}
            slotProps={{ htmlInput: { maxLength: 64 } }}
          />
          <Button
            variant="outlined"
            onClick={(e) => {
              e.currentTarget.blur();
              setScanModalOpen(true);
            }}
            sx={{
              height: 40,
              minWidth: 90,
              gap: 0.75,
              flexShrink: 0,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
            }}
          >
            <Iconify icon="solar:scanner-bold-duotone" width={20} />
            SCAN
          </Button>
        </Box>

        <ScanModal
          open={scanModalOpen}
          onClose={useCallback(() => setScanModalOpen(false), [])}
          onScan={useCallback((value: string) => {
            setScanModalOpen(false);
            handleSkuLookup(value);
          }, [handleSkuLookup])}
        />


        <Divider sx={{ my: 3 }} />

        {/* Totals */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('sales.taxRate')}
              type="number"
              value={tvaRate}
              onChange={(e) => setTvaRate(Math.max(0, Number(e.target.value)))}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              helperText={`${t('sales.taxRate')} (19%)`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ textAlign: 'end' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('common.subtotal')} HT
                </Typography>
                <Typography variant="body2">{fCurrency(subtotalHT)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  TVA ({tvaRate}%)
                </Typography>
                <Typography variant="body2">{fCurrency(tvaAmount)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{t('common.total')} TTC</Typography>
                <Typography variant="subtitle1">{fCurrency(total)}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Payment Status — wholesale only */}
        {activeTab === 'wholesale' && (
          <>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          {t('sales.paymentStatus')}
        </Typography>
        <RadioGroup
          row
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as Invoice['status'])}
        >
          <FormControlLabel value="paid" control={<Radio />} label={t('sales.paid')} />
          <FormControlLabel value="partly-paid" control={<Radio />} label={t('sales.partial')} />
          <FormControlLabel value="unpaid" control={<Radio />} label={t('sales.unpaid')} />
        </RadioGroup>

        {paymentStatus === 'partly-paid' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label={t('sales.amountPaid')}
              type="number"
              size="small"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Math.max(0, Math.min(total, Number(e.target.value))))}
              slotProps={{ htmlInput: { min: 0, max: total } }}
              sx={{ width: 200 }}
            />
            <Typography variant="body2" color="text.secondary">
              {t('sales.amountDue')}: <strong>{fCurrency(total - amountPaid)}</strong>
            </Typography>
          </Box>
        )}
        {(paymentStatus === 'partly-paid' || paymentStatus === 'unpaid') && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:calendar-bold-duotone" width={20} sx={{ color: 'text.secondary' }} />
            <TextField
              label={t('sales.dueDate')}
              type="date"
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 200 }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('sales.dueDateHelper')}
            </Typography>
          </Box>
        )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        {activeTab === 'wholesale' ? (
          <>
            <PrintDropdownButton onSelect={(mode) => handleSave(mode)} t={t} />
            <Button variant="contained" onClick={() => handleSave()}>
              {t('common.save')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
              onClick={() => handleSave(undefined, true)}
            >
              {t('common.saveAndPrint')}
            </Button>
            <Button variant="contained" onClick={() => handleSave()}>
              {t('common.save')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Split print dropdown ──────────────────────────────────────────────
function PrintDropdownButton({
  onSelect,
  t,
}: {
  onSelect: (mode: 'invoice' | 'delivery') => void;
  t: (key: string) => string;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
        endIcon={<Iconify icon="solar:alt-arrow-down-bold" width={16} />}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {t('common.saveAndPrint')}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => { setAnchor(null); onSelect('invoice'); }}
        >
          <Iconify icon="solar:bill-list-bold-duotone" width={18} sx={{ mr: 1.5 }} />
          {t('sales.saveAndPrintInvoice')}
        </MenuItem>
        <MenuItem
          onClick={() => { setAnchor(null); onSelect('delivery'); }}
        >
          <Iconify icon="solar:box-bold-duotone" width={18} sx={{ mr: 1.5 }} />
          {t('sales.saveAndPrintDelivery')}
        </MenuItem>
      </Menu>
    </>
  );
}
