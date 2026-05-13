import type { Invoice } from 'src/_mock/_data';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { fDateLocale } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslation } from 'src/contexts';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ExportButtons } from 'src/components/export-buttons';

// ======================================================================

type Props = {
  invoices: Invoice[];
  onRowClick: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onPrint: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
};

export function SalesInvoiceList({
  invoices,
  onRowClick,
  onEdit,
  onDelete,
  onPrint,
  onRecordPayment,
  onMarkAsPaid,
}: Props) {
  const { t, dir, language } = useTranslation();
  const numLocale = language === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const dateLocale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en';
  const fmtCurrency = (v: any) => `${Number(v).toLocaleString(numLocale)} ${language === 'ar' ? 'دج' : 'DA'}`;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'wholesale' | 'retail'>('all');

  const WALKIN_NAMES = ['Walk-in Customer', 'Client de passage', 'زبون عابر'];
  const displayClientName = (name: string) =>
    WALKIN_NAMES.includes(name) ? t('sales.walkInCustomer') : name;

  const STATUS_OPTIONS = [
    { value: 'all', label: t('common.all') },
    { value: 'paid', label: t('sales.paid') },
    { value: 'partly-paid', label: t('sales.partial') },
    { value: 'unpaid', label: t('sales.unpaid') },
  ];

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuInvoice, setMenuInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuInvoice(null);
  };

  const filtered = useMemo(() => {
    let result = invoices;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) || inv.client.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((inv) => {
        const isRetail = inv.type === 'retail' || WALKIN_NAMES.includes(inv.client.name);
        return typeFilter === 'retail' ? isRetail : !isRetail;
      });
    }

    return result;
  }, [invoices, search, statusFilter, typeFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(0); };
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => { setStatusFilter(e.target.value); setPage(0); };
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => { setTypeFilter(e.target.value as 'all' | 'wholesale' | 'retail'); setPage(0); };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const statusColor = (status: Invoice['status']) => {
    if (status === 'paid') return 'success';
    if (status === 'partly-paid') return 'warning';
    return 'error';
  };

  const statusLabel = (status: Invoice['status']) => {
    if (status === 'paid') return t('sales.paid');
    if (status === 'partly-paid') return t('sales.partial');
    return t('sales.unpaid');
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('common.search')}
          value={search}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:magnifer-bold-duotone"
                    width={20}
                    sx={{ color: 'text.disabled' }}
                  />
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
          sx={{ minWidth: 140 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          value={typeFilter}
          onChange={handleTypeChange}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="wholesale">{t('sales.wholesaleTab')}</MenuItem>
          <MenuItem value="retail">{t('sales.retailTab')}</MenuItem>
        </TextField>

        <ExportButtons
          data={filtered}
          columns={[
            { label: t('sales.invoiceNumber'), key: 'invoiceNumber' },
            { label: t('sales.client'), key: 'client', format: (v) => v?.name ?? '' },
            { label: t('common.date'), key: 'createdAt' },
            { label: t('common.total'), key: 'total', format: fmtCurrency },
            { label: t('sales.amountPaid'), key: 'amountPaid', format: fmtCurrency },
            { label: t('sales.amountDue'), key: 'amountDue', format: fmtCurrency },
            { label: t('common.status'), key: 'status', format: (v) => v === 'paid' ? t('sales.paid') : v === 'partly-paid' ? t('sales.partial') : t('sales.unpaid') },
          ]}
          fileName="sales-invoices"
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ minWidth: 720 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('sales.invoiceNumber')}</TableCell>
                <TableCell>{t('sales.client')}</TableCell>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell align="right">{t('common.total')}</TableCell>
                <TableCell align="right">{t('sales.paid')}</TableCell>
                <TableCell align="right">{t('sales.amountDue')}</TableCell>
                <TableCell align="center">{t('common.status')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('sales.noInvoices')}
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  onClick={() => onRowClick(invoice)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{invoice.invoiceNumber}</Box>
                  </TableCell>
                  <TableCell>{displayClientName(invoice.client.name)}</TableCell>
                  <TableCell>{fDateLocale(invoice.createdAt, dateLocale)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ typography: 'subtitle2' }}>{fCurrency(invoice.total)}</Box>
                  </TableCell>
                  <TableCell align="right">{fCurrency(invoice.amountPaid)}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        typography: 'subtitle2',
                        color: invoice.amountDue > 0 ? 'error.main' : 'text.primary',
                      }}
                    >
                      {fCurrency(invoice.amountDue)}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Label color={statusColor(invoice.status)}>{statusLabel(invoice.status)}</Label>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, invoice)}
                      >
                        <Iconify icon="solar:menu-dots-bold" width={20} />
                      </IconButton>
                    </Tooltip>
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

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menuInvoice) onEdit(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:pen-bold-duotone" width={20} />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuInvoice) onPrint(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Iconify icon="solar:printer-bold-duotone" width={20} />
          </ListItemIcon>
          <ListItemText>{t('common.print')}</ListItemText>
        </MenuItem>

        {menuInvoice && menuInvoice.status !== 'paid' && (
          <>
            <MenuItem
              onClick={() => {
                onRecordPayment(menuInvoice);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <Iconify icon="solar:wallet-money-bold-duotone" width={20} sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText>{t('sales.recordPayment')}</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => {
                onMarkAsPaid(menuInvoice);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <Iconify icon="solar:check-circle-bold-duotone" width={20} sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText>{t('sales.markAsPaid')}</ListItemText>
            </MenuItem>
          </>
        )}

        <MenuItem
          onClick={() => {
            if (menuInvoice) onDelete(menuInvoice.id);
            handleMenuClose();
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
