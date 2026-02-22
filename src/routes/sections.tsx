import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
const SalesPage = lazy(() => import('src/pages/sales'));
const SalesDetailPage = lazy(() => import('src/pages/sales-detail'));
const ClientsPage = lazy(() => import('src/pages/clients'));
const ClientsDetailPage = lazy(() => import('src/pages/clients-detail'));
const InventoryPage = lazy(() => import('src/pages/inventory'));
const SuppliersPage = lazy(() => import('src/pages/suppliers'));
const SuppliersDetailPage = lazy(() => import('src/pages/suppliers-detail'));
const ExpensesPage = lazy(() => import('src/pages/expenses'));
const ReportsPage = lazy(() => import('src/pages/reports'));
const SettingsPage = lazy(() => import('src/pages/settings'));

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
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'suppliers/:id', element: <SuppliersDetailPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
];
