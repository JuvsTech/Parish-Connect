import { getBaptismImportForm, validateBaptismForm, LEGITIMACY_OPTIONS } from '../components/BaptismRecordFormDialog'
import { getConfirmationImportForm, validateConfirmationForm } from '../components/ConfirmationRecordFormDialog'
import { getMarriageImportForm, validateMarriageForm } from '../components/MarriageRecordFormDialog'
import { getDeathImportForm, validateDeathForm, STATUS_OPTIONS, RELATIONSHIP_OPTIONS, RECEIVED_LAST_SACRAMENTS_OPTIONS } from '../components/DeathRecordFormDialog'
import { getConversionImportForm, validateConversionForm } from '../components/ConversionRecordFormDialog'
import { buildBaptismDocument, validateBaptismPayload } from './baptismService'
import { buildConfirmationDocument, validateConfirmationPayload } from './confirmationService'
import { buildMarriageDocument, validateMarriagePayload } from './marriageService'
import { buildDeathDocument, validateDeathPayload } from './deathService'
import { buildConversionDocument, validateConversionPayload } from './conversionService'
import { COLLECTIONS } from '../constants'
import { computeAgeFromDateOfBirth, toLocalDate } from '../utils/date'
import { GENDER_OPTIONS, normalizeGender } from '../constants/gender'
import { CIVIL_STATUS_OPTIONS, MARRIAGE_NATIONALITY_OPTIONS, MARRIAGE_OCCUPATION_OPTIONS } from '../constants/marriageOptions'
import { EMPTY_PLACE, formatPlace, getRegions, getAllProvinces, getCitiesByProvince, getBarangaysByCity } from '../utils/philippinePlaces'

const manualOptions = { requireManualRecordNumber: true, recordTypeRule: 'old' }
const definitions = {
  baptism: { title: 'Baptism', initial: getBaptismImportForm, validate: f => validateBaptismForm(f, 'old', manualOptions), build: buildBaptismDocument, validatePayload: validateBaptismPayload },
  confirmation: { title: 'Confirmation', initial: getConfirmationImportForm, validate: f => validateConfirmationForm(f, [], undefined, manualOptions), build: buildConfirmationDocument, validatePayload: validateConfirmationPayload },
  marriage: { title: 'Marriage', initial: getMarriageImportForm, validate: f => validateMarriageForm(f, manualOptions), build: buildMarriageDocument, validatePayload: validateMarriagePayload },
  death: { title: 'Death', initial: getDeathImportForm, validate: f => validateDeathForm(f, manualOptions), build: buildDeathDocument, validatePayload: validateDeathPayload },
  conversion: { title: 'Conversion', initial: getConversionImportForm, validate: f => validateConversionForm(f, manualOptions), build: buildConversionDocument, validatePayload: validateConversionPayload },
}
const labels = { recordNumber: 'Record No.', recordYear: 'Record Year', bookNumber: 'Book No.', lineNumber: 'Line No.', pageNumber: 'Page No.', status: 'Civil / Personal Status', observanda: 'Remarks (Observanda)', placeOfBirthPlace: 'Birthplace', parentsResidencePlace: 'Parents Residence', residencePlace: 'Residence', groomResidencePlace: 'Groom Residence', brideResidencePlace: 'Bride Residence' }
export const fieldLabel = key => labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
function choices(key) {
  if (key === 'gender') return GENDER_OPTIONS
  if (key === 'legitimacyStatus') return LEGITIMACY_OPTIONS
  if (key === 'status') return STATUS_OPTIONS
  if (key === 'relationship') return RELATIONSHIP_OPTIONS
  if (key === 'receivedLastSacraments') return RECEIVED_LAST_SACRAMENTS_OPTIONS
  if (key.endsWith('Nationality')) return MARRIAGE_NATIONALITY_OPTIONS
  if (key.endsWith('Occupation')) return MARRIAGE_OCCUPATION_OPTIONS
  if (key.endsWith('CivilStatus')) return CIVIL_STATUS_OPTIONS
  return null
}

