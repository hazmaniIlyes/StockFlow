import { CONFIG } from 'src/config-global';

import { InventoryView } from 'src/sections/inventory/view/inventory-view';

// ----------------------------------------------------------------------

export default function InventoryPage() {
  return (
    <>
      <title>{`Inventory - ${CONFIG.appName}`}</title>
      <InventoryView />
    </>
  );
}
