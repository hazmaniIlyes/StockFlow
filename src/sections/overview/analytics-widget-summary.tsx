import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent, fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total: number;
  percent: number;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  isCurrency?: boolean;
  hideValue?: boolean;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function AnalyticsWidgetSummary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  isCurrency = false,
  hideValue = false,
  ...other
}: Props) {
  const theme = useTheme();

  const chartColors = [theme.palette[color].dark];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    xaxis: { categories: chart.categories },
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
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

  const renderTrending = () =>
    hideValue ? null : (
      <Box
        sx={{
          top: 16,
          gap: 0.5,
          insetInlineEnd: 16,
          display: 'flex',
          position: 'absolute',
          alignItems: 'center',
        }}
      >
        <Iconify width={20} icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />
        <Box component="span" sx={{ typography: 'subtitle2' }}>
          {percent > 0 && '+'}
          {fPercent(percent)}
        </Box>
      </Box>
    );

  return (
    <Card
      sx={[
        (th) => {
          const isDark = th.palette.mode === 'dark';
          return {
            p: 3,
            height: '100%',
            position: 'relative',
            color: isDark ? `${color}.lighter` : `${color}.darker`,
            backgroundColor: isDark ? th.vars.palette.grey[900] : 'common.white',
            backgroundImage: isDark
              ? `linear-gradient(135deg, ${varAlpha(th.vars.palette[color].darkerChannel, 0.72)}, ${varAlpha(th.vars.palette[color].darkChannel, 0.48)})`
              : `linear-gradient(135deg, ${varAlpha(th.vars.palette[color].lighterChannel, 0.88)}, ${varAlpha(th.vars.palette[color].lightChannel, 0.56)})`,
            boxShadow: isDark
              ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.1), ${th.vars.customShadows.z4}`
              : `inset 0 1px 0 0 rgba(255, 255, 255, 0.9), ${th.vars.customShadows.z4}`,
            border: isDark
              ? `1px solid ${varAlpha(th.vars.palette[color].darkChannel, 0.32)}`
              : `1px solid ${varAlpha(th.vars.palette[color].lightChannel, 0.4)}`,
            borderRadius: 3,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark
                ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.18), ${th.vars.customShadows.z8}`
                : `inset 0 1px 0 0 rgba(255, 255, 255, 0.8), ${th.vars.customShadows.z8}`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 40%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%)',
              pointerEvents: 'none',
              borderRadius: 'inherit',
            },
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '14px',
          color: theme.palette.mode === 'dark' ? `${color}.light` : `${color}.dark`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].darkerChannel, 0.45)}, ${varAlpha(theme.vars.palette[color].darkChannel, 0.28)})`
            : `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].lightChannel, 0.2)}, ${varAlpha(theme.vars.palette[color].mainChannel, 0.12)})`,
          boxShadow: theme.palette.mode === 'dark'
            ? `inset 0 1px 0 0 rgba(255,255,255,0.12), 0 2px 8px 0 ${varAlpha(theme.vars.palette[color].mainChannel, 0.25)}`
            : `inset 0 1px 0 0 rgba(255,255,255,0.4), 0 2px 8px 0 ${varAlpha(theme.vars.palette[color].mainChannel, 0.1)}`,
          backdropFilter: 'blur(2px)',
          border: theme.palette.mode === 'dark'
            ? `1px solid ${varAlpha(theme.vars.palette[color].darkChannel, 0.3)}`
            : `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.2)}`,
        }}
      >
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
              mb: 1,
              typography: 'h6',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Box>

          <Box sx={{ typography: 'h4' }}>
            {hideValue ? '••••••' : isCurrency ? fCurrency(total) : fNumber(total)}
          </Box>
        </Box>

        {!hideValue && (
          <Chart
            type="line"
            series={[{ data: chart.series }]}
            options={chartOptions}
            sx={{ flexShrink: 0, width: 84, height: 56 }}
          />
        )}
      </Box>

      <SvgColor
        src="./assets/background/shape-square.svg"
        sx={{
          top: 0,
          insetInlineStart: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