const nameLabels = { child: 'Child Full Name', confirmand: 'Confirmand Full Name', groom: 'Groom Full Name', bride: 'Bride Full Name', father: "Father's Full Name", mother: "Mother's Full Name", maleSponsor: 'Male Sponsor Full Name', femaleSponsor: 'Female Sponsor Full Name', relatedPerson: 'Related Person Full Name', groomFather: "Groom Father's Full Name", groomMother: "Groom Mother's Full Name", brideFather: "Bride Father's Full Name", brideMother: "Bride Mother's Full Name" }
const nameKey = (prefix, part) => prefix ? prefix + part[0].toUpperCase() + part.slice(1) : part
export function getImportConfig(module) {
  const config = definitions[module]
  if (!config) throw new Error('Unsupported sacrament.')
  const initial = config.initial()
  const empty = structuredClone(initial)
  Object.keys(empty).forEach(k => { if (typeof empty[k] === 'string') empty[k] = '' })
  const required = config.validate(empty)
  const columns = []
  const keys = ['recordNumber','recordYear','bookNumber','lineNumber','pageNumber', ...Object.keys(initial).filter(k => !['recordNumber','recordYear','bookNumber','lineNumber','pageNumber','time','requirements'].includes(k))]
  for (const key of keys) {
    if (/MiddleName$|LastName$|Suffix$/.test(key) || ['middleName','lastName','suffix'].includes(key)) continue
    if (module === 'marriage' && ['groomAge','brideAge','groomOccupationOther','brideOccupationOther'].includes(key)) continue
    const value = initial[key]
    if (key === 'firstName' || key.endsWith('FirstName')) {
      const prefix = key === 'firstName' ? '' : key.slice(0,-9)
      const label = nameLabels[prefix] || (module === 'death' ? 'Deceased Full Name' : 'Convert Full Name')
      columns.push({ key: nameKey(prefix,'fullName'), prefix, label, type: 'name', required: Boolean(required[key]), help: 'Enter the complete name. Review the given names and surname in Preview. For an unusual surname, you may write Surname, Given Names.' })
    } else if (Array.isArray(value)) {
      columns.push({ key, label: key === 'godparents' ? 'Godparents' : 'Principal Sponsors', type: 'people', required: false, help: 'Separate people with semicolons. Example: Mark Juven Neypes; Renz Dela Cruz; Ana Reyes. Leave blank if unavailable.' })
    } else if (value && typeof value === 'object') {
      columns.push({ key, label: fieldLabel(key).replace(/Place Place$/, 'Birthplace').replace('Birth Birthplace','Birthplace'), type: 'place', required: Boolean(required[key]), help: 'Barangay, City or Municipality, Province. Region is optional. Example: Poblacion, Bani, Pangasinan. Unmatched or ambiguous places must be reviewed; no address parts are discarded.' })
    } else {
      const type = /Date$/.test(key) || ['dateOfDeath','dateOfReception'].includes(key) ? 'date' : ['recordNumber','recordYear','lineNumber','pageNumber','age'].includes(key) ? 'number' : 'text'
      columns.push({ key, label: fieldLabel(key), type, required: Boolean(required[key]), options: key.endsWith('Occupation') ? null : choices(key), help: type === 'date' ? 'YYYY-MM-DD or an Excel date without a time.' : key === 'bookNumber' ? 'Optional Roman numeral, for example IV.' : key.endsWith('Occupation') ? 'Enter the occupation as written in the book.' : '' })
    }
  }
  return { ...config, module, collection: COLLECTIONS[module.toUpperCase()], columns: columns.map(c => ({ ...c, header: c.label + (c.required ? ' *' : '') })) }
}
const same = (a,b) => String(a || '').trim().toLocaleLowerCase() === String(b || '').trim().toLocaleLowerCase()

