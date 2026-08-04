import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import {
  CERTIFICATE_CONFIRMATION_PARISH_CHURCH,
  CERTIFICATE_DIOCESE,
  CERTIFICATE_IMPLEMENTED,
  CERTIFICATE_PARISH_ADDRESS,
  CERTIFICATE_PARISH_NAME,
  CERTIFICATE_RECORD_PARISH,
  CERTIFICATE_TITLES,
  CERTIFICATE_TYPES,
} from '../constants/certificates'
import { getBaptismRecord } from './baptismService'
import { getConfirmationRecordById } from './confirmationService'
import { getMarriageRecordById } from './marriageService'
import { getDeathRecordById } from './deathService'
import {
  formatBaptismRecordNumber,
  formatConfirmationRecordNumber,
  formatDeathRecordNumber,
  formatMarriageRecordNumber,
} from '../utils/recordNumber'
import {
  formatPersonName,
  formatDeathResidence,
  getBrideDisplayName,
  getChildDisplayName,
  getConfirmandDisplayName,
  getDeceasedDisplayName,
  getFatherDisplayName,
  getFemaleSponsorDisplayName,
  getGodparentDisplayName,
  getGroomDisplayName,
  getMaleSponsorDisplayName,
  getMotherDisplayName,
  getRelatedPersonDisplayName,
} from '../utils/personName'
import {
  formatCertificateIssuedDate,
  formatCertificateLongDate,
} from '../utils/certificateDate'
import dioceseLogoUrl from '../assets/certificates/diocese-logo.png'
import parishSealUrl from '../assets/certificates/parish-seal.png'

function blank(value) {
  const text = String(value ?? '').trim()
  return text && text !== '—' ? text : ''
}

function sharedChrome(title) {
  return {
    diocese: CERTIFICATE_DIOCESE,
    parishName: CERTIFICATE_PARISH_NAME,
    parishAddress: CERTIFICATE_PARISH_ADDRESS,
    title,
    recordParishName: CERTIFICATE_RECORD_PARISH,
    logos: {
      diocese: dioceseLogoUrl,
      parishSeal: parishSealUrl,
    },
  }
}

function issuedFields(issuedAt) {
  const issued = formatCertificateLongDate(issuedAt)
  return {
    issuedDayOrdinal: issued.dayOrdinal,
    issuedMonthYear: issued.monthYear,
    dateIssued: formatCertificateIssuedDate(issuedAt),
  }
}

/**
 * Removes a leading clerical title when the template already says
 * "Reverend Father" / "Rev. Fr." / "Most Rev. Fr.".
 */
export function stripLeadingClericalTitle(minister) {
  return String(minister || '')
    .trim()
    .replace(
      /^(the\s+)?(most\s+rev\.?\s*(fr\.?)?|rev\.?\s*fr\.?|fr\.?|reverend\s+father|rev\.?)\s+/i,
      '',
    )
    .trim()
}

function mapSponsors(godparents = []) {
  const names = (Array.isArray(godparents) ? godparents : [])
    .map((item) => getGodparentDisplayName(item))
    .filter((name) => name && name !== '—')

  return {
    sponsor1: names[0] || '',
    sponsor2: names[1] || '',
    sponsorsExtra: names.slice(2),
  }
}

function ageLabel(age) {
  const value = String(age ?? '').trim()
  if (!value) return ''
  return /\byears?\b/i.test(value) ? value : `${value} years`
}

