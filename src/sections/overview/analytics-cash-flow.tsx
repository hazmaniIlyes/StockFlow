import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency } from 'src/utils/format-number';
import { Chart, useChart } from 'src/components/chart';

// ======================================================================

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    categories: string[];
    moneyIn: number[];
    moneyOut: number[];
    options?: ChartOptions;
  };
};

export function AnalyticsCashFlow({ title, subheader, chart, sx, ...other }: Props) {
  const theme = useTheme();

  const totalIn = chart.moneyIn.reduce((s, v) => s + v, 0);
  const totalOut = chart.moneyOut.reduce((s, v) => s + v, 0);
  const netFlow = totalIn - totalOut;

  const chartOptions = useChart({
    chart: { stacked: false },
    colors: [theme.palette.success.main, theme.palette.error.main],
    stroke: { width: 1, colors: [theme.vars.palette.background.paper] },
    xaxis: { categories: chart.categories },
    tooltip: {
      y: {
        formatter: (value: number) => fCurrency(value),
      },
    },
    plotOptions: {
      bar: {
        columnWidth: '48%',
        borderRadius: 4,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    ...chart.options,
  });

  return (
    <Card sx={sx} {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Box sx={{ textAlign: 'right', pr: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: netFlow >= 0 ? 'success.main' : 'error.main' }}
            >
              Net: {fCurrency(netFlow)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              In: {fCurrency(totalIn)} · Out: {fCurrency(totalOut)}
            </Typography>
          </Box>
        }
      />

      <Chart
        type="bar"
        series={[
          { name: 'Money In', data: chart.moneyIn },
          { name: 'Money Out', data: chart.moneyOut },
        ]}
        options={chartOptions}
        sx={{ py: 2.5, px: 1, height: 400 }}
      />
    </Card>
  );
}
