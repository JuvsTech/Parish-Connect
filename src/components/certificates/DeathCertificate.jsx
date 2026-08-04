import CertificateLayout, { CertificateMetaRow } from './CertificateLayout'
import {
  CertificateAttestation,
  CertificateIssuedLine,
  CertificateRecordCard,
  CertificateSignature,
  longDatePhrase,
} from './certificateShared'

/**
 * Death certificate — approved Baptism design language;
 * wording from death-cert_docx.docx (bound to available Firestore fields).
 */
export default function DeathCertificate({ data }) {
  if (!data) return null

  const deathPhrase = longDatePhrase(data.deathDayOrdinal, data.deathMonthYear)
  const burialPhrase = longDatePhrase(
    data.burialDayOrdinal,
    data.burialMonthYear,
  )

  return (
    <CertificateLayout
      diocese={data.diocese}
      parishName={data.parishName}
      parishAddress={data.parishAddress}
      title={data.title}
      logos={data.logos}
      className="pc-certificate-death"
    >
      <p className="pc-certificate-lead">This is to certify that</p>

      <p className="pc-certificate-fullname">{data.deceasedName || '\u00a0'}</p>

      {data.civilStatus ? (
        <p className="pc-certificate-status-line">{data.civilStatus}</p>
      ) : null}

      <div className="pc-certificate-born">
        <span className="pc-certificate-born-label">A resident of</span>
        <span className="pc-certificate-born-date">
          {data.residenceDisplay || '\u00a0'}
        </span>
      </div>

      {data.relatedPersonLine ? (
        <div className="pc-certificate-born">
          <span className="pc-certificate-born-label">
            {data.relatedPersonLabel}
          </span>
          <span className="pc-certificate-born-date">
            {data.relatedPersonLine}
          </span>
        </div>
      ) : null}

      <section className="pc-certificate-rite" aria-label="Death notice">
        <p>DEPARTED THIS LIFE</p>
        <p>AND WAS BURIED IN THE</p>
        <p>ROMAN CATHOLIC CEMETERY</p>
      </section>

      <section className="pc-certificate-details" aria-label="Death details">
        <CertificateMetaRow label="Date of Death">
          {deathPhrase
            ? `${deathPhrase}${data.ageLabel ? ` · Age ${data.ageLabel}` : ''}`
            : '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Burial">
          {burialPhrase
            ? `${burialPhrase}${
                data.placeOfBurial ? ` · ${data.placeOfBurial}` : ''
              }`
            : data.placeOfBurial || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Cause of Death">
          {data.causeOfDeath || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Last Sacraments">
          {data.lastSacramentsText || '—'}
        </CertificateMetaRow>
      </section>

      <CertificateRecordCard
        recordNumber={data.recordNumber}
        dateIssued={data.dateIssued}
      />

      <footer className="pc-certificate-footer">
        <CertificateAttestation>
          In witness thereof I affix my signature for this Parish of Immaculate
          Conception.
          <br />
          <span className="pc-certificate-attestation-parish">
            Official Death Record maintained by {data.recordParishName}.
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
