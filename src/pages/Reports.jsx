import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { MARIAN_BLUE, SOFT_SHADOW_HOVER } from '../theme/parishTheme'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { MESSAGES } from '../constants'
import {
  REPORT_TYPE_OPTIONS,
  REPORT_MONTH_OPTIONS,
  buildReportYearOptions,
  getReportTypeConfig,
} from '../constants/reportTypes'
import {
  formatMinisterDisplayName,
  getMinisters,
} from '../services/ministerService'
import {
  generateSacramentalReport,
  getReportYears,
  getRecentReports,
  getReportSummaryCounts,
  saveReportMetadata,
} from '../services/reportService'

const ReportPreviewDialog = lazy(
  () => import('../components/ReportPreviewDialog'),
)

const YEAR_OPTIONS = buildReportYearOptions(10)

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
          p: 2.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          '&:last-child': { pb: 2.25 },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(11, 61, 145, 0.08)',
            color: MARIAN_BLUE,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.78rem',
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              fontWeight: 700,
              color: MARIAN_BLUE,
              fontSize: '1.55rem',
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

function formatHistoryDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Reports Module — configure filters and generate reports.
 * Preview / PDF / Print open in ReportPreviewDialog.
 */
export default function Reports() {
  const { currentUser } = useAuth()

  const [reportType, setReportType] = useState('baptism')
  const [year, setYear] = useState('All Years')
  const [yearOptions, setYearOptions] = useState(['All Years'])
  const [month, setMonth] = useState('All Months')
  const [minister, setMinister] = useState(null)

  const [counts, setCounts] = useState({
    baptism: 0,
    confirmation: 0,
    marriage: 0,
    death: 0,
    conversion: 0,
    massIntention: 0,
  })

  const [ministerOptions, setMinisterOptions] = useState([])
  const [ministersLoading, setMinistersLoading] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reportSummary, setReportSummary] = useState(null)
  const [reportRows, setReportRows] = useState([])

  const [recentReports, setRecentReports] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const generatedByLabel = useMemo(() => {
    const email = currentUser?.email || ''
    if (!email) return 'Administrator'
    return email
  }, [currentUser])

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Baptism Records',
        value: counts.baptism,
        icon: WaterDropOutlinedIcon,
      },
      {
        title: 'Total Confirmation Records',
        value: counts.confirmation,
        icon: VerifiedOutlinedIcon,
      },
      {
        title: 'Total Marriage Records',
        value: counts.marriage,
        icon: FavoriteBorderOutlinedIcon,
      },
      {
        title: 'Total Death Records',
        value: counts.death,
        icon: VolunteerActivismOutlinedIcon,
      },
      {
        title: 'Total Conversion Records',
        value: counts.conversion,
        icon: HowToRegOutlinedIcon,
      },
      {
        title: 'Total Mass Intentions',
        value: counts.massIntention || 0,
        icon: AutoAwesomeOutlinedIcon,
      },
    ],
    [counts],
  )

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const loadCounts = useCallback(async () => {
    try {
      const next = await getReportSummaryCounts()
      setCounts(next)
    } catch (error) {
      setCounts({
        baptism: 0,
        confirmation: 0,
        marriage: 0,
        death: 0,
        conversion: 0,
        massIntention: 0,
      })
      showSnackbar(
        error instanceof Error
          ? error.message
          : 'Unable to load report summary counts.',
        'error',
      )
    }
  }, [showSnackbar])

  const loadRecent = useCallback(async () => {
    setRecentLoading(true)
    try {
      const rows = await getRecentReports()
      setRecentReports(rows)
    } catch (error) {
      setRecentReports([])
      showSnackbar(
        error instanceof Error
          ? error.message
          : MESSAGES.ERROR.REPORT_RECENT_LOAD,
        'error',
      )
    } finally {
      setRecentLoading(false)
    }
  }, [showSnackbar])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      setRecentLoading(true)
      try {
        const [nextCounts, rows] = await Promise.all([
          getReportSummaryCounts(),
          getRecentReports(),
        ])
        if (cancelled) return
        setCounts(nextCounts)
        setRecentReports(rows)
      } catch (error) {
        if (cancelled) return
        setCounts({
          baptism: 0,
          confirmation: 0,
          marriage: 0,
          death: 0,
          conversion: 0,
          massIntention: 0,
        })
        setRecentReports([])
        showSnackbar(
          error instanceof Error
            ? error.message
            : MESSAGES.ERROR.REPORT_RECENT_LOAD,
          'error',
        )
      } finally {
        if (!cancelled) setRecentLoading(false)
      }
    }

    initialLoad()
    return () => {
      cancelled = true
    }
  }, [showSnackbar])

  const reportTypeChangeRef = useRef(true)

  useEffect(() => {
    let cancelled = false
    async function loadMinisters() {
      setMinistersLoading(true)
      try {
        const config = getReportTypeConfig(reportType)
        const list = await getMinisters({
          activeOnly: true,
          assignment: config.assignment,
        })
        if (cancelled) return
        setMinisterOptions(list)
        setMinister(null)
      } catch {
        if (!cancelled) {
          setMinisterOptions([])
          setMinister(null)
        }
      } finally {
        if (!cancelled) setMinistersLoading(false)
      }
    }

    async function loadYears() {
      try {
        const options = await getReportYears(reportType)
        if (cancelled) return
        setYearOptions(['All Years', ...options])
      } catch {
        if (!cancelled) {
          setYearOptions(['All Years', ...YEAR_OPTIONS])
        }
      }
    }

    if (reportTypeChangeRef.current) {
      reportTypeChangeRef.current = false
    } else {
      setYear('All Years')
      setMonth('All Months')
      setMinister(null)
    }

    loadMinisters()
    loadYears()

    return () => {
      cancelled = true
    }
  }, [reportType])

  async function handleGenerateReport(overrideFilters) {
    if (generating) return
    if (!currentUser) {
      showSnackbar('Please sign in to generate reports.', 'error')
      return
    }

    if (!overrideFilters && minister === null) {
      showSnackbar('Please select a minister to generate a report.', 'error')
      return
    }

    const filters = overrideFilters || {
      reportType,
      year,
      month,
      minister: minister === 'All Ministers' ? '' : minister,
      generatedBy: generatedByLabel,
    }

    setGenerating(true)
    try {
      const result = await generateSacramentalReport(filters)
      setReportSummary(result.summary)
      setReportRows(result.rows)

      if (overrideFilters) {
        setReportType(overrideFilters.reportType)
        setYear(String(overrideFilters.year))
        setMonth(overrideFilters.month || 'All Months')
        setMinister(
          overrideFilters.minister === 'All Ministers'
            ? 'All Ministers'
            : overrideFilters.minister || null,
        )
      }

      setPreviewOpen(true)
      showSnackbar(MESSAGES.SUCCESS.REPORT_GENERATED)
      await loadCounts()
    } catch (error) {
      setReportSummary(null)
      setReportRows([])
      setPreviewOpen(false)
      showSnackbar(
        error instanceof Error
          ? error.message
          : MESSAGES.ERROR.REPORT_GENERATE,
        'error',
      )
    } finally {
      setGenerating(false)
    }
  }

  async function handlePreviewExported({ format, fileName, summary }) {
    try {
      await saveReportMetadata({
        summary,
        exportFormat: format,
        fileName,
        userEmail: currentUser?.email || '',
      })
      await loadRecent()
      showSnackbar(MESSAGES.SUCCESS.REPORT_EXPORTED_PDF)
    } catch {
      showSnackbar(MESSAGES.ERROR.REPORT_EXPORT, 'error')
    }
  }

  async function handleViewRecent(report) {
    const filters = report.appliedFilters
    if (!filters?.reportType || !filters?.year) {
      showSnackbar('This report cannot be reopened from history.', 'error')
      return
    }
    await handleGenerateReport({
      reportType: filters.reportType,
      year: filters.year, 
      month: filters.month || 'All Months',
      minister:
        filters.minister === 'All Ministers'
          ? 'All Ministers'
          : filters.minister || '',
      generatedBy: generatedByLabel,
    })
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }} className="no-print">
      <PageHeader
        title="Reports"
        subtitle="Generate and view sacramental reports."
      />

      <Grid container spacing={2} sx={{ mb: 2.75 }}>
        {summaryCards.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <SummaryCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 2.75 }}>
        <CardContent
          sx={{
            p: { xs: 2.25, sm: 2.75 },
            '&:last-child': { pb: { xs: 2.25, sm: 2.75 } },
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
           
            sx={{ alignItems: "center", mb: 2.25 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(11, 61, 145, 0.08)',
                color: MARIAN_BLUE,
              }}
            >
              <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: MARIAN_BLUE, lineHeight: 1.3 }}
              >
                Report Generation
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                Select filters and generate a sacramental report.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={2.25}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  label="Report Type"
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                  disabled={generating}
                >
                  {REPORT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="report-year-label">Year</InputLabel>
                <Select
                  labelId="report-year-label"
                  label="Year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  disabled={generating}
                >
                  {yearOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="report-month-label">Month</InputLabel>
                <Select
                  labelId="report-month-label"
                  label="Month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  disabled={generating}
                >
                  {REPORT_MONTH_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="report-minister-label">Minister</InputLabel>
                <Select
                  labelId="report-minister-label"
                  label="Minister"
                  value={minister}
                  onChange={(event) => setMinister(event.target.value)}
                  disabled={generating || ministersLoading}
                  error={false}
                >
                  <MenuItem value="All Ministers">All Ministers</MenuItem>
                  {ministerOptions.map((item) => {
                    const label = formatMinisterDisplayName(item)
                    return (
                      <MenuItem key={item.id} value={label}>
                        {label}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mt: 2.5 }}
           
          >
            <Button
              variant="contained"
              sx={{ borderRadius: 3, minHeight: 40 }}
              onClick={() => handleGenerateReport()}
              disabled={generating}
              startIcon={
                generating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {generating ? 'Generating…' : 'Generate Report'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 650,
          color: 'text.secondary',
          fontSize: '0.82rem',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        Recent Reports
      </Typography>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Generated By</TableCell>
                <TableCell>Generated Date</TableCell>
                <TableCell>Format</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress
                      size={28}
                      sx={{ color: MARIAN_BLUE, my: 2 }}
                    />
                  </TableCell>
                </TableRow>
              ) : recentReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2.5, textAlign: 'center' }}
                    >
                      No reports have been exported yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentReports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.18s ease',
                      '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.035)' },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {report.reportName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {report.generatedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatHistoryDate(report.generatedDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 650, color: MARIAN_BLUE }}
                      >
                        {report.format}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          aria-label={`View ${report.reportName}`}
                          onClick={() => handleViewRecent(report)}
                          disabled={generating}
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {previewOpen ? (
        <Suspense fallback={null}>
          <ReportPreviewDialog
            open
            onClose={() => setPreviewOpen(false)}
            summary={reportSummary}
            rows={reportRows}
            onExported={handlePreviewExported}
            onExportError={() =>
              showSnackbar(MESSAGES.ERROR.REPORT_EXPORT, 'error')
            }
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
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
