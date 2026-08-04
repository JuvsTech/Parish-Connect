import CertificateLayout, { CertificateMetaRow } from './CertificateLayout'
import {
  CertificateAttestation,
  CertificateIssuedLine,
  CertificateRecordCard,
  CertificateSignature,
  longDatePhrase,
} from './certificateShared'

/**
 * Confirmation certificate — approved Baptism design language;
 * wording from Confirmation-Certificate.docx.
 */
export default function ConfirmationCertificate({ data }) {
  if (!data) return null

  const birthPhrase = longDatePhrase(data.birthDayOrdinal, data.birthMonthYear)
  const confirmationPhrase = longDatePhrase(
    data.confirmationDayOrdinal,
    data.confirmationMonthYear,
  )
  const sponsors = [data.sponsor1, data.sponsor2].filter(Boolean)

  return (
    <CertificateLayout
      diocese={data.diocese}
      parishName={data.parishName}
      parishAddress={data.parishAddress}
      title={data.title}
      logos={data.logos}
      className="pc-certificate-confirmation"
    >
      <p className="pc-certificate-lead">This is to certify that</p>

      <p className="pc-certificate-fullname">{data.confirmandName || '\u00a0'}</p>

      <div className="pc-certificate-parentage">
        <p className="pc-certificate-parentage-label">Child of</p>
        <p className="pc-certificate-parent-name">
          {data.fatherName || '\u00a0'}
        </p>
        <p className="pc-certificate-parentage-and">and</p>
        <p className="pc-certificate-parent-name">
          {data.motherName || '\u00a0'}
        </p>
      </div>

      <div className="pc-certificate-born">
        <span className="pc-certificate-born-label">born on</span>
        <span className="pc-certificate-born-date">
          {birthPhrase || '\u00a0'}
        </span>
      </div>

      <div className="pc-certificate-born">
        <span className="pc-certificate-born-label">
          baptized in the Parish Church of
        </span>
        <span className="pc-certificate-born-date">
          {data.placeOfBaptism || '\u00a0'}
        </span>
      </div>

      <section className="pc-certificate-rite" aria-label="Confirmation rite">
        <p>RECEIVED</p>
        <p>THE HOLY SACRAMENT OF CONFIRMATION</p>
        <p>IN THE PARISH CHURCH OF</p>
        <p>{data.confirmationParishChurch}</p>
      </section>

      <section
        className="pc-certificate-details"
        aria-label="Confirmation details"
      >
        <CertificateMetaRow label="Confirmation Date">
          {confirmationPhrase || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Administered by">
          {data.ministerName
            ? `Most Rev. Fr. ${data.ministerName}`
            : 'Most Rev. Fr. —'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Sponsor">
          {sponsors.length ? sponsors.join(' · ') : '—'}
        </CertificateMetaRow>
      </section>

      <CertificateRecordCard
        recordNumber={data.recordNumber}
        dateIssued={data.dateIssued}
      />

      <footer className="pc-certificate-footer">
        <CertificateAttestation>
          This certificate is issued based on the official Confirmation Record
          maintained by
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
