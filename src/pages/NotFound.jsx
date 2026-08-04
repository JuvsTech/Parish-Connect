import { Link as RouterLink } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material'
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined'
import ChurchOutlinedIcon from '@mui/icons-material/ChurchOutlined'
import parishTheme, { LIGHT_GRAY, MARIAN_BLUE } from '../theme/parishTheme'

export default function NotFound() {
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
          <Stack spacing={2.5} sx={{ alignItems: "center" }}>
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

                sx={{ alignItems: "center", justifyContent: "center", mt: 1.5 }}
              >
                <SearchOffOutlinedIcon sx={{ color: MARIAN_BLUE, fontSize: 22 }} />
                <Typography variant="h5" sx={{ color: MARIAN_BLUE }}>
                  Page not found
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.25, lineHeight: 1.6, maxWidth: 340, mx: 'auto' }}
              >
                The page you are looking for does not exist or has been moved.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ justifyContent: "center", width: '100%', pt: 0.5 }}

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
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
