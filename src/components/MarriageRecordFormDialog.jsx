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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CertificatePrepActions from './CertificateGenerationPrep'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { MARIAN_BLUE } from '../theme/parishTheme'
import {
  CIVIL_STATUS_OPTIONS,
  DEFAULT_MARRIAGE_NATIONALITY,
  MARRIAGE_NATIONALITY_OPTIONS,
  MARRIAGE_OCCUPATION_OPTIONS,
} from '../constants/marriageOptions'
import {
  emptySacramentRequirements,
  normalizeSacramentRequirements,
} from '../constants/sacramentRequirements'
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
import {
  EMPTY_PLACE,
  formatPlace,
  isPlaceComplete,
  isResidencePlaceComplete,
  parsePlace,
  resolveResidencePlace,
} from '../utils/philippinePlaces'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import UnsavedChangesDialog from './UnsavedChangesDialog'
import FormSection from './FormSection'
import FormFieldSubheading from './FormFieldSubheading'
import NameField from './NameField'
import MinisterField from './MinisterField'
import PlaceSelect from './PlaceSelect'
import ResidencePlaceSelect from './ResidencePlaceSelect'
import TimeSelect from './TimeSelect'
import RequirementsChecklist from './RequirementsChecklist'
import { toProperCase } from '../utils/textFormatter'

const PLACE_REQUIRED_MESSAGE =
  'Select Region, Province, Municipality / City, and Barangay.'
const RESIDENCE_REQUIRED_MESSAGE =
  'Select Province, Municipality / City, and Barangay.'

const FIELD_LABELS = {
  recordNumber: 'Record Number',
  recordYear: 'Record Year',
  minister: 'Minister',
  marriageDate: 'Marriage Date',
  marriagePlace: 'Marriage Place',
  groomFirstName: "Groom's First Name",
  groomMiddleName: "Groom's Middle Name",
  groomLastName: "Groom's Last Name",
  groomSuffix: "Groom's Suffix",
  groomBirthDate: "Groom's Birth Date",
  groomAge: "Groom's Age",
  groomBirthPlacePlace: "Groom's Birth Place",
  groomNationality: "Groom's Nationality",
  groomOccupation: "Groom's Occupation",
  groomOccupationOther: "Groom's Other Occupation",
  groomResidencePlace: "Groom's Residence",
  groomCivilStatus: "Groom's Civil Status",
  groomFatherFirstName: "Groom's Father First Name",
  groomFatherLastName: "Groom's Father Last Name",
  groomMotherFirstName: "Groom's Mother First Name",
  groomMotherLastName: "Groom's Mother Last Name",
  brideFirstName: "Bride's First Name",
  brideMiddleName: "Bride's Middle Name",
  brideLastName: "Bride's Last Name",
  brideSuffix: "Bride's Suffix",
  brideBirthDate: "Bride's Birth Date",
  brideAge: "Bride's Age",
  brideBirthPlacePlace: "Bride's Birth Place",
  brideNationality: "Bride's Nationality",
  brideOccupation: "Bride's Occupation",
  brideOccupationOther: "Bride's Other Occupation",
  brideResidencePlace: "Bride's Residence",
  brideCivilStatus: "Bride's Civil Status",
  brideFatherFirstName: "Bride's Father First Name",
  brideFatherLastName: "Bride's Father Last Name",
  brideMotherFirstName: "Bride's Mother First Name",
  brideMotherLastName: "Bride's Mother Last Name",
  'sponsor.firstName': 'First Name',
  'sponsor.middleName': 'Middle Name',
  'sponsor.lastName': 'Last Name',
  'sponsor.suffix': 'Suffix',
}

