import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { MARIAN_BLUE } from '../theme/parishTheme'
import ReportTemplate from './ReportTemplate'
import { buildExportFileName } from '../services/reportService'

/**
 * Single reusable Report Preview Dialog.
 * Used by Generate Report and Recent Reports → View.
 * Hosts Export PDF and Print for the already-generated dataset.
 */
export default function ReportPreviewDialog({
  open,
  onClose,
  summary = null,
  rows = [],
  onExported,
  onExportError,
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [exporting, setExporting] = useState(false)

  const hasRecords = Array.isArray(rows) && rows.length > 0
  const canExport = Boolean(summary) && hasRecords && !exporting

  const dialogTitle = useMemo(() => {
    if (!summary?.reportTitle) return 'Report Preview'
    return String(summary.reportTitle).toUpperCase()
  }, [summary])

  async function handleExportPdf() {
    if (!canExport || !summary) return
    setExporting(true)
    try {
      const fileName = buildExportFileName(summary, 'pdf')
      const { exportReportPdf } = await import('../services/reportExport')
      await exportReportPdf({
        summary,
        rows,
        fileName,
      })
      await onExported?.({ format: 'PDF', fileName, summary })
    } catch {
      onExportError?.()
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    if (!canExport) return
    window.print()
  }

  return (
    <Dialog
      open={open}
      onClose={exporting ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      scroll="paper"
      aria-labelledby="report-preview-dialog-title"
      className="report-preview-dialog"
      sx={{
        '& .MuiDialog-paper': {
          width: { xs: '100%', sm: '90vw' },
          maxWidth: { xs: '100%', sm: '90vw' },
          height: { xs: '100%', sm: '90vh' },
          maxHeight: { xs: '100%', sm: '90vh' },
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 3 },
          overflow: 'hidden',
        },
        '@media print': {
          '& .MuiBackdrop-root': { display: 'none !important' },
          '& .MuiDialog-container': {
            display: 'block !important',
            height: 'auto !important',
          },
          '& .MuiDialog-paper': {
            width: '100% !important',
            maxWidth: '100% !important',
            height: 'auto !important',
            maxHeight: 'none !important',
            m: '0 !important',
            borderRadius: '0 !important',
            boxShadow: 'none !important',
            overflow: 'visible !important',
          },
        },
      }}
    >
      <DialogTitle
        id="report-preview-dialog-title"
        className="no-print"
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}

        sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontWeight: 700,
                color: MARIAN_BLUE,
                fontSize: { xs: '0.98rem', sm: '1.05rem' },
                lineHeight: 1.3,
              }}
              noWrap
            >
              {dialogTitle}
            </Typography>
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.2 }}
            >
              Preview and export the generated report.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexShrink: 0 }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                exporting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PictureAsPdfOutlinedIcon fontSize="small" />
                )
              }
              onClick={handleExportPdf}
              disabled={!canExport}
              sx={{
                borderRadius: 2.5,
                minHeight: 36,
                borderColor: MARIAN_BLUE,
                color: MARIAN_BLUE,
              }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintOutlinedIcon fontSize="small" />}
              onClick={handlePrint}
              disabled={!canExport}
              sx={{
                borderRadius: 2.5,
                minHeight: 36,
                borderColor: 'divider',
                color: 'text.primary',
              }}
            >
              Print
            </Button>
            <IconButton
              aria-label="Close report preview"
              onClick={onClose}
              disabled={exporting}
              size="small"
              sx={{
                ml: 0.25,
                color: 'text.secondary',
                '&:hover': {
                  color: MARIAN_BLUE,
                  bgcolor: 'rgba(11, 61, 145, 0.06)',
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: 'background.default',
          '@media print': {
            p: 0,
            border: 'none',
            bgcolor: '#fff',
            overflow: 'visible',
          },
        }}
      >
        {!summary ? (
          <Box className="no-print" sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No report is available to preview.
            </Typography>
          </Box>
        ) : !hasRecords ? (
          <Box
            className="no-print"
            sx={{
              py: 8,
              px: 2,
              textAlign: 'center',
              bgcolor: '#fff',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(11, 61, 145, 0.08)',
                color: MARIAN_BLUE,
              }}
            >
              <InboxOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography sx={{ fontWeight: 650, color: MARIAN_BLUE, mb: 0.75 }}>
              No records were found for the selected criteria.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adjust the filters and generate the report again.
            </Typography>
          </Box>
        ) : (
          <Box className="report-print-only">
            <ReportTemplate summary={summary} rows={rows} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
