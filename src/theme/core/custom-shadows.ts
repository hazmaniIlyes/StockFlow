import { varAlpha } from 'minimal-shared/utils';

import { grey, info, error, common, primary, success, warning, secondary } from './palette';

import type { ThemeColorScheme } from '../types';

// ----------------------------------------------------------------------

/**
 * TypeScript (type definition and extension)
 * @to {@link file://./../extend-theme-types.d.ts}
 */

export interface CustomShadows {
  z1?: string;
  z4?: string;
  z8?: string;
  z12?: string;
  z16?: string;
  z20?: string;
  z24?: string;
  primary?: string;
  secondary?: string;
  info?: string;
  success?: string;
  warning?: string;
  error?: string;
  card?: string;
  dialog?: string;
  dropdown?: string;
}

// ----------------------------------------------------------------------

export function createShadowColor(colorChannel: string): string {
  return `0 8px 16px 0 ${varAlpha(colorChannel, 0.24)}`;
}

function createCustomShadows(colorChannel: string): CustomShadows {
  return {
    z1: `0 1px 2px 0 ${varAlpha(colorChannel, 0.08)}`,
    z4: `0 2px 4px 0 ${varAlpha(colorChannel, 0.08)}`,
    z8: `0 4px 8px 0 ${varAlpha(colorChannel, 0.08)}`,
    z12: `0 8px 12px -2px ${varAlpha(colorChannel, 0.08)}`,
    z16: `0 12px 16px -4px ${varAlpha(colorChannel, 0.08)}`,
    z20: `0 16px 20px -4px ${varAlpha(colorChannel, 0.08)}`,
    z24: `0 20px 24px 0 ${varAlpha(colorChannel, 0.08)}`,
    /********/
    dialog: `-40px 40px 80px -8px ${varAlpha(common.blackChannel, 0.16)}`,
    card: `0 0 1px 0 ${varAlpha(colorChannel, 0.12)}, 0 8px 16px -4px ${varAlpha(colorChannel, 0.08)}`,
    dropdown: `0 0 1px 0 ${varAlpha(colorChannel, 0.12)}, -12px 12px 24px -4px ${varAlpha(colorChannel, 0.12)}`,
    /********/
    primary: createShadowColor(primary.mainChannel),
    secondary: createShadowColor(secondary.mainChannel),
    info: createShadowColor(info.mainChannel),
    success: createShadowColor(success.mainChannel),
    warning: createShadowColor(warning.mainChannel),
    error: createShadowColor(error.mainChannel),
  };
}

export const customShadows: Partial<Record<ThemeColorScheme, CustomShadows>> = {
  light: createCustomShadows(grey['500Channel']),
};
