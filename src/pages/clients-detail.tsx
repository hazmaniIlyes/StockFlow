import { CONFIG } from 'src/config-global';

import { ClientsDetailView } from 'src/sections/clients/view/clients-detail-view';

// ----------------------------------------------------------------------

export default function ClientsDetailPage() {
  return (
    <>
      <title>{`Client Details - ${CONFIG.appName}`}</title>

      <ClientsDetailView />
    </>
  );
}
