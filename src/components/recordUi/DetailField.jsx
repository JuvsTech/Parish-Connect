import { Box, Typography } from '@mui/material'
import { displayValue } from '../../utils/displayValue'

/** Shared label/value pair for sacramental record view dialogs. */
export default function DetailField({ label, value }) {
  const shown = displayValue(value)
  const isEmpty = shown === '—'

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 0.4,
          fontWeight: 650,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          fontSize: '0.68rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: isEmpty ? 500 : 600,
          color: isEmpty ? 'text.disabled' : 'text.primary',
          lineHeight: 1.45,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {shown}
      </Typography>
    </Box>
  )
}
