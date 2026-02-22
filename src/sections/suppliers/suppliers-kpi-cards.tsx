import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type KpiItem = {
  title: string;
  value: string;
  icon: string;
  color: 'primary' | 'error' | 'warning' | 'info';
};

type Props = {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOwed: number;
  totalPurchased: number;
};

export function SuppliersKpiCards({ totalSuppliers, activeSuppliers, totalOwed, totalPurchased }: Props) {
  const theme = useTheme();

  const kpis: KpiItem[] = [
    {
      title: 'Total Suppliers',
      value: fNumber(totalSuppliers),
      icon: 'solar:box-bold-duotone',
      color: 'primary',
    },
    {
      title: 'Active Suppliers',
      value: fNumber(activeSuppliers),
      icon: 'solar:check-circle-bold-duotone',
      color: 'info',
    },
    {
      title: 'Total Owed',
      value: fCurrency(totalOwed),
      icon: 'solar:wallet-money-bold-duotone',
      color: 'error',
    },
    {
      title: 'Total Purchased',
      value: fCurrency(totalPurchased),
      icon: 'solar:clipboard-list-bold-duotone',
      color: 'warning',
    },
  ];

  return (
    <Grid container spacing={3}>
      {kpis.map((kpi) => (
        <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              height: '100%',
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                backgroundColor: `${kpi.color}.lighter`,
                color: `${kpi.color}.main`,
                flexShrink: 0,
              }}
            >
              <Iconify icon={kpi.icon} width={32} />
            </Box>

            <Box>
              <Box sx={{ typography: 'subtitle2', color: 'text.secondary', mb: 0.5 }}>
                {kpi.title}
              </Box>
              <Box sx={{ typography: 'h5' }}>{kpi.value}</Box>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