const INITIAL_FORM = {
  recordYear: '',
  recordNumber: '',
  minister: '',
  marriageDate: '',
  time: '',
  marriagePlace: '',
  remarks: '',
  groomFirstName: '',
  groomMiddleName: '',
  groomLastName: '',
  groomSuffix: '',
  groomBirthDate: '',
  groomAge: '',
  groomBirthPlacePlace: { ...EMPTY_PLACE },
  groomNationality: DEFAULT_MARRIAGE_NATIONALITY,
  groomOccupation: '',
  groomOccupationOther: '',
  groomResidencePlace: { ...EMPTY_PLACE },
  groomCivilStatus: '',
  groomFatherFirstName: '',
  groomFatherMiddleName: '',
  groomFatherLastName: '',
  groomFatherSuffix: '',
  groomMotherFirstName: '',
  groomMotherMiddleName: '',
  groomMotherLastName: '',
  groomMotherSuffix: '',
  brideFirstName: '',
  brideMiddleName: '',
  brideLastName: '',
  brideSuffix: '',
  brideBirthDate: '',
  brideAge: '',
  brideBirthPlacePlace: { ...EMPTY_PLACE },
  brideNationality: DEFAULT_MARRIAGE_NATIONALITY,
  brideOccupation: '',
  brideOccupationOther: '',
  brideResidencePlace: { ...EMPTY_PLACE },
  brideCivilStatus: '',
  brideFatherFirstName: '',
  brideFatherMiddleName: '',
  brideFatherLastName: '',
  brideFatherSuffix: '',
  brideMotherFirstName: '',
  brideMotherMiddleName: '',
  brideMotherLastName: '',
  brideMotherSuffix: '',
  principalSponsors: [],
  requirements: emptySacramentRequirements('marriage'),
}

function blankToEmpty(value) {
  if (value == null || value === '-' || value === '—') return ''
  return String(value)
}

function createSponsor(index = 0) {
  return {
    id: `sponsor-${Date.now()}-${index}`,
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
  }
}

function computeAgeAtMarriage(birthDate, marriageDate) {
  if (!birthDate) return null
  const asOf = marriageDate ? toLocalDate(marriageDate) : new Date()
  if (!asOf) return null
  return computeAgeFromDateOfBirth(birthDate, asOf)
}

function resolvePlaceField(placeValue, textValue) {
  if (placeValue && typeof placeValue === 'object') {
    const fromObject = parsePlace(placeValue)
    if (isPlaceComplete(fromObject)) return fromObject
  }
  return parsePlace(textValue)
}

function getSponsorsSource(record) {
  if (Array.isArray(record?.principalSponsors)) return record.principalSponsors
  if (Array.isArray(record?.sponsors)) return record.sponsors
  return []
}

function blankPartyForm(prefix) {
  return {
    [`${prefix}FirstName`]: '',
    [`${prefix}MiddleName`]: '',
    [`${prefix}LastName`]: '',
    [`${prefix}Suffix`]: '',
    [`${prefix}BirthDate`]: '',
    [`${prefix}Age`]: '',
    [`${prefix}BirthPlacePlace`]: { ...EMPTY_PLACE },
    [`${prefix}Nationality`]: DEFAULT_MARRIAGE_NATIONALITY,
    [`${prefix}Occupation`]: '',
    [`${prefix}OccupationOther`]: '',
    [`${prefix}ResidencePlace`]: { ...EMPTY_PLACE },
    [`${prefix}CivilStatus`]: '',
    [`${prefix}FatherFirstName`]: '',
    [`${prefix}FatherMiddleName`]: '',
    [`${prefix}FatherLastName`]: '',
    [`${prefix}FatherSuffix`]: '',
    [`${prefix}MotherFirstName`]: '',
    [`${prefix}MotherMiddleName`]: '',
    [`${prefix}MotherLastName`]: '',
    [`${prefix}MotherSuffix`]: '',
  }
}

