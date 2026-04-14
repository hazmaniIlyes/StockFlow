import 'src/global.css';

import { useEffect } from 'react';

import { Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { usePathname } from 'src/routes/hooks';

import { SnackbarProvider } from 'src/components/snackbar';

import { BusinessProvider, ClientsProvider, ExpensesProvider, I18nProvider, InventoryProvider, SettingsProvider, SuppliersProvider, GlobalScanProvider } from 'src/contexts';

import { InvoiceProvider } from 'src/sections/sales/context';

import { ThemeProvider } from 'src/theme/theme-provider';
import { isOnboardingComplete } from 'src/sections/onboarding/onboarding-view';
import { GlobalBarcodeScanListener } from 'src/hooks/use-global-barcode-scan';

// ----------------------------------------------------------------------

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onboardingDone = isOnboardingComplete();

  if (!onboardingDone && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboardingDone && pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <I18nProvider>
      <SettingsProvider>
        <ThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider>
            <BusinessProvider>
              <ClientsProvider>
                <SuppliersProvider>
                  <ExpensesProvider>
                    <InventoryProvider>
                      <InvoiceProvider>
                        <GlobalScanProvider>
                          <OnboardingGuard>
                            <GlobalBarcodeScanListener />
                            {children}
                          </OnboardingGuard>
                        </GlobalScanProvider>
                      </InvoiceProvider>
                    </InventoryProvider>
                  </ExpensesProvider>
                </SuppliersProvider>
              </ClientsProvider>
            </BusinessProvider>
          </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </I18nProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
