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
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { MESSAGES } from '../constants'
import { getRequirementsSummary } from '../constants/sacramentRequirements'
import CertificatePrepActions from '../components/CertificateGenerationPrep'
import RequirementsChecklist from '../components/RequirementsChecklist'
import RequirementsStatusChip from '../components/RequirementsStatusChip'
import GenderSelect from '../components/GenderSelect'
import PageHeader from '../components/PageHeader'
import {
  DetailField,
  DetailSection,
  DetailSubheading,
  FilterSection,
  RecordsEmptyState,
} from '../components/recordUi'
import { displayValue } from '../utils/displayValue'
import {
  createConfirmationRecord,
  getConfirmationRecords,
  updateConfirmationRecord,
} from '../services/confirmationService'
import { formatFirestoreDate } from '../utils/date'
import { formatScheduleTime } from '../utils/parishCalendar'
import { formatConfirmationRecordNumber } from '../utils/recordNumber'
import {
  getConfirmandDisplayName,
  getFatherDisplayName,
  getFemaleSponsorDisplayName,
  getMaleSponsorDisplayName,
  getMotherDisplayName,
  getSponsorDisplayName,
  resolveFemaleSponsorNameParts,
  resolveMaleSponsorNameParts,
} from '../utils/personName'

const ConfirmationOldRecordFormDialog = lazy(
  () => import('../components/ConfirmationRecordFormDialog'),
)

const EMPTY_FILTERS = {
  recordTypes: [],
  recordYears: [],
  requirementsStatuses: [],
}

