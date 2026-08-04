import CertificateLayout, { CertificateMetaRow } from './CertificateLayout'
import {
  CertificateAttestation,
  CertificateIssuedLine,
  CertificateRecordCard,
  CertificateSignature,
  longDatePhrase,
} from './certificateShared'

/**
 * Shared Parish Connect certificate layout (Baptism design language).
 * Used for all sacraments until dedicated templates replace this engine.
 * Sacrament-specific copy comes from `data` (title, rite lines, labels, names).
 *
 * @param {{ data: object }} props — from map*RecordToCertificate
 */
export default function BaptismCertificate({ data }) {
  if (!data) return null

  const subjectName =
    data.subjectName ||
    data.childName ||
    data.confirmandName ||
    data.deceasedName ||
    '\u00a0'

  const birthPhrase = longDatePhrase(data.birthDayOrdinal, data.birthMonthYear)
  const sacramentPhrase =
    longDatePhrase(data.sacramentDayOrdinal, data.sacramentMonthYear) ||
    longDatePhrase(data.baptismDayOrdinal, data.baptismMonthYear)

  const sponsors = (
    data.sponsorsList ||
    [data.sponsor1, data.sponsor2, ...(data.sponsorsExtra || [])]
  ).filter(Boolean)

  const riteLines = Array.isArray(data.riteLines) && data.riteLines.length
    ? data.riteLines
    : ['WAS SOLEMNLY BAPTIZED', 'ACCORDING TO THE RITE', 'OF THE ROMAN CATHOLIC CHURCH']

  const detailRows =
    Array.isArray(data.detailRows) && data.detailRows.length
      ? data.detailRows
      : [
          {
            label: data.sacramentDateLabel || 'Baptism Date',
            value: sacramentPhrase || '—',
          },
          {
            label: data.ministerLabel || 'Priest',
            value: data.ministerName
              ? `Reverend Father ${data.ministerName}`
              : 'Reverend Father —',
          },
          {
            label: data.sponsorsLabel || 'Sponsors',
            value: sponsors.length ? sponsors.join(' · ') : '—',
          },
        ]

  const showParentage = data.showParentage !== false
  const parentageLabel = data.parentageLabel || 'Child of'
  const showBorn = data.showBorn !== false
  const bornLabel = data.bornLabel || 'born on'
  const attestationPrefix =
    data.attestationPrefix ||
    'This certificate is issued based on the official Baptismal Record maintained by'

  const secondaryParentageName = data.motherName
  const primaryParentageName = data.fatherName
  const singleParentageName = data.parentageSingleName

  return (
    <CertificateLayout
      diocese={data.diocese}
      parishName={data.parishName}
      parishAddress={data.parishAddress}
      title={data.title}
      logos={data.logos}
      className={data.layoutClassName || 'pc-certificate-baptism'}
    >
      <p className="pc-certificate-lead">
        {data.leadText || 'This is to certify that'}
      </p>

      <p className="pc-certificate-fullname">{subjectName}</p>

      {showParentage ? (
        singleParentageName ? (
          <div className="pc-certificate-parentage">
            <p className="pc-certificate-parentage-label">{parentageLabel}</p>
            <p className="pc-certificate-parent-name">
              {singleParentageName || '\u00a0'}
            </p>
          </div>
        ) : (
          <div className="pc-certificate-parentage">
            <p className="pc-certificate-parentage-label">{parentageLabel}</p>
            <p className="pc-certificate-parent-name">
              {primaryParentageName || '\u00a0'}
            </p>
            <p className="pc-certificate-parentage-and">and</p>
            <p className="pc-certificate-parent-name">
              {secondaryParentageName || '\u00a0'}
            </p>
          </div>
        )
      ) : null}

      {showBorn ? (
        <div className="pc-certificate-born">
          <span className="pc-certificate-born-label">{bornLabel}</span>
          <span className="pc-certificate-born-date">
            {birthPhrase || '\u00a0'}
          </span>
        </div>
      ) : null}

      <section className="pc-certificate-rite" aria-label="Sacrament rite">
        {riteLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <section className="pc-certificate-details" aria-label="Certificate details">
        {detailRows.map((row) => (
          <CertificateMetaRow key={row.label} label={row.label}>
            {row.value || '—'}
          </CertificateMetaRow>
        ))}
      </section>

      <CertificateRecordCard
        recordNumber={data.recordNumber}
        dateIssued={data.dateIssued}
      />

      <footer className="pc-certificate-footer">
        <CertificateAttestation>
          {attestationPrefix}
          <br />
          <span className="pc-certificate-attestation-parish">
            {data.recordParishName}.
          </span>
        </CertificateAttestation>

        <CertificateIssuedLine
          dayOrdinal={data.issuedDayOrdinal}
          monthYear={data.issuedMonthYear}
        />
      </footer>

      <CertificateSignature ministerName={data.ministerName} />
    </CertificateLayout>
  )
}
