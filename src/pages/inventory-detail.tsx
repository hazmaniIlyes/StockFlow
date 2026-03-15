import { CONFIG } from 'src/config-global';

import { InventoryDetailView } from 'src/sections/inventory/view/inventory-detail-view';

// ----------------------------------------------------------------------

export default function InventoryDetailPage() {
  return (
    <>
      <title>{`Product Details - ${CONFIG.appName}`}</title>
      <InventoryDetailView />
    </>
  );
}