function recordToForm(record) {
  if (!record) {
    return {
      ...INITIAL_FORM,
      ...blankPartyForm('groom'),
      ...blankPartyForm('bride'),
      principalSponsors: [],
    }
  }

  const parts = getRecordNumberParts(record)
  const marriageDate = parseDisplayDate(
    record.marriageDateInput || record.marriageDate,
  )
  const groomBirthDate = parseDisplayDate(record.groomBirthDate)
  const brideBirthDate = parseDisplayDate(record.brideBirthDate)

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
    marriageDate,
    time: blankToEmpty(record.time),
    marriagePlace: blankToEmpty(record.marriagePlace),
    remarks: blankToEmpty(record.remarks),
    groomFirstName: blankToEmpty(record.groomFirstName),
    groomMiddleName: blankToEmpty(record.groomMiddleName),
    groomLastName: blankToEmpty(record.groomLastName),
    groomSuffix: blankToEmpty(record.groomSuffix),
    groomBirthDate,
    groomAge:
      record.groomAge != null && record.groomAge !== ''
        ? String(record.groomAge)
        : (() => {
            const computed = computeAgeAtMarriage(groomBirthDate, marriageDate)
            return computed == null ? '' : String(computed)
          })(),
    groomBirthPlacePlace: resolvePlaceField(
      record.groomBirthPlacePlace,
      record.groomBirthPlace,
    ),
    groomNationality:
      blankToEmpty(record.groomNationality) || DEFAULT_MARRIAGE_NATIONALITY,
    groomOccupation: blankToEmpty(record.groomOccupation),
    groomOccupationOther: blankToEmpty(record.groomOccupationOther),
    groomResidencePlace: resolveResidencePlace({
      residencePlace: record.groomResidencePlace,
      province: record.groomResidencePlace?.provinceName,
      municipality: record.groomResidencePlace?.cityName,
      barangay: record.groomResidencePlace?.barangayName,
    }),
    groomCivilStatus: blankToEmpty(record.groomCivilStatus),
    groomFatherFirstName: blankToEmpty(record.groomFatherFirstName),
    groomFatherMiddleName: blankToEmpty(record.groomFatherMiddleName),
    groomFatherLastName: blankToEmpty(record.groomFatherLastName),
    groomFatherSuffix: blankToEmpty(record.groomFatherSuffix),
    groomMotherFirstName: blankToEmpty(record.groomMotherFirstName),
    groomMotherMiddleName: blankToEmpty(record.groomMotherMiddleName),
    groomMotherLastName: blankToEmpty(record.groomMotherLastName),
    groomMotherSuffix: blankToEmpty(record.groomMotherSuffix),
    brideFirstName: blankToEmpty(record.brideFirstName),
    brideMiddleName: blankToEmpty(record.brideMiddleName),
    brideLastName: blankToEmpty(record.brideLastName),
    brideSuffix: blankToEmpty(record.brideSuffix),
    brideBirthDate,
    brideAge:
      record.brideAge != null && record.brideAge !== ''
        ? String(record.brideAge)
        : (() => {
            const computed = computeAgeAtMarriage(brideBirthDate, marriageDate)
            return computed == null ? '' : String(computed)
          })(),
    brideBirthPlacePlace: resolvePlaceField(
      record.brideBirthPlacePlace,
      record.brideBirthPlace,
    ),
    brideNationality:
      blankToEmpty(record.brideNationality) || DEFAULT_MARRIAGE_NATIONALITY,
    brideOccupation: blankToEmpty(record.brideOccupation),
    brideOccupationOther: blankToEmpty(record.brideOccupationOther),
    brideResidencePlace: resolveResidencePlace({
      residencePlace: record.brideResidencePlace,
      province: record.brideResidencePlace?.provinceName,
      municipality: record.brideResidencePlace?.cityName,
      barangay: record.brideResidencePlace?.barangayName,
    }),
    brideCivilStatus: blankToEmpty(record.brideCivilStatus),
    brideFatherFirstName: blankToEmpty(record.brideFatherFirstName),
    brideFatherMiddleName: blankToEmpty(record.brideFatherMiddleName),
    brideFatherLastName: blankToEmpty(record.brideFatherLastName),
    brideFatherSuffix: blankToEmpty(record.brideFatherSuffix),
    brideMotherFirstName: blankToEmpty(record.brideMotherFirstName),
    brideMotherMiddleName: blankToEmpty(record.brideMotherMiddleName),
    brideMotherLastName: blankToEmpty(record.brideMotherLastName),
    brideMotherSuffix: blankToEmpty(record.brideMotherSuffix),
    principalSponsors: getSponsorsSource(record).map((item, index) => ({
      id: item.id || `sponsor-${index}`,
      firstName: blankToEmpty(item.firstName),
      middleName: blankToEmpty(item.middleName),
      lastName: blankToEmpty(item.lastName),
      suffix: blankToEmpty(item.suffix),
    })),
    requirements: normalizeSacramentRequirements(
      'marriage',
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

function validateParty(errors, form, prefix, label) {
  applyNameError(errors, `${prefix}FirstName`, form[`${prefix}FirstName`], true)
  applyNameError(errors, `${prefix}MiddleName`, form[`${prefix}MiddleName`], false)
  applyNameError(errors, `${prefix}LastName`, form[`${prefix}LastName`], true)
  applyNameError(errors, `${prefix}Suffix`, form[`${prefix}Suffix`], false)

  const birthDateField = `${prefix}BirthDate`
  const ageField = `${prefix}Age`

  if (!form[birthDateField]) {
    errors[birthDateField] = VALIDATION_MESSAGES.REQUIRED
  } else if (form.marriageDate && form[birthDateField] > form.marriageDate) {
    errors[birthDateField] =
      `${label}'s birth date cannot be later than the marriage date.`
  }

  if (!String(form[ageField] ?? '').trim()) {
    errors[ageField] = VALIDATION_MESSAGES.REQUIRED
  } else if (!/^\d+$/.test(String(form[ageField]).trim())) {
    errors[ageField] = VALIDATION_MESSAGES.INVALID_AGE
  }

  if (!isPlaceComplete(form[`${prefix}BirthPlacePlace`])) {
    errors[`${prefix}BirthPlacePlace`] = PLACE_REQUIRED_MESSAGE
  }

  if (!String(form[`${prefix}Nationality`] ?? '').trim()) {
    errors[`${prefix}Nationality`] = VALIDATION_MESSAGES.REQUIRED
  }

  if (!String(form[`${prefix}Occupation`] ?? '').trim()) {
    errors[`${prefix}Occupation`] = VALIDATION_MESSAGES.REQUIRED
  } else if (
    form[`${prefix}Occupation`] === 'Others' &&
    !String(form[`${prefix}OccupationOther`] ?? '').trim()
  ) {
    errors[`${prefix}OccupationOther`] = VALIDATION_MESSAGES.REQUIRED
  }

  if (!isResidencePlaceComplete(form[`${prefix}ResidencePlace`])) {
    errors[`${prefix}ResidencePlace`] = RESIDENCE_REQUIRED_MESSAGE
  }

  if (!String(form[`${prefix}CivilStatus`] ?? '').trim()) {
    errors[`${prefix}CivilStatus`] = VALIDATION_MESSAGES.REQUIRED
  }

  applyNameError(
    errors,
    `${prefix}FatherFirstName`,
    form[`${prefix}FatherFirstName`],
    true,
  )
  applyNameError(
    errors,
    `${prefix}FatherMiddleName`,
    form[`${prefix}FatherMiddleName`],
    false,
  )
  applyNameError(
    errors,
    `${prefix}FatherLastName`,
    form[`${prefix}FatherLastName`],
    true,
  )
  applyNameError(
    errors,
    `${prefix}FatherSuffix`,
    form[`${prefix}FatherSuffix`],
    false,
  )
  applyNameError(
    errors,
    `${prefix}MotherFirstName`,
    form[`${prefix}MotherFirstName`],
    true,
  )
  applyNameError(
    errors,
    `${prefix}MotherMiddleName`,
    form[`${prefix}MotherMiddleName`],
    false,
  )
  applyNameError(
    errors,
    `${prefix}MotherLastName`,
    form[`${prefix}MotherLastName`],
    true,
  )
  applyNameError(
    errors,
    `${prefix}MotherSuffix`,
    form[`${prefix}MotherSuffix`],
    false,
  )
}

function validateMarriageForm(
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
        'A marriage record with this year and number already exists.'
    }
  }

  applyNameError(errors, 'minister', form.minister, true)

  if (!form.marriageDate) {
    errors.marriageDate = VALIDATION_MESSAGES.REQUIRED
  } else {
    const dateError = validateSacramentDateForRecordType(
      form.marriageDate,
      recordTypeRule,
    )
    if (dateError) errors.marriageDate = dateError
  }

  if (!String(form.marriagePlace ?? '').trim()) {
    errors.marriagePlace = VALIDATION_MESSAGES.REQUIRED
  }

  validateParty(errors, form, 'groom', 'Groom')
  validateParty(errors, form, 'bride', 'Bride')

  const sponsorErrors = {}
  form.principalSponsors.forEach((sponsor) => {
    const rowErrors = {}
    applyNameError(rowErrors, 'firstName', sponsor.firstName, true)
    applyNameError(rowErrors, 'middleName', sponsor.middleName, false)
    applyNameError(rowErrors, 'lastName', sponsor.lastName, true)
    applyNameError(rowErrors, 'suffix', sponsor.suffix, false)
    if (Object.keys(rowErrors).length > 0) {
      sponsorErrors[sponsor.id] = rowErrors
    }
  })
  if (Object.keys(sponsorErrors).length > 0) {
    errors.principalSponsors = sponsorErrors
  }

  return errors
}

