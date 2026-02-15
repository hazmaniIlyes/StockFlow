import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    series: {
      name: string;
      data: number[];
    }[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function AnalyticsStatsComparison({
  title,
  subheader,
  chart,
  sx,
  ...other
}: Props) {
  const theme = useTheme();

  const chartOptions = useChart({
    chart: { stacked: false },
    colors: [theme.palette.primary.main, theme.palette.secondary.main],
    stroke: { width: 1, colors: [theme.vars.palette.background.paper] },
    xaxis: { categories: chart.categories },
    tooltip: { theme: 'light' },
    plotOptions: {
      bar: {
        columnWidth: '48%',
        borderRadius: 4,
      },
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
        sx={{
          py: 2.5,
          px: 1,
          height: 400,
        }}
      />
    </Card>
  );
}
