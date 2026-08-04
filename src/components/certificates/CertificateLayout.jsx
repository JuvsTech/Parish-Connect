import './certificate.css'
import dioceseLogoUrl from '../../assets/certificates/diocese-logo.png'
import parishLogoUrl from '../../assets/certificates/parish-seal.png'

/**
 * Shared certificate chrome for Parish Connect official certificates.
 * Design language: elegant Catholic — Cinzel / Cormorant Garamond, navy + gold.
 */
export default function CertificateLayout({
  diocese,
  parishName,
  parishAddress,
  title,
  logos = {},
  children,
  className = '',
}) {
  const dioceseSrc = logos.diocese || dioceseLogoUrl
  const parishSrc = logos.parishSeal || logos.parish || parishLogoUrl

  return (
    <article
      className={`pc-certificate-page ${className}`.trim()}
      data-certificate-page="true"
    >
      <div className="pc-certificate-frame" aria-hidden="true" />
      <div className="pc-certificate-inner">
        <header className="pc-certificate-header">
          <div className="pc-certificate-logo-slot">
            <img
              className="pc-certificate-logo"
              src={dioceseSrc}
              alt="Roman Catholic Diocese of Alaminos"
              decoding="async"
            />
          </div>

          <div className="pc-certificate-header-text">
            <p className="pc-certificate-diocese">{diocese}</p>
            <p className="pc-certificate-parish">{parishName}</p>
            <p className="pc-certificate-address">{parishAddress}</p>
          </div>

          <div className="pc-certificate-logo-slot">
            <img
              className="pc-certificate-logo"
              src={parishSrc}
              alt="Parish logo"
              decoding="async"
            />
          </div>
        </header>

        <div className="pc-certificate-title-rule" aria-hidden="true" />
        <h1 className="pc-certificate-title">{title}</h1>
        <div className="pc-certificate-title-rule" aria-hidden="true" />

        <div className="pc-certificate-body">{children}</div>
      </div>
    </article>
  )
}

export function CertificateFill({ value, className = '' }) {
  return (
    <span className={`pc-fill ${className}`.trim()}>{value || '\u00a0'}</span>
  )
}

export function CertificateMetaRow({ label, children }) {
  return (
    <div className="pc-certificate-meta-row">
      <span className="pc-certificate-meta-label">{label}</span>
      <span className="pc-certificate-meta-value">{children}</span>
    </div>
  )
}
