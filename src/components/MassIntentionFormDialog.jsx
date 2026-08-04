import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { MARIAN_BLUE } from '../theme/parishTheme'
import {
  DEFAULT_MASS_INTENTION_RECIPIENT_TYPE,
  DEFAULT_MASS_INTENTION_STATUS,
  MASS_INTENTION_OTHER_TYPE,
  MASS_INTENTION_RECIPIENT_TYPE,
  MASS_INTENTION_RECIPIENT_TYPE_VALUES,
  MASS_INTENTION_STATUS_OPTIONS,
  MASS_INTENTION_TYPE_OPTIONS,
  applyRecipientTypeFields,
  getAllowedRecipientTypeOptions,
  isRecipientTypeAllowed,
  syncFormRecipientForIntentionType,
} from '../constants'
import FormSection from './FormSection'
import FormFieldSubheading from './FormFieldSubheading'
import NameField from './NameField'
import MinisterField from './MinisterField'
import ResidencePlaceSelect from './ResidencePlaceSelect'
import TimeSelect from './TimeSelect'
import { toProperCase } from '../utils/textFormatter'
import {
  EMPTY_PLACE,
  isResidencePlaceComplete,
  resolveResidencePlace,
} from '../utils/philippinePlaces'
import {
  getLocalDateKey,
  getPhoneValidationError,
  validateOptionalName,
  validateRequiredName,
} from '../utils/validation'
import { listValidationMessages } from '../utils/formValidationSummary'
import {
  formatMassIntentionRecordNumber,
  getNextMassIntentionRecordParts,
} from '../utils/recordNumber'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import UnsavedChangesDialog from './UnsavedChangesDialog'

const FIELD_LABELS = {
  intentionNumber: 'Intention Number',
  requestDate: 'Request Date',
  massDate: 'Mass Date',
  massTime: 'Mass Time',
  intentionType: 'Intention Type',
  otherIntention: 'Other Intention',
  celebrantName: 'Celebrant',
  recipientType: 'Recipient Type',
  recipientFirstName: 'First Name',
  recipientMiddleName: 'Middle Name',
  recipientLastName: 'Last Name',
  recipientSuffix: 'Suffix',
  spouse1FirstName: 'Spouse 1 — First Name',
  spouse1MiddleName: 'Spouse 1 — Middle Name',
  spouse1LastName: 'Spouse 1 — Last Name',
  spouse1Suffix: 'Spouse 1 — Suffix',
  spouse2FirstName: 'Spouse 2 — First Name',
  spouse2MiddleName: 'Spouse 2 — Middle Name',
  spouse2LastName: 'Spouse 2 — Last Name',
  spouse2Suffix: 'Spouse 2 — Suffix',
  familyName: 'Family Name',
  organizationName: 'Organization / Ministry Name',
  offeredForDescription: 'Offered For',
  requesterFirstName: 'Requested By — First Name',
  requesterMiddleName: 'Requested By — Middle Name',
  requesterLastName: 'Requested By — Last Name',
  requesterSuffix: 'Requested By — Suffix',
  contactNumber: 'Contact Number',
  residencePlace: 'Residence',
  status: 'Status',
  remarks: 'Remarks',
}

function resolveRecipientType(record = {}) {
  const raw = String(record.recipientType || '').trim().toLowerCase()
  if (MASS_INTENTION_RECIPIENT_TYPE_VALUES.includes(raw)) return raw
  return DEFAULT_MASS_INTENTION_RECIPIENT_TYPE
}

function blankToEmpty(value) {
  return value == null ? '' : String(value)
}

