import { useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { getImportConfig } from '../services/sacramentImportConfig'
import { downloadImportTemplate, previewImport, saveHistoricalImport } from '../services/sacramentImportService'

// Keep the Excel workflow available for development while it is disabled in the UI.
const IMPORT_UI_ENABLED = false

export default function SacramentImportActions({ module, onImported }) {
  const input = useRef(null)
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState(null)
  const [summary, setSummary] = useState(null)
  const [page, setPage] = useState(0)
  const [progress, setProgress] = useState('')
  const config = getImportConfig(module)
  const counts = (rows || []).reduce((result, row) => ({ ...result, [row.state]: (result[row.state] || 0) + 1 }), {})
  async function run(action) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { await action() } catch (cause) { setError(cause?.message || 'Unable to process this workbook.') }
    finally { busyRef.current = false; setBusy(false); setProgress('') }
  }
  async function selectFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await run(async () => {
      setRows(null); setSummary(null); setPage(0)
      setRows(await previewImport(module, file))
    })
  }
  async function confirm() {
    await run(async () => {
      const result = await saveHistoricalImport(module, rows, (done, total) => setProgress(`${done} / ${total} rows processed`))
      setRows(result.rows); setSummary(result.summary); setPage(0)
      if (result.summary.imported) {
        try { await onImported?.() }
        catch { setError('Import finished, but the record list could not refresh. Reload the page to see the saved records.') }
      }
    })
  }
  if (!IMPORT_UI_ENABLED) return null

  return <Box sx={{ mt: 2 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button variant="outlined" startIcon={<DownloadRoundedIcon />} disabled={busy} onClick={() => run(() => downloadImportTemplate(module))}>Download Template</Button>
      <Button variant="outlined" startIcon={<UploadFileRoundedIcon />} disabled={busy} onClick={() => input.current?.click()}>Import Excel</Button>
      <input ref={input} type="file" accept=".xlsx" hidden onChange={selectFile} />
      {busy && <CircularProgress size={24} aria-label="Processing Excel file" />}
    </Stack>
    {error && !rows && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    <Dialog open={Boolean(rows)} onClose={() => { if (!busy) setRows(null) }} maxWidth="xl" fullWidth>
      <DialogTitle>{config.title} Excel Import {summary ? 'Results' : 'Preview'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="info" sx={{ mb: 2 }}>Historical records only. No Calendar events or schedule slots will be created. {module === 'baptism' ? 'Historical Baptisms are saved without an assigned lifecycle status.' : 'Existing manual-entry status defaults apply.'} No records are overwritten.</Alert>
        {summary ? <Alert severity={summary.failed ? 'warning' : 'success'} sx={{ mb: 2 }}>
          Imported: {summary.imported} | Skipped/Invalid: {summary.invalid} | Duplicates/Conflicts: {summary.duplicates} | Failed: {summary.failed}
        </Alert> : <Typography sx={{ mb: 2 }}>Total: {rows?.length || 0} | Valid: {counts.Valid || 0} | Invalid: {counts.Invalid || 0} | Duplicates/Conflicts: {counts.Conflict || 0}. No records have been saved yet.</Typography>}
        {!summary && <Typography sx={{ mb: 2 }}>{counts.Valid || 0} valid records are ready to import. {(counts.Invalid || 0) + (counts.Conflict || 0)} invalid or conflicting rows will be skipped. Conflicts are checked again when you confirm.</Typography>}
        <TableContainer sx={{ maxHeight: '55vh' }}>
          <Table stickyHeader size="small" aria-label="Excel import preview">
            <TableHead><TableRow><TableCell>Excel Row</TableCell><TableCell>Result / Reason</TableCell>{config.columns.map(c => <TableCell key={c.key} sx={{ minWidth: 160 }}>{c.label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{(rows || []).slice(page * 25, page * 25 + 25).map(row => <TableRow key={row.rowNumber}>
              <TableCell>{row.rowNumber}</TableCell>
              <TableCell sx={{ minWidth: 280 }}><Typography fontWeight={600}>{row.state}</Typography>{row.reasons?.map((reason, i) => <Typography key={i} variant="body2" color="text.secondary">{reason}</Typography>)}</TableCell>
              {config.columns.map(c => <TableCell key={c.key} sx={{ maxWidth: 320, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{String(row.values[c.key] || 'N/A')}{row.mapping?.[c.key] && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{row.mapping[c.key]}</Typography>}</TableCell>)}
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={rows?.length || 0} page={page} onPageChange={(_, value) => setPage(value)} rowsPerPage={25} rowsPerPageOptions={[25]} />
        {progress && <Typography role="status">{progress}. Keep this window open until the result appears.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setRows(null)}>{summary ? 'Close' : 'Cancel'}</Button>
        {!summary && <Button variant="contained" disabled={busy || !counts.Valid} onClick={confirm}>{busy ? 'Importing...' : 'Confirm Import'}</Button>}
      </DialogActions>
    </Dialog>
  </Box>
}
