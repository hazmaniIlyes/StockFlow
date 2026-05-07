import type { CardProps } from '@mui/material/Card';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslation } from 'src/contexts';

// ----------------------------------------------------------------------

type SaleItem = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'shipped';
};

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: SaleItem[];
};

export function AnalyticsRecentSales({
  title,
  subheader,
  list,
  sx,
  ...other
}: Props) {
  const { t, dir } = useTranslation();
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const statusConfig = {
    completed: { label: t('sales.paid'), color: 'success' as const },
    pending: { label: t('sales.unpaid'), color: 'warning' as const },
    shipped: { label: t('sales.partial'), color: 'info' as const },
  };

  const paginated = list.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%', ...sx }} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />

      <TableContainer sx={{ minWidth: 680 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('sales.invoiceNumber')}</TableCell>
              <TableCell>{t('sales.client')}</TableCell>
              <TableCell align="right">{t('common.amount')}</TableCell>
              <TableCell>{t('common.date')}</TableCell>
              <TableCell align="center">{t('common.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {t('sales.noInvoices')}
                </TableCell>
              </TableRow>
            )}
            {paginated.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Box sx={{ typography: 'subtitle2' }}>{row.orderNumber}</Box>
                </TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell align="right">
                  <Box sx={{ typography: 'subtitle2' }}>{fCurrency(row.amount)}</Box>
                </TableCell>
                <TableCell>{fDate(row.date)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={statusConfig[row.status].label}
                    color={statusConfig[row.status].color}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={list.length}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        labelRowsPerPage={t('common.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
        dir={dir}
      />
    </Card>
  );
}
