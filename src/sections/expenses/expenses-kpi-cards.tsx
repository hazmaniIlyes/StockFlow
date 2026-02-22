import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type KpiItem = {
  title: string;
  value: string;
  icon: string;
  color: 'primary' | 'error' | 'warning' | 'info' | 'success';
};

type Props = {
  thisMonth: number;
  lastMonth: number;
  yearTotal: number;
};

export function ExpensesKpiCards({ thisMonth, lastMonth, yearTotal }: Props) {
  const theme = useTheme();

  const diff = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  const kpis: KpiItem[] = [
    {
      title: 'This Month',
      value: fCurrency(thisMonth),
      icon: 'solar:calendar-bold-duotone',
      color: 'error',
    },
    {
      title: 'Last Month',
      value: fCurrency(lastMonth),
      icon: 'solar:calendar-date-bold-duotone',
      color: 'warning',
    },
    {
      title: 'Year Total',
      value: fCurrency(yearTotal),
      icon: 'solar:chart-2-bold-duotone',
      color: 'info',
    },
  ];

  return (
    <Grid container spacing={3}>
      {kpis.map((kpi) => (
        <Grid key={kpi.title} size={{ xs: 12, sm: 4 }}>
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
              {kpi.title === 'This Month' && lastMonth > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <Iconify
                    icon={diff >= 0 ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                    width={14}
                    sx={{ color: diff >= 0 ? 'error.main' : 'success.main' }}
                  />
                  <Typography
                    variant="caption"
                    color={diff >= 0 ? 'error.main' : 'success.main'}
                  >
                    {Math.abs(diff).toFixed(1)}% vs last month
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