function mapConfirmationRecord(doc) {
  const recordTypeValue = doc.recordType === 'old' ? 'old' : 'new'
  const requirementsSummary = getRequirementsSummary(
    'confirmation',
    doc.requirements,
  )

  return {
    ...doc,
    recordNo: formatConfirmationRecordNumber(doc.recordYear, doc.recordNumber),
    recordTypeValue,
    recordType: recordTypeValue === 'old' ? 'Old Record' : 'New Record',
    confirmandDisplayName: getConfirmandDisplayName(doc),
    fatherDisplayName: getFatherDisplayName(doc),
    motherDisplayName: getMotherDisplayName(doc),
    ...(() => {
      const male = resolveMaleSponsorNameParts(doc)
      const female = resolveFemaleSponsorNameParts(doc)
      return {
        maleSponsorFirstName: male.firstName,
        maleSponsorMiddleName: male.middleName,
        maleSponsorLastName: male.lastName,
        maleSponsorSuffix: male.suffix,
        femaleSponsorFirstName: female.firstName,
        femaleSponsorMiddleName: female.middleName,
        femaleSponsorLastName: female.lastName,
        femaleSponsorSuffix: female.suffix,
        maleSponsorDisplayName: getMaleSponsorDisplayName(doc),
        femaleSponsorDisplayName: getFemaleSponsorDisplayName(doc),
        sponsorDisplayName: getSponsorDisplayName(doc),
      }
    })(),
    birthDate: formatFirestoreDate(doc.dateOfBirth ?? doc.birthDate),
    confirmationDate: formatFirestoreDate(doc.confirmationDate),
    time: doc.time || '',
    gender: doc.gender || '',
    age: doc.age ?? '',
    parish: doc.parish || '',
    province: doc.province || '',
    placeOfBaptism: doc.placeOfBaptism || doc.placeOfBirth || '',
    remarks: doc.remarks || '',
    requirements: requirementsSummary.requirements,
    requirementsSummary,
    requirementsStatusLabel: requirementsSummary.shortStatusLabel,
    createdAtDisplay: formatFirestoreDate(doc.createdAt),
    updatedAtDisplay: formatFirestoreDate(doc.updatedAt),
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

function ViewConfirmationDialog({ open, record, onClose }) {
  if (!record) return null

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
        View Confirmation Record
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: MARIAN_BLUE,
              bgcolor: 'rgba(11, 61, 145, 0.06)',
            },
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

          <DetailSection title="Person Information" showDivider>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={
                  record.confirmandDisplayName ||
                  getConfirmandDisplayName(record)
                }
              />
            </Grid>
            <GenderSelect
              label="Gender"
              value={record.gender}
              readOnly
              size={{ xs: 12, sm: 6, md: 4 }}
              helperText=" "
            />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Date of Birth" value={record.birthDate} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField label="Age" value={record.age} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DetailField
                label="Place of Baptism"
                value={record.placeOfBaptism || record.placeOfBirth}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Parents Information" showDivider>
            <DetailSubheading>Father</DetailSubheading>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={record.fatherDisplayName || getFatherDisplayName(record)}
              />
            </Grid>

            <DetailSubheading>Mother&apos;s Maiden Name</DetailSubheading>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={record.motherDisplayName || getMotherDisplayName(record)}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Sponsors Information" showDivider>
            <DetailSubheading>Male Sponsor</DetailSubheading>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="First Name"
                value={record.maleSponsorFirstName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="Middle Name"
                value={record.maleSponsorMiddleName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="Last Name"
                value={record.maleSponsorLastName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField label="Suffix" value={record.maleSponsorSuffix} />
            </Grid>

            <DetailSubheading>Female Sponsor</DetailSubheading>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="First Name"
                value={record.femaleSponsorFirstName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="Middle Name"
                value={record.femaleSponsorMiddleName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField
                label="Last Name"
                value={record.femaleSponsorLastName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DetailField label="Suffix" value={record.femaleSponsorSuffix} />
            </Grid>
          </DetailSection>

          <DetailSection title="Church Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Minister" value={record.minister} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Confirmation Date"
                value={record.confirmationDate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Time"
                value={formatScheduleTime(record.time || '08:00')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Remarks" value={record.remarks} />
            </Grid>
          </DetailSection>

          <DetailSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="confirmation"
              value={record.requirements}
              readOnly
            />
          </DetailSection>

          <DetailSection title="Audit Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Created At" value={record.createdAtDisplay} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Updated At" value={record.updatedAtDisplay} />
            </Grid>
          </DetailSection>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, gap: 1, justifyContent: 'flex-end' }}
      >
        <CertificatePrepActions sacrament="confirmation" record={record} />
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 3, minWidth: 110 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ConfirmationRecords() {
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
      const data = await getConfirmationRecords()
      setRecords(data.map(mapConfirmationRecord))
    } catch (err) {
      setRecords([])
      setError(
        err instanceof Error ? err.message : MESSAGES.ERROR.CONFIRMATION_FETCH,
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
        const data = await getConfirmationRecords()
        if (!cancelled) {
          setRecords(data.map(mapConfirmationRecord))
        }
      } catch (err) {
        if (!cancelled) {
          setRecords([])
          setError(
            err instanceof Error
              ? err.message
              : MESSAGES.ERROR.CONFIRMATION_FETCH,
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
        filters.requirementsStatuses.length > 0 &&
        !filters.requirementsStatuses.includes(record.requirementsStatusLabel)
      ) {
        return false
      }

      if (!queryText) return true

      return [
        record.recordNo,
        record.confirmandDisplayName,
        record.confirmandFirstName,
        record.confirmandMiddleName,
        record.confirmandLastName,
        record.confirmandSuffix,
        record.fatherDisplayName,
        record.fatherFirstName,
        record.fatherMiddleName,
        record.fatherLastName,
        record.fatherSuffix,
        record.motherDisplayName,
        record.motherFirstName,
        record.motherMiddleName,
        record.motherLastName,
        record.motherSuffix,
        record.sponsorDisplayName,
        record.maleSponsorDisplayName,
        record.femaleSponsorDisplayName,
        record.maleSponsorFirstName,
        record.maleSponsorMiddleName,
        record.maleSponsorLastName,
        record.maleSponsorSuffix,
        record.femaleSponsorFirstName,
        record.femaleSponsorMiddleName,
        record.femaleSponsorLastName,
        record.femaleSponsorSuffix,
        record.maleSponsor,
        record.femaleSponsor,
        record.minister,
        record.placeOfBaptism,
        record.placeOfBirth,
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
    // Sacramental modules encode historical (Old) registry records only.
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
          throw new Error(MESSAGES.ERROR.CONFIRMATION_UPDATE)
        }

        await updateConfirmationRecord(record.id, payload)
        setFormOpen(false)
        setSelectedRecord(null)
        setFormMode('add')
        await loadRecords({ showLoader: false })
        showSnackbar(MESSAGES.SUCCESS.CONFIRMATION_UPDATED, 'success')
        return
      }

      await createConfirmationRecord({ ...payload, recordType: 'old' })
      setFormOpen(false)
      setSelectedRecord(null)
      setFormMode('add')
      await loadRecords({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.CONFIRMATION_CREATED, 'success')
    } catch {
      showSnackbar(
        mode === 'edit'
          ? MESSAGES.ERROR.CONFIRMATION_UPDATE
          : MESSAGES.ERROR.CONFIRMATION_CREATE,
        'error',
      )
      throw new Error(
        mode === 'edit'
          ? MESSAGES.ERROR.CONFIRMATION_UPDATE
          : MESSAGES.ERROR.CONFIRMATION_CREATE,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader title="Confirmation Records" />

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
            placeholder="Search by name, record no., minister..."
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
                      title="Year"
                      options={filterOptions.recordYears}
                      selected={filters.recordYears}
                      onToggle={(value) =>
                        handleToggleFilter('recordYears', value)
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
              Add Confirmation Record
            </Button>
          </Stack>
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
              Loading confirmation records...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: { xs: 6, sm: 8 }, px: 3, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', mb: 0.75 }}>
              {MESSAGES.ERROR.CONFIRMATION_LOAD}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 420, mx: 'auto', lineHeight: 1.6 }}
            >
              {error}
            </Typography>
          </Box>
        ) : filteredRecords.length === 0 ? (
          records.length > 0 ? (
            <Box
              sx={{
                py: { xs: 6, sm: 8 },
                px: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontSize: '1.05rem', mb: 0.75 }}>
                No matching records
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 360, mx: 'auto', mb: 2, lineHeight: 1.6 }}
              >
                Try adjusting your search or filters.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ borderRadius: 3 }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <RecordsEmptyState icon={VerifiedOutlinedIcon} title="No confirmation records found" />
          )
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="medium" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Record No.</TableCell>
                  <TableCell>Confirmand Name</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Confirmation Date</TableCell>
                  <TableCell>Minister</TableCell>
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
                        {record.confirmandDisplayName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.birthDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {displayValue(record.age)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.confirmationDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.minister}
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
                            aria-label={`View ${record.confirmandDisplayName}`}
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
                            aria-label={`Edit ${record.confirmandDisplayName}`}
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
          Showing {filteredRecords.length} of {records.length} confirmation
          records
        </Typography>
      )}

      <ViewConfirmationDialog
        open={viewOpen}
        record={selectedRecord}
        onClose={handleCloseView}
      />

      {formOpen ? (
        <Suspense fallback={null}>
          <ConfirmationOldRecordFormDialog
            open
            mode={formMode}
            record={formMode === 'edit' ? selectedRecord : null}
            existingRecords={records}
            saving={saving}
            onSave={handleSaveRecord}
            onClose={handleCloseForm}
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
