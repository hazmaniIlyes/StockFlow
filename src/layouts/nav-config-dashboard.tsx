import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const icon = (name: Parameters<typeof Iconify>[0]['icon']) => (
  <Iconify icon={name} width={24} />
);

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('solar:home-angle-bold-duotone'),
  },
  {
    title: 'Sales / Invoicing',
    path: '/sales',
    icon: icon('solar:bill-list-bold-duotone'),
  },
  {
    title: 'Clients',
    path: '/clients',
    icon: icon('solar:users-group-rounded-bold-duotone'),
  },
  {
    title: 'Inventory',
    path: '/inventory',
    icon: icon('solar:box-bold-duotone'),
  },
  {
    title: 'Suppliers',
    path: '/suppliers',
    icon: icon('solar:delivery-bold-duotone'),
  },
  {
    title: 'Expenses',
    path: '/expenses',
    icon: icon('solar:wallet-money-bold-duotone'),
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: icon('solar:chart-2-bold-duotone'),
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: icon('solar:settings-bold-duotone'),
  },
];
