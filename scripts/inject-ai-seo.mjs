/**
 * One-shot HTML patches: brand, About/Contact nav, entity JSON-LD on pages
 * that do not already include #organization.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const ENTITY = `  <link rel="author" href="https://qrcodescannar.com/about-us">
  <link rel="alternate" type="text/plain" href="https://qrcodescannar.com/llms.txt" title="llms.txt">
  <meta property="og:site_name" content="QR Code Scanner">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://qrcodescannar.com/#organization",
        "name": "QR Code Scanner",
        "url": "https://qrcodescannar.com/",
        "logo": "https://qrcodescannar.com/favicon/apple-touch-icon.png",
        "sameAs": [
          "https://github.com/zainchoohan-glitch",
          "https://github.com/zainchoohan-glitch/qcs",
          "https://qrcodescannar.com/about-us",
          "https://qrcodescannar.com/contact"
        ]
      },
      {
        "@type": "Person",
        "@id": "https://qrcodescannar.com/#author",
        "name": "QR Code Scanner Editorial",
        "url": "https://qrcodescannar.com/about-us",
        "jobTitle": "Editor",
        "worksFor": { "@id": "https://qrcodescannar.com/#organization" },
        "sameAs": [
          "https://github.com/zainchoohan-glitch",
          "https://qrcodescannar.com/about-us",
          "https://qrcodescannar.com/contact"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://qrcodescannar.com/#website",
        "name": "QR Code Scanner",
        "url": "https://qrcodescannar.com/",
        "publisher": { "@id": "https://qrcodescannar.com/#organization" },
        "author": { "@id": "https://qrcodescannar.com/#author" },
        "datePublished": "2024-01-15",
        "dateModified": "2026-10-22"
      }
    ]
  }
  </script>
`;

function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory() && !['dist', 'node_modules', 'public', '.git'].includes(n.name)) walk(p, out);
    else if (n.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const NAV_INSERT = `          <li><a href="/about-us">About</a></li>
          <li><a href="/contact">Contact</a></li>
`;

for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;

  s = s.replace(/content="Qr Code Scanner"/g, 'content="QR Code Scanner"');
  s = s.replace(/ScanQR Pro/g, 'QR Code Scanner');
  s = s.replace(/about ScanQR Pro/g, 'about QR Code Scanner');
  s = s.replace(/<h3>Qr Code Scanner<\/h3>/g, '<h3>QR Code Scanner</h3>');
  s = s.replace(/&copy; 2026 Qr Code Scanner/g, '&copy; 2026 QR Code Scanner');
  s = s.replace(/Qr Code Scanner/g, 'QR Code Scanner');

  if (!s.includes('href="/about-us">About')) {
    s = s.replace(
      /(<li><a href="\/blog(?:[^"]*)">Blog<\/a><\/li>\s*)(<li>\s*<button class="theme-toggle")/,
      `$1${NAV_INSERT}          $2`
    );
    s = s.replace(
      /(<li><a href="\/blog(?:[^"]*)"(?: class="active")?>Blog<\/a><\/li>\s*)(<li><button class="theme-toggle")/,
      `$1${NAV_INSERT}          $2`
    );
  }

  if (!s.includes('#organization') && path.basename(file) !== 'index.html') {
    s = s.replace('<link rel="stylesheet" href="/assets/css/style.css">', `<link rel="stylesheet" href="/assets/css/style.css">\n${ENTITY}`);
    s = s.replace('<link rel="stylesheet" href="/assets/css/style.css" />', `<link rel="stylesheet" href="/assets/css/style.css" />\n${ENTITY}`);
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log('patched', path.relative(root, file));
  }
}
