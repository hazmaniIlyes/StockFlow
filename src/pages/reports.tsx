import { CONFIG } from 'src/config-global';

import { ReportsView } from 'src/sections/reports/view';

// ----------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <>
      <title>{`Reports - ${CONFIG.appName}`}</title>

      <ReportsView />
    </>
  );
}
