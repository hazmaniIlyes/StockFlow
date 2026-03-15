import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { useTheme, alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

// ======================================================================

type Props = CardProps & {
  onAddProduct?: () => void;
  onAddSale?: () => void;
  onAddSupplier?: () => void;
  onViewReports?: () => void;
};

type ActionItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
};

export function AnalyticsQuickActions({
  sx,
  onAddProduct,
  onAddSale,
  onAddSupplier,
  onViewReports,
  ...other
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const actions: ActionItem[] = [
    { id: 'sale', label: t('dashboard.newInvoice'), icon: <Iconify icon="solar:bill-list-bold-duotone" width={28} />, color: 'primary', onClick: onAddSale },
    { id: 'product', label: t('dashboard.addProduct'), icon: <Iconify icon="solar:box-bold-duotone" width={28} />, color: 'info', onClick: onAddProduct },
    { id: 'supplier', label: t('dashboard.addSupplier'), icon: <Iconify icon="solar:delivery-bold-duotone" width={28} />, color: 'warning', onClick: onAddSupplier },
    { id: 'reports', label: t('dashboard.viewReports'), icon: <Iconify icon="solar:chart-bold-duotone" width={28} />, color: 'secondary', onClick: onViewReports },
  ];

  const getColorValue = (colorName: string) => {
    const colorMap: Record<string, string> = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      info: theme.palette.info.main,
      warning: theme.palette.warning.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
    };
    return colorMap[colorName] || theme.palette.primary.main;
  };

  return (
    <Card 
      sx={[
        { 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
        }, 
        ...(Array.isArray(sx) ? sx : [sx])
      ]} 
      {...other}
    >
      <CardHeader title={t('dashboard.quickActions')} />

      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid key={action.id} size={{ xs: 12, sm: 6 }}>
              <ButtonBase
                disableRipple
                onClick={action.onClick}
                sx={{
                  width: '100%',
                  p: 3.5,
                  position: 'relative',
                  borderRadius: 2,
                  backgroundImage: `linear-gradient(135deg, ${alpha(getColorValue(action.color), 0.04)} 0%, ${alpha(getColorValue(action.color), 0.01)} 100%)`,
                  border: `1px solid ${alpha(getColorValue(action.color), 0.1)}`,
                  boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.4), 0 2px 4px 0 rgba(0,0,0,0.02)`,
                  transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out, background-image 0.2s',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%)',
                    pointerEvents: 'none',
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    backgroundImage: `linear-gradient(135deg, ${alpha(getColorValue(action.color), 0.06)} 0%, ${alpha(getColorValue(action.color), 0.02)} 100%)`,
                    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.6), 0 4px 8px -2px ${alpha(getColorValue(action.color), 0.12)}`,
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.2), 0 1px 2px 0 rgba(0,0,0,0.02)`,
                  },
                }}
              >
                <Stack alignItems="center" spacing={1.5} sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      color: getColorValue(action.color),
                      background: `linear-gradient(135deg, ${alpha(getColorValue(action.color), 0.1)}, ${alpha(getColorValue(action.color), 0.02)})`,
                      boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.3), 0 1px 4px 0 ${alpha(getColorValue(action.color), 0.05)}`,
                      backdropFilter: 'blur(2px)',
                      border: `1px solid ${alpha(getColorValue(action.color), 0.08)}`,
                    }}
                  >
                    {action.icon}
                  </Box>

                  <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
                    {action.label}
                  </Typography>
                </Stack>
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Card>
  );
}