function civilStatusLabel(value) {
  const text = blank(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * @param {object} record
 * @param {{ issuedAt?: Date }} [options]
 */
export function mapBaptismRecordToCertificate(record, options = {}) {
  if (!record) {
    throw new Error('Baptism record is required to generate a certificate.')
  }

  const issuedAt = options.issuedAt || new Date()
  const birth = formatCertificateLongDate(
    record.dateOfBirth ?? record.birthDate,
  )
  const baptism = formatCertificateLongDate(record.baptismDate)
  const sponsors = mapSponsors(record.godparents)

  return {
    type: CERTIFICATE_TYPES.BAPTISM,
    ...sharedChrome(CERTIFICATE_TITLES.baptism),
    recordId: record.id || '',
    recordNumber: blank(
      formatBaptismRecordNumber(record.recordYear, record.recordNumber),
    ),
    childName: blank(getChildDisplayName(record)),
    fatherName: blank(getFatherDisplayName(record)),
    motherName: blank(getMotherDisplayName(record)),
    birthDayOrdinal: birth.dayOrdinal,
    birthMonthYear: birth.monthYear,
    baptismDayOrdinal: baptism.dayOrdinal,
    baptismMonthYear: baptism.monthYear,
    ministerName: blank(stripLeadingClericalTitle(record.minister)),
    sponsor1: sponsors.sponsor1,
    sponsor2: sponsors.sponsor2,
    sponsorsExtra: sponsors.sponsorsExtra,
    ...issuedFields(issuedAt),
  }
}

/**
 * @param {object} record
 * @param {{ issuedAt?: Date }} [options]
 */
export function mapConfirmationRecordToCertificate(record, options = {}) {
  if (!record) {
    throw new Error(
      'Confirmation record is required to generate a certificate.',
    )
  }

  const issuedAt = options.issuedAt || new Date()
  const birth = formatCertificateLongDate(
    record.dateOfBirth ?? record.birthDate,
  )
  const confirmation = formatCertificateLongDate(record.confirmationDate)

  return {
    type: CERTIFICATE_TYPES.CONFIRMATION,
    ...sharedChrome(CERTIFICATE_TITLES.confirmation),
    confirmationParishChurch: CERTIFICATE_CONFIRMATION_PARISH_CHURCH,
    recordId: record.id || '',
    recordNumber: blank(
      formatConfirmationRecordNumber(record.recordYear, record.recordNumber),
    ),
    confirmandName: blank(getConfirmandDisplayName(record)),
    fatherName: blank(getFatherDisplayName(record)),
    motherName: blank(getMotherDisplayName(record)),
    placeOfBaptism: blank(record.placeOfBaptism ?? record.placeOfBirth),
    birthDayOrdinal: birth.dayOrdinal,
    birthMonthYear: birth.monthYear,
    confirmationDayOrdinal: confirmation.dayOrdinal,
    confirmationMonthYear: confirmation.monthYear,
    ministerName: blank(stripLeadingClericalTitle(record.minister)),
    sponsor1: blank(getMaleSponsorDisplayName(record)),
    sponsor2: blank(getFemaleSponsorDisplayName(record)),
    ...issuedFields(issuedAt),
  }
}

/**
 * @param {object} record
 * @param {{ issuedAt?: Date }} [options]
 */
export function mapMarriageRecordToCertificate(record, options = {}) {
  if (!record) {
    throw new Error('Marriage record is required to generate a certificate.')
  }

  const issuedAt = options.issuedAt || new Date()
  const marriage = formatCertificateLongDate(record.marriageDate)
  const witnesses = (
    Array.isArray(record.principalSponsors)
      ? record.principalSponsors
      : Array.isArray(record.sponsors)
        ? record.sponsors
        : []
  )
    .map((item) => getGodparentDisplayName(item))
    .filter((name) => name && name !== '—')

  return {
    type: CERTIFICATE_TYPES.MARRIAGE,
    ...sharedChrome(CERTIFICATE_TITLES.marriage),
    recordId: record.id || '',
    recordNumber: blank(
      formatMarriageRecordNumber(record.recordYear, record.recordNumber),
    ),
    groomName: blank(getGroomDisplayName(record)),
    brideName: blank(getBrideDisplayName(record)),
    groomCivilStatus: civilStatusLabel(record.groomCivilStatus),
    brideCivilStatus: civilStatusLabel(record.brideCivilStatus),
    groomAgeLabel: ageLabel(record.groomAge),
    brideAgeLabel: ageLabel(record.brideAge),
    groomFatherName: blank(
      formatPersonName({
        firstName: record.groomFatherFirstName,
        middleName: record.groomFatherMiddleName,
        lastName: record.groomFatherLastName,
        suffix: record.groomFatherSuffix,
      }),
    ),
    groomMotherName: blank(
      formatPersonName({
        firstName: record.groomMotherFirstName,
        middleName: record.groomMotherMiddleName,
        lastName: record.groomMotherLastName,
        suffix: record.groomMotherSuffix,
      }),
    ),
    brideFatherName: blank(
      formatPersonName({
        firstName: record.brideFatherFirstName,
        middleName: record.brideFatherMiddleName,
        lastName: record.brideFatherLastName,
        suffix: record.brideFatherSuffix,
      }),
    ),
    brideMotherName: blank(
      formatPersonName({
        firstName: record.brideMotherFirstName,
        middleName: record.brideMotherMiddleName,
        lastName: record.brideMotherLastName,
        suffix: record.brideMotherSuffix,
      }),
    ),
    marriageDayOrdinal: marriage.dayOrdinal,
    marriageMonthYear: marriage.monthYear,
    marriagePlace: blank(record.marriagePlace),
    ministerName: blank(
      stripLeadingClericalTitle(record.minister ?? record.officiatingMinister),
    ),
    witness1: witnesses[0] || '',
    witness2: witnesses[1] || '',
    witnessesExtra: witnesses.slice(2),
    ...issuedFields(issuedAt),
  }
}

function relatedPersonLabel(relationship, gender) {
  const rel = String(relationship || '')
    .trim()
    .toLowerCase()
  const g = String(gender || '')
    .trim()
    .toLowerCase()

  if (rel.includes('wife') || (rel.includes('spouse') && g === 'male')) {
    return 'Husband of'
  }
  if (rel.includes('husband') || (rel.includes('spouse') && g === 'female')) {
    return 'Wife of'
  }
  if (rel.includes('widow')) return 'Widowed spouse of'
  if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) {
    return 'Child of'
  }
  if (rel) return `${civilStatusLabel(relationship)} of`
  return 'Related to'
}

function lastSacramentsText(record) {
  const flag = record.receivedLastSacraments
  if (flag === true || String(flag).toLowerCase() === 'yes') {
    return 'Received the last sacraments of Confession, Anointing of the Sick and Holy Viaticum before death.'
  }
  if (flag === false || String(flag).toLowerCase() === 'no') {
    return 'Was not able to receive any Sacrament before death.'
  }
  return blank(flag)
}

/**
 * @param {object} record
 * @param {{ issuedAt?: Date }} [options]
 */
export function mapDeathRecordToCertificate(record, options = {}) {
  if (!record) {
    throw new Error('Death record is required to generate a certificate.')
  }

  const issuedAt = options.issuedAt || new Date()
  const death = formatCertificateLongDate(record.dateOfDeath)
  const burial = formatCertificateLongDate(record.burialDate)
  const related = blank(getRelatedPersonDisplayName(record))

  return {
    type: CERTIFICATE_TYPES.DEATH,
    ...sharedChrome(CERTIFICATE_TITLES.death),
    recordId: record.id || '',
    recordNumber: blank(
      formatDeathRecordNumber(record.recordYear, record.recordNumber),
    ),
    deceasedName: blank(getDeceasedDisplayName(record)),
    civilStatus: civilStatusLabel(record.status ?? record.civilStatus),
    residenceDisplay: blank(formatDeathResidence(record)),
    relatedPersonLabel: relatedPersonLabel(
      record.relationship,
      record.gender,
    ),
    relatedPersonLine: related,
    deathDayOrdinal: death.dayOrdinal,
    deathMonthYear: death.monthYear,
    burialDayOrdinal: burial.dayOrdinal,
    burialMonthYear: burial.monthYear,
    placeOfBurial: blank(record.placeOfBurial),
    causeOfDeath: blank(record.sickness),
    ageLabel: ageLabel(record.age),
    lastSacramentsText: lastSacramentsText(record),
    ministerName: blank(
      stripLeadingClericalTitle(record.minister ?? record.officiatingMinister),
    ),
    ...issuedFields(issuedAt),
  }
}

export async function getCertificateSourceRecord(sacrament, recordId) {
  if (!recordId) {
    throw new Error('A record id is required to generate a certificate.')
  }

  if (sacrament === CERTIFICATE_TYPES.BAPTISM) {
    const record = await getBaptismRecord(recordId)
    if (!record) throw new Error('Baptism record was not found.')
    return record
  }

  if (sacrament === CERTIFICATE_TYPES.CONFIRMATION) {
    const record = await getConfirmationRecordById(recordId)
    if (!record) throw new Error('Confirmation record was not found.')
    return record
  }

  if (sacrament === CERTIFICATE_TYPES.MARRIAGE) {
    const record = await getMarriageRecordById(recordId)
    if (!record) throw new Error('Marriage record was not found.')
    return record
  }

  if (sacrament === CERTIFICATE_TYPES.DEATH) {
    const record = await getDeathRecordById(recordId)
    if (!record) throw new Error('Death record was not found.')
    return record
  }

  throw new Error(
    `Certificate generation for "${sacrament}" is not available yet.`,
  )
}

export async function buildCertificateData(sacrament, recordId, options = {}) {
  if (!CERTIFICATE_IMPLEMENTED.has(sacrament)) {
    throw new Error(
      `Certificate generation for "${sacrament}" is not available yet.`,
    )
  }

  const record = await getCertificateSourceRecord(sacrament, recordId)

  if (sacrament === CERTIFICATE_TYPES.BAPTISM) {
    return mapBaptismRecordToCertificate(record, options)
  }
  if (sacrament === CERTIFICATE_TYPES.CONFIRMATION) {
    return mapConfirmationRecordToCertificate(record, options)
  }
  if (sacrament === CERTIFICATE_TYPES.MARRIAGE) {
    return mapMarriageRecordToCertificate(record, options)
  }
  if (sacrament === CERTIFICATE_TYPES.DEATH) {
    return mapDeathRecordToCertificate(record, options)
  }

  throw new Error(
    `Certificate generation for "${sacrament}" is not available yet.`,
  )
}

export function isCertificateImplemented(sacrament) {
  return CERTIFICATE_IMPLEMENTED.has(sacrament)
}

function toAbsoluteUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  if (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    /^https?:\/\//i.test(value)
  ) {
    return value
  }
  try {
    return new URL(value, window.location.href).href
  } catch {
    return value
  }
}

