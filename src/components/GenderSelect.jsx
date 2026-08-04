import {
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { GENDER_OPTIONS, normalizeGender } from '../constants/gender'
import { MARIAN_BLUE } from '../theme/parishTheme'

/**
 * Paper-form style gender selection (checkbox appearance, single-choice behavior).
 * Laid out to align with outlined TextFields in sacramental forms.
 *
 * Stores one string value: "Male" | "Female" | "".
 */
export default function GenderSelect({
  label = 'Gender',
  value = '',
  onChange,
  onBlur,
  error = false,
  helperText = ' ',
  required = false,
  disabled = false,
  readOnly = false,
  size = { xs: 12, sm: 6, md: 3 },
  idPrefix = 'gender',
  /** Match MUI TextField size="small" height (e.g. Profile). */
  compact = false,
}) {
  const selected = normalizeGender(value)
  const interactive = !readOnly && !disabled
  const fieldHeight = compact ? 40 : 56

  function handleSelect(option) {
    if (!interactive || !onChange) return
    if (selected === option) return
    onChange(option)
  }

  return (
    <Grid size={size}>
      <FormControl
        fullWidth
        required={required && !readOnly}
        error={error}
        disabled={disabled && !readOnly}
        onBlur={onBlur}
        sx={{ m: 0 }}
      >
        <Box
          sx={{
            position: 'relative',
            minHeight: fieldHeight,
            height: fieldHeight,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: error
              ? 'error.main'
              : readOnly
                ? 'divider'
                : 'rgba(0, 0, 0, 0.23)',
            bgcolor: readOnly
              ? 'rgba(11, 61, 145, 0.02)'
              : disabled
                ? 'action.disabledBackground'
                : 'background.paper',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            '&:hover': interactive
              ? { borderColor: error ? 'error.main' : 'text.primary' }
              : undefined,
            '&:focus-within': interactive
              ? {
                  borderColor: error ? 'error.main' : MARIAN_BLUE,
                  boxShadow: error
                    ? 'inset 0 0 0 1px #d32f2f'
                    : `inset 0 0 0 1px ${MARIAN_BLUE}`,
                }
              : undefined,
          }}
        >
          <FormLabel
            required={required && !readOnly}
            sx={{
              position: 'absolute',
              top: 0,
              left: 10,
              px: 0.5,
              transform: 'translateY(-50%)',
              typography: 'caption',
              fontSize: '0.75rem',
              lineHeight: 1,
              fontWeight: 400,
              bgcolor: readOnly ? 'background.paper' : 'background.paper',
              color: error ? 'error.main' : 'text.secondary',
              '&.Mui-focused': {
                color: error ? 'error.main' : MARIAN_BLUE,
              },
              '&.Mui-error': { color: 'error.main' },
              '&.Mui-disabled': { color: 'text.disabled' },
              '& .MuiFormLabel-asterisk': {
                color: error ? 'error.main' : undefined,
              },
            }}
          >
            {label}
          </FormLabel>

          <Stack
            direction="row"

            spacing={0.5}
            useFlexGap
            sx={{ alignItems: "center", width: '100%',
              flexWrap: 'wrap',
              columnGap: { xs: 0.5, sm: 1.25 },
              rowGap: 0,
              ml: -0.75, }}
          >
            {GENDER_OPTIONS.map((option) => {
              const checked = selected === option
              const optionId = `${idPrefix}-${option.toLowerCase()}`

              if (readOnly) {
                return (
                  <Stack
                    key={option}
                    direction="row"
                    spacing={0.75}

                    sx={{ alignItems: "center", minWidth: 72, py: 0.25, px: 0.5 }}
                  >
                    <Typography
                      variant="body2"
                      aria-hidden
                      sx={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: checked ? MARIAN_BLUE : 'text.disabled',
                        lineHeight: 1,
                        width: 18,
                        textAlign: 'center',
                      }}
                    >
                      {checked ? '☑' : '☐'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: checked ? 'text.primary' : 'text.secondary',
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      {option}
                    </Typography>
                  </Stack>
                )
              }

              return (
                <Box
                  key={option}
                  component="label"
                  htmlFor={optionId}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: disabled ? 'default' : 'pointer',
                    userSelect: 'none',
                    borderRadius: 1,
                    pr: 0.75,
                    '&:hover .MuiCheckbox-root': disabled
                      ? undefined
                      : { bgcolor: 'rgba(11, 61, 145, 0.04)' },
                  }}
                >
                  <Checkbox
                    id={optionId}
                    size="small"
                    checked={checked}
                    onChange={() => handleSelect(option)}
                    disabled={disabled}
                    disableRipple={false}
                    slotProps={{ input: { 'aria-label': option } }}
                    sx={{
                      p: 0.75,
                      color: error ? 'error.main' : MARIAN_BLUE,
                      '&.Mui-checked': {
                        color: error ? 'error.main' : MARIAN_BLUE,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: disabled ? 'text.disabled' : 'text.primary',
                      fontWeight: checked ? 600 : 400,
                    }}
                  >
                    {option}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </Box>

        <FormHelperText
          sx={{
            mx: 1.75,
            mt: 0.375,
            mb: 0,
            minHeight: '1.25em',
            lineHeight: 1.25,
          }}
        >
          {helperText || ' '}
        </FormHelperText>
      </FormControl>
    </Grid>
  )
}
