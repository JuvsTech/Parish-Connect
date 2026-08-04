import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { MARIAN_BLUE, SOFT_SHADOW_HOVER } from '../theme/parishTheme'
import PageHeader from '../components/PageHeader'
import ScheduleSacramentDialog, {
  DateScheduleOverviewDialog,
} from '../components/ScheduleSacramentDialog'
import { BaptismNewRecordFormDialog } from '../components/BaptismRecordFormDialog'
import { ConfirmationNewRecordFormDialog } from '../components/ConfirmationRecordFormDialog'
import { MarriageNewRecordFormDialog } from '../components/MarriageRecordFormDialog'
import { DeathNewRecordFormDialog } from '../components/DeathRecordFormDialog'
import { ConversionNewRecordFormDialog } from '../components/ConversionRecordFormDialog'
import MassIntentionFormDialog from '../components/MassIntentionFormDialog'
import EventFormDialog, {
  DeleteEventDialog,
} from '../components/EventFormDialog'
import { MESSAGES, isManualEvent, isSacramentalEvent } from '../constants'
import { getSacramentColor } from '../constants/sacramentColors'
import { getSacramentalRecordCounts } from '../services/dashboardService'
import {
  createBaptismRecord,
  getBaptismRecords,
} from '../services/baptismService'
import {
  createConfirmationRecord,
  getConfirmationRecords,
} from '../services/confirmationService'
import {
  createDeathRecord,
  getDeathRecords,
} from '../services/deathService'
import {
  createMarriageRecord,
  getMarriageRecords,
} from '../services/marriageService'
import {
  createConversionRecord,
  getConversionRecords,
} from '../services/conversionService'
import {
  createMassIntentionRecord,
  getMassIntentionDashboardStats,
  getMassIntentionRecords,
} from '../services/massIntentionService'
import {
  getIntentionForDisplayName,
} from '../utils/personName'
import { PARISH_TIME_OPTIONS } from '../constants/parishTimes'
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from '../services/eventService'
import { getDateSourceColors } from '../utils/calendarColors'
import {
  formatMonthYear,
  formatScheduleTime,
  formatShortDate,
  getCalendarCells,
  getEventDateKey,
  getEventsForDate,
  getUpcomingEvents,
  isPastDateKey,
  isPastEvent,
  isSameDay,
  parseDateKey,
  startOfDay,
  toDateKey,
} from '../utils/parishCalendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SectionCard({ title, children, sx }) {
  return (
    <Card
      sx={{
        height: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      <Box
        sx={{
          bgcolor: MARIAN_BLUE,
          minHeight: 42,
          px: { xs: 1.75, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography
          component="h3"
          sx={{
            m: 0,
            fontWeight: 700,
            color: '#fff',
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
      </Box>
      <CardContent
        sx={{
          px: { xs: 1.75, sm: 2 },
          py: { xs: 1.5, sm: 1.75 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          '&:last-child': { pb: { xs: 1.5, sm: 1.75 } },
        }}
      >
        {children}
      </CardContent>
    </Card>
  )
}

function EmptyEventsMessage({ message }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 2,
        px: 1,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          mb: 1,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(11, 61, 145, 0.06)',
          color: MARIAN_BLUE,
        }}
      >
        <EventAvailableOutlinedIcon sx={{ fontSize: 22 }} />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500, lineHeight: 1.5 }}
      >
        {message}
      </Typography>
    </Box>
  )
}

function MonthlyCalendar({
  viewDate,
  selectedDate,
  today,
  dateColors,
  onSelectDate,
  onDoubleClickDate,
  onChangeMonth,
  onAddEvent,
}) {
  const cells = useMemo(() => getCalendarCells(viewDate), [viewDate])

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        minHeight: { xs: 360, md: 450 },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.25,
            mb: 1.5,
            width: '100%',
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: MARIAN_BLUE,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
              }}
            >
              {formatMonthYear(viewDate)}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                aria-label="Previous month"
                size="small"
                onClick={() => onChangeMonth(-1)}
                sx={{
                  color: MARIAN_BLUE,
                  bgcolor: 'rgba(11, 61, 145, 0.05)',
                  '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.1)' },
                }}
              >
                <ChevronLeftRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label="Next month"
                size="small"
                onClick={() => onChangeMonth(1)}
                sx={{
                  color: MARIAN_BLUE,
                  bgcolor: 'rgba(11, 61, 145, 0.05)',
                  '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.1)' },
                }}
              >
                <ChevronRightRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onAddEvent}
            sx={{
              borderRadius: 3,
              minHeight: 40,
              ml: { xs: 0, sm: 'auto' },
              flexShrink: 0,
            }}
          >
            Add Event
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: { xs: 0.4, sm: 0.6 },
            mb: 0.75,
          }}
        >
          {WEEKDAYS.map((day) => (
            <Typography
              key={day}
              variant="caption"
              sx={{
                textAlign: 'center',
                fontWeight: 650,
                color: 'text.secondary',
                fontSize: '0.72rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: { xs: 0.4, sm: 0.6 },
            flex: 1,
          }}
        >
          {cells.map((date, index) => {
            if (!date) {
              return <Box key={`empty-${index}`} />
            }

            const key = toDateKey(date)
            const isToday = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            const colors = dateColors.get(key) || []

            return (
              <Box
                key={key}
                component="button"
                type="button"
                onClick={() => onSelectDate(date)}
                onDoubleClick={() => onDoubleClickDate?.(date)}
                aria-label={date.toDateString()}
                aria-pressed={isSelected}
                title="Single-click to view · Double-click to create a record"
                sx={{
                  border: '1px solid',
                  borderColor: isSelected
                    ? MARIAN_BLUE
                    : isToday
                      ? 'rgba(11, 61, 145, 0.28)'
                      : 'transparent',
                  borderRadius: 2.5,
                  bgcolor: isSelected
                    ? MARIAN_BLUE
                    : isToday
                      ? 'rgba(11, 61, 145, 0.08)'
                      : 'transparent',
                  color: isSelected ? '#fff' : 'text.primary',
                  minHeight: { xs: 38, sm: 48, md: 54 },
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.3,
                  transition:
                    'background-color 0.15s ease, border-color 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected
                      ? MARIAN_BLUE
                      : 'rgba(11, 61, 145, 0.06)',
                    borderColor: isSelected
                      ? MARIAN_BLUE
                      : 'rgba(11, 61, 145, 0.2)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: isToday || isSelected ? 700 : 500,
                    fontSize: { xs: '0.85rem', sm: '0.92rem' },
                    lineHeight: 1,
                  }}
                >
                  {date.getDate()}
                </Typography>
                {colors.length > 0 && (
                  <Stack direction="row" spacing={0.35} sx={{ justifyContent: "center" }}>
                    {colors.slice(0, 4).map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: isSelected ? '#fff' : color,
                          opacity: isSelected ? 0.95 : 0.9,
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )
          })}
        </Box>
      </CardContent>
    </Card>
  )
}

function EventListItem({
  event,
  primaryLabel,
  onSelect,
  onDelete,
  showDelete = false,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}

      sx={{ alignItems: "center", py: 0.85,
        borderRadius: 2,
        px: 0.5,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.04)' }, }}
      onClick={() => onSelect?.(event)}
    >
      <Typography
        variant="body2"
        sx={{
          minWidth: 78,
          fontWeight: 650,
          color: MARIAN_BLUE,
          fontSize: '0.84rem',
        }}
      >
        {primaryLabel}
      </Typography>
      <Box
        sx={{
          width: 8,
          height: 8,
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
        {event.category && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.15 }}
          >
            {event.category}
            {isSacramentalEvent(event) ? ' · Linked record' : ''}
          </Typography>
        )}
      </Box>
      {showDelete && isManualEvent(event) && (
        <IconButton
          size="small"
          aria-label={`Delete ${event.title}`}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation()
            onDelete?.(event)
          }}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: '#C62828', bgcolor: 'rgba(198, 40, 40, 0.06)' },
          }}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  )
}

