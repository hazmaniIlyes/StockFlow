import type { IconifyJSON } from '@iconify/react';

import { addCollection } from '@iconify/react';
import { icons as icIcons } from '@iconify-json/ic';
import { icons as evaIcons } from '@iconify-json/eva';
import { icons as solarIcons } from '@iconify-json/solar';
import { icons as carbonIcons } from '@iconify-json/carbon';
import { icons as mingcuteIcons } from '@iconify-json/mingcute';

import customIcons from './icon-sets';

// ----------------------------------------------------------------------

/**
 * Full icon set packages — gives offline access to thousands of icons.
 * Browse available icons at https://icon-sets.iconify.design/
 */
const iconPackages: IconifyJSON[] = [
  solarIcons,
  evaIcons,
  icIcons,
  mingcuteIcons,
  carbonIcons,
];

/**
 * Custom / social icons defined locally in icon-sets.ts
 */
const customIconSets = Object.entries(customIcons).reduce((acc, [key, value]) => {
  const [prefix, iconName] = key.split(':');
  const existing = acc.find((item) => item.prefix === prefix);

  if (existing) {
    existing.icons[iconName] = value;
  } else {
    acc.push({ prefix, icons: { [iconName]: value } } as IconifyJSON);
  }

  return acc;
}, [] as IconifyJSON[]);

// ----------------------------------------------------------------------

let areIconsRegistered = false;

export function registerIcons() {
  if (areIconsRegistered) {
    return;
  }

  // Register full icon set packages
  iconPackages.forEach((pkg) => addCollection(pkg));

  // Register custom / social icons
  customIconSets.forEach((iconSet) => {
    addCollection({ ...iconSet, width: 24, height: 24 });
  });

  areIconsRegistered = true;
}
