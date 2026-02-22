import { CONFIG } from 'src/config-global';

import { ClientsView } from 'src/sections/clients/view/clients-view';

// ----------------------------------------------------------------------

export default function ClientsPage() {
  return (
    <>
      <title>{`Clients - ${CONFIG.appName}`}</title>

      <ClientsView />
    </>
  );
}
