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

import { useTranslation } from 'src/contexts';

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
  const { t } = useTranslation();
  const criticalCount = list.filter((item) => item.status === 'critical').length;

  const getStatusLabel = (status: 'critical' | 'warning') => {
    return status === 'critical' ? t('common.critical') : t('common.warning');
  };

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
        subheader={subheader || `${criticalCount} ${t('common.critical')} · ${list.length} ${t('common.total')}`}
      />

      <Scrollbar sx={{ flex: 1 }}>
        <Table sx={{ minWidth: 360 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.product')}</TableCell>
              <TableCell align="center">{t('common.stock')}</TableCell>
              <TableCell align="right">{t('common.status')}</TableCell>
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
                        maxWidth: 180,
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
                      {getStatusLabel(row.status)}
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
