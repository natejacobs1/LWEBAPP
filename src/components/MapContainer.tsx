import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  LandslideProperties,
  DistrictProperties,
  RoadProperties,
  GeoJsonFeatureCollection,
  GeoJsonFeature,
  BasemapId,
  LayerVisibility,
  LayerOpacity,
  GisTab,
} from '../types/gis';
import { BASEMAPS, getRiskLevel, RISK_COLORS, formatNum } from '../utils/gis';
import { createLandslidePopupHtml } from './PopupContent';
import { SusceptibilitySampleResult } from '../utils/rasterSampler';

interface MapContainerProps {
  districtsData: GeoJsonFeatureCollection<DistrictProperties> | null;
  roadsData: GeoJsonFeatureCollection<RoadProperties> | null;
  allLandslides?: GeoJsonFeature<LandslideProperties, GeoJSON.Point>[];
  filteredLandslides: GeoJsonFeature<LandslideProperties, GeoJSON.Point>[];
  selectedBasemap: BasemapId;
  layerVisibility: LayerVisibility;
  layerOpacity: LayerOpacity;
  markerRadius: number;
  selectedPoint: GeoJsonFeature<LandslideProperties, GeoJSON.Point> | null;
  onSelectPoint: (pt: GeoJsonFeature<LandslideProperties, GeoJSON.Point>) => void;
  resetViewTrigger: number;
  zoomTarget: { lat: number; lng: number; zoom?: number } | null;
  selectedDistrict?: string;
  onMapRasterQuery?: (lat: number, lng: number) => void;
  susceptibilitySample?: SusceptibilitySampleResult | null;
  activeTab?: GisTab;
}

