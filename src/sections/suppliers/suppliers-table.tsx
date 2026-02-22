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

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

type Props = {
  suppliers: Supplier[];
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onRecordPayment: (supplier: Supplier) => void;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function SuppliersTable({ suppliers, onView, onEdit, onDelete, onRecordPayment }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    let result = suppliers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    return result;
  }, [suppliers, search, statusFilter]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuSupplier(supplier);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuSupplier(null);
  };

  const handleAction = (action: (supplier: Supplier) => void) => {
    if (menuSupplier) action(menuSupplier);
    handleCloseMenu();
  };

  return (
    <Card>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search suppliers..."
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
        <TableContainer sx={{ minWidth: 900 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell align="right">Total Purchased</TableCell>
                <TableCell align="right">Total Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="center">Credit Status</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No suppliers found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  hover
                  onClick={() => onView(supplier)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{supplier.name}</Box>
                    <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                      {supplier.address}
                    </Box>
                  </TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell align="center">{supplier.catalog.length}</TableCell>
                  <TableCell align="right">{fCurrency(supplier.totalPurchased)}</TableCell>
                  <TableCell align="right">{fCurrency(supplier.totalPaid)}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        typography: 'subtitle2',
                        color: supplier.totalOwed > 0 ? 'error.main' : 'text.primary',
                      }}
                    >
                      {fCurrency(supplier.totalOwed)}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Label color={supplier.totalOwed > 0 ? 'error' : 'success'}>
                      {supplier.totalOwed > 0 ? 'Unpaid' : 'Paid'}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <Label color={supplier.status === 'active' ? 'success' : 'default'}>
                      {supplier.status === 'active' ? 'Active' : 'Inactive'}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => handleOpenMenu(e, supplier)}>
                      <Iconify icon="solar:menu-dots-bold" width={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
        <MenuItem onClick={() => handleAction(onView)}>
          <ListItemIcon><Iconify icon="solar:eye-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        {menuSupplier && menuSupplier.totalOwed > 0 && (
          <MenuItem onClick={() => handleAction(onRecordPayment)}>
            <ListItemIcon><Iconify icon="solar:wallet-money-bold-duotone" width={20} /></ListItemIcon>
            <ListItemText>Record Payment</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction(onEdit)}>
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuSupplier) onDelete(menuSupplier.id);
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
