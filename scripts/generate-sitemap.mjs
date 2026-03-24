/**
 * Writes public/sitemap.xml — valid sitemap.org XML for Google Search Console.
 * Run: npm run sitemap  (also runs automatically before vite build)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

const BASE = 'https://qrcodescannar.com';
const LASTMOD = new Date().toISOString().slice(0, 10);

/** @type {{ path: string; changefreq: string; priority: string }[]} */
const entries = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/qr-code-generator', changefreq: 'monthly', priority: '0.9' },
  { path: '/image-qr-code-scanner', changefreq: 'monthly', priority: '0.9' },
  { path: '/wifi-qr-code-scanner', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.4' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.4' },
];

function escapeXmlLoc(url) {
  return url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const body = entries
  .map(
    ({ path: p, changefreq, priority }) => `  <url>
    <loc>${escapeXmlLoc(`${BASE}${p === '/' ? '/' : p}`)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Wrote ${outPath} (${entries.length} URLs, lastmod ${LASTMOD})`);
