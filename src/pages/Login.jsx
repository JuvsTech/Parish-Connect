import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  IconButton,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import InputAdornment from '@mui/material/InputAdornment'
import { useAuth } from '../contexts/AuthContext'
import { login } from '../services/authService'
import logo from '../assets/parish-connect-logo.png'

const MARIAN_BLUE = '#0B3D91'
const GOLD = '#D4AF37'
const LIGHT_GRAY = '#F5F7FA'

const loginTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: MARIAN_BLUE,
      dark: '#082E6E',
      light: '#1A56B8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: GOLD,
    },
    background: {
      default: LIGHT_GRAY,
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2332',
      secondary: '#5C6B7A',
    },
  },
  typography: {
    fontFamily: `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`,
    button: {
      textTransform: 'none',
      fontWeight: 650,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: '#FAFBFD',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 0 4px rgba(11, 61, 145, 0.12)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        },
      },
    },
  },
})

function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return error.message || 'Login failed. Please try again.'
  }
}

export default function Login() {
  const { currentUser, authLoading, loading: authLoadingAlias } = useAuth()
  const initializing = authLoading ?? authLoadingAlias
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Let AuthContext finish role loading via onAuthStateChanged.
      // ProtectedRoute shows the loading screen until role is ready.
      navigate('/', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <ThemeProvider theme={loginTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(160deg, ${LIGHT_GRAY} 0%, #EEF2F8 45%, #E8EEF8 100%)`,
          }}
        >
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <CircularProgress size={36} sx={{ color: MARIAN_BLUE }} />
            <Typography sx={{ color: 'text.secondary' }}>
              Checking session...
            </Typography>
          </Stack>
        </Box>
      </ThemeProvider>
    )
  }

  if (currentUser) {
    return <Navigate to="/" replace />
  }

  return (
    <ThemeProvider theme={loginTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 5 },
          background: `
            radial-gradient(ellipse at top left, rgba(11, 61, 145, 0.08), transparent 42%),
            radial-gradient(ellipse at bottom right, rgba(212, 175, 55, 0.12), transparent 40%),
            linear-gradient(160deg, ${LIGHT_GRAY} 0%, #EEF2F8 50%, #E8EEF8 100%)
          `,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: '20px',
            px: { xs: 3, sm: 4.5 },
            py: { xs: 4, sm: 5 },
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(11, 61, 145, 0.06)',
            boxShadow: '0 18px 50px rgba(11, 61, 145, 0.12)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 22px 56px rgba(11, 61, 145, 0.16)',
            },
          }}
        >
          <Stack spacing={3} sx={{ width: '100%', alignItems: 'center' }}>
            <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
              <Box
                component="img"
                src={logo}
                alt="Parish Logo"
                sx={{
                  width: { xs: 70, sm: 90, md: 110 },
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />

              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: MARIAN_BLUE,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '1.7rem', sm: '2rem' },
                  }}
                >
                  Parish Connect
                </Typography>
                <Typography
                  sx={{
                    mt: 0.75,
                    color: 'text.secondary',
                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                    fontWeight: 500,
                  }}
                >
                  Parish Records Management System
                </Typography>
                <Box
                  sx={{
                    width: 48,
                    height: 3,
                    mx: 'auto',
                    mt: 1.75,
                    borderRadius: 999,
                    bgcolor: GOLD,
                  }}
                />
              </Box>
            </Stack>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: '100%' }}
            >
              <Stack spacing={2.25}>
                {error && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  fullWidth
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            fontSize="small"
                            sx={{ color: 'text.secondary' }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  fullWidth
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon
                            fontSize="small"
                            sx={{ color: 'text.secondary' }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                            onClick={() => setShowPassword((prev) => !prev)}
                            onMouseDown={(event) => event.preventDefault()}
                            edge="end"
                            disabled={loading}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: MARIAN_BLUE },
                            }}
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 0.5,
                    py: 1.45,
                    fontSize: '1rem',
                    bgcolor: MARIAN_BLUE,
                    boxShadow: '0 10px 24px rgba(11, 61, 145, 0.28)',
                    '&:hover': {
                      bgcolor: '#082E6E',
                      boxShadow: '0 14px 28px rgba(11, 61, 145, 0.34)',
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(11, 61, 145, 0.45)',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  {loading ? (
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: 'center' }}
                    >
                      <CircularProgress size={18} sx={{ color: '#FFFFFF' }} />
                      <span>Signing in...</span>
                    </Stack>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Typography
          variant="caption"
          sx={{
            mt: 3.5,
            color: 'text.secondary',
            textAlign: 'center',
            maxWidth: 420,
            lineHeight: 1.5,
            fontSize: '0.78rem',
          }}
        >
          © Immaculate Conception of the Virgin Mary Parish
        </Typography>
      </Box>
    </ThemeProvider>
  )
}
