import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material'
import { PARISH_TIME_OPTIONS } from '../constants/parishTimes'

/**
 * Predefined parish schedule time dropdown.
 * Stores 24h HH:mm values for Firestore compatibility.
 */
export default function TimeSelect({
  value = '',
  onChange,
  onBlur,
  error = false,
  helperText = ' ',
  disabled = false,
  required = false,
  label = 'Time',
  id = 'sacrament-time',
}) {
  const normalized = String(value || '').trim()
  const known = PARISH_TIME_OPTIONS.some((item) => item.value === normalized)
  const labelId = `${id}-label`

  return (
    <FormControl fullWidth required={required} error={error} disabled={disabled}>
      <InputLabel id={labelId} shrink htmlFor={id}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        value={normalized}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        displayEmpty
        input={<OutlinedInput notched label={label} />}
        renderValue={(current) => {
          if (!current) {
            return (
              <Typography component="span" color="text.secondary">
                Select Time
              </Typography>
            )
          }
          const match = PARISH_TIME_OPTIONS.find((item) => item.value === current)
          return match?.label || current
        }}
      >
        {/* Keeps empty value valid for MUI Select without showing in the list. */}
        <MenuItem value="" disabled sx={{ display: 'none' }} />

        {!known && normalized && (
          <MenuItem value={normalized}>{normalized} (saved)</MenuItem>
        )}
        {PARISH_TIME_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{helperText || ' '}</FormHelperText>
    </FormControl>
  )
}
