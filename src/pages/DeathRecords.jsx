import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { MESSAGES } from '../constants'
import { getRequirementsSummary } from '../constants/sacramentRequirements'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import {
  DetailField,
  DetailSection,
  FilterSection,
  RecordsEmptyState,
} from '../components/recordUi'
import { displayValue } from '../utils/displayValue'
import CertificatePrepActions from '../components/CertificateGenerationPrep'
import RequirementsChecklist from '../components/RequirementsChecklist'
import RequirementsStatusChip from '../components/RequirementsStatusChip'
import GenderSelect from '../components/GenderSelect'
import {
  createDeathRecord,
  getDeathRecords,
  updateDeathRecord,
} from '../services/deathService'
import { formatFirestoreDate } from '../utils/date'
import { formatScheduleTime } from '../utils/parishCalendar'
import { formatDeathRecordNumber } from '../utils/recordNumber'
import {
  formatDeathResidence,
  getDeceasedDisplayName,
  getRelatedPersonDisplayName,
} from '../utils/personName'

const DeathOldRecordFormDialog = lazy(
  () => import('../components/DeathRecordFormDialog'),
)

const EMPTY_FILTERS = {
  recordTypes: [],
  recordYears: [],
  ministers: [],
  statuses: [],
  deathDates: [],
  provinces: [],
  requirementsStatuses: [],
}

function mapDeathRecord(doc) {
  const recordTypeValue = doc.recordType === 'old' ? 'old' : 'new'
  const requirementsSummary = getRequirementsSummary('death', doc.requirements)

  return {
    ...doc,
    recordNo: formatDeathRecordNumber(doc.recordYear, doc.recordNumber),
    recordTypeValue,
    recordType: recordTypeValue === 'old' ? 'Old Record' : 'New Record',
    deceasedDisplayName: getDeceasedDisplayName(doc),
    firstName: doc.firstName || '',
    middleName: doc.middleName || '',
    lastName: doc.lastName || '',
    suffix: doc.suffix || '',
    gender: doc.gender || '',
    age: doc.age ?? '',
    status: doc.status || '',
    birthDate: formatFirestoreDate(doc.dateOfBirth ?? doc.birthDate),
    relationship: doc.relationship || '',
    relatedPersonFirstName: doc.relatedPersonFirstName || '',
    relatedPersonMiddleName: doc.relatedPersonMiddleName || '',
    relatedPersonLastName: doc.relatedPersonLastName || '',
    relatedPersonSuffix: doc.relatedPersonSuffix || '',
    relatedPersonDisplayName: getRelatedPersonDisplayName(doc),
    barangay: doc.barangay || '',
    municipality: doc.municipality || '',
    province: doc.province || '',
    residenceDisplay: formatDeathResidence(doc),
    minister: doc.minister || '',
    dateOfDeath: formatFirestoreDate(doc.dateOfDeath),
    burialDate: formatFirestoreDate(doc.burialDate),
    placeOfBurial: doc.placeOfBurial || '',
    receivedLastSacraments: doc.receivedLastSacraments || '',
    sickness: doc.sickness || '',
    time: doc.time || '',
    remarks: doc.remarks || '',
    requirements: requirementsSummary.requirements,
    requirementsSummary,
    requirementsStatusLabel: requirementsSummary.shortStatusLabel,
    createdAtDisplay: formatFirestoreDate(doc.createdAt),
    updatedAtDisplay: formatFirestoreDate(doc.updatedAt),
    createdBy: doc.createdBy || '',
    updatedBy: doc.updatedBy || '',
  }
}

function uniqueSortedValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => {
    const aNum = Number(a)
    const bNum = Number(b)
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
  })
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

