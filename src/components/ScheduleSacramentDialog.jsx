import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import { isSacramentalEvent } from '../constants'
import { getSacramentColor } from '../constants/sacramentColors'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { formatScheduleTime } from '../utils/parishCalendar'

/**
 * Options for Calendar double-click Quick Create (sacramental records).
 */
export const SACRAMENT_SCHEDULE_OPTIONS = [
  { value: 'baptism', label: 'Baptism' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'death', label: 'Death Record' },
  { value: 'conversion', label: 'Conversion' },
]

/** @deprecated Prefer SACRAMENT_SCHEDULE_OPTIONS — same list. */
export const CREATE_NEW_RECORD_OPTIONS = SACRAMENT_SCHEDULE_OPTIONS

function ScheduledEventRow({ event, onSelect }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      onClick={() => onSelect?.(event)}
      sx={{
        alignItems: 'flex-start',
        py: 0.85,
        px: 0.75,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.04)' },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          minWidth: 72,
          fontWeight: 650,
          color: MARIAN_BLUE,
          fontSize: '0.84rem',
          pt: 0.1,
        }}
      >
        {formatScheduleTime(event.time) || '—'}
      </Typography>
      <Box
        sx={{
          width: 8,
          height: 8,
          mt: 0.7,
          borderRadius: '50%',
          bgcolor: getSacramentColor(event.source),
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 650,
            color: 'text.primary',
            fontSize: '0.92rem',
            lineHeight: 1.35,
          }}
        >
          {event.title}
        </Typography>
      </Box>
    </Stack>
  )
}

function ScheduledGroup({ heading, events, onSelectEvent }) {
  if (!events.length) return null

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 0.35,
          px: 0.75,
          fontWeight: 700,
          color: 'text.secondary',
          fontSize: '0.72rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {heading}
      </Typography>
      <Stack spacing={0} divider={<Divider flexItem />}>
        {events.map((event) => (
          <ScheduledEventRow
            key={event.id}
            event={event}
            onSelect={onSelectEvent}
          />
        ))}
      </Stack>
    </Box>
  )
}

/**
 * Overview when a date already has scheduled items.
 * Quick actions open the existing create dialogs.
 */
export function DateScheduleOverviewDialog({
  open,
  events = [],
  onClose,
  onSelectEvent,
  onAddSacramentalRecord,
  onAddCalendarEvent,
}) {
  const scheduled = Array.isArray(events) ? events : []
  const sacramentalEvents = scheduled.filter((event) => isSacramentalEvent(event))
  const calendarEvents = scheduled.filter((event) => !isSacramentalEvent(event))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700, pb: 1 }}>
        Scheduled on this Date
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack spacing={1.75}>
            <ScheduledGroup
              heading="Sacramental Records"
              events={sacramentalEvents}
              onSelectEvent={onSelectEvent}
            />
            <ScheduledGroup
              heading="Calendar Events"
              events={calendarEvents}
              onSelectEvent={onSelectEvent}
            />
          </Stack>

          <Divider />

          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.25,
                fontWeight: 700,
                color: 'text.secondary',
                fontSize: '0.72rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Quick Actions
            </Typography>
            <Stack spacing={1.25}>
              <Button
                variant="contained"
                startIcon={<AccountBalanceOutlinedIcon />}
                onClick={onAddSacramentalRecord}
                sx={{
                  borderRadius: 3,
                  minHeight: 48,
                  justifyContent: 'flex-start',
                  px: 2,
                  fontWeight: 650,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Add Sacramental Record
              </Button>
              <Button
                variant="outlined"
                startIcon={<EventOutlinedIcon />}
                onClick={onAddCalendarEvent}
                sx={{
                  borderRadius: 3,
                  minHeight: 48,
                  justifyContent: 'flex-start',
                  px: 2,
                  fontWeight: 650,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  borderColor: MARIAN_BLUE,
                  color: MARIAN_BLUE,
                  '&:hover': {
                    borderColor: MARIAN_BLUE,
                    bgcolor: 'rgba(11, 61, 145, 0.04)',
                  },
                }}
              >
                Add Calendar Event
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
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
      </DialogActions>
    </Dialog>
  )
}

/**
 * Calendar Quick Create step 1: choose which sacramental record type to add.
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
          },
        },
      }}
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
