import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { _suppliers, _inventory, _supplierPayments } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { SuppliersPaymentDialog } from '../suppliers-payment-dialog';

import { DashboardContent } from 'src/layouts/dashboard';

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

type PurchaseOrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

type PurchaseOrder = {
  id: string;
  supplierId: string;
  date: string;
  items: PurchaseOrderItem[];
  total: number;
  amountPaid: number;
  paid: boolean;
  note: string;
};

const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1', supplierId: 'sup-0', date: '02/18/2026',
    items: [{ name: 'Wireless Mouse', qty: 50, unitPrice: 1500 }, { name: 'Mechanical Keyboard', qty: 20, unitPrice: 5200 }],
    total: 179000, amountPaid: 179000, paid: true, note: 'Paid via bank transfer',
  },
  {
    id: 'po-2', supplierId: 'sup-0', date: '01/25/2026',
    items: [{ name: 'USB-C Hub', qty: 30, unitPrice: 3000 }, { name: 'Wireless Mouse', qty: 40, unitPrice: 1500 }],
    total: 150000, amountPaid: 150000, paid: true, note: 'Paid via bank transfer',
  },
  {
    id: 'po-3', supplierId: 'sup-0', date: '01/05/2026',
    items: [{ name: 'Mechanical Keyboard', qty: 25, unitPrice: 5200 }, { name: 'USB-C Hub', qty: 20, unitPrice: 3000 }],
    total: 190000, amountPaid: 65000, paid: false, note: 'Partial — 125,000 DA remaining',
  },
  {
    id: 'po-4', supplierId: 'sup-1', date: '02/10/2026',
    items: [{ name: 'Bluetooth Speaker', qty: 40, unitPrice: 2200 }, { name: 'Laptop Stand Pro', qty: 15, unitPrice: 3800 }],
    total: 145000, amountPaid: 145000, paid: true, note: 'Paid in full — cash',
  },
  {
    id: 'po-5', supplierId: 'sup-1', date: '01/12/2026',
    items: [{ name: 'Monitor Stand', qty: 30, unitPrice: 1800 }, { name: 'Bluetooth Speaker', qty: 25, unitPrice: 2200 }],
    total: 109000, amountPaid: 41000, paid: false, note: 'Partial — 68,000 DA remaining',
  },
  {
    id: 'po-6', supplierId: 'sup-1', date: '02/19/2026',
    items: [{ name: 'Laptop Stand Pro', qty: 10, unitPrice: 3800 }],
    total: 38000, amountPaid: 38000, paid: true, note: 'Paid on delivery',
  },
  {
    id: 'po-7', supplierId: 'sup-2', date: '02/05/2026',
    items: [{ name: 'Webcam HD 1080p', qty: 20, unitPrice: 2800 }, { name: 'External SSD 500GB', qty: 10, unitPrice: 7500 }],
    total: 131000, amountPaid: 131000, paid: true, note: 'Bank transfer',
  },
  {
    id: 'po-8', supplierId: 'sup-2', date: '12/20/2025',
    items: [{ name: 'USB Flash Drive 64GB', qty: 100, unitPrice: 600 }],
    total: 60000, amountPaid: 60000, paid: true, note: 'Cash payment',
  },
  {
    id: 'po-9', supplierId: 'sup-3', date: '02/01/2026',
    items: [{ name: 'HDMI Cable 2m', qty: 100, unitPrice: 350 }, { name: 'Power Strip 6-Port', qty: 30, unitPrice: 900 }],
    total: 62000, amountPaid: 39500, paid: false, note: 'Partial — 22,500 DA remaining',
  },
  {
    id: 'po-10', supplierId: 'sup-3', date: '01/10/2026',
    items: [{ name: 'Surge Protector', qty: 35, unitPrice: 1400 }],
    total: 49000, amountPaid: 49000, paid: true, note: 'Paid — bank transfer',
  },
  {
    id: 'po-11', supplierId: 'sup-4', date: '11/15/2025',
    items: [{ name: 'Wireless Headset', qty: 10, unitPrice: 4200 }, { name: 'Mouse Pad XL', qty: 20, unitPrice: 800 }],
    total: 58000, amountPaid: 58000, paid: true, note: 'Final order — paid in full',
  },
];

