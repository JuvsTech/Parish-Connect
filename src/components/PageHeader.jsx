import { Box, Typography } from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'

/**
 * Canonical page title for admin content areas.
 * Use this for every module page so titles appear once in the main content.
 */
export default function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Typography
        variant="h4"
        sx={{
          color: MARIAN_BLUE,
          fontWeight: 700,
          fontSize: { xs: '1.45rem', sm: '1.65rem', md: '1.75rem' },
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          color="text.secondary"
          sx={{ mt: 0.6, fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.5 }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  )
}
