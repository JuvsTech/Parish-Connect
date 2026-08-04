import { Box, Divider, Grid, Typography } from '@mui/material'
import { MARIAN_BLUE } from '../../theme/parishTheme'

/** Shared section block for sacramental record view dialogs. */
export default function DetailSection({ title, children, showDivider }) {
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
          mb: 2,
          fontSize: '0.9rem',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        {children}
      </Grid>
    </Box>
  )
}
