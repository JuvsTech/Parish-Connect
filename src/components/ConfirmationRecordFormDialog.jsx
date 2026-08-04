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
  Divider,
  Grid,
  IconButton,
  TextField,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CertificatePrepActions from './CertificateGenerationPrep'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { MESSAGES } from '../constants'
import { computeAgeFromDateOfBirth, parseDisplayDate } from '../utils/date'
import {
  getRecordNumberParts,
  isRecordNumberDuplicate,
} from '../utils/recordNumber'
import { listValidationMessages } from '../utils/formValidationSummary'
import {
  VALIDATION_MESSAGES,
  isPositiveInteger,
  isValidFourDigitYear,
  validateConfirmationDateForRecordType,
  validateOptionalName,
  validateRequiredName,
} from '../utils/validation'
import {
  resolveFemaleSponsorNameParts,
  resolveMaleSponsorNameParts,
} from '../utils/personName'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import UnsavedChangesDialog from './UnsavedChangesDialog'
import {
  emptySacramentRequirements,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import FormSection from './FormSection'
import FormFieldSubheading from './FormFieldSubheading'
import NameField from './NameField'
import MinisterField from './MinisterField'
import TimeSelect from './TimeSelect'
import RequirementsChecklist from './RequirementsChecklist'
import GenderSelect from './GenderSelect'
import { normalizeGender } from '../constants/gender'

const CONFIRMATION_FIELD_LABELS = {
  recordNumber: 'Record Number',
  recordYear: 'Record Year',
  confirmationDate: 'Date of Confirmation',
  confirmandFirstName: 'First Name',
  confirmandMiddleName: 'Middle Name',
  confirmandLastName: 'Last Name',
  confirmandSuffix: 'Suffix',
  gender: 'Gender',
  birthDate: 'Date of Birth',
  age: 'Age',
  placeOfBaptism: 'Place of Baptism',
  fatherFirstName: "Father's First Name",
  fatherMiddleName: "Father's Middle Name",
  fatherLastName: "Father's Last Name",
  fatherSuffix: "Father's Suffix",
  motherFirstName: "Mother's First Name",
  motherMiddleName: "Mother's Middle Name",
  motherLastName: "Mother's Last Name",
  motherSuffix: "Mother's Suffix",
  maleSponsorFirstName: "Male Sponsor's First Name",
  maleSponsorMiddleName: "Male Sponsor's Middle Name",
  maleSponsorLastName: "Male Sponsor's Last Name",
  maleSponsorSuffix: "Male Sponsor's Suffix",
  femaleSponsorFirstName: "Female Sponsor's First Name",
  femaleSponsorMiddleName: "Female Sponsor's Middle Name",
  femaleSponsorLastName: "Female Sponsor's Last Name",
  femaleSponsorSuffix: "Female Sponsor's Suffix",
  minister: 'Minister',
}

const INITIAL_FORM = {
  recordYear: '',
  recordNumber: '',
  confirmationDate: '',
  time: '',
  confirmandFirstName: '',
  confirmandMiddleName: '',
  confirmandLastName: '',
  confirmandSuffix: '',
  gender: '',
  birthDate: '',
  age: '',
  placeOfBaptism: '',
  fatherFirstName: '',
  fatherMiddleName: '',
  fatherLastName: '',
  fatherSuffix: '',
  motherFirstName: '',
  motherMiddleName: '',
  motherLastName: '',
  motherSuffix: '',
  maleSponsorFirstName: '',
  maleSponsorMiddleName: '',
  maleSponsorLastName: '',
  maleSponsorSuffix: '',
  femaleSponsorFirstName: '',
  femaleSponsorMiddleName: '',
  femaleSponsorLastName: '',
  femaleSponsorSuffix: '',
  minister: '',
  remarks: '',
  requirements: emptySacramentRequirements('confirmation'),
}

function blankToEmpty(value) {
  if (value == null || value === '-' || value === '—') return ''
  return String(value)
}

function recordToForm(record) {
  const parts = getRecordNumberParts(record)
  const birthDate = parseDisplayDate(record.birthDate || record.dateOfBirth)

  return {
    recordYear: parts?.recordYear != null ? String(parts.recordYear) : '',
    recordNumber: parts?.recordNumber != null ? String(parts.recordNumber) : '',
    confirmationDate: parseDisplayDate(record.confirmationDate),
    time: blankToEmpty(record.time),
    confirmandFirstName: blankToEmpty(record.confirmandFirstName),
    confirmandMiddleName: blankToEmpty(record.confirmandMiddleName),
    confirmandLastName: blankToEmpty(record.confirmandLastName),
    confirmandSuffix: blankToEmpty(record.confirmandSuffix),
    gender: normalizeGender(record.gender),
    birthDate,
    age:
      record.age != null && record.age !== ''
        ? String(record.age)
        : (() => {
            const computed = computeAgeFromDateOfBirth(birthDate)
            return computed == null ? '' : String(computed)
          })(),
    placeOfBaptism: blankToEmpty(
      record.placeOfBaptism || record.placeOfBirth,
    ),
    fatherFirstName: blankToEmpty(record.fatherFirstName),
    fatherMiddleName: blankToEmpty(record.fatherMiddleName),
    fatherLastName: blankToEmpty(record.fatherLastName),
    fatherSuffix: blankToEmpty(record.fatherSuffix),
    motherFirstName: blankToEmpty(record.motherFirstName),
    motherMiddleName: blankToEmpty(record.motherMiddleName),
    motherLastName: blankToEmpty(record.motherLastName),
    motherSuffix: blankToEmpty(record.motherSuffix),
    ...(() => {
      const male = resolveMaleSponsorNameParts(record)
      const female = resolveFemaleSponsorNameParts(record)
      return {
        maleSponsorFirstName: male.firstName,
        maleSponsorMiddleName: male.middleName,
        maleSponsorLastName: male.lastName,
        maleSponsorSuffix: male.suffix,
        femaleSponsorFirstName: female.firstName,
        femaleSponsorMiddleName: female.middleName,
        femaleSponsorLastName: female.lastName,
        femaleSponsorSuffix: female.suffix,
      }
    })(),
    minister: blankToEmpty(record.minister),
    remarks: blankToEmpty(record.remarks),
    requirements: normalizeSacramentRequirements(
      'confirmation',
      record.requirements,
    ),
  }
}

function resolveFormRecordParts(form) {
  if (
    !isValidFourDigitYear(form.recordYear) ||
    !isPositiveInteger(form.recordNumber)
  ) {
    return null
  }

  return {
    recordYear: Number(form.recordYear),
    recordNumber: Number(form.recordNumber),
  }
}

function applyNameError(errors, field, value, required) {
  const error = required
    ? validateRequiredName(value)
    : validateOptionalName(value)
  if (error) errors[field] = error
}

function validateConfirmationForm(
  form,
  existingRecords,
  excludeId,
  { requireManualRecordNumber = false, recordTypeRule = null } = {},
) {
  const errors = {}

  if (requireManualRecordNumber) {
    if (!String(form.recordYear ?? '').trim()) {
      errors.recordYear = VALIDATION_MESSAGES.REQUIRED
    } else if (!isValidFourDigitYear(form.recordYear)) {
      errors.recordYear = VALIDATION_MESSAGES.INVALID_RECORD_YEAR
    }

    if (!String(form.recordNumber ?? '').trim()) {
      errors.recordNumber = VALIDATION_MESSAGES.REQUIRED
    } else if (!isPositiveInteger(form.recordNumber)) {
      errors.recordNumber = VALIDATION_MESSAGES.INVALID_RECORD_NUMBER
    }

    const parts = resolveFormRecordParts(form)
    if (parts) {
      const duplicate = isRecordNumberDuplicate(
        existingRecords,
        parts.recordYear,
        parts.recordNumber,
        excludeId,
      )
      if (duplicate) {
        errors.recordNumber = MESSAGES.ERROR.CONFIRMATION_DUPLICATE_RECORD
      }
    }
  }

  if (!form.confirmationDate) {
    errors.confirmationDate = VALIDATION_MESSAGES.REQUIRED
  } else {
    const dateError = validateConfirmationDateForRecordType(
      form.confirmationDate,
      recordTypeRule,
    )
    if (dateError) errors.confirmationDate = dateError
  }

  applyNameError(errors, 'confirmandFirstName', form.confirmandFirstName, true)
  applyNameError(errors, 'confirmandMiddleName', form.confirmandMiddleName, false)
  applyNameError(errors, 'confirmandLastName', form.confirmandLastName, true)
  applyNameError(errors, 'confirmandSuffix', form.confirmandSuffix, false)

  if (!form.gender) {
    errors.gender = VALIDATION_MESSAGES.REQUIRED
  }

  if (!form.birthDate) {
    errors.birthDate = VALIDATION_MESSAGES.REQUIRED
  } else if (
    form.confirmationDate &&
    form.birthDate > form.confirmationDate
  ) {
    errors.birthDate = 'Birth Date cannot be later than Confirmation Date.'
  } else if (
    !isPositiveInteger(form.age) ||
    Number(form.age) < 13
  ) {
    errors.birthDate =
      'The candidate must be at least 13 years old to receive the Sacrament of Confirmation.'
  }

  if (!String(form.placeOfBaptism ?? '').trim()) {
    errors.placeOfBaptism = VALIDATION_MESSAGES.REQUIRED
  }

  applyNameError(errors, 'fatherFirstName', form.fatherFirstName, true)
  applyNameError(errors, 'fatherMiddleName', form.fatherMiddleName, false)
  applyNameError(errors, 'fatherLastName', form.fatherLastName, true)
  applyNameError(errors, 'fatherSuffix', form.fatherSuffix, false)

  applyNameError(errors, 'motherFirstName', form.motherFirstName, true)
  applyNameError(errors, 'motherMiddleName', form.motherMiddleName, false)
  applyNameError(errors, 'motherLastName', form.motherLastName, true)
  applyNameError(errors, 'motherSuffix', form.motherSuffix, false)

  applyNameError(errors, 'maleSponsorFirstName', form.maleSponsorFirstName, true)
  applyNameError(
    errors,
    'maleSponsorMiddleName',
    form.maleSponsorMiddleName,
    false,
  )
  applyNameError(errors, 'maleSponsorLastName', form.maleSponsorLastName, true)
  applyNameError(errors, 'maleSponsorSuffix', form.maleSponsorSuffix, false)

  applyNameError(
    errors,
    'femaleSponsorFirstName',
    form.femaleSponsorFirstName,
    true,
  )
  applyNameError(
    errors,
    'femaleSponsorMiddleName',
    form.femaleSponsorMiddleName,
    false,
  )
  applyNameError(
    errors,
    'femaleSponsorLastName',
    form.femaleSponsorLastName,
    true,
  )
  applyNameError(errors, 'femaleSponsorSuffix', form.femaleSponsorSuffix, false)

  applyNameError(errors, 'minister', form.minister, true)

  return errors
}

/**
 * Confirmation record form — locked to one workflow.
 *
 * @param {'add' | 'edit'} mode
 * @param {'old' | 'new'} workflow — required; never mixed by callers
 */
function ConfirmationRecordFormDialog({
  open,
  mode = 'add',
  workflow,
  record = null,
  existingRecords = [],
  defaultSacramentDate = '',
  defaultSacramentTime = '',
  onClose,
  onSave,
  saving = false,
}) {
  if (workflow !== 'old' && workflow !== 'new') {
    throw new Error(
      'ConfirmationRecordFormDialog requires workflow="old" or workflow="new".',
    )
  }

  const isEdit = mode === 'edit'
  const isOldRecord = !isEdit && workflow === 'old'
  const recordTypeRule = isEdit ? null : workflow
  const [form, setForm] = useState(INITIAL_FORM)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
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

    let initialForm
    if (isEdit && record) {
      initialForm = recordToForm(record)
    } else {
      // New records: number/year are assigned on save. Old records: enter manually.
      initialForm = {
        ...INITIAL_FORM,
        recordYear: '',
        recordNumber: '',
        confirmationDate: defaultSacramentDate || '',
        time: defaultSacramentTime || '',
      }
    }

    setForm(initialForm)
    captureBaseline(initialForm)
    setTouched({})
    setSubmitAttempted(false)
  }, [open, mode, record, workflow, defaultSacramentDate, defaultSacramentTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const excludeId = isEdit && record ? record.id : undefined

  const errors = useMemo(
    () =>
      validateConfirmationForm(form, existingRecords, excludeId, {
        // New Record: number/year are auto-generated — never validate here.
        // Old Record: require manual entry. Edit: keep existing values valid.
        requireManualRecordNumber: isOldRecord || isEdit,
        recordTypeRule,
      }),
    [form, existingRecords, excludeId, isOldRecord, isEdit, recordTypeRule],
  )
  const canSave = Object.keys(errors).length === 0
  const validationMessages = useMemo(
    () => listValidationMessages(errors, CONFIRMATION_FIELD_LABELS),
    [errors],
  )

  function showError(field) {
    return Boolean((touched[field] || submitAttempted) && errors[field])
  }

  function handleChange(field) {
    return (event) => {
      const value = event.target.value
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (field === 'birthDate') {
          const computed = computeAgeFromDateOfBirth(value)
          next.age = computed == null ? '' : String(computed)
        }
        return next
      })
      if (field === 'confirmationDate' || field === 'birthDate') {
        setTouched((prev) => ({
          ...prev,
          [field]: true,
          ...(field === 'birthDate' ? { age: true } : {}),
        }))
      }
    }
  }

  function handleBlur(field) {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
    }
  }

  function handleRecordNumberChange(event) {
    const value = event.target.value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, recordNumber: value }))
  }

  function handleRecordYearChange(event) {
    const value = event.target.value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, recordYear: value }))
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    setTouched({})
    setSubmitAttempted(false)
    clearBaseline()
    onClose?.()
  }

  function handleCloseRequest() {
    if (saving) return
    requestClose(resetAndClose)
  }

  async function handleSave() {
    setSubmitAttempted(true)
    if (!canSave || saving) return

    const payload = {
      // Workflow is locked: Calendar → new, sacramental module → old.
      recordType: isEdit ? record?.recordType || 'old' : workflow,
      confirmationDate: form.confirmationDate,
      time: form.time.trim(),
      confirmandFirstName: form.confirmandFirstName.trim(),
      confirmandMiddleName: form.confirmandMiddleName.trim(),
      confirmandLastName: form.confirmandLastName.trim(),
      confirmandSuffix: form.confirmandSuffix.trim(),
      gender: normalizeGender(form.gender),
      birthDate: form.birthDate,
      age: Number(form.age),
      placeOfBaptism: form.placeOfBaptism.trim(),
      fatherFirstName: form.fatherFirstName.trim(),
      fatherMiddleName: form.fatherMiddleName.trim(),
      fatherLastName: form.fatherLastName.trim(),
      fatherSuffix: form.fatherSuffix.trim(),
      motherFirstName: form.motherFirstName.trim(),
      motherMiddleName: form.motherMiddleName.trim(),
      motherLastName: form.motherLastName.trim(),
      motherSuffix: form.motherSuffix.trim(),
      maleSponsorFirstName: form.maleSponsorFirstName.trim(),
      maleSponsorMiddleName: form.maleSponsorMiddleName.trim(),
      maleSponsorLastName: form.maleSponsorLastName.trim(),
      maleSponsorSuffix: form.maleSponsorSuffix.trim(),
      femaleSponsorFirstName: form.femaleSponsorFirstName.trim(),
      femaleSponsorMiddleName: form.femaleSponsorMiddleName.trim(),
      femaleSponsorLastName: form.femaleSponsorLastName.trim(),
      femaleSponsorSuffix: form.femaleSponsorSuffix.trim(),
      minister: form.minister.trim(),
      remarks: form.remarks.trim(),
      requirements: normalizeSacramentRequirements(
        'confirmation',
        form.requirements,
      ),
    }

    if (isEdit || isOldRecord) {
      const parts = resolveFormRecordParts(form)
      if (!parts) return
      payload.recordYear = parts.recordYear
      payload.recordNumber = parts.recordNumber
    }

    try {
      await onSave?.(payload, { mode, record })
      clearBaseline()
    } catch {
      // Parent surfaces the error (e.g. Snackbar). Keep the dialog open.
    }
  }

  const nameFieldProps = {
    form,
    errors,
    showError,
    handleChange,
    handleBlur,
    saving,
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseRequest}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        slotProps={{ paper: {
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 16px 40px rgba(11, 61, 145, 0.12)',
            m: { xs: 1.5, sm: 2 },
            maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
          },
        } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1.5,
            color: MARIAN_BLUE,
            fontWeight: 700,
          }}
        >
          {isEdit ? 'Edit Confirmation Record' : 'Add Confirmation Record'}
          <IconButton
            aria-label="Close"
            onClick={handleCloseRequest}
            size="small"
            disabled={saving}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: MARIAN_BLUE,
                bgcolor: 'rgba(11, 61, 145, 0.06)',
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
          {submitAttempted && !canSave && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              Please complete the required fields before saving:
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25 }}>
                {validationMessages.map((message, index) => (
                  <li key={`${index}-${message}`}>{message}</li>
                ))}
              </Box>
            </Alert>
          )}

          {(isOldRecord || isEdit) && (
            <FormSection title="Record Information">
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Record Number"
                  value={form.recordNumber}
                  onChange={isOldRecord ? handleRecordNumberChange : undefined}
                  onBlur={isOldRecord ? handleBlur('recordNumber') : undefined}
                  error={isOldRecord && showError('recordNumber')}
                  helperText={
                    isOldRecord && showError('recordNumber')
                      ? errors.recordNumber
                      : isOldRecord
                        ? 'Enter the number from the parish registry book.'
                        : ' '
                  }
                  fullWidth
                  required={isOldRecord}
                  disabled={saving || isEdit}
                  inputMode="numeric"
                  sx={
                    isEdit
                      ? {
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(11, 61, 145, 0.04)',
                          },
                        }
                      : undefined
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Record Year"
                  value={form.recordYear}
                  onChange={isOldRecord ? handleRecordYearChange : undefined}
                  onBlur={isOldRecord ? handleBlur('recordYear') : undefined}
                  error={isOldRecord && showError('recordYear')}
                  helperText={
                    isOldRecord && showError('recordYear')
                      ? errors.recordYear
                      : isOldRecord
                        ? 'Enter the year from the parish registry book.'
                        : ' '
                  }
                  fullWidth
                  required={isOldRecord}
                  disabled={saving || isEdit}
                  inputMode="numeric"
                  sx={
                    isEdit
                      ? {
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(11, 61, 145, 0.04)',
                          },
                        }
                      : undefined
                  }
                />
              </Grid>
            </FormSection>
          )}

          <FormSection
            title="Church Information"
            showDivider={isOldRecord || isEdit}
          >
            <Grid size={{ xs: 12, sm: 6 }}>
              <MinisterField
                key={`confirmation-minister-${open}-${mode}-${record?.id || 'new'}`}
                label="Minister"
                assignment="Confirmation"
                value={form.minister}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, minister: value }))
                }
                onBlur={handleBlur('minister')}
                error={showError('minister')}
                helperText={showError('minister') ? errors.minister : ' '}
                required
                disabled={saving}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of Confirmation"
                type="date"
                value={form.confirmationDate}
                onChange={handleChange('confirmationDate')}
                onBlur={handleBlur('confirmationDate')}
                error={showError('confirmationDate')}
                helperText={
                  showError('confirmationDate')
                    ? errors.confirmationDate
                    : ' '
                }
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimeSelect
                id="confirmation-time"
                value={form.time}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, time: value }))
                }
                onBlur={handleBlur('time')}
                helperText=" "
                disabled={saving}
              />
            </Grid>
          </FormSection>

          <FormSection title="Person Information" showDivider>
            <NameField
              label="First Name"
              field="confirmandFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="confirmandMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="confirmandLastName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Suffix"
              field="confirmandSuffix"
              {...nameFieldProps}
            />
            <GenderSelect
              label="Gender"
              value={form.gender}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, gender: value }))
                setTouched((prev) => ({ ...prev, gender: true }))
              }}
              onBlur={handleBlur('gender')}
              error={showError('gender')}
              helperText={showError('gender') ? errors.gender : ' '}
              required
              disabled={saving}
              idPrefix="confirmand-gender"
            />
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Date of Birth"
                type="date"
                value={form.birthDate}
                onChange={handleChange('birthDate')}
                onBlur={handleBlur('birthDate')}
                error={showError('birthDate')}
                helperText={showError('birthDate') ? errors.birthDate : ' '}
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Age"
                value={form.age}
                error={showError('age')}
                helperText={
                  showError('age')
                    ? errors.age
                    : 'Auto-calculated from Date of Birth'
                }
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Place of Baptism"
                value={form.placeOfBaptism}
                onChange={handleChange('placeOfBaptism')}
                onBlur={handleBlur('placeOfBaptism')}
                error={showError('placeOfBaptism')}
                helperText={
                  showError('placeOfBaptism')
                    ? errors.placeOfBaptism
                    : ' '
                }
                fullWidth
                required
                disabled={saving}
                placeholder="e.g. Our Lady of the Assumption Parish, Bani, Pangasinan"
              />
            </Grid>
          </FormSection>

          <FormSection title="Parents Information" showDivider>
            <FormFieldSubheading>Father&apos;s Name</FormFieldSubheading>
            <NameField
              label="First Name"
              field="fatherFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="fatherMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="fatherLastName"
              required
              {...nameFieldProps}
            />
            <NameField label="Suffix" field="fatherSuffix" {...nameFieldProps} />

            <FormFieldSubheading spaced>
              Mother&apos;s Maiden Name
            </FormFieldSubheading>
            <NameField
              label="First Name"
              field="motherFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="motherMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="motherLastName"
              required
              {...nameFieldProps}
            />
            <NameField label="Suffix" field="motherSuffix" {...nameFieldProps} />
          </FormSection>

          <FormSection title="Sponsors Information" showDivider>
            <FormFieldSubheading>Male Sponsor</FormFieldSubheading>
            <NameField
              label="First Name"
              field="maleSponsorFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="maleSponsorMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="maleSponsorLastName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Suffix"
              field="maleSponsorSuffix"
              {...nameFieldProps}
            />

            <FormFieldSubheading spaced>Female Sponsor</FormFieldSubheading>
            <NameField
              label="First Name"
              field="femaleSponsorFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="femaleSponsorMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="femaleSponsorLastName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Suffix"
              field="femaleSponsorSuffix"
              {...nameFieldProps}
            />
          </FormSection>

          <FormSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="confirmation"
              value={form.requirements}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, requirements: next }))
              }
              disabled={saving}
            />
          </FormSection>

          <FormSection title="Remarks" showDivider>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Remarks"
                value={form.remarks}
                onChange={handleChange('remarks')}
                fullWidth
                multiline
                minRows={3}
                disabled={saving}
                helperText=" "
              />
            </Grid>
          </FormSection>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseRequest}
            variant="outlined"
            disabled={saving}
            sx={{
              borderRadius: 3,
              minWidth: 110,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: MARIAN_BLUE,
                bgcolor: 'rgba(11, 61, 145, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          {isEdit ? (
            <CertificatePrepActions
              sacrament="confirmation"
              recordId={record?.id}
              disabled={saving}
            />
          ) : null}
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ borderRadius: 3, minWidth: 110 }}
          >
            {saving ? 'Saving...' : 'Save'}
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

/**
 * Sacramental module form — Old Record only (manual Record Number / Year).
 */
export function ConfirmationOldRecordFormDialog(props) {
  return <ConfirmationRecordFormDialog {...props} workflow="old" />
}

/**
 * Calendar form — New Record only (auto Record Number / Year on save).
 */
export function ConfirmationNewRecordFormDialog(props) {
  return <ConfirmationRecordFormDialog {...props} workflow="new" mode="add" />
}

export default ConfirmationOldRecordFormDialog
