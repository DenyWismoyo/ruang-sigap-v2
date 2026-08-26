export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SIGAP E-Office',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://spg.omnifit.cloud',
    description: 'SIGAP: Solusi E-Office Cerdas untuk Transformasi Digital Birokrasi. Sistem Integrasi & Administrasi Persuratan berstandar SPBE.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
    },
    creator: {
      '@type': 'Organization',
      name: 'Omnifit',
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