async function imageToDataUrl(url) {
  const absolute = toAbsoluteUrl(url)
  if (!absolute) return ''
  if (absolute.startsWith('data:')) return absolute

  try {
    const response = await fetch(absolute)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return absolute
  }
}

async function waitForFonts() {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
  } catch {
    // continue
  }
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  )
}

function resolveCertificatePage(element) {
  if (!element) return null
  return (
    element.querySelector?.('[data-certificate-page="true"]') ||
    (element.matches?.('[data-certificate-page="true"]') ? element : element)
  )
}

/**
 * Downloads an A4 PDF that matches the on-screen HTML certificate preview.
 */
export async function downloadCertificatePdf(element, data) {
  const page = resolveCertificatePage(element)
  if (!page) {
    throw new Error('Certificate element is required to download the PDF.')
  }

  await waitForFonts()
  await waitForImages(page)

  const canvas = await html2canvas(page, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  if (imgHeight <= pageHeight + 0.5) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  } else {
    const fittedWidth = (canvas.width * pageHeight) / canvas.height
    const offsetX = (pageWidth - fittedWidth) / 2
    pdf.addImage(imgData, 'PNG', offsetX, 0, fittedWidth, pageHeight)
  }

  const prefix =
    data?.type === CERTIFICATE_TYPES.CONFIRMATION
      ? 'Confirmation'
      : data?.type === CERTIFICATE_TYPES.MARRIAGE
        ? 'Marriage'
        : data?.type === CERTIFICATE_TYPES.DEATH
          ? 'Death'
          : 'Baptism'

  const fileName = `${prefix}_Certificate_${
    data?.recordNumber || data?.recordId || 'record'
  }.pdf`
  pdf.save(fileName.replace(/\s+/g, '_'))
}

