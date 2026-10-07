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
  const sc = (properties?.Susceptibility_Class || '').toString().trim().toLowerCase();
  if (sc === 'very high' || sc === 'very_high' || sc === 'veryhigh') {
    return 'Very High';
  }
  if (sc === 'high') {
    return 'High';
  }
  if (sc === 'low') {
    return 'Low';
  }

  const alt = (
    properties?.risk_level ||
    properties?.risk ||
    properties?.Hazard ||
    ''
  ).toString().trim().toLowerCase();
  if (alt.includes('very high') || alt === 'very_high') return 'Very High';
  if (alt.includes('high')) return 'High';
  if (alt.includes('low')) return 'Low';

  const pct = Number(properties?.Susceptibility_Percentage);
  if (!isNaN(pct) && pct > 0) {
    if (pct >= 75) return 'Very High';
    if (pct >= 50) return 'High';
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
    stroke: '#c2410c',
    fill: '#f97316',
    text: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/30',
  },
  'Very High': {
    stroke: '#b91c1c',
    fill: '#ef4444',
    text: 'text-red-400',
    bg: 'bg-red-950/60',
    border: 'border-red-500/30',
  },
};

export function formatNum(val: unknown, decimals = 2): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
