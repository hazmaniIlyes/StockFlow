import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fCurrency, fNumber, fPercent } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total: number;
  percent: number;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  isCurrency?: boolean;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function AnalyticsWidgetSecondary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  isCurrency = false,
  ...other
}: Props) {
  const theme = useTheme();

  const chartColors = [theme.palette.text.secondary];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    xaxis: { categories: chart.categories },
    grid: {
      padding: {
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
      },
    },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    markers: {
      strokeWidth: 0,
    },
    ...chart.options,
  });

  const renderTrending = () => (
    <Box
      sx={{
        top: 8,
        gap: 0.25,
        insetInlineEnd: 8,
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
      }}
    >
      <Iconify width={14} icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />
      <Box component="span" sx={{ typography: 'caption', fontSize: '0.7rem' }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
    </Box>
  );

  return (
    <Card
      sx={[
        (theme) => ({
          p: 1.5,
          height: '100%',
          boxShadow: theme.vars.customShadows.z4,
          position: 'relative',
          color: 'text.secondary',
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.vars.palette.divider}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ color: `${color}.main`, mb: 1.5 }}>
        {icon}
      </Box>

      {renderTrending()}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              mb: 0.25,
              typography: 'subtitle2',
              fontSize: '0.875rem',
              color: 'text.primary',
              fontWeight: 600,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Box>

          <Box sx={{ typography: 'body2', fontWeight: 600 }}>{isCurrency ? fCurrency(total) : fNumber(total)}</Box>
        </Box>

        <Chart
          type="line"
          series={[{ data: chart.series }]}
          options={chartOptions}
          sx={{ flexShrink: 0, width: 50, height: 32 }}
        />
      </Box>
    </Card>
  );
}
