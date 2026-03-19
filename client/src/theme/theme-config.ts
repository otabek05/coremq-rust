import type { CommonColors } from '@mui/material/styles';

import type { ThemeCssVariables } from './types';
import type { PaletteColorNoChannels } from './core/palette';

type ThemeConfig = {
    classesPrefix: string;
    cssVariables: ThemeCssVariables;
    fontFamily: Record<'primary' | 'secondary', string>;
    palette: Record<'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error', PaletteColorNoChannels> & {
        common: Pick<CommonColors, 'black' | 'white'>;
        grey: Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900', string>;
    };
};

export const themeConfig: ThemeConfig = {
    /** **************************************
     * Base
     *************************************** */
    classesPrefix: 'coremq',
    /** **************************************
     * Typography
     *************************************** */
    fontFamily: {
        primary: 'Plus Jakarta Sans Variable',
        secondary: 'Barlow',
    },
    /** **************************************
     * Palette — Midnight Observatory
     *************************************** */
    palette: {
        primary: {
            lighter: '#C8FAD6',
            light: '#5BE49B',
            main: '#00A76F',
            dark: '#007867',
            darker: '#004B50',
            contrastText: '#FFFFFF',
        },
        secondary: {
            lighter: '#D6E4FF',
            light: '#84A9FF',
            main: '#3366FF',
            dark: '#1939B7',
            darker: '#091A7A',
            contrastText: '#FFFFFF',
        },
        info: {
            lighter: '#CAFDF5',
            light: '#61F3F3',
            main: '#00B8D9',
            dark: '#006C9C',
            darker: '#003768',
            contrastText: '#FFFFFF',
        },
        success: {
            lighter: '#D3FCD2',
            light: '#77ED8B',
            main: '#22C55E',
            dark: '#118D57',
            darker: '#065E49',
            contrastText: '#ffffff',
        },
        warning: {
            lighter: '#FFF3D8',
            light: '#FFD666',
            main: '#FFAB00',
            dark: '#B76E00',
            darker: '#7A4100',
            contrastText: '#1C252E',
        },
        error: {
            lighter: '#FFE9D5',
            light: '#FFAC82',
            main: '#FF5630',
            dark: '#B71D18',
            darker: '#7A0916',
            contrastText: '#FFFFFF',
        },
        grey: {
            '50': '#F9FAFB',
            '100': '#F1F3F6',
            '200': '#E2E8F0',
            '300': '#CBD5E1',
            '400': '#94A3B8',
            '500': '#64748B',
            '600': '#475569',
            '700': '#334155',
            '800': '#1E293B',
            '900': '#0F172A',
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
