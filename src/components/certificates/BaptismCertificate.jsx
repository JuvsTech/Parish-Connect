import CertificateLayout, { CertificateMetaRow } from './CertificateLayout'
import {
  CertificateAttestation,
  CertificateIssuedLine,
  CertificateRecordCard,
  CertificateSignature,
  longDatePhrase,
} from './certificateShared'

/**
 * Baptism certificate — premium Parish Connect design.
 * Preserves all official fields from baptismal-cert_docx.docx.
 *
 * @param {{ data: object }} props — from mapBaptismRecordToCertificate
 */
export default function BaptismCertificate({ data }) {
  if (!data) return null

  const birthPhrase = longDatePhrase(data.birthDayOrdinal, data.birthMonthYear)
  const baptismPhrase = longDatePhrase(
    data.baptismDayOrdinal,
    data.baptismMonthYear,
  )
  const sponsors = [
    data.sponsor1,
    data.sponsor2,
    ...(data.sponsorsExtra || []),
  ].filter(Boolean)

  return (
    <CertificateLayout
      diocese={data.diocese}
      parishName={data.parishName}
      parishAddress={data.parishAddress}
      title={data.title}
      logos={data.logos}
      className="pc-certificate-baptism"
    >
      <p className="pc-certificate-lead">This is to certify that</p>

      <p className="pc-certificate-fullname">{data.childName || '\u00a0'}</p>

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

      <section className="pc-certificate-rite" aria-label="Baptism rite">
        <p>WAS SOLEMNLY BAPTIZED</p>
        <p>ACCORDING TO THE RITE</p>
        <p>OF THE ROMAN CATHOLIC CHURCH</p>
      </section>

      <section className="pc-certificate-details" aria-label="Baptism details">
        <CertificateMetaRow label="Baptism Date">
          {baptismPhrase || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Priest">
          {data.ministerName
            ? `Reverend Father ${data.ministerName}`
            : 'Reverend Father —'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Sponsors">
          {sponsors.length ? sponsors.join(' · ') : '—'}
        </CertificateMetaRow>
      </section>

      <CertificateRecordCard
        recordNumber={data.recordNumber}
        dateIssued={data.dateIssued}
      />

      <footer className="pc-certificate-footer">
        <CertificateAttestation>
          This certificate is issued based on the official Baptismal Record
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
