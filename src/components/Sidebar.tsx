import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  Crosshair,
  Sliders,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  CloudRain,
  Mountain,
  Gauge,
  Loader2,
  Building2,
} from 'lucide-react';
import {
  LandslideProperties,
  LayerVisibility,
  LayerOpacity,
  RiskLevel,
  GeoJsonFeature,
  GisTab,
} from '../types/gis';
import { getRiskLevel, RISK_COLORS, formatNum, standardizeDistrictName, AllowedDistrict } from '../utils/gis';
import { SusceptibilitySampleResult } from '../utils/rasterSampler';

interface SidebarProps {
  activeTab: GisTab;
  setActiveTab: (tab: GisTab) => void;
  isOpen: boolean;
  onClose: () => void;
  layerVisibility: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  layerOpacity: LayerOpacity;
  onChangeOpacity: (layer: keyof LayerOpacity, val: number) => void;
  selectedRiskFilters: Record<RiskLevel, boolean>;
  onToggleRiskFilter: (risk: RiskLevel) => void;
  selectedDistrict: string;
  onChangeDistrict: (dist: string) => void;
  availableDistricts: string[];
  minSusceptibility: number;
  onChangeMinSusceptibility: (val: number) => void;
  maxDistanceToRoad: number;
  onChangeMaxDistanceToRoad: (val: number) => void;
  markerRadius: number;
  onChangeMarkerRadius: (val: number) => void;
  selectedPoint: GeoJsonFeature<LandslideProperties, GeoJSON.Point> | null;
  onSelectPoint: (pt: GeoJsonFeature<LandslideProperties, GeoJSON.Point>) => void;
  onZoomToPoint: (lat: number, lng: number) => void;
  allLandslideFeatures: GeoJsonFeature<LandslideProperties, GeoJSON.Point>[];
  filteredLandslideFeatures: GeoJsonFeature<LandslideProperties, GeoJSON.Point>[];
  districtsCount: number;
  roadsCount: number;
  susceptibilitySample: SusceptibilitySampleResult | null;
  isSamplingRaster: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  layerVisibility,
  onToggleLayer,
  layerOpacity,
  onChangeOpacity,
  selectedRiskFilters,
  onToggleRiskFilter,
  selectedDistrict,
  onChangeDistrict,
  availableDistricts,
  minSusceptibility,
  onChangeMinSusceptibility,
  maxDistanceToRoad,
  onChangeMaxDistanceToRoad,
  markerRadius,
  onChangeMarkerRadius,
  selectedPoint,
  onSelectPoint,
  onZoomToPoint,
  allLandslideFeatures,
  filteredLandslideFeatures,
  districtsCount,
  roadsCount,
  susceptibilitySample,
  isSamplingRaster,
}) => {
  const [copiedCoord, setCopiedCoord] = useState(false);

  // Analytics computation
  const analyticsData = useMemo(() => {
    const pts = allLandslideFeatures;
    if (pts.length === 0) return null;

    let totalRainfall = 0;
    let totalElevation = 0;
    let totalSlope = 0;
    let countRoadNear = 0;
    const districtCounts: Record<string, number> = {};
    const geomCounts: Record<string, number> = {};
    const riskCounts: Record<RiskLevel, number> = { 'Very High': 0, High: 0, Low: 0 };

    pts.forEach((f) => {
      const p = f.properties;
      const risk = getRiskLevel(p);
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;

      if (p.Rainfall1) totalRainfall += Number(p.Rainfall1);
      if (p.Elevation1) totalElevation += Number(p.Elevation1);
      if (p.slope1) totalSlope += Number(p.slope1);
      if (p.distance_to_road1 !== undefined && Number(p.distance_to_road1) <= 150) {
        countRoadNear++;
      }

      const d = p.District || 'Other';
      districtCounts[d] = (districtCounts[d] || 0) + 1;

      const g = p.Geomorphology || 'Unknown';
      geomCounts[g] = (geomCounts[g] || 0) + 1;
    });

    const topDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]);
    const topGeom = Object.entries(geomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total: pts.length,
      riskCounts,
      avgRainfall: (totalRainfall / pts.length).toFixed(0),
      avgElevation: (totalElevation / pts.length).toFixed(0),
      avgSlope: (totalSlope / pts.length).toFixed(1),
      countRoadNear,
      topDistricts,
      topGeom,
    };
  }, [allLandslideFeatures]);

  // District Risk Zone Analysis: calculated dynamically strictly for the 4 target districts
  const districtRiskData = useMemo(() => {
    const targetDistricts: AllowedDistrict[] = ['Shivamogga', 'Chikkamagaluru', 'Udupi', 'Dakshina Kannada'];
    const data: Record<AllowedDistrict, { total: number; low: number; high: number; veryHigh: number }> = {
      Shivamogga: { total: 0, low: 0, high: 0, veryHigh: 0 },
      Chikkamagaluru: { total: 0, low: 0, high: 0, veryHigh: 0 },
      Udupi: { total: 0, low: 0, high: 0, veryHigh: 0 },
      'Dakshina Kannada': { total: 0, low: 0, high: 0, veryHigh: 0 },
    };

    allLandslideFeatures.forEach((f) => {
      const std = standardizeDistrictName(f.properties?.District);
      if (std && data[std]) {
        const risk = getRiskLevel(f.properties);
        data[std].total++;
        if (risk === 'Very High') data[std].veryHigh++;
        else if (risk === 'High') data[std].high++;
        else data[std].low++;
      }
    });

    let maxTotal = { district: targetDistricts[0], count: -1 };
    let maxLow = { district: targetDistricts[0], count: -1 };
    let maxHigh = { district: targetDistricts[0], count: -1 };
    let maxVeryHigh = { district: targetDistricts[0], count: -1 };

    targetDistricts.forEach((d) => {
      const s = data[d];
      if (s.total > maxTotal.count) maxTotal = { district: d, count: s.total };
      if (s.low > maxLow.count) maxLow = { district: d, count: s.low };
      if (s.high > maxHigh.count) maxHigh = { district: d, count: s.high };
      if (s.veryHigh > maxVeryHigh.count) maxVeryHigh = { district: d, count: s.veryHigh };
    });

    return {
      districts: targetDistricts.map((d) => ({
        name: d,
        ...data[d],
      })),
      highlights: {
        maxTotal,
        maxLow,
        maxHigh,
        maxVeryHigh,
      },
    };
  }, [allLandslideFeatures]);

  const copyCoordinates = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] z-10 shrink-0 select-none shadow-xl">
      {/* Sidebar Header Tabs: Layers | Inspector | Analytics | Susceptibility */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'layers'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inspector'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Inspector</span>
          {selectedPoint && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('susceptibility')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'susceptibility'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Sample susceptibility raster"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Susceptibility</span>
          {susceptibilitySample && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200 text-xs">
        {/* TAB 1: LAYERS & FILTERS */}
        {activeTab === 'layers' && (
          <div className="space-y-6">
            {/* GIS Layers Visibility */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geospatial Layers</span>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {/* Landslide Points Layer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('landslides')}
                        className="text-slate-400 hover:text-white"
                        title={layerVisibility.landslides ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.landslides ? (
                          <Eye className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className="font-medium text-slate-200">Landslide Hazard Points</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {filteredLandslideFeatures.length} / {allLandslideFeatures.length}
                    </span>
                  </div>
                  {layerVisibility.landslides && (
                    <div className="pl-6 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono tabular-nums">{Math.round(layerOpacity.landslides * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layerOpacity.landslides}
                        onChange={(e) => onChangeOpacity('landslides', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Marker Radius</span>
                        <span className="font-mono tabular-nums">{markerRadius} px</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="14"
                        step="1"
                        value={markerRadius}
                        onChange={(e) => onChangeMarkerRadius(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Road Network Layer */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('roads')}
                        className="text-slate-400 hover:text-white"
                        title={layerVisibility.roads ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.roads ? (
                          <Eye className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className="w-3 h-1 bg-yellow-400 rounded-sm shadow-[0_0_4px_#facc15] inline-block"></span>
                      <span className="font-medium text-slate-200">Road Network (OSM)</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">{roadsCount} ways</span>
                  </div>
                  {layerVisibility.roads && (
                    <div className="pl-6 space-y-1 mt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono tabular-nums">{Math.round(layerOpacity.roads * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layerOpacity.roads}
                        onChange={(e) => onChangeOpacity('roads', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* District Boundaries Layer */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('districts')}
                        className="text-slate-400 hover:text-white"
                        title={layerVisibility.districts ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.districts ? (
                          <Eye className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className="font-medium text-slate-200">District Boundaries</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">{districtsCount}</span>
                  </div>
                  {layerVisibility.districts && (
                    <div className="pl-6 space-y-1 mt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Fill Opacity</span>
                        <span className="font-mono tabular-nums">{Math.round(layerOpacity.districts * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={layerOpacity.districts}
                        onChange={(e) => onChangeOpacity('districts', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Level Category Filters */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hazard Level Filter</span>
                </span>
                <span className="text-[10px] text-slate-500">Toggle risk visibility</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Very High', 'High', 'Low'] as RiskLevel[]).map((level) => {
                  const color = RISK_COLORS[level];
                  const isActive = selectedRiskFilters[level];
                  const count = allLandslideFeatures.filter(
                    (f) => getRiskLevel(f.properties) === level
                  ).length;
                  const threshold =
                    level === 'Very High' ? '>80%' : level === 'High' ? '>60–80%' : '0–60%';

                  return (
                    <button
                      key={level}
                      onClick={() => onToggleRiskFilter(level)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isActive
                          ? `${color.bg} ${color.border} shadow-sm ring-1 ring-${color.fill}/30`
                          : 'bg-slate-950/40 border-slate-800 opacity-40 hover:opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color.fill }}
                        />
                        <span className="font-semibold text-[11px] text-slate-200">{level}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mb-1">{threshold}</div>
                      <div className="font-mono font-bold text-sm text-white tabular-nums">
                        {count.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* District Spatial Filter */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filter by District</span>
              </div>
              <select
                value={selectedDistrict}
                onChange={(e) => onChangeDistrict(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="ALL">All Districts ({allLandslideFeatures.length} points)</option>
                {availableDistricts.map((d) => {
                  const count = allLandslideFeatures.filter((f) => f.properties.District === d).length;
                  return (
                    <option key={d} value={d}>
                      {d} District ({count} points)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Susceptibility Percentage Threshold */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <span>Min Susceptibility Threshold</span>
                <span className="font-mono text-cyan-400 tabular-nums">≥ {minSusceptibility}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={minSusceptibility}
                onChange={(e) => onChangeMinSusceptibility(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>50%</span>
                <span>70%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Distance to Road Filter */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <span>Max Road Proximity (m)</span>
                <span className="font-mono text-cyan-400 tabular-nums">
                  {maxDistanceToRoad >= 1000 ? 'Any Distance' : `≤ ${maxDistanceToRoad} m`}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={maxDistanceToRoad}
                onChange={(e) => onChangeMaxDistanceToRoad(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>50m</span>
                <span>500m</span>
                <span>All</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSPECTOR (Selected Feature) */}
        {activeTab === 'inspector' && (
          <div className="space-y-4">
            {selectedPoint ? (
              <div className="space-y-4">
                {/* Header Card */}
                {(() => {
                  const p = selectedPoint.properties;
                  const risk = getRiskLevel(p);
                  const color = RISK_COLORS[risk];
                  const coords = selectedPoint.geometry.coordinates as [number, number];

                  return (
                    <>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              FID #{p.fid} · POINT_ID #{p.Point_ID}
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">
                              {p.Village || 'Unincorporated Region'}
                            </h3>
                            <div className="text-[11px] text-slate-400">
                              {p.Taluk || '—'}, {p.District || '—'}
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${color.stroke}33`,
                              color: color.fill,
                              border: `1px solid ${color.stroke}`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color.fill }}
                            />
                            {risk} Risk
                          </span>
                        </div>

                        {/* Coordinates with Copy & Zoom */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                          <span className="text-slate-400">
                            {formatNum(coords[1], 5)}° N, {formatNum(coords[0], 5)}° E
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyCoordinates(coords[1], coords[0])}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                              title="Copy Coordinates"
                            >
                              {copiedCoord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => onZoomToPoint(coords[1], coords[0])}
                              className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/60 text-cyan-400 hover:bg-cyan-900 rounded text-[10px] font-sans font-medium flex items-center gap-1 transition-colors"
                            >
                              <Crosshair className="w-3 h-3" />
                              <span>Zoom</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Susceptibility & Model Probability */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Risk Classification</span>
                          </span>
                          <span className="font-mono text-xs font-bold" style={{ color: color.fill }}>
                            {formatNum(p.Susceptibility_Percentage, 1)}% ({risk})
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(5, Number(p.Susceptibility_Percentage || 50)))}%`,
                              backgroundColor: color.fill,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                          <span>Threshold Scale: <strong className="text-slate-300 font-mono">{risk === 'Very High' ? '>80–100%' : risk === 'High' ? '>60–80%' : '0–60%'}</strong></span>
                          <span className="font-semibold" style={{ color: color.fill }}>{risk} Risk Tier</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Model Probability</span>
                            <span className="font-mono font-semibold text-slate-200">
                              {p.Landslide_Probability !== undefined
                                ? (Number(p.Landslide_Probability) * 100).toFixed(1) + '%'
                                : '—'}
                            </span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Binary Prediction</span>
                            <span className="font-mono font-semibold text-slate-200">
                              {p.Landslide_Prediction ? 'Positive (Hazard)' : 'Negative'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Topographic & Environmental Variables */}
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Terrain & Geomorphology</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Elevation</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.Elevation1, 0)} <span className="text-[10px] text-slate-400 font-sans">m</span>
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Slope Gradient</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.slope1, 1)} <span className="text-[10px] text-slate-400 font-sans">°</span>
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Aspect Angle</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.aspect1, 1)} <span className="text-[10px] text-slate-400 font-sans">°</span>
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Profile Curvature</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.profile_curvature1, 4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hydro & Climate */}
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Hydrological & Vegetation Factors</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Rainfall</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.Rainfall1, 0)} <span className="text-[10px] text-slate-400 font-sans">mm</span>
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Dist to Road</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.distance_to_road1, 0)} <span className="text-[10px] text-slate-400 font-sans">m</span>
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">NDVI (Vegetation)</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.NDVI1, 3)}
                            </span>
                          </div>
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">TWI (Wetness)</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                              {formatNum(p.TWI1, 2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Geomorphology Description */}
                      {p.Geomorphology && (
                        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase mb-1">
                            Geomorphological Unit
                          </span>
                          <span className="text-slate-200 font-medium">{p.Geomorphology}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">No Landslide Point Selected</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Click any point marker on the map to inspect its terrain, rainfall, and model attributes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('susceptibility')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md font-medium text-xs transition-colors inline-block"
                >
                  Switch to Susceptibility Tool
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographical Hazard Metrics</span>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Avg Rainfall</span>
                  <div className="font-mono text-lg font-bold text-slate-100 mt-0.5">
                    {analyticsData.avgRainfall} <span className="text-xs text-slate-400 font-sans">mm</span>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Avg Slope</span>
                  <div className="font-mono text-lg font-bold text-slate-100 mt-0.5">
                    {analyticsData.avgSlope}°
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Avg Elevation</span>
                  <div className="font-mono text-lg font-bold text-slate-100 mt-0.5">
                    {analyticsData.avgElevation} <span className="text-xs text-slate-400 font-sans">m</span>
                  </div>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Near Roads (&lt;150m)</span>
                  <div className="font-mono text-lg font-bold text-amber-400 mt-0.5">
                    {analyticsData.countRoadNear} <span className="text-xs text-slate-400 font-sans">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Class Breakdown */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Risk Distribution Breakdown
              </span>
              <div className="space-y-2">
                {(['Very High', 'High', 'Low'] as RiskLevel[]).map((level) => {
                  const count = analyticsData.riskCounts[level];
                  const pct = ((count / analyticsData.total) * 100).toFixed(1);
                  const color = RISK_COLORS[level];
                  const range = level === 'Very High' ? '>80–100%' : level === 'High' ? '>60–80%' : '0–60%';

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.fill }}
                          />
                          <span>
                            {level} <span className="text-[10px] text-slate-500 font-mono">({range})</span>
                          </span>
                        </span>
                        <span className="font-mono text-slate-300">
                          {count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color.fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1. DISTRICT RISK ZONE ANALYSIS (Strictly for the 4 target districts) */}
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>District Risk Zone Analysis</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                  4 Target Districts
                </span>
              </div>

              {/* Dynamic Highlights / Records */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Category High Points
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-md p-2 flex flex-col justify-between">
                    <span className="text-slate-400 font-medium">Most Total Zones</span>
                    <div className="font-semibold text-slate-100 text-xs mt-1 truncate">
                      {districtRiskData.highlights.maxTotal.district}
                    </div>
                    <span className="font-mono text-cyan-400 font-bold text-[11px] mt-0.5">
                      {districtRiskData.highlights.maxTotal.count} zones
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-red-950/80 rounded-md p-2 flex flex-col justify-between">
                    <span className="text-slate-400 font-medium">Most Very High Risk</span>
                    <div className="font-semibold text-rose-300 text-xs mt-1 truncate">
                      {districtRiskData.highlights.maxVeryHigh.district}
                    </div>
                    <span className="font-mono text-rose-400 font-bold text-[11px] mt-0.5">
                      {districtRiskData.highlights.maxVeryHigh.count} zones
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-orange-950/80 rounded-md p-2 flex flex-col justify-between">
                    <span className="text-slate-400 font-medium">Most High Risk</span>
                    <div className="font-semibold text-orange-200 text-xs mt-1 truncate">
                      {districtRiskData.highlights.maxHigh.district}
                    </div>
                    <span className="font-mono text-orange-400 font-bold text-[11px] mt-0.5">
                      {districtRiskData.highlights.maxHigh.count} zones
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-emerald-950/80 rounded-md p-2 flex flex-col justify-between">
                    <span className="text-slate-400 font-medium">Most Low Risk</span>
                    <div className="font-semibold text-emerald-200 text-xs mt-1 truncate">
                      {districtRiskData.highlights.maxLow.district}
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-[11px] mt-0.5">
                      {districtRiskData.highlights.maxLow.count} zones
                    </span>
                  </div>
                </div>
              </div>

              {/* District Breakdown Cards */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  District Risk Distributions
                </span>
                {districtRiskData.districts.map((d) => {
                  const isMaxTotal = d.name === districtRiskData.highlights.maxTotal.district;
                  const isMaxVeryHigh = d.name === districtRiskData.highlights.maxVeryHigh.district;
                  const isMaxHigh = d.name === districtRiskData.highlights.maxHigh.district;
                  const isMaxLow = d.name === districtRiskData.highlights.maxLow.district;

                  const lowPct = d.total > 0 ? (d.low / d.total) * 100 : 0;
                  const highPct = d.total > 0 ? (d.high / d.total) * 100 : 0;
                  const veryHighPct = d.total > 0 ? (d.veryHigh / d.total) * 100 : 0;

                  return (
                    <div
                      key={d.name}
                      className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 space-y-2 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-100 text-xs">{d.name}</span>
                          {isMaxVeryHigh && (
                            <span className="px-1.5 py-0.5 bg-red-950 text-rose-300 border border-red-800/80 rounded text-[9px] font-medium leading-none">
                              Highest Very High
                            </span>
                          )}
                          {isMaxTotal && (
                            <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded text-[9px] font-medium leading-none">
                              Highest Total
                            </span>
                          )}
                          {isMaxHigh && !isMaxTotal && (
                            <span className="px-1.5 py-0.5 bg-orange-950 text-orange-300 border border-orange-800/80 rounded text-[9px] font-medium leading-none">
                              Highest High
                            </span>
                          )}
                          {isMaxLow && !isMaxTotal && (
                            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded text-[9px] font-medium leading-none">
                              Highest Low
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {d.total} <span className="text-[10px] text-slate-500 font-normal">zones</span>
                        </span>
                      </div>

                      {/* 3 Risk Columns */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="bg-slate-950/70 p-1.5 rounded border border-emerald-950/60">
                          <span className="text-slate-400 block text-[9px]">Low Risk</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs block">
                            {d.low}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {lowPct.toFixed(0)}%
                          </span>
                        </div>

                        <div className="bg-slate-950/70 p-1.5 rounded border border-orange-950/60">
                          <span className="text-slate-400 block text-[9px]">High Risk</span>
                          <span className="font-mono font-bold text-orange-400 text-xs block">
                            {d.high}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {highPct.toFixed(0)}%
                          </span>
                        </div>

                        <div className="bg-slate-950/70 p-1.5 rounded border border-red-950/60">
                          <span className="text-slate-400 block text-[9px]">Very High</span>
                          <span className="font-mono font-bold text-rose-400 text-xs block">
                            {d.veryHigh}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {veryHighPct.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Segmented Risk Ratio Bar */}
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${lowPct}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Low Risk: ${d.low} (${lowPct.toFixed(1)}%)`}
                        />
                        <div
                          style={{ width: `${highPct}%` }}
                          className="bg-orange-500 h-full"
                          title={`High Risk: ${d.high} (${highPct.toFixed(1)}%)`}
                        />
                        <div
                          style={{ width: `${veryHighPct}%` }}
                          className="bg-red-600 h-full"
                          title={`Very High Risk: ${d.veryHigh} (${veryHighPct.toFixed(1)}%)`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geomorphology distribution */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Dominant Geomorphology
              </span>
              <div className="space-y-1.5">
                {analyticsData.topGeom.map(([geom, count]) => (
                  <div key={geom} className="text-[11px] py-1 border-b border-slate-900 last:border-0 flex justify-between gap-2">
                    <span className="text-slate-300 truncate">{geom}</span>
                    <span className="font-mono text-slate-400 tabular-nums shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUSCEPTIBILITY RASTER SAMPLER (Directly replacing Directory) */}
        {activeTab === 'susceptibility' && (
          <div className="space-y-4">
            {/* Header Callout: "Click inside the susceptibility map to check landslide risk." */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  <span>Raster Query</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">lsm_map_web.tif</span>
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug">
                Click inside the susceptibility map to check landslide risk.
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Queries the 30-meter continuous landslide susceptibility model (EPSG:32643 UTM 43N).
              </p>
            </div>

            {/* Loading Indicator */}
            {isSamplingRaster && (
              <div className="py-8 text-center space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-200 font-medium">Sampling raster pixel...</p>
                <p className="text-[10px] font-mono text-slate-500">Window read from lsm_map_web.tif</p>
              </div>
            )}

            {/* Results Display */}
            {!isSamplingRaster && susceptibilitySample && (
              <div className="space-y-3">
                {/* Case 1: Outside Raster Extent */}
                {susceptibilitySample.status === 'outside' && (
                  <div className="bg-red-950/40 border border-red-500/40 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>Out of Bounds</span>
                    </div>
                    <div className="text-xs font-semibold text-red-200">
                      Please click inside the susceptibility map area.
                    </div>
                    <div className="pt-2 border-t border-red-900/40 text-[11px] font-mono text-slate-400 space-y-1">
                      <div>Lat: {formatNum(susceptibilitySample.latitude, 5)}° N</div>
                      <div>Lng: {formatNum(susceptibilitySample.longitude, 5)}° E</div>
                      <div className="text-[10px] text-slate-500 pt-1">
                        Coordinates fall outside the geographic coverage of lsm_map_web.tif.
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 2: NoData Pixel */}
                {susceptibilitySample.status === 'nodata' && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>NoData Location</span>
                    </div>
                    <div className="text-xs font-semibold text-amber-200">
                      No susceptibility data available at this location.
                    </div>
                    <div className="pt-2 border-t border-amber-900/40 text-[11px] font-mono text-slate-400 space-y-1">
                      <div>Lat: {formatNum(susceptibilitySample.latitude, 5)}° N</div>
                      <div>Lng: {formatNum(susceptibilitySample.longitude, 5)}° E</div>
                      <div className="text-[10px] text-slate-500 pt-1">
                        Location is within the bounding area but lacks valid raster data.
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 3: Valid Susceptibility Sample */}
                {susceptibilitySample.status === 'valid' && (() => {
                  const color = RISK_COLORS[susceptibilitySample.riskClass];
                  return (
                    <div className="space-y-3">
                      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 space-y-3 shadow-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              Calculated Susceptibility
                            </span>
                            <div className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                              {formatNum(susceptibilitySample.susceptibility, 2)}%
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${color.stroke}33`,
                              color: color.fill,
                              border: `1px solid ${color.stroke}`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color.fill }}
                            />
                            {susceptibilitySample.riskClass} Risk
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(5, susceptibilitySample.susceptibility))}%`,
                                backgroundColor: color.fill,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                            <span>0%</span>
                            <span>60% (Low)</span>
                            <span>80% (High)</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Explicit Attributes Card */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400">Susceptibility</span>
                            <span className="font-mono font-bold" style={{ color: color.fill }}>
                              {formatNum(susceptibilitySample.susceptibility, 2)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400">Risk Class</span>
                            <span className="font-semibold text-slate-200">
                              {susceptibilitySample.riskClass}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="text-slate-400">Latitude</span>
                            <span className="font-mono text-slate-200">
                              {formatNum(susceptibilitySample.latitude, 5)}° N
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400">Longitude</span>
                            <span className="font-mono text-slate-200">
                              {formatNum(susceptibilitySample.longitude, 5)}° E
                            </span>
                          </div>
                        </div>

                        {/* Copy Coordinates & Zoom Controls */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() =>
                              copyCoordinates(
                                susceptibilitySample.latitude,
                                susceptibilitySample.longitude
                              )
                            }
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-800"
                          >
                            {copiedCoord ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedCoord ? 'Copied' : 'Copy Coords'}</span>
                          </button>
                          <button
                            onClick={() =>
                              onZoomToPoint(
                                susceptibilitySample.latitude,
                                susceptibilitySample.longitude
                              )
                            }
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded text-[11px] font-medium flex items-center gap-1 transition-colors border border-cyan-800/60"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>Center Map</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Empty State Instructions */}
            {!isSamplingRaster && !susceptibilitySample && (
              <div className="py-10 px-4 text-center space-y-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <Crosshair className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">
                    Click inside the susceptibility map to check landslide risk.
                  </h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Click anywhere inside the Western Ghats region on the map to query the underlying 30-meter susceptibility GeoTIFF pixel.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-400 font-mono text-left space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Risk Classification Rules:</div>
                  <div className="text-emerald-400">● 0–60% → Low Risk (Green)</div>
                  <div className="text-orange-300">● &gt;60–80% → High Risk (Orange)</div>
                  <div className="text-rose-400">● &gt;80–100% → Very High Risk (Red)</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
