import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'

const VARIANTS = {
  /** Closing a form dialog while dirty */
  close: {
    title: 'Discard Changes?',
    body: 'You have unsaved changes. Are you sure you want to close this form?',
    stayLabel: 'Keep Editing',
    leaveLabel: 'Discard',
  },
  /** Leaving the page / changing routes while dirty */
  leave: {
    title: 'Unsaved Changes',
    body: 'You have unsaved changes that have not been saved.\n\nAre you sure you want to leave this page?\n\nYour changes will be lost.',
    stayLabel: 'Stay on Page',
    leaveLabel: 'Leave Page',
  },
}

/**
 * Shared confirmation dialog for dirty forms and page navigation.
 *
 * @param {'close' | 'leave'} [variant]
 */
export default function UnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
  variant = 'close',
}) {
  const copy = VARIANTS[variant] || VARIANTS.close

  return (
    <Dialog
      open={open}
      onClose={onKeepEditing}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: MARIAN_BLUE, fontWeight: 700, pb: 1 }}>
        {copy.title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {copy.body}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onKeepEditing}
          variant="contained"
          sx={{ borderRadius: 3, minWidth: 120 }}
        >
          {copy.stayLabel}
        </Button>
        <Button
          onClick={onDiscard}
          variant="outlined"
          color="error"
          sx={{ borderRadius: 3, minWidth: 110 }}
        >
          {copy.leaveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
