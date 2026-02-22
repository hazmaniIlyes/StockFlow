import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

// ======================================================================

type CardItem = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'primary' | 'error' | 'success' | 'warning' | 'info';
};

type Props = {
  revenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingBalance: number;
};

export function ReportsSummaryCards({ revenue, totalExpenses, netProfit, outstandingBalance }: Props) {
  const theme = useTheme();

  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';

  const cards: CardItem[] = [
    {
      title: 'Total Revenue',
      value: fCurrency(revenue),
      subtitle: 'From all invoices',
      icon: 'solar:wallet-money-bold-duotone',
      color: 'primary',
    },
    {
      title: 'Total Expenses',
      value: fCurrency(totalExpenses),
      subtitle: 'Suppliers + overhead',
      icon: 'solar:card-send-bold-duotone',
      color: 'error',
    },
    {
      title: 'Net Profit',
      value: fCurrency(netProfit),
      subtitle: `${profitMargin}% margin`,
      icon: 'solar:chart-bold-duotone',
      color: netProfit >= 0 ? 'success' : 'error',
    },
    {
      title: 'Outstanding Balance',
      value: fCurrency(outstandingBalance),
      subtitle: 'Client receivables − supplier payables',
      icon: 'solar:clock-circle-bold-duotone',
      color: 'warning',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
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
                backgroundColor: `${card.color}.lighter`,
                color: `${card.color}.main`,
                flexShrink: 0,
              }}
            >
              <Iconify icon={card.icon} width={28} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                {card.title}
              </Typography>
              <Typography variant="h5" noWrap>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {card.subtitle}
              </Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
