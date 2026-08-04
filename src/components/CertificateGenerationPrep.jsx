import { useState } from 'react'
import { Button } from '@mui/material'
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
 * Opens Certificate Preview for every sacramental module (shared Baptism layout engine).
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
  const supported = isCertificateImplemented(sacrament)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outlined"
        disabled={disabled || !supported || !resolvedRecordId}
        sx={{ ...outlinedSx, ...sx }}
      >
        {label}
      </Button>

      <CertificatePreviewDialog
        open={open}
        onClose={() => setOpen(false)}
        sacrament={sacrament}
        recordId={resolvedRecordId}
      />
    </>
  )
}
