import { Box, Typography } from '@mui/material'
import { MARIAN_BLUE } from '../../theme/parishTheme'

/** Shared empty list state for sacramental record pages. */
export default function RecordsEmptyState({ icon: Icon, title }) {
  return (
    <Box
      sx={{
        py: { xs: 7, sm: 9 },
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mb: 2,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(11, 61, 145, 0.08)',
          color: MARIAN_BLUE,
        }}
      >
        <Icon sx={{ fontSize: 30 }} />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontSize: '1.05rem',
          fontWeight: 650,
          mb: 0.75,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 320, mx: 'auto', lineHeight: 1.6 }}
      >
        Records will appear here once they are created.
      </Typography>
    </Box>
  )
}
