import { Box, Link, Stack, Typography } from '@mui/material'
import { ABOUT_DEVELOPED_BY } from './AboutDialog'

/**
 * Minimal app footer. Clicking "Parish Connect" opens the About dialog.
 */
export default function AppFooter({ onAboutClick }) {
  return (
    <Box
      component="footer"
      sx={{
        px: { xs: 2, sm: 2.5, md: 3 },
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          textAlign: 'center',
          rowGap: 0.25,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={onAboutClick}
            sx={{
              color: 'inherit',
              font: 'inherit',
              cursor: 'pointer',
              verticalAlign: 'baseline',
              p: 0,
              m: 0,
              border: 'none',
              outline: 'none',
              background: 'none',
              boxShadow: 'none',
              '&:focus, &:focus-visible': {
                outline: 'none',
                textDecoration: 'underline',
              },
            }}
          >
            Parish Connect
          </Link>
          {' '}
          v1.0
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          ·
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          Developed by {ABOUT_DEVELOPED_BY}
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          ·
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
          © 2026 Parish Connect
        </Typography>
      </Stack>
    </Box>
  )
}
