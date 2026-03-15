import { Iconify } from 'src/components/iconify';

import type { AccountPopoverProps } from './components/account-popover';

// ----------------------------------------------------------------------

export const _account: AccountPopoverProps['data'] = [
  {
    label: 'Home',
    titleKey: 'layout.home',
    href: '/',
    icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" />,
  },
  {
    label: 'Settings',
    titleKey: 'layout.settings',
    href: '/settings',
    icon: <Iconify width={22} icon="solar:settings-bold-duotone" />,
  },
];
