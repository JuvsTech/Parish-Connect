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
import { listValidationMessages } from '../utils/formValidationSummary'
import { parseDisplayDate } from '../utils/date'
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
import RequirementsChecklist from './RequirementsChecklist'
import {
  EMPTY_PLACE,
  isResidencePlaceComplete,
  resolveResidencePlace,
} from '../utils/philippinePlaces'

const FIELD_LABELS = {
  recordNumber: 'Record Number',
  recordYear: 'Record Year',
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  suffix: 'Suffix',
  residencePlace: 'Residence',
  fatherFirstName: "Father's First Name",
  fatherMiddleName: "Father's Middle Name",
  fatherLastName: "Father's Last Name",
  fatherSuffix: "Father's Suffix",
  motherFirstName: "Mother's First Name",
  motherMiddleName: "Mother's Middle Name",
  motherLastName: "Mother's Last Name",
  motherSuffix: "Mother's Suffix",
  dateOfReception: 'Date of Reception',
  receivingMinister: 'Receiving Minister',
  originalBaptismDate: 'Original Baptism Date',
  originalBaptismDenomination: 'Denomination',
  originalBaptismPlace: 'Place',
  observanda: 'Remarks',
}

const INITIAL_FORM = {
  recordYear: '',
  recordNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  residencePlace: { ...EMPTY_PLACE },
  fatherFirstName: '',
  fatherMiddleName: '',
  fatherLastName: '',
  fatherSuffix: '',
  motherFirstName: '',
  motherMiddleName: '',
  motherLastName: '',
  motherSuffix: '',
  dateOfReception: '',
  receivingMinister: '',
  originalBaptismDate: '',
  originalBaptismDenomination: '',
  originalBaptismPlace: '',
  observanda: '',
  requirements: emptySacramentRequirements('conversion'),
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

function recordToForm(record) {
  if (!record) return { ...INITIAL_FORM }

  const parts = getRecordNumberParts(record)

  return {
    recordYear:
      parts?.recordYear != null
        ? String(parts.recordYear)
        : blankToEmpty(record.recordYear),
    recordNumber:
      parts?.recordNumber != null
        ? String(parts.recordNumber)
        : blankToEmpty(record.recordNumber),
    firstName: blankToEmpty(record.firstName),
    middleName: blankToEmpty(record.middleName),
    lastName: blankToEmpty(record.lastName),
    suffix: blankToEmpty(record.suffix),
    residencePlace: resolveResidencePlace({
      province: record.province,
      municipality: record.municipality,
      barangay: record.barangay,
      residencePlace: record.residencePlace,
    }),
    fatherFirstName: blankToEmpty(record.fatherFirstName),
    fatherMiddleName: blankToEmpty(record.fatherMiddleName),
    fatherLastName: blankToEmpty(record.fatherLastName),
    fatherSuffix: blankToEmpty(record.fatherSuffix),
    motherFirstName: blankToEmpty(record.motherFirstName),
    motherMiddleName: blankToEmpty(record.motherMiddleName),
    motherLastName: blankToEmpty(record.motherLastName),
    motherSuffix: blankToEmpty(record.motherSuffix),
    dateOfReception: parseDisplayDate(
      record.dateOfReceptionInput || record.dateOfReception,
    ),
    receivingMinister: blankToEmpty(
      record.receivingMinister || record.minister,
    ),
    originalBaptismDate: parseDisplayDate(record.originalBaptismDate),
    originalBaptismDenomination: blankToEmpty(
      record.originalBaptismDenomination,
    ),
    originalBaptismPlace: blankToEmpty(record.originalBaptismPlace),
    observanda: blankToEmpty(record.observanda || record.remarks),
    requirements: normalizeSacramentRequirements(
      'conversion',
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

function validateConversionForm(
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
        'A conversion record with this year and number already exists.'
    }
  }

  applyNameError(errors, 'firstName', form.firstName, true)
  applyNameError(errors, 'middleName', form.middleName, false)
  applyNameError(errors, 'lastName', form.lastName, true)
  applyNameError(errors, 'suffix', form.suffix, false)

  if (!isResidencePlaceComplete(form.residencePlace)) {
    errors.residencePlace =
      'Select Province, Municipality / City, and Barangay.'
  }

  applyNameError(errors, 'fatherFirstName', form.fatherFirstName, true)
  applyNameError(errors, 'fatherMiddleName', form.fatherMiddleName, false)
  applyNameError(errors, 'fatherLastName', form.fatherLastName, true)
  applyNameError(errors, 'fatherSuffix', form.fatherSuffix, false)

  applyNameError(errors, 'motherFirstName', form.motherFirstName, true)
  applyNameError(errors, 'motherMiddleName', form.motherMiddleName, false)
  applyNameError(errors, 'motherLastName', form.motherLastName, true)
  applyNameError(errors, 'motherSuffix', form.motherSuffix, false)

  if (!form.dateOfReception) {
    errors.dateOfReception = VALIDATION_MESSAGES.REQUIRED
  } else if (recordTypeRule === 'old') {
    const dateError = validateSacramentDateForRecordType(
      form.dateOfReception,
      'old',
    )
    if (dateError) errors.dateOfReception = dateError
  } else if (recordTypeRule === 'new') {
    const dateError = validateSacramentDateForRecordType(
      form.dateOfReception,
      'new',
    )
    if (dateError) errors.dateOfReception = dateError
  }

  applyNameError(errors, 'receivingMinister', form.receivingMinister, true)

  if (!String(form.originalBaptismDenomination ?? '').trim()) {
    errors.originalBaptismDenomination = VALIDATION_MESSAGES.REQUIRED
  }

  if (!String(form.originalBaptismPlace ?? '').trim()) {
    errors.originalBaptismPlace = VALIDATION_MESSAGES.REQUIRED
  }

  return errors
}

/**
 * Add / Edit Conversion Record dialog — locked to one workflow.
 *
 * @param {'old' | 'new'} workflow — required; never mixed by callers
 */
function ConversionRecordFormDialog({
  open,
  mode = 'add',
  workflow,
  record = null,
  existingRecords = [],
  defaultSacramentDate = '',
  onClose,
  onSave,
  saving = false,
}) {
  if (workflow !== 'old' && workflow !== 'new') {
    throw new Error(
      'ConversionRecordFormDialog requires workflow="old" or workflow="new".',
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
      initialForm = {
        ...INITIAL_FORM,
        residencePlace: { ...EMPTY_PLACE },
        dateOfReception: defaultSacramentDate || '',
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
  }, [open, isEdit, record, workflow, defaultSacramentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const excludeId = isEdit && record ? record.id : undefined
  const errors = useMemo(
    () =>
      validateConversionForm(form, {
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
      setForm((prev) => ({ ...prev, [field]: value }))
      if (field === 'dateOfReception') {
        setTouched((prev) => ({ ...prev, dateOfReception: true }))
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
      dateOfReception: form.dateOfReception,
      receivingMinister: form.receivingMinister.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      suffix: form.suffix.trim(),
      province: String(form.residencePlace?.provinceName || '').trim(),
      municipality: String(form.residencePlace?.cityName || '').trim(),
      barangay: String(form.residencePlace?.barangayName || '').trim(),
      fatherFirstName: form.fatherFirstName.trim(),
      fatherMiddleName: form.fatherMiddleName.trim(),
      fatherLastName: form.fatherLastName.trim(),
      fatherSuffix: form.fatherSuffix.trim(),
      motherFirstName: form.motherFirstName.trim(),
      motherMiddleName: form.motherMiddleName.trim(),
      motherLastName: form.motherLastName.trim(),
      motherSuffix: form.motherSuffix.trim(),
      originalBaptismDate: form.originalBaptismDate || null,
      originalBaptismDenomination: form.originalBaptismDenomination.trim(),
      originalBaptismPlace: form.originalBaptismPlace.trim(),
      observanda: form.observanda.trim(),
      requirements: normalizeSacramentRequirements(
        'conversion',
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
          {isEdit ? 'Edit Conversion Record' : 'Add Conversion Record'}
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
            title="Convert Information"
            showDivider={isOldRecord || isEdit}
          >
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
              idPrefix="conversion-residence"
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
          </FormSection>

          <FormSection title="Reception Information" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of Reception"
                type="date"
                value={form.dateOfReception}
                onChange={handleChange('dateOfReception')}
                onBlur={handleBlur('dateOfReception')}
                error={showError('dateOfReception')}
                helperText={
                  showError('dateOfReception') ? errors.dateOfReception : ' '
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
              <MinisterField
                key={`conversion-minister-${open}-${mode}-${record?.id || 'new'}`}
                label="Receiving Minister"
                assignment="Conversion"
                value={form.receivingMinister}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, receivingMinister: value }))
                }
                onBlur={handleBlur('receivingMinister')}
                error={showError('receivingMinister')}
                helperText={
                  showError('receivingMinister')
                    ? errors.receivingMinister
                    : ' '
                }
                required
                disabled={saving}
              />
            </Grid>
          </FormSection>

          <FormSection title="Original Baptism" showDivider>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date"
                type="date"
                value={form.originalBaptismDate}
                onChange={handleChange('originalBaptismDate')}
                onBlur={handleBlur('originalBaptismDate')}
                error={showError('originalBaptismDate')}
                helperText={
                  showError('originalBaptismDate')
                    ? errors.originalBaptismDate
                    : ' '
                }
                fullWidth
                disabled={saving}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Denomination"
                value={form.originalBaptismDenomination}
                onChange={handleChange('originalBaptismDenomination')}
                onBlur={handleBlur('originalBaptismDenomination')}
                error={showError('originalBaptismDenomination')}
                helperText={
                  showError('originalBaptismDenomination')
                    ? errors.originalBaptismDenomination
                    : ' '
                }
                fullWidth
                required
                disabled={saving}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Place"
                value={form.originalBaptismPlace}
                onChange={handleChange('originalBaptismPlace')}
                onBlur={handleBlur('originalBaptismPlace')}
                error={showError('originalBaptismPlace')}
                helperText={
                  showError('originalBaptismPlace')
                    ? errors.originalBaptismPlace
                    : ' '
                }
                fullWidth
                required
                disabled={saving}
              />
            </Grid>
          </FormSection>

          <FormSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="conversion"
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
                value={form.observanda}
                onChange={handleChange('observanda')}
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
              sacrament="conversion"
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
export function ConversionOldRecordFormDialog(props) {
  return <ConversionRecordFormDialog {...props} workflow="old" />
}

/**
 * Calendar form — New Record only (auto Record Number / Year on save).
 */
export function ConversionNewRecordFormDialog(props) {
  return <ConversionRecordFormDialog {...props} workflow="new" mode="add" />
}

export default ConversionOldRecordFormDialog
