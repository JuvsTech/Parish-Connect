import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Card, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import PageHeader from '../components/PageHeader'
import { getAuditLogsPage } from '../services/auditLogService'

function text(value, fallback = 'N/A') {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}
function detailsText(value) {
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value) || 'N/A' } catch { return 'N/A' }
  }
  return text(value)
}
function logDate(value) {
  try {
    const date = typeof value?.toDate === 'function' ? value.toDate()
      : value instanceof Date ? value
        : typeof value === 'string' || typeof value === 'number' ? new Date(value) : null
    return date && Number.isFinite(date.getTime()) ? date : null
  } catch { return null }
}

export default function AuditLogs() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const cursor = useRef(null)
  const pending = useRef(false)
  const mounted = useRef(false)
  const load = useCallback(async () => {
    if (pending.current) return
    pending.current = true
    setLoading(true)
    setError('')
    try {
      const page = await getAuditLogsPage(cursor.current)
      if (!mounted.current) return
      cursor.current = page.cursor
      setEntries(previous => Array.from(new Map([...previous, ...page.entries].map(entry => [entry.id, entry])).values()))
      setHasMore(page.hasMore)
    } catch {
      if (mounted.current) setError('Unable to load audit logs. Please try again.')
    } finally {
      pending.current = false
      if (mounted.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    mounted.current = true
    load()
    return () => { mounted.current = false }
  }, [load])
  const options = key => [...new Set(entries.map(entry => text(entry[key], '')).filter(Boolean))].sort()
  const invalidRange = Boolean(from && to && from > to)
  const rows = useMemo(() => entries.filter(entry => {
    if (invalidRange) return false
    if (module && text(entry.module) !== module) return false
    if (action && text(entry.action) !== action) return false
    const date = logDate(entry.timestamp)
    if ((from || to) && !date) return false
    if (from && date < new Date(from + 'T00:00:00')) return false
    if (to && date > new Date(to + 'T23:59:59.999')) return false
    const query = search.trim().toLowerCase()
    return !query || [text(entry.performedBy, ''), text(entry.performedByUid, ''), text(entry.action), text(entry.module), detailsText(entry.details)].join(' ').toLowerCase().includes(query)
  }).sort((a, b) => (logDate(b.timestamp)?.getTime() ?? -Infinity) - (logDate(a.timestamp)?.getTime() ?? -Infinity)), [entries, search, module, action, from, to, invalidRange])
  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <PageHeader title="Audit Logs" subtitle="Read-only activity history" />
      <Card sx={{ p: 2, borderRadius: '12px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Search loaded logs" size="small" fullWidth value={search} onChange={event => setSearch(event.target.value)} />
          <TextField select label="Module" size="small" fullWidth value={module} onChange={event => setModule(event.target.value)}>
            <MenuItem value="">All modules</MenuItem>
            {options('module').map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField select label="Action" size="small" fullWidth value={action} onChange={event => setAction(event.target.value)}>
            <MenuItem value="">All actions</MenuItem>
            {options('action').map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField label="From" type="date" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={from} onChange={event => setFrom(event.target.value)} />
          <TextField label="To" type="date" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={to} onChange={event => setTo(event.target.value)} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Search and all filters apply only to the {entries.length} loaded entries. Load more to search older activity. Dates use your local time. Historical entries without a timestamp are not included.</Typography>
        {invalidRange && <Alert severity="warning">From must be on or before To.</Alert>}
        {error && <Alert severity="error" action={<Button onClick={load} disabled={loading}>Retry</Button>}>{error}</Alert>}
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead><TableRow>{['Date/Time', 'User', 'Action', 'Module', 'Details'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {rows.map(entry => <TableRow key={entry.id}>
                <TableCell>{logDate(entry.timestamp)?.toLocaleString() || 'Unknown date'}</TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{text(entry.performedBy, text(entry.performedByUid, 'Unknown user'))}</TableCell>
                <TableCell>{text(entry.action)}</TableCell><TableCell>{text(entry.module)}</TableCell>
                <TableCell sx={{ maxWidth: 400, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detailsText(entry.details)}</TableCell>
              </TableRow>)}
              {!rows.length && <TableRow><TableCell colSpan={5}>{loading ? 'Loading audit logs…' : 'No matching loaded entries.'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <Button sx={{ mt: 2 }} onClick={load} disabled={loading || !hasMore}>{loading ? 'Loading…' : hasMore ? 'Load more' : 'All available dated entries loaded'}</Button>
      </Card>
    </Box>
  )
}
