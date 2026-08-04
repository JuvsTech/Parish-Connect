import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import {
  DEFAULT_MINISTER_TITLE,
  MINISTER_ASSIGNMENT_OPTIONS,
  MINISTER_STATUS_OPTIONS,
  MINISTER_TITLE_OPTIONS,
  STATUS,
  getDefaultPositionForTitle,
  getPositionsForTitle,
  getTitlePositionError,
  isValidTitlePosition,
  ministerStatusLabel,
  normalizeMinisterStatus,
  normalizeMinisterTitle,
} from '../constants'
import PageHeader from '../components/PageHeader'
import { FilterSection } from '../components/recordUi'
import { useAuth } from '../contexts/AuthContext'
import {
  createMinister,
  formatMinisterDisplayName,
  getMinisters,
  updateMinister,
} from '../services/ministerService'
import { formatFirestoreDate } from '../utils/date'
import {
  getEmailValidationError,
  getPhoneValidationError,
} from '../utils/validation'
import { toProperCase } from '../utils/textFormatter'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import UnsavedChangesDialog from '../components/UnsavedChangesDialog'

const EMPTY_FORM = {
  name: '',
  title: DEFAULT_MINISTER_TITLE,
  position: getDefaultPositionForTitle(DEFAULT_MINISTER_TITLE),
  phone: '',
  email: '',
  assignments: [],
  status: STATUS.ACTIVE,
}

const EMPTY_FILTERS = {
  statuses: [],
  positions: [],
  assignments: [],
}

const actionIconSx = {
  color: 'text.secondary',
  '&:hover': {
    color: MARIAN_BLUE,
    bgcolor: 'rgba(11, 61, 145, 0.06)',
  },
}

const STATUS_CHIP_SX = {
  [STATUS.ACTIVE]: {
    bgcolor: 'rgba(46, 125, 50, 0.1)',
    color: '#2E7D32',
    borderColor: 'rgba(46, 125, 50, 0.35)',
  },
  [STATUS.RETIRED]: {
    bgcolor: 'rgba(239, 108, 0, 0.1)',
    color: '#EF6C00',
    borderColor: 'rgba(239, 108, 0, 0.4)',
  },
  [STATUS.INACTIVE]: {
    bgcolor: 'rgba(97, 97, 97, 0.1)',
    color: '#616161',
    borderColor: 'rgba(97, 97, 97, 0.35)',
  },
}

function uniqueSortedValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }),
  )
}

function countActiveFilters(filters) {
  return Object.values(filters).reduce(
    (total, values) => total + values.length,
    0,
  )
}

function toggleFilterValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function StatusChip({ status }) {
  const normalized = normalizeMinisterStatus(status)
  const label = ministerStatusLabel(normalized)
  const sx = STATUS_CHIP_SX[normalized] || STATUS_CHIP_SX[STATUS.INACTIVE]

  return (
    <Chip
      size="small"
      label={label}
      variant="outlined"
      sx={{
        fontWeight: 650,
        ...sx,
      }}
    />
  )
}

function AssignmentChips({ assignments }) {
  const list = Array.isArray(assignments) ? assignments : []
  if (list.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    )
  }

  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
      {list.map((assignment) => (
        <Chip
          key={assignment}
          size="small"
          label={assignment}
          variant="outlined"
          sx={{
            borderColor: 'rgba(11, 61, 145, 0.22)',
            color: MARIAN_BLUE,
            fontWeight: 600,
          }}
        />
      ))}
    </Stack>
  )
}

function DetailLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        mb: 0.4,
        fontWeight: 650,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        fontSize: '0.68rem',
      }}
    >
      {children}
    </Typography>
  )
}

