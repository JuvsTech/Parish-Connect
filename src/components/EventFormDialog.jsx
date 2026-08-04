import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  MANUAL_EVENT_TITLES,
  MESSAGES,
  OTHER_EVENT_TITLE,
  isSacramentalEvent,
} from '../constants'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { getEventDateKey, isPastDateKey, toDateKey } from '../utils/parishCalendar'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import UnsavedChangesDialog from './UnsavedChangesDialog'

const INITIAL_FORM = {
  titleOption: '',
  customTitle: '',
  date: '',
  time: '',
  description: '',
}

function resolveTitleOption(event) {
  const title = String(event?.title || '').trim()
  const category = String(event?.category || '').trim()

  if (MANUAL_EVENT_TITLES.includes(title) && title !== OTHER_EVENT_TITLE) {
    return { titleOption: title, customTitle: '' }
  }

  if (
    MANUAL_EVENT_TITLES.includes(category) &&
    category !== OTHER_EVENT_TITLE &&
    title === category
  ) {
    return { titleOption: category, customTitle: '' }
  }

  if (
    MANUAL_EVENT_TITLES.includes(category) &&
    category !== OTHER_EVENT_TITLE &&
    !title
  ) {
    return { titleOption: category, customTitle: '' }
  }

  // Custom / legacy titles map to Others + custom text.
  return {
    titleOption: OTHER_EVENT_TITLE,
    customTitle: title || '',
  }
}

function eventToForm(event) {
  if (!event) return { ...INITIAL_FORM }

  const { titleOption, customTitle } = resolveTitleOption(event)

  return {
    titleOption,
    customTitle,
    date: event.dateKey || (event.date ? toDateKey(event.date) : ''),
    time: event.time || '',
    description: event.description || '',
  }
}

function validateEventForm(form) {
  const errors = {}

  if (!String(form.titleOption || '').trim()) {
    errors.titleOption = MESSAGES.ERROR.EVENT_REQUIRED_FIELDS
  }

  if (form.titleOption === OTHER_EVENT_TITLE) {
    if (!String(form.customTitle || '').trim()) {
      errors.customTitle = MESSAGES.ERROR.EVENT_CUSTOM_TITLE_REQUIRED
    }
  }

  if (!form.date) {
    errors.date = MESSAGES.ERROR.EVENT_REQUIRED_FIELDS
  }
  if (!form.time) {
    errors.time = MESSAGES.ERROR.EVENT_REQUIRED_FIELDS
  }

  return errors
}

function resolveSavePayload(form) {
  const titleOption = String(form.titleOption || '').trim()
  const isOther = titleOption === OTHER_EVENT_TITLE
  const title = isOther
    ? String(form.customTitle || '').trim()
    : titleOption

  return {
    title,
    category: titleOption,
    date: form.date,
    time: form.time,
    description: String(form.description || '').trim(),
  }
}

/**
 * Add / Edit dialog for manual parish events.
 * Sacramental events open in read-only mode with a locked message.
 */
