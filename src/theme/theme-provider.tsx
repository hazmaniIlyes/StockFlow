import type { ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';

import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { useI18n, useSettings } from 'src/contexts';

import { createTheme } from './create-theme';

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [rtlPlugin] });
const ltrCache = createCache({ key: 'muiltr' });

import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Partial<MuiThemeProviderProps> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const { dir, language } = useI18n();
  const { preferences } = useSettings();
  const colorMode = preferences.colorMode;

  // Use Cairo font for Arabic - override all font families
  const fontOverrides: ThemeOptions = language === 'ar' ? {
    typography: {
      fontFamily: 'Cairo, sans-serif',
      fontSecondaryFamily: 'Cairo, sans-serif',
      h1: { fontFamily: 'Cairo, sans-serif' },
      h2: { fontFamily: 'Cairo, sans-serif' },
      h3: { fontFamily: 'Cairo, sans-serif' },
      h4: { fontFamily: 'Cairo, sans-serif' },
      h5: { fontFamily: 'Cairo, sans-serif' },
      h6: { fontFamily: 'Cairo, sans-serif' },
      subtitle1: { fontFamily: 'Cairo, sans-serif' },
      subtitle2: { fontFamily: 'Cairo, sans-serif' },
      body1: { fontFamily: 'Cairo, sans-serif' },
      body2: { fontFamily: 'Cairo, sans-serif' },
      button: { fontFamily: 'Cairo, sans-serif' },
      caption: { fontFamily: 'Cairo, sans-serif' },
      overline: { fontFamily: 'Cairo, sans-serif' },
    },
  } : {};

  const theme = createTheme({
    themeOverrides: { ...themeOverrides, ...fontOverrides },
    direction: dir,
    mode: colorMode,
  });

  return (
    <CacheProvider value={dir === 'rtl' ? rtlCache : ltrCache}>
    <ThemeVarsProvider disableTransitionOnChange theme={theme} {...other}>
      <CssBaseline />
      {children}
    </ThemeVarsProvider>
    </CacheProvider>
  );
}