function DetailValue({ children, empty = false }) {
  return (
    <Typography
      variant="body1"
      sx={{
        fontWeight: empty ? 500 : 600,
        color: empty ? 'text.disabled' : 'text.primary',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </Typography>
  )
}

function AssignmentChecklist({
  value = [],
  onChange,
  disabled = false,
  error = false,
  helperText = ' ',
}) {
  function toggleAssignment(assignment) {
    const selected = new Set(value)
    if (selected.has(assignment)) selected.delete(assignment)
    else selected.add(assignment)
    onChange(
      MINISTER_ASSIGNMENT_OPTIONS.filter((option) => selected.has(option)),
    )
  }

  return (
    <FormControl
      component="fieldset"
      fullWidth
      required
      disabled={disabled}
      error={error}
    >
      <FormLabel
        component="legend"
        sx={{
          mb: 0.75,
          color: error ? 'error.main' : MARIAN_BLUE,
          fontWeight: 650,
          fontSize: '0.84rem',
          '&.Mui-focused': { color: error ? 'error.main' : MARIAN_BLUE },
        }}
      >
        Assignments
      </FormLabel>
      <FormGroup
        sx={{
          border: '1px solid',
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 0.75,
          bgcolor: '#FAFBFD',
        }}
      >
        {MINISTER_ASSIGNMENT_OPTIONS.map((assignment) => (
          <FormControlLabel
            key={assignment}
            control={
              <Checkbox
                size="small"
                checked={value.includes(assignment)}
                onChange={() => toggleAssignment(assignment)}
                sx={{
                  color: 'text.secondary',
                  '&.Mui-checked': { color: MARIAN_BLUE },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                {assignment}
              </Typography>
            }
            sx={{ mr: 0 }}
          />
        ))}
      </FormGroup>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}

function MinisterFormDialog({ open, mode, minister, onClose, onSave, saving }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(EMPTY_FORM)
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState({})
  const {
    confirmOpen,
    captureBaseline,
    clearBaseline,
    markSaved,
    requestClose,
    keepEditing,
    discardChanges,
  } = useUnsavedChanges(form, { enabled: open && !saving })

  useEffect(() => {
    if (!open) {
      clearBaseline()
      return
    }

    let initialForm = EMPTY_FORM
    if (isEdit && minister) {
      const title =
        normalizeMinisterTitle(minister.title) || DEFAULT_MINISTER_TITLE
      const position = minister.position || getDefaultPositionForTitle(title)
      initialForm = {
        name: minister.name || '',
        title,
        position: isValidTitlePosition(title, position)
          ? position
          : getDefaultPositionForTitle(title),
        phone: minister.phone || '',
        email: minister.email || '',
        assignments: Array.isArray(minister.assignments)
          ? [...minister.assignments]
          : [],
        status: normalizeMinisterStatus(minister.status),
      }
    }

    setForm(initialForm)
    captureBaseline(initialForm)
    setAttempted(false)
    setTouched({})
  }, [open, isEdit, minister]) // eslint-disable-line react-hooks/exhaustive-deps

  const positionOptions = getPositionsForTitle(form.title)
  const titlePositionError = getTitlePositionError(form.title, form.position)
  const phoneError = getPhoneValidationError(form.phone)
  const emailError = getEmailValidationError(form.email)

  const errors = {
    name: !String(form.name || '').trim() ? 'Required' : '',
    title: !String(form.title || '').trim() ? 'Required' : '',
    position: titlePositionError,
    phone: phoneError,
    email: emailError,
    assignments:
      !Array.isArray(form.assignments) || form.assignments.length === 0
        ? 'Select at least one assignment.'
        : '',
  }
  const canSave =
    !errors.name &&
    !errors.title &&
    !errors.position &&
    !errors.phone &&
    !errors.email &&
    !errors.assignments

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  /** Show error after the field was left (blur) or after Save — not mid-typing. */
  function showError(field) {
    if (attempted || touched[field]) return Boolean(errors[field])
    return false
  }

  function errorText(field) {
    return showError(field) && errors[field] ? errors[field] : ' '
  }

  function handleTitleChange(event) {
    const nextTitle = event.target.value
    markTouched('title')
    setForm((prev) => {
      const allowed = getPositionsForTitle(nextTitle)
      const keepPosition = allowed.includes(prev.position)
      return {
        ...prev,
        title: nextTitle,
        position: keepPosition
          ? prev.position
          : getDefaultPositionForTitle(nextTitle),
      }
    })
  }

  function handleChange(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  function handlePhoneChange(event) {
    const digitsOnly = String(event.target.value || '')
      .replace(/\D/g, '')
      .slice(0, 11)
    setForm((prev) => ({ ...prev, phone: digitsOnly }))
  }

  function handleAssignmentsChange(assignments) {
    markTouched('assignments')
    setForm((prev) => ({ ...prev, assignments }))
  }

  function resetAndClose() {
    setForm(EMPTY_FORM)
    setAttempted(false)
    setTouched({})
    clearBaseline()
    onClose?.()
  }

  function handleCloseRequest() {
    if (saving) return
    requestClose(resetAndClose)
  }

  async function handleSave() {
    setAttempted(true)
    if (!canSave) return
    try {
      await onSave?.(form)
      markSaved(form)
    } catch {
      // Parent surfaces the error. Keep the dialog open.
    }
  }

  return (
    <>
    <Dialog
      open={open}
      onClose={saving ? undefined : handleCloseRequest}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: {
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
        },
      } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: MARIAN_BLUE,
          fontWeight: 700,
        }}
      >
        {isEdit ? 'Edit Minister' : 'Add Minister'}
        <IconButton onClick={handleCloseRequest} disabled={saving} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2.25}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl
              fullWidth
              required
              error={showError('title')}
              disabled={saving}
            >
              <InputLabel id="minister-title-label">Title</InputLabel>
              <Select
                labelId="minister-title-label"
                label="Title"
                value={form.title}
                onChange={handleTitleChange}
                onBlur={() => markTouched('title')}
              >
                {MINISTER_TITLE_OPTIONS.map((title) => (
                  <MenuItem key={title} value={title}>
                    {title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              label="Minister Name"
              value={form.name}
              onChange={handleChange('name')}
              onBlur={() => {
                markTouched('name')
                setForm((prev) => {
                  const formatted = toProperCase(prev.name)
                  if (formatted === prev.name) return prev
                  return { ...prev, name: formatted }
                })
              }}
              fullWidth
              required
              disabled={saving}
              error={showError('name')}
              helperText={errorText('name')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl
              fullWidth
              required
              error={showError('position')}
              disabled={saving || positionOptions.length === 0}
            >
              <InputLabel id="minister-position-label">Position</InputLabel>
              <Select
                labelId="minister-position-label"
                label="Position"
                value={
                  positionOptions.includes(form.position) ? form.position : ''
                }
                onChange={(event) => {
                  markTouched('position')
                  setForm((prev) => ({
                    ...prev,
                    position: event.target.value,
                  }))
                }}
                onBlur={() => markTouched('position')}
                displayEmpty
              >
                {positionOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    No compatible positions
                  </MenuItem>
                ) : (
                  positionOptions.map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>{errorText('position')}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required disabled={saving}>
              <InputLabel id="minister-status-label">Status</InputLabel>
              <Select
                labelId="minister-status-label"
                label="Status"
                value={form.status}
                onChange={handleChange('status')}
              >
                {MINISTER_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              value={form.phone}
              onChange={handlePhoneChange}
              onBlur={() => markTouched('phone')}
              fullWidth
              required
              disabled={saving}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  maxLength: 11,
                  pattern: '[0-9]*',
                },
              }}
              error={showError('phone')}
              helperText={errorText('phone')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={() => markTouched('email')}
              fullWidth
              disabled={saving}
              error={showError('email')}
              helperText={errorText('email')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <AssignmentChecklist
              value={form.assignments}
              onChange={handleAssignmentsChange}
              disabled={saving}
              error={showError('assignments')}
              helperText={errorText('assignments')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleCloseRequest}
          variant="outlined"
          disabled={saving}
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
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{ borderRadius: 3 }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>

    <UnsavedChangesDialog
      open={confirmOpen}
      onKeepEditing={keepEditing}
      onDiscard={discardChanges}
    />
    </>
  )
}

function ViewMinisterDialog({ open, minister, onClose }) {
  if (!open || !minister) return null

  const phone = String(minister.phone || '').trim()
  const email = String(minister.email || '').trim()
  const createdBy = String(minister.createdBy || '').trim()
  const updatedBy = String(minister.updatedBy || '').trim()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      slotProps={{ paper: {
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
        },
      } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: MARIAN_BLUE,
          fontWeight: 700,
        }}
      >
        View Minister
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                letterSpacing: '0.02em',
              }}
            >
              Minister Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <DetailLabel>Full Name</DetailLabel>
                <DetailValue>
                  {formatMinisterDisplayName(minister) || '—'}
                </DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Title</DetailLabel>
                <DetailValue empty={!minister.title}>
                  {minister.title || '—'}
                </DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Position</DetailLabel>
                <DetailValue empty={!minister.position}>
                  {minister.position || '—'}
                </DetailValue>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailLabel>Status</DetailLabel>
                <StatusChip status={minister.status} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailLabel>Assignments</DetailLabel>
                <AssignmentChips assignments={minister.assignments} />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.12)' }} />

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                letterSpacing: '0.02em',
              }}
            >
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Phone</DetailLabel>
                <DetailValue empty={!phone}>{phone || '—'}</DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Email</DetailLabel>
                <DetailValue empty={!email}>{email || '—'}</DetailValue>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.12)' }} />

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                letterSpacing: '0.02em',
              }}
            >
              Audit Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Created At</DetailLabel>
                <DetailValue>{formatFirestoreDate(minister.createdAt)}</DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Created By</DetailLabel>
                <DetailValue empty={!createdBy}>
                  {createdBy || '—'}
                </DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Updated At</DetailLabel>
                <DetailValue>{formatFirestoreDate(minister.updatedAt)}</DetailValue>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailLabel>Updated By</DetailLabel>
                <DetailValue empty={!updatedBy}>
                  {updatedBy || '—'}
                </DetailValue>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ManageMinisters() {
  const { currentUser } = useAuth()
  const [ministers, setMinisters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const loadMinisters = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true)
    setError('')
    try {
      const rows = await getMinisters()
      setMinisters(rows)
    } catch (err) {
      setMinisters([])
      setError(err instanceof Error ? err.message : 'Unable to load ministers.')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      setLoading(true)
      setError('')
      try {
        const rows = await getMinisters()
        if (!cancelled) setMinisters(rows)
      } catch (err) {
        if (!cancelled) {
          setMinisters([])
          setError(
            err instanceof Error ? err.message : 'Unable to load ministers.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialLoad()
    return () => {
      cancelled = true
    }
  }, [])

  const filterOptions = useMemo(
    () => ({
      statuses: MINISTER_STATUS_OPTIONS.map((item) => item.label),
      positions: uniqueSortedValues(ministers.map((item) => item.position)),
      assignments: uniqueSortedValues(
        ministers.flatMap((item) => item.assignments || []),
      ),
    }),
    [ministers],
  )

  const activeFilterCount = countActiveFilters(filters)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return ministers.filter((item) => {
      if (filters.statuses.length > 0) {
        const label = ministerStatusLabel(item.status)
        if (!filters.statuses.includes(label)) return false
      }
      if (
        filters.positions.length > 0 &&
        !filters.positions.includes(item.position)
      ) {
        return false
      }
      if (filters.assignments.length > 0) {
        const hasAssignment = filters.assignments.some((assignment) =>
          (item.assignments || []).includes(assignment),
        )
        if (!hasAssignment) return false
      }

      if (!q) return true

      const haystack = [
        item.name,
        item.title,
        item.position,
        ...(item.assignments || []),
        ministerStatusLabel(item.status),
        formatMinisterDisplayName(item),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [ministers, search, filters])

  function handleToggleFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleFilterValue(prev[key], value),
    }))
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      const actorOptions = { userEmail: currentUser?.email || '' }
      if (formMode === 'edit' && selected?.id) {
        await updateMinister(selected.id, form, actorOptions)
        showSnackbar('Minister updated successfully.')
      } else {
        await createMinister(form, actorOptions)
        showSnackbar('Minister added successfully.')
      }
      setFormOpen(false)
      setSelected(null)
      await loadMinisters({ showLoader: false })
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : 'Unable to save minister.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  const filtersOpen = Boolean(filterAnchorEl)

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Manage Ministers"
      />

      <Card
        sx={{
          mb: 2.75,
          borderRadius: 3,
          p: { xs: 1.5, sm: 1.75 },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}

        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, position, assignment, or status..."
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon
                      sx={{ color: 'text.secondary', fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: { md: '1 1 auto' },
              maxWidth: { md: 480 },
              '& .MuiOutlinedInput-root': {
                minHeight: 40,
                borderRadius: 3,
                bgcolor: '#FAFBFD',
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1.25, flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListRoundedIcon />}
              onClick={(event) => setFilterAnchorEl(event.currentTarget)}
              sx={{
                minHeight: 40,
                borderRadius: 3,
                borderColor: activeFilterCount > 0 ? MARIAN_BLUE : 'divider',
                color: activeFilterCount > 0 ? MARIAN_BLUE : 'text.primary',
                px: 1.75,
              }}
            >
              Filters
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>

            <Popover
              open={filtersOpen}
              anchorEl={filterAnchorEl}
              onClose={() => setFilterAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    width: { xs: 300, sm: 340 },
                    maxHeight: 480,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow:
                      '0 4px 12px rgba(11, 61, 145, 0.07), 0 2px 4px rgba(16, 24, 40, 0.04)',
                  },
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Stack
                  direction="row"

                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: MARIAN_BLUE }}
                  >
                    Filters
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleClearFilters}
                    disabled={activeFilterCount === 0}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: MARIAN_BLUE,
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    Clear Filters
                  </Button>
                </Stack>

                <Stack spacing={1.75} divider={<Divider flexItem />}>
                  <FilterSection
                    title="Status"
                    options={filterOptions.statuses}
                    selected={filters.statuses}
                    onToggle={(value) => handleToggleFilter('statuses', value)}
                  />
                  <FilterSection
                    title="Position"
                    options={filterOptions.positions}
                    selected={filters.positions}
                    onToggle={(value) => handleToggleFilter('positions', value)}
                  />
                  <FilterSection
                    title="Assignment"
                    options={
                      filterOptions.assignments.length > 0
                        ? filterOptions.assignments
                        : MINISTER_ASSIGNMENT_OPTIONS
                    }
                    selected={filters.assignments}
                    onToggle={(value) =>
                      handleToggleFilter('assignments', value)
                    }
                  />
                </Stack>
              </Box>
            </Popover>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setFormMode('add')
                setSelected(null)
                setFormOpen(true)
              }}
              sx={{
                minHeight: 40,
                borderRadius: 3,
                px: 2.25,
              }}
            >
              Add Minister
            </Button>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box
            sx={{
              py: { xs: 6, sm: 8 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            <CircularProgress size={36} sx={{ color: MARIAN_BLUE }} />
            <Typography variant="body2" color="text.secondary">
              Loading ministers...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: { xs: 6, sm: 8 }, px: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', mb: 0.75 }}>
              Unable to load ministers
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 420, mx: 'auto', mb: 2, lineHeight: 1.6 }}
            >
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => loadMinisters()}
              sx={{ borderRadius: 3 }}
            >
              Retry
            </Button>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 7, textAlign: 'center', px: 2 }}>
            <PersonOutlinedIcon
              sx={{ fontSize: 36, color: MARIAN_BLUE, mb: 1 }}
            />
            <Typography sx={{ fontWeight: 650, mb: 0.5 }}>
              {ministers.length > 0
                ? 'No matching ministers'
                : 'No ministers found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {ministers.length > 0
                ? 'Try adjusting your search or filters.'
                : 'Add a minister to populate the dropdowns in sacramental forms.'}
            </Typography>
            {(search || activeFilterCount > 0) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('')
                  handleClearFilters()
                }}
                sx={{ borderRadius: 3 }}
              >
                Clear search & filters
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="medium" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Minister</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Assignments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((minister) => (
                  <TableRow
                    key={minister.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.18s ease',
                      '&:hover': {
                        bgcolor: 'rgba(11, 61, 145, 0.035)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {minister.name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {minister.title || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {minister.position || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <AssignmentChips assignments={minister.assignments} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={minister.status} />
                    </TableCell>
                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                      <Stack
                        direction="row"
                        spacing={0.5}

                      sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            aria-label={`View ${formatMinisterDisplayName(minister)}`}
                            onClick={() => {
                              setFormOpen(false)
                              setSelected(minister)
                              setViewOpen(true)
                            }}
                            sx={actionIconSx}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${formatMinisterDisplayName(minister)}`}
                            onClick={() => {
                              setViewOpen(false)
                              setSelected(minister)
                              setFormMode('edit')
                              setFormOpen(true)
                            }}
                            sx={actionIconSx}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {!loading && !error && filtered.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, fontWeight: 500 }}
        >
          Showing {filtered.length} of {ministers.length} ministers
        </Typography>
      )}

      <MinisterFormDialog
        open={formOpen}
        mode={formMode}
        minister={selected}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
        }}
        onSave={handleSave}
        saving={saving}
      />

      <ViewMinisterDialog
        open={viewOpen}
        minister={selected}
        onClose={() => {
          setViewOpen(false)
        }}
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
