import { CONFIG } from 'src/config-global';

import { ExpensesView } from 'src/sections/expenses/view';

// ----------------------------------------------------------------------

export default function ExpensesPage() {
  return (
    <>
      <title>{`Expenses - ${CONFIG.appName}`}</title>

      <ExpensesView />
    </>
  );
}
