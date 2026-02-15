import type { CommonColors } from '@mui/material/styles';

import type { ThemeCssVariables } from './types';
import type { PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

type ThemeConfig = {
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<
    'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
    PaletteColorNoChannels
  > & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: Record<
      '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
      string
    >;
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  classesPrefix: 'minimal',
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'DM Sans Variable',
    secondary: 'Barlow',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: {
      lighter: '#E3F2FD',
      light: '#90CAF9',
      main: '#2563EB',
      dark: '#1D4ED8',
      darker: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#F3E5F5',
      light: '#CE93D8',
      main: '#9333EA',
      dark: '#7E22CE',
      darker: '#6B21A8',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#E0F2FE',
      light: '#7DD3FC',
      main: '#0284C7',
      dark: '#0369A1',
      darker: '#075985',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#DCFCE7',
      light: '#86EFAC',
      main: '#16A34A',
      dark: '#15803D',
      darker: '#166534',
      contrastText: '#ffffff',
    },
    warning: {
      lighter: '#FEF3C7',
      light: '#FCD34D',
      main: '#D97706',
      dark: '#B45309',
      darker: '#92400E',
      contrastText: '#FFFFFF',
    },
    error: {
      lighter: '#FEE2E2',
      light: '#FECACA',
      main: '#DC2626',
      dark: '#B91C1C',
      darker: '#7F1D1D',
      contrastText: '#FFFFFF',
    },
    grey: {
      '50': '#FAFAFA',
      '100': '#F5F5F5',
      '200': '#EEEEEE',
      '300': '#E0E0E0',
      '400': '#BDBDBD',
      '500': '#9E9E9E',
      '600': '#757575',
      '700': '#616161',
      '800': '#424242',
      '900': '#212121',
    },
    common: { black: '#000000', white: '#FFFFFF' },
  },
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
};
