import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material'
import { MARIAN_BLUE } from '../../theme/parishTheme'

/** Shared checkbox filter group for sacramental record list pages. */
export default function FilterSection({ title, options, selected, onToggle }) {
  if (options.length === 0) {
    return (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: MARIAN_BLUE, mb: 0.75 }}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          No values available
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: MARIAN_BLUE, mb: 0.5 }}
      >
        {title}
      </Typography>
      <FormGroup sx={{ maxHeight: 140, overflowY: 'auto', pr: 0.5 }}>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                sx={{
                  color: 'text.secondary',
                  '&.Mui-checked': { color: MARIAN_BLUE },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {option}
              </Typography>
            }
            sx={{ mr: 0, ml: -0.5 }}
          />
        ))}
      </FormGroup>
    </Box>
  )
}
