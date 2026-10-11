import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const TIFF_FILES = [
  'GEO_web.tif',
  'LD_web.tif',
  'NDVI_web.tif',
  'PRC_web.tif',
  'SLOPE_web.tif',
  'TWI_web.tif',
  'aspect_web.tif',
  'dem_web.tif',
  'dtr_web.tif',
  'rainfall_web.tif',
  'lsm_map_web.tif',
];

const GITHUB_BASE = 'https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main';

async function syncTiffFile(filename) {
  const rootPath = path.resolve(rootDir, filename);
  const publicPath = path.resolve(publicDir, filename);

  const rootExists = fs.existsSync(rootPath);
  const publicExists = fs.existsSync(publicPath);

  const rootSize = rootExists ? fs.statSync(rootPath).size : 0;
  const publicSize = publicExists ? fs.statSync(publicPath).size : 0;

  // Case 1: public already has the real binary file (> 1000 bytes)
  if (publicSize > 1000) {
    if (!rootExists || rootSize < 1000) {
      fs.copyFileSync(publicPath, rootPath);
      console.log(`[sync-assets] Synced ${filename} from public/ to root.`);
    }
    return;
  }

  // Case 2: root has the real binary file (> 1000 bytes)
  if (rootSize > 1000) {
    fs.copyFileSync(rootPath, publicPath);
    console.log(`[sync-assets] Synced ${filename} from root to public/.`);
    return;
  }

  // Case 3: neither has real binary (e.g. unhydrated Git LFS pointer on Vercel) -> fetch from GitHub
  console.log(`[sync-assets] Fetching ${filename} from GitHub media storage...`);
  try {
    const res = await fetch(`${GITHUB_BASE}/${filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(publicPath, buffer);
    fs.writeFileSync(rootPath, buffer);
    console.log(`[sync-assets] Successfully downloaded and synced ${filename} (${buffer.length} bytes).`);
  } catch (err) {
    console.warn(`[sync-assets] Warning: Could not download ${filename}:`, err.message);
  }
}

async function main() {
  console.log('[sync-assets] Ensuring all LCF and LSM GeoTIFF static assets are in public/ and root...');
  for (const f of TIFF_FILES) {
    await syncTiffFile(f);
  }
  console.log('[sync-assets] Asset sync complete.');
}

main().catch((err) => {
  console.error('[sync-assets] Error syncing assets:', err);
  process.exit(0); // do not break build if offline
});
