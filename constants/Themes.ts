import { vars } from 'nativewind';

export type AppTheme = 'oxygen';

// "Lively & Fresh" Palettes - Vibrant, Energetic, and Life-filled
export const Themes: Record<AppTheme, any> = {
  // Vibrant Sky - Clean & Airy
  oxygen: vars({
    '--color-primary': '6 182 212',       // Cyan 500 - #06B6D4
    '--color-primary-tint': '207 250 254', // Cyan 100
  }),
};
