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
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { MESSAGES } from '../constants'
import { getRequirementsSummary } from '../constants/sacramentRequirements'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import {
  DetailField,
  DetailSection,
  DetailSubheading,
  FilterSection,
  RecordsEmptyState,
} from '../components/recordUi'
import { displayValue } from '../utils/displayValue'
import CertificatePrepActions from '../components/CertificateGenerationPrep'
import RequirementsChecklist from '../components/RequirementsChecklist'
import RequirementsStatusChip from '../components/RequirementsStatusChip'
import {
  createConversionRecord,
  getConversionRecords,
  updateConversionRecord,
} from '../services/conversionService'
import { formatFirestoreDate } from '../utils/date'
import { formatConversionRecordNumber } from '../utils/recordNumber'
import {
  formatConversionResidence,
  getConvertDisplayName,
  getFatherDisplayName,
  getMotherDisplayName,
} from '../utils/personName'

const ConversionOldRecordFormDialog = lazy(
  () => import('../components/ConversionRecordFormDialog'),
)

const EMPTY_FILTERS = {
  recordYears: [],
  receivingMinisters: [],
  denominations: [],
  requirementsStatuses: [],
}

function mapConversionRecord(doc) {
  const recordTypeValue = doc.recordType === 'old' ? 'old' : 'new'
  const requirementsSummary = getRequirementsSummary(
    'conversion',
    doc.requirements,
  )

  return {
    ...doc,
    recordNo: formatConversionRecordNumber(doc.recordYear, doc.recordNumber),
    recordTypeValue,
    recordType: recordTypeValue === 'old' ? 'Old Record' : 'New Record',
    convertDisplayName: getConvertDisplayName(doc),
    firstName: doc.firstName || '',
    middleName: doc.middleName || '',
    lastName: doc.lastName || '',
    suffix: doc.suffix || '',
    barangay: doc.barangay || '',
    municipality: doc.municipality || '',
    province: doc.province || '',
    residenceDisplay: formatConversionResidence(doc),
    fatherDisplayName: getFatherDisplayName(doc),
    motherDisplayName: getMotherDisplayName(doc),
    receivingMinister: doc.receivingMinister || '',
    dateOfReception: formatFirestoreDate(doc.dateOfReception),
    originalBaptismDate: formatFirestoreDate(doc.originalBaptismDate),
    originalBaptismDenomination: doc.originalBaptismDenomination || '',
    originalBaptismPlace: doc.originalBaptismPlace || '',
    observanda: doc.observanda || '',
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

function ViewConversionDialog({ open, record, onClose }) {
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
        View Conversion Record
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

          <DetailSection title="Convert Information" showDivider>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={
                  record.convertDisplayName || getConvertDisplayName(record)
                }
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

          <DetailSection title="Parents Information" showDivider>
            <DetailSubheading>Father&apos;s Name</DetailSubheading>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={
                  record.fatherDisplayName || getFatherDisplayName(record)
                }
              />
            </Grid>

            <DetailSubheading>Mother&apos;s Maiden Name</DetailSubheading>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Name"
                value={
                  record.motherDisplayName || getMotherDisplayName(record)
                }
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Reception Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Date of Reception"
                value={record.dateOfReception}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Receiving Minister"
                value={record.receivingMinister}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Original Baptism" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Date"
                value={record.originalBaptismDate}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Denomination"
                value={record.originalBaptismDenomination}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DetailField
                label="Place"
                value={record.originalBaptismPlace}
              />
            </Grid>
          </DetailSection>

          <DetailSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="conversion"
              value={record.requirements}
              readOnly
            />
          </DetailSection>

          <DetailSection title="Remarks" showDivider>
            <Grid size={{ xs: 12 }}>
              <DetailField label="Remarks" value={record.observanda} />
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
        <CertificatePrepActions sacrament="conversion" />
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 3, minWidth: 110 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ConversionRecords() {
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
      const data = await getConversionRecords()
      setRecords(data.map(mapConversionRecord))
    } catch (err) {
      setRecords([])
      setError(
        err instanceof Error ? err.message : MESSAGES.ERROR.CONVERSION_FETCH,
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
        const data = await getConversionRecords()
        if (!cancelled) {
          setRecords(data.map(mapConversionRecord))
        }
      } catch (err) {
        if (!cancelled) {
          setRecords([])
          setError(
            err instanceof Error ? err.message : MESSAGES.ERROR.CONVERSION_FETCH,
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
      recordYears: uniqueSortedValues(
        records.map((record) =>
          record.recordYear != null && record.recordYear !== ''
            ? String(record.recordYear)
            : null,
        ),
      ),
      receivingMinisters: uniqueSortedValues(
        records.map((record) => String(record.receivingMinister || '').trim()),
      ),
      denominations: uniqueSortedValues(
        records.map((record) =>
          String(record.originalBaptismDenomination || '').trim(),
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
        filters.recordYears.length > 0 &&
        !filters.recordYears.includes(String(record.recordYear ?? ''))
      ) {
        return false
      }

      if (
        filters.receivingMinisters.length > 0 &&
        !filters.receivingMinisters.includes(
          String(record.receivingMinister || '').trim(),
        )
      ) {
        return false
      }

      if (
        filters.denominations.length > 0 &&
        !filters.denominations.includes(
          String(record.originalBaptismDenomination || '').trim(),
        )
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
        record.convertDisplayName,
        record.firstName,
        record.middleName,
        record.lastName,
        record.suffix,
        record.receivingMinister,
        record.originalBaptismDenomination,
        record.originalBaptismPlace,
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
          throw new Error(MESSAGES.ERROR.CONVERSION_UPDATE)
        }

        await updateConversionRecord(record.id, payload, {
          userEmail: currentUser?.email || '',
        })
        setFormOpen(false)
        setSelectedRecord(null)
        setFormMode('add')
        await loadRecords({ showLoader: false })
        showSnackbar(MESSAGES.SUCCESS.CONVERSION_UPDATED, 'success')
        return
      }

      await createConversionRecord(
        { ...payload, recordType: 'old' },
        {
          userEmail: currentUser?.email || '',
        },
      )
      setFormOpen(false)
      setSelectedRecord(null)
      setFormMode('add')
      await loadRecords({ showLoader: false })
      showSnackbar(MESSAGES.SUCCESS.CONVERSION_CREATED, 'success')
    } catch (err) {
      const friendly =
        err instanceof Error &&
        (err.message === MESSAGES.ERROR.CONVERSION_DUPLICATE_RECORD ||
          err.message === MESSAGES.ERROR.CONVERSION_REQUIRED_FIELDS ||
          err.message.includes('Record number') ||
          err.message.includes('Record year'))
          ? err.message
          : mode === 'edit'
            ? MESSAGES.ERROR.CONVERSION_UPDATE
            : MESSAGES.ERROR.CONVERSION_CREATE

      showSnackbar(friendly, 'error')
      throw new Error(friendly)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <PageHeader title="Conversion Records" />

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
            placeholder="Search by record no., convert name, minister, denomination, place..."
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
                      title="Record Year"
                      options={filterOptions.recordYears}
                      selected={filters.recordYears}
                      onToggle={(value) =>
                        handleToggleFilter('recordYears', value)
                      }
                    />
                    <FilterSection
                      title="Receiving Minister"
                      options={filterOptions.receivingMinisters}
                      selected={filters.receivingMinisters}
                      onToggle={(value) =>
                        handleToggleFilter('receivingMinisters', value)
                      }
                    />
                    <FilterSection
                      title="Original Baptism Denomination"
                      options={filterOptions.denominations}
                      selected={filters.denominations}
                      onToggle={(value) =>
                        handleToggleFilter('denominations', value)
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
              Add Conversion Record
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
              Loading conversion records...
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
          <RecordsEmptyState icon={HowToRegOutlinedIcon} title="No conversion records found" />
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
                  <TableCell>Convert Name</TableCell>
                  <TableCell>Date of Reception</TableCell>
                  <TableCell>Receiving Minister</TableCell>
                  <TableCell>Denomination</TableCell>
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
                        {record.convertDisplayName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.dateOfReception}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {displayValue(record.receivingMinister)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {displayValue(record.originalBaptismDenomination)}
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
                            aria-label={`View ${record.convertDisplayName}`}
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
                            aria-label={`Edit ${record.convertDisplayName}`}
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
          Showing {filteredRecords.length} of {records.length} conversion
          {records.length === 1 ? ' record' : ' records'}
        </Typography>
      )}

      <ViewConversionDialog
        open={viewOpen}
        record={selectedRecord}
        onClose={handleCloseView}
      />

      {formOpen ? (
        <Suspense fallback={null}>
          <ConversionOldRecordFormDialog
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