function createEmptyForm() {
  const today = getLocalDateKey()
  return {
    recordYear: new Date().getFullYear(),
    recordNumber: 1,
    intentionNumber: '',
    requestDate: today,
    massDate: '',
    massTime: '',
    intentionType: '',
    otherIntention: '',
    celebrantName: '',
    recipientType: DEFAULT_MASS_INTENTION_RECIPIENT_TYPE,
    recipientFirstName: '',
    recipientMiddleName: '',
    recipientLastName: '',
    recipientSuffix: '',
    spouse1FirstName: '',
    spouse1MiddleName: '',
    spouse1LastName: '',
    spouse1Suffix: '',
    spouse2FirstName: '',
    spouse2MiddleName: '',
    spouse2LastName: '',
    spouse2Suffix: '',
    familyName: '',
    organizationName: '',
    offeredForDescription: '',
    requesterFirstName: '',
    requesterMiddleName: '',
    requesterLastName: '',
    requesterSuffix: '',
    contactNumber: '',
    residencePlace: { ...EMPTY_PLACE },
    remarks: '',
    status: DEFAULT_MASS_INTENTION_STATUS,
  }
}

function mapRecordToForm(record) {
  if (!record) return createEmptyForm()
  const mapped = {
    recordYear: Number(record.recordYear) || new Date().getFullYear(),
    recordNumber: Number(record.recordNumber) || 1,
    intentionNumber: blankToEmpty(record.intentionNumber),
    requestDate: blankToEmpty(record.requestDate).slice(0, 10) || getLocalDateKey(),
    massDate: blankToEmpty(record.massDate).slice(0, 10),
    massTime: blankToEmpty(record.massTime),
    intentionType: blankToEmpty(record.intentionType),
    otherIntention: blankToEmpty(record.otherIntention),
    celebrantName: blankToEmpty(record.celebrantName),
    recipientType: resolveRecipientType(record),
    recipientFirstName: blankToEmpty(
      record.recipientFirstName || record.intentionFirstName,
    ),
    recipientMiddleName: blankToEmpty(
      record.recipientMiddleName || record.intentionMiddleName,
    ),
    recipientLastName: blankToEmpty(
      record.recipientLastName || record.intentionLastName,
    ),
    recipientSuffix: blankToEmpty(
      record.recipientSuffix || record.intentionSuffix,
    ),
    spouse1FirstName: blankToEmpty(
      record.spouse1FirstName || record.person1FirstName,
    ),
    spouse1MiddleName: blankToEmpty(
      record.spouse1MiddleName || record.person1MiddleName,
    ),
    spouse1LastName: blankToEmpty(
      record.spouse1LastName || record.person1LastName,
    ),
    spouse1Suffix: blankToEmpty(record.spouse1Suffix || record.person1Suffix),
    spouse2FirstName: blankToEmpty(
      record.spouse2FirstName || record.person2FirstName,
    ),
    spouse2MiddleName: blankToEmpty(
      record.spouse2MiddleName || record.person2MiddleName,
    ),
    spouse2LastName: blankToEmpty(
      record.spouse2LastName || record.person2LastName,
    ),
    spouse2Suffix: blankToEmpty(record.spouse2Suffix || record.person2Suffix),
    familyName: blankToEmpty(record.familyName),
    organizationName: blankToEmpty(record.organizationName),
    offeredForDescription: blankToEmpty(record.offeredForDescription),
    requesterFirstName: blankToEmpty(record.requesterFirstName),
    requesterMiddleName: blankToEmpty(record.requesterMiddleName),
    requesterLastName: blankToEmpty(record.requesterLastName),
    requesterSuffix: blankToEmpty(record.requesterSuffix),
    contactNumber: blankToEmpty(record.contactNumber),
    residencePlace: resolveResidencePlace({
      province: record.province,
      municipality: record.municipality,
      barangay: record.barangay,
      residencePlace: record.residencePlace,
    }),
    remarks: blankToEmpty(record.remarks),
    status: blankToEmpty(record.status) || DEFAULT_MASS_INTENTION_STATUS,
  }
  return syncFormRecipientForIntentionType(mapped, mapped.intentionType)
}

