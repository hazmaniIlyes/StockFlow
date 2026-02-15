import type { CardProps } from '@mui/material/Card';

import { Receipt, Package, Truck, BarChart3 } from 'lucide-react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

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

  const actions: ActionItem[] = [
    { id: 'sale', label: 'Create Invoice', icon: <Receipt style={{ width: 28, height: 28 }} />, color: 'primary', onClick: onAddSale },
    { id: 'product', label: 'Add Product', icon: <Package style={{ width: 28, height: 28 }} />, color: 'info', onClick: onAddProduct },
    { id: 'supplier', label: 'Add Supplier', icon: <Truck style={{ width: 28, height: 28 }} />, color: 'warning', onClick: onAddSupplier },
    { id: 'reports', label: 'View Reports', icon: <BarChart3 style={{ width: 28, height: 28 }} />, color: 'secondary', onClick: onViewReports },
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
      <CardHeader title="Quick Actions" />

      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid key={action.id} size={{ xs: 12, sm: 6 }}>
              <ButtonBase
                onClick={action.onClick}
                sx={{
                  width: '100%',
                  p: 3.5,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.vars.palette.divider}`,
                  transition: theme.transitions.create(['background-color', 'border-color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  '&:hover': {
                    backgroundColor: theme.vars.palette.action.hover,
                    borderColor: getColorValue(action.color),
                  },
                }}
              >
                <Stack alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      backgroundColor: `${action.color}.lighter`,
                      color: getColorValue(action.color),
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
