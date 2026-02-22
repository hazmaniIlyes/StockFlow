import { CONFIG } from 'src/config-global';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

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