// Keep all given/middle-name words together instead of guessing which is a middle name.
// The preview exposes this grouping; existing name fields and display helpers retain every word.
export function splitHistoricalName(value) {
  const original = String(value || '').trim().replace(/\s+/g, ' ')
  if (!original) return { firstName: '', middleName: '', lastName: '', suffix: '' }
  if ([';', '{', '}', '[', ']'].some(character => original.includes(character))) throw new Error('Enter one complete name here. Separate people only in Godparents or Principal Sponsors.')
  let text = original, suffix = ''
  const suffixMatch = text.match(/(?:\s+|,\s*)(Jr\.?|Sr\.?|II|III|IV)$/i)
  if (suffixMatch) { suffix = suffixMatch[1]; text = text.slice(0, suffixMatch.index).trim() }
  let firstName, lastName
  if (text.includes(',')) {
    const parts = text.split(',').map(p => p.trim())
    if (parts.length !== 2 || parts.some(p => !p)) throw new Error('Use a full name, or Surname, Given Names.')
    ;[lastName,firstName] = parts
  } else {
    const words = text.split(' ')
    if (words.length < 2) throw new Error('Enter given name and surname. Do not invent a missing name.')
    let surnameStart = words.length - 1
    while (surnameStart > 1 && /^(de|del|dela|la|las|los|san|santa|santo|van|von)$/i.test(words[surnameStart-1])) surnameStart--
    firstName = words.slice(0,surnameStart).join(' ')
    lastName = words.slice(surnameStart).join(' ')
  }
  return { firstName, middleName: '', lastName, suffix }
}
const cityName = value => String(value || '').trim().toLowerCase().replace(/^city of\s+/, '').replace(/\s+city$/, '')
function resolveImportPlace(value) {
  const parts = String(value || '').split(',').map(part => part.trim())
  if (![3,4].includes(parts.length) || parts.some(p => !p)) throw new Error('Enter Barangay, City / Municipality, Province (and optionally Region). Extra or missing address parts need manual review.')
  const [barangayName, municipality, provinceName, regionName] = parts
  const provinces = getAllProvinces().filter(p => same(p.name,provinceName))
  if (provinces.length !== 1) throw new Error('Province not uniquely recognized. Check its spelling against the record form.')
  const province = provinces[0]
  const region = getRegions().find(r => String(r.reg_code) === String(province.reg_code))
  const cities = getCitiesByProvince(province.prov_code).filter(c => cityName(c.name) === cityName(municipality))
  if (cities.length !== 1 || !region || (regionName && !same(region.name,regionName))) throw new Error('City / Municipality or Region does not match the Province. Review the full address.')
  const city = cities[0]
  const barangays = getBarangaysByCity(city.mun_code).filter(b => same(b.name,barangayName))
  if (barangays.length !== 1) throw new Error('Barangay not uniquely recognized in this City / Municipality. Review the full address.')
  const barangay = barangays[0]
  return { ...EMPTY_PLACE, regionCode: String(region.reg_code), regionName: region.name, provinceCode: String(province.prov_code), provinceName: province.name, cityCode: String(city.mun_code), cityName: city.name, barangayCode: String(barangay.brgy_code || ''), barangayName: barangay.name }
}
export function mapImportRow(config, values) {
  const form = config.initial(), errors = [], mapping = {}
  const describe = person => 'Given names: ' + person.firstName + '; Surname: ' + person.lastName + (person.suffix ? '; Suffix: ' + person.suffix : '')
  for (const column of config.columns) {
    let value = String(values[column.key] ?? '').trim()
    try {
      if (column.type === 'name') {
        const person = splitHistoricalName(value)
        for (const [part, text] of Object.entries(person)) form[nameKey(column.prefix,part)] = text
        if (value) mapping[column.key] = describe(person)
      } else if (column.type === 'people') {
        const names = value ? value.split(';') : []
        if (names.some(name => !name.trim())) throw new Error('Enter one complete name between semicolons; remove empty entries.')
        form[column.key] = names.map((name,index) => ({ ...splitHistoricalName(name), id: String(index+1), ...(column.key === 'godparents' ? { residence: '' } : {}) }))
        mapping[column.key] = form[column.key].map((person,index) => (index+1) + '. ' + describe(person)).join('\n')
      } else if (column.type === 'place') {
        if (value) { form[column.key] = resolveImportPlace(value); mapping[column.key] = 'Matched: ' + formatPlace(form[column.key]) }
      } else {
        if (column.options && value) {
          const match = column.options.find(option => same(option,value))
          if (!match) throw new Error('Use one of: ' + column.options.join(', '))
          value = match
        }
        if (column.key.endsWith('Occupation') && value) {
          const match = MARRIAGE_OCCUPATION_OPTIONS.find(option => same(option,value))
          if (!match) { form[column.key + 'Other'] = value; value = 'Others' }
        }
        form[column.key] = value
      }
    } catch (error) { errors.push(column.label + ': ' + error.message) }
  }
  if (config.module === 'marriage') for (const prefix of ['groom','bride']) {
    const age = form.marriageDate ? computeAgeFromDateOfBirth(form[prefix+'BirthDate'], toLocalDate(form.marriageDate)) : null
    form[prefix+'Age'] = age == null ? '' : String(age)
    if (age != null) mapping[prefix+'BirthDate'] = 'Age at marriage: ' + age
  }
  form.bookNumber = form.bookNumber.toUpperCase()
  if ('gender' in form) form.gender = normalizeGender(form.gender)
  for (const [key, reason] of Object.entries(config.validate(form))) {
    if (key === 'godparents' || key === 'principalSponsors') {
      const label = key === 'godparents' ? 'Godparent' : 'Principal Sponsor'
      for (const [number, fields] of Object.entries(reason)) for (const [part,message] of Object.entries(fields)) errors.push(label + ' ' + number + ' ' + fieldLabel(part) + ': ' + message)
    } else {
      const column = config.columns.find(c => c.key === key || c.type === 'name' && ['firstName','middleName','lastName','suffix'].some(part => nameKey(c.prefix,part) === key))
      errors.push((column?.label || fieldLabel(key)) + ': ' + reason)
    }
  }
  let document = null
  if (!errors.length) {
    const payload = { ...form, recordType: 'old' }
    if (config.module === 'baptism') { payload.placeOfBirth = formatPlace(form.placeOfBirthPlace); payload.parentsResidence = formatPlace(form.parentsResidencePlace) }
    if (config.module === 'marriage') for (const p of ['groom','bride']) {
      payload[`${p}BirthPlace`] = formatPlace(form[`${p}BirthPlacePlace`])
      payload[`${p}Residence`] = formatPlace(form[`${p}ResidencePlace`])
      if (form[`${p}Occupation`] !== 'Others') payload[`${p}OccupationOther`] = ''
    }
    if (form.residencePlace) { payload.province = form.residencePlace.provinceName; payload.municipality = form.residencePlace.cityName; payload.barangay = form.residencePlace.barangayName }
    try {
      document = config.build(payload)
      // A historical entry is not a pending appointment. Missing lifecycle status
      // is already supported by Baptism reads/edits; do not infer completion either.
      if (config.module === 'baptism') delete document.status
      config.validatePayload(document)
    }
    catch (error) { errors.push(error.message) }
  }
  return { document, errors, mapping }
}
