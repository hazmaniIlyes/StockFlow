import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';

import { useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { ExportButtons } from 'src/components/export-buttons';

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type Props = {
  products: InventoryProduct[];
  onView: (productId: string) => void;
  onEdit: (product: InventoryProduct) => void;
  onAdjustStock: (product: InventoryProduct) => void;
  onDelete: (productId: string) => void;
};

export function InventoryTable({ products, onView, onEdit, onAdjustStock, onDelete }: Props) {
  const { t, dir, language } = useTranslation();
  const numLocale = language === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const fmtCurrency = (v: any) => `${Number(v).toLocaleString(numLocale)} ${language === 'ar' ? 'دج' : 'DA'}`;
  const { role, productCategories } = useSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProduct, setMenuProduct] = useState<InventoryProduct | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const STATUS_OPTIONS = [
    { value: 'all', label: t('common.all') },
    { value: 'in-stock', label: t('inventory.inStock') },
    { value: 'low-stock', label: t('inventory.lowStock') },
    { value: 'out-of-stock', label: t('inventory.outOfStock') },
  ];

  const CATEGORY_OPTIONS = [
    { value: 'all', label: t('inventory.allCategories') },
    ...productCategories.map((cat) => ({ value: cat.label, label: cat.label })),
  ];

  const filtered = useMemo(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || // search by product name
          p.sku.toLowerCase().includes(q)     // search by SKU; supplierName removed — supplier filtering should be handled separately
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    return result;
  }, [products, search, statusFilter, categoryFilter]);

  // Reset to first page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(0); };
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => { setStatusFilter(e.target.value); setPage(0); };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => { setCategoryFilter(e.target.value); setPage(0); };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, product: InventoryProduct) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuProduct(product);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuProduct(null);
  };

  const handleAction = (action: (product: InventoryProduct) => void) => {
    if (menuProduct) action(menuProduct);
    handleCloseMenu();
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('inventory.searchProducts')}
          value={search}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={20} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          value={categoryFilter}
          onChange={handleCategoryChange}
          sx={{ minWidth: 150 }}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={handleStatusChange}
          sx={{ minWidth: 130 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <ExportButtons
          data={filtered}
          columns={[
            { label: t('inventory.sku'), key: 'sku' },
            { label: t('inventory.productName'), key: 'name' },
            { label: t('inventory.category'), key: 'category' },
            { label: t('inventory.supplier'), key: 'supplierName' },
            ...(role !== 'worker' ? [{ label: t('inventory.buyingPrice'), key: 'buyingPrice', format: fmtCurrency }] : []),
            { label: t('inventory.sellPrice'), key: 'sellPrice', format: fmtCurrency },
            { label: t('common.stock'), key: 'stock' },
            { label: t('inventory.minStock'), key: 'minStock' },
            { label: t('common.status'), key: 'status', format: (v) => v === 'in-stock' ? t('inventory.inStock') : v === 'low-stock' ? t('inventory.lowStock') : t('inventory.outOfStock') },
          ]}
          fileName="inventory"
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ minWidth: 1000 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('inventory.sku')}</TableCell>
                <TableCell>{t('inventory.productName')}</TableCell>
                <TableCell>{t('inventory.category')}</TableCell>
                <TableCell>{t('inventory.supplier')}</TableCell>
                {role !== 'worker' && <TableCell align="right">{t('inventory.buyingPrice')}</TableCell>}
                <TableCell align="right">{t('inventory.sellPrice')}</TableCell>
                {role !== 'worker' && <TableCell align="right">{t('inventory.margin')}</TableCell>}
                <TableCell align="center">{t('common.stock')}</TableCell>
                <TableCell align="center">{t('inventory.expiryDate')}</TableCell>
                <TableCell align="center">{t('common.status')}</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={role === 'worker' ? 9 : 11} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('inventory.noProductsFound')}
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((product) => {
                const margin =
                  product.buyingPrice > 0
                    ? ((product.sellPrice - product.buyingPrice) / product.buyingPrice) * 100
                    : 0;

                return (
                  <TableRow
                    key={product.id}
                    hover
                    onClick={() => onView(product.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                        {product.sku}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ typography: 'subtitle2' }}>{product.name}</Box>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
                        {product.supplierName}
                      </Box>
                    </TableCell>
                    {role !== 'worker' && <TableCell align="right">{fCurrency(product.buyingPrice)}</TableCell>}
                    <TableCell align="right">{fCurrency(product.sellPrice)}</TableCell>
                    {role !== 'worker' && (
                    <TableCell align="right">
                      <Box sx={{ typography: 'subtitle2', color: 'success.main' }}>
                        {margin.toFixed(1)}%
                      </Box>
                    </TableCell>
                    )}
                    <TableCell align="center">
                      <Box
                        sx={{
                          typography: 'subtitle2',
                          color:
                            product.stock === 0
                              ? 'error.main'
                              : product.stock <= product.minStock
                                ? 'warning.main'
                                : 'text.primary',
                        }}
                      >
                        {product.stock} {product.unit ?? 'pcs'}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {product.expiryDate ? (() => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const exp = new Date(product.expiryDate);
                        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
                        const color = daysLeft < 0 ? 'error.main' : daysLeft <= 30 ? 'warning.main' : 'text.secondary';
                        return (
                          <Box sx={{ typography: 'caption', color }}>
                            {exp.toLocaleDateString()}
                            {daysLeft < 0 && <Box component="span" sx={{ display: 'block', fontSize: 10 }}>Expired</Box>}
                            {daysLeft >= 0 && daysLeft <= 30 && <Box component="span" sx={{ display: 'block', fontSize: 10 }}>{daysLeft}d left</Box>}
                          </Box>
                        );
                      })() : <Box sx={{ typography: 'caption', color: 'text.disabled' }}>—</Box>}
                    </TableCell>
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
                          ? t('inventory.inStock')
                          : product.status === 'low-stock'
                            ? t('inventory.lowStock')
                            : t('inventory.outOfStock')}
                      </Label>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={(e) => handleOpenMenu(e, product)}>
                        <Iconify icon="solar:menu-dots-bold" width={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20]}
        labelRowsPerPage={t('common.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
        dir={dir}
      />

      {/* Kebab Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 200 } } }}
      >
        <MenuItem onClick={() => handleAction(onEdit)}>
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onAdjustStock)}>
          <ListItemIcon><Iconify icon="solar:sort-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('inventory.adjustStock')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuProduct) onDelete(menuProduct.id);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