function DaySchedulePanel({
  selectedDate,
  events,
  onSelectEvent,
  onDeleteEvent,
  onDoubleClickEmpty,
}) {
  const isToday = isSameDay(selectedDate, startOfDay(new Date()))
  const title = isToday ? "Today's Schedule" : 'Day Schedule'

  return (
    <SectionCard title={title}>
      {events.length === 0 ? (
        <Box
          onDoubleClick={() => onDoubleClickEmpty?.(selectedDate)}
          title="Double-click to create a record"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 120,
            cursor: 'default',
            borderRadius: 2,
          }}
        >
          <EmptyEventsMessage message="No scheduled events for this day. Double-click to create a record." />
        </Box>
      ) : (
        <Stack spacing={0} divider={<Divider flexItem />}>
          {events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              primaryLabel={formatScheduleTime(event.time)}
              onSelect={onSelectEvent}
              onDelete={onDeleteEvent}
              showDelete
            />
          ))}
        </Stack>
      )}
    </SectionCard>
  )
}

function UpcomingEventsPanel({ events, onSelectEvent }) {
  return (
    <SectionCard
      title="Upcoming Events"
      sx={{ minHeight: { xs: 170, md: 180 } }}
    >
      {events.length === 0 ? (
        <EmptyEventsMessage message="No events scheduled." />
      ) : (
        <Stack spacing={0} divider={<Divider flexItem />}>
          {events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              primaryLabel={formatShortDate(
                parseDateKey(getEventDateKey(event)),
              )}
              onSelect={onSelectEvent}
            />
          ))}
        </Stack>
      )}
    </SectionCard>
  )
}

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: SOFT_SHADOW_HOVER,
        },
      }}
    >
      <CardContent
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          '&:last-child': { pb: 1.5 },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(11, 61, 145, 0.07)',
            color: MARIAN_BLUE,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 17 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.7rem',
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.15,
              fontWeight: 700,
              color: MARIAN_BLUE,
              fontSize: '1.2rem',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            {Number(value || 0).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)
  const [events, setEvents] = useState([])
  const [counts, setCounts] = useState({
    baptism: 0,
    confirmation: 0,
    marriage: 0,
    death: 0,
    conversion: 0,
    massIntention: 0,
  })
  const [massIntentionStats, setMassIntentionStats] = useState({
    pendingCount: 0,
    todayScheduledCount: 0,
    todayIntentions: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [dateOverviewOpen, setDateOverviewOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [scheduleTime, setScheduleTime] = useState('')
  const [sacramentForm, setSacramentForm] = useState(null)
  const [baptismRecords, setBaptismRecords] = useState([])
  const [confirmationRecords, setConfirmationRecords] = useState([])
  const [marriageRecords, setMarriageRecords] = useState([])
  const [deathRecords, setDeathRecords] = useState([])
  const [conversionRecords, setConversionRecords] = useState([])
  const [massIntentionRecords, setMassIntentionRecords] = useState([])
  const [sacramentSaving, setSacramentSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const loadDashboard = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true)
    setError('')

    try {
      const [nextEvents, nextCounts] = await Promise.all([
        getEvents(),
        getSacramentalRecordCounts(),
      ])
      setEvents(nextEvents)
      setCounts(nextCounts)

      try {
        setMassIntentionStats(await getMassIntentionDashboardStats())
      } catch (massErr) {
        setMassIntentionStats({
          pendingCount: 0,
          todayScheduledCount: 0,
          todayIntentions: [],
        })
        showSnackbar(
          massErr instanceof Error
            ? massErr.message
            : 'Unable to load Mass Intention stats.',
          'error',
        )
      }
    } catch (err) {
      setEvents([])
      setError(
        err instanceof Error ? err.message : MESSAGES.ERROR.DASHBOARD_LOAD,
      )
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      setLoading(true)
      setError('')
      try {
        const [nextEvents, nextCounts] = await Promise.all([
          getEvents(),
          getSacramentalRecordCounts(),
        ])
        if (cancelled) return
        setEvents(nextEvents)
        setCounts(nextCounts)

        try {
          const nextMassStats = await getMassIntentionDashboardStats()
          if (!cancelled) setMassIntentionStats(nextMassStats)
        } catch (massErr) {
          if (cancelled) return
          setMassIntentionStats({
            pendingCount: 0,
            todayScheduledCount: 0,
            todayIntentions: [],
          })
          showSnackbar(
            massErr instanceof Error
              ? massErr.message
              : 'Unable to load Mass Intention stats.',
            'error',
          )
        }
      } catch (err) {
        if (cancelled) return
        setEvents([])
        setError(
          err instanceof Error ? err.message : MESSAGES.ERROR.DASHBOARD_LOAD,
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialLoad()
    return () => {
      cancelled = true
    }
  }, [showSnackbar])

  const dateColors = useMemo(() => getDateSourceColors(events), [events])
  const dayEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate],
  )
  const upcomingEvents = useMemo(
    () => getUpcomingEvents(events, selectedDate, 4),
    [events, selectedDate],
  )
  const todayScheduledCount = useMemo(
    () => getEventsForDate(events, today).filter(isSacramentalEvent).length,
    [events, today],
  )
  const prefillDate = toDateKey(scheduleDate || selectedDate)
  const prefillTime = scheduleTime || ''

  const summaryCards = [
    {
      title: "Today's Scheduled Sacraments",
      value: todayScheduledCount,
      icon: EventAvailableOutlinedIcon,
    },
    {
      title: 'Baptismal Records',
      value: counts.baptism,
      icon: WaterDropOutlinedIcon,
    },
    {
      title: 'Confirmation Records',
      value: counts.confirmation,
      icon: VerifiedOutlinedIcon,
    },
    {
      title: 'Marriage Records',
      value: counts.marriage,
      icon: FavoriteBorderOutlinedIcon,
    },
    {
      title: 'Death Records',
      value: counts.death,
      icon: VolunteerActivismOutlinedIcon,
    },
    {
      title: 'Conversion Records',
      value: counts.conversion,
      icon: HowToRegOutlinedIcon,
    },
  ]

  function handleChangeMonth(delta) {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    )
  }

  function handleSelectDate(date) {
    const next = startOfDay(date)
    setSelectedDate(next)
    setViewDate(new Date(next.getFullYear(), next.getMonth(), 1))
  }

  function openQuickCreate(date, time = '') {
    const next = startOfDay(date)
    setSelectedDate(next)
    setViewDate(new Date(next.getFullYear(), next.getMonth(), 1))

    if (isPastDateKey(toDateKey(next))) {
      showSnackbar(MESSAGES.ERROR.EVENT_PAST_DATE_LOCKED, 'info')
      return
    }

    setScheduleDate(next)
    setScheduleTime(String(time || '').trim())

    if (getEventsForDate(events, next).length > 0) {
      setDateOverviewOpen(true)
      return
    }

    setScheduleOpen(true)
  }

  function handleDoubleClickDate(date) {
    openQuickCreate(date, '')
  }

  function handleDoubleClickEmptyDay(date) {
    openQuickCreate(date || selectedDate, '')
  }

  function handleSelectScheduledFromDialog(event) {
    setDateOverviewOpen(false)
    setScheduleOpen(false)
    handleSelectEvent(event)
  }

  function handleOverviewAddSacramental() {
    setDateOverviewOpen(false)
    setScheduleOpen(true)
  }

  function handleOverviewAddCalendarEvent() {
    setDateOverviewOpen(false)
    handleOpenAddEvent()
  }

  async function handleContinueSchedule(option) {
    setScheduleOpen(false)

    try {
      if (option.value === 'baptism') {
        setBaptismRecords(await getBaptismRecords())
      } else if (option.value === 'confirmation') {
        setConfirmationRecords(await getConfirmationRecords())
      } else if (option.value === 'marriage') {
        setMarriageRecords(await getMarriageRecords())
      } else if (option.value === 'death') {
        setDeathRecords(await getDeathRecords())
      } else if (option.value === 'conversion') {
        setConversionRecords(await getConversionRecords())
      } else if (option.value === 'massIntention') {
        setMassIntentionRecords(await getMassIntentionRecords())
      }
      setSacramentForm(option.value)
    } catch (err) {
      showSnackbar(
        err instanceof Error
          ? err.message
          : 'Unable to load records for scheduling. Please try again.',
        'error',
      )
    }
  }

  function handleCloseSacramentForm() {
    if (sacramentSaving) return
    setSacramentForm(null)
    setScheduleTime('')
  }

  async function handleSaveBaptism(payload) {
    setSacramentSaving(true)
    try {
      await createBaptismRecord(
        { ...payload, recordType: 'new' },
        {
          userEmail: currentUser?.email || '',
        },
      )
      setSacramentForm(null)
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.BAPTISM_CREATED)
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : MESSAGES.ERROR.BAPTISM_CREATE,
        'error',
      )
      throw err
    } finally {
      setSacramentSaving(false)
    }
  }

  async function handleSaveConfirmation(payload) {
    setSacramentSaving(true)
    try {
      await createConfirmationRecord({ ...payload, recordType: 'new' })
      setSacramentForm(null)
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.CONFIRMATION_CREATED)
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : MESSAGES.ERROR.CONFIRMATION_CREATE,
        'error',
      )
      throw err
    } finally {
      setSacramentSaving(false)
    }
  }

  async function handleSaveMarriage(payload) {
    setSacramentSaving(true)
    try {
      await createMarriageRecord(
        { ...payload, recordType: 'new' },
        {
          userEmail: currentUser?.email || '',
          user: currentUser,
        },
      )
      setSacramentForm(null)
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.MARRIAGE_CREATED)
    } catch (err) {
      const friendly =
        err instanceof Error &&
        (err.message === MESSAGES.ERROR.MARRIAGE_DUPLICATE_RECORD ||
          err.message === MESSAGES.ERROR.MARRIAGE_REQUIRED_FIELDS ||
          err.message.includes('birth date'))
          ? err.message
          : MESSAGES.ERROR.MARRIAGE_CREATE
      showSnackbar(friendly, 'error')
      throw new Error(friendly)
    } finally {
      setSacramentSaving(false)
    }
  }

  async function handleSaveDeath(payload) {
    setSacramentSaving(true)
    try {
      await createDeathRecord(
        { ...payload, recordType: 'new' },
        {
          userEmail: currentUser?.email || '',
        },
      )
      setSacramentForm(null)
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.DEATH_CREATED)
    } catch (err) {
      const friendly =
        err instanceof Error &&
        (err.message === MESSAGES.ERROR.DEATH_DUPLICATE_RECORD ||
          err.message === MESSAGES.ERROR.DEATH_REQUIRED_FIELDS ||
          err.message.includes('Burial Date') ||
          err.message.includes('Date of Birth'))
          ? err.message
          : MESSAGES.ERROR.DEATH_CREATE
      showSnackbar(friendly, 'error')
      throw new Error(friendly)
    } finally {
      setSacramentSaving(false)
    }
  }

  async function handleSaveConversion(payload) {
    setSacramentSaving(true)
    try {
      await createConversionRecord(
        { ...payload, recordType: 'new' },
        {
          userEmail: currentUser?.email || '',
        },
      )
      setSacramentForm(null)
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.CONVERSION_CREATED)
    } catch (err) {
      const friendly =
        err instanceof Error &&
        (err.message === MESSAGES.ERROR.CONVERSION_DUPLICATE_RECORD ||
          err.message === MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS)
          ? err.message
          : MESSAGES.ERROR.CONVERSION_CREATE
      showSnackbar(friendly, 'error')
      throw new Error(friendly)
    } finally {
      setSacramentSaving(false)
    }
  }

  async function handleSaveMassIntention(payload) {
    setSacramentSaving(true)
    try {
      await createMassIntentionRecord(payload, {
        userEmail: currentUser?.email || '',
        existingRecords: massIntentionRecords,
      })
      setSacramentForm(null)
      setScheduleTime('')
      await loadDashboard({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.MASS_INTENTION_CREATED)
    } catch (err) {
      if (err?.fieldErrors) throw err
      showSnackbar(
        err instanceof Error
          ? err.message
          : MESSAGES.ERROR.MASS_INTENTION_CREATE,
        'error',
      )
      throw err
    } finally {
      setSacramentSaving(false)
    }
  }

  function handleOpenAddEvent() {
    if (isPastDateKey(toDateKey(scheduleDate || selectedDate))) {
      showSnackbar(MESSAGES.ERROR.EVENT_PAST_DATE_LOCKED, 'info')
      return
    }
    setSelectedEvent(null)
    setFormMode('add')
    setFormOpen(true)
  }

  function handleSelectEvent(event) {
    setSelectedEvent(event)
    if (isPastEvent(event) || !isManualEvent(event)) {
      setFormMode('view')
    } else {
      setFormMode('edit')
    }
    setFormOpen(true)
  }

  function handleCloseForm() {
    if (saving) return
    setFormOpen(false)
    setSelectedEvent(null)
  }

  function handleRequestDelete(event) {
    if (!isManualEvent(event)) {
      showSnackbar(MESSAGES.ERROR.EVENT_SACRAMENTAL_LOCKED, 'info')
      return
    }
    setEventToDelete(event)
    setDeleteOpen(true)
  }

  async function handleSaveEvent(payload) {
    setSaving(true)
    try {
      if (formMode === 'edit' && selectedEvent?.id) {
        await updateEvent(selectedEvent.id, payload)
        showSnackbar(MESSAGES.SUCCESS.EVENT_UPDATED)
      } else {
        await createEvent({
          ...payload,
          date: payload.date || toDateKey(selectedDate),
        })
        showSnackbar(MESSAGES.SUCCESS.EVENT_CREATED)
      }

      setFormOpen(false)
      setSelectedEvent(null)
      await loadDashboard({ showLoader: false })
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : MESSAGES.ERROR.EVENT_CREATE,
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!eventToDelete?.id) return

    setSaving(true)
    try {
      await deleteEvent(eventToDelete.id, eventToDelete)
      showSnackbar(MESSAGES.SUCCESS.EVENT_DELETED)
      setDeleteOpen(false)
      setEventToDelete(null)
      await loadDashboard({ showLoader: false })
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : MESSAGES.ERROR.EVENT_DELETE,
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader title="Dashboard" />

      {loading ? (
        <Box
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CircularProgress size={36} sx={{ color: MARIAN_BLUE }} />
          <Typography variant="body2" color="text.secondary">
            Loading parish schedule...
          </Typography>
        </Box>
      ) : error ? (
        <Card sx={{ borderRadius: 3, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '1.05rem' }}>
            {MESSAGES.ERROR.DASHBOARD_LOAD}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => loadDashboard()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <MonthlyCalendar
                viewDate={viewDate}
                selectedDate={selectedDate}
                today={today}
                dateColors={dateColors}
                onSelectDate={handleSelectDate}
                onDoubleClickDate={handleDoubleClickDate}
                onChangeMonth={handleChangeMonth}
                onAddEvent={handleOpenAddEvent}
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={2}>
                <DaySchedulePanel
                  selectedDate={selectedDate}
                  events={dayEvents}
                  onSelectEvent={handleSelectEvent}
                  onDeleteEvent={handleRequestDelete}
                  onDoubleClickEmpty={handleDoubleClickEmptyDay}
                />
                <UpcomingEventsPanel
                  events={upcomingEvents}
                  onSelectEvent={handleSelectEvent}
                />
              </Stack>
            </Grid>
          </Grid>

          <Typography
            variant="subtitle2"
            sx={{
              mb: 1.25,
              fontWeight: 650,
              color: 'text.secondary',
              fontSize: '0.82rem',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Dashboard Summary
          </Typography>

          <Grid container spacing={1.5}>
            {summaryCards.map((stat) => (
              <Grid
                key={stat.title}
                size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
              >
                <SummaryCard {...stat} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                  <Stack
                    direction="row"

                    sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.25 }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: MARIAN_BLUE }}
                    >
                      Mass Intentions
                    </Typography>
                    <AutoAwesomeOutlinedIcon
                      sx={{ color: MARIAN_BLUE, fontSize: 20 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Pending Intentions
                      </Typography>
                      <Typography
                        sx={{ fontWeight: 700, color: MARIAN_BLUE, fontSize: '1.35rem' }}
                      >
                        {massIntentionStats.pendingCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Today&apos;s Scheduled
                      </Typography>
                      <Typography
                        sx={{ fontWeight: 700, color: MARIAN_BLUE, fontSize: '1.35rem' }}
                      >
                        {massIntentionStats.todayScheduledCount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: MARIAN_BLUE, mb: 1.25 }}
                  >
                    Today&apos;s Mass Intentions
                  </Typography>
                  {massIntentionStats.todayIntentions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No Mass Intentions scheduled for today.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {massIntentionStats.todayIntentions.map((item) => {
                        const timeLabel =
                          PARISH_TIME_OPTIONS.find(
                            (option) => option.value === item.massTime,
                          )?.label || item.massTime || '—'
                        return (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 1,
                              py: 0.75,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-child': { borderBottom: 'none' },
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 650 }}
                                noWrap
                              >
                                {getIntentionForDisplayName(item)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.intentionType || '—'} · {item.status || '—'}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 650, whiteSpace: 'nowrap' }}
                            >
                              {timeLabel}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5 }}
          >
            Calendar: single-click a date to view details · double-click an empty
            date to create a record. Colors — Baptism (blue), Confirmation
            (green), Marriage (purple), Death (gray), Conversion (orange), Mass
            Intention (teal).
          </Typography>
        </>
      )}

      <DateScheduleOverviewDialog
        open={dateOverviewOpen}
        events={getEventsForDate(events, scheduleDate || selectedDate)}
        onClose={() => setDateOverviewOpen(false)}
        onSelectEvent={handleSelectScheduledFromDialog}
        onAddSacramentalRecord={handleOverviewAddSacramental}
        onAddCalendarEvent={handleOverviewAddCalendarEvent}
      />

      <ScheduleSacramentDialog
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false)
          setScheduleTime('')
        }}
        onContinue={handleContinueSchedule}
      />

      <BaptismNewRecordFormDialog
        open={sacramentForm === 'baptism'}
        existingRecords={baptismRecords}
        defaultSacramentDate={prefillDate}
        defaultSacramentTime={prefillTime}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveBaptism}
        saving={sacramentSaving}
      />

      <ConfirmationNewRecordFormDialog
        open={sacramentForm === 'confirmation'}
        existingRecords={confirmationRecords}
        defaultSacramentDate={prefillDate}
        defaultSacramentTime={prefillTime}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveConfirmation}
        saving={sacramentSaving}
      />

      <MarriageNewRecordFormDialog
        open={sacramentForm === 'marriage'}
        existingRecords={marriageRecords}
        defaultSacramentDate={prefillDate}
        defaultSacramentTime={prefillTime}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveMarriage}
        saving={sacramentSaving}
      />

      <DeathNewRecordFormDialog
        open={sacramentForm === 'death'}
        existingRecords={deathRecords}
        defaultSacramentDate={prefillDate}
        defaultSacramentTime={prefillTime}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveDeath}
        saving={sacramentSaving}
      />

      <ConversionNewRecordFormDialog
        open={sacramentForm === 'conversion'}
        existingRecords={conversionRecords}
        defaultSacramentDate={prefillDate}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveConversion}
        saving={sacramentSaving}
      />

      <MassIntentionFormDialog
        open={sacramentForm === 'massIntention'}
        mode="add"
        existingRecords={massIntentionRecords}
        defaultMassDate={prefillDate}
        defaultMassTime={prefillTime}
        onClose={handleCloseSacramentForm}
        onSave={handleSaveMassIntention}
        saving={sacramentSaving}
      />

      <EventFormDialog
        open={formOpen}
        mode={formMode === 'edit' ? 'edit' : 'add'}
        event={selectedEvent}
        defaultDate={toDateKey(selectedDate)}
        onClose={handleCloseForm}
        onSave={handleSaveEvent}
        saving={saving}
      />

      <DeleteEventDialog
        open={deleteOpen}
        event={eventToDelete}
        onClose={() => {
          if (saving) return
          setDeleteOpen(false)
          setEventToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        deleting={saving}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
