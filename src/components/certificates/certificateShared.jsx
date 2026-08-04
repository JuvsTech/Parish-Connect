import { CertificateFill } from './CertificateLayout'

/** Shared issued-date parts from certificate VM `issuedMonthYear` (e.g. "August 2026"). */
export function getIssuedParts(issuedMonthYear) {
  const issuedMonth = String(issuedMonthYear || '')
    .replace(/,?\s*\d{4}\s*$/, '')
    .trim()
  const issuedYear = String(issuedMonthYear || '').match(/\d{4}/)?.[0] || ''
  return { issuedMonth, issuedYear }
}

export function longDatePhrase(dayOrdinal, monthYear) {
  if (!dayOrdinal && !monthYear) return ''
  if (dayOrdinal && monthYear) return `the ${dayOrdinal} day of ${monthYear}`
  return dayOrdinal || monthYear || ''
}

export function CertificateRecordCard({ recordNumber, dateIssued }) {
  return (
    <section
      className="pc-certificate-record-card"
      aria-label="Record information"
    >
      <div className="pc-certificate-record-item">
        <span className="pc-certificate-record-label">Record Number</span>
        <span className="pc-certificate-record-value">
          {recordNumber || '____________'}
        </span>
      </div>
      <div className="pc-certificate-record-divider" aria-hidden="true" />
      <div className="pc-certificate-record-item">
        <span className="pc-certificate-record-label">Date of Issue</span>
        <span className="pc-certificate-record-value">
          {dateIssued || '__________________'}
        </span>
      </div>
    </section>
  )
}

export function CertificateAttestation({ children }) {
  return (
    <p className="pc-certificate-attestation">
      {children}
    </p>
  )
}

export function CertificateIssuedLine({ dayOrdinal, monthYear }) {
  const { issuedMonth, issuedYear } = getIssuedParts(monthYear)
  return (
    <p className="pc-certificate-issued">
      Issued this{' '}
      <CertificateFill value={dayOrdinal} className="day" /> day of{' '}
      <CertificateFill value={issuedMonth} className="month" />,{' '}
      <CertificateFill value={issuedYear} className="year" />.
    </p>
  )
}

export function CertificateSignature({ ministerName }) {
  return (
    <div className="pc-certificate-signature">
      <div className="pc-certificate-signature-block">
        <div className="pc-certificate-signature-space" aria-hidden="true" />
        <div className="pc-certificate-signature-line" />
        <p className="pc-certificate-signature-name">
          REV. FR.{' '}
          <span className="pc-certificate-signature-blank">
            {ministerName || '______________________'}
          </span>
        </p>
        <p className="pc-certificate-signature-role">Parish Priest</p>
      </div>
    </div>
  )
}
