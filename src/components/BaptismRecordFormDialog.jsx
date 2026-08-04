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
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CertificatePrepActions from './CertificateGenerationPrep'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { MARIAN_BLUE } from '../theme/parishTheme'
import {
  MESSAGES,
  RECORD_STATUS_OPTIONS,
  STATUS,
  normalizeRecordStatus,
} from '../constants'
import { parseDisplayDate } from '../utils/date'
import { formatPersonName } from '../utils/personName'
import { toProperCase } from '../utils/textFormatter'
import {
  getRecordNumberParts,
  isRecordNumberDuplicate,
} from '../utils/recordNumber'
import {
  EMPTY_PLACE,
  formatPlace,
  isPlaceComplete,
  parsePlace,
} from '../utils/philippinePlaces'
import { listValidationMessages } from '../utils/formValidationSummary'
import {
  VALIDATION_MESSAGES,
  isPositiveInteger,
  isValidFourDigitYear,
  validateBaptismDateForRecordType,
  validateOptionalName,
  validateRequiredName,
} from '../utils/validation'

const PLACE_REQUIRED_MESSAGE =
  'Select Region, Province, City/Municipality, and Barangay.'

const BAPTISM_FIELD_LABELS = {
  recordNumber: 'Record Number',
  recordYear: 'Record Year',
  minister: 'Minister',
  baptismDate: 'Baptism Date',
  childFirstName: 'Child First Name',
  childMiddleName: 'Child Middle Name',
  childLastName: 'Child Last Name',
  childSuffix: 'Child Suffix',
  gender: 'Gender',
  birthDate: 'Birth Date',
  placeOfBirthPlace: 'Birth Place',
  fatherFirstName: "Father's First Name",
  fatherMiddleName: "Father's Middle Name",
  fatherLastName: "Father's Last Name",
  fatherSuffix: "Father's Suffix",
  motherFirstName: "Mother's First Name",
  motherMiddleName: "Mother's Middle Name",
  motherLastName: "Mother's Last Name",
  motherSuffix: "Mother's Suffix",
  parentsResidencePlace: 'Parents Residence',
  legitimacyStatus: 'Legitimacy Status',
  'godparent.firstName': 'First Name',
  'godparent.middleName': 'Middle Name',
  'godparent.lastName': 'Last Name',
  'godparent.suffix': 'Suffix',
  'godparent.gender': 'Gender',
}
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import {
  emptySacramentRequirements,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
import UnsavedChangesDialog from './UnsavedChangesDialog'
import FormSection from './FormSection'
import FormFieldSubheading from './FormFieldSubheading'
import NameField from './NameField'
import TimeSelect from './TimeSelect'
import MinisterField from './MinisterField'
import PlaceSelect from './PlaceSelect'
import RequirementsChecklist from './RequirementsChecklist'
import GenderSelect from './GenderSelect'
import { normalizeGender } from '../constants/gender'

export const LEGITIMACY_OPTIONS = [
  'Catholic Marriage',
  'Civil Marriage',
  'Illegitimate',
  'Natural',
]

const INITIAL_FORM = {
  recordYear: '',
  recordNumber: '',
  status: STATUS.SCHEDULED,
  baptismDate: '',
  minister: '',
  time: '',
  childFirstName: '',
  childMiddleName: '',
  childLastName: '',
  childSuffix: '',
  gender: '',
  birthDate: '',
  placeOfBirthPlace: { ...EMPTY_PLACE },
  fatherFirstName: '',
  fatherMiddleName: '',
  fatherLastName: '',
  fatherSuffix: '',
  motherFirstName: '',
  motherMiddleName: '',
  motherLastName: '',
  motherSuffix: '',
  parentsResidencePlace: { ...EMPTY_PLACE },
  godparents: [],
  legitimacyStatus: '',
  remarks: '',
  notes: '',
  requirements: emptySacramentRequirements('baptism'),
}

function createGodparent(index = 0, data = {}) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    firstName: data.firstName || '',
    middleName: data.middleName || '',
    lastName: data.lastName || '',
    suffix: data.suffix || '',
    gender: data.gender || '',
  }
}