export function SuppliersDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [supplier, setSupplier] = useState<Supplier | undefined>(
    _suppliers.find((s) => s.id === id)
  );
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const inventoryProducts = _inventory.filter((p) => p.supplierId === id);

  const supplierPayments = useMemo(
    () => (supplier ? _supplierPayments.filter((p) => p.supplierId === supplier.id) : []),
    [supplier]
  );

  const purchaseOrders = useMemo(
    () => (supplier ? MOCK_PURCHASE_ORDERS.filter((po) => po.supplierId === supplier.id) : []),
    [supplier]
  );

  const handlePaymentSubmit = useCallback(
    (supplierId: string, amount: number, _note: string) => {
      setSupplier((prev) => {
        if (!prev || prev.id !== supplierId) return prev;
        const newOwed = Math.max(0, prev.totalOwed - amount);
        return { ...prev, totalPaid: prev.totalPaid + amount, totalOwed: newOwed };
      });
    },
    []
  );

  if (!supplier) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Supplier not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/suppliers')}>
            Back to Suppliers
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {/* ── Back button ── */}
      <Button
        variant="text"
        color="inherit"
        startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
        onClick={() => navigate('/suppliers')}
        sx={{ alignSelf: 'flex-start', mb: 1 }}
      >
        Back to Suppliers
      </Button>

      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4">{supplier.name}</Typography>
            <Label color={supplier.status === 'active' ? 'success' : 'default'}>
              {supplier.status === 'active' ? 'Active' : 'Inactive'}
            </Label>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:phone-bold-duotone" width={16} />
              <Typography variant="body2">{supplier.phone}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:letter-bold-duotone" width={16} />
              <Typography variant="body2">{supplier.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:map-point-bold-duotone" width={16} />
              <Typography variant="body2">{supplier.address}</Typography>
            </Box>
          </Box>
        </Box>

        {supplier.totalOwed > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              variant="outlined"
              color="success"
              startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={20} />}
              onClick={() => handlePaymentSubmit(supplier.id, supplier.totalOwed, 'Cleared full balance')}
            >
              Clear Balance
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:wallet-money-bold-duotone" width={20} />}
              onClick={() => setPaymentOpen(true)}
            >
              Record Payment
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Financial Summary Cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'primary.lighter',
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:cart-large-2-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Total Purchased
              </Typography>
              <Typography variant="h5">{fCurrency(supplier.totalPurchased)}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'success.lighter',
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: 'success.main',
                color: 'success.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:check-circle-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Total Paid
              </Typography>
              <Typography variant="h5" color="success.dark">
                {fCurrency(supplier.totalPaid)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: supplier.totalOwed > 0 ? 'error.lighter' : 'success.lighter',
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: supplier.totalOwed > 0 ? 'error.main' : 'success.main',
                color: supplier.totalOwed > 0 ? 'error.contrastText' : 'success.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:wallet-money-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Remaining Balance
              </Typography>
              <Typography
                variant="h5"
                color={supplier.totalOwed > 0 ? 'error.dark' : 'success.dark'}
              >
                {fCurrency(supplier.totalOwed)}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Purchase Orders ── */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Purchase Orders"
          subheader={`${purchaseOrders.length} orders from this supplier`}
          avatar={
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                bgcolor: 'info.lighter',
                color: 'info.main',
              }}
            >
              <Iconify icon="solar:document-text-bold-duotone" width={22} />
            </Box>
          }
        />
        <Scrollbar>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No purchase orders
                  </TableCell>
                </TableRow>
              )}
              {purchaseOrders.map((po) => (
                <TableRow
                  key={po.id}
                  hover
                  onClick={() => setSelectedPO(po)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{fDate(po.date)}</Box>
                    <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                      {po.items.length} item{po.items.length > 1 ? 's' : ''}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ typography: 'subtitle2' }}>{fCurrency(po.total)}</Box>
                  </TableCell>
                  <TableCell align="center">
                    <Label color={po.paid ? 'success' : 'error'}>
                      {po.paid ? 'Paid' : 'Unpaid'}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* ── Purchase Order Detail Dialog ── */}
      <Dialog
        open={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedPO && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
              <Box>
                <Typography variant="h6" component="span">Purchase Order</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }} component="span">
                  {fDate(selectedPO.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Label color={selectedPO.paid ? 'success' : 'error'}>
                  {selectedPO.paid ? 'Paid' : 'Unpaid'}
                </Label>
                <IconButton size="small" onClick={() => setSelectedPO(null)}>
                  <Iconify icon="solar:close-circle-bold" width={22} />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              {/* Items table */}
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Box sx={{ typography: 'subtitle2' }}>{item.name}</Box>
                      </TableCell>
                      <TableCell align="center">{item.qty}</TableCell>
                      <TableCell align="right">{fCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ typography: 'subtitle2' }}>
                          {fCurrency(item.qty * item.unitPrice)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ mb: 2 }} />

              {/* Financial summary */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="subtitle1">{fCurrency(selectedPO.total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                  <Typography variant="subtitle1" color="success.main">
                    {fCurrency(selectedPO.amountPaid)}
                  </Typography>
                </Box>
                {!selectedPO.paid && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Remaining</Typography>
                    <Typography variant="subtitle1" color="error.main">
                      {fCurrency(selectedPO.total - selectedPO.amountPaid)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Note */}
              {selectedPO.note && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                  <Typography variant="caption" color="text.secondary">
                    Note: {selectedPO.note}
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ── Two-column: Catalog + Inventory (left) | Payment History (right) ── */}
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Product Catalog */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Product Catalog"
              subheader={`${supplier.catalog.length} products available`}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: 'warning.lighter',
                    color: 'warning.main',
                  }}
                >
                  <Iconify icon="solar:box-bold-duotone" width={22} />
                </Box>
              }
            />
            <Scrollbar>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Buying Price</TableCell>
                    <TableCell align="center">In Inventory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplier.catalog.map((product) => {
                    const inInventory = inventoryProducts.find(
                      (ip) => ip.name === product.name
                    );
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Box sx={{ typography: 'subtitle2' }}>{product.name}</Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{fCurrency(product.buyingPrice)}</TableCell>
                        <TableCell align="center">
                          {inInventory ? (
                            <Label
                              color={
                                inInventory.status === 'in-stock'
                                  ? 'success'
                                  : inInventory.status === 'low-stock'
                                    ? 'warning'
                                    : 'error'
                              }
                            >
                              {inInventory.stock} in stock
                            </Label>
                          ) : (
                            <Label color="default">Not added</Label>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Scrollbar>
          </Card>

          {/* Inventory Products */}
          {inventoryProducts.length > 0 && (
            <Card>
              <CardHeader
                title="Products in Inventory"
                subheader={`${inventoryProducts.length} products sourced from this supplier`}
                avatar={
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                    }}
                  >
                    <Iconify icon="solar:clipboard-list-bold-duotone" width={22} />
                  </Box>
                }
              />
              <Scrollbar>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Buy Price</TableCell>
                      <TableCell align="right">Sell Price</TableCell>
                      <TableCell align="right">Margin</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryProducts.map((product) => {
                      const margin =
                        product.buyingPrice > 0
                          ? ((product.sellPrice - product.buyingPrice) / product.buyingPrice) * 100
                          : 0;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box sx={{ typography: 'subtitle2' }}>{product.name}</Box>
                            <Box sx={{ typography: 'caption', color: 'text.disabled' }}>
                              {product.sku}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{fCurrency(product.buyingPrice)}</TableCell>
                          <TableCell align="right">{fCurrency(product.sellPrice)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ typography: 'subtitle2', color: 'success.main' }}>
                              {margin.toFixed(1)}%
                            </Box>
                          </TableCell>
                          <TableCell align="center">{product.stock}</TableCell>
                          <TableCell align="center">
                            <Label
                              color={
                                product.status === 'in-stock'
                                  ? 'success'
                                  : product.status === 'low-stock'
                                    ? 'warning'
                                    : 'error'
                              }
                            >
                              {product.status === 'in-stock'
                                ? 'In Stock'
                                : product.status === 'low-stock'
                                  ? 'Low Stock'
                                  : 'Out of Stock'}
                            </Label>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Scrollbar>
            </Card>
          )}
        </Grid>

        {/* Right column — Payment History */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Payment History"
              subheader={`${supplierPayments.length} payments`}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: 'success.lighter',
                    color: 'success.main',
                  }}
                >
                  <Iconify icon="solar:wallet-money-bold-duotone" width={22} />
                </Box>
              }
            />

            {supplierPayments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Iconify icon="solar:wallet-bold-duotone" width={48} sx={{ mb: 1, opacity: 0.4 }} />
                <Typography variant="body2">No payments recorded</Typography>
              </Box>
            ) : (
              <Box sx={{ px: 3, pb: 3 }}>
                {supplierPayments.map((payment, index) => (
                  <Box
                    key={payment.id}
                    sx={{
                      py: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      ...(index < supplierPayments.length - 1 && {
                        borderBottom: `1px dashed ${theme.vars.palette.divider}`,
                      }),
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: 'success.lighter',
                        color: 'success.main',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      <Iconify icon="solar:check-circle-bold" width={18} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="subtitle2" color="success.main">
                          +{fCurrency(payment.amount)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {fDate(payment.date)}
                      </Typography>
                      {payment.note && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          {payment.note}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <SuppliersPaymentDialog
        open={paymentOpen}
        supplier={supplier}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePaymentSubmit}
      />
    </DashboardContent>
  );
}
