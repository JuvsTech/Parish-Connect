import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { isCertificateImplemented } from '../services/certificateService'
import CertificatePreviewDialog from './dialogs/CertificatePreviewDialog'

export const CERTIFICATE_GENERATE_LABELS = {
  baptism: 'Generate Baptism Certificate',
  confirmation: 'Generate Confirmation Certificate',
  marriage: 'Generate Marriage Certificate',
  death: 'Generate Death Certificate',
  conversion: 'Generate Conversion Certificate',
}

/**
 * Placeholder dialog for sacraments not yet implemented.
 */
export function CertificateComingSoonDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700, pb: 1 }}>
        Certificate Generation
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Certificate generation is currently under development.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7, mt: 1.25 }}
        >
          The certificate template for this sacrament has not yet been finalized.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7, mt: 1.25 }}
        >
          This feature will become available in a future update.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 3, minWidth: 110 }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const outlinedSx = {
  borderRadius: 3,
  minWidth: 110,
  borderColor: 'divider',
  color: 'text.primary',
  '&:hover': {
    borderColor: MARIAN_BLUE,
    bgcolor: 'rgba(11, 61, 145, 0.04)',
  },
}

/**
 * "Generate … Certificate" action.
 * Opens the live preview for implemented sacraments.
 */
export default function CertificatePrepActions({
  sacrament,
  recordId,
  record = null,
  disabled = false,
  sx,
}) {
  const [open, setOpen] = useState(false)
  const label =
    CERTIFICATE_GENERATE_LABELS[sacrament] || 'Generate Certificate'
  const resolvedRecordId = recordId || record?.id || ''
  const implemented = isCertificateImplemented(sacrament)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outlined"
        disabled={disabled || (implemented && !resolvedRecordId)}
        sx={{ ...outlinedSx, ...sx }}
      >
        {label}
      </Button>

      {implemented ? (
        <CertificatePreviewDialog
          open={open}
          onClose={() => setOpen(false)}
          sacrament={sacrament}
          recordId={resolvedRecordId}
        />
      ) : (
        <CertificateComingSoonDialog
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
