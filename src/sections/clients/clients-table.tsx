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
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import type { Client } from 'src/_mock/_data';

// ======================================================================

type Props = {
  clients: Client[];
  onView: (client: Client) => void;
  onViewInvoices: (client: Client) => void;
  onRecordPayment: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

export function ClientsTable({ clients, onView, onViewInvoices, onRecordPayment, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuClient, setMenuClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    let result = clients;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [clients, search, statusFilter]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, client: Client) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuClient(client);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuClient(null);
  };

  const handleAction = (action: (client: Client) => void) => {
    if (menuClient) action(menuClient);
    handleCloseMenu();
  };

  return (
    <Card>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search clients..."
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
                <TableCell align="right">Total Purchases</TableCell>
                <TableCell align="right">Total Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell>Last Invoice</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No clients found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((client) => (
                <TableRow
                  key={client.id}
                  hover
                  onClick={() => onView(client)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{client.name}</Box>
                  </TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell align="right">{fCurrency(client.totalPurchases)}</TableCell>
                  <TableCell align="right">{fCurrency(client.totalPaid)}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        typography: 'subtitle2',
                        color: client.remainingBalance > 0 ? 'error.main' : 'success.main',
                      }}
                    >
                      {fCurrency(client.remainingBalance)}
                    </Box>
                  </TableCell>
                  <TableCell>{fDate(client.lastInvoiceDate)}</TableCell>
                  <TableCell align="center">
                    <Label color={client.status === 'paid' ? 'success' : 'error'}>
                      {client.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </Label>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, client)}
                    >
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
        <MenuItem onClick={() => handleAction(onViewInvoices)}>
          <ListItemIcon><Iconify icon="solar:bill-list-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>View Invoices</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onRecordPayment)}>
          <ListItemIcon><Iconify icon="solar:wallet-money-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>Record Payment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onEdit)}>
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuClient) onDelete(menuClient.id);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
