import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import {
  getRequirementsSummary,
  getSacramentRequirementOptions,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import { MARIAN_BLUE } from '../theme/parishTheme'

/**
 * Shared documentary requirements checklist for sacramental records.
 * Does not block save when incomplete.
 *
 * @param {{
 *   sacrament: 'baptism'|'confirmation'|'marriage'|'death'|'conversion',
 *   value?: Record<string, boolean>,
 *   onChange?: (next: Record<string, boolean>) => void,
 *   disabled?: boolean,
 *   readOnly?: boolean,
 * }} props
 */
export default function RequirementsChecklist({
  sacrament,
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) {
  const options = getSacramentRequirementOptions(sacrament)
  const requirements = normalizeSacramentRequirements(sacrament, value)
  const summary = getRequirementsSummary(sacrament, requirements)

  function handleToggle(key) {
    if (readOnly || disabled || !onChange) return
    onChange({
      ...requirements,
      [key]: !requirements[key],
    })
  }

  return (
    <Grid size={{ xs: 12 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}

        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography variant="body2" color="text.secondary">
          Mark each documentary requirement that has been submitted.
        </Typography>
        <Chip
          size="small"
          label={
            summary.status === 'complete'
              ? `✔ ${summary.statusLabel}`
              : `⚠ ${summary.statusLabel}`
          }
          sx={{
            fontWeight: 650,
            bgcolor:
              summary.status === 'complete'
                ? 'rgba(46, 125, 50, 0.1)'
                : 'rgba(237, 108, 2, 0.12)',
            color: summary.status === 'complete' ? '#2E7D32' : '#ED6C02',
          }}
        />
      </Stack>

      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(11, 61, 145, 0.02)',
        }}
      >
        <FormGroup>
          <Grid container spacing={0.25}>
            {options.map((item) => (
              <Grid key={item.key} size={{ xs: 12, sm: 6 }}>
                {readOnly ? (
                  <Stack
                    direction="row"
                    spacing={1}

                    sx={{ alignItems: "center", py: 0.75 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 650,
                        color: requirements[item.key]
                          ? '#2E7D32'
                          : 'text.secondary',
                        minWidth: 18,
                      }}
                    >
                      {requirements[item.key] ? '✔' : '☐'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {item.label}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 1, color: 'text.secondary', fontWeight: 600 }}
                      >
                        {requirements[item.key]
                          ? 'Submitted'
                          : 'Not Yet Submitted'}
                      </Typography>
                    </Typography>
                  </Stack>
                ) : (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(requirements[item.key])}
                        onChange={() => handleToggle(item.key)}
                        disabled={disabled}
                        sx={{
                          color: MARIAN_BLUE,
                          '&.Mui-checked': { color: MARIAN_BLUE },
                        }}
                      />
                    }
                    label={item.label}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </FormGroup>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.25, fontWeight: 600 }}
        >
          Progress: {summary.ratioLabel} submitted
        </Typography>
      </Box>
    </Grid>
  )
}
