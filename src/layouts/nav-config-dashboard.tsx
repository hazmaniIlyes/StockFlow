import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const icon = (name: Parameters<typeof Iconify>[0]['icon']) => (
  <Iconify icon={name} width={24} />
);

export type NavItem = {
  titleKey: string; // Translation key
  title: string; // Fallback title
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData: NavItem[] = [
  {
    titleKey: 'nav.dashboard',
    title: 'Dashboard',
    path: '/',
    icon: icon('solar:home-angle-bold-duotone'),
  },
  {
    titleKey: 'nav.sales',
    title: 'Sales / Invoicing',
    path: '/sales',
    icon: icon('solar:bill-list-bold-duotone'),
  },
  {
    titleKey: 'nav.clients',
    title: 'Clients',
    path: '/clients',
    icon: icon('solar:users-group-rounded-bold-duotone'),
  },
  {
    titleKey: 'nav.inventory',
    title: 'Inventory',
    path: '/inventory',
    icon: icon('solar:box-bold-duotone'),
  },
  {
    titleKey: 'nav.suppliers',
    title: 'Suppliers',
    path: '/suppliers',
    icon: icon('solar:delivery-bold-duotone'),
  },
  {
    titleKey: 'nav.expenses',
    title: 'Expenses',
    path: '/expenses',
    icon: icon('solar:wallet-money-bold-duotone'),
  },
  {
    titleKey: 'nav.reports',
    title: 'Reports',
    path: '/reports',
    icon: icon('solar:chart-2-bold-duotone'),
  },
  {
    titleKey: 'nav.settings',
    title: 'Settings',
    path: '/settings',
    icon: icon('solar:settings-bold-duotone'),
  },
  {
    titleKey: 'nav.instructions',
    title: 'User Guide',
    path: '/instructions',
    icon: icon('solar:book-2-bold-duotone'),
  },
];
