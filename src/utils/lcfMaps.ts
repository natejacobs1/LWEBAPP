import proj4 from 'proj4';
import { fromArrayBuffer, GeoTIFF, GeoTIFFImage } from 'geotiff';
import { LcfMapOption, LcfRenderResult } from '../types/gis';

// Register EPSG:32643 - WGS 84 / UTM zone 43N (CRS of all Karnataka LCF GeoTIFFs)
proj4.defs('EPSG:32643', '+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');

/**
 * Fallback study area bounds [South-West, North-East] in LatLng
 */
export const LCF_BOUNDS: [[number, number], [number, number]] = [
  [12.4597, 74.5807],
  [14.6565, 76.3770],
];

export const LCF_MAP_OPTIONS: LcfMapOption[] = [
  {
    id: 'geo',
    name: 'Geo',
    filename: 'GEO_web.tif',
    unit: 'Lithology Class',
    description: 'Underlying bedrock formations, granulites, and metamorphic lithologies governing soil cohesion.',
    min: 1,
    max: 28,
    colors: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#4ade80', '#2dd4bf', '#a78bfa'],
    labels: ['Class 1', 'Class 7', 'Class 14', 'Class 21', 'Class 28'],
  },
  {
    id: 'ld',
    name: 'Landslide Density',
    filename: 'LD_web.tif',
    unit: 'Density Index',
    description: 'Spatial density of historical landslide scars and active mass-wasting occurrences.',
    min: 0,
    max: 1.0,
    colors: ['#10b981', '#facc15', '#f97316', '#ef4444', '#7f1d1d'],
    labels: ['0.00 (Low)', '0.25', '0.50', '0.75', '1.00 (Critical)'],
  },
  {
    id: 'ndvi',
    name: 'NDVI',
    filename: 'NDVI_web.tif',
    unit: 'Vegetation Index',
    description: 'Normalized Difference Vegetation Index representing vegetative canopy density and root-reinforcement.',
    min: -0.15,
    max: 0.60,
    colors: ['#a16207', '#ca8a04', '#a3e635', '#22c55e', '#14532d'],
    labels: ['-0.15', '0.05', '0.25', '0.45', '0.60+ (Dense)'],
  },
  {
    id: 'prc',
    name: 'Profile Curvature',
    filename: 'PRC_web.tif',
    unit: '100 / m',
    description: 'Vertical slope curvature indicating rate of slope angle change, controlling flow acceleration.',
    min: -0.20,
    max: 0.05,
    colors: ['#0284c7', '#38bdf8', '#94a3b8', '#fb923c', '#dc2626'],
    labels: ['-0.20 (Concave)', '-0.10', '0.00 (Planar)', '+0.03', '+0.05 (Convex)'],
  },
  {
    id: 'slope',
    name: 'Slope',
    filename: 'SLOPE_web.tif',
    unit: 'Degrees (°)',
    description: 'Steepness of terrain gradient; slopes exceeding 25°–35° show exponential increase in shear failure.',
    min: 0,
    max: 60,
    colors: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#991b1b'],
    labels: ['0°', '12°', '24°', '36°', '48°', '60°+'],
  },
  {
    id: 'twi',
    name: 'TWI',
    filename: 'TWI_web.tif',
    unit: 'Wetness Index',
    description: 'Topographic Wetness Index quantifying topographic control on hydrological accumulation and pore pressure.',
    min: 0,
    max: 15,
    colors: ['#fef08a', '#86efac', '#38bdf8', '#2563eb', '#1e1b4b'],
    labels: ['0 (Dry Ridge)', '4', '8', '11', '15+ (Saturated)'],
  },
  {
    id: 'aspect',
    name: 'Aspect',
    filename: 'aspect_web.tif',
    unit: 'Azimuth (°)',
    description: 'Compass direction facing of hillslopes influencing monsoon exposure, solar irradiance, and moisture.',
    min: 0,
    max: 360,
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ef4444'],
    labels: ['0° (N)', '90° (E)', '180° (S)', '270° (W)', '360° (N)'],
  },
  {
    id: 'dem',
    name: 'DEM',
    filename: 'dem_web.tif',
    unit: 'Meters (m)',
    description: 'Digital Elevation Model representing topographic relief from coastal plains to Western Ghats crests.',
    min: 0,
    max: 1800,
    colors: ['#15803d', '#65a30d', '#ca8a04', '#d97706', '#9a3412', '#e2e8f0'],
    labels: ['0m', '400m', '800m', '1200m', '1600m', '1800m+'],
  },
  {
    id: 'dtr',
    name: 'Distance to Road',
    filename: 'dtr_web.tif',
    unit: 'Meters (m)',
    description: 'Proximity to road cuts and engineering excavation known to destabilize natural slope toe support.',
    min: 0,
    max: 3000,
    colors: ['#dc2626', '#ea580c', '#eab308', '#10b981', '#0284c7'],
    labels: ['0m (Cut Toe)', '500m', '1000m', '2000m', '3000m+'],
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    filename: 'rainfall_web.tif',
    unit: 'Annual mm',
    description: 'Mean annual monsoon precipitation inducing saturated pore-water pressures and debris triggers.',
    min: 800,
    max: 1900,
    colors: ['#67e8f9', '#38bdf8', '#3b82f6', '#1d4ed8', '#1e1b4b'],
    labels: ['800mm', '1100mm', '1350mm', '1600mm', '1900mm+'],
  },
];

