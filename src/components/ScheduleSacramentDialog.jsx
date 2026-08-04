import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'

/**
 * Options for Calendar double-click Quick Create.
 * Kept export name for existing Dashboard imports.
 */
export const SACRAMENT_SCHEDULE_OPTIONS = [
  { value: 'baptism', label: 'Baptism' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'death', label: 'Death Record' },
  { value: 'conversion', label: 'Conversion ' },
  { value: 'massIntention', label: 'Mass Intention' },
]

/** @deprecated Prefer SACRAMENT_SCHEDULE_OPTIONS — same list. */
export const CREATE_NEW_RECORD_OPTIONS = SACRAMENT_SCHEDULE_OPTIONS

/**
 * Calendar Quick Create step 1: choose which record type to add.
 * Opens from double-click on an empty calendar date (or empty day schedule).
 */
export default function ScheduleSacramentDialog({
  open,
  onClose,
  onContinue,
  defaultValue = '',
}) {
  const [selected, setSelected] = useState(defaultValue)
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected(defaultValue)
    setAttempted(false)
  }, [open, defaultValue])

  function handleContinue() {
    setAttempted(true)
    const option = SACRAMENT_SCHEDULE_OPTIONS.find(
      (item) => item.value === selected,
    )
    if (!option) return
    onContinue?.(option)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: {
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
        },
      } }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700, pb: 1 }}>
        Create New Record
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1.25 }}>
          Select the record type to create.
        </Typography>
        <FormControl error={attempted && !selected} fullWidth>
          <RadioGroup
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {SACRAMENT_SCHEDULE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
                sx={{
                  mx: 0,
                  px: 1,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.04)' },
                }}
              />
            ))}
          </RadioGroup>
          <FormHelperText>
            {attempted && !selected ? 'Please select a record type.' : ' '}
          </FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: MARIAN_BLUE,
              bgcolor: 'rgba(11, 61, 145, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          variant="contained"
          sx={{ borderRadius: 3, minWidth: 110 }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
