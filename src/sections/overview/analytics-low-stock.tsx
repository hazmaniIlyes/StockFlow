import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { fNumber } from 'src/utils/format-number';

import { Scrollbar } from 'src/components/scrollbar';
import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type LowStockItem = {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  status: 'critical' | 'warning';
};

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: LowStockItem[];
};

export function AnalyticsLowStock({
  title,
  subheader,
  list,
  sx,
  ...other
}: Props) {
  const criticalCount = list.filter((item) => item.status === 'critical').length;

  return (
    <Card
      sx={[
        { display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 350 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <CardHeader
        title={title}
        subheader={subheader || `${criticalCount} critical · ${list.length} total`}
      />

      <Scrollbar sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 360 }}>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((row) => {
              const stockPercent = (row.currentStock / row.minStock) * 100;

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Box
                      sx={{
                        typography: 'subtitle2',
                        maxWidth: 140,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.name}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(stockPercent, 100)}
                        color={row.status === 'critical' ? 'error' : 'warning'}
                        sx={{ flex: 1, height: 6, borderRadius: 1 }}
                      />
                      <Box
                        component="span"
                        sx={{ typography: 'caption', whiteSpace: 'nowrap', minWidth: 40 }}
                      >
                        {fNumber(row.currentStock)}/{fNumber(row.minStock)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Label color={row.status === 'critical' ? 'error' : 'warning'}>
                      {row.status}
                    </Label>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
