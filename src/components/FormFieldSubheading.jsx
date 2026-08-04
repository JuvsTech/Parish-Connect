import { Grid, Typography } from '@mui/material'

/**
 * Shared subsection label inside FormSection
 * (e.g. Father's Name, Mother's Maiden Name, Related Person).
 */
export default function FormFieldSubheading({ children, spaced = false }) {
  return (
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 650,
          color: 'text.secondary',
          mb: 0.5,
          ...(spaced ? { mt: 1 } : {}),
        }}
      >
        {children}
      </Typography>
    </Grid>
  )
}