// Helper to interpolate between color stops
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  return [128, 128, 128];
}

function sampleGradientColor(norm: number, colors: string[]): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, norm));
  const n = colors.length - 1;
  const pos = clamped * n;
  const idx = Math.floor(pos);
  const frac = pos - idx;

  const c1 = hexToRgb(colors[idx]);
  const c2 = hexToRgb(colors[Math.min(n, idx + 1)]);

  return [
    Math.round(c1[0] + frac * (c2[0] - c1[0])),
    Math.round(c1[1] + frac * (c2[1] - c1[1])),
    Math.round(c1[2] + frac * (c2[2] - c1[2])),
  ];
}

// In-memory cache for rendered raster overlay results
const renderedOverlayCache = new Map<string, LcfRenderResult>();
const loadingPromises = new Map<string, Promise<LcfRenderResult>>();

/**
 * Returns the primary URL to fetch a GeoTIFF raster from.
 */
export function getLcfRasterUrl(filename: string): string {
  if (typeof window !== 'undefined') {
    return `/${filename}`;
  }
  return `https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main/${filename}`;
}

export function getFallbackLcfRasterUrl(filename: string): string {
  return `https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main/${filename}`;
}

/**
 * Robust fetch for GeoTIFF binary buffer.
 * Tries the local URL first, verifies it is not a Git LFS pointer, and falls back to GitHub media storage if needed.
 */
