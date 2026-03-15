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
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { ExportButtons } from 'src/components/export-buttons';

import type { Client, Invoice } from 'src/_mock/_data';

// ======================================================================

type Props = {
  clients: Client[];
  invoices: Invoice[];
  onView: (client: Client) => void;
  onViewInvoices: (client: Client) => void;
  onRecordPayment: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
};

export function ClientsTable({ clients, invoices, onView, onViewInvoices, onRecordPayment, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const { role } = useSettings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuClient, setMenuClient] = useState<Client | null>(null);

  const statusOptions = useMemo(() => [
    { value: 'all', label: t('common.all') },
    { value: 'paid', label: t('sales.paid') },
    { value: 'unpaid', label: t('sales.unpaid') },
  ], [t]);

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

    return [...result].sort((a, b) => {
      const aTime = parseInt(a.id.replace('client-', ''), 10);
      const bTime = parseInt(b.id.replace('client-', ''), 10);
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime;
      return 0;
    });
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

  // Per-client nearest unpaid due date derived from invoices
  const clientDueMap = useMemo(() => {
    const map = new Map<string, { date: Date; label: string }>();
    const now = new Date();
    invoices.forEach((inv) => {
      if (inv.amountDue <= 0 || !inv.dueDate) return;
      const due = new Date(inv.dueDate);
      if (Number.isNaN(due.getTime())) return;
      const existing = map.get(inv.client.name);
      if (!existing || due < existing.date) {
        map.set(inv.client.name, { date: due, label: inv.dueDate });
      }
    });
    return map;
  }, [invoices]);

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
          placeholder={t('clients.searchClients')}
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
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <ExportButtons
          data={filtered}
          columns={[
            { label: t('clients.name'), key: 'name' },
            { label: t('clients.phone'), key: 'phone' },
            { label: t('clients.totalPurchases'), key: 'totalPurchases' },
            { label: t('clients.totalPaid'), key: 'totalPaid' },
            ...(role !== 'worker' ? [{ label: t('clients.remainingBalance'), key: 'remainingBalance' }] : []),
            { label: t('clients.lastInvoiceDate'), key: 'lastInvoiceDate' },
            { label: t('common.status'), key: 'status' },
          ]}
          fileName="clients"
        />
      </Box>

      {/* Table */}
      <Scrollbar>
        <TableContainer sx={{ minWidth: 900 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.phone')}</TableCell>
                <TableCell align="right">{t('clients.totalPurchases')}</TableCell>
                <TableCell align="right">{t('clients.totalPaid')}</TableCell>
                {role !== 'worker' && <TableCell align="right">{t('clients.remaining')}</TableCell>}
                <TableCell>{t('clients.lastInvoice')}</TableCell>
                <TableCell>{t('common.dueDate') || 'Due Date'}</TableCell>
                <TableCell align="center">{t('common.status')}</TableCell>
                <TableCell align="center" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={role === 'worker' ? 7 : 8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('clients.noClientsFound')}
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
                  {role !== 'worker' && (
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
                  )}
                  <TableCell>{fDate(client.lastInvoiceDate)}</TableCell>
                  <TableCell>
                    {(() => {
                      const entry = clientDueMap.get(client.name);
                      if (!entry) return <Typography variant="caption" color="text.disabled">—</Typography>;
                      const now = new Date();
                      const diffDays = Math.ceil((entry.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = diffDays < 0;
                      const isSoon = diffDays >= 0 && diffDays <= 7;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Iconify
                            icon={isOverdue ? 'solar:danger-triangle-bold' : 'solar:calendar-bold-duotone'}
                            width={15}
                            sx={{ color: isOverdue ? 'error.main' : isSoon ? 'warning.main' : 'text.secondary' }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: isOverdue || isSoon ? 700 : 400, color: isOverdue ? 'error.main' : isSoon ? 'warning.main' : 'text.primary' }}
                          >
                            {isOverdue ? `Overdue ${Math.abs(diffDays)}d` : isSoon ? `Due in ${diffDays}d` : fDate(entry.label)}
                          </Typography>
                        </Box>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <Label color={client.status === 'paid' ? 'success' : 'error'}>
                      {client.status === 'paid' ? t('sales.paid') : t('sales.unpaid')}
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
          <ListItemText>{t('common.view')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onViewInvoices)}>
          <ListItemIcon><Iconify icon="solar:bill-list-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('clients.viewInvoices')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onRecordPayment)}>
          <ListItemIcon><Iconify icon="solar:wallet-money-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('clients.recordPayment')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(onEdit)}>
          <ListItemIcon><Iconify icon="solar:pen-bold-duotone" width={20} /></ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuClient) onDelete(menuClient.id);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}
