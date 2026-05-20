import 'src/global.css';

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { usePathname } from 'src/routes/hooks';

import { GlobalBarcodeScanListener } from 'src/hooks/use-global-barcode-scan';

import { ThemeProvider } from 'src/theme/theme-provider';
import { I18nProvider, ClientsProvider, BusinessProvider, ExpensesProvider, SettingsProvider, InventoryProvider, SuppliersProvider, GlobalScanProvider } from 'src/contexts';

import { SnackbarProvider } from 'src/components/snackbar';
import { DiskSpaceMonitor } from 'src/components/disk-space-monitor';

import { InvoiceProvider } from 'src/sections/sales/context';
import { isOnboardingComplete } from 'src/sections/onboarding/onboarding-view';
import { isActivationComplete } from 'src/sections/activation/activation-view';

// ----------------------------------------------------------------------

function ActivationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activationDone = isActivationComplete();

  if (!activationDone && pathname !== '/activation') {
    return <Navigate to="/activation" replace />;
  }
  if (activationDone && pathname === '/activation') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// ----------------------------------------------------------------------

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onboardingDone = isOnboardingComplete();

  // Let ActivationGuard handle the /activation route — don't interfere
  if (pathname === '/activation') return <>{children}</>;

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
                          <ActivationGuard>
                            <OnboardingGuard>
                              <GlobalBarcodeScanListener />
                              <DiskSpaceMonitor />
                              {children}
                            </OnboardingGuard>
                          </ActivationGuard>
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
