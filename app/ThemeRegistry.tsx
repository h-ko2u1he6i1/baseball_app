'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#212121', // Dark grey/black for general buttons
    },
    secondary: {
      main: '#9e9e9e', // Grey for secondary actions
    },
    error: {
      main: '#f44336', // Red for error/delete
    },
    background: {
      default: '#f4f6f8',
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    }
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    body1: { fontWeight: 700 },
    body2: { fontWeight: 700 },
    button: { fontWeight: 700 },
    caption: { fontWeight: 700 },
    overline: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    h1: {
      fontFamily: 'Tektur, sans-serif',
    },
    h2: {
      fontFamily: 'Tektur, sans-serif',
    },
    h3: {
      fontFamily: 'Tektur, sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: 'Tektur, sans-serif',
    },
    h5: {
      fontFamily: 'Tektur, sans-serif',
    },
    h6: {
      fontFamily: 'Tektur, sans-serif',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        // Contained Primary
        containedPrimary: ({
          theme
        }) => ({
          border: '1px solid transparent',
          '&:hover': {
            backgroundColor: theme.palette.primary.contrastText,
            color: theme.palette.primary.main,
            border: '1px solid',
            borderColor: theme.palette.primary.main, // Add border for visual consistency
          },
        }),
        // Outlined Primary
        outlinedPrimary: ({
          theme
        }) => ({
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          },
        }),
        // Contained Secondary
        containedSecondary: ({
          theme
        }) => ({
          border: '1px solid transparent',
          '&:hover': {
            backgroundColor: theme.palette.secondary.contrastText,
            color: theme.palette.secondary.main,
            border: '1px solid',
            borderColor: theme.palette.secondary.main,
          },
        }),
        // Outlined Secondary
        outlinedSecondary: ({
          theme
        }) => ({
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
          },
        }),
        // Text Primary (optional, usually just a slight background change)
        textPrimary: ({
          theme
        }) => ({
          '&:hover': {
            backgroundColor: theme.palette.action.hover, // Use default hover background
            color: theme.palette.primary.main, // Keep primary color
          },
        }),
        // Text Secondary
        textSecondary: ({
          theme
        }) => ({
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.secondary.main,
          },
        }),
        outlinedError: {
          backgroundColor: '#f44336', // Red background
          color: '#ffffff', // White text
          borderColor: '#f44336', // Red border
          '&:hover': {
            backgroundColor: '#d32f2f', // Darker red on hover
            borderColor: '#d32f2f',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            transition: 'border-color 0.3s ease-in-out',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.87)', // Adjust to match MUI's default hover color or a desired color
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#212121', // Primary color from palette
          },
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white overlay
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
