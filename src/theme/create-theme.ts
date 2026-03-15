import type { Theme } from '@mui/material/styles';

import { createTheme as createMuiTheme } from '@mui/material/styles';

import { shadows } from './core/shadows';
import { palette } from './core/palette';
import { themeConfig } from './theme-config';
import { components } from './core/components';
import { typography } from './core/typography';
import { customShadows } from './core/custom-shadows';

import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export function getBaseTheme(mode: 'light' | 'dark'): ThemeOptions {
  return {
    colorSchemes: {
      [mode]: {
        palette: palette[mode],
        shadows: shadows[mode],
        customShadows: customShadows[mode],
      },
    },
    components,
    typography,
    shape: { borderRadius: 8 },
    cssVariables: themeConfig.cssVariables,
  };
}

export const baseTheme: ThemeOptions = getBaseTheme('light');

// ----------------------------------------------------------------------

type CreateThemeProps = {
  themeOverrides?: ThemeOptions;
  direction?: 'ltr' | 'rtl';
  mode?: 'light' | 'dark';
};

export function createTheme({ themeOverrides = {}, direction = 'ltr', mode = 'light' }: CreateThemeProps = {}): Theme {
  const base = getBaseTheme(mode);
  
  const theme = createMuiTheme({
    ...base,
    direction,
    palette: {
      mode,
      ...palette[mode],
    },
  }, themeOverrides);

  return theme;
}