/** @deprecated Prefer downloadCertificatePdf */
export async function downloadBaptismCertificatePdf(element, data) {
  return downloadCertificatePdf(element, data)
}

/**
 * Opens a print-friendly window for the certificate HTML element.
 */
export async function printCertificateElement(element, title = 'Certificate') {
  if (!element) {
    throw new Error('Certificate element is required for printing.')
  }

  await waitForFonts()

  const page = resolveCertificatePage(element)
  const clone = (page || element).cloneNode(true)
  const images = Array.from(clone.querySelectorAll('img'))

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src') || img.src
      const dataUrl = await imageToDataUrl(src)
      if (dataUrl) {
        img.setAttribute('src', dataUrl)
      }
    }),
  )

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    throw new Error(
      'Unable to open the print window. Please allow pop-ups and try again.',
    )
  }

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((node) => {
      if (node.tagName === 'LINK' && node.href) {
        const link = node.cloneNode(true)
        link.setAttribute(
          'href',
          toAbsoluteUrl(node.getAttribute('href') || node.href),
        )
        return link.outerHTML
      }
      return node.outerHTML
    })
    .join('\n')

  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <base href="${window.location.origin}/" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
    ${styles}
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff !important;
      }
      body {
        display: flex;
        justify-content: center;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      img {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head>
  <body>${clone.outerHTML}</body>
</html>`)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  await new Promise((resolve) => {
    const done = () => setTimeout(resolve, 900)
    if (printWindow.document.readyState === 'complete') {
      done()
    } else {
      printWindow.onload = done
      setTimeout(done, 2000)
    }
  })

  try {
    if (printWindow.document.fonts?.ready) {
      await printWindow.document.fonts.ready
    }
  } catch {
    // continue
  }

  triggerPrint()
}
