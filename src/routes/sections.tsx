import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { Outlet, Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { DashboardLayout } from 'src/layouts/dashboard';
import { useSettings } from 'src/contexts/settings-context';

// ----------------------------------------------------------------------

function WorkerGuard({ children }: { children: React.ReactNode }) {
  const { role } = useSettings();
  if (role === 'worker') return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
const OnboardingPage = lazy(() => import('src/pages/onboarding'));
const SalesPage = lazy(() => import('src/pages/sales'));
const SalesDetailPage = lazy(() => import('src/pages/sales-detail'));
const ClientsPage = lazy(() => import('src/pages/clients'));
const ClientsDetailPage = lazy(() => import('src/pages/clients-detail'));
const InventoryPage = lazy(() => import('src/pages/inventory'));
const SuppliersPage = lazy(() => import('src/pages/suppliers'));
const SuppliersDetailPage = lazy(() => import('src/pages/suppliers-detail'));
const InventoryDetailPage = lazy(() => import('src/pages/inventory-detail'));
const ExpensesPage = lazy(() => import('src/pages/expenses'));
const ReportsPage = lazy(() => import('src/pages/reports'));
const SettingsPage = lazy(() => import('src/pages/settings'));
const InstructionsPage = lazy(() => import('src/pages/instructions'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    path: 'onboarding',
    element: (
      <Suspense fallback={renderFallback()}>
        <OnboardingPage />
      </Suspense>
    ),
  },
  {
    element: (
      <DashboardLayout>
        <Suspense fallback={renderFallback()}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'sales/:id', element: <SalesDetailPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientsDetailPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/:id', element: <InventoryDetailPage /> },
      { path: 'suppliers', element: <WorkerGuard><SuppliersPage /></WorkerGuard> },
      { path: 'suppliers/:id', element: <WorkerGuard><SuppliersDetailPage /></WorkerGuard> },
      { path: 'expenses', element: <WorkerGuard><ExpensesPage /></WorkerGuard> },
      { path: 'reports', element: <WorkerGuard><ReportsPage /></WorkerGuard> },
      { path: 'settings', element: <WorkerGuard><SettingsPage /></WorkerGuard> },
      { path: 'instructions', element: <InstructionsPage /> },
    ],
  },
];