export default function EventFormDialog({
  open,
  mode = 'add',
  event = null,
  defaultDate = '',
  onClose,
  onSave,
  saving = false,
}) {
  const isEdit = mode === 'edit'
  const isSacramentalLocked = Boolean(event && isSacramentalEvent(event))
  const isPastLocked = Boolean(event && isPastDateKey(getEventDateKey(event)))
  const isLocked = isSacramentalLocked || isPastLocked
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const {
    confirmOpen,
    captureBaseline,
    clearBaseline,
    markSaved,
    requestClose,
    keepEditing,
    discardChanges,
  } = useUnsavedChanges(form, {
    enabled: open && !saving && !isLocked,
  })

  const showCustomTitle = form.titleOption === OTHER_EVENT_TITLE

  useEffect(() => {
    if (!open) {
      clearBaseline()
      return
    }

    const initialForm =
      isEdit || isLocked
        ? eventToForm(event)
        : {
            ...INITIAL_FORM,
            date: defaultDate || '',
          }

    setForm(initialForm)
    captureBaseline(initialForm)
    setErrors({})
    setSubmitAttempted(false)
  }, [open, isEdit, isLocked, event, defaultDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(field) {
    return (eventValue) => {
      const value = eventValue?.target ? eventValue.target.value : eventValue
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (field === 'titleOption' && value !== OTHER_EVENT_TITLE) {
          next.customTitle = ''
        }
        return next
      })
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        if (field === 'titleOption') {
          delete next.customTitle
        }
        return next
      })
    }
  }

  function showError(field) {
    return Boolean((submitAttempted || errors[field]) && errors[field])
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    setErrors({})
    setSubmitAttempted(false)
    clearBaseline()
    onClose?.()
  }

  function handleCloseRequest() {
    if (saving) return
    if (isLocked) {
      onClose?.()
      return
    }
    requestClose(resetAndClose)
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()

    if (isLocked) {
      onClose?.()
      return
    }

    const nextErrors = validateEventForm(form)
    setErrors(nextErrors)
    setSubmitAttempted(true)

    if (Object.keys(nextErrors).length > 0) return

    try {
      await onSave?.(resolveSavePayload(form))
      markSaved(form)
    } catch {
      // Parent surfaces the error. Keep the dialog open.
    }
  }

  const titleOptions = (() => {
    if (isLocked && form.titleOption && !MANUAL_EVENT_TITLES.includes(form.titleOption)) {
      return [form.titleOption, ...MANUAL_EVENT_TITLES]
    }
    return MANUAL_EVENT_TITLES
  })()

  return (
    <>
    <Dialog
      open={open}
      onClose={saving ? undefined : handleCloseRequest}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: {
        sx: { borderRadius: 3 },
      } }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2.5, sm: 3 },
          pt: 2.25,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography
          component="span"
          variant="h6"
          sx={{ fontWeight: 700, color: MARIAN_BLUE }}
        >
          {isSacramentalLocked
            ? 'Sacramental Event'
            : isPastLocked
              ? 'View Event'
              : isEdit
                ? 'Edit Event'
                : 'Add Event'}
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={handleCloseRequest}
          disabled={saving}
          size="small"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pt: 1, pb: 1 }}>
          {isSacramentalLocked && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(11, 61, 145, 0.05)',
                border: '1px solid',
                borderColor: 'rgba(11, 61, 145, 0.12)',
                lineHeight: 1.55,
              }}
            >
              {MESSAGES.ERROR.EVENT_SACRAMENTAL_LOCKED}
            </Typography>
          )}

          {isPastLocked && !isSacramentalLocked && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(11, 61, 145, 0.05)',
                border: '1px solid',
                borderColor: 'rgba(11, 61, 145, 0.12)',
                lineHeight: 1.55,
              }}
            >
              {MESSAGES.ERROR.EVENT_PAST_LOCKED}
            </Typography>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl
                fullWidth
                required
                error={showError('titleOption')}
                disabled={saving || isLocked}
              >
                <InputLabel id="event-title-label">Event Title</InputLabel>
                <Select
                  labelId="event-title-label"
                  label="Event Title"
                  value={form.titleOption}
                  onChange={handleChange('titleOption')}
                >
                  {titleOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('titleOption') ? errors.titleOption : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>

            {showCustomTitle && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Custom Event Title"
                  value={form.customTitle}
                  onChange={handleChange('customTitle')}
                  error={showError('customTitle')}
                  helperText={
                    showError('customTitle') ? errors.customTitle : ' '
                  }
                  fullWidth
                  required
                  disabled={saving || isLocked}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={handleChange('date')}
                error={showError('date')}
                helperText={showError('date') ? errors.date : ' '}
                fullWidth
                required
                disabled={saving || isLocked}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Time"
                type="time"
                value={form.time}
                onChange={handleChange('time')}
                error={showError('time')}
                helperText={showError('time') ? errors.time : ' '}
                fullWidth
                required
                disabled={saving || isLocked}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                value={form.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                minRows={3}
                disabled={saving || isLocked}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2, gap: 1 }}>
          <Button onClick={handleCloseRequest} disabled={saving} variant="outlined">
            {isLocked ? 'Close' : 'Cancel'}
          </Button>
          {!isLocked && (
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>

    <UnsavedChangesDialog
      open={confirmOpen}
      onKeepEditing={keepEditing}
      onDiscard={discardChanges}
    />
    </>
  )
}

export function DeleteEventDialog({
  open,
  event,
  onClose,
  onConfirm,
  deleting = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: MARIAN_BLUE }}>
        Delete Event
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Are you sure you want to delete{' '}
          <Box component="span" sx={{ fontWeight: 650, color: 'text.primary' }}>
            {event?.title || 'this event'}
          </Box>
          ? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={deleting} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          variant="contained"
          color="error"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
