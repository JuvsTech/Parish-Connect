import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material'
import PasswordVerificationDialog from '../components/PasswordVerificationDialog'
import { useAuth } from '../contexts/AuthContext'
import { auth } from '../firebase/config'
import { COLLECTIONS } from '../constants'
import { createArchiveAccess, getArchivedRecords, recoverArchivedRecord } from '../services/archiveService'
import {
  getChildDisplayName, getConfirmandDisplayName, getGroomDisplayName,
  getBrideDisplayName, getDeceasedDisplayName, getConvertDisplayName,
} from '../utils/personName'
import {
  formatBaptismRecordNumber, formatConfirmationRecordNumber, formatMarriageRecordNumber,
  formatDeathRecordNumber, formatConversionRecordNumber,
} from '../utils/recordNumber'

const TYPES = [
  { collection: COLLECTIONS.BAPTISM, label: 'Baptism', name: getChildDisplayName, number: formatBaptismRecordNumber },
  { collection: COLLECTIONS.CONFIRMATION, label: 'Confirmation', name: getConfirmandDisplayName, number: formatConfirmationRecordNumber },
  { collection: COLLECTIONS.MARRIAGE, label: 'Marriage', name: (record) => `${getGroomDisplayName(record)} and ${getBrideDisplayName(record)}`, number: formatMarriageRecordNumber },
  { collection: COLLECTIONS.DEATH, label: 'Death', name: getDeceasedDisplayName, number: formatDeathRecordNumber },
  { collection: COLLECTIONS.CONVERSION, label: 'Conversion', name: getConvertDisplayName, number: formatConversionRecordNumber },
]

function archivedDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Not recorded'
}

function ArchiveList({ type, access }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [retry, setRetry] = useState(0)
  const mounted = useRef(false)
  const pending = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getArchivedRecords(type.collection, access).then((next) => {
      if (!cancelled && access.isValid()) setRecords(next)
    }).catch((err) => {
      if (!cancelled && access.isValid()) setError(err.message)
    }).finally(() => {
      if (!cancelled && access.isValid()) setLoading(false)
    })
    return () => { cancelled = true }
  }, [type, access, retry])

  async function recover() {
    if (pending.current || !selected || !access.isValid()) return
    if (!reason.trim()) { setRecoveryError('Recovery Reason is required.'); return }
    pending.current = true
    setSaving(true)
    setRecoveryError('')
    try {
      await recoverArchivedRecord(type.collection, selected.id, reason, access)
      if (!mounted.current || !access.isValid()) return
      setRecords((previous) => previous.filter((record) => record.id !== selected.id))
      setSelected(null)
      setReason('')
      setSuccess(`${type.label} record recovered successfully.`)
    } catch (err) {
      if (mounted.current && access.isValid()) setRecoveryError(err.message)
    } finally {
      pending.current = false
      if (mounted.current) setSaving(false)
    }
  }

  if (!access.isValid()) return null
  return (
    <Stack spacing={2}>
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {loading ? <CircularProgress aria-label="Loading archived records" /> : error ? (
        <Alert severity="error" action={<Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>}>{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label={`Archived ${type.label} records`}>
            <TableHead><TableRow>
              <TableCell>Record Number</TableCell><TableCell>Name</TableCell>
              <TableCell>Archived On</TableCell><TableCell>Archive Reason</TableCell><TableCell>Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {records.map((record) => <TableRow key={record.id}>
                <TableCell>{type.number(record.recordYear, record.recordNumber)}</TableCell>
                <TableCell>{type.name(record)}</TableCell>
                <TableCell>{archivedDate(record.archivedAt)}</TableCell>
                <TableCell sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxWidth: 400 }}>{record.archiveReason || 'Not recorded'}</TableCell>
                <TableCell><Button onClick={() => { setSelected(record); setReason(''); setRecoveryError(''); setSuccess('') }}>Recover</Button></TableCell>
              </TableRow>)}
              {!records.length && <TableRow><TableCell colSpan={5}>No archived {type.label.toLowerCase()} records.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null) }} fullWidth maxWidth="sm">
        <DialogTitle>Recover {type.label} Record</DialogTitle>
        <DialogContent>
          {selected && <Typography sx={{ mb: 2 }}>
            Recover {type.name(selected)} ({type.number(selected.recordYear, selected.recordNumber)}) to {type.label} Records?
          </Typography>}
          <TextField autoFocus fullWidth required multiline minRows={3} label="Recovery Reason"
            value={reason} disabled={saving} onChange={(event) => { setReason(event.target.value); setRecoveryError('') }} />
          {recoveryError && <Alert severity="error" sx={{ mt: 2 }}>{recoveryError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setSelected(null)}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={recover}>{saving ? 'Recovering…' : 'Confirm Recovery'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function ArchiveVisit() {
  const navigate = useNavigate()
  const [access, setAccess] = useState(null)
  const [tab, setTab] = useState(0)
  const accessRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      if (accessRef.current && !accessRef.current.isValid()) {
        accessRef.current.revoke()
        accessRef.current = null
        setAccess(null)
      }
    })
    return () => { unsubscribe(); accessRef.current?.revoke(); accessRef.current = null }
  }, [])

  const unlocked = Boolean(access?.isValid())
  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>Archived Records</Typography>
      <PasswordVerificationDialog open={!unlocked} title="Access Archived Records"
        description="Enter your current account password to view archived records."
        onClose={() => navigate('/')}
        onVerified={() => {
          const next = createArchiveAccess(auth.currentUser)
          if (!next.isValid()) return
          accessRef.current?.revoke()
          accessRef.current = next
          setAccess(next)
        }} />
      {unlocked && <>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Sacramental record types">
            {TYPES.map((type) => <Tab key={type.collection} label={type.label} />)}
          </Tabs>
        </Box>
        <ArchiveList key={TYPES[tab].collection} type={TYPES[tab]} access={access} />
      </>}
    </Stack>
  )
}

export default function ArchivedRecords() {
  const { currentUser } = useAuth()
  const location = useLocation()
  return <ArchiveVisit key={`${currentUser?.uid || 'signed-out'}:${location.key}`} />
}
