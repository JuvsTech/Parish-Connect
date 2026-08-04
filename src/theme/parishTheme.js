import { createTheme } from '@mui/material/styles'

const MARIAN_BLUE = '#0B3D91'
const WHITE = '#FFFFFF'
const LIGHT_GRAY = '#F5F7FA'
const BORDER = '#E4E9F0'
const TEXT_PRIMARY = '#1A2332'
const TEXT_SECONDARY = '#5C6B7A'
const TEXT_MUTED = '#7A8796'

const SOFT_SHADOW = '0 1px 3px rgba(11, 61, 145, 0.04), 0 1px 2px rgba(16, 24, 40, 0.03)'
const SOFT_SHADOW_HOVER =
  '0 4px 12px rgba(11, 61, 145, 0.07), 0 2px 4px rgba(16, 24, 40, 0.04)'

const parishTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: MARIAN_BLUE,
      light: '#1A56B8',
      dark: '#082E6E',
      contrastText: WHITE,
    },
    secondary: {
      main: '#3D5A80',
      contrastText: WHITE,
    },
    error: {
      main: '#C62828',
    },
    background: {
      default: LIGHT_GRAY,
      paper: WHITE,
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
    },
    divider: BORDER,
    info: {
      main: MARIAN_BLUE,
    },
  },
  typography: {
    fontFamily: `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`,
    h4: { fontWeight: 700, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 650, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    caption: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 14,
  },
  shadows: [
    'none',
    SOFT_SHADOW,
    SOFT_SHADOW,
    SOFT_SHADOW_HOVER,
    SOFT_SHADOW_HOVER,
    '0 6px 16px rgba(11, 61, 145, 0.08)',
    ...Array(19).fill(SOFT_SHADOW_HOVER),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: LIGHT_GRAY,
          color: TEXT_PRIMARY,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${BORDER}`,
          backgroundImage: 'none',
          backgroundColor: WHITE,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${BORDER}`,
          boxShadow: SOFT_SHADOW,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 40,
          paddingInline: 16,
          boxShadow: 'none',
        },
        sizeSmall: {
          minHeight: 34,
          borderRadius: 10,
          paddingInline: 12,
        },
        containedPrimary: {
          boxShadow: '0 4px 12px rgba(11, 61, 145, 0.18)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(11, 61, 145, 0.22)',
          },
        },
        outlined: {
          borderColor: BORDER,
          color: TEXT_PRIMARY,
          '&:hover': {
            borderColor: MARIAN_BLUE,
            backgroundColor: 'rgba(11, 61, 145, 0.04)',
          },
        },
        startIcon: {
          marginRight: 8,
          marginLeft: -2,
        },
        endIcon: {
          marginLeft: 8,
          marginRight: -2,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: SOFT_SHADOW_HOVER,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(11, 61, 145, 0.035)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(11, 61, 145, 0.035)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: BORDER,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 20,
          paddingRight: 20,
          verticalAlign: 'middle',
        },
        head: {
          color: MARIAN_BLUE,
          fontWeight: 700,
          paddingTop: 14,
          paddingBottom: 14,
          fontSize: '0.8125rem',
        },
        body: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginInline: 8,
          marginBlock: 2,
          transition: 'background-color 0.2s ease, color 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FAFBFD',
        },
      },
    },
  },
})

export default parishTheme
export {
  MARIAN_BLUE,
  WHITE,
  LIGHT_GRAY,
  BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SOFT_SHADOW,
  SOFT_SHADOW_HOVER,
}