function ViewDeathDialog({ open, record, onClose }) {
  if (!record) return null

  const timeDisplay = formatScheduleTime(record.time) || record.time

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{ paper: {
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
          m: { xs: 1.5, sm: 2 },
          maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
        },
      } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pr: 1.5,
          py: 2,
          color: MARIAN_BLUE,
          fontWeight: 700,
        }}
      >
        View Death Record
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { color: MARIAN_BLUE, bgcolor: 'rgba(11, 61, 145, 0.06)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 2.75, sm: 3.25 },
          bgcolor: '#FAFBFD',
        }}
      >
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            px: { xs: 2, sm: 3 },
            py: { xs: 2.25, sm: 2.75 },
          }}
        >
          <DetailSection title="Record Information">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Record Number" value={record.recordNumber} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Record Year" value={record.recordYear} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Record Type" value={record.recordType} />
            </Grid>
          </DetailSection>

          <DetailSection title="Church Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Minister" value={record.minister} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Time" value={timeDisplay} />
            </Grid>
          </DetailSection>

          <DetailSection title="Deceased Information" showDivider>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Name" value={record.deceasedDisplayName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Date of Death" value={record.dateOfDeath} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Date of Birth" value={record.birthDate} />
            </Grid>
            <GenderSelect
              label="Gender"
              value={record.gender}
              readOnly
              size={{ xs: 12, sm: 4 }}
              helperText=" "
            />
            <Grid size={{ xs: 12, sm: 4 }}>
              <DetailField label="Age" value={record.age} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DetailField label="Status" value={record.status} />
            </Grid>
          </DetailSection>

          <DetailSection title="Family Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Relationship" value={record.relationship} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Related Person"
                value={record.relatedPersonDisplayName}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Residence" showDivider>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Province" value={record.province} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField
                label="Municipality / City"
                value={record.municipality}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Barangay" value={record.barangay} />
            </Grid>
          </DetailSection>

          <DetailSection title="Burial Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Date of Burial" value={record.burialDate} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Place of Burial"
                value={record.placeOfBurial}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Additional Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Received Last Sacraments"
                value={record.receivedLastSacraments}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Sickness" value={record.sickness} />
            </Grid>
          </DetailSection>

          <DetailSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="death"
              value={record.requirements}
              readOnly
            />
          </DetailSection>

          <DetailSection title="Remarks" showDivider>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Remarks" value={record.remarks} />
            </Grid>
          </DetailSection>

          <DetailSection title="Audit Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Created At"
                value={record.createdAtDisplay || record.createdAt}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Updated At"
                value={record.updatedAtDisplay || record.updatedAt}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Created By" value={record.createdBy} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Updated By" value={record.updatedBy} />
            </Grid>
          </DetailSection>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, gap: 1, justifyContent: 'flex-end' }}
      >
        <CertificatePrepActions sacrament="death" record={record} />
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 3, minWidth: 110 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function DeathRecords() {
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const filterOpen = Boolean(filterAnchorEl)
  const activeFilterCount = countActiveFilters(filters)

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const loadRecords = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true)
    setError('')

    try {
      const data = await getDeathRecords()
      setRecords(data.map(mapDeathRecord))
    } catch (err) {
      setRecords([])
      setError(
        err instanceof Error ? err.message : MESSAGES.ERROR.DEATH_FETCH,
      )
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
        const data = await getDeathRecords()
        if (!cancelled) {
          setRecords(data.map(mapDeathRecord))
        }
      } catch (err) {
        if (!cancelled) {
          setRecords([])
          setError(
            err instanceof Error ? err.message : MESSAGES.ERROR.DEATH_FETCH,
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
      recordTypes: ['New Record', 'Old Record'],
      recordYears: uniqueSortedValues(
        records.map((record) =>
          record.recordYear != null && record.recordYear !== ''
            ? String(record.recordYear)
            : null,
        ),
      ),
      ministers: uniqueSortedValues(
        records.map((record) => String(record.minister || '').trim()),
      ),
      statuses: uniqueSortedValues(
        records.map((record) => String(record.status || '').trim()),
      ),
      deathDates: uniqueSortedValues(
        records
          .map((record) => String(record.dateOfDeath || '').trim())
          .filter((value) => value && value !== '-'),
      ),
      provinces: uniqueSortedValues(
        records.map((record) => String(record.province || '').trim()),
      ),
      requirementsStatuses: ['Complete', 'Incomplete'],
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const queryText = search.trim().toLowerCase()

    return records.filter((record) => {
      if (
        filters.recordTypes.length > 0 &&
        !filters.recordTypes.includes(record.recordType)
      ) {
        return false
      }

      if (
        filters.recordYears.length > 0 &&
        !filters.recordYears.includes(String(record.recordYear ?? ''))
      ) {
        return false
      }

      if (
        filters.ministers.length > 0 &&
        !filters.ministers.includes(String(record.minister || '').trim())
      ) {
        return false
      }

      if (
        filters.statuses.length > 0 &&
        !filters.statuses.includes(String(record.status || '').trim())
      ) {
        return false
      }

      if (
        filters.deathDates.length > 0 &&
        !filters.deathDates.includes(String(record.dateOfDeath || '').trim())
      ) {
        return false
      }

      if (
        filters.provinces.length > 0 &&
        !filters.provinces.includes(String(record.province || '').trim())
      ) {
        return false
      }

      if (
        filters.requirementsStatuses.length > 0 &&
        !filters.requirementsStatuses.includes(record.requirementsStatusLabel)
      ) {
        return false
      }

      if (!queryText) return true

      return [
        record.recordNo,
        record.recordNumber,
        record.deceasedDisplayName,
        record.firstName,
        record.middleName,
        record.lastName,
        record.suffix,
        record.minister,
        record.status,
        record.relationship,
        record.relatedPersonDisplayName,
        record.relatedPersonFirstName,
        record.relatedPersonMiddleName,
        record.relatedPersonLastName,
        record.relatedPersonSuffix,
        record.residenceDisplay,
        record.barangay,
        record.municipality,
        record.province,
      ]
        .join(' ')
        .toLowerCase()
        .includes(queryText)
    })
  }, [records, filters, search])

  function handleOpenFilters(event) {
    setFilterAnchorEl(event.currentTarget)
  }

  function handleCloseFilters() {
    setFilterAnchorEl(null)
  }

  function handleToggleFilter(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleFilterValue(prev[key], value),
    }))
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  function handleView(record) {
    setSelectedRecord(record)
    setViewOpen(true)
  }

  function handleCloseView() {
    setViewOpen(false)
    setSelectedRecord(null)
  }

  function handleOpenAdd() {
    setSelectedRecord(null)
    setFormMode('add')
    setFormOpen(true)
  }

  function handleOpenEdit(record) {
    setSelectedRecord(record)
    setFormMode('edit')
    setFormOpen(true)
  }

  function handleCloseForm() {
    if (saving) return
    setFormOpen(false)
    setSelectedRecord(null)
    setFormMode('add')
  }

  async function handleSaveRecord(payload, meta = {}) {
    const { mode = 'add', record = null } = meta

    setSaving(true)

    try {
      if (mode === 'edit') {
        if (!record?.id) {
          throw new Error(MESSAGES.ERROR.DEATH_UPDATE)
        }

        await updateDeathRecord(record.id, payload, {
          userEmail: currentUser?.email || '',
        })
        setFormOpen(false)
        setSelectedRecord(null)
        setFormMode('add')
        await loadRecords({ showLoader: false })
        showSnackbar(MESSAGES.SUCCESS.DEATH_UPDATED, 'success')
        return
      }

      await createDeathRecord(
        { ...payload, recordType: 'old' },
        {
          userEmail: currentUser?.email || '',
        },
      )
      setFormOpen(false)
      setSelectedRecord(null)
      setFormMode('add')
      await loadRecords({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.DEATH_CREATED, 'success')
    } catch (err) {
      const friendly =
        err instanceof Error &&
        (err.message === MESSAGES.ERROR.DEATH_DUPLICATE_RECORD ||
          err.message === MESSAGES.ERROR.DEATH_REQUIRED_FIELDS ||
          err.message.includes('Burial Date') ||
          err.message.includes('Date of Birth'))
          ? err.message
          : mode === 'edit'
            ? MESSAGES.ERROR.DEATH_UPDATE
            : MESSAGES.ERROR.DEATH_CREATE

      showSnackbar(friendly, 'error')
      throw new Error(friendly)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader title="Death Records" />

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
            placeholder="Search by name, record no., minister, residence, related person..."
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
              maxWidth: { md: 520 },
              '& .MuiOutlinedInput-root': {
                minHeight: 40,
                borderRadius: 3,
                bgcolor: '#FAFBFD',
              },
            }}
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
           
            sx={{ alignItems: { xs: 'stretch', sm: 'center' }, ml: { md: 'auto' },
              width: { xs: '100%', md: 'auto' },
              flexShrink: 0, }}
          >
            <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<FilterListRoundedIcon />}
                onClick={handleOpenFilters}
                aria-haspopup="true"
                aria-expanded={filterOpen ? 'true' : undefined}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  minHeight: 40,
                  borderRadius: 3,
                  borderColor: activeFilterCount > 0 ? MARIAN_BLUE : 'divider',
                  color: activeFilterCount > 0 ? MARIAN_BLUE : 'text.primary',
                  bgcolor:
                    activeFilterCount > 0
                      ? 'rgba(11, 61, 145, 0.04)'
                      : 'transparent',
                  px: 2,
                }}
              >
                {activeFilterCount > 0
                  ? `Filter (${activeFilterCount})`
                  : 'Filter'}
              </Button>
              <Popover
                open={filterOpen}
                anchorEl={filterAnchorEl}
                onClose={handleCloseFilters}
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
                      title="Record Type"
                      options={filterOptions.recordTypes}
                      selected={filters.recordTypes}
                      onToggle={(value) =>
                        handleToggleFilter('recordTypes', value)
                      }
                    />
                    <FilterSection
                      title="Record Year"
                      options={filterOptions.recordYears}
                      selected={filters.recordYears}
                      onToggle={(value) =>
                        handleToggleFilter('recordYears', value)
                      }
                    />
                    <FilterSection
                      title="Minister"
                      options={filterOptions.ministers}
                      selected={filters.ministers}
                      onToggle={(value) =>
                        handleToggleFilter('ministers', value)
                      }
                    />
                    <FilterSection
                      title="Status"
                      options={filterOptions.statuses}
                      selected={filters.statuses}
                      onToggle={(value) =>
                        handleToggleFilter('statuses', value)
                      }
                    />
                    <FilterSection
                      title="Date of Death"
                      options={filterOptions.deathDates}
                      selected={filters.deathDates}
                      onToggle={(value) =>
                        handleToggleFilter('deathDates', value)
                      }
                    />
                    <FilterSection
                      title="Province"
                      options={filterOptions.provinces}
                      selected={filters.provinces}
                      onToggle={(value) =>
                        handleToggleFilter('provinces', value)
                      }
                    />
                    <FilterSection
                      title="Requirements Status"
                      options={filterOptions.requirementsStatuses}
                      selected={filters.requirementsStatuses}
                      onToggle={(value) =>
                        handleToggleFilter('requirementsStatuses', value)
                      }
                    />
                  </Stack>
                </Box>
              </Popover>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenAdd}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minHeight: 40,
                borderRadius: 3,
                px: 2.25,
              }}
            >
              Add Death Record
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading death records...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => loadRecords()}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        ) : records.length === 0 ? (
          <RecordsEmptyState icon={VolunteerActivismOutlinedIcon} title="No death records found" />
        ) : filteredRecords.length === 0 ? (
          <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontSize: '1.05rem', fontWeight: 650, mb: 0.75 }}
            >
              No matching records
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, maxWidth: 360, mx: 'auto' }}
            >
              Try adjusting your search or filters to see more results.
            </Typography>
            {(activeFilterCount > 0 || search.trim()) && (
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
            <Table size="medium" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Record No.</TableCell>
                  <TableCell>Deceased Name</TableCell>
                  <TableCell>Date of Death</TableCell>
                  <TableCell>Burial Date</TableCell>
                  <TableCell>Minister</TableCell>
                  <TableCell>Record Type</TableCell>
                  <TableCell>Requirements</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
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
                        sx={{ fontWeight: 650, color: MARIAN_BLUE }}
                      >
                        {record.recordNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {record.deceasedDisplayName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.dateOfDeath}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.burialDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {displayValue(record.minister)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.recordType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <RequirementsStatusChip
                        summary={record.requirementsSummary}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                       
                       
                      sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            aria-label={`View ${record.deceasedDisplayName}`}
                            onClick={() => handleView(record)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                color: MARIAN_BLUE,
                                bgcolor: 'rgba(11, 61, 145, 0.06)',
                              },
                            }}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${record.deceasedDisplayName}`}
                            onClick={() => handleOpenEdit(record)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                color: MARIAN_BLUE,
                                bgcolor: 'rgba(11, 61, 145, 0.06)',
                              },
                            }}
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

      {!loading && !error && filteredRecords.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, fontWeight: 500 }}
        >
          Showing {filteredRecords.length} of {records.length} death
          {records.length === 1 ? ' record' : ' records'}
        </Typography>
      )}

      <ViewDeathDialog
        open={viewOpen}
        record={selectedRecord}
        onClose={handleCloseView}
      />

      {formOpen ? (
        <Suspense fallback={null}>
          <DeathOldRecordFormDialog
            open
            mode={formMode}
            record={formMode === 'edit' ? selectedRecord : null}
            existingRecords={records}
            saving={saving}
            onClose={handleCloseForm}
            onSave={handleSaveRecord}
          />
        </Suspense>
      ) : null}

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