export const MapContainer: React.FC<MapContainerProps> = React.memo(({
  districtsData,
  roadsData,
  allLandslides = [],
  filteredLandslides,
  selectedBasemap,
  layerVisibility,
  layerOpacity,
  markerRadius,
  selectedPoint,
  onSelectPoint,
  resetViewTrigger,
  zoomTarget,
  selectedDistrict = 'ALL',
  onMapRasterQuery,
  susceptibilitySample,
  activeTab,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const districtsLayerRef = useRef<L.GeoJSON | null>(null);
  const roadsLayerRef = useRef<L.GeoJSON | null>(null);
  const landslidesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<number | string, L.CircleMarker>>(new Map());
  const rasterQueryMarkerRef = useRef<L.Marker | null>(null);

  const hasInitialFitRef = useRef<boolean>(false);
  const prevDistrictRef = useRef<string>(selectedDistrict);

  // Keep callback refs stable to prevent layer effect triggers
  const onSelectPointRef = useRef(onSelectPoint);
  useEffect(() => {
    onSelectPointRef.current = onSelectPoint;
  }, [onSelectPoint]);

  const onMapRasterQueryRef = useRef(onMapRasterQuery);
  useEffect(() => {
    onMapRasterQueryRef.current = onMapRasterQuery;
  }, [onMapRasterQuery]);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 13.9,
    lng: 75.1,
    zoom: 9,
  });

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Karnataka Western Ghats
    const map = L.map(mapContainerRef.current, {
      center: [13.88, 75.12],
      zoom: 9,
      zoomControl: true,
      minZoom: 5,
      maxZoom: 18,
      closePopupOnClick: false, // Prevents premature popup closing on map clicks
    });

    mapInstanceRef.current = map;

    // LayerGroup for landslide points
    const pointsGroup = L.layerGroup().addTo(map);
    landslidesLayerGroupRef.current = pointsGroup;

    // Add metric scale bar
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: 'bottomleft',
      })
      .addTo(map);

    // Track mouse coordinate HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        zoom: map.getZoom(),
      });
    });

    map.on('zoomend', () => {
      setMouseCoords((prev) => ({
        ...prev,
        zoom: map.getZoom(),
      }));
    });

    // Map click for raster susceptibility sampling
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapRasterQueryRef.current) {
        onMapRasterQueryRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Set map cursor to crosshair when susceptibility sampling tool is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const container = map.getContainer();
    if (activeTab === 'susceptibility') {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [activeTab]);

  // 2. Manage Basemap TileLayer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const currentBasemap = BASEMAPS.find((b) => b.id === selectedBasemap) || BASEMAPS[0];

    const newTileLayer = L.tileLayer(currentBasemap.url, {
      attribution: currentBasemap.attribution,
      maxZoom: currentBasemap.maxZoom,
      crossOrigin: true,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [selectedBasemap]);

  // 3. Render Districts Layer (Created once per dataset)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsData) return;

    if (districtsLayerRef.current) {
      map.removeLayer(districtsLayerRef.current);
      districtsLayerRef.current = null;
    }

    const layer = L.geoJSON(districtsData as unknown as GeoJSON.GeoJsonObject, {
      style: () => ({
        color: '#0284c7',
        weight: 1.8,
        dashArray: '5, 5',
        fillColor: '#38bdf8',
        fillOpacity: layerOpacity.districts,
      }),
      onEachFeature: (feature, layerItem) => {
        const p = feature.properties as DistrictProperties;
        const distName = p?.Dist_Name || 'District';
        const stateName = p?.State_Name || 'Karnataka';

        // Hover tooltip
        layerItem.bindTooltip(
          `<div class="font-sans">
            <strong class="text-cyan-400 font-semibold">${distName} District</strong>
            <div class="text-[10px] text-slate-300 font-mono">${stateName}</div>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip' }
        );

        // Hover styling & click query
        layerItem.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.8,
              color: '#38bdf8',
              fillOpacity: Math.min(0.5, layerOpacity.districts + 0.15),
            });
          },
          mouseout: (e) => {
            const l = e.target;
            layer.resetStyle(l);
          },
          click: (e: L.LeafletMouseEvent) => {
            if (onMapRasterQueryRef.current) {
              onMapRasterQueryRef.current(e.latlng.lat, e.latlng.lng);
            }
          },
        });
      },
    });

    if (layerVisibility.districts) {
      layer.addTo(map);
    }
    districtsLayerRef.current = layer;

    // Initial fit bounds only once on first data load
    if (!hasInitialFitRef.current && layer.getLayers().length > 0) {
      map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      hasInitialFitRef.current = true;
    }
  }, [districtsData]);

  // District opacity update without layer destruction
  useEffect(() => {
    if (districtsLayerRef.current) {
      districtsLayerRef.current.setStyle({ fillOpacity: layerOpacity.districts });
    }
  }, [layerOpacity.districts]);

  // District visibility toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = districtsLayerRef.current;
    if (!map || !layer) return;

    if (layerVisibility.districts) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [layerVisibility.districts]);

  // 4. Render Roads Layer (Created once per dataset)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !roadsData) return;

    if (roadsLayerRef.current) {
      map.removeLayer(roadsLayerRef.current);
      roadsLayerRef.current = null;
    }

    const layer = L.geoJSON(roadsData as unknown as GeoJSON.GeoJsonObject, {
      style: () => ({
        color: '#facc15',
        weight: 4.5,
        opacity: layerOpacity.roads,
        lineCap: 'round',
        lineJoin: 'round',
      }),
      onEachFeature: (feature, layerItem) => {
        const p = feature.properties as RoadProperties;
        const name = p?.name || p?.ref || 'Regional Highway';
        const ref = p?.ref ? `(${p.ref})` : '';
        const highway = p?.highway || 'road';

        layerItem.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              color: '#fef08a',
              weight: 6.5,
            });
          },
          mouseout: (e) => {
            const l = e.target;
            layer.resetStyle(l);
          },
        });

        layerItem.bindPopup(
          `<div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 10px; min-width: 220px; background: #0f172a; color: #f8fafc; border-radius: 6px;">
            <div style="font-size: 10px; text-transform: uppercase; color: #facc15; font-weight: 700; letter-spacing: 0.05em;">Transportation Corridor</div>
            <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${name} ${ref}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; border-top: 1px solid #334155; padding-top: 6px;">
              <span><strong>Type:</strong> ${highway}</span>
              ${p.lanes ? `<span><strong>Lanes:</strong> ${p.lanes}</span>` : ''}
              ${p.surface ? `<span><strong>Surface:</strong> ${p.surface}</span>` : ''}
              ${p.oneway ? `<span><strong>One-way:</strong> ${p.oneway}</span>` : ''}
            </div>
          </div>`,
          { autoClose: true }
        );

        layerItem.bindTooltip(
          `<div class="font-sans font-medium text-slate-100 flex items-center gap-1.5">
            <span class="w-3 h-1 bg-yellow-400 rounded-sm inline-block shadow-[0_0_4px_#facc15]"></span>
            <span>${name} ${ref}</span>
          </div>`,
          { sticky: true }
        );
      },
    });

    if (layerVisibility.roads) {
      layer.addTo(map);
    }
    roadsLayerRef.current = layer;
  }, [roadsData]);

  // Road opacity update without layer destruction
  useEffect(() => {
    if (roadsLayerRef.current) {
      roadsLayerRef.current.setStyle({ opacity: layerOpacity.roads });
    }
  }, [layerOpacity.roads]);

  // Road visibility toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = roadsLayerRef.current;
    if (!map || !layer) return;

    if (layerVisibility.roads) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [layerVisibility.roads]);

  // 5. Landslide Markers: Initialize once from dataset, cache in markersMap
  const sourceFeatures = useMemo(() => {
    return allLandslides.length > 0 ? allLandslides : filteredLandslides;
  }, [allLandslides, filteredLandslides]);

  useEffect(() => {
    const layerGroup = landslidesLayerGroupRef.current;
    if (!layerGroup || sourceFeatures.length === 0) return;

    // Only build markers if not yet initialized
    if (markersMapRef.current.size === 0) {
      sourceFeatures.forEach((geoJsonPoint) => {
        const props = geoJsonPoint.properties;
        const coords = geoJsonPoint.geometry.coordinates;
        const lat = coords[1];
        const lng = coords[0];
        const risk = getRiskLevel(props);
        const color = RISK_COLORS[risk];
        const id = props.Point_ID || props.fid;

        const marker = L.circleMarker([lat, lng], {
          radius: markerRadius,
          fillColor: color.fill,
          color: color.stroke,
          weight: 1.5,
          opacity: 1,
          fillOpacity: layerOpacity.landslides,
        });

        // Click handler: opens popup smoothly and selects point
        const popupContent = createLandslidePopupHtml(props);
        marker.bindPopup(popupContent, {
          maxWidth: 320,
          minWidth: 260,
          className: 'landslide-popup',
          autoPan: true,
          autoPanPadding: L.point(30, 30),
          autoClose: true,     // Guarantees only one popup open at a time
          closeOnClick: false, // Prevents popup closing on map click or panning
        });

        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectPointRef.current(geoJsonPoint);
          marker.openPopup();
        });

        // Hover tooltip
        const village = props.Village || `Point #${props.Point_ID}`;
        marker.bindTooltip(
          `<div class="font-sans text-xs">
            <span class="font-semibold text-white">${village}</span>
            <span class="text-[10px] ml-1.5 font-mono ${color.text}">[${risk} Risk]</span>
          </div>`,
          { direction: 'top', offset: [0, -4] }
        );

        markersMapRef.current.set(id, marker);
        layerGroup.addLayer(marker);
      });
    }
  }, [sourceFeatures, markerRadius, layerOpacity.landslides]);

  // 6. Smooth Marker Filtering: Toggle marker presence in layerGroup without recreating
  useEffect(() => {
    const layerGroup = landslidesLayerGroupRef.current;
    if (!layerGroup || markersMapRef.current.size === 0) return;

    const visibleIds = new Set<number | string>(
      filteredLandslides.map((f) => f.properties.Point_ID || f.properties.fid)
    );

    markersMapRef.current.forEach((marker, id) => {
      const isVisible = visibleIds.has(id);
      const hasLayer = layerGroup.hasLayer(marker);

      if (isVisible && !hasLayer) {
        layerGroup.addLayer(marker);
      } else if (!isVisible && hasLayer) {
        layerGroup.removeLayer(marker);
      }
    });
  }, [filteredLandslides]);

  // Landslide markers radius & opacity update in-place
  useEffect(() => {
    markersMapRef.current.forEach((marker) => {
      marker.setRadius(markerRadius);
      marker.setStyle({ fillOpacity: layerOpacity.landslides });
    });
  }, [markerRadius, layerOpacity.landslides]);

  // Landslide layer visibility toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = landslidesLayerGroupRef.current;
    if (!map || !layerGroup) return;

    if (layerVisibility.landslides) {
      if (!map.hasLayer(layerGroup)) map.addLayer(layerGroup);
    } else {
      if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
    }
  }, [layerVisibility.landslides]);

  // 7. Handle Reset View (Triggered only when resetViewTrigger increments)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || resetViewTrigger === 0) return;

    if (districtsLayerRef.current && districtsLayerRef.current.getLayers().length > 0) {
      map.fitBounds(districtsLayerRef.current.getBounds(), { padding: [40, 40] });
    } else {
      map.setView([13.88, 75.12], 9);
    }
  }, [resetViewTrigger]);

  // 8. Handle Zoom Target (From Feature Inspector / Susceptibility)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zoomTarget) return;

    map.flyTo([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom || 14, {
      duration: 1.0,
    });

    if (selectedPoint) {
      const id = selectedPoint.properties.Point_ID || selectedPoint.properties.fid;
      const marker = markersMapRef.current.get(id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 350);
      }
    }
  }, [zoomTarget]);

  // 9. Handle Zoom to selected district (Only on explicit district change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsLayerRef.current) return;

    if (prevDistrictRef.current === selectedDistrict) return;
    prevDistrictRef.current = selectedDistrict;

    if (selectedDistrict === 'ALL') {
      if (districtsLayerRef.current.getLayers().length > 0) {
        map.fitBounds(districtsLayerRef.current.getBounds(), { padding: [40, 40] });
      }
      return;
    }

    districtsLayerRef.current.eachLayer((layerItem: any) => {
      const p = layerItem.feature?.properties as DistrictProperties;
      if (p?.Dist_Name === selectedDistrict) {
        map.fitBounds(layerItem.getBounds(), { padding: [35, 35] });
      }
    });
  }, [selectedDistrict]);

  // 10. Display raster query marker & popup when susceptibilitySample updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !susceptibilitySample) return;

    const { latitude, longitude } = susceptibilitySample;

    // Remove prior query marker
    if (rasterQueryMarkerRef.current) {
      map.removeLayer(rasterQueryMarkerRef.current);
      rasterQueryMarkerRef.current = null;
    }

    if (susceptibilitySample.status === 'valid') {
      const color = RISK_COLORS[susceptibilitySample.riskClass];
      const customIcon = L.divIcon({
        className: 'custom-raster-query-icon',
        html: `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; position: relative;">
          <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${color.fill}33; border: 2px solid ${color.fill}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color.fill}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${color.fill};"></span>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      rasterQueryMarkerRef.current = marker;

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 10px; min-width: 230px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em;">LSM Raster Sample</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
            <span style="font-size: 16px; font-weight: 700; color: ${color.fill}; font-family: 'JetBrains Mono', monospace;">
              ${susceptibilitySample.susceptibility.toFixed(2)}%
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${color.stroke}33; border: 1px solid ${color.stroke}; color: ${color.fill};">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color.fill};"></span>
              ${susceptibilitySample.riskClass} Risk
            </span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; padding-top: 6px; border-top: 1px solid #334155; font-family: 'JetBrains Mono', monospace; line-height: 1.5;">
            <div>Lat: ${susceptibilitySample.latitude.toFixed(5)}° N</div>
            <div>Lng: ${susceptibilitySample.longitude.toFixed(5)}° E</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280, className: 'raster-query-popup', autoClose: true }).openPopup();
    } else if (susceptibilitySample.status === 'outside') {
      L.popup({ maxWidth: 260, className: 'raster-query-popup', autoClose: true })
        .setLatLng([latitude, longitude])
        .setContent(`
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 10px; background: #0f172a; color: #f8fafc; border-radius: 8px; border-left: 3px solid #ef4444;">
            <div style="font-size: 12px; font-weight: 600; color: #fca5a5;">Please click inside the susceptibility map area.</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
              Location is outside lsm_map_web.tif coverage.
            </div>
          </div>
        `)
        .openOn(map);
    } else if (susceptibilitySample.status === 'nodata') {
      L.popup({ maxWidth: 260, className: 'raster-query-popup', autoClose: true })
        .setLatLng([latitude, longitude])
        .setContent(`
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 10px; background: #0f172a; color: #f8fafc; border-radius: 8px; border-left: 3px solid #f59e0b;">
            <div style="font-size: 12px; font-weight: 600; color: #fde68a;">No susceptibility data available at this location.</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
              ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E
            </div>
          </div>
        `)
        .openOn(map);
    }
  }, [susceptibilitySample]);

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden bg-slate-950">
      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Coordinate & Zoom Telemetry HUD */}
      <div className="absolute bottom-5 left-16 z-[1000] hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-md shadow-lg text-[11px] font-mono text-slate-300 pointer-events-none select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">LAT</span>
          <span className="text-slate-200 tabular-nums">{formatNum(mouseCoords.lat, 4)}° N</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">LNG</span>
          <span className="text-slate-200 tabular-nums">{formatNum(mouseCoords.lng, 4)}° E</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">ZOOM</span>
          <span className="text-cyan-400 tabular-nums">{mouseCoords.zoom}</span>
        </div>
      </div>
    </div>
  );
});
