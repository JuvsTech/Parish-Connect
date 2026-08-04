import { useEffect, useId, useMemo, useState } from 'react'
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  formatMinisterDisplayName,
  getMinisters,
} from '../services/ministerService'
import { toProperCase } from '../utils/textFormatter'

const EMPTY_HELPER =
  'No active ministers for this sacrament. Add one under Manage Ministers.'

/** Sentinel select value — never stored in Firestore. */
const OTHER_OPTION_VALUE = '__other_minister__'
const OTHER_OPTION_LABEL = 'Other'

/**
 * @param {string} [assignment] — sacrament filter (Baptism, Confirmation,
 * Marriage, Burial, Conversion). Required for correct dropdown filtering.
 *
 * Historical / external / retired / inactive minister names already saved on
 * a record still appear via the Other + Minister Name path so edit never crashes.
 */
export default function MinisterField({
  value = '',
  onChange,
  onBlur,
  error = false,
  helperText = ' ',
  disabled = false,
  required = true,
  label = 'Minister',
  assignment = '',
}) {
  const reactId = useId()
  const labelId = `${reactId}-minister-label`
  const selectId = `${reactId}-minister-select`
  const otherNameId = `${reactId}-minister-other-name`

  const [ministers, setMinisters] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  /** True after the user explicitly chooses Other (even before typing a name). */
  const [otherSelected, setOtherSelected] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const rows = await getMinisters({
          activeOnly: true,
          assignment: assignment || undefined,
        })
        if (active) setMinisters(Array.isArray(rows) ? rows : [])
      } catch (err) {
        if (active) {
          setMinisters([])
          setLoadError(
            err instanceof Error ? err.message : 'Unable to load ministers.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [assignment])

  const options = useMemo(
    () =>
      (Array.isArray(ministers) ? ministers : [])
        .map((minister) => ({
          id: minister?.id || formatMinisterDisplayName(minister),
          label: formatMinisterDisplayName(minister),
        }))
        .filter((item) => item.label),
    [ministers],
  )

  const selected = String(value || '').trim()
  const inOptions = options.some((item) => item.label === selected)
  const isCustomValue = Boolean(selected && !inOptions)
  const showOtherName = otherSelected || isCustomValue
  const selectValue = showOtherName ? OTHER_OPTION_VALUE : selected
  const isEmpty = options.length === 0 && !loading

  useEffect(() => {
    if (inOptions) {
      setOtherSelected(false)
    }
  }, [inOptions, selected])

  let resolvedHelper = ' '
  if (error) {
    resolvedHelper = helperText || ' '
  } else if (loadError) {
    resolvedHelper = loadError
  } else if (isEmpty && !showOtherName) {
    resolvedHelper = EMPTY_HELPER
  } else if (helperText && helperText !== ' ') {
    resolvedHelper = helperText
  }

  function handleSelectChange(event) {
    const next = event.target.value
    if (next === OTHER_OPTION_VALUE) {
      setOtherSelected(true)
      onChange?.('')
      return
    }
    setOtherSelected(false)
    onChange?.(next)
  }

  function handleOtherNameChange(event) {
    onChange?.(event.target.value)
  }

  function handleOtherNameBlur(event) {
    const formatted = toProperCase(selected)
    if (formatted !== selected) {
      onChange?.(formatted)
    }
    onBlur?.(event)
  }

  const otherNameError =
    error && showOtherName && !selected
      ? helperText && helperText !== ' '
        ? helperText
        : 'Minister Name is required.'
      : ''

  return (
    <Stack spacing={0} sx={{ width: '100%' }}>
      <FormControl
        fullWidth
        required={required}
        error={error || Boolean(loadError)}
        disabled={disabled || loading}
      >
        <InputLabel id={labelId} shrink htmlFor={selectId}>
          {label}
        </InputLabel>
        <Select
          labelId={labelId}
          id={selectId}
          value={loading ? '' : selectValue}
          onChange={handleSelectChange}
          onBlur={showOtherName ? undefined : onBlur}
          displayEmpty
          input={<OutlinedInput notched label={label} />}
          renderValue={(current) => {
            if (loading) {
              return (
                <Typography component="span" color="text.secondary">
                  Loading ministers...
                </Typography>
              )
            }
            if (current === OTHER_OPTION_VALUE) {
              return OTHER_OPTION_LABEL
            }
            if (!current) {
              return (
                <Typography component="span" color="text.secondary">
                  Select Minister
                </Typography>
              )
            }
            return current
          }}
        >
          <MenuItem value="" disabled sx={{ display: 'none' }} />

          {loading && (
            <MenuItem disabled value="__loading__">
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Loading...
            </MenuItem>
          )}

          {!loading &&
            options.map((option) => (
              <MenuItem key={option.id} value={option.label}>
                {option.label}
              </MenuItem>
            ))}

          {!loading && (
            <MenuItem value={OTHER_OPTION_VALUE}>{OTHER_OPTION_LABEL}</MenuItem>
          )}
        </Select>
        <FormHelperText>
          {showOtherName ? ' ' : resolvedHelper}
        </FormHelperText>
      </FormControl>

      {showOtherName && (
        <TextField
          id={otherNameId}
          label="Minister Name"
          value={selected}
          onChange={handleOtherNameChange}
          onBlur={handleOtherNameBlur}
          fullWidth
          required={required}
          disabled={disabled || loading}
          error={Boolean(otherNameError) || (error && !selected)}
          helperText={
            otherNameError ||
            (error && !selected
              ? helperText && helperText !== ' '
                ? helperText
                : 'Minister Name is required.'
              : 'Enter the full name of the visiting or unregistered minister.')
          }
          placeholder="e.g. Fr. Pedro Santos"
        />
      )}
    </Stack>
  )
}
