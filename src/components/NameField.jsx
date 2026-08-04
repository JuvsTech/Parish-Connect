import { Grid, TextField } from '@mui/material'
import { toProperCase } from '../utils/textFormatter'

/** Shared name-part TextField used across sacramental record forms. */
export default function NameField({
  label,
  field,
  form,
  errors,
  showError,
  handleChange,
  handleBlur,
  saving = false,
  required = false,
  size = { xs: 12, sm: 6, md: 3 },
}) {
  function handleNameBlur(event) {
    const formatted = toProperCase(form[field])
    if (formatted !== form[field]) {
      handleChange(field)({
        target: { value: formatted },
      })
    }
    handleBlur(field)(event)
  }

  return (
    <Grid size={size}>
      <TextField
        label={label}
        value={form[field]}
        onChange={handleChange(field)}
        onBlur={handleNameBlur}
        error={showError(field)}
        helperText={showError(field) ? errors[field] : ' '}
        fullWidth
        required={required}
        disabled={saving}
      />
    </Grid>
  )
}
