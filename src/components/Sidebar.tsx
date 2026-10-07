import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  BarChart3,
  Search,
  Filter,
  Eye,
  EyeOff,
  Navigation,
  Sliders,
  AlertTriangle,
  Compass,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  CloudRain,
  Mountain,
  Gauge
} from 'lucide-react';
import {
  LandslideProperties,
  LayerVisibility,
  LayerOpacity,
  RiskLevel,
  GeoJsonFeature,
} from '../types/gis';
import { getRiskLevel, RISK_COLORS, formatNum } from '../utils/gis';

interface SidebarProps {
  activeTab: 'layers' | 'inspector' | 'analytics' | 'points';
  setActiveTab: (tab: 'layers' | 'inspector' | 'analytics' | 'points') => void;
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
}) => {
  const [copiedCoord, setCopiedCoord] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Search filtered points
  const searchedPoints = useMemo(() => {
    if (!searchQuery.trim()) return filteredLandslideFeatures;
    const q = searchQuery.toLowerCase().trim();
    return filteredLandslideFeatures.filter((f) => {
      const p = f.properties;
      return (
        String(p.Point_ID || '').toLowerCase().includes(q) ||
        String(p.Village || '').toLowerCase().includes(q) ||
        String(p.Taluk || '').toLowerCase().includes(q) ||
        String(p.District || '').toLowerCase().includes(q) ||
        String(p.Pincode || '').toLowerCase().includes(q)
      );
    });
  }, [filteredLandslideFeatures, searchQuery]);

  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedPoints.slice(start, start + pageSize);
  }, [searchedPoints, currentPage]);

  const totalPages = Math.ceil(searchedPoints.length / pageSize) || 1;

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

  const copyCoordinates = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] z-10 shrink-0 select-none shadow-xl">
      {/* Sidebar Header Tabs */}
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
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'points'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directory</span>
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color.fill }}
                        />
                        <span className="font-semibold text-[11px] text-slate-200">{level}</span>
                      </div>
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
                              <Navigation className="w-3 h-3" />
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
                            {formatNum(p.Susceptibility_Percentage, 1)}%
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
                    Click any point marker on the map or select a feature from the Directory to inspect its
                    complete attributes.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('points')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md font-medium text-xs transition-colors inline-block"
                >
                  Browse Points Directory
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

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.fill }}
                          />
                          <span>{level}</span>
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

            {/* Top Districts */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Points by District
              </span>
              <div className="space-y-1.5">
                {analyticsData.topDistricts.map(([district, count]) => {
                  const pct = ((count / analyticsData.total) * 100).toFixed(0);
                  return (
                    <div key={district} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-900 last:border-0">
                      <span className="text-slate-300">{district}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {count} ({pct}%)
                      </span>
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

        {/* TAB 4: DIRECTORY / SEARCH */}
        {activeTab === 'points' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search village, taluk, point ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between items-center px-1">
              <span>Showing {searchedPoints.length} points</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>

            {/* Point items */}
            <div className="space-y-1.5">
              {paginatedPoints.map((pt) => {
                const p = pt.properties;
                const risk = getRiskLevel(p);
                const color = RISK_COLORS[risk];
                const coords = pt.geometry.coordinates as [number, number];
                const isSelected = selectedPoint?.properties.Point_ID === p.Point_ID;

                return (
                  <div
                    key={p.Point_ID || p.fid}
                    onClick={() => {
                      onSelectPoint(pt);
                      onZoomToPoint(coords[1], coords[0]);
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: color.fill }}
                        />
                        <span className="font-semibold text-slate-200">
                          {p.Village || `Point #${p.Point_ID}`}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">#{p.Point_ID}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.Taluk || '—'}, {p.District || '—'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className="font-mono font-bold text-[11px]"
                        style={{ color: color.fill }}
                      >
                        {formatNum(p.Susceptibility_Percentage, 0)}%
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase">{risk}</div>
                    </div>
                  </div>
                );
              })}

              {paginatedPoints.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No landslide points match the current filter or search criteria.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-800 disabled:opacity-30 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Previous
                </button>
                <span className="text-slate-400 font-mono text-[11px]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-slate-800 disabled:opacity-30 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