function MarriageRecordFormDialog({
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
      'MarriageRecordFormDialog requires workflow="old" or workflow="new".',
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
    } else {
      initialForm = {
        ...INITIAL_FORM,
        ...blankPartyForm('groom'),
        ...blankPartyForm('bride'),
        principalSponsors: [],
        marriageDate: defaultSacramentDate || '',
        time: defaultSacramentTime || '',
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
      validateMarriageForm(form, {
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

  function showSponsorFieldError(id, field) {
    const message = errors.principalSponsors?.[id]?.[field]
    return Boolean(
      (touched[`sponsor-${id}-${field}`] || submitAttempted) && message,
    )
  }

  function getSponsorFieldError(id, field) {
    return errors.principalSponsors?.[id]?.[field] || ''
  }

  function recomputeAges(next) {
    const groomAge = computeAgeAtMarriage(
      next.groomBirthDate,
      next.marriageDate,
    )
    const brideAge = computeAgeAtMarriage(
      next.brideBirthDate,
      next.marriageDate,
    )
    return {
      ...next,
      groomAge: groomAge == null ? next.groomAge : String(groomAge),
      brideAge: brideAge == null ? next.brideAge : String(brideAge),
    }
  }

  function handleChange(field) {
    return (event) => {
      const value = event.target.value
      setForm((prev) => {
        const next = { ...prev, [field]: value }
        if (
          field === 'marriageDate' ||
          field === 'groomBirthDate' ||
          field === 'brideBirthDate'
        ) {
          return recomputeAges(next)
        }
        return next
      })
      if (
        field === 'marriageDate' ||
        field === 'groomBirthDate' ||
        field === 'brideBirthDate'
      ) {
        setTouched((prev) => ({
          ...prev,
          [field]: true,
          groomAge: true,
          brideAge: true,
        }))
      }
    }
  }

  function handleBlur(field) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function handlePlaceChange(field) {
    return (value) => {
      setForm((prev) => ({ ...prev, [field]: value }))
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

  function handleAddSponsor() {
    setForm((prev) => ({
      ...prev,
      principalSponsors: [
        ...prev.principalSponsors,
        createSponsor(prev.principalSponsors.length),
      ],
    }))
  }

  function handleSponsorChange(id, field, value) {
    setForm((prev) => ({
      ...prev,
      principalSponsors: prev.principalSponsors.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function handleSponsorBlur(id, field) {
    setForm((prev) => ({
      ...prev,
      principalSponsors: prev.principalSponsors.map((item) => {
        if (item.id !== id) return item
        const formatted = toProperCase(item[field])
        if (formatted === item[field]) return item
        return { ...item, [field]: formatted }
      }),
    }))
    setTouched((prev) => ({ ...prev, [`sponsor-${id}-${field}`]: true }))
  }

  function handleRemoveSponsor(id) {
    setForm((prev) => ({
      ...prev,
      principalSponsors: prev.principalSponsors.filter((item) => item.id !== id),
    }))
  }

  function handleClose() {
    requestClose(() => {
      clearBaseline()
      setForm({
        ...INITIAL_FORM,
        ...blankPartyForm('groom'),
        ...blankPartyForm('bride'),
        principalSponsors: [],
      })
      setTouched({})
      setSubmitAttempted(false)
      onClose?.()
    })
  }

  async function handleSave() {
    setSubmitAttempted(true)
    if (!canSave || saving) return

    const groomBirthPlace = formatPlace(form.groomBirthPlacePlace)
    const brideBirthPlace = formatPlace(form.brideBirthPlacePlace)
    const groomResidence = formatPlace(form.groomResidencePlace)
    const brideResidence = formatPlace(form.brideResidencePlace)

    const payload = {
      recordType: isEdit
        ? record?.recordTypeValue || record?.recordType || 'old'
        : workflow,
      minister: form.minister.trim(),
      marriageDate: form.marriageDate,
      time: form.time.trim(),
      marriagePlace: form.marriagePlace.trim(),
      remarks: form.remarks.trim(),
      groomFirstName: form.groomFirstName.trim(),
      groomMiddleName: form.groomMiddleName.trim(),
      groomLastName: form.groomLastName.trim(),
      groomSuffix: form.groomSuffix.trim(),
      groomBirthDate: form.groomBirthDate,
      groomAge: Number(form.groomAge),
      groomBirthPlace,
      groomBirthPlacePlace: form.groomBirthPlacePlace,
      groomNationality: form.groomNationality.trim(),
      groomOccupation: form.groomOccupation.trim(),
      groomOccupationOther:
        form.groomOccupation === 'Others'
          ? form.groomOccupationOther.trim()
          : '',
      groomResidence,
      groomResidencePlace: form.groomResidencePlace,
      groomCivilStatus: form.groomCivilStatus.trim(),
      groomFatherFirstName: form.groomFatherFirstName.trim(),
      groomFatherMiddleName: form.groomFatherMiddleName.trim(),
      groomFatherLastName: form.groomFatherLastName.trim(),
      groomFatherSuffix: form.groomFatherSuffix.trim(),
      groomMotherFirstName: form.groomMotherFirstName.trim(),
      groomMotherMiddleName: form.groomMotherMiddleName.trim(),
      groomMotherLastName: form.groomMotherLastName.trim(),
      groomMotherSuffix: form.groomMotherSuffix.trim(),
      brideFirstName: form.brideFirstName.trim(),
      brideMiddleName: form.brideMiddleName.trim(),
      brideLastName: form.brideLastName.trim(),
      brideSuffix: form.brideSuffix.trim(),
      brideBirthDate: form.brideBirthDate,
      brideAge: Number(form.brideAge),
      brideBirthPlace,
      brideBirthPlacePlace: form.brideBirthPlacePlace,
      brideNationality: form.brideNationality.trim(),
      brideOccupation: form.brideOccupation.trim(),
      brideOccupationOther:
        form.brideOccupation === 'Others'
          ? form.brideOccupationOther.trim()
          : '',
      brideResidence,
      brideResidencePlace: form.brideResidencePlace,
      brideCivilStatus: form.brideCivilStatus.trim(),
      brideFatherFirstName: form.brideFatherFirstName.trim(),
      brideFatherMiddleName: form.brideFatherMiddleName.trim(),
      brideFatherLastName: form.brideFatherLastName.trim(),
      brideFatherSuffix: form.brideFatherSuffix.trim(),
      brideMotherFirstName: form.brideMotherFirstName.trim(),
      brideMotherMiddleName: form.brideMotherMiddleName.trim(),
      brideMotherLastName: form.brideMotherLastName.trim(),
      brideMotherSuffix: form.brideMotherSuffix.trim(),
      principalSponsors: form.principalSponsors.map((item) => ({
        firstName: item.firstName.trim(),
        middleName: item.middleName.trim(),
        lastName: item.lastName.trim(),
        suffix: item.suffix.trim(),
      })),
      requirements: normalizeSacramentRequirements(
        'marriage',
        form.requirements,
      ),
    }

    if (isEdit || isOldRecord) {
      payload.recordYear = Number(form.recordYear)
      payload.recordNumber = Number(form.recordNumber)
    }

    if (onSave) {
      await onSave(payload, { mode, record })
      clearBaseline()
      return
    }

    clearBaseline()
    onClose?.()
  }

  const nameFieldProps = {
    form,
    errors,
    showError,
    handleChange,
    handleBlur,
    saving,
  }

  function renderPartyFields(prefix, title) {
    const birthDateField = `${prefix}BirthDate`
    const ageField = `${prefix}Age`
    const nationalityField = `${prefix}Nationality`
    const occupationField = `${prefix}Occupation`
    const occupationOtherField = `${prefix}OccupationOther`
    const civilStatusField = `${prefix}CivilStatus`
    const birthPlaceField = `${prefix}BirthPlacePlace`
    const residenceField = `${prefix}ResidencePlace`

    return (
      <>
        <FormFieldSubheading spaced={prefix === 'bride'}>{title}</FormFieldSubheading>
        <NameField
          label="First Name"
          field={`${prefix}FirstName`}
          required
          {...nameFieldProps}
        />
        <NameField
          label="Middle Name"
          field={`${prefix}MiddleName`}
          {...nameFieldProps}
        />
        <NameField
          label="Last Name"
          field={`${prefix}LastName`}
          required
          {...nameFieldProps}
        />
        <NameField label="Suffix" field={`${prefix}Suffix`} {...nameFieldProps} />

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Birth Date"
            type="date"
            value={form[birthDateField]}
            onChange={handleChange(birthDateField)}
            onBlur={handleBlur(birthDateField)}
            error={showError(birthDateField)}
            helperText={showError(birthDateField) ? errors[birthDateField] : ' '}
            fullWidth
            required
            disabled={saving}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Age"
            value={form[ageField]}
            fullWidth
            required
            disabled
            error={showError(ageField)}
            helperText={
              showError(ageField)
                ? errors[ageField]
                : 'Auto-computed from birth date.'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl
            fullWidth
            required
            error={showError(nationalityField)}
            disabled={saving}
          >
            <InputLabel id={`marriage-${prefix}-nationality`}>
              Nationality
            </InputLabel>
            <Select
              labelId={`marriage-${prefix}-nationality`}
              label="Nationality"
              value={form[nationalityField]}
              onChange={handleChange(nationalityField)}
              onBlur={handleBlur(nationalityField)}
            >
              {MARRIAGE_NATIONALITY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {showError(nationalityField) ? errors[nationalityField] : ' '}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl
            fullWidth
            required
            error={showError(civilStatusField)}
            disabled={saving}
          >
            <InputLabel id={`marriage-${prefix}-civil-status`}>
              Civil Status
            </InputLabel>
            <Select
              labelId={`marriage-${prefix}-civil-status`}
              label="Civil Status"
              value={form[civilStatusField]}
              onChange={handleChange(civilStatusField)}
              onBlur={handleBlur(civilStatusField)}
            >
              {CIVIL_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {showError(civilStatusField) ? errors[civilStatusField] : ' '}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl
            fullWidth
            required
            error={showError(occupationField)}
            disabled={saving}
          >
            <InputLabel id={`marriage-${prefix}-occupation`}>
              Occupation
            </InputLabel>
            <Select
              labelId={`marriage-${prefix}-occupation`}
              label="Occupation"
              value={form[occupationField]}
              onChange={handleChange(occupationField)}
              onBlur={handleBlur(occupationField)}
            >
              {MARRIAGE_OCCUPATION_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {showError(occupationField) ? errors[occupationField] : ' '}
            </FormHelperText>
          </FormControl>
        </Grid>
        {form[occupationField] === 'Others' ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Specify Occupation"
              value={form[occupationOtherField]}
              onChange={handleChange(occupationOtherField)}
              onBlur={handleBlur(occupationOtherField)}
              error={showError(occupationOtherField)}
              helperText={
                showError(occupationOtherField)
                  ? errors[occupationOtherField]
                  : ' '
              }
              fullWidth
              required
              disabled={saving}
            />
          </Grid>
        ) : (
          <Grid size={{ xs: 12, sm: 6 }} />
        )}

        <FormFieldSubheading>Birth Place</FormFieldSubheading>
        <PlaceSelect
          value={form[birthPlaceField]}
          onChange={handlePlaceChange(birthPlaceField)}
          onBlur={handleBlur(birthPlaceField)}
          required
          error={showError(birthPlaceField)}
          helperText={
            showError(birthPlaceField) ? errors[birthPlaceField] : ' '
          }
          disabled={saving}
          idPrefix={`marriage-${prefix}-birth-place`}
        />

        <FormFieldSubheading spaced>Residence</FormFieldSubheading>
        <ResidencePlaceSelect
          value={form[residenceField]}
          onChange={handlePlaceChange(residenceField)}
          onBlur={handleBlur(residenceField)}
          required
          error={showError(residenceField)}
          helperText={
            showError(residenceField) ? errors[residenceField] : ' '
          }
          disabled={saving}
          idPrefix={`marriage-${prefix}-residence`}
        />
      </>
    )
  }

  function renderParents(prefix, title) {
    return (
      <>
        <FormFieldSubheading spaced={prefix === 'bride'}>{title}</FormFieldSubheading>
        <FormFieldSubheading>Father&apos;s Name</FormFieldSubheading>
        <NameField
          label="First Name"
          field={`${prefix}FatherFirstName`}
          required
          {...nameFieldProps}
        />
        <NameField
          label="Middle Name"
          field={`${prefix}FatherMiddleName`}
          {...nameFieldProps}
        />
        <NameField
          label="Last Name"
          field={`${prefix}FatherLastName`}
          required
          {...nameFieldProps}
        />
        <NameField
          label="Suffix"
          field={`${prefix}FatherSuffix`}
          {...nameFieldProps}
        />

        <FormFieldSubheading spaced>
          Mother&apos;s Maiden Name
        </FormFieldSubheading>
        <NameField
          label="First Name"
          field={`${prefix}MotherFirstName`}
          required
          {...nameFieldProps}
        />
        <NameField
          label="Middle Name"
          field={`${prefix}MotherMiddleName`}
          {...nameFieldProps}
        />
        <NameField
          label="Last Name"
          field={`${prefix}MotherLastName`}
          required
          {...nameFieldProps}
        />
        <NameField
          label="Suffix"
          field={`${prefix}MotherSuffix`}
          {...nameFieldProps}
        />
      </>
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
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
          {isEdit ? 'Edit Marriage Record' : 'Add Marriage Record'}
          <IconButton
            aria-label="Close"
            onClick={handleClose}
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
                  disabled={isEdit || saving}
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
                  disabled={isEdit || saving}
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
                key={`marriage-minister-${open}-${mode}-${record?.id || 'new'}`}
                label="Minister"
                assignment="Marriage"
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
                label="Marriage Date"
                type="date"
                value={form.marriageDate}
                onChange={handleChange('marriageDate')}
                onBlur={handleBlur('marriageDate')}
                error={showError('marriageDate')}
                helperText={
                  showError('marriageDate') ? errors.marriageDate : ' '
                }
                fullWidth
                required
                disabled={saving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimeSelect
                id="marriage-time"
                value={form.time}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, time: value }))
                }
                onBlur={handleBlur('time')}
                helperText=" "
                disabled={saving}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Marriage Place"
                value={form.marriagePlace}
                onChange={handleChange('marriagePlace')}
                onBlur={handleBlur('marriagePlace')}
                error={showError('marriagePlace')}
                helperText={
                  showError('marriagePlace') ? errors.marriagePlace : ' '
                }
                fullWidth
                required
                disabled={saving}
              />
            </Grid>
          </FormSection>

          <FormSection title="Person Information" showDivider>
            {renderPartyFields('groom', 'Groom')}
            {renderPartyFields('bride', 'Bride')}
          </FormSection>

          <FormSection title="Parents Information" showDivider>
            {renderParents('groom', "Groom's Parents")}
            {renderParents('bride', "Bride's Parents")}
          </FormSection>

          <FormSection title="Sponsors" showDivider>
            <Grid size={{ xs: 12 }}>
              <Stack spacing={2.5}>
                {form.principalSponsors.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No sponsors added yet.
                  </Typography>
                )}

                {form.principalSponsors.map((sponsor, index) => (
                  <Box
                    key={sponsor.id}
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
                        Sponsor {index + 1}
                      </Typography>
                      <IconButton
                        aria-label={`Remove sponsor ${index + 1}`}
                        onClick={() => handleRemoveSponsor(sponsor.id)}
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
                        { field: 'firstName', label: 'First Name', required: true },
                        { field: 'middleName', label: 'Middle Name', required: false },
                        { field: 'lastName', label: 'Last Name', required: true },
                        { field: 'suffix', label: 'Suffix', required: false },
                      ].map(({ field, label, required }) => (
                        <Grid key={field} size={{ xs: 12, sm: 6, md: 3 }}>
                          <TextField
                            label={label}
                            value={sponsor[field]}
                            onChange={(event) =>
                              handleSponsorChange(
                                sponsor.id,
                                field,
                                event.target.value,
                              )
                            }
                            onBlur={() => handleSponsorBlur(sponsor.id, field)}
                            error={showSponsorFieldError(sponsor.id, field)}
                            helperText={
                              showSponsorFieldError(sponsor.id, field)
                                ? getSponsorFieldError(sponsor.id, field)
                                : ' '
                            }
                            fullWidth
                            required={required}
                            disabled={saving}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}

                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddSponsor}
                    disabled={saving}
                    sx={{ borderRadius: 3 }}
                  >
                    Add Sponsor
                  </Button>
                </Box>
              </Stack>
            </Grid>
          </FormSection>

          <FormSection title="Requirements Checklist" showDivider>
            <RequirementsChecklist
              sacrament="marriage"
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
            onClick={handleClose}
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
              sacrament="marriage"
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
            {saving ? 'Saving…' : 'Save'}
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

export function MarriageOldRecordFormDialog(props) {
  return <MarriageRecordFormDialog {...props} workflow="old" />
}

export function MarriageNewRecordFormDialog(props) {
  return <MarriageRecordFormDialog {...props} workflow="new" mode="add" />
}

export default MarriageOldRecordFormDialog
