import { Navigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth, normalizeRole } from '../contexts/AuthContext'

function RouteLoadingScreen({ message = 'Loading…' }) {
  return (
    <Box
      className="route-loading"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={32} />
        <Typography sx={{ color: 'text.secondary' }}>{message}</Typography>
      </Stack>
    </Box>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const {
    currentUser,
    role,
    userProfile,
    profileError,
    authLoading,
    loading,
    refreshUserProfile,
  } = useAuth()

  const initializing = authLoading ?? loading

  // 1) Never evaluate permissions while auth/profile initialization is running.
  if (initializing) {
    return <RouteLoadingScreen />
  }

  // 2) Signed-out after initialization.
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // 3) Profile/role fetch failed — not the same as "unauthorized role".
  if (profileError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Stack
          spacing={2}
          sx={{ alignItems: 'center', maxWidth: 420, textAlign: 'center' }}
        >
          <Typography variant="h6">Unable to verify your account</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Your sign-in succeeded, but we could not load your parish profile.
            Check your connection and try again.
          </Typography>
          <Button variant="contained" onClick={() => refreshUserProfile()}>
            Retry
          </Button>
        </Stack>
      </Box>
    )
  }

  // 4) Only now is role authoritative (initialization completed successfully).
  const normalizedRole = normalizeRole(role)
  const allowed = Array.isArray(allowedRoles)
    ? allowedRoles.map((item) => normalizeRole(item)).filter(Boolean)
    : null

  if (allowed && (!normalizedRole || !allowed.includes(normalizedRole))) {
    return <Navigate to="/unauthorized" replace />
  }

  const status = String(userProfile?.status || '').trim().toLowerCase()
  if (status && status !== 'active') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
