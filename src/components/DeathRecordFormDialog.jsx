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
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CertificatePrepActions from './CertificateGenerationPrep'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { listValidationMessages } from '../utils/formValidationSummary'
import {
  computeAgeFromDateOfBirth,
  parseDisplayDate,
  toLocalDate,
} from '../utils/date'
import {
  getRecordNumberParts,
  isRecordNumberDuplicate,
} from '../utils/recordNumber'
import {
  VALIDATION_MESSAGES,
  isPositiveInteger,
  isValidFourDigitYear,
  validateOptionalName,
  validateRequiredName,
  validateSacramentDateForRecordType,
} from '../utils/validation'
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
import ResidencePlaceSelect from './ResidencePlaceSelect'
import TimeSelect from './TimeSelect'
import RequirementsChecklist from './RequirementsChecklist'
import GenderSelect from './GenderSelect'
import { normalizeGender } from '../constants/gender'
import {
  EMPTY_PLACE,
  isResidencePlaceComplete,
  resolveResidencePlace,
} from '../utils/philippinePlaces'

const STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Infant',
  'Religious (Priest / Sister / Brother)',
  'Unknown',
]

const RECEIVED_LAST_SACRAMENTS_OPTIONS = [
  'Received',
  'Not Received',
  'Unknown',
]

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Parents',
  'Husband',
  'Wife',
  'Spouse',
  'Guardian',
  'Other',
]

const FIELD_LABELS = {
  recordNumber: 'Record Number',
  recordYear: 'Record Year',
  minister: 'Minister',
  dateOfDeath: 'Date of Death',
  burialDate: 'Date of Burial',
  placeOfBurial: 'Place of Burial',
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  suffix: 'Suffix',
  gender: 'Gender',
  birthDate: 'Date of Birth',
  age: 'Age',
  status: 'Status',
  relationship: 'Relationship',
  relatedPersonFirstName: 'Related Person First Name',
  relatedPersonMiddleName: 'Related Person Middle Name',
  relatedPersonLastName: 'Related Person Last Name',
  relatedPersonSuffix: 'Related Person Suffix',
  residencePlace: 'Residence',
  receivedLastSacraments: 'Received Last Sacraments',
  sickness: 'Sickness',
}

const INITIAL_FORM = {
  recordYear: '',
  recordNumber: '',
  minister: '',
  dateOfDeath: '',
  time: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  gender: '',
  birthDate: '',
  age: '',
  status: '',
  relationship: '',
  relatedPersonFirstName: '',
  relatedPersonMiddleName: '',
  relatedPersonLastName: '',
  relatedPersonSuffix: '',
  residencePlace: { ...EMPTY_PLACE },
  burialDate: '',
  placeOfBurial: '',
  receivedLastSacraments: '',
  sickness: '',
  remarks: '',
  requirements: emptySacramentRequirements('death'),
}

function blankToEmpty(value) {
  if (value == null || value === '-' || value === '—') return ''
  return String(value)
}

function resolveFormRecordParts(form) {
  const year = Number(form.recordYear)
  const number = Number(form.recordNumber)
  if (!Number.isInteger(year) || !Number.isInteger(number)) return null
  return { recordYear: year, recordNumber: number }
}

function computeAgeAtDeath(birthDate, dateOfDeath) {
  if (!birthDate) return null
  const asOf = dateOfDeath ? toLocalDate(dateOfDeath) : new Date()
  if (!asOf) return null
  return computeAgeFromDateOfBirth(birthDate, asOf)
}

