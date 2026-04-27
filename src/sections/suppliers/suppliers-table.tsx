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

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { ExportButtons } from 'src/components/export-buttons';

import type { Supplier } from 'src/_mock/_data';

// ======================================================================

type Props = {
  suppliers: Supplier[];
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onRecordPayment: (supplier: Supplier) => void;
};

export function SuppliersTable({ suppliers, onView, onEdit, onDelete, onRecordPayment }: Props) {
  const { t, dir, language } = useTranslation();
  const numLocale = language === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const fmtCurrency = (v: any) => `${Number(v).toLocaleString(numLocale)} ${language === 'ar' ? 'دج' : 'DA'}`;

  const STATUS_OPTIONS = [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('common.active') },
    { value: 'inactive', label: t('common.inactive') },
  ];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(0); };
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => { setStatusFilter(e.target.value); setPage(0); };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
    <Card sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('suppliers.searchSuppliers')}
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
            { label: t('suppliers.companyName'), key: 'name' },
            { label: t('common.phone'), key: 'phone' },
            { label: t('common.email'), key: 'email' },
            { label: t('suppliers.totalPurchased'), key: 'totalPurchased', format: fmtCurrency },
            { label: t('suppliers.totalOwed'), key: 'totalOwed', format: fmtCurrency },
            { label: t('common.status'), key: 'status', format: (v) => v === 'active' ? t('common.active') : t('common.inactive') },
          ]}
          fileName="suppliers"
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ minWidth: 900 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.phone')}</TableCell>
                <TableCell>{t('common.email')}</TableCell>
                <TableCell align="center">{t('suppliers.products')}</TableCell>
                <TableCell align="right">{t('suppliers.totalPurchased')}</TableCell>
                <TableCell align="right">{t('suppliers.totalPaid')}</TableCell>
                <TableCell align="right">{t('suppliers.remaining')}</TableCell>
                <TableCell align="center">{t('suppliers.creditStatus')}</TableCell>
                <TableCell align="center">{t('common.status')}</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('suppliers.noSuppliersFound')}
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((supplier) => (
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
                    <Label color={supplier.totalOwed <= 0 ? 'success' : supplier.totalPaid > 0 ? 'warning' : 'error'}>
                      {supplier.totalOwed <= 0 ? t('suppliers.paid') : supplier.totalPaid > 0 ? t('sales.partial') : t('suppliers.unpaid')}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <Label color={supplier.status === 'active' ? 'success' : 'default'}>
                      {supplier.status === 'active' ? t('common.active') : t('common.inactive')}
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
        <MenuItem onClick={() => handleAction(onView)}>
          <ListItemIcon><Iconify icon="solar:eye-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('common.view')}</ListItemText>
        </MenuItem>
        {menuSupplier && menuSupplier.totalOwed > 0 && (
          <MenuItem onClick={() => handleAction(onRecordPayment)}>
            <ListItemIcon><Iconify icon="solar:wallet-money-bold-duotone" width={20} /></ListItemIcon>
            <ListItemText>{t('suppliers.recordPayment')}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction(onEdit)}>
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
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
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