function applyNameError(errors, field, value, required) {
  const error = required
    ? validateRequiredName(value)
    : validateOptionalName(value)
  if (error) errors[field] = error
}

function validateForm(form) {
  const errors = {}

  if (!form.massDate) errors.massDate = 'Mass date is required.'
  if (!form.massTime) errors.massTime = 'Mass time is required.'
  if (!form.intentionType) errors.intentionType = 'Intention type is required.'
  if (
    form.intentionType === MASS_INTENTION_OTHER_TYPE &&
    !String(form.otherIntention || '').trim()
  ) {
    errors.otherIntention = 'Please describe the other intention.'
  }
  if (!String(form.celebrantName || '').trim()) {
    errors.celebrantName = 'Celebrant is required.'
  }

  const recipientType =
    form.recipientType || DEFAULT_MASS_INTENTION_RECIPIENT_TYPE
  if (!recipientType) {
    errors.recipientType = 'Recipient type is required.'
  } else if (
    form.intentionType &&
    !isRecipientTypeAllowed(form.intentionType, recipientType)
  ) {
    errors.recipientType =
      'This recipient type is not allowed for the selected intention type.'
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL) {
    applyNameError(errors, 'recipientFirstName', form.recipientFirstName, true)
    applyNameError(errors, 'recipientMiddleName', form.recipientMiddleName, false)
    applyNameError(errors, 'recipientLastName', form.recipientLastName, true)
    applyNameError(errors, 'recipientSuffix', form.recipientSuffix, false)
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.COUPLE) {
    applyNameError(errors, 'spouse1FirstName', form.spouse1FirstName, true)
    applyNameError(errors, 'spouse1MiddleName', form.spouse1MiddleName, false)
    applyNameError(errors, 'spouse1LastName', form.spouse1LastName, true)
    applyNameError(errors, 'spouse1Suffix', form.spouse1Suffix, false)
    applyNameError(errors, 'spouse2FirstName', form.spouse2FirstName, true)
    applyNameError(errors, 'spouse2MiddleName', form.spouse2MiddleName, false)
    applyNameError(errors, 'spouse2LastName', form.spouse2LastName, true)
    applyNameError(errors, 'spouse2Suffix', form.spouse2Suffix, false)
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.FAMILY) {
    if (!String(form.familyName || '').trim()) {
      errors.familyName = 'Family name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.ORGANIZATION) {
    if (!String(form.organizationName || '').trim()) {
      errors.organizationName = 'Organization / Ministry name is required.'
    }
  } else if (recipientType === MASS_INTENTION_RECIPIENT_TYPE.OTHER) {
    if (!String(form.offeredForDescription || '').trim()) {
      errors.offeredForDescription = 'Offered For is required.'
    }
  }

  applyNameError(errors, 'requesterFirstName', form.requesterFirstName, true)
  applyNameError(errors, 'requesterMiddleName', form.requesterMiddleName, false)
  applyNameError(errors, 'requesterLastName', form.requesterLastName, true)
  applyNameError(errors, 'requesterSuffix', form.requesterSuffix, false)

  if (String(form.contactNumber || '').trim()) {
    const phoneError = getPhoneValidationError(form.contactNumber)
    if (phoneError) errors.contactNumber = phoneError
  }

  if (!isResidencePlaceComplete(form.residencePlace)) {
    errors.residencePlace =
      'Select Province, Municipality / City, and Barangay.'
  }

  if (!form.status) errors.status = 'Status is required.'

  return errors
}

/**
 * Add / Edit Mass Intention dialog.
 */
export default function MassIntentionFormDialog({
  open,
  mode = 'add',
  record = null,
  existingRecords = [],
  saving = false,
  onClose,
  onSave,
  defaultMassDate = '',
  defaultMassTime = '',
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(createEmptyForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    confirmOpen,
    captureBaseline,
    clearBaseline,
    requestClose,
    keepEditing,
    discardChanges,
  } = useUnsavedChanges(form, { enabled: open && !saving })

  useEffect(() => {
    if (!open) {
      clearBaseline()
      return
    }

    let next
    if (isEdit && record) {
      next = mapRecordToForm(record)
    } else {
      const parts = getNextMassIntentionRecordParts(
        existingRecords,
        new Date().getFullYear(),
      )
      next = {
        ...createEmptyForm(),
        recordYear: parts.recordYear,
        recordNumber: parts.recordNumber,
        intentionNumber: formatMassIntentionRecordNumber(
          parts.recordYear,
          parts.recordNumber,
        ),
        massDate: defaultMassDate || '',
        massTime: defaultMassTime || '',
      }
    }

    setForm(next)
    captureBaseline(next)
    setErrors({})
    setTouched({})
    setSubmitAttempted(false)
    setFormError('')
    // existingRecords is read only when the dialog opens so parent refreshes
    // do not wipe in-progress edits.
  }, [open, isEdit, record, defaultMassDate, defaultMassTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const allowedRecipientOptions = useMemo(
    () => getAllowedRecipientTypeOptions(form.intentionType),
    [form.intentionType],
  )

  // Keep recipient type + fields valid whenever Intention Type changes.
  useEffect(() => {
    if (!open) return
    setForm((prev) => {
      const synced = syncFormRecipientForIntentionType(prev, prev.intentionType)
      if (JSON.stringify(synced) === JSON.stringify(prev)) return prev
      return synced
    })
  }, [open, form.intentionType])

  const nameFieldProps = {
    form,
    errors,
    showError: (field) => Boolean(errors[field]) && (touched[field] || submitAttempted),
    handleChange: (field) => (event) => {
      const value = event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    },
    handleBlur: (field) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
    },
    saving,
  }

  function handleChange(field) {
    return (event) => {
      const value = event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function clearRecipientFieldErrors() {
    setErrors((prev) => ({
      ...prev,
      intentionType: '',
      recipientType: '',
      recipientFirstName: '',
      recipientMiddleName: '',
      recipientLastName: '',
      recipientSuffix: '',
      spouse1FirstName: '',
      spouse1MiddleName: '',
      spouse1LastName: '',
      spouse1Suffix: '',
      spouse2FirstName: '',
      spouse2MiddleName: '',
      spouse2LastName: '',
      spouse2Suffix: '',
      familyName: '',
      organizationName: '',
      offeredForDescription: '',
    }))
  }

  function handleIntentionTypeChange(event) {
    const nextIntentionType = event.target.value
    setForm((prev) =>
      syncFormRecipientForIntentionType(prev, nextIntentionType),
    )
    clearRecipientFieldErrors()
  }

  function handleRecipientTypeChange(event) {
    const nextType = event.target.value
    setForm((prev) => applyRecipientTypeFields(prev, nextType))
    clearRecipientFieldErrors()
  }

  function handleBlur(field) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function showError(field) {
    return Boolean(errors[field]) && (touched[field] || submitAttempted)
  }

  function handlePhoneChange(event) {
    const digitsOnly = String(event.target.value || '')
      .replace(/\D/g, '')
      .slice(0, 11)
    setForm((prev) => ({ ...prev, contactNumber: digitsOnly }))
    setErrors((prev) => ({ ...prev, contactNumber: '' }))
  }

  function handleResidencePlaceChange(nextPlace) {
    setForm((prev) => ({ ...prev, residencePlace: nextPlace }))
    setErrors((prev) => ({ ...prev, residencePlace: '' }))
  }

  function resetAndClose() {
    setForm(createEmptyForm())
    setErrors({})
    setTouched({})
    setSubmitAttempted(false)
    setFormError('')
    clearBaseline()
    onClose?.()
  }

  function handleCloseRequest() {
    if (saving) return
    requestClose(resetAndClose)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitAttempted(true)
    setFormError('')

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError(listValidationMessages(nextErrors, FIELD_LABELS).join(' '))
      return
    }

    const payload = {
      recordYear: form.recordYear,
      recordNumber: form.recordNumber,
      intentionNumber: form.intentionNumber,
      requestDate: form.requestDate,
      massDate: form.massDate,
      massTime: form.massTime,
      intentionType: form.intentionType,
      otherIntention: form.otherIntention,
      celebrantId: '',
      celebrantName: form.celebrantName.trim(),
      recipientType: form.recipientType || DEFAULT_MASS_INTENTION_RECIPIENT_TYPE,
      recipientFirstName: form.recipientFirstName.trim(),
      recipientMiddleName: form.recipientMiddleName.trim(),
      recipientLastName: form.recipientLastName.trim(),
      recipientSuffix: form.recipientSuffix.trim(),
      spouse1FirstName: form.spouse1FirstName.trim(),
      spouse1MiddleName: form.spouse1MiddleName.trim(),
      spouse1LastName: form.spouse1LastName.trim(),
      spouse1Suffix: form.spouse1Suffix.trim(),
      spouse2FirstName: form.spouse2FirstName.trim(),
      spouse2MiddleName: form.spouse2MiddleName.trim(),
      spouse2LastName: form.spouse2LastName.trim(),
      spouse2Suffix: form.spouse2Suffix.trim(),
      familyName: form.familyName.trim(),
      organizationName: form.organizationName.trim(),
      offeredForDescription: form.offeredForDescription.trim(),
      requesterFirstName: form.requesterFirstName.trim(),
      requesterMiddleName: form.requesterMiddleName.trim(),
      requesterLastName: form.requesterLastName.trim(),
      requesterSuffix: form.requesterSuffix.trim(),
      contactNumber: form.contactNumber.trim(),
      province: String(form.residencePlace?.provinceName || '').trim(),
      municipality: String(form.residencePlace?.cityName || '').trim(),
      barangay: String(form.residencePlace?.barangayName || '').trim(),
      remarks: form.remarks.trim(),
      status: form.status,
    }

    try {
      await onSave?.(payload, { mode, record })
      clearBaseline()
    } catch (error) {
      if (error?.fieldErrors) {
        setErrors(error.fieldErrors)
        setFormError(
          listValidationMessages(error.fieldErrors, FIELD_LABELS).join(' '),
        )
      } else {
        setFormError(
          error instanceof Error ? error.message : 'Unable to save Mass Intention.',
        )
      }
    }
  }

  return (
    <>
    <Dialog
      open={open}
      onClose={handleCloseRequest}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1.5,
          color: MARIAN_BLUE,
          fontWeight: 700,
        }}
      >
        {isEdit ? 'Edit Mass Intention' : 'Add Mass Intention'}
        <IconButton
          onClick={handleCloseRequest}
          disabled={saving}
          aria-label="Close"
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" id="mass-intention-form" onSubmit={handleSubmit}>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}

          <FormSection title="Mass Information" showDivider>
            {isEdit ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Intention Number"
                  value={form.intentionNumber}
                  fullWidth
                  disabled
                  slotProps={{ input: { readOnly: true } }}
                  helperText=" "
                />
              </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Request Date"
                type="date"
                value={form.requestDate}
                fullWidth
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
                helperText=" "
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mass Date"
                type="date"
                value={form.massDate}
                onChange={handleChange('massDate')}
                onBlur={handleBlur('massDate')}
                fullWidth
                required
                disabled={saving}
                error={showError('massDate')}
                helperText={showError('massDate') ? errors.massDate : ' '}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimeSelect
                label="Mass Time"
                value={form.massTime}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, massTime: value }))
                  setErrors((prev) => ({ ...prev, massTime: '' }))
                }}
                onBlur={handleBlur('massTime')}
                required
                disabled={saving}
                error={showError('massTime')}
                helperText={showError('massTime') ? errors.massTime : ' '}
                id="mass-intention-time"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl
                fullWidth
                required
                disabled={saving}
                error={showError('intentionType')}
              >
                <InputLabel id="mass-intention-type-label">
                  Intention Type
                </InputLabel>
                <Select
                  labelId="mass-intention-type-label"
                  label="Intention Type"
                  value={form.intentionType}
                  onChange={handleIntentionTypeChange}
                  onBlur={handleBlur('intentionType')}
                >
                  {MASS_INTENTION_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('intentionType') ? errors.intentionType : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
            {form.intentionType === MASS_INTENTION_OTHER_TYPE ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Other Intention"
                  value={form.otherIntention}
                  onChange={handleChange('otherIntention')}
                  onBlur={handleBlur('otherIntention')}
                  fullWidth
                  required
                  disabled={saving}
                  error={showError('otherIntention')}
                  helperText={
                    showError('otherIntention') ? errors.otherIntention : ' '
                  }
                />
              </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: 6 }}>
              <MinisterField
                label="Celebrant"
                assignment=""
                value={form.celebrantName}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, celebrantName: value }))
                  setErrors((prev) => ({ ...prev, celebrantName: '' }))
                }}
                onBlur={handleBlur('celebrantName')}
                error={showError('celebrantName')}
                helperText={
                  showError('celebrantName') ? errors.celebrantName : ' '
                }
                disabled={saving}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required disabled={saving}>
                <InputLabel id="mass-intention-status-label">Status</InputLabel>
                <Select
                  labelId="mass-intention-status-label"
                  label="Status"
                  value={form.status}
                  onChange={handleChange('status')}
                >
                  {MASS_INTENTION_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText> </FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Remarks"
                value={form.remarks}
                onChange={handleChange('remarks')}
                fullWidth
                multiline
                minRows={2}
                disabled={saving}
                helperText=" "
              />
            </Grid>
          </FormSection>

          <FormSection title="Offered For" showDivider>
            <Grid size={{ xs: 12 }}>
              <FormControl
                component="fieldset"
                error={showError('recipientType')}
                disabled={saving}
                required
                sx={{ width: '100%', mb: 0.5 }}
              >
                <FormLabel
                  component="legend"
                  sx={{
                    mb: 0.75,
                    fontWeight: 650,
                    color: 'text.primary',
                    '&.Mui-focused': { color: 'text.primary' },
                  }}
                >
                  Recipient Type
                </FormLabel>
                <RadioGroup
                  row
                  value={form.recipientType}
                  onChange={handleRecipientTypeChange}
                >
                  {allowedRecipientOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                      sx={{ mr: { xs: 1.5, sm: 2.5 } }}
                    />
                  ))}
                </RadioGroup>
                <FormHelperText>
                  {showError('recipientType')
                    ? errors.recipientType
                    : form.intentionType
                      ? ' '
                      : 'Select an Intention Type to see allowed recipient types.'}
                </FormHelperText>
              </FormControl>
            </Grid>

            {form.recipientType === MASS_INTENTION_RECIPIENT_TYPE.INDIVIDUAL ? (
              <>
                <NameField
                  label="First Name"
                  field="recipientFirstName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Middle Name"
                  field="recipientMiddleName"
                  {...nameFieldProps}
                />
                <NameField
                  label="Last Name"
                  field="recipientLastName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Suffix"
                  field="recipientSuffix"
                  {...nameFieldProps}
                />
              </>
            ) : null}

            {form.recipientType === MASS_INTENTION_RECIPIENT_TYPE.COUPLE ? (
              <>
                <FormFieldSubheading>Spouse 1</FormFieldSubheading>
                <NameField
                  label="First Name"
                  field="spouse1FirstName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Middle Name"
                  field="spouse1MiddleName"
                  {...nameFieldProps}
                />
                <NameField
                  label="Last Name"
                  field="spouse1LastName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Suffix"
                  field="spouse1Suffix"
                  {...nameFieldProps}
                />
                <FormFieldSubheading spaced>Spouse 2</FormFieldSubheading>
                <NameField
                  label="First Name"
                  field="spouse2FirstName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Middle Name"
                  field="spouse2MiddleName"
                  {...nameFieldProps}
                />
                <NameField
                  label="Last Name"
                  field="spouse2LastName"
                  required
                  {...nameFieldProps}
                />
                <NameField
                  label="Suffix"
                  field="spouse2Suffix"
                  {...nameFieldProps}
                />
              </>
            ) : null}

            {form.recipientType === MASS_INTENTION_RECIPIENT_TYPE.FAMILY ? (
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Family Name"
                  value={form.familyName}
                  onChange={handleChange('familyName')}
                  onBlur={() => {
                    const formatted = toProperCase(form.familyName)
                    if (formatted !== form.familyName) {
                      handleChange('familyName')({
                        target: { value: formatted },
                      })
                    }
                    handleBlur('familyName')()
                  }}
                  fullWidth
                  required
                  disabled={saving}
                  error={showError('familyName')}
                  helperText={
                    showError('familyName')
                      ? errors.familyName
                      : 'Example: Garcia Family'
                  }
                  placeholder="Garcia Family"
                />
              </Grid>
            ) : null}

            {form.recipientType ===
            MASS_INTENTION_RECIPIENT_TYPE.ORGANIZATION ? (
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Organization / Ministry Name"
                  value={form.organizationName}
                  onChange={handleChange('organizationName')}
                  onBlur={handleBlur('organizationName')}
                  fullWidth
                  required
                  disabled={saving}
                  error={showError('organizationName')}
                  helperText={
                    showError('organizationName')
                      ? errors.organizationName
                      : 'Example: Parish Choir, Legion of Mary'
                  }
                  placeholder="Parish Choir"
                />
              </Grid>
            ) : null}

            {form.recipientType === MASS_INTENTION_RECIPIENT_TYPE.OTHER ? (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Offered For"
                  value={form.offeredForDescription}
                  onChange={handleChange('offeredForDescription')}
                  onBlur={handleBlur('offeredForDescription')}
                  fullWidth
                  required
                  disabled={saving}
                  error={showError('offeredForDescription')}
                  helperText={
                    showError('offeredForDescription')
                      ? errors.offeredForDescription
                      : 'Example: Peace in the World, All Souls'
                  }
                  placeholder="Peace in the World"
                />
              </Grid>
            ) : null}
          </FormSection>

          <FormSection title="Requested By" showDivider>
            <NameField
              label="First Name"
              field="requesterFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="requesterMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="requesterLastName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Suffix"
              field="requesterSuffix"
              {...nameFieldProps}
            />
          </FormSection>

          <FormSection title="Contact Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Contact Number"
                value={form.contactNumber}
                onChange={handlePhoneChange}
                onBlur={handleBlur('contactNumber')}
                fullWidth
                disabled={saving}
                error={showError('contactNumber')}
                helperText={
                  showError('contactNumber')
                    ? errors.contactNumber
                    : 'Enter an 11-digit mobile number.'
                }
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    maxLength: 11,
                    pattern: '[0-9]*',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ResidencePlaceSelect
                value={form.residencePlace}
                onChange={handleResidencePlaceChange}
                onBlur={handleBlur('residencePlace')}
                required
                error={showError('residencePlace')}
                helperText={
                  showError('residencePlace') ? errors.residencePlace : ' '
                }
                disabled={saving}
                idPrefix="mass-intention-residence"
              />
            </Grid>
          </FormSection>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCloseRequest} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="mass-intention-form"
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Intention'}
        </Button>
      </DialogActions>
    </Dialog>

    <UnsavedChangesDialog
      open={confirmOpen}
      onKeepEditing={keepEditing}
      onDiscard={discardChanges}
    />
    </>
  )
}