function recordToForm(record) {
  if (!record) return { ...INITIAL_FORM }

  const parts = getRecordNumberParts(record)
  const birthDate = parseDisplayDate(record.birthDate || record.dateOfBirth)
  const dateOfDeath = parseDisplayDate(
    record.dateOfDeathInput || record.dateOfDeath,
  )

  return {
    recordYear:
      parts?.recordYear != null
        ? String(parts.recordYear)
        : blankToEmpty(record.recordYear),
    recordNumber:
      parts?.recordNumber != null
        ? String(parts.recordNumber)
        : blankToEmpty(record.recordNumber),
    minister: blankToEmpty(record.minister || record.officiatingMinister),
    dateOfDeath,
    time: blankToEmpty(record.time),
    firstName: blankToEmpty(record.firstName || record.deceasedFirstName),
    middleName: blankToEmpty(record.middleName || record.deceasedMiddleName),
    lastName: blankToEmpty(record.lastName || record.deceasedLastName),
    suffix: blankToEmpty(record.suffix || record.deceasedSuffix),
    gender: normalizeGender(record.gender),
    birthDate,
    age:
      record.age != null && record.age !== ''
        ? String(record.age)
        : (() => {
            const computed = computeAgeAtDeath(birthDate, dateOfDeath)
            return computed == null ? '' : String(computed)
          })(),
    status: blankToEmpty(record.status || record.civilStatus),
    relationship: blankToEmpty(record.relationship),
    relatedPersonFirstName: blankToEmpty(record.relatedPersonFirstName),
    relatedPersonMiddleName: blankToEmpty(record.relatedPersonMiddleName),
    relatedPersonLastName: blankToEmpty(record.relatedPersonLastName),
    relatedPersonSuffix: blankToEmpty(record.relatedPersonSuffix),
    residencePlace: resolveResidencePlace({
      province: record.province,
      municipality: record.municipality,
      barangay: record.barangay,
      residencePlace: record.residencePlace,
    }),
    burialDate: parseDisplayDate(
      record.burialDateInput || record.burialDate,
    ),
    placeOfBurial: blankToEmpty(record.placeOfBurial),
    receivedLastSacraments: blankToEmpty(record.receivedLastSacraments),
    sickness: blankToEmpty(record.sickness),
    remarks: blankToEmpty(record.remarks),
    requirements: normalizeSacramentRequirements(
      'death',
      record.requirements,
    ),
  }
}

function applyNameError(errors, field, value, required) {
  const error = required
    ? validateRequiredName(value)
    : validateOptionalName(value)
  if (error) errors[field] = error
}

function validateDeathForm(
  form,
  {
    requireManualRecordNumber = false,
    existingRecords = [],
    excludeId,
    recordTypeRule = null,
  } = {},
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

    if (
      isValidFourDigitYear(form.recordYear) &&
      isPositiveInteger(form.recordNumber) &&
      isRecordNumberDuplicate(
        existingRecords,
        Number(form.recordYear),
        Number(form.recordNumber),
        excludeId,
      )
    ) {
      errors.recordNumber =
        'A death record with this year and number already exists.'
    }
  }

  applyNameError(errors, 'minister', form.minister, true)

  if (!form.dateOfDeath) {
    errors.dateOfDeath = VALIDATION_MESSAGES.REQUIRED
  } else if (recordTypeRule === 'old') {
    // Historical registry entries must use a past date of death.
    const dateError = validateSacramentDateForRecordType(
      form.dateOfDeath,
      'old',
    )
    if (dateError) errors.dateOfDeath = dateError
  }

  applyNameError(errors, 'firstName', form.firstName, true)
  applyNameError(errors, 'middleName', form.middleName, false)
  applyNameError(errors, 'lastName', form.lastName, true)
  applyNameError(errors, 'suffix', form.suffix, false)

  if (!String(form.gender ?? '').trim()) {
    errors.gender = VALIDATION_MESSAGES.REQUIRED
  }

  if (!form.birthDate) {
    errors.birthDate = VALIDATION_MESSAGES.REQUIRED
  } else if (form.dateOfDeath && form.birthDate > form.dateOfDeath) {
    errors.birthDate = 'Date of Birth cannot be later than Date of Death.'
  }

  if (!String(form.age ?? '').trim()) {
    errors.age = VALIDATION_MESSAGES.REQUIRED
  } else if (!/^\d+$/.test(String(form.age).trim())) {
    errors.age = VALIDATION_MESSAGES.INVALID_AGE
  }

  if (!String(form.status ?? '').trim()) {
    errors.status = VALIDATION_MESSAGES.REQUIRED
  }

  if (!String(form.relationship ?? '').trim()) {
    errors.relationship = VALIDATION_MESSAGES.REQUIRED
  }

  applyNameError(
    errors,
    'relatedPersonFirstName',
    form.relatedPersonFirstName,
    true,
  )
  applyNameError(
    errors,
    'relatedPersonMiddleName',
    form.relatedPersonMiddleName,
    false,
  )
  applyNameError(
    errors,
    'relatedPersonLastName',
    form.relatedPersonLastName,
    true,
  )
  applyNameError(
    errors,
    'relatedPersonSuffix',
    form.relatedPersonSuffix,
    false,
  )

  if (!isResidencePlaceComplete(form.residencePlace)) {
    errors.residencePlace =
      'Select Province, Municipality / City, and Barangay.'
  }

  if (!form.burialDate) {
    errors.burialDate = VALIDATION_MESSAGES.REQUIRED
  } else {
    if (form.dateOfDeath && form.burialDate < form.dateOfDeath) {
      errors.burialDate = VALIDATION_MESSAGES.BURIAL_BEFORE_DEATH
    } else if (recordTypeRule === 'new') {
      // Calendar / new records schedule burial for today or a future date.
      const burialError = validateSacramentDateForRecordType(
        form.burialDate,
        'new',
      )
      if (burialError) errors.burialDate = burialError
    }
  }

  if (!String(form.placeOfBurial ?? '').trim()) {
    errors.placeOfBurial = VALIDATION_MESSAGES.REQUIRED
  }

  if (!String(form.receivedLastSacraments ?? '').trim()) {
    errors.receivedLastSacraments = VALIDATION_MESSAGES.REQUIRED
  }

  return errors
}

