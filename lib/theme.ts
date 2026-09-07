'use client';

import { createTheme, alpha } from '@mui/material/styles';

const displayFont = 'var(--font-tektur), var(--font-noto-sans-jp), sans-serif';
const bodyFont =
  'var(--font-noto-sans-jp), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

/**
 * アクセント色（応援球団カラー）を受け取り、ライト/ダーク両対応のテーマを生成する。
 * 球団が変わるたびに呼び直す（useMemo）。
 */
export function makeTheme(accent: string) {
  return createTheme({
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: accent },
          error: { main: '#e5484d' },
          success: { main: '#30a46c' },
          background: { default: '#eef1f5', paper: '#ffffff' },
          text: { primary: '#0f172a', secondary: '#5b6675' },
          divider: '#e3e8ef',
        },
      },
      dark: {
        palette: {
          primary: { main: accent },
          error: { main: '#ff6369' },
          success: { main: '#3dd68c' },
          background: { default: '#0b0f17', paper: '#151b26' },
          text: { primary: '#f1f5f9', secondary: '#9aa7b8' },
          divider: 'rgba(148,163,184,0.18)',
        },
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: displayFont, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: displayFont, fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: displayFont, fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: displayFont, fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          body: {
            WebkitFontSmoothing: 'antialiased',
            // 応援球団カラーがほんのり滲むスタジアム風のアンビエント
            backgroundImage: `radial-gradient(1100px 520px at 50% -240px, ${alpha(accent, 0.1)}, transparent 62%)`,
            backgroundAttachment: 'fixed',
            ...theme.applyStyles('dark', {
              backgroundImage: `radial-gradient(1100px 520px at 50% -240px, ${alpha(accent, 0.22)}, transparent 60%)`,
            }),
          },
        }),
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
        styleOverrides: {
          root: ({ theme }) => ({
            backdropFilter: 'blur(12px)',
            backgroundImage: 'none',
            backgroundColor: 'rgba(238,241,245,0.82)',
            borderBottom: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
            ...theme.applyStyles('dark', {
              backgroundColor: 'rgba(11,15,23,0.82)',
            }),
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: ({ theme }) => ({ borderColor: theme.palette.divider }),
        },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            transition: 'transform .18s ease, border-color .18s ease, box-shadow .18s ease',
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 10 },
          sizeLarge: { paddingBlock: 10 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({ borderColor: theme.palette.divider }),
          head: { fontWeight: 700 },
        },
      },
    },
  });
}
