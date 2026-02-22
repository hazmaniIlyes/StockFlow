import { CONFIG } from 'src/config-global';

import { SalesView } from 'src/sections/sales/view/sales-view';

// ----------------------------------------------------------------------

export default function SalesPage() {
  return (
    <>
      <title>{`Sales / Invoicing - ${CONFIG.appName}`}</title>

      <SalesView />
    </>
  );
}
