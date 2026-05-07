import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export default function ProductsPage() {
  return (
    <>
      <title>{`Products - ${CONFIG.appName}`}</title>

      <Box sx={{ p: 5 }}>
        <Typography variant="h4">Products</Typography>
      </Box>
    </>
  );
}
