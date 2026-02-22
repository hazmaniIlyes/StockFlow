import { CONFIG } from 'src/config-global';

import { SalesDetailView } from 'src/sections/sales/view/sales-detail-view';

// ----------------------------------------------------------------------

export default function SalesDetailPage() {
  return (
    <>
      <title>{`Invoice Details - ${CONFIG.appName}`}</title>

      <SalesDetailView />
    </>
  );
}
