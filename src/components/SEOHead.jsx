import { Helmet } from 'react-helmet-async'

const SITE = 'TradeSharp'
const DOMAIN = 'https://tradesharp.xyz'
const DEFAULT_OG = `${DOMAIN}/og-default.png`

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG,
  ogType = 'website',
  noIndex = false,
  jsonLd = null,
}) {
  const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — Futures Trading Journal & Performance Tracker`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={`${DOMAIN}${canonical}`} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={`${DOMAIN}${canonical}`} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
