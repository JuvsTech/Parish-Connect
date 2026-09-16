import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { verifyCurrentPassword } from '../services/passwordService'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { auth } from '../firebase/config'

/**
 * Reusable current-password confirmation for protected record actions.
 */
export default function PasswordVerificationDialog({
  open,
  title = 'Verify Current Password',
  description = 'Enter your current password to continue.',
  confirmLabel = 'Verify',
  confirmColor = 'primary',
  requireReason = false,
  onClose,
  onVerified,
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const active = useRef(false)

  useEffect(() => {
    active.current = open
    return () => { active.current = false }
  }, [open])

  useEffect(() => {
    if (!open) {
      setPassword('')
      setError('')
      setVerifying(false)
      setReason('')
      setReasonError('')
    }
  }, [open])

  function handleClose() {
    if (verifying) return
    setPassword('')
    setError('')
    onClose?.()
  }

  async function handleVerify() {
    if (verifying || !password.trim()) return
    if (requireReason && !reason.trim()) {
      setReasonError('Archive Reason is required.')
      return
    }

    const user = auth.currentUser
    setVerifying(true)
    setError('')

    try {
      await verifyCurrentPassword(password)
      if (!active.current || !user || auth.currentUser !== user) return
      setPassword('')
      await onVerified?.(requireReason ? reason.trim() : undefined)
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'Unable to verify the current password.',
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700 }}>
        {title}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        {requireReason && (
          <TextField
            fullWidth required multiline minRows={2}
            label="Archive Reason" value={reason}
            onChange={(event) => { setReason(event.target.value); setReasonError('') }}
            error={Boolean(reasonError)} helperText={reasonError || ' '}
            disabled={verifying} sx={{ mb: 1 }}
          />
        )}
        <TextField
          autoFocus
          fullWidth
          label="Current Password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (error) setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleVerify()
          }}
          error={Boolean(error)}
          helperText={error || ' '}
          autoComplete="current-password"
          disabled={verifying}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={verifying}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={handleVerify}
          disabled={verifying || !password.trim()}
        >
          {verifying ? 'Verifying…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
