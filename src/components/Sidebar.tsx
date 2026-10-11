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
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  CloudRain,
  Mountain,
  Gauge,
  Loader2,
  Building2,
  Images,
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
  isOpen?: boolean;
  onClose?: () => void;
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
  isSamplingRaster?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = true,
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
    <aside className="w-80 bg-[#17251F] border-r border-[#A9B4AB]/25 flex flex-col h-full z-10 shrink-0 select-none text-[#F3F4EF]">
      {/* Panel Top Bar */}
      <div className="h-9 px-3.5 border-b border-[#A9B4AB]/20 bg-[#101a15]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#D5DFD4]">
          {activeTab === 'layers' && (
            <>
              <Layers className="w-3.5 h-3.5 text-[#A9B4AB]" />
              <span>Layers & Controls</span>
            </>
          )}
          {activeTab === 'inspector' && (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#A9B4AB]" />
              <span>Feature Inspector</span>
            </>
          )}
          {activeTab === 'analytics' && (
            <>
              <BarChart3 className="w-3.5 h-3.5 text-[#A9B4AB]" />
              <span>Spatial Analytics</span>
            </>
          )}
          {activeTab === 'susceptibility' && (
            <>
              <Crosshair className="w-3.5 h-3.5 text-[#A9B4AB]" />
              <span>Susceptibility Sampler</span>
            </>
          )}
          {activeTab === 'lcf' && (
            <>
              <Images className="w-3.5 h-3.5 text-[#A9B4AB]" />
              <span>Conditioning Factors</span>
            </>
          )}
        </div>

        <span className="font-mono text-[11px] text-[#A9B4AB] tabular-nums">
          {filteredLandslideFeatures.length} / {allLandslideFeatures.length} pts
        </span>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-[#F3F4EF]">
        {/* TAB 1: LAYERS & FILTERS */}
        {activeTab === 'layers' && (
          <div className="space-y-4">
            {/* 1. Geospatial Layers */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-[#D5DFD4]" />
                <span>Geospatial Layers</span>
              </div>

              <div className="space-y-2 bg-[#26362E]/60 p-3 rounded border border-[#A9B4AB]/20">
                {/* Landslide Hazard Points */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('landslides')}
                        className="text-[#A9B4AB] hover:text-[#F3F4EF]"
                        title={layerVisibility.landslides ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.landslides ? (
                          <Eye className="w-3.5 h-3.5 text-[#D5DFD4]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-[#A9B4AB]/50" />
                        )}
                      </button>
                      <span className="font-medium text-[#F3F4EF] text-[13px]">Hazard Points</span>
                    </div>
                    <span className="font-mono text-xs text-[#A9B4AB] tabular-nums">
                      {filteredLandslideFeatures.length}
                    </span>
                  </div>

                  {layerVisibility.landslides && (
                    <div className="pl-5 space-y-2.5 mt-2.5 pt-2 border-t border-[#A9B4AB]/15">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#A9B4AB]">
                          <span>Opacity</span>
                          <span className="font-mono text-[#D5DFD4] tabular-nums">{Math.round(layerOpacity.landslides * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={layerOpacity.landslides}
                          onChange={(e) => onChangeOpacity('landslides', parseFloat(e.target.value))}
                          className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#A9B4AB]">
                          <span>Marker Radius</span>
                          <span className="font-mono text-[#D5DFD4] tabular-nums">{markerRadius} px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="14"
                          step="1"
                          value={markerRadius}
                          onChange={(e) => onChangeMarkerRadius(parseInt(e.target.value))}
                          className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Road Network */}
                <div className="pt-2.5 border-t border-[#A9B4AB]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('roads')}
                        className="text-[#A9B4AB] hover:text-[#F3F4EF]"
                        title={layerVisibility.roads ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.roads ? (
                          <Eye className="w-3.5 h-3.5 text-[#D5DFD4]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-[#A9B4AB]/50" />
                        )}
                      </button>
                      <span className="w-3 h-1 bg-amber-400 rounded-xs inline-block" />
                      <span className="font-medium text-[#F3F4EF] text-[13px]">Road Network</span>
                    </div>
                    <span className="font-mono text-xs text-[#A9B4AB] tabular-nums">{roadsCount}</span>
                  </div>

                  {layerVisibility.roads && (
                    <div className="pl-5 space-y-1 mt-2 pt-2 border-t border-[#A9B4AB]/15">
                      <div className="flex items-center justify-between text-[11px] text-[#A9B4AB]">
                        <span>Opacity</span>
                        <span className="font-mono text-[#D5DFD4] tabular-nums">{Math.round(layerOpacity.roads * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layerOpacity.roads}
                        onChange={(e) => onChangeOpacity('roads', parseFloat(e.target.value))}
                        className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* District Boundaries */}
                <div className="pt-2.5 border-t border-[#A9B4AB]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleLayer('districts')}
                        className="text-[#A9B4AB] hover:text-[#F3F4EF]"
                        title={layerVisibility.districts ? 'Hide layer' : 'Show layer'}
                      >
                        {layerVisibility.districts ? (
                          <Eye className="w-3.5 h-3.5 text-[#D5DFD4]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-[#A9B4AB]/50" />
                        )}
                      </button>
                      <span className="w-2.5 h-2.5 border border-dashed border-sky-400 bg-sky-500/10 rounded-xs inline-block" />
                      <span className="font-medium text-[#F3F4EF] text-[13px]">District Borders</span>
                    </div>
                    <span className="font-mono text-xs text-[#A9B4AB] tabular-nums">{districtsCount}</span>
                  </div>

                  {layerVisibility.districts && (
                    <div className="pl-5 space-y-1 mt-2 pt-2 border-t border-[#A9B4AB]/15">
                      <div className="flex items-center justify-between text-[11px] text-[#A9B4AB]">
                        <span>Fill Opacity</span>
                        <span className="font-mono text-[#D5DFD4] tabular-nums">{Math.round(layerOpacity.districts * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={layerOpacity.districts}
                        onChange={(e) => onChangeOpacity('districts', parseFloat(e.target.value))}
                        className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Risk Level Filter (Green for Low, Orange for High, Red for Very High) */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1.5 flex items-center justify-between">
                <span>Hazard Classification Filter</span>
                <span className="text-[10px] text-[#A9B4AB]/70 lowercase">toggle tiers</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
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
                      className={`p-2 rounded border text-left transition-colors ${
                        isActive
                          ? 'bg-[#26362E] border-[#A9B4AB]/35'
                          : 'bg-[#101a15]/50 border-[#A9B4AB]/15 opacity-45 hover:opacity-65'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color.fill }}
                        />
                        <span className="font-medium text-xs text-[#F3F4EF] truncate">{level}</span>
                      </div>
                      <div className="text-[11px] text-[#A9B4AB] font-mono leading-none mb-1">{threshold}</div>
                      <div className="font-mono font-semibold text-xs text-[#F3F4EF] tabular-nums">
                        {count.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Geographic & Proximity Filters */}
            <div className="space-y-3 pt-2 border-t border-[#A9B4AB]/20">
              {/* District Filter */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1 flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-[#D5DFD4]" />
                  <span>District Extent</span>
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => onChangeDistrict(e.target.value)}
                  className="w-full bg-[#101a15] border border-[#A9B4AB]/30 rounded px-2.5 py-1.5 text-[13px] text-[#F3F4EF] focus:outline-none focus:border-[#D5DFD4]"
                >
                  <option value="ALL">All Districts ({allLandslideFeatures.length} points)</option>
                  {availableDistricts.map((d) => {
                    const count = allLandslideFeatures.filter((f) => f.properties.District === d).length;
                    return (
                      <option key={d} value={d}>
                        {d} ({count} points)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Susceptibility Threshold */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#A9B4AB] font-mono">
                  <span>MIN SUSCEPTIBILITY</span>
                  <span className="text-[#D5DFD4] font-semibold tabular-nums">≥ {minSusceptibility}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={minSusceptibility}
                  onChange={(e) => onChangeMinSusceptibility(parseInt(e.target.value))}
                  className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                />
              </div>

              {/* Road Proximity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#A9B4AB] font-mono">
                  <span>MAX ROAD PROXIMITY</span>
                  <span className="text-[#D5DFD4] font-semibold tabular-nums">
                    {maxDistanceToRoad >= 1000 ? 'Any distance' : `≤ ${maxDistanceToRoad} m`}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={maxDistanceToRoad}
                  onChange={(e) => onChangeMaxDistanceToRoad(parseInt(e.target.value))}
                  className="w-full accent-[#D5DFD4] h-1.5 bg-[#101a15] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSPECTOR (Selected Feature) */}
        {activeTab === 'inspector' && (
          <div className="space-y-3">
            {selectedPoint ? (
              <div className="space-y-3">
                {(() => {
                  const p = selectedPoint.properties;
                  const risk = getRiskLevel(p);
                  const color = RISK_COLORS[risk];
                  const coords = selectedPoint.geometry.coordinates as [number, number];

                  return (
                    <>
                      {/* Identity Header */}
                      <div className="bg-[#26362E]/70 border border-[#A9B4AB]/25 rounded p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[11px] font-mono uppercase text-[#A9B4AB]">
                              FID #{p.fid} · ID #{p.Point_ID}
                            </span>
                            <h3 className="text-sm font-semibold text-[#F3F4EF] mt-0.5 truncate">
                              {p.Village || 'Unincorporated'}
                            </h3>
                            <div className="text-xs text-[#A9B4AB] truncate">
                              {p.Taluk || '—'}, {p.District || '—'}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0 flex items-center gap-1.5 bg-[#17251F] border border-[#A9B4AB]/25">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color.fill }}
                            />
                            <span className="text-[#F3F4EF]">{risk}</span>
                          </span>
                        </div>

                        {/* Coordinates and Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#A9B4AB]/20 font-mono text-[11px] text-[#A9B4AB]">
                          <span>
                            {formatNum(coords[1], 4)}° N, {formatNum(coords[0], 4)}° E
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyCoordinates(coords[1], coords[0])}
                              className="text-[#A9B4AB] hover:text-[#F3F4EF] p-1 rounded hover:bg-[#17251F] transition-colors"
                              title="Copy Coordinates"
                            >
                              {copiedCoord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => onZoomToPoint(coords[1], coords[0])}
                              className="px-2 py-0.5 bg-[#17251F] hover:bg-[#34473d] text-[#F3F4EF] border border-[#A9B4AB]/30 rounded text-[11px] font-mono transition-colors"
                            >
                              Zoom
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Susceptibility Assessment */}
                      <div className="bg-[#26362E]/70 border border-[#A9B4AB]/25 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-[11px] font-mono uppercase text-[#A9B4AB] flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-[#D5DFD4]" />
                            <span>Susceptibility Score</span>
                          </span>
                          <span className="font-mono font-semibold text-[#F3F4EF] tabular-nums">
                            {formatNum(p.Susceptibility_Percentage, 1)}%
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-[#101a15] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(5, Number(p.Susceptibility_Percentage || 50)))}%`,
                              backgroundColor: color.fill,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#A9B4AB]/15 text-[11px]">
                          <div>
                            <span className="text-[#A9B4AB] block">Probability</span>
                            <span className="font-mono text-[#F3F4EF] font-semibold">
                              {p.Landslide_Probability !== undefined
                                ? (Number(p.Landslide_Probability) * 100).toFixed(1) + '%'
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#A9B4AB] block">Binary Output</span>
                            <span className="font-mono text-[#F3F4EF] font-semibold">
                              {p.Landslide_Prediction ? 'Positive' : 'Negative'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Terrain Attributes Table */}
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1.5 flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-[#D5DFD4]" />
                          <span>Terrain Parameters</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Elevation</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.Elevation1, 0)} <span className="text-[11px] text-[#A9B4AB] font-sans">m</span>
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Slope</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.slope1, 1)}°
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Aspect</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.aspect1, 1)}°
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Prof. Curvature</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.profile_curvature1, 4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hydrological & Environmental Factors */}
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1.5 flex items-center gap-1.5">
                          <CloudRain className="w-3.5 h-3.5 text-[#D5DFD4]" />
                          <span>Hydro & Environmental</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Rainfall</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.Rainfall1, 0)} <span className="text-[11px] text-[#A9B4AB] font-sans">mm</span>
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Dist to Road</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.distance_to_road1, 0)} <span className="text-[11px] text-[#A9B4AB] font-sans">m</span>
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">NDVI</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.NDVI1, 3)}
                            </span>
                          </div>
                          <div className="bg-[#101a15]/70 p-2 rounded border border-[#A9B4AB]/20">
                            <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">TWI</span>
                            <span className="font-mono font-semibold text-[#F3F4EF] text-[13px]">
                              {formatNum(p.TWI1, 2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Geomorphology */}
                      {p.Geomorphology && (
                        <div className="bg-[#101a15]/70 p-2.5 rounded border border-[#A9B4AB]/20 text-xs">
                          <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block mb-0.5">
                            Geomorphological Unit
                          </span>
                          <span className="text-[#F3F4EF] font-medium">{p.Geomorphology}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="py-10 px-3 text-center space-y-2 text-[#A9B4AB]">
                <MapPin className="w-5 h-5 text-[#A9B4AB]/60 mx-auto" />
                <div className="text-[13px] font-medium text-[#F3F4EF]">No Feature Selected</div>
                <p className="text-xs text-[#A9B4AB] max-w-xs mx-auto leading-relaxed">
                  Click any point marker on the map to inspect its terrain, rainfall, and model attributes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-4">
            {/* Regional Metrics */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D5DFD4]" />
                <span>Regional Hazard Metrics</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-[#26362E]/70 p-2.5 rounded border border-[#A9B4AB]/25">
                  <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Avg Rainfall</span>
                  <div className="font-mono text-base font-semibold text-[#F3F4EF] mt-0.5">
                    {analyticsData.avgRainfall} <span className="text-[11px] text-[#A9B4AB] font-sans">mm</span>
                  </div>
                </div>
                <div className="bg-[#26362E]/70 p-2.5 rounded border border-[#A9B4AB]/25">
                  <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Avg Slope</span>
                  <div className="font-mono text-base font-semibold text-[#F3F4EF] mt-0.5">
                    {analyticsData.avgSlope}°
                  </div>
                </div>
                <div className="bg-[#26362E]/70 p-2.5 rounded border border-[#A9B4AB]/25">
                  <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Avg Elevation</span>
                  <div className="font-mono text-base font-semibold text-[#F3F4EF] mt-0.5">
                    {analyticsData.avgElevation} <span className="text-[11px] text-[#A9B4AB] font-sans">m</span>
                  </div>
                </div>
                <div className="bg-[#26362E]/70 p-2.5 rounded border border-[#A9B4AB]/25">
                  <span className="text-[10px] font-mono text-[#A9B4AB] uppercase block">Near Roads (&le;150m)</span>
                  <div className="font-mono text-base font-semibold text-amber-400 mt-0.5">
                    {analyticsData.countRoadNear} <span className="text-[11px] text-[#A9B4AB] font-sans">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-[#26362E]/60 p-3 rounded border border-[#A9B4AB]/20 space-y-2">
              <span className="text-[11px] font-mono text-[#A9B4AB] uppercase block font-medium">
                Risk Distribution Breakdown
              </span>
              <div className="space-y-1.5">
                {(['Very High', 'High', 'Low'] as RiskLevel[]).map((level) => {
                  const count = analyticsData.riskCounts[level];
                  const pct = ((count / analyticsData.total) * 100).toFixed(1);
                  const color = RISK_COLORS[level];
                  const range = level === 'Very High' ? '>80%' : level === 'High' ? '>60–80%' : '0–60%';

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.fill }}
                          />
                          <span className="text-[#F3F4EF]">{level}</span>
                          <span className="text-[11px] text-[#A9B4AB] font-mono">({range})</span>
                        </span>
                        <span className="font-mono text-[#D5DFD4] tabular-nums">
                          {count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#101a15] rounded-full overflow-hidden">
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

            {/* District Breakdown */}
            <div className="bg-[#26362E]/60 p-3 rounded border border-[#A9B4AB]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#A9B4AB] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#D5DFD4]" />
                  <span>District Risk Zone Analysis</span>
                </div>
                <span className="text-[10px] font-mono text-[#A9B4AB]">
                  4 Districts
                </span>
              </div>

              {/* District Breakdown Rows */}
              <div className="space-y-2">
                {districtRiskData.districts.map((d) => {
                  const lowPct = d.total > 0 ? (d.low / d.total) * 100 : 0;
                  const highPct = d.total > 0 ? (d.high / d.total) * 100 : 0;
                  const veryHighPct = d.total > 0 ? (d.veryHigh / d.total) * 100 : 0;

                  return (
                    <div
                      key={d.name}
                      className="bg-[#17251F] border border-[#A9B4AB]/25 rounded p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#F3F4EF] text-[13px]">{d.name}</span>
                        <span className="font-mono text-xs font-semibold text-[#D5DFD4]">
                          {d.total} <span className="text-[11px] text-[#A9B4AB] font-normal">zones</span>
                        </span>
                      </div>

                      {/* Numbers */}
                      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                        <div className="bg-[#101a15] p-1 rounded border border-[#A9B4AB]/15">
                          <span className="text-[#A9B4AB] block text-[10px]">Low</span>
                          <span className="text-emerald-400 font-semibold">{d.low}</span>
                        </div>
                        <div className="bg-[#101a15] p-1 rounded border border-[#A9B4AB]/15">
                          <span className="text-[#A9B4AB] block text-[10px]">High</span>
                          <span className="text-orange-400 font-semibold">{d.high}</span>
                        </div>
                        <div className="bg-[#101a15] p-1 rounded border border-[#A9B4AB]/15">
                          <span className="text-[#A9B4AB] block text-[10px]">V.High</span>
                          <span className="text-rose-400 font-semibold">{d.veryHigh}</span>
                        </div>
                      </div>

                      {/* Segmented Risk Bar */}
                      <div className="h-1.5 w-full bg-[#101a15] rounded-full overflow-hidden flex">
                        <div style={{ width: `${lowPct}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${highPct}%` }} className="bg-orange-500 h-full" />
                        <div style={{ width: `${veryHighPct}%` }} className="bg-red-600 h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geomorphology */}
            <div className="bg-[#26362E]/60 p-3 rounded border border-[#A9B4AB]/20 space-y-1.5">
              <span className="text-[11px] font-mono text-[#A9B4AB] uppercase block font-medium">
                Dominant Geomorphology
              </span>
              <div className="space-y-1 text-xs">
                {analyticsData.topGeom.map(([geom, count]) => (
                  <div key={geom} className="py-0.5 border-b border-[#A9B4AB]/10 last:border-0 flex justify-between gap-2">
                    <span className="text-[#A9B4AB] truncate">{geom}</span>
                    <span className="font-mono text-[#F3F4EF] tabular-nums shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUSCEPTIBILITY RASTER SAMPLER */}
        {activeTab === 'susceptibility' && (
          <div className="space-y-3">
            <div className="bg-[#26362E]/70 border border-[#A9B4AB]/25 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#A9B4AB]">
                <span className="flex items-center gap-1.5 text-[#D5DFD4] font-semibold">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Raster Query</span>
                </span>
                <span>lsm_map_web.tif</span>
              </div>
              <p className="text-[13px] text-[#F3F4EF] leading-snug">
                Click anywhere on the map to query modeled susceptibility.
              </p>
              <p className="text-xs text-[#A9B4AB]">
                Queries 30-meter continuous raster (EPSG:32643 UTM 43N).
              </p>
            </div>

            {isSamplingRaster && (
              <div className="py-6 text-center space-y-1.5 bg-[#26362E]/50 border border-[#A9B4AB]/20 rounded p-3">
                <Loader2 className="w-5 h-5 text-[#D5DFD4] animate-spin mx-auto" />
                <p className="text-xs text-[#F3F4EF]">Sampling raster pixel...</p>
              </div>
            )}

            {!isSamplingRaster && susceptibilitySample && (
              <div className="space-y-2">
                {susceptibilitySample.status === 'outside' && (
                  <div className="bg-red-950/40 border border-red-800/50 rounded p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Out of Bounds</span>
                    </div>
                    <p className="text-xs text-[#A9B4AB]">
                      Coordinates fall outside coverage of lsm_map_web.tif.
                    </p>
                  </div>
                )}

                {susceptibilitySample.status === 'nodata' && (
                  <div className="bg-amber-950/40 border border-amber-800/50 rounded p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>NoData Location</span>
                    </div>
                    <p className="text-xs text-[#A9B4AB]">
                      No susceptibility data available at this location.
                    </p>
                  </div>
                )}

                {susceptibilitySample.status === 'valid' && (() => {
                  const color = RISK_COLORS[susceptibilitySample.riskClass];
                  return (
                    <div className="bg-[#26362E]/70 border border-[#A9B4AB]/25 rounded p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-[#A9B4AB]">
                            Sampled Value
                          </span>
                          <div className="text-xl font-bold font-mono text-[#F3F4EF]">
                            {formatNum(susceptibilitySample.susceptibility, 2)}%
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#17251F] border border-[#A9B4AB]/25 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.fill }}
                          />
                          <span className="text-[#F3F4EF]">{susceptibilitySample.riskClass}</span>
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-[#101a15] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, susceptibilitySample.susceptibility))}%`,
                            backgroundColor: color.fill,
                          }}
                        />
                      </div>

                      <div className="pt-2 border-t border-[#A9B4AB]/15 text-[11px] font-mono text-[#A9B4AB]">
                        {formatNum(susceptibilitySample.latitude, 4)}° N, {formatNum(susceptibilitySample.longitude, 4)}° E
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
