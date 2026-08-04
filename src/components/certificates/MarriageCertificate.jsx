import CertificateLayout, { CertificateMetaRow } from './CertificateLayout'
import {
  CertificateAttestation,
  CertificateIssuedLine,
  CertificateRecordCard,
  CertificateSignature,
  longDatePhrase,
} from './certificateShared'

/**
 * Marriage certificate — approved Baptism design language;
 * wording from CERTIFICATE-OF-MARRIAGE.docx.
 */
export default function MarriageCertificate({ data }) {
  if (!data) return null

  const marriagePhrase = longDatePhrase(
    data.marriageDayOrdinal,
    data.marriageMonthYear,
  )
  const witnesses = [data.witness1, data.witness2, ...(data.witnessesExtra || [])]
    .filter(Boolean)

  return (
    <CertificateLayout
      diocese={data.diocese}
      parishName={data.parishName}
      parishAddress={data.parishAddress}
      title={data.title}
      logos={data.logos}
      className="pc-certificate-marriage"
    >
      <p className="pc-certificate-lead">
        By these presents, the undersigned certifies that
      </p>

      <p className="pc-certificate-fullname">{data.groomName || '\u00a0'}</p>

      <div className="pc-certificate-parentage">
        <p className="pc-certificate-parentage-label">
          {[data.groomCivilStatus, data.groomAgeLabel].filter(Boolean).join(' · ') ||
            'Groom'}
        </p>
        <p className="pc-certificate-parentage-label">Son of</p>
        <p className="pc-certificate-parent-name">
          {data.groomFatherName || '\u00a0'}
        </p>
        <p className="pc-certificate-parentage-and">and</p>
        <p className="pc-certificate-parent-name">
          {data.groomMotherName || '\u00a0'}
        </p>
      </div>

      <p className="pc-certificate-conjunction">and</p>

      <p className="pc-certificate-fullname">{data.brideName || '\u00a0'}</p>

      <div className="pc-certificate-parentage">
        <p className="pc-certificate-parentage-label">
          {[data.brideCivilStatus, data.brideAgeLabel].filter(Boolean).join(' · ') ||
            'Bride'}
        </p>
        <p className="pc-certificate-parentage-label">Daughter of</p>
        <p className="pc-certificate-parent-name">
          {data.brideFatherName || '\u00a0'}
        </p>
        <p className="pc-certificate-parentage-and">and</p>
        <p className="pc-certificate-parent-name">
          {data.brideMotherName || '\u00a0'}
        </p>
      </div>

      <section className="pc-certificate-rite" aria-label="Marriage rite">
        <p>WERE UNITED IN HOLY MATRIMONY</p>
        <p>ACCORDING TO THE RITES OF THE</p>
        <p>HOLY ROMAN CATHOLIC CHURCH</p>
      </section>

      <section className="pc-certificate-details" aria-label="Marriage details">
        <CertificateMetaRow label="Marriage Date">
          {marriagePhrase || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Place">
          {data.marriagePlace || '—'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Priest">
          {data.ministerName
            ? `Rev. Fr. ${data.ministerName}`
            : 'Rev. Fr. —'}
        </CertificateMetaRow>
        <CertificateMetaRow label="Witnesses">
          {witnesses.length ? witnesses.join(' · ') : '—'}
        </CertificateMetaRow>
      </section>

      <CertificateRecordCard
        recordNumber={data.recordNumber}
        dateIssued={data.dateIssued}
      />

      <footer className="pc-certificate-footer">
        <CertificateAttestation>
          This certificate is issued based on the official Marriage Record
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
