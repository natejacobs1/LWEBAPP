import { LandslideProperties, RiskLevel, BasemapOption } from '../types/gis';

export const GEOJSON_URLS = {
  districts: 'https://raw.githubusercontent.com/natejacobs1/landslide_webapp/refs/heads/main/districts.geojson',
  landslides: 'https://raw.githubusercontent.com/natejacobs1/landslide_webapp/refs/heads/main/landslide_points.geojson',
  roads: 'https://raw.githubusercontent.com/natejacobs1/landslide_webapp/refs/heads/main/road.geojson',
} as const;

export const BASEMAPS: BasemapOption[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'carto_dark',
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'carto_light',
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'topo',
    name: 'OpenTopoMap (Contour)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | Kartendarstellung: &copy; <a href="http://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
];

export function getRiskLevel(properties: LandslideProperties): RiskLevel {
  // Classification strictly uses Susceptibility_Percentage:
  // 0–60% → Low Risk (Green)
  // >60–80% → High Risk (Orange)
  // >80–100% → Very High Risk (Red)
  const pct = Number(properties?.Susceptibility_Percentage);
  if (!isNaN(pct)) {
    if (pct > 80) return 'Very High';
    if (pct > 60) return 'High';
    return 'Low';
  }

  // Fallback if Susceptibility_Percentage is missing, derive from Landslide_Probability
  const prob = Number(properties?.Landslide_Probability);
  if (!isNaN(prob)) {
    const probPct = prob * 100;
    if (probPct > 80) return 'Very High';
    if (probPct > 60) return 'High';
    return 'Low';
  }

  return 'Low';
}

export const RISK_COLORS: Record<RiskLevel, { stroke: string; fill: string; text: string; bg: string; border: string }> = {
  'Low': {
    stroke: '#15803d',
    fill: '#22c55e',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/30',
  },
  'High': {
    stroke: '#ea580c',
    fill: '#fdba74',
    text: 'text-orange-300',
    bg: 'bg-orange-950/60',
    border: 'border-orange-400/30',
  },
  'Very High': {
    stroke: '#450a0a',
    fill: '#991b1b',
    text: 'text-rose-400',
    bg: 'bg-red-950/80',
    border: 'border-red-600/40',
  },
};

export const ALLOWED_DISTRICTS = [
  'Shivamogga',
  'Chikkamagaluru',
  'Udupi',
  'Dakshina Kannada',
] as const;

export type AllowedDistrict = (typeof ALLOWED_DISTRICTS)[number];

export function standardizeDistrictName(rawName?: string | null): AllowedDistrict | null {
  if (!rawName) return null;
  const cleaned = rawName.trim().toLowerCase();
  if (cleaned === 'shimoga' || cleaned === 'shivamogga') {
    return 'Shivamogga';
  }
  if (cleaned === 'chikkamagaluru' || cleaned === 'chikmagalur') {
    return 'Chikkamagaluru';
  }
  if (cleaned === 'udupi') {
    return 'Udupi';
  }
  if (cleaned === 'dakshina kannada' || cleaned === 'dakshinakannada') {
    return 'Dakshina Kannada';
  }
  // Any other district (such as Haveri) is rejected
  return null;
}

export function formatNum(val: unknown, decimals = 2): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
