import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

const readEnvSiteUrl = () => {
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, 'utf8').match(/^VITE_SITE_URL=(.+)$/m);
  return match ? match[1].trim().replace(/\/$/, '') : null;
};

const base = (process.env.VITE_SITE_URL || readEnvSiteUrl() || 'http://localhost:5173').replace(
  /\/$/,
  ''
);

const paths = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about', priority: '0.8', changefreq: 'monthly' },
  { loc: '/login', priority: '0.6', changefreq: 'monthly' },
  { loc: '/register', priority: '0.7', changefreq: 'monthly' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    ({ loc, priority, changefreq }) =>
      `  <url>
    <loc>${base}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml for ${base}`);
