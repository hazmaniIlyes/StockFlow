import { useState, useEffect, useMemo, useCallback } from 'react'; // added useCallback for memoised queue-advance handler

import { useTheme, alpha } from '@mui/material/styles'; // added: design tokens needed for pricing dialog cards (mirrors inventory-form-dialog.tsx)

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

import { useInventory, useTranslation, useGlobalScan } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

import type { Supplier, InventoryProduct } from 'src/_mock/_data'; // added InventoryProduct for conflict-queue typing

// ======================================================================

type PurchaseItem = {
  productName: string;
  quantity: number;
  unitPrice: number;   // buying price per unit
  sellPrice: number;   // added: sell price per unit – persisted to inventory on submit
  isNew: boolean;
  category: string;
  unit: string;
};

// Added: one entry in the sequential pricing-conflict queue
type ConflictEntry = {
  item: PurchaseItem;        // the form item with user-entered prices
  existing: InventoryProduct; // the current inventory record to compare against
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

// Added: shared default item shape with sellPrice initialised to 0
const DEFAULT_ITEM: PurchaseItem = {
  productName: '',
  quantity: 1,
  unitPrice: 0,
  sellPrice: 0, // added: sell price defaults to 0 until user types or existing product is selected
  isNew: false,
  category: 'Other',
  unit: 'pcs',
};

export function SuppliersPurchaseDialog({ open, supplier, onClose, onSubmit }: Props) {
  const theme = useTheme(); // added: required for alpha() calls in pricing dialog cards
  const { t, language } = useTranslation(); // added language: used for RTL-aware arrow icon in pricing dialog
  const { products, updateProduct, addBatch, getProductByName } = useInventory(); // added updateProduct, addBatch, getProductByName for pricing conflict resolution
  const { setFormOpen } = useGlobalScan();

  useEffect(() => {
    setFormOpen(open);
    return () => setFormOpen(false);
  }, [open, setFormOpen]);

  const [items, setItems] = useState<PurchaseItem[]>([{ ...DEFAULT_ITEM }]);
  const [amountPaid, setAmountPaid] = useState(0);

  // --- Added: state for the sequential pricing-conflict dialog ---
  const [showPriceConflictDialog, setShowPriceConflictDialog] = useState(false); // added: controls visibility of the pricing strategy popup
  const [conflictQueue, setConflictQueue] = useState<ConflictEntry[]>([]); // added: items with price changes, resolved one by one
  const [pendingSubmitItems, setPendingSubmitItems] = useState<{ productName: string; quantity: number; unitPrice: number }[]>([]); // added: snapshot of validItems saved before conflict resolution begins
  const [pendingAmountPaid, setPendingAmountPaid] = useState(0); // added: snapshot of amountPaid saved before conflict resolution begins

  // Get products from this supplier's inventory
  const supplierProducts = useMemo(() => {
    if (!supplier) return [];
    return products.filter((p) => p.supplierId === supplier.id);
  }, [products, supplier]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setItems([{ ...DEFAULT_ITEM }]); // reset includes sellPrice: 0
      setAmountPaid(0);
      setConflictQueue([]); // added: clear any leftover conflict queue
      setShowPriceConflictDialog(false); // added: ensure pricing dialog is closed
      setPendingSubmitItems([]); // added: clear pending submit snapshot
      setPendingAmountPaid(0); // added: clear pending amount snapshot
    }
  }, [open]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { ...DEFAULT_ITEM }, // reuses shared default, which includes sellPrice: 0
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
              sellPrice: existing.sellPrice ?? 0, // added: auto-fill sell price from the existing inventory record
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

  // Added: today's ISO date string – used as purchaseDate when creating a new FIFO batch
  const todayStr = new Date().toISOString().split('T')[0]; // added: consistent date format for addBatch calls

  // Added: advance through the conflict queue after each resolution.
  // When the queue is empty, fires onSubmit for the full purchase record and closes both dialogs.
  const advanceConflictQueue = useCallback(
    (
      remainingQueue: ConflictEntry[],
      submitItems: { productName: string; quantity: number; unitPrice: number }[],
      paid: number,
      supplierId: string
    ) => {
      if (remainingQueue.length === 0) {
        // added: all conflicts resolved – record the purchase in supplier financials
        if (submitItems.length > 0) {
          onSubmit(supplierId, submitItems, paid); // added: trigger supplier purchase recording
        }
        setShowPriceConflictDialog(false); // added: close pricing dialog
        onClose(); // added: close main purchase dialog
        return;
      }
      // added: more conflicts remain – update the queue and show the next one
      setConflictQueue(remainingQueue);
      setShowPriceConflictDialog(true); // added: keep pricing dialog open for next product
    },
    [onSubmit, onClose]
  );

  const handleSubmit = () => {
    if (!supplier) return;

    // Build valid items for the supplier purchase record (unchanged logic)
    const validItems = items
      .filter((item) => item.productName.trim() && item.quantity > 0 && item.unitPrice > 0)
      .map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

    if (validItems.length === 0) return;

    // Added: collect existing-product items whose buy OR sell price changed
    const queue: ConflictEntry[] = items
      .filter((item) => item.productName.trim() && item.quantity > 0 && item.unitPrice > 0) // only valid items
      .filter((item) => {
        if (item.isNew) return false; // added: new products have no DB record to conflict with
        const existing = getProductByName(item.productName); // added: look up current inventory record
        if (!existing) return false; // added: not yet in inventory – no conflict possible
        // added: conflict exists when either price deviates from the stored record
        return item.unitPrice !== existing.buyingPrice || item.sellPrice !== existing.sellPrice;
      })
      .map((item) => ({
        item,
        existing: getProductByName(item.productName)!, // safe – filtered just above
      }));

    if (queue.length === 0) {
      // added: no price conflicts – normal purchase flow, dialog not shown
      onSubmit(supplier.id, validItems, amountPaid);
      onClose();
      return;
    }

    // added: at least one conflict – save state snapshots and start sequential resolution
    setPendingSubmitItems(validItems); // added: save valid items so onSubmit can fire after all conflicts resolve
    setPendingAmountPaid(amountPaid); // added: save amountPaid snapshot
    setConflictQueue(queue); // added: set the full queue
    setShowPriceConflictDialog(true); // added: open pricing dialog for the first item
  };

  const isValid = items.some(
    (item) => item.productName.trim() && item.quantity > 0 && item.unitPrice > 0
  );

  // Added: the first unresolved conflict – what the pricing dialog currently displays
  const currentConflict = conflictQueue[0] ?? null; // added: null when queue is empty

  if (!supplier) return null;

  return (
    <> {/* added: fragment wrapper – allows rendering both the purchase dialog and pricing strategy dialog as siblings */}

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

              {/* Added: Sell Price field – the entered value is persisted to the inventory product on submit */}
              <TextField
                size="small"
                label={t('inventory.sellPrice')} // added: reuses existing inventory i18n key
                type="number"
                value={item.sellPrice || ''} // added: bound to item.sellPrice
                onChange={(e) => handleItemChange(index, 'sellPrice', parseFloat(e.target.value) || 0)} // added: write sellPrice through shared handler
                slotProps={{
                  htmlInput: { min: 0 }, // added: prevent negative values
                  input: { endAdornment: <InputAdornment position="end">DA</InputAdornment> }, // added: currency suffix matching buy price field
                }}
                sx={{ width: 140 }} // added: same width as buy price field for visual alignment
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

    {/* ── Added: Pricing Strategy Dialog ──────────────────────────────────────────
        Shown sequentially for each product whose buy price OR sell price changed.
        Design tokens (alpha, theme palette, icons) intentionally mirror
        the Price Conflict Dialog in inventory-form-dialog.tsx lines 746–927.
        When no prices change the queue is empty and this Dialog never opens.       */}
    <Dialog
      open={showPriceConflictDialog && currentConflict !== null} // added: only visible when a conflict is being displayed
      onClose={() => setShowPriceConflictDialog(false)} // added: allow user to dismiss without resolving
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Iconify
          icon="solar:danger-triangle-bold-duotone"
          width={26}
          sx={{ color: 'warning.main', flexShrink: 0 }} // added: warning icon matching inventory dialog
        />
        <Box sx={{ flex: 1 }}> {/* added: flex container so title and counter sit on the same row */}
          {t('inventory.priceConflictTitle')} {/* added: reuse existing i18n key */}
          {conflictQueue.length > 1 && ( // added: only render the counter when there are multiple conflicts
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1 }} // added: small left gap between title text and counter
            >
              ({conflictQueue.indexOf(currentConflict!) + 1} of {conflictQueue.length}) {/* added: e.g. "(1 of 2)" – tells user how many pricing dialogs remain */}
            </Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Added: product identity block – tells user which specific product this dialog refers to */}
        {currentConflict && (
          <Box sx={{ mb: 2 }}> {/* added: bottom margin to separate from the price cards below */}
            <Typography variant="subtitle1" fontWeight={600}>
              {currentConflict.item.productName} {/* added: product name from the conflict queue entry */}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('inventory.priceConflictDesc')} {/* added: reuse existing i18n description key */}
            </Typography>
          </Box>
        )}
        {/* added: keep a fallback description when currentConflict is null (should never render visibly) */}
        {!currentConflict && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('inventory.priceConflictDesc')} {/* added: fallback – mirrors original single-line description */}
          </Typography>
        )}

        {/* Added: Old vs New price comparison cards – layout mirrors inventory-form-dialog.tsx */}
        {currentConflict && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center' }}>

            {/* Added: Old prices card (current DB values) */}
            <Box
              sx={{
                flex: 1, p: 2, borderRadius: 1.5,
                bgcolor: alpha(theme.palette.grey[500], 0.08), // added: neutral background matching inventory dialog
                border: '1px solid', borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {t('inventory.priceConflictOldPrices')} {/* added: reuse existing i18n key */}
              </Typography>
              <Typography variant="subtitle2">
                {t('inventory.buyingPrice')}: {fCurrency(currentConflict.existing.buyingPrice)} {/* added: existing DB buying price */}
              </Typography>
              <Typography variant="subtitle2">
                {t('inventory.sellPrice')}: {fCurrency(currentConflict.existing.sellPrice)} {/* added: existing DB sell price */}
              </Typography>
            </Box>

            {/* Added: directional arrow – flips for RTL (matching inventory-form-dialog.tsx line 783) */}
            <Iconify
              icon={language === 'ar' ? 'solar:arrow-left-bold' : 'solar:arrow-right-bold'}
              width={20}
              sx={{ color: 'text.disabled', flexShrink: 0 }} // added: same styling as inventory dialog
            />

            {/* Added: New prices card (user-entered values) */}
            <Box
              sx={{
                flex: 1, p: 2, borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.08), // added: primary tint matching inventory dialog
                border: '1px solid', borderColor: 'primary.light',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {t('inventory.priceConflictNewPrices')} {/* added: reuse existing i18n key */}
              </Typography>
              <Typography variant="subtitle2" color="primary.dark">
                {t('inventory.buyingPrice')}: {fCurrency(currentConflict.item.unitPrice)} {/* added: new buying price from form */}
              </Typography>
              <Typography variant="subtitle2" color="primary.dark">
                {t('inventory.sellPrice')}: {fCurrency(currentConflict.item.sellPrice)} {/* added: new sell price from form */}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Added: Option 1 – Update All: overwrite prices + merge stock into a flat total.
            Mirrors inventory-form-dialog.tsx lines 805–863.                           */}
        <Box
          onClick={() => {
            if (!currentConflict || !supplier) return; // added: guard against empty state
            const { item, existing } = currentConflict; // added: unpack for readability

            // added: overwrite prices and merge stock – clears any existing FIFO batches
            updateProduct(existing.id, {
              buyingPrice: item.unitPrice,           // added: apply new buying price to inventory record
              sellPrice: item.sellPrice,             // added: apply new sell price to inventory record
              stock: existing.stock + item.quantity, // added: add purchased qty to current stock level
              batches: undefined,                    // added: clear batches (matching inventory dialog Option 1 behaviour)
            });

            const nextQueue = conflictQueue.slice(1); // added: remove the just-resolved conflict from the queue
            advanceConflictQueue(nextQueue, pendingSubmitItems, pendingAmountPaid, supplier.id); // added: move to next conflict or finalise
          }}
          sx={{
            p: 2, mb: 1.5, borderRadius: 2, cursor: 'pointer',
            border: '1.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
            transition: 'all 0.15s',
            '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }, // added: hover matching inventory dialog
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12), // added: primary icon background
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:refresh-bold-duotone" width={22} /> {/* added: same icon as inventory dialog Option 1 */}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('inventory.priceConflictUpdateAll')} {/* added: reuse existing i18n key */}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('inventory.priceConflictUpdateAllDesc')} {/* added: reuse existing i18n key */}
            </Typography>
          </Box>
        </Box>

        {/* Added: Option 2 – FIFO batch: add new stock at new price, old stock retains old price.
            Mirrors inventory-form-dialog.tsx lines 866–919.                               */}
        <Box
          onClick={() => {
            if (!currentConflict || !supplier) return; // added: guard against empty state
            const { item, existing } = currentConflict; // added: unpack for readability

            // added: create a new batch so old-price stock and new-price stock coexist (FIFO)
            addBatch(existing.id, {
              buyingPrice: item.unitPrice, // added: new batch buying price
              sellPrice: item.sellPrice,   // added: new batch sell price
              quantity: item.quantity,     // added: quantity delivered in this purchase
              purchaseDate: todayStr,      // added: ISO date for the batch record
            });

            const nextQueue = conflictQueue.slice(1); // added: remove the just-resolved conflict from the queue
            advanceConflictQueue(nextQueue, pendingSubmitItems, pendingAmountPaid, supplier.id); // added: move to next conflict or finalise
          }}
          sx={{
            p: 2, borderRadius: 2, cursor: 'pointer',
            border: '1.5px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
            transition: 'all 0.15s',
            '&:hover': { borderColor: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05) }, // added: info hover matching inventory dialog
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.12), // added: info icon background
              color: 'info.main',
            }}
          >
            <Iconify icon="solar:layers-minimalistic-bold-duotone" width={22} /> {/* added: same icon as inventory dialog Option 2 */}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('inventory.priceConflictFifo')} {/* added: reuse existing i18n key */}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('inventory.priceConflictFifoDesc')} {/* added: reuse existing i18n key */}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => setShowPriceConflictDialog(false)} // added: dismiss pricing dialog without resolving (purchase is not recorded)
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>

    </> // added: close fragment wrapper
  );
}