/**
 * Add / Edit Death Record dialog — locked to one workflow.
 *
 * @param {'old' | 'new'} workflow — required; never mixed by callers
 */
function DeathRecordFormDialog({
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
      'DeathRecordFormDialog requires workflow="old" or workflow="new".',
    )
  }

  const isEdit = mode === 'edit'
  const isOldRecord = !isEdit && workflow === 'old'
  const recordTypeRule = isEdit ? null : workflow
  const [form, setForm] = useState(INITIAL_FORM)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const {
    captureBaseline,
    clearBaseline,
    requestClose,
    confirmOpen,
    keepEditing,
    discardChanges,
  } = useUnsavedChanges(form, { enabled: open && !saving })

  useEffect(() => {
    if (!open) return

    let initialForm
    if (isEdit && record) {
      initialForm = recordToForm(record)
    } else if (workflow === 'new') {
      // Calendar date prefills Date of Burial only (same pattern as Baptism).
      initialForm = {
        ...INITIAL_FORM,
        residencePlace: { ...EMPTY_PLACE },
        burialDate: defaultSacramentDate || '',
        time: defaultSacramentTime || '',
      }
    } else {
      initialForm = {
        ...INITIAL_FORM,
        residencePlace: { ...EMPTY_PLACE },
      }
    }

    setForm(initialForm)
    captureBaseline(initialForm)
    setTouched({})
    setSubmitAttempted(false)
  }, [open, isEdit, record, workflow, defaultSacramentDate, defaultSacramentTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const excludeId = isEdit && record ? record.id : undefined
  const errors = useMemo(
    () =>
      validateDeathForm(form, {
        requireManualRecordNumber: isOldRecord || isEdit,
        existingRecords,
        excludeId,
        recordTypeRule,
      }),
    [form, isOldRecord, isEdit, existingRecords, excludeId, recordTypeRule],
  )
  const canSave = Object.keys(errors).length === 0
  const validationMessages = useMemo(
    () => listValidationMessages(errors, FIELD_LABELS),
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
        if (field === 'birthDate' || field === 'dateOfDeath') {
          const computed = computeAgeAtDeath(
            field === 'birthDate' ? value : next.birthDate,
            field === 'dateOfDeath' ? value : next.dateOfDeath,
          )
          next.age = computed == null ? '' : String(computed)
        }
        return next
      })
      if (
        field === 'dateOfDeath' ||
        field === 'burialDate' ||
        field === 'birthDate'
      ) {
        setTouched((prev) => ({
          ...prev,
          [field]: true,
          ...(field === 'birthDate' || field === 'dateOfDeath'
            ? { age: true }
            : {}),
        }))
      }
    }
  }

  function handleResidencePlaceChange(nextPlace) {
    setForm((prev) => ({
      ...prev,
      residencePlace: nextPlace,
    }))
    setTouched((prev) => ({ ...prev, residencePlace: true }))
  }

  function handleBlur(field) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }))
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
      recordType: isEdit
        ? record?.recordTypeValue || record?.recordType || 'old'
        : workflow,
      minister: form.minister.trim(),
      dateOfDeath: form.dateOfDeath,
      time: form.time.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      suffix: form.suffix.trim(),
      gender: normalizeGender(form.gender),
      birthDate: form.birthDate,
      age: Number(form.age),
      status: form.status,
      relationship: form.relationship,
      relatedPersonFirstName: form.relatedPersonFirstName.trim(),
      relatedPersonMiddleName: form.relatedPersonMiddleName.trim(),
      relatedPersonLastName: form.relatedPersonLastName.trim(),
      relatedPersonSuffix: form.relatedPersonSuffix.trim(),
      province: String(form.residencePlace?.provinceName || '').trim(),
      municipality: String(form.residencePlace?.cityName || '').trim(),
      barangay: String(form.residencePlace?.barangayName || '').trim(),
      burialDate: form.burialDate,
      placeOfBurial: form.placeOfBurial.trim(),
      receivedLastSacraments: form.receivedLastSacraments.trim(),
      sickness: form.sickness.trim(),
      remarks: form.remarks.trim(),
      requirements: normalizeSacramentRequirements(
        'death',
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
          {isEdit ? 'Edit Death Record' : 'Add Death Record'}
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
                key={`death-minister-${open}-${mode}-${record?.id || 'new'}`}
                label="Minister"
                assignment="Burial"
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
              <TimeSelect
                id="death-time"
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

          <FormSection title="Deceased Information" showDivider>
            <NameField
              label="First Name"
              field="firstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="middleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="lastName"
              required
              {...nameFieldProps}
            />
            <NameField label="Suffix" field="suffix" {...nameFieldProps} />
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of Death"
                type="date"
                value={form.dateOfDeath}
                onChange={handleChange('dateOfDeath')}
                onBlur={handleBlur('dateOfDeath')}
                error={showError('dateOfDeath')}
                helperText={showError('dateOfDeath') ? errors.dateOfDeath : ' '}
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
              size={{ xs: 12, sm: 6, md: 4 }}
              idPrefix="deceased-gender"
            />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl
                fullWidth
                required
                error={showError('status')}
                disabled={saving}
              >
                <InputLabel id="deceased-status-label">Status</InputLabel>
                <Select
                  labelId="deceased-status-label"
                  label="Status"
                  value={form.status}
                  onChange={handleChange('status')}
                  onBlur={handleBlur('status')}
                >
                  {form.status &&
                    !STATUS_OPTIONS.includes(form.status) && (
                      <MenuItem value={form.status}>
                        {form.status} (saved)
                      </MenuItem>
                    )}
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('status') ? errors.status : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
          </FormSection>

          <FormSection title="Family Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl
                fullWidth
                required
                error={showError('relationship')}
                disabled={saving}
              >
                <InputLabel
                  id="relationship-label"
                  shrink
                  htmlFor="relationship-select"
                >
                  Relationship
                </InputLabel>
                <Select
                  labelId="relationship-label"
                  id="relationship-select"
                  label="Relationship"
                  value={form.relationship}
                  onChange={handleChange('relationship')}
                  onBlur={handleBlur('relationship')}
                  displayEmpty
                  input={<OutlinedInput notched label="Relationship" />}
                  renderValue={(current) => {
                    if (!current) {
                      return (
                        <Typography component="span" color="text.secondary">
                          Select Relationship
                        </Typography>
                      )
                    }
                    return current
                  }}
                >
                  <MenuItem value="" disabled sx={{ display: 'none' }} />
                  {form.relationship &&
                    !RELATIONSHIP_OPTIONS.includes(form.relationship) && (
                      <MenuItem value={form.relationship}>
                        {form.relationship} (saved)
                      </MenuItem>
                    )}
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('relationship') ? errors.relationship : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
            <FormFieldSubheading spaced>Related Person</FormFieldSubheading>
            <NameField
              label="First Name"
              field="relatedPersonFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="relatedPersonMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="relatedPersonLastName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Suffix"
              field="relatedPersonSuffix"
              {...nameFieldProps}
            />
          </FormSection>

          <FormSection title="Residence" showDivider>
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
              idPrefix="death-residence"
            />
          </FormSection>

          <FormSection title="Burial Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of Burial"
                type="date"
                value={form.burialDate}
                onChange={handleChange('burialDate')}
                onBlur={handleBlur('burialDate')}
                error={showError('burialDate')}
                helperText={showError('burialDate') ? errors.burialDate : ' '}
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Place of Burial"
                value={form.placeOfBurial}
                onChange={handleChange('placeOfBurial')}
                onBlur={handleBlur('placeOfBurial')}
                error={showError('placeOfBurial')}
                helperText={
                  showError('placeOfBurial') ? errors.placeOfBurial : ' '
                }
                fullWidth
                required
                disabled={saving}
              />
            </Grid>
          </FormSection>

          <FormSection title="Additional Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl
                fullWidth
                required
                error={showError('receivedLastSacraments')}
                disabled={saving}
              >
                <InputLabel
                  id="received-last-sacraments-label"
                  shrink
                  htmlFor="received-last-sacraments"
                >
                  Received Last Sacraments
                </InputLabel>
                <Select
                  labelId="received-last-sacraments-label"
                  id="received-last-sacraments"
                  label="Received Last Sacraments"
                  value={form.receivedLastSacraments}
                  onChange={handleChange('receivedLastSacraments')}
                  onBlur={handleBlur('receivedLastSacraments')}
                  displayEmpty
                  input={
                    <OutlinedInput notched label="Received Last Sacraments" />
                  }
                  renderValue={(current) => {
                    if (!current) {
                      return (
                        <Typography component="span" color="text.secondary">
                          Select Last Sacraments Status
                        </Typography>
                      )
                    }
                    return current
                  }}
                >
                  <MenuItem value="" disabled sx={{ display: 'none' }} />
                  {form.receivedLastSacraments &&
                    !RECEIVED_LAST_SACRAMENTS_OPTIONS.includes(
                      form.receivedLastSacraments,
                    ) && (
                      <MenuItem value={form.receivedLastSacraments}>
                        {form.receivedLastSacraments} (saved)
                      </MenuItem>
                    )}
                  {RECEIVED_LAST_SACRAMENTS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('receivedLastSacraments')
                    ? errors.receivedLastSacraments
                    : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Sickness"
                value={form.sickness}
                onChange={handleChange('sickness')}
                onBlur={handleBlur('sickness')}
                error={showError('sickness')}
                helperText={showError('sickness') ? errors.sickness : ' '}
                fullWidth
                disabled={saving}
                multiline
                minRows={2}
              />
            </Grid>
          </FormSection>

          <FormSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="death"
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
                helperText=" "
                disabled={saving}
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
              sacrament="death"
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
export function DeathOldRecordFormDialog(props) {
  return <DeathRecordFormDialog {...props} workflow="old" />
}

/**
 * Calendar form — New Record only (auto Record Number / Year on save).
 */
export function DeathNewRecordFormDialog(props) {
  return <DeathRecordFormDialog {...props} workflow="new" mode="add" />
}

export default DeathOldRecordFormDialog
