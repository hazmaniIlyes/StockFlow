import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import type { Invoice } from 'src/_mock/_data';

// ======================================================================

type Props = {
  invoices: Invoice[];
  onRowClick: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onPrint: (invoice: Invoice) => void;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'partly-paid', label: 'Partly Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

export function SalesInvoiceList({ invoices, onRowClick, onEdit, onDelete, onPrint }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = invoices;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.client.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    return result;
  }, [invoices, search, statusFilter]);

  const statusColor = (status: Invoice['status']) => {
    if (status === 'paid') return 'success';
    if (status === 'partly-paid') return 'warning';
    return 'error';
  };

  const statusLabel = (status: Invoice['status']) => {
    if (status === 'paid') return 'Paid';
    if (status === 'partly-paid') return 'Partly Paid';
    return 'Unpaid';
  };

  return (
    <Card>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search invoices..."
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
          sx={{ minWidth: 140 }}
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
        <TableContainer sx={{ minWidth: 720 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  onClick={() => onRowClick(invoice)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{invoice.invoiceNumber}</Box>
                  </TableCell>
                  <TableCell>{invoice.client.name}</TableCell>
                  <TableCell>{fDate(invoice.createdAt)}</TableCell>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(invoice);
                          }}
                        >
                          <Iconify icon="solar:pen-bold-duotone" width={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(invoice);
                          }}
                        >
                          <Iconify icon="solar:printer-bold-duotone" width={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(invoice.id);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
    </Card>
  );
}
