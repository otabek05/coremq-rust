import type { PaletteColor, ColorSystemOptions, PaletteColorChannel } from '@mui/material/styles';

import { varAlpha, createPaletteChannel } from 'minimal-shared/utils';

import { themeConfig } from '../theme-config';

import type { ThemeColorScheme } from '../types';

/**
 * TypeScript (type definition and extension)
 * @to {@link file://./../extend-theme-types.d.ts}
 */

/** Keys for the palette colors */
export type PaletteColorKey = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

/** Palette color without additional channels */
export type PaletteColorNoChannels = Omit<PaletteColor, 'lighterChannel' | 'darkerChannel'>;

/** Palette color with additional channels */
export type PaletteColorWithChannels = PaletteColor & PaletteColorChannel;

/** Extended common colors */
export type CommonColorsExtend = {
    whiteChannel: string;
    blackChannel: string;
};

/** Extended text colors */
export type TypeTextExtend = {
    disabledChannel: string;
};

/** Extended background colors */
export type TypeBackgroundExtend = {
    neutral: string;
    neutralChannel: string;
};

/** Extended palette colors */
export type PaletteColorExtend = {
    lighter: string;
    darker: string;
    lighterChannel: string;
    darkerChannel: string;
};

/** Extended grey channels */
export type GreyExtend = {
    '50Channel': string;
    '100Channel': string;
    '200Channel': string;
    '300Channel': string;
    '400Channel': string;
    '500Channel': string;
    '600Channel': string;
    '700Channel': string;
    '800Channel': string;
    '900Channel': string;
};

/** Primary color */
export const primary = createPaletteChannel(themeConfig.palette.primary);

/** Secondary color */
export const secondary = createPaletteChannel(themeConfig.palette.secondary);

/** Info color */
export const info = createPaletteChannel(themeConfig.palette.info);

/** Success color */
export const success = createPaletteChannel(themeConfig.palette.success);

/** Warning color */
export const warning = createPaletteChannel(themeConfig.palette.warning);

/** Error color */
export const error = createPaletteChannel(themeConfig.palette.error);

/** Common color */
export const common = createPaletteChannel(themeConfig.palette.common);

/** Grey color */
export const grey = createPaletteChannel(themeConfig.palette.grey);

/** Text color */
export const text = {
    light: createPaletteChannel({
        primary: '#E2E8F0',
        secondary: '#94A3B8',
        disabled: '#475569',
    }),
};

/** Background color */
export const background = {
    light: createPaletteChannel({
        paper: '#131825',
        default: '#0B0F19',
        neutral: '#1A2035',
    }),
};

/** Base action color */
export const baseAction = {
    hover: varAlpha(grey['400Channel'], 0.08),
    selected: varAlpha(grey['400Channel'], 0.16),
    focus: varAlpha(grey['400Channel'], 0.24),
    disabled: varAlpha(grey['400Channel'], 0.8),
    disabledBackground: varAlpha(grey['400Channel'], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
};

/** Action color */
export const action = {
    light: { ...baseAction, active: grey[400] },
};

/** Base palette */
export const basePalette = {
    primary,
    secondary,
    info,
    success,
    warning,
    error,
    common,
    grey,
    divider: varAlpha(grey['400Channel'], 0.12),
};

export const palette: Partial<Record<ThemeColorScheme, ColorSystemOptions['palette']>> = {
    light: {
        ...basePalette,
        text: text.light,
        background: background.light,
        action: action.light,
    },
};
