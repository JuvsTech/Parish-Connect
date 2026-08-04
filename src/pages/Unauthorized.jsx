import { useState } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Paper,
  Snackbar,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import ChurchOutlinedIcon from '@mui/icons-material/ChurchOutlined'
import { normalizeRole, useAuth } from '../contexts/AuthContext'
import { logout } from '../services/authService'
import parishTheme, { LIGHT_GRAY, MARIAN_BLUE } from '../theme/parishTheme'

const ALLOWED_ROLES = ['admin', 'staff']

export default function Unauthorized() {
  const { currentUser, role, userProfile, authLoading, loading } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const initializing = authLoading ?? loading

  async function handleSignOut() {
    setLogoutError('')
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Logout failed. Please try again.',
      )
    }
  }

  // Wait for auth + role before deciding. Restored /unauthorized URLs must not
  // keep valid staff/admin sessions stuck on this page during startup.
  if (initializing) {
    return (
      <ThemeProvider theme={parishTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `
              radial-gradient(ellipse at top left, rgba(11, 61, 145, 0.07), transparent 45%),
              linear-gradient(160deg, ${LIGHT_GRAY} 0%, #EEF2F8 100%)
            `,
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} sx={{ color: MARIAN_BLUE }} />
            <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography>
          </Stack>
        </Box>
      </ThemeProvider>
    )
  }

  const normalizedRole = normalizeRole(role)
  const status = String(userProfile?.status || '').trim().toLowerCase()
  const isActive = !status || status === 'active'
  if (
    currentUser &&
    normalizedRole &&
    ALLOWED_ROLES.includes(normalizedRole) &&
    isActive
  ) {
    return <Navigate to="/" replace />
  }

  return (
    <ThemeProvider theme={parishTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
          background: `
            radial-gradient(ellipse at top left, rgba(11, 61, 145, 0.07), transparent 45%),
            linear-gradient(160deg, ${LIGHT_GRAY} 0%, #EEF2F8 100%)
          `,
        }}
      >
        <Paper
          sx={{
            width: '100%',
            maxWidth: 460,
            borderRadius: 4,
            px: { xs: 3, sm: 4.5 },
            py: { xs: 4, sm: 5 },
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.1)',
          }}
        >
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: MARIAN_BLUE,
                boxShadow: '0 8px 20px rgba(11, 61, 145, 0.25)',
              }}
            >
              <ChurchOutlinedIcon />
            </Avatar>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: MARIAN_BLUE,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Parish Connect
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 1.5,
                }}
              >
                <BlockOutlinedIcon sx={{ color: MARIAN_BLUE, fontSize: 22 }} />
                <Typography variant="h5" sx={{ color: MARIAN_BLUE }}>
                  Unauthorized
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  mt: 1.25,
                  lineHeight: 1.6,
                  maxWidth: 340,
                  mx: 'auto',
                  color: 'text.secondary',
                }}
              >
                You do not have permission to view this page. Contact an administrator
                if you believe this is a mistake.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ justifyContent: 'center', width: '100%', pt: 0.5 }}
            >
              <Button
                component={RouterLink}
                to="/"
                variant="contained"
                fullWidth
                sx={{ maxWidth: { sm: 180 } }}
              >
                Go to Dashboard
              </Button>
              {currentUser ? (
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={handleSignOut}
                  sx={{
                    maxWidth: { sm: 180 },
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: MARIAN_BLUE,
                      bgcolor: 'rgba(11, 61, 145, 0.04)',
                    },
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  fullWidth
                  sx={{
                    maxWidth: { sm: 180 },
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: MARIAN_BLUE,
                      bgcolor: 'rgba(11, 61, 145, 0.04)',
                    },
                  }}
                >
                  Back to Login
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Snackbar
          open={Boolean(logoutError)}
          autoHideDuration={5000}
          onClose={() => setLogoutError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setLogoutError('')}
            sx={{ width: '100%' }}
          >
            {logoutError}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}
