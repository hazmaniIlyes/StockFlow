import { CONFIG } from 'src/config-global';

import { SuppliersView } from 'src/sections/suppliers/view/suppliers-view';

// ----------------------------------------------------------------------

export default function SuppliersPage() {
  return (
    <>
      <title>{`Suppliers - ${CONFIG.appName}`}</title>
      <SuppliersView />
    </>
  );
}
