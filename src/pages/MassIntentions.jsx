import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Pagination,
  Popover,
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import {
  MASS_INTENTION_PAGE_SIZE,
  MASS_INTENTION_STATUS,
  MASS_INTENTION_STATUS_OPTIONS,
  MASS_INTENTION_TYPE_OPTIONS,
  MESSAGES,
  isMassIntentionLocked,
} from '../constants'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import {
  DetailField,
  DetailSection,
  FilterSection,
  RecordsEmptyState,
} from '../components/recordUi'
import {
  createMassIntentionRecord,
  deleteMassIntentionRecord,
  getMassIntentionRecords,
  updateMassIntentionRecord,
} from '../services/massIntentionService'
import { formatFirestoreDate } from '../utils/date'
import { PARISH_TIME_OPTIONS } from '../constants/parishTimes'
import {
  getOfferedForDisplayName,
  getRequesterDisplayName,
  formatMassIntentionResidence,
} from '../utils/personName'
import { formatMassIntentionRecordNumber as formatMiNumber } from '../utils/recordNumber'

const MassIntentionFormDialog = lazy(
  () => import('../components/MassIntentionFormDialog'),
)

const EMPTY_FILTERS = {
  statuses: [],
  intentionTypes: [],
  months: [],
  years: [],
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatTimeLabel(value) {
  const raw = String(value || '').trim()
  const match = PARISH_TIME_OPTIONS.find((item) => item.value === raw)
  return match?.label || raw || '—'
}

function toDateValue(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const date = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
    )
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function toInputDate(value) {
  const date = toDateValue(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapMassIntentionRecord(doc) {
  return {
    ...doc,
    intentionNumber:
      doc.intentionNumber ||
      formatMiNumber(doc.recordYear, doc.recordNumber),
    massDateDisplay: formatFirestoreDate(doc.massDate),
    massDate: toInputDate(doc.massDate),
    requestDate: toInputDate(doc.requestDate),
    massTimeDisplay: formatTimeLabel(doc.massTime),
    offeredForDisplayName: getOfferedForDisplayName(doc),
    intentionForDisplayName: getOfferedForDisplayName(doc),
    requesterDisplayName: getRequesterDisplayName(doc),
    residenceDisplay: formatMassIntentionResidence(doc),
    celebrantName: doc.celebrantName || '',
    status: doc.status || 'Pending',
  }
}

function statusChipColor(status) {
  switch (status) {
    case 'Scheduled':
      return 'primary'
    case 'Offered':
      return 'success'
    case 'Cancelled':
      return 'default'
    default:
      return 'warning'
  }
}

function ViewMassIntentionDialog({ open, record, onClose }) {
  if (!record) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1.5,
          color: MARIAN_BLUE,
          fontWeight: 700,
        }}
      >
        View Mass Intention
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <DetailSection title="Mass Information">
          <DetailField label="Intention Number" value={record.intentionNumber} />
          <DetailField
            label="Request Date"
            value={formatDisplayDate(record.requestDate)}
          />
          <DetailField label="Mass Date" value={record.massDateDisplay} />
          <DetailField label="Mass Time" value={record.massTimeDisplay} />
          <DetailField label="Intention Type" value={record.intentionType} />
          {record.intentionType === 'Others' ? (
            <DetailField
              label="Other Intention"
              value={record.otherIntention}
            />
          ) : null}
          <DetailField label="Remarks" value={record.remarks} />
        </DetailSection>

        <DetailSection title="Offered For">
          <DetailField
            label="Offered For"
            value={record.offeredForDisplayName}
          />
        </DetailSection>

        <DetailSection title="Requested By">
          <DetailField label="First Name" value={record.requesterFirstName} />
          <DetailField label="Middle Name" value={record.requesterMiddleName} />
          <DetailField label="Last Name" value={record.requesterLastName} />
          <DetailField label="Suffix" value={record.requesterSuffix} />
        </DetailSection>

        <DetailSection title="Contact Information">
          <DetailField label="Contact Number" value={record.contactNumber} />
          <DetailField label="Province" value={record.province} />
          <DetailField label="Municipality / City" value={record.municipality} />
          <DetailField label="Barangay" value={record.barangay} />
        </DetailSection>

        <DetailSection title="Celebrant">
          <DetailField label="Celebrant" value={record.celebrantName} />
        </DetailSection>

        <DetailSection title="Status">
          <DetailField label="Status" value={record.status} />
          {record.status === MASS_INTENTION_STATUS.CANCELLED ||
          record.cancellationReason ? (
            <DetailField
              label="Cancellation Reason"
              value={record.cancellationReason}
            />
          ) : null}
        </DetailSection>

        <DetailSection title="Audit Information">
          <DetailField label="Created By" value={record.createdBy} />
          <DetailField
            label="Created At"
            value={formatAuditDate(record.createdAt)}
          />
          <DetailField label="Updated By" value={record.updatedBy} />
          <DetailField
            label="Updated At"
            value={formatAuditDate(record.updatedAt)}
          />
        </DetailSection>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function formatDisplayDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return formatLocaleDate(value)
  }
  return formatFirestoreDate(value) || '—'
}

