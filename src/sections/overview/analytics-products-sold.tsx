import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type ProductItem = {
  id: string;
  name: string;
  quantity: number;
  amount: number;
};

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: ProductItem[];
  totalSold?: number;
};

export function AnalyticsProductsSold({
  title,
  subheader,
  list,
  totalSold = 0,
  sx,
  ...other
}: Props) {
  const totalQuantity = list.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = list.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card sx={[{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 350 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <CardHeader
        title={title}
        subheader={
          subheader || `Total: ${fNumber(totalQuantity)} units | ${fCurrency(totalRevenue)}`
        }
      />

      <Scrollbar sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 360 }}>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Box sx={{ typography: 'subtitle2', maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {row.name}
                  </Box>
                </TableCell>
                <TableCell align="right">{fNumber(row.quantity)}</TableCell>
                <TableCell align="right">
                  <Box sx={{ typography: 'subtitle2' }}>{fCurrency(row.amount)}</Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
