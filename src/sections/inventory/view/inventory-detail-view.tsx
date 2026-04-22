import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { useInventory, useSuppliers, useTranslation } from 'src/contexts';
import { useInvoices } from 'src/sections/sales/context';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';

import { InventoryStockDialog } from '../inventory-stock-dialog';

import { DashboardContent } from 'src/layouts/dashboard';

// ======================================================================

export function InventoryDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, dir } = useTranslation();
  const { showSuccess, showError } = useSnackbar();
  const { getProduct, adjustStock } = useInventory();
  const { getSupplier } = useSuppliers();
  const { invoices } = useInvoices();

  const product = getProduct(id || '');
  const supplier = product ? getSupplier(product.supplierId) : undefined;

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [salesPage, setSalesPage] = useState(0);
  const salesRowsPerPage = 10;

  // Find invoices containing this product
  const productInvoices = useMemo(() => {
    if (!product) return [];
    return invoices.filter((inv) =>
      inv.products.some((item) => item.name.toLowerCase() === product.name.toLowerCase())
    );
  }, [invoices, product]);

  // Calculate total sold
  const totalSold = useMemo(() => {
    if (!product) return 0;
    return productInvoices.reduce((sum, inv) => {
      const item = inv.products.find((i) => i.name.toLowerCase() === product.name.toLowerCase());
      return sum + (item?.quantity || 0);
    }, 0);
  }, [productInvoices, product]);

  // Calculate total revenue from this product
  const totalRevenue = useMemo(() => {
    if (!product) return 0;
    return productInvoices.reduce((sum, inv) => {
      const item = inv.products.find((i) => i.name.toLowerCase() === product.name.toLowerCase());
      return sum + (item ? item.quantity * item.unitPrice : 0);
    }, 0);
  }, [productInvoices, product]);

  const handleStockSubmit = useCallback(
    (productId: string, type: 'add' | 'remove', quantity: number, _reason: string) => {
      const success = adjustStock(productId, quantity, type);
      if (success) {
        showSuccess(type === 'add' ? t('inventory.stockAddedSuccess') : t('inventory.stockRemovedSuccess'));
      } else {
        showError(t('inventory.insufficientStock'));
      }
    },
    [adjustStock, showSuccess, showError, t]
  );

  if (!product) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('inventory.productNotFound')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/inventory')}>
            {t('inventory.backToInventory')}
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  const margin =
    product.buyingPrice > 0
      ? ((product.sellPrice - product.buyingPrice) / product.buyingPrice) * 100
      : 0;
  const profitPerUnit = product.sellPrice - product.buyingPrice;

  return (
    <DashboardContent maxWidth="xl">
      {/* Back button */}
      <Button
        variant="text"
        color="inherit"
        startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
        onClick={() => navigate('/inventory')}
        sx={{ alignSelf: 'flex-start', mb: 1 }}
      >
        {t('inventory.backToInventory')}
      </Button>

      {/* Header */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4">{product.name}</Typography>
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
                ? t('inventory.inStock')
                : product.status === 'low-stock'
                  ? t('inventory.lowStock')
                  : t('inventory.outOfStock')}
            </Label>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:barcode-bold-duotone" width={16} />
              <Typography variant="body2">{product.sku}</Typography>
            </Box>
            <Chip label={product.category} size="small" variant="outlined" />
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:box-bold-duotone" width={20} />}
          onClick={() => setStockDialogOpen(true)}
        >
          {t('inventory.adjustStock')}
        </Button>
      </Box>

      {/* Financial Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.16),
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
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:cart-large-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('inventory.buyingPrice')}
              </Typography>
              <Typography variant="h5">{fCurrency(product.buyingPrice)}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.16),
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
              <Iconify icon="solar:tag-price-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('inventory.sellingPrice')}
              </Typography>
              <Typography variant="h5">{fCurrency(product.sellPrice)}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(theme.palette.success.main, 0.16),
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
              <Iconify icon="solar:chart-2-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('inventory.margin')}
              </Typography>
              <Typography variant="h5" color="success.main">
                {margin.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fCurrency(profitPerUnit)}{product.unit !== 'pcs' ? ` / ${product.unit}` : t('inventory.unitSuffix')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(theme.palette.info.main, 0.16),
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
                bgcolor: 'info.main',
                color: 'info.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:box-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('inventory.currentStock')}
              </Typography>
              <Typography
                variant="h5"
                color={
                  product.stock === 0
                    ? 'error.main'
                    : product.stock <= product.minStock
                      ? 'warning.main'
                      : 'text.primary'
                }
              >
                {product.stock} {product.unit ?? t('inventory.units')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('inventory.minStock')}: {product.minStock}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Two-column layout */}
      <Grid container spacing={3}>
        {/* Left column - Sales History */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={t('inventory.salesHistory')}
              subheader={t('inventory.unitsSoldRevenue', { sold: totalSold, revenue: fCurrency(totalRevenue) })}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon="solar:cart-check-bold-duotone" width={22} />
                </Box>
              }
            />
            <TableContainer>
              <Table sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('common.date')}</TableCell>
                    <TableCell>{t('sales.client')}</TableCell>
                    <TableCell align="center">{t('inventory.qtySold')}</TableCell>
                    <TableCell align="right">{t('inventory.unitPrice')}</TableCell>
                    <TableCell align="right">{t('common.total')}</TableCell>
                    <TableCell align="center">{t('inventory.invoice')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('inventory.noSalesRecorded')}
                      </TableCell>
                    </TableRow>
                  )}
                  {productInvoices.slice(salesPage * salesRowsPerPage, (salesPage + 1) * salesRowsPerPage).map((invoice) => {
                    const item = invoice.products.find(
                      (i) => i.name.toLowerCase() === product.name.toLowerCase()
                    );
                    if (!item) return null;
                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography variant="body2">{fDate(invoice.createdAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{invoice.client.name}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantity} size="small" />
                        </TableCell>
                        <TableCell align="right">{fCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">
                            {fCurrency(item.quantity * item.unitPrice)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/sales/${invoice.id}`)}
                          >
                            {invoice.invoiceNumber}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={productInvoices.length}
              page={salesPage}
              onPageChange={(_e, newPage) => setSalesPage(newPage)}
              rowsPerPage={salesRowsPerPage}
              rowsPerPageOptions={[10]}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
              dir={dir}
            />
          </Card>

          {/* Performance Summary */}
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.success.main, 0.16),
                  color: 'success.main',
                }}
              >
                <Iconify icon="solar:money-bag-bold-duotone" width={24} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{t('inventory.totalProfitProduct')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.basedOnUnitsSold', { count: totalSold })}
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {fCurrency(totalSold * profitPerUnit)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Right column - Supplier Info + Stock Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Supplier Card */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={t('inventory.supplier')}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.16),
                    color: 'warning.main',
                  }}
                >
                  <Iconify icon="solar:buildings-bold-duotone" width={22} />
                </Box>
              }
            />
            <Divider />
            <Box sx={{ p: 3 }}>
              {supplier ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1">{supplier.name}</Typography>
                    <Label
                      color={supplier.status === 'active' ? 'success' : 'default'}
                      sx={{ mt: 0.5 }}
                    >
                      {supplier.status === 'active' ? t('common.active') : t('common.inactive')}
                    </Label>
                  </Box>
                  {supplier.phone && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('common.phone')}
                      </Typography>
                      <Typography variant="body2">{supplier.phone}</Typography>
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<Iconify icon="solar:arrow-right-bold" width={18} />}
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    {t('inventory.viewSupplier')}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {t('inventory.noSupplierLinked')}
                </Typography>
              )}
            </Box>
          </Card>

          {/* Stock Details */}
          <Card sx={{ mb: product.batches && product.batches.length > 1 ? 3 : 0 }}>
            <CardHeader
              title={t('inventory.stockDetails')}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.16),
                    color: 'info.main',
                  }}
                >
                  <Iconify icon="solar:clipboard-list-bold-duotone" width={22} />
                </Box>
              }
            />
            <Divider />
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.currentStock')}
                </Typography>
                <Typography variant="subtitle2">{product.stock} {product.unit ?? t('inventory.units')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.minimumStock')}
                </Typography>
                <Typography variant="subtitle2">{product.minStock} {product.unit ?? t('inventory.units')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.stockValueBuy')}
                </Typography>
                <Typography variant="subtitle2">
                  {fCurrency(product.stock * product.buyingPrice)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.stockValueSell')}
                </Typography>
                <Typography variant="subtitle2" color="success.main">
                  {fCurrency(product.stock * product.sellPrice)}
                </Typography>
              </Box>
              {product.expiryDate && (() => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const exp = new Date(product.expiryDate);
                const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
                const color = daysLeft < 0 ? 'error.main' : daysLeft <= 30 ? 'warning.main' : 'success.main';
                return (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('inventory.expiryDate')}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" sx={{ color }}>
                          {exp.toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color }}>
                          {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                  </>
                );
              })()}
              <Divider />
              <Button
                variant="contained"
                fullWidth
                startIcon={<Iconify icon="solar:box-bold-duotone" width={20} />}
                onClick={() => setStockDialogOpen(true)}
              >
                {t('inventory.adjustStock')}
              </Button>
            </Box>
          </Card>

          {/* FIFO Batches — only shown when product has multiple batches */}
          {product.batches && product.batches.length > 1 && (
            <Card sx={{ mt: 3 }}>
              <CardHeader
                title={t('inventory.fifoBatches')}
                subheader={t('inventory.fifoBatchesSubheader')}
                avatar={
                  <Box
                    sx={{
                      width: 40, height: 40, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', borderRadius: 1,
                      bgcolor: alpha(theme.palette.info.main, 0.16), color: 'info.main',
                    }}
                  >
                    <Iconify icon="solar:layers-minimalistic-bold-duotone" width={22} />
                  </Box>
                }
              />
              <Divider />
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {product.batches.map((batch, idx) => {
                  const isCurrent = idx === 0;
                  const batchMargin = batch.buyingPrice > 0
                    ? ((batch.sellPrice - batch.buyingPrice) / batch.buyingPrice) * 100
                    : 0;
                  return (
                    <Box
                      key={batch.id}
                      sx={{
                        p: 1.5, borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: isCurrent ? 'info.light' : 'divider',
                        bgcolor: isCurrent
                          ? alpha(theme.palette.info.main, 0.06)
                          : alpha(theme.palette.grey[500], 0.04),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Label color={isCurrent ? 'info' : 'default'} sx={{ fontSize: 11 }}>
                          {isCurrent
                            ? t('inventory.fifoBatchCurrent')
                            : t('inventory.fifoBatchUpcoming', { n: idx + 1 })}
                        </Label>
                        <Typography variant="caption" color="text.secondary">
                          {t('inventory.fifoBatchQty', { qty: batch.quantity, unit: product.unit ?? t('inventory.units') })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t('inventory.fifoBatchBuy')}</Typography>
                          <Typography variant="subtitle2">{fCurrency(batch.buyingPrice)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t('inventory.fifoBatchSell')}</Typography>
                          <Typography variant="subtitle2" color="success.main">{fCurrency(batch.sellPrice)}</Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                          <Typography variant="caption" color="text.secondary">{t('inventory.margin')}</Typography>
                          <Typography variant="subtitle2" color={batchMargin >= 0 ? 'success.main' : 'error.main'}>
                            {batchMargin.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Stock Dialog */}
      {stockDialogOpen && (
        <InventoryStockDialog
          open={stockDialogOpen}
          product={product}
          onClose={() => setStockDialogOpen(false)}
          onSubmit={handleStockSubmit}
        />
      )}
    </DashboardContent>
  );
}
