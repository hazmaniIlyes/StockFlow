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
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import type { InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type Props = {
  products: InventoryProduct[];
  onEdit: (product: InventoryProduct) => void;
  onAdjustStock: (product: InventoryProduct) => void;
  onDelete: (productId: string) => void;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'Peripherals', label: 'Peripherals' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Audio', label: 'Audio' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Cables', label: 'Cables' },
];

export function InventoryTable({ products, onEdit, onAdjustStock, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProduct, setMenuProduct] = useState<InventoryProduct | null>(null);

  const filtered = useMemo(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q)
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
    <Card>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          onChange={(e) => setCategoryFilter(e.target.value)}
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
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Table */}
      <Scrollbar>
        <TableContainer sx={{ minWidth: 1000 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Buying Price</TableCell>
                <TableCell align="right">Sell Price</TableCell>
                <TableCell align="right">Margin</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No products found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((product) => {
                const margin =
                  product.buyingPrice > 0
                    ? ((product.sellPrice - product.buyingPrice) / product.buyingPrice) * 100
                    : 0;

                return (
                  <TableRow key={product.id} hover>
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
                    <TableCell align="right">{fCurrency(product.buyingPrice)}</TableCell>
                    <TableCell align="right">{fCurrency(product.sellPrice)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ typography: 'subtitle2', color: 'success.main' }}>
                        {margin.toFixed(1)}%
                      </Box>
                    </TableCell>
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
                        {product.stock}
                      </Box>
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
                          ? 'In Stock'
                          : product.status === 'low-stock'
                            ? 'Low Stock'
                            : 'Out of Stock'}
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
      </Scrollbar>

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
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onAdjustStock)}>
          <ListItemIcon><Iconify icon="solar:sort-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>Adjust Stock</ListItemText>
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
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
