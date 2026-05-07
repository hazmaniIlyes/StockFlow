import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type Props = CardProps & {
  title: string;
  total: number;
  profit?: number;
  count?: number;
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
};

export function SalesSummaryCard({
  title,
  total,
  profit,
  count,
  icon,
  color = 'primary',
  sx,
  ...other
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card
      sx={[
        {
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: '100%',
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 2,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1.5,
          backgroundColor: alpha(theme.palette[color].main, 0.16),
          color: `${color}.main`,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={32} />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ typography: 'subtitle2', color: 'text.secondary', mb: 0.5 }}>{title}</Box>
        <Box sx={{ typography: 'h5' }}>{fCurrency(total)}</Box>
        {profit !== undefined && (
          <Box sx={{ typography: 'caption', color: 'success.main', mt: 0.25 }}>
            {t('common.net')}: {fCurrency(profit)}
          </Box>
        )}
      </Box>

      {count !== undefined && (
        <Box
          sx={{
            typography: 'h6',
            color: 'text.secondary',
            textAlign: 'center',
            minWidth: 40,
          }}
        >
          <Box sx={{ typography: 'caption', color: 'text.disabled' }}>#</Box>
          {fNumber(count)}
        </Box>
      )}
    </Card>
  );
}
