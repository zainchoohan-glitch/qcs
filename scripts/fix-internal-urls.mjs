import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const replacements = [
  ['https://qrcodescannar.com/public/qr-code-scan.avif', 'https://qrcodescannar.com/image-qr-code-scanner.avif'],
  ['https://qrcodescannar.com/qr-code-scan.avif', 'https://qrcodescannar.com/image-qr-code-scanner.avif'],
  ['https://qrcodescannar.com/public/image-qr-code-scanner.avif', 'https://qrcodescannar.com/image-qr-code-scanner.avif'],
  ['https://qrcodescannar.com/public/qr-code-generator.avif', 'https://qrcodescannar.com/qr-code-generator.avif'],
  ['https://qrcodescannar.com/public/wifi-qr-code-generator.avif', 'https://qrcodescannar.com/wifi-qr-code-generator.avif'],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['dist', 'node_modules', '.git'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      let s = fs.readFileSync(full, 'utf8');
      const orig = s;
      for (const [from, to] of replacements) s = s.split(from).join(to);
      s = s.replaceAll('href="#"', 'href="/"');
      if (s !== orig) {
        fs.writeFileSync(full, s);
        console.log('updated', path.relative(root, full));
      }
    }
  }
}

walk(root);