function blankToEmpty(value) {
  if (!value || value === '-') return ''
  return String(value)
}

function mapGodparentFromRecord(item, index) {
  return createGodparent(index, {
    firstName: blankToEmpty(item?.firstName),
    middleName: blankToEmpty(item?.middleName),
    lastName: blankToEmpty(item?.lastName),
    suffix: blankToEmpty(item?.suffix),
    gender: normalizeGender(item?.gender),
  })
}

function getGodparentsSource(record) {
  // List mapping stores display names on `godparents` and objects on `godparentDetails`.
  if (Array.isArray(record.godparentDetails)) {
    return record.godparentDetails
  }

  if (!Array.isArray(record.godparents)) {
    return []
  }

  return record.godparents.filter((item) => item && typeof item === 'object')
}

function resolvePlaceField(placeValue, textValue) {
  if (placeValue && typeof placeValue === 'object') {
    const fromObject = parsePlace(placeValue)
    if (isPlaceComplete(fromObject)) return fromObject
  }
  return parsePlace(textValue)
}

function recordToForm(record) {
  const parts = getRecordNumberParts(record)
  const godparents = getGodparentsSource(record).map((item, index) =>
    mapGodparentFromRecord(item, index),
  )

  return {
    ...INITIAL_FORM,
    recordYear: parts?.recordYear != null ? String(parts.recordYear) : '',
    recordNumber: parts?.recordNumber != null ? String(parts.recordNumber) : '',
    status: normalizeRecordStatus(record.status),
    baptismDate: parseDisplayDate(record.baptismDate),
    minister: blankToEmpty(record.minister),
    time: blankToEmpty(record.time),
    childFirstName: blankToEmpty(record.childFirstName),
    childMiddleName: blankToEmpty(record.childMiddleName),
    childLastName: blankToEmpty(record.childLastName),
    childSuffix: blankToEmpty(record.childSuffix),
    gender: normalizeGender(record.gender),
    birthDate: parseDisplayDate(record.birthDate || record.dateOfBirth),
    placeOfBirthPlace: resolvePlaceField(
      record.placeOfBirthPlace,
      record.placeOfBirth,
    ),
    fatherFirstName: blankToEmpty(record.fatherFirstName),
    fatherMiddleName: blankToEmpty(record.fatherMiddleName),
    fatherLastName: blankToEmpty(record.fatherLastName),
    fatherSuffix: blankToEmpty(record.fatherSuffix),
    motherFirstName: blankToEmpty(record.motherFirstName),
    motherMiddleName: blankToEmpty(record.motherMiddleName),
    motherLastName: blankToEmpty(record.motherLastName),
    motherSuffix: blankToEmpty(record.motherSuffix),
    parentsResidencePlace: resolvePlaceField(
      record.parentsResidencePlace,
      record.parentsResidence,
    ),
    godparents,
    legitimacyStatus: record.legitimacyStatus || record.legitimacy || '',
    remarks: blankToEmpty(record.remarks),
    notes: blankToEmpty(record.notes),
    requirements: normalizeSacramentRequirements(
      'baptism',
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

function validateBaptismForm(
  form,
  recordTypeRule,
  { requireManualRecordNumber = false, existingRecords = [], excludeId } = {},
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
      errors.recordNumber = MESSAGES.ERROR.BAPTISM_DUPLICATE_RECORD
    }
  }

  applyNameError(errors, 'minister', form.minister, true)

  if (!form.baptismDate) {
    errors.baptismDate = VALIDATION_MESSAGES.REQUIRED
  } else {
    const recordTypeDateError = validateBaptismDateForRecordType(
      form.baptismDate,
      recordTypeRule,
    )
    if (recordTypeDateError) {
      errors.baptismDate = recordTypeDateError
    }
  }

  applyNameError(errors, 'childFirstName', form.childFirstName, true)
  applyNameError(errors, 'childMiddleName', form.childMiddleName, false)
  applyNameError(errors, 'childLastName', form.childLastName, true)
  applyNameError(errors, 'childSuffix', form.childSuffix, false)

  if (!String(form.gender ?? '').trim()) {
    errors.gender = VALIDATION_MESSAGES.REQUIRED
  }

  if (!form.birthDate) {
    errors.birthDate = VALIDATION_MESSAGES.REQUIRED
  }

  if (!isPlaceComplete(form.placeOfBirthPlace)) {
    errors.placeOfBirthPlace = PLACE_REQUIRED_MESSAGE
  }

  applyNameError(errors, 'fatherFirstName', form.fatherFirstName, true)
  applyNameError(errors, 'fatherMiddleName', form.fatherMiddleName, false)
  applyNameError(errors, 'fatherLastName', form.fatherLastName, true)
  applyNameError(errors, 'fatherSuffix', form.fatherSuffix, false)

  applyNameError(errors, 'motherFirstName', form.motherFirstName, true)
  applyNameError(errors, 'motherMiddleName', form.motherMiddleName, false)
  applyNameError(errors, 'motherLastName', form.motherLastName, true)
  applyNameError(errors, 'motherSuffix', form.motherSuffix, false)

  if (!isPlaceComplete(form.parentsResidencePlace)) {
    errors.parentsResidencePlace = PLACE_REQUIRED_MESSAGE
  }

  if (!String(form.legitimacyStatus ?? '').trim()) {
    errors.legitimacyStatus = VALIDATION_MESSAGES.REQUIRED
  }

  if (form.birthDate && form.baptismDate && form.birthDate > form.baptismDate) {
    errors.birthDate = VALIDATION_MESSAGES.BIRTH_AFTER_BAPTISM
  }

  const godparentErrors = {}
  form.godparents.forEach((godparent) => {
    const rowErrors = {}
    applyNameError(rowErrors, 'firstName', godparent.firstName, true)
    applyNameError(rowErrors, 'middleName', godparent.middleName, false)
    applyNameError(rowErrors, 'lastName', godparent.lastName, true)
    applyNameError(rowErrors, 'suffix', godparent.suffix, false)

    if (!String(godparent.gender ?? '').trim()) {
      rowErrors.gender = VALIDATION_MESSAGES.REQUIRED
    }

    if (Object.keys(rowErrors).length > 0) {
      godparentErrors[godparent.id] = rowErrors
    }
  })

  if (Object.keys(godparentErrors).length > 0) {
    errors.godparents = godparentErrors
  }

  return errors
}

/**
 * Baptism record form — locked to one workflow.
 *
 * @param {'add' | 'edit'} mode
 * @param {'old' | 'new'} workflow — required; never mixed by callers
 *   - old: sacramental module encoding (manual Record Number / Year)
 *   - new: calendar scheduling (auto Record Number / Year; add only)
 */
function BaptismRecordFormDialog({
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
      'BaptismRecordFormDialog requires workflow="old" or workflow="new".',
    )
  }

  const isEdit = mode === 'edit'
  // Calendar New Record is create-only — never show manual numbering.
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
      initialForm = {
        ...INITIAL_FORM,
        placeOfBirthPlace: { ...EMPTY_PLACE },
        parentsResidencePlace: { ...EMPTY_PLACE },
        baptismDate: defaultSacramentDate || '',
        time: defaultSacramentTime || '',
        status: STATUS.SCHEDULED,
        godparents: [],
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
      validateBaptismForm(form, recordTypeRule, {
        // New Record (Calendar): number/year auto-generated — never validate here.
        // Old Record (module): require manual number/year. Edit: keep existing values.
        requireManualRecordNumber: isOldRecord || isEdit,
        existingRecords,
        excludeId,
      }),
    [form, recordTypeRule, isOldRecord, isEdit, existingRecords, excludeId],
  )
  const canSave = Object.keys(errors).length === 0
  const validationMessages = useMemo(
    () => listValidationMessages(errors, BAPTISM_FIELD_LABELS),
    [errors],
  )

  function showError(field) {
    return Boolean((touched[field] || submitAttempted) && errors[field])
  }

  function handleRecordNumberChange(event) {
    const value = event.target.value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, recordNumber: value }))
  }

  function handleRecordYearChange(event) {
    const value = event.target.value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, recordYear: value }))
  }

  function showGodparentFieldError(id, field) {
    const message = errors.godparents?.[id]?.[field]
    return Boolean(
      (touched[`godparent-${id}-${field}`] || submitAttempted) && message,
    )
  }

  function getGodparentFieldError(id, field) {
    return errors.godparents?.[id]?.[field] || ''
  }

  function handleChange(field) {
    return (event) => {
      const value = event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))

      // Show Baptism Date record-type errors as soon as a date is chosen.
      if (field === 'baptismDate') {
        setTouched((prev) => ({ ...prev, baptismDate: true }))
      }
    }
  }

  function handleBlur(field) {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
    }
  }

  function handlePlaceChange(field) {
    return (place) => {
      setForm((prev) => ({ ...prev, [field]: place }))
      setTouched((prev) => ({ ...prev, [field]: true }))
    }
  }

  function handleAddGodparent() {
    setForm((prev) => ({
      ...prev,
      godparents: [...prev.godparents, createGodparent(prev.godparents.length)],
    }))
  }

  function handleGodparentChange(id, field, value) {
    setForm((prev) => ({
      ...prev,
      godparents: prev.godparents.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function handleGodparentBlur(id, field) {
    if (field !== 'gender') {
      setForm((prev) => ({
        ...prev,
        godparents: prev.godparents.map((item) => {
          if (item.id !== id) return item
          const formatted = toProperCase(item[field])
          if (formatted === item[field]) return item
          return { ...item, [field]: formatted }
        }),
      }))
    }
    setTouched((prev) => ({ ...prev, [`godparent-${id}-${field}`]: true }))
  }

  function handleRemoveGodparent(id) {
    setForm((prev) => ({
      ...prev,
      godparents: prev.godparents.filter((item) => item.id !== id),
    }))
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    setTouched({})
    setSubmitAttempted(false)
    clearBaseline()
    onClose()
  }

  function handleCloseRequest() {
    if (saving) return
    requestClose(resetAndClose)
  }

  async function handleSave() {
    setSubmitAttempted(true)
    if (!canSave || saving) return

    const godparents = form.godparents.map((item) => ({
      firstName: item.firstName.trim(),
      middleName: item.middleName.trim(),
      lastName: item.lastName.trim(),
      suffix: item.suffix.trim(),
      gender: normalizeGender(item.gender),
    }))

    const placeOfBirth = formatPlace(form.placeOfBirthPlace)
    const parentsResidence = formatPlace(form.parentsResidencePlace)

    const payload = {
      baptismDate: form.baptismDate,
      minister: form.minister.trim(),
      time: form.time.trim(),
      childFirstName: form.childFirstName.trim(),
      childMiddleName: form.childMiddleName.trim(),
      childLastName: form.childLastName.trim(),
      childSuffix: form.childSuffix.trim(),
      gender: normalizeGender(form.gender),
      birthDate: form.birthDate,
      placeOfBirth,
      placeOfBirthPlace: form.placeOfBirthPlace,
      fatherFirstName: form.fatherFirstName.trim(),
      fatherMiddleName: form.fatherMiddleName.trim(),
      fatherLastName: form.fatherLastName.trim(),
      fatherSuffix: form.fatherSuffix.trim(),
      motherFirstName: form.motherFirstName.trim(),
      motherMiddleName: form.motherMiddleName.trim(),
      motherLastName: form.motherLastName.trim(),
      motherSuffix: form.motherSuffix.trim(),
      parentsResidence,
      parentsResidencePlace: form.parentsResidencePlace,
      godparents,
      legitimacyStatus: form.legitimacyStatus,
      remarks: form.remarks.trim(),
      notes: form.notes.trim(),
      requirements: normalizeSacramentRequirements(
        'baptism',
        form.requirements,
      ),
      status: isEdit ? form.status : STATUS.SCHEDULED,
      // Workflow is locked: Calendar → new, sacramental module → old.
      recordType: isEdit ? record?.recordType || 'old' : workflow,
    }

    if (isEdit || isOldRecord) {
      payload.recordYear = Number(form.recordYear)
      payload.recordNumber = Number(form.recordNumber)
    }

    try {
      await onSave(payload, { mode, record })
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
          {isEdit ? 'Edit Baptismal Record' : 'Add Baptismal Record'}
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
              <Box
                component="ul"
                sx={{ m: 0, mt: 1, pl: 2.25 }}
              >
                {validationMessages.map((message, index) => (
                  <li key={`${index}-${message}`}>{message}</li>
                ))}
              </Box>
            </Alert>
          )}

          {(isOldRecord || isEdit) && (
            <FormSection title="Record Information">
              <Grid size={{ xs: 12, sm: isEdit ? 4 : 6 }}>
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
              <Grid size={{ xs: 12, sm: isEdit ? 4 : 6 }}>
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
              {isEdit && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth disabled={saving}>
                    <InputLabel id="baptism-status-label">Status</InputLabel>
                    <Select
                      labelId="baptism-status-label"
                      label="Status"
                      value={form.status}
                      onChange={handleChange('status')}
                      onBlur={handleBlur('status')}
                    >
                      {RECORD_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText> </FormHelperText>
                  </FormControl>
                </Grid>
              )}
            </FormSection>
          )}

          <FormSection
            title="Church Information"
            showDivider={isOldRecord || isEdit}
          >
            <Grid size={{ xs: 12, sm: 6 }}>
              <MinisterField
                key={`baptism-minister-${open}-${mode}-${record?.id || 'new'}`}
                label="Minister"
                assignment="Baptism"
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
                label="Date of Sacrament"
                type="date"
                value={form.baptismDate}
                onChange={handleChange('baptismDate')}
                onBlur={handleBlur('baptismDate')}
                error={showError('baptismDate')}
                helperText={
                  showError('baptismDate') ? errors.baptismDate : ' '
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
                id="baptism-time"
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

          <FormSection title="Child Information" showDivider>
            <NameField
              label="First Name"
              field="childFirstName"
              required
              {...nameFieldProps}
            />
            <NameField
              label="Middle Name"
              field="childMiddleName"
              {...nameFieldProps}
            />
            <NameField
              label="Last Name"
              field="childLastName"
              required
              {...nameFieldProps}
            />
            <NameField label="Suffix" field="childSuffix" {...nameFieldProps} />
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
              idPrefix="child-gender"
            />
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Birth Date"
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
            <FormFieldSubheading>Birth Place</FormFieldSubheading>
            <PlaceSelect
              value={form.placeOfBirthPlace}
              onChange={handlePlaceChange('placeOfBirthPlace')}
              onBlur={handleBlur('placeOfBirthPlace')}
              required
              error={showError('placeOfBirthPlace')}
              helperText={
                showError('placeOfBirthPlace')
                  ? errors.placeOfBirthPlace
                  : ' '
              }
              disabled={saving}
              idPrefix="baptism-birth-place"
            />
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
            <NameField
              label="Suffix"
              field="fatherSuffix"
              {...nameFieldProps}
            />

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
            <NameField
              label="Suffix"
              field="motherSuffix"
              {...nameFieldProps}
            />

            <FormFieldSubheading spaced>Residence</FormFieldSubheading>
            <PlaceSelect
              value={form.parentsResidencePlace}
              onChange={handlePlaceChange('parentsResidencePlace')}
              onBlur={handleBlur('parentsResidencePlace')}
              required
              error={showError('parentsResidencePlace')}
              helperText={
                showError('parentsResidencePlace')
                  ? errors.parentsResidencePlace
                  : ' '
              }
              disabled={saving}
              idPrefix="baptism-parents-residence"
            />
          </FormSection>

          <FormSection title="Sponsors Information" showDivider>
            <Grid size={{ xs: 12 }}>
              <Stack spacing={2.5}>
                {form.godparents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No godparents added yet.
                  </Typography>
                )}

                {form.godparents.map((godparent, index) => (
                  <Box
                    key={godparent.id}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'rgba(11, 61, 145, 0.02)',
                    }}
                  >
                    <Stack
                      direction="row"

                      sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 650, color: MARIAN_BLUE }}
                      >
                        Godparent {index + 1}
                      </Typography>
                      <IconButton
                        aria-label={`Remove godparent ${index + 1}`}
                        onClick={() => handleRemoveGodparent(godparent.id)}
                        disabled={saving}
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: '#C62828',
                            bgcolor: 'rgba(198, 40, 40, 0.06)',
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Grid container spacing={2}>
                      {[
                        {
                          field: 'firstName',
                          label: 'First Name',
                          required: true,
                        },
                        {
                          field: 'middleName',
                          label: 'Middle Name',
                          required: false,
                        },
                        {
                          field: 'lastName',
                          label: 'Last Name',
                          required: true,
                        },
                        {
                          field: 'suffix',
                          label: 'Suffix',
                          required: false,
                        },
                      ].map(({ field, label, required }) => (
                        <Grid key={field} size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            label={label}
                            value={godparent[field]}
                            onChange={(event) =>
                              handleGodparentChange(
                                godparent.id,
                                field,
                                event.target.value,
                              )
                            }
                            onBlur={() =>
                              handleGodparentBlur(godparent.id, field)
                            }
                            error={showGodparentFieldError(godparent.id, field)}
                            helperText={
                              showGodparentFieldError(godparent.id, field)
                                ? getGodparentFieldError(godparent.id, field)
                                : ' '
                            }
                            fullWidth
                            required={required}
                            disabled={saving}
                          />
                        </Grid>
                      ))}
                      <GenderSelect
                        label="Gender"
                        value={godparent.gender}
                        onChange={(value) =>
                          handleGodparentChange(godparent.id, 'gender', value)
                        }
                        onBlur={() =>
                          handleGodparentBlur(godparent.id, 'gender')
                        }
                        error={showGodparentFieldError(godparent.id, 'gender')}
                        helperText={
                          showGodparentFieldError(godparent.id, 'gender')
                            ? getGodparentFieldError(godparent.id, 'gender')
                            : ' '
                        }
                        required
                        disabled={saving}
                        idPrefix={`godparent-gender-${godparent.id}`}
                      />
                    </Grid>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      Preview:{' '}
                      {formatPersonName({
                        firstName: godparent.firstName,
                        middleName: godparent.middleName,
                        lastName: godparent.lastName,
                        suffix: godparent.suffix,
                      })}
                      {godparent.gender ? ` (${godparent.gender})` : ''}
                    </Typography>
                  </Box>
                ))}

                <Box>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddGodparent}
                    disabled={saving}
                    sx={{
                      borderRadius: 3,
                      borderColor: 'divider',
                      color: MARIAN_BLUE,
                      '&:hover': {
                        borderColor: MARIAN_BLUE,
                        bgcolor: 'rgba(11, 61, 145, 0.04)',
                      },
                    }}
                  >
                    Add Godparent
                  </Button>
                </Box>
              </Stack>
            </Grid>
          </FormSection>

          <FormSection title="Additional Sacrament Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl
                fullWidth
                required
                disabled={saving}
                error={showError('legitimacyStatus')}
              >
                <InputLabel id="legitimacy-status-label">
                  Legitimacy Status
                </InputLabel>
                <Select
                  labelId="legitimacy-status-label"
                  label="Legitimacy Status"
                  value={form.legitimacyStatus}
                  onChange={handleChange('legitimacyStatus')}
                  onBlur={handleBlur('legitimacyStatus')}
                >
                  {LEGITIMACY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {showError('legitimacyStatus')
                    ? errors.legitimacyStatus
                    : ' '}
                </FormHelperText>
              </FormControl>
            </Grid>
          </FormSection>

          <FormSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="baptism"
              value={form.requirements}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, requirements: next }))
              }
              disabled={saving}
            />
          </FormSection>

          <FormSection title="Remarks" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Notes"
                value={form.notes}
                onChange={handleChange('notes')}
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
              sacrament="baptism"
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
export function BaptismOldRecordFormDialog(props) {
  return <BaptismRecordFormDialog {...props} workflow="old" />
}

/**
 * Calendar form — New Record only (auto Record Number / Year on save).
 * Create-only; never used for historical registry encoding.
 */
export function BaptismNewRecordFormDialog(props) {
  return <BaptismRecordFormDialog {...props} workflow="new" mode="add" />
}

export default BaptismOldRecordFormDialog
