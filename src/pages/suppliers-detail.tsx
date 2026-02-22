import { CONFIG } from 'src/config-global';

import { SuppliersDetailView } from 'src/sections/suppliers/view/suppliers-detail-view';

// ----------------------------------------------------------------------

export default function SuppliersDetailPage() {
  return (
    <>
      <title>{`Supplier Details - ${CONFIG.appName}`}</title>
      <SuppliersDetailView />
    </>
  );
}
