import proj4 from 'proj4';
import { fromUrl, GeoTIFF, GeoTIFFImage } from 'geotiff';
import { RiskLevel } from '../types/gis';

// EPSG:32643 - WGS 84 / UTM zone 43N
proj4.defs('EPSG:32643', '+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');

export const LSM_RASTER_BOUNDS = {
  minX: 454902.5759,
  minY: 1377486.0052,
  maxX: 647582.3662,
  maxY: 1620197.2367,
  width: 6423,
  height: 8090,
  originX: 454902.5759,
  originY: 1620197.2367,
  resX: 29.998410446831706,
  resY: -30.001388318912237,
};

// EPSG:4326 approximate bounding box for quick pre-filtering
export const LSM_4326_BOUNDS = {
  minLng: 74.585,
  minLat: 12.46,
  maxLng: 76.371,
  maxLat: 14.652,
};

export type SusceptibilitySampleResult =
  | {
      status: 'valid';
      susceptibility: number; // 0–100 %
      riskClass: RiskLevel;
      latitude: number;
      longitude: number;
      pixelX?: number;
      pixelY?: number;
    }
  | {
      status: 'nodata';
      message: 'No susceptibility data available at this location.';
      latitude: number;
      longitude: number;
    }
  | {
      status: 'outside';
      message: 'Please click inside the susceptibility map area.';
      latitude: number;
      longitude: number;
    };

let cachedTiff: GeoTIFF | null = null;
let cachedImage: GeoTIFFImage | null = null;

async function getLsmImage(): Promise<GeoTIFFImage> {
  if (cachedImage) return cachedImage;

  const localTiffUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/lsm_map_web.tif`
      : '/lsm_map_web.tif';

  try {
    cachedTiff = await fromUrl(localTiffUrl);
    cachedImage = await cachedTiff.getImage();
    return cachedImage;
  } catch (localErr) {
    console.warn('Local /lsm_map_web.tif range fetch fallback to remote URL:', localErr);
    cachedTiff = await fromUrl(
      'https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main/lsm_map_web.tif'
    );
    cachedImage = await cachedTiff.getImage();
    return cachedImage;
  }
}

/**
 * Checks whether a given lat/lng in EPSG:4326 falls inside the lsm_map_web.tif geographic extent (EPSG:32643)
 */
export function checkInsideLsmExtent(lat: number, lng: number): {
  isInside: boolean;
  x: number;
  y: number;
} {
  try {
    const [x, y] = proj4('EPSG:4326', 'EPSG:32643', [lng, lat]);
    const isInside =
      x >= LSM_RASTER_BOUNDS.minX &&
      x <= LSM_RASTER_BOUNDS.maxX &&
      y >= LSM_RASTER_BOUNDS.minY &&
      y <= LSM_RASTER_BOUNDS.maxY;
    return { isInside, x, y };
  } catch (e) {
    console.error('Projection conversion error:', e);
    return { isInside: false, x: 0, y: 0 };
  }
}

/**
 * Samples susceptibility value from lsm_map_web.tif for a clicked EPSG:4326 location.
 * Converts coordinates to EPSG:32643 and only samples if strictly inside the raster extent.
 */
export async function sampleSusceptibilityAtCoord(
  lat: number,
  lng: number
): Promise<SusceptibilitySampleResult> {
  // Step 1: Check bounds in EPSG:32643
  const { isInside, x, y } = checkInsideLsmExtent(lat, lng);

  if (!isInside) {
    return {
      status: 'outside',
      message: 'Please click inside the susceptibility map area.',
      latitude: lat,
      longitude: lng,
    };
  }

  // Step 2: Calculate pixel coordinates
  const pixelX = Math.floor((x - LSM_RASTER_BOUNDS.originX) / LSM_RASTER_BOUNDS.resX);
  const pixelY = Math.floor((y - LSM_RASTER_BOUNDS.originY) / LSM_RASTER_BOUNDS.resY);

  if (
    pixelX < 0 ||
    pixelX >= LSM_RASTER_BOUNDS.width ||
    pixelY < 0 ||
    pixelY >= LSM_RASTER_BOUNDS.height
  ) {
    return {
      status: 'outside',
      message: 'Please click inside the susceptibility map area.',
      latitude: lat,
      longitude: lng,
    };
  }

  // Step 3: Read single pixel window from GeoTIFF
  try {
    const image = await getLsmImage();
    const rasters = await image.readRasters({
      window: [pixelX, pixelY, pixelX + 1, pixelY + 1],
    });

    const rawVal = rasters[0]?.[0];

    // Check NoData values
    if (
      rawVal === null ||
      rawVal === undefined ||
      isNaN(rawVal) ||
      rawVal === -9999 ||
      rawVal < 0 ||
      rawVal > 1
    ) {
      return {
        status: 'nodata',
        message: 'No susceptibility data available at this location.',
        latitude: lat,
        longitude: lng,
      };
    }

    const percentage = rawVal * 100;

    // Classification:
    // 0–60% → Low Risk (Green)
    // >60–80% → High Risk (Orange)
    // >80–100% → Very High Risk (Red)
    let riskClass: RiskLevel;
    if (percentage > 80) {
      riskClass = 'Very High';
    } else if (percentage > 60) {
      riskClass = 'High';
    } else {
      riskClass = 'Low';
    }

    return {
      status: 'valid',
      susceptibility: percentage,
      riskClass,
      latitude: lat,
      longitude: lng,
      pixelX,
      pixelY,
    };
  } catch (err) {
    console.error('Error reading raster pixel from lsm_map_web.tif:', err);
    return {
      status: 'nodata',
      message: 'No susceptibility data available at this location.',
      latitude: lat,
      longitude: lng,
    };
  }
}
