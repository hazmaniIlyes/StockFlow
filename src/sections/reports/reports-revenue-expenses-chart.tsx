import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
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
    series: { name: string; data: number[] }[];
    options?: ChartOptions;
  };
};

export function ReportsRevenueExpensesChart({ title, subheader, chart, sx, ...other }: Props) {
  const theme = useTheme();

  const chartOptions = useChart({
    chart: { stacked: false },
    colors: [theme.palette.primary.main, theme.palette.error.main],
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
      <CardHeader title={title} subheader={subheader} />
      <Chart
        type="bar"
        series={chart.series}
        options={chartOptions}
        sx={{ py: 2.5, px: 1, height: 400 }}
      />
    </Card>
  );
}
