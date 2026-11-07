import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// All search and sharing URLs come from one origin. Set it again when moving hosts.
const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = path.join(root, 'seo.config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--origin')) {
  throw new Error('Usage: node scripts/configure-seo.mjs [--origin https://your-domain]');
}
const parsed = new URL(args.length ? args[1] : config.origin);
if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
  throw new Error('Use an HTTPS origin without a path, credentials, query, or fragment.');
}
const origin = parsed.origin;
const pages = [
  {
    file: 'index.html', route: '/',
    title: 'Free PDF Signature — Sign PDF Online | Inklet',
    headline: 'Sign a PDF online. For free.',
    description: 'Sign a PDF online for free. Draw or type your signature, place it on any page, and download your signed PDF. No account, watermark, or document upload.'
  },
  {
    file: 'guides/how-to-sign-a-pdf/index.html', route: '/guides/how-to-sign-a-pdf/',
    title: 'How to Sign a PDF for Free — Step-by-Step Guide | Inklet',
    headline: 'How to sign a PDF for free.',
    description: 'Learn how to sign a PDF for free on a computer, phone, or tablet. Create a signature, choose a page, resize your mark, and download your signed document.'
  },
  {
    file: 'guides/draw-or-type-a-signature/index.html', route: '/guides/draw-or-type-a-signature/',
    title: 'Draw or Type Your PDF Signature — Free Signing Guide | Inklet',
    headline: 'Draw or type your PDF signature?',
    description: 'Compare drawn and typed PDF signatures. Learn how to choose a signature style, change ink colours, resize your mark, and understand the tool’s limits.'
  }
];
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const image = `${origin}/assets/og-image.png`;
const replacements = pages.map((page) => {
  const filename = path.join(root, 'dist', page.file);
  const html = readFileSync(filename, 'utf8');
  const marker = /  <!-- seo:start -->[\s\S]*?  <!-- seo:end -->/;
  if (!marker.test(html)) throw new Error(`SEO metadata markers are missing in ${page.file}.`);
  const url = origin + page.route;
  const guide = page.route !== '/';
  const graph = [
    { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Inklet', url: `${origin}/` },
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'Inklet', url: `${origin}/`, inLanguage: 'en', publisher: { '@id': `${origin}/#organization` } },
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title,
      description: page.description, inLanguage: 'en',
      isPartOf: { '@id': `${origin}/#website` },
      primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
      ...(guide ? { breadcrumb: { '@id': `${url}#breadcrumbs` }, mainEntity: { '@id': `${url}#article` } } : {})
    }
  ];
  if (guide) {
    graph.push({
      '@type': 'TechArticle', '@id': `${url}#article`, headline: page.headline,
      description: page.description, inLanguage: 'en', image,
      author: { '@id': `${origin}/#organization` }, publisher: { '@id': `${origin}/#organization` },
      mainEntityOfPage: { '@id': `${url}#webpage` }
    }, {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Free PDF signature', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: page.headline, item: url }
      ]
    });
  }
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replaceAll('<', '\\u003c');
  const metadata = [
    '  <!-- seo:start -->',
    `  <title>${escapeHtml(page.title)}</title>`,
    `  <meta name="description" content="${escapeHtml(page.description)}">`,
    '  <meta name="robots" content="index, follow, max-image-preview:large">',
    `  <link rel="canonical" href="${url}">`,
    '  <meta property="og:site_name" content="Inklet">',
    `  <meta property="og:type" content="${guide ? 'article' : 'website'}">`,
    '  <meta property="og:locale" content="en_US">',
    `  <meta property="og:title" content="${escapeHtml(page.title)}">`,
    `  <meta property="og:description" content="${escapeHtml(page.description)}">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${image}">`,
    '  <meta property="og:image:type" content="image/png">',
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    '  <meta property="og:image:alt" content="Inklet — free PDF signatures. Draw or type your name, place it, and download your PDF.">',
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `  <meta name="twitter:description" content="${escapeHtml(page.description)}">`,
    `  <meta name="twitter:image" content="${image}">`,
    '  <meta name="twitter:image:alt" content="Inklet — free PDF signatures. Draw or type your name, place it, and download your PDF.">',
    `  <script type="application/ld+json">\n${schema}\n  </script>`,
    '  <!-- seo:end -->'
  ].join('\n');
  return { filename, html: html.replace(marker, metadata) };
});

// Validate every input before writing any page.
for (const item of replacements) writeFileSync(item.filename, item.html);
writeFileSync(path.join(root, 'dist', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
writeFileSync(path.join(root, 'dist', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${origin}${page.route}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(configPath, JSON.stringify({ ...config, origin }, null, 2) + '\n');
console.log(`Updated SEO metadata, canonical URLs, sharing cards, and sitemap for ${pages.length} pages on ${origin}.`);
