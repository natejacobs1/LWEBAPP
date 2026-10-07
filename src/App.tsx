/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import {
  LandslideProperties,
  DistrictProperties,
  RoadProperties,
  GeoJsonFeatureCollection,
  GeoJsonFeature,
  LayerVisibility,
  LayerOpacity,
  RiskLevel,
  BasemapId,
} from './types/gis';
import {
  GEOJSON_URLS,
  getRiskLevel,
  ALLOWED_DISTRICTS,
  standardizeDistrictName,
} from './utils/gis';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { Legend } from './components/Legend';

export default function App() {
  // GeoJSON Data State
  const [districtsData, setDistrictsData] = useState<GeoJsonFeatureCollection<DistrictProperties> | null>(null);
  const [roadsData, setRoadsData] = useState<GeoJsonFeatureCollection<RoadProperties> | null>(null);
  const [landslidesData, setLandslidesData] = useState<GeoJsonFeatureCollection<LandslideProperties, GeoJSON.Point> | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing GIS console...');
  const [error, setError] = useState<string | null>(null);

  // Basemap & Viewport state
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapId>('osm');
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);
  const [zoomTarget, setZoomTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Layer Controls
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    districts: true,
    roads: true,
    landslides: true,
  });

  const [layerOpacity, setLayerOpacity] = useState<LayerOpacity>({
    districts: 0.15,
    roads: 1.0,
    landslides: 0.85,
  });

  const [markerRadius, setMarkerRadius] = useState<number>(6);

  // Filter States
  const [selectedRiskFilters, setSelectedRiskFilters] = useState<Record<RiskLevel, boolean>>({
    'Very High': true,
    'High': true,
    'Low': true,
  });

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [minSusceptibility, setMinSusceptibility] = useState<number>(50);
  const [maxDistanceToRoad, setMaxDistanceToRoad] = useState<number>(1000);

  // UI Navigation & Inspector State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'layers' | 'inspector' | 'analytics' | 'points'>('layers');
  const [selectedPoint, setSelectedPoint] = useState<GeoJsonFeature<LandslideProperties, GeoJSON.Point> | null>(null);

  // Fetch all 3 GeoJSON datasets at runtime
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setLoadingStep('Fetching district boundaries (districts.geojson)...');
      const districtsRes = await fetch(GEOJSON_URLS.districts);
      if (!districtsRes.ok) throw new Error(`Failed to load districts: ${districtsRes.statusText}`);
      const districtsJson: GeoJsonFeatureCollection<DistrictProperties> = await districtsRes.json();

      // Standardize district features and retain strictly the 4 target districts
      const cleanedDistrictFeatures: GeoJsonFeature<DistrictProperties>[] = [];
      for (const f of districtsJson.features) {
        const std = standardizeDistrictName(f.properties?.Dist_Name);
        if (std) {
          cleanedDistrictFeatures.push({
            ...f,
            properties: {
              ...f.properties,
              Dist_Name: std,
            },
          });
        }
      }

      setLoadingStep('Fetching road network corridors (road.geojson)...');
      const roadsRes = await fetch(GEOJSON_URLS.roads);
      if (!roadsRes.ok) throw new Error(`Failed to load roads: ${roadsRes.statusText}`);
      const roadsJson = await roadsRes.json();

      setLoadingStep('Fetching landslide hazard points (landslide_points.geojson)...');
      const landslidesRes = await fetch(GEOJSON_URLS.landslides);
      if (!landslidesRes.ok) throw new Error(`Failed to load landslide points: ${landslidesRes.statusText}`);
      const landslidesJson: GeoJsonFeatureCollection<LandslideProperties, GeoJSON.Point> = await landslidesRes.json();

      // Standardize landslide features:
      // 1. Remove all Haveri features completely
      // 2. Standardize "Shimoga" -> "Shivamogga"
      // 3. Keep strictly only points within the 4 allowed districts
      const cleanedLandslideFeatures: GeoJsonFeature<LandslideProperties, GeoJSON.Point>[] = [];
      for (const f of landslidesJson.features) {
        const stdDistrict = standardizeDistrictName(f.properties?.District);
        if (stdDistrict) {
          cleanedLandslideFeatures.push({
            ...f,
            properties: {
              ...f.properties,
              District: stdDistrict,
            },
          });
        }
      }

      setDistrictsData({
        ...districtsJson,
        features: cleanedDistrictFeatures,
      });
      setRoadsData(roadsJson);
      setLandslidesData({
        ...landslidesJson,
        features: cleanedLandslideFeatures,
      });
      setIsLoading(false);
    } catch (err) {
      console.error('GeoJSON loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load geospatial datasets from GitHub repository.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Project contains ONLY the 4 standardized districts
  const availableDistricts = useMemo(() => {
    return [...ALLOWED_DISTRICTS];
  }, []);

  // Compute risk counts across all points
  const riskCounts = useMemo<Record<RiskLevel, number>>(() => {
    const counts: Record<RiskLevel, number> = {
      'Very High': 0,
      'High': 0,
      'Low': 0,
    };
    if (!landslidesData?.features) return counts;

    landslidesData.features.forEach((f) => {
      const risk = getRiskLevel(f.properties);
      counts[risk] = (counts[risk] || 0) + 1;
    });

    return counts;
  }, [landslidesData]);

  // Filter landslide features based on UI controls
  const filteredLandslideFeatures = useMemo(() => {
    if (!landslidesData?.features) return [];

    return landslidesData.features.filter((f) => {
      const p = f.properties;
      const risk = getRiskLevel(p);

      // 1. Risk level filter
      if (!selectedRiskFilters[risk]) return false;

      // 2. District filter (strictly matches selected district from the 4 allowed)
      if (selectedDistrict !== 'ALL') {
        if (p.District !== selectedDistrict) return false;
      }

      // 3. Susceptibility percentage threshold
      if (p.Susceptibility_Percentage !== undefined) {
        if (Number(p.Susceptibility_Percentage) < minSusceptibility) return false;
      }

      // 4. Distance to road filter
      if (maxDistanceToRoad < 1000 && p.distance_to_road1 !== undefined) {
        if (Number(p.distance_to_road1) > maxDistanceToRoad) return false;
      }

      return true;
    });
  }, [landslidesData, selectedRiskFilters, selectedDistrict, minSusceptibility, maxDistanceToRoad]);

  // Point selection handler (when clicked on map or directory)
  const handleSelectPoint = useCallback((pt: GeoJsonFeature<LandslideProperties, GeoJSON.Point>) => {
    setSelectedPoint(pt);
    setActiveTab('inspector');
    if (!sidebarOpen) setSidebarOpen(true);
  }, [sidebarOpen]);

  // Zoom to point handler
  const handleZoomToPoint = useCallback((lat: number, lng: number) => {
    setZoomTarget({ lat, lng, zoom: 14 });
  }, []);

  // Reset view handler
  const handleResetView = useCallback(() => {
    setResetViewTrigger((prev) => prev + 1);
  }, []);

  const handleToggleRiskFilter = useCallback((risk: RiskLevel) => {
    setSelectedRiskFilters((prev) => ({
      ...prev,
      [risk]: !prev[risk],
    }));
  }, []);

  const handleToggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  const handleChangeOpacity = useCallback((layer: keyof LayerOpacity, val: number) => {
    setLayerOpacity((prev) => ({
      ...prev,
      [layer]: val,
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* GIS Header Console */}
      <Header
        pointsCount={landslidesData?.features.length || 0}
        roadsCount={roadsData?.features.length || 0}
        districtsCount={districtsData?.features.length || 0}
        selectedBasemap={selectedBasemap}
        onSelectBasemap={setSelectedBasemap}
        onResetView={handleResetView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isLoading={isLoading}
      />

      {/* Main GIS Workspace */}
      <div className="relative flex flex-1 h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl mb-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Loading GeoJSON Spatial Datasets
            </h2>
            <p className="text-xs font-mono text-cyan-400 mt-2 max-w-md">
              {loadingStep}
            </p>
            <div className="text-[11px] text-slate-500 mt-3 font-mono">
              EPSG:4326 WGS 84 · OpenStreetMap Engine
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg bg-red-950/95 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-red-100">Dataset Loading Error</p>
              <p className="mt-0.5 text-red-300">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Left Interactive Control & Analysis Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          layerVisibility={layerVisibility}
          onToggleLayer={handleToggleLayer}
          layerOpacity={layerOpacity}
          onChangeOpacity={handleChangeOpacity}
          selectedRiskFilters={selectedRiskFilters}
          onToggleRiskFilter={handleToggleRiskFilter}
          selectedDistrict={selectedDistrict}
          onChangeDistrict={setSelectedDistrict}
          availableDistricts={availableDistricts}
          minSusceptibility={minSusceptibility}
          onChangeMinSusceptibility={setMinSusceptibility}
          maxDistanceToRoad={maxDistanceToRoad}
          onChangeMaxDistanceToRoad={setMaxDistanceToRoad}
          markerRadius={markerRadius}
          onChangeMarkerRadius={setMarkerRadius}
          selectedPoint={selectedPoint}
          onSelectPoint={handleSelectPoint}
          onZoomToPoint={handleZoomToPoint}
          allLandslideFeatures={landslidesData?.features || []}
          filteredLandslideFeatures={filteredLandslideFeatures}
          districtsCount={districtsData?.features.length || 0}
          roadsCount={roadsData?.features.length || 0}
        />

        {/* Map Container Viewport */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          <MapContainer
            districtsData={districtsData}
            roadsData={roadsData}
            filteredLandslides={filteredLandslideFeatures}
            selectedBasemap={selectedBasemap}
            layerVisibility={layerVisibility}
            layerOpacity={layerOpacity}
            markerRadius={markerRadius}
            selectedPoint={selectedPoint}
            onSelectPoint={handleSelectPoint}
            resetViewTrigger={resetViewTrigger}
            zoomTarget={zoomTarget}
            selectedDistrict={selectedDistrict}
          />

          {/* Floating Collapsible GIS Legend */}
          {!isLoading && (
            <Legend
              counts={riskCounts}
              totalPoints={landslidesData?.features.length || 0}
              roadsCount={roadsData?.features.length || 0}
              districtsCount={districtsData?.features.length || 0}
              selectedRiskFilters={selectedRiskFilters}
              onToggleRiskFilter={handleToggleRiskFilter}
            />
          )}
        </div>
      </div>
    </div>
  );
}
