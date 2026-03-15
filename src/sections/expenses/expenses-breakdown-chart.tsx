import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency } from 'src/utils/format-number';

import { useSettings } from 'src/contexts';

import { Chart, useChart, ChartLegends } from 'src/components/chart';

// ======================================================================

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    series: { label: string; value: number }[];
    options?: ChartOptions;
  };
};

export function ExpensesBreakdownChart({ title, subheader, chart, sx, ...other }: Props) {
  const { expenseCategories } = useSettings();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.series.map((item) => {
    const cat = expenseCategories.find((c) => c.label === item.label);
    return cat?.color ?? '#A29BFE';
  });

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: (value: number) => fCurrency(value),
        title: { formatter: (seriesName: string) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    ...chart.options,
  });

  return (
    <Card
      sx={[
        { display: 'flex', flexDirection: 'column', height: '100%' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <CardHeader title={title} subheader={subheader} sx={{ pb: 1 }} />

      <Chart
        type="pie"
        series={chartSeries}
        options={chartOptions}
        sx={{
          my: 2,
          mx: 'auto',
          width: { xs: 200, xl: 240 },
          height: { xs: 200, xl: 240 },
        }}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />

      <ChartLegends
        labels={chartOptions?.labels}
        colors={chartOptions?.colors}
        sx={{ p: 1, px: 1.5, justifyContent: 'center' }}
      />
    </Card>
  );
}
