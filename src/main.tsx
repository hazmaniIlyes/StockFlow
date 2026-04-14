import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createHashRouter, createBrowserRouter } from 'react-router'; // Import both routers — HashRouter for Electron, BrowserRouter for web dev

import App from './app';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';

// ----------------------------------------------------------------------

// Use HashRouter when running in Electron (file:// protocol doesn't support BrowserRouter)
// Use BrowserRouter when running in a normal browser (Vite dev server handles routing)
const isElectron = typeof window !== 'undefined' && typeof window.database !== 'undefined'; // Check if preload bridge exists
const createRouter = isElectron ? createHashRouter : createBrowserRouter; // Pick the right router based on environment

const RootLayout = () => (
  <App>
    <Outlet />
  </App>
);

const router = createRouter([
  {
    Component: RootLayout,
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

// Ensure the body can receive focus on navigation resets
document.body.tabIndex = -1;

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
