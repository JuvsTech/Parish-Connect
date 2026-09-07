import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  TextField,
} from '@mui/material'
import { MARIAN_BLUE } from '../../theme/parishTheme'
import BaptismCertificate from '../certificates/BaptismCertificate'
import {
  buildCertificateData,
  downloadCertificatePdf,
  isCertificateImplemented,
} from '../../services/certificateService'

/**
 * Preview / Print / Download PDF dialog for official certificates.
 * All sacraments reuse the Baptism certificate layout engine with
 * sacrament-specific titles, labels, and mapped record data.
 */
export default function CertificatePreviewDialog({
  open,
  onClose,
  sacrament,
  recordId,
}) {
  const certificateRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadCertificate() {
      if (!open) return

      if (!isCertificateImplemented(sacrament)) {
        setData(null)
        setError(
          'Certificate generation for this sacrament is not available yet.',
        )
        return
      }

      if (!recordId) {
        setData(null)
        setError('A saved record is required before generating a certificate.')
        return
      }

      setLoading(true)
      setError('')
      setData(null)

      try {
        const next = await buildCertificateData(sacrament, recordId)
        if (!cancelled) setData(next)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to generate the certificate.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCertificate()
    return () => {
      cancelled = true
    }
  }, [open, sacrament, recordId])

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    bodyClass: 'pc-certificate-print-document',
    documentTitle: data?.title || 'Certificate',
    onBeforePrint: async () => {
      setError('')
    },
    print: async (iframe) => {
      const page = iframe.contentDocument.querySelector('[data-certificate-page]')
      if (page) {
        // Measure the clone with the same geometry it will use during print.
        page.setAttribute('data-print-measuring', '')
        await iframe.contentDocument.fonts?.ready
        const pageWidth = page.getBoundingClientRect().width
        const pageHeight = Math.max(page.getBoundingClientRect().height, page.scrollHeight)
        const sheet = page.closest('.pc-certificate-print-sheet').getBoundingClientRect()
        // Fit the measured sheet, allowing half a CSS pixel for pagination rounding.
        const scale = Math.min(1, sheet.width / pageWidth, (sheet.height - 0.5) / pageHeight)
        page.style.setProperty('--cert-print-scale', scale)
        page.style.setProperty('--cert-print-height', `${pageHeight}px`)
        page.removeAttribute('data-print-measuring')
      }
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    },
    onPrintError: (_errorLocation, printError) => {
      setError(
        printError instanceof Error
          ? printError.message
          : 'Unable to print the certificate.',
      )
    },
  })

  async function handleDownloadPdf() {
    if (!certificateRef.current || !data) return
    setExporting(true)
    setError('')
    try {
      await downloadCertificatePdf(certificateRef.current, data)
    } catch (pdfError) {
      setError(
        pdfError instanceof Error
          ? pdfError.message
          : 'Unable to download the certificate PDF.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={exporting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            maxHeight: '94vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700, pb: 1 }}>
        Certificate Preview
      </DialogTitle>

      {data && !loading && (
        <TextField
          label="Purpose"
          value={data.purpose || ''}
          onChange={(event) => setData((current) => ({ ...current, purpose: event.target.value }))}
          multiline
          sx={{ mx: 3, mb: 2 }}
        />
      )}
      <DialogContent
        dividers
        sx={{
          bgcolor: '#E8ECF1',
          px: { xs: 1.5, sm: 2.5 },
          py: 2,
        }}
      >
        {loading ? (
          <Stack
            spacing={1.5}
            sx={{
              minHeight: 240,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Loading certificate from parish records…
            </Typography>
          </Stack>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: data ? 2 : 0 }}>
            {error}
          </Alert>
        ) : null}

        {data ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto',
            }}
          >
            <Box
              ref={certificateRef}
              className="pc-certificate-print-sheet"
              sx={{
                boxShadow: '0 8px 28px rgba(16, 24, 40, 0.12)',
                bgcolor: '#fff',
              }}
            >
              <BaptismCertificate data={data} />
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={exporting}
          sx={{ borderRadius: 3, minWidth: 100 }}
        >
          Close
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={() => handlePrint()}
          variant="outlined"
          disabled={!data || loading || exporting}
          sx={{ borderRadius: 3, minWidth: 100 }}
        >
          Print
        </Button>
        <Button
          onClick={handleDownloadPdf}
          variant="contained"
          disabled={!data || loading || exporting}
          startIcon={
            exporting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{ borderRadius: 3, minWidth: 130 }}
        >
          {exporting ? 'Working…' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
