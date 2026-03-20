import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = [
  'index.html',
  'qr-code-generator.html',
  'image-qr-code-scanner.html',
  'wifi-qr-code-scanner.html',
  'blog.html',
  'about.html',
  'contact.html',
  'privacy-policy.html',
  'terms.html',
];

const input = Object.fromEntries(
  pages.map((file) => {
    const name = file.replace(/\.html$/, '');
    return [name, path.resolve(__dirname, file)];
  })
);

function permalinkToHtml(pathname) {
  // Only handle clean permalinks like `/qr-code-generator` (no extension).
  if (!pathname || pathname === '/') return null;

  const clean = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (!clean.startsWith('/')) return null;

  // Ignore requests with dot extensions (assets, files, etc).
  const lastSegment = clean.slice(1).split('/').pop() || '';
  if (lastSegment.includes('.')) return null;

  const slug = clean.slice(1); // remove leading '/'
  const candidate = path.join(__dirname, `${slug}.html`);
  return fs.existsSync(candidate) ? `/${slug}.html` : null;
}

function makePermalinkMiddleware() {
  return (req, res, next) => {
    const [pathname, search = ''] = String(req.url || '').split('?');
    if (!pathname) return next();

    // If it's already an explicit .html URL, do nothing.
    if (pathname.endsWith('.html')) return next();

    // Redirect `/qr-code-generator/` -> `/qr-code-generator` so relative assets work.
    if (pathname.length > 1 && pathname.endsWith('/')) {
      const trimmed = pathname.slice(0, -1);
      const target = permalinkToHtml(trimmed);
      if (target) {
        res.statusCode = 301;
        res.setHeader('Location', `${trimmed}${search ? `?${search}` : ''}`);
        res.end();
        return;
      }
    }

    const target = permalinkToHtml(pathname);
    if (!target) return next();

    req.url = `${target}${search ? `?${search}` : ''}`;
    return next();
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input,
    },
  },
  configureServer(server) {
    server.middlewares.use(makePermalinkMiddleware());
  },
  configurePreviewServer(server) {
    server.middlewares.use(makePermalinkMiddleware());
  },
});

