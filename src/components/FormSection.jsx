import { Box, Divider, Grid, Typography } from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'

/** Shared section heading for sacramental record forms. */
export default function FormSection({ title, children, showDivider = false }) {
  return (
    <Box>
      {showDivider && (
        <Divider
          sx={{
            my: { xs: 2.5, sm: 3 },
            borderColor: 'rgba(11, 61, 145, 0.12)',
          }}
        />
      )}
      <Typography
        variant="subtitle2"
        sx={{
          color: MARIAN_BLUE,
          fontWeight: 700,
          mb: 1.75,
          fontSize: '0.9rem',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 2.25 }}>
        {children}
      </Grid>
    </Box>
  )
}
