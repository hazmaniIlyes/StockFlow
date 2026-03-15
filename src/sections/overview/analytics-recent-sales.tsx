import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { useTranslation } from 'src/contexts';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { Scrollbar } from 'src/components/scrollbar';

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
  const { t } = useTranslation();

  const statusConfig = {
    completed: { label: t('sales.paid'), color: 'success' as const },
    pending: { label: t('sales.unpaid'), color: 'warning' as const },
    shipped: { label: t('sales.partial'), color: 'info' as const },
  };

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />

      <Scrollbar>
        <Table sx={{ minWidth: 680 }}>
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
            {list.map((row) => (
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
      </Scrollbar>
    </Card>
  );
}