function formatLocaleDate(iso) {
  const date = toDateValue(iso)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAuditDate(value) {
  const date = toDateValue(value)
  if (!date) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function MassIntentions() {
  const { currentUser } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getMassIntentionRecords()
      setRecords(rows.map(mapMassIntentionRecord))
    } catch (error) {
      showSnackbar(
        error instanceof Error
          ? error.message
          : MESSAGES.ERROR.MASS_INTENTION_LOAD,
        'error',
      )
    } finally {
      setLoading(false)
    }
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      setLoading(true)
      try {
        const rows = await getMassIntentionRecords()
        if (!cancelled) setRecords(rows.map(mapMassIntentionRecord))
      } catch (error) {
        if (!cancelled) {
          showSnackbar(
            error instanceof Error
              ? error.message
              : MESSAGES.ERROR.MASS_INTENTION_LOAD,
            'error',
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
  }, [showSnackbar])

  const yearOptions = useMemo(() => {
    const years = new Set(
      records
        .map((item) => String(item.recordYear || ''))
        .filter(Boolean),
    )
    years.add(String(new Date().getFullYear()))
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [records])

  const filteredRecords = useMemo(() => {
    const queryText = search.trim().toLowerCase()
    return records.filter((record) => {
      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(record.status)
      ) {
        return false
      }
      if (
        filters.intentionTypes.length > 0 &&
        !filters.intentionTypes.includes(record.intentionType)
      ) {
        return false
      }
      if (filters.years.length > 0) {
        const year = String(record.recordYear || '')
        if (!filters.years.includes(year)) return false
      }
      if (filters.months.length > 0) {
        const date = toDateValue(record.massDate)
        if (!date) return false
        const monthLabel = MONTH_LABELS[date.getMonth()]
        if (!filters.months.includes(monthLabel)) return false
      }
      if (!queryText) return true
      return [
        record.intentionNumber,
        record.offeredForDisplayName,
        record.recipientFirstName,
        record.recipientMiddleName,
        record.recipientLastName,
        record.recipientSuffix,
        record.spouse1FirstName,
        record.spouse1MiddleName,
        record.spouse1LastName,
        record.spouse1Suffix,
        record.spouse2FirstName,
        record.spouse2MiddleName,
        record.spouse2LastName,
        record.spouse2Suffix,
        record.person1FirstName,
        record.person1MiddleName,
        record.person1LastName,
        record.person1Suffix,
        record.person2FirstName,
        record.person2MiddleName,
        record.person2LastName,
        record.person2Suffix,
        record.intentionFirstName,
        record.intentionMiddleName,
        record.intentionLastName,
        record.intentionSuffix,
        record.familyName,
        record.organizationName,
        record.offeredForDescription,
        record.requesterDisplayName,
        record.celebrantName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(queryText)
    })
  }, [records, filters, search])

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRecords.length / MASS_INTENTION_PAGE_SIZE),
  )
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * MASS_INTENTION_PAGE_SIZE
    return filteredRecords.slice(start, start + MASS_INTENTION_PAGE_SIZE)
  }, [filteredRecords, currentPage])

  useEffect(() => {
    setPage(1)
  }, [search, filters])

  function toggleFilterValue(key, value) {
    setFilters((prev) => {
      const list = prev[key]
      const exists = list.includes(value)
      return {
        ...prev,
        [key]: exists ? list.filter((item) => item !== value) : [...list, value],
      }
    })
  }

  function handleOpenAdd() {
    setFormMode('add')
    setSelectedRecord(null)
    setFormOpen(true)
  }

  function handleOpenEdit(record) {
    setFormMode('edit')
    setSelectedRecord(record)
    setFormOpen(true)
  }

  function handleOpenView(record) {
    setSelectedRecord(record)
    setViewOpen(true)
  }

  function handleOpenDelete(record) {
    setSelectedRecord(record)
    setDeleteOpen(true)
  }

  async function handleSaveRecord(payload, meta = {}) {
    setSaving(true)
    try {
      const actor = { userEmail: currentUser?.email || '' }
      if (meta.mode === 'edit' && meta.record?.id) {
        await updateMassIntentionRecord(meta.record.id, payload, {
          ...actor,
          existingRecords: records,
        })
        showSnackbar(MESSAGES.SUCCESS.MASS_INTENTION_UPDATED)
      } else {
        await createMassIntentionRecord(payload, {
          ...actor,
          existingRecords: records,
        })
        showSnackbar(MESSAGES.SUCCESS.MASS_INTENTION_CREATED)
      }
      setFormOpen(false)
      await loadRecords()
    } catch (error) {
      if (error?.fieldErrors) throw error
      showSnackbar(
        error instanceof Error
          ? error.message
          : MESSAGES.ERROR.MASS_INTENTION_UPDATE,
        'error',
      )
      throw error
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedRecord?.id) return
    setSaving(true)
    try {
      await deleteMassIntentionRecord(selectedRecord.id, {
        userEmail: currentUser?.email || '',
        existingRecords: records,
      })
      showSnackbar(MESSAGES.SUCCESS.MASS_INTENTION_DELETED)
      setDeleteOpen(false)
      setSelectedRecord(null)
      await loadRecords()
    } catch (error) {
      showSnackbar(
        error instanceof Error
          ? error.message
          : MESSAGES.ERROR.MASS_INTENTION_DELETE,
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  const activeFilterCount =
    filters.statuses.length +
    filters.intentionTypes.length +
    filters.months.length +
    filters.years.length

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Mass Intentions"
        subtitle="Manage parish Mass Intention requests and schedules."
      />

      <Card sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}

          sx={{ justifyContent: "space-between", mb: 2 }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search intention number, offered for, requester, celebrant…"
            size="small"
            sx={{ flex: 1, maxWidth: 520 }}
            slotProps={{ input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            } }}
          />
          <Stack direction="row" spacing={1.25}>
            <Button
              variant="outlined"
              startIcon={<FilterListRoundedIcon />}
              onClick={(event) => setFilterAnchor(event.currentTarget)}
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenAdd}
            >
              Add Intention
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: MARIAN_BLUE }} />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <RecordsEmptyState
            icon={VolunteerActivismOutlinedIcon}
            title="No Mass Intentions found"
          />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Intention Number</TableCell>
                    <TableCell>Mass Date</TableCell>
                    <TableCell>Mass Time</TableCell>
                    <TableCell>Intention Type</TableCell>
                    <TableCell>Offered For</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Celebrant</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>{record.intentionNumber}</TableCell>
                      <TableCell>{record.massDateDisplay}</TableCell>
                      <TableCell>{record.massTimeDisplay}</TableCell>
                      <TableCell>{record.intentionType || '—'}</TableCell>
                      <TableCell>{record.offeredForDisplayName}</TableCell>
                      <TableCell>{record.requesterDisplayName}</TableCell>
                      <TableCell>{record.celebrantName || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={record.status}
                          color={statusChipColor(record.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenView(record)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            isMassIntentionLocked(record.status)
                              ? 'Read-only'
                              : 'Edit'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={isMassIntentionLocked(record.status)}
                              onClick={() => handleOpenEdit(record)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            isMassIntentionLocked(record.status)
                              ? 'Read-only'
                              : 'Delete'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isMassIntentionLocked(record.status)}
                              onClick={() => handleOpenDelete(record)}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}

              spacing={1.5}
              sx={{ alignItems: "center", justifyContent: "space-between", mt: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {pagedRecords.length} of {filteredRecords.length}{' '}
                intentions
              </Typography>
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
            </Stack>
          </>
        )}
      </Card>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Stack
            direction="row"

            sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
          >
            <Typography fontWeight={700} color={MARIAN_BLUE}>
              Filters
            </Typography>
            <Button size="small" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </Button>
          </Stack>
          <Stack spacing={1.5}>
            <FilterSection
              title="Status"
              options={MASS_INTENTION_STATUS_OPTIONS}
              selected={filters.statuses}
              onToggle={(value) => toggleFilterValue('statuses', value)}
            />
            <FilterSection
              title="Intention Type"
              options={MASS_INTENTION_TYPE_OPTIONS}
              selected={filters.intentionTypes}
              onToggle={(value) => toggleFilterValue('intentionTypes', value)}
            />
            <FilterSection
              title="Month"
              options={MONTH_LABELS}
              selected={filters.months}
              onToggle={(value) => toggleFilterValue('months', value)}
            />
            <FilterSection
              title="Year"
              options={yearOptions}
              selected={filters.years}
              onToggle={(value) => toggleFilterValue('years', value)}
            />
          </Stack>
        </Box>
      </Popover>

      {formOpen ? (
        <Suspense fallback={null}>
          <MassIntentionFormDialog
            open
            mode={formMode}
            record={formMode === 'edit' ? selectedRecord : null}
            existingRecords={records}
            saving={saving}
            onClose={() => setFormOpen(false)}
            onSave={handleSaveRecord}
          />
        </Suspense>
      ) : null}

      <ViewMassIntentionDialog
        open={viewOpen}
        record={selectedRecord}
        onClose={() => setViewOpen(false)}
      />

      <Dialog open={deleteOpen} onClose={() => !saving && setDeleteOpen(false)}>
        <DialogTitle>Delete Mass Intention</DialogTitle>
        <DialogContent>
          <Typography>
            Delete intention{' '}
            <strong>{selectedRecord?.intentionNumber || ''}</strong>? This cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={saving}
          >
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
