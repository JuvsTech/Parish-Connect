import { Grid, Typography } from '@mui/material'

/** Shared subsection label inside DetailSection (view dialogs). */
export default function DetailSubheading({ children }) {
  return (
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 0.5,
          mt: { xs: 0.75, sm: 1 },
          fontSize: '0.84rem',
        }}
      >
        {children}
      </Typography>
    </Grid>
  )
}