async function fetchTiffArrayBuffer(filename: string): Promise<ArrayBuffer> {
  const candidates: string[] = [];
  if (typeof window !== 'undefined') {
    candidates.push(`/${filename}`);
  }
  candidates.push(`https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main/${filename}`);

  let lastError: Error | null = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }

      const buffer = await res.arrayBuffer();

      // Check if file is an un-hydrated Git LFS pointer text file (typically ~130 bytes)
      if (buffer.byteLength < 500) {
        const text = new TextDecoder().decode(buffer);
        if (text.includes('git-lfs') || text.includes('404')) {
          console.warn(`URL ${url} returned Git LFS text pointer (${buffer.byteLength} bytes), trying fallback...`);
          continue;
        }
      }

      // Check TIFF magic bytes: 0x4949 ('II' Little Endian) or 0x4D4D ('MM' Big Endian)
      if (buffer.byteLength >= 4) {
        const view = new DataView(buffer);
        const magic = view.getUint16(0, false);
        if (magic !== 0x4949 && magic !== 0x4d4d) {
          console.warn(`URL ${url} did not return valid TIFF magic bytes (0x${magic.toString(16)}), trying fallback...`);
          continue;
        }
      }

      return buffer;
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt to fetch ${filename} from ${url} failed:`, err.message);
    }
  }

  throw lastError || new Error(`Unable to load GeoTIFF raster: ${filename}`);
}

/**
 * Loads a selected LCF raster GeoTIFF, dynamically calculates its geographic bounds via proj4,
 * renders raster values onto an offscreen canvas with color ramps, and returns a PNG DataURL and Leaflet bounds.
 */
export async function loadAndRenderLcfOverlay(mapConfig: LcfMapOption): Promise<LcfRenderResult> {
  const cached = renderedOverlayCache.get(mapConfig.id);
  if (cached) return cached;

  const inFlight = loadingPromises.get(mapConfig.id);
  if (inFlight) return inFlight;

  const loadPromise = (async (): Promise<LcfRenderResult> => {
    // 1. Fetch GeoTIFF array buffer
    const buffer = await fetchTiffArrayBuffer(mapConfig.filename);

    // 2. Parse GeoTIFF in memory
    const tiff: GeoTIFF = await fromArrayBuffer(buffer);
    const image: GeoTIFFImage = await tiff.getImage();

    const origWidth = image.getWidth();
    const origHeight = image.getHeight();
    const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
    const geoKeys = (image.getGeoKeys ? image.getGeoKeys() : {}) as Record<string, any>;
    const gdalNoData = image.getGDALNoData ? image.getGDALNoData() : null;

    if (!bbox || bbox.length < 4) {
      throw new Error(`Could not determine bounding box for GeoTIFF ${mapConfig.filename}`);
    }

    // 3. Dynamically compute Leaflet LatLng Bounds from GeoTIFF CRS (Requirement 3 & 9)
    let southWest: [number, number];
    let northEast: [number, number];
    const epsgCode = geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey;

    const isProjected =
      epsgCode === 32643 ||
      bbox[0] > 1000 ||
      (typeof geoKeys.GTCitationGeoKey === 'string' && geoKeys.GTCitationGeoKey.includes('32643'));

    if (isProjected) {
      // Source CRS is EPSG:32643 (UTM Zone 43N)
      const sw = proj4('EPSG:32643', 'EPSG:4326', [bbox[0], bbox[1]]);
      const ne = proj4('EPSG:32643', 'EPSG:4326', [bbox[2], bbox[3]]);
      southWest = [sw[1], sw[0]]; // [lat, lng]
      northEast = [ne[1], ne[0]]; // [lat, lng]
    } else if (bbox[0] >= -180 && bbox[2] <= 180 && bbox[1] >= -90 && bbox[3] <= 90) {
      // Already geographic EPSG:4326 [minLng, minLat, maxLng, maxLat]
      southWest = [bbox[1], bbox[0]];
      northEast = [bbox[3], bbox[2]];
    } else {
      // Try generic projected EPSG or fallback to UTM Zone 43N
      try {
        const sw = proj4(`EPSG:${epsgCode}`, 'EPSG:4326', [bbox[0], bbox[1]]);
        const ne = proj4(`EPSG:${epsgCode}`, 'EPSG:4326', [bbox[2], bbox[3]]);
        southWest = [sw[1], sw[0]];
        northEast = [ne[1], ne[0]];
      } catch {
        const sw = proj4('EPSG:32643', 'EPSG:4326', [bbox[0], bbox[1]]);
        const ne = proj4('EPSG:32643', 'EPSG:4326', [bbox[2], bbox[3]]);
        southWest = [sw[1], sw[0]];
        northEast = [ne[1], ne[0]];
      }
    }

    const calculatedBounds: [[number, number], [number, number]] = [southWest, northEast];

    // 4. Read raster values at web overlay resolution
    const targetWidth = 320;
    const targetHeight = 400;

    let rasters;
    try {
      rasters = await image.readRasters({
        width: targetWidth,
        height: targetHeight,
        interleave: false,
      });
    } catch (readErr) {
      console.warn(`Standard downsampled read failed for ${mapConfig.filename}, retrying fallback:`, readErr);
      rasters = await image.readRasters({ interleave: false });
    }

    const data = rasters[0] as unknown as Float32Array | Int32Array | number[];
    const actualWidth = (rasters as any).width || targetWidth;
    const actualHeight = (rasters as any).height || targetHeight;

    // 5. Render colored pixels onto HTML5 canvas
    const canvas = document.createElement('canvas');
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize 2D canvas rendering context');

    const imgData = ctx.createImageData(actualWidth, actualHeight);
    const pixels = imgData.data;

    const { min, max, colors } = mapConfig;
    const range = max - min || 1;

    for (let i = 0; i < data.length; i++) {
      const val = Number(data[i]);
      const pIdx = i * 4;

      // Robust NoData checks (handles GDAL -9999, Float32 extreme negatives, NaN, and out-of-boundary areas)
      const isNoData =
        isNaN(val) ||
        val <= -9000 ||
        val >= 1e30 ||
        val <= -1e30 ||
        (gdalNoData !== null && Math.abs(val - gdalNoData) < 1e-4) ||
        (val < 0 && mapConfig.id !== 'prc' && mapConfig.id !== 'ndvi' && mapConfig.id !== 'twi');

      if (isNoData) {
        pixels[pIdx] = 0;
        pixels[pIdx + 1] = 0;
        pixels[pIdx + 2] = 0;
        pixels[pIdx + 3] = 0; // Transparent
        continue;
      }

      const norm = (val - min) / range;
      const [r, g, b] = sampleGradientColor(norm, colors);

      pixels[pIdx] = r;
      pixels[pIdx + 1] = g;
      pixels[pIdx + 2] = b;
      pixels[pIdx + 3] = 230; // Clean overlay opacity
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    const result: LcfRenderResult = {
      dataUrl,
      bounds: calculatedBounds,
      width: origWidth,
      height: origHeight,
      crs: isProjected ? 'EPSG:32643' : 'EPSG:4326',
    };

    renderedOverlayCache.set(mapConfig.id, result);
    return result;
  })();

  loadingPromises.set(mapConfig.id, loadPromise);
  try {
    const result = await loadPromise;
    return result;
  } finally {
    loadingPromises.delete(mapConfig.id);
  }
}
