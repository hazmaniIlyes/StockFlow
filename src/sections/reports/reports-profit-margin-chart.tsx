import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { useTranslation } from 'src/contexts';
import { Chart, useChart } from 'src/components/chart';

// ======================================================================

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    categories: string[];
    series: number[];
    options?: ChartOptions;
  };
};

export function ReportsProfitMarginChart({ title, subheader, chart, sx, ...other }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const chartOptions = useChart({
    colors: [theme.palette.success.main],
    stroke: { width: 3, curve: 'smooth' },
    xaxis: { categories: chart.categories },
    yaxis: {
      labels: {
        formatter: (value: number) => `${value.toFixed(1)}%`,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toFixed(1)}%`,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    ...chart.options,
  });

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Chart
        type="area"
        series={[{ name: t('reports.profitMargin'), data: chart.series }]}
        options={chartOptions}
        sx={{ py: 2.5, px: 1, height: 400 }}
      />
    </Card>
  );
}
