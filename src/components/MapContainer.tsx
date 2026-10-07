import React, { useEffect, useRef, useState } from 'react';
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
  RiskLevel,
} from '../types/gis';
import { BASEMAPS, getRiskLevel, RISK_COLORS, formatNum } from '../utils/gis';
import { createLandslidePopupHtml } from './PopupContent';

interface MapContainerProps {
  districtsData: GeoJsonFeatureCollection<DistrictProperties> | null;
  roadsData: GeoJsonFeatureCollection<RoadProperties> | null;
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
}

export const MapContainer: React.FC<MapContainerProps> = ({
  districtsData,
  roadsData,
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const districtsLayerRef = useRef<L.GeoJSON | null>(null);
  const roadsLayerRef = useRef<L.GeoJSON | null>(null);
  const landslidesLayerRef = useRef<L.GeoJSON | null>(null);
  const markersMapRef = useRef<Map<number, L.CircleMarker>>(new Map());

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 13.9,
    lng: 75.1,
    zoom: 9,
  });

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Karnataka Western Ghats (Shivamogga, Udupi, Chikkamagaluru)
    const map = L.map(mapContainerRef.current, {
      center: [13.88, 75.12],
      zoom: 9,
      zoomControl: true,
      minZoom: 5,
      maxZoom: 18,
    });

    mapInstanceRef.current = map;

    // Add scale bar
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

  // 3. Render Districts Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsData) return;

    if (districtsLayerRef.current) {
      map.removeLayer(districtsLayerRef.current);
      districtsLayerRef.current = null;
    }

    if (!layerVisibility.districts) return;

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

        // Hover styling & click to zoom
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
          click: (e) => {
            const bounds = e.target.getBounds();
            map.fitBounds(bounds, { padding: [30, 30] });
          },
        });
      },
    }).addTo(map);

    districtsLayerRef.current = layer;
  }, [districtsData, layerVisibility.districts, layerOpacity.districts]);

  // 4. Render Roads Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !roadsData) return;

    if (roadsLayerRef.current) {
      map.removeLayer(roadsLayerRef.current);
      roadsLayerRef.current = null;
    }

    if (!layerVisibility.roads) return;

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
          </div>`
        );

        layerItem.bindTooltip(
          `<div class="font-sans font-medium text-slate-100 flex items-center gap-1.5">
            <span class="w-3 h-1 bg-yellow-400 rounded-sm inline-block shadow-[0_0_4px_#facc15]"></span>
            <span>${name} ${ref}</span>
          </div>`,
          { sticky: true }
        );
      },
    }).addTo(map);

    roadsLayerRef.current = layer;
  }, [roadsData, layerVisibility.roads, layerOpacity.roads]);

  // 5. Render Landslide Points Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (landslidesLayerRef.current) {
      map.removeLayer(landslidesLayerRef.current);
      landslidesLayerRef.current = null;
      markersMapRef.current.clear();
    }

    if (!layerVisibility.landslides) return;

    const featureCollection = {
      type: 'FeatureCollection',
      features: filteredLandslides,
    };

    const layer = L.geoJSON(featureCollection as unknown as GeoJSON.GeoJsonObject, {
      pointToLayer: (geoJsonPoint, latlng) => {
        const props = geoJsonPoint.properties as LandslideProperties;
        const risk = getRiskLevel(props);
        const color = RISK_COLORS[risk];

        const marker = L.circleMarker(latlng, {
          radius: markerRadius,
          fillColor: color.fill,
          color: color.stroke,
          weight: 1.5,
          opacity: 1,
          fillOpacity: layerOpacity.landslides,
        });

        // Store reference by Point_ID or fid
        const id = props.Point_ID || props.fid;
        if (id) {
          markersMapRef.current.set(id, marker);
        }

        // Click handler: Bind popup & invoke onSelectPoint
        const popupContent = createLandslidePopupHtml(props);
        marker.bindPopup(popupContent, {
          maxWidth: 340,
          className: 'landslide-popup',
        });

        marker.on('click', () => {
          onSelectPoint(geoJsonPoint as unknown as GeoJsonFeature<LandslideProperties, GeoJSON.Point>);
        });

        // Hover tooltip with quick summary
        const village = props.Village || `Point #${props.Point_ID}`;
        marker.bindTooltip(
          `<div class="font-sans text-xs">
            <span class="font-semibold text-white">${village}</span>
            <span class="text-[10px] ml-1.5 font-mono ${color.text}">[${risk} Risk]</span>
          </div>`,
          { direction: 'top', offset: [0, -4] }
        );

        return marker;
      },
    }).addTo(map);

    landslidesLayerRef.current = layer;
  }, [filteredLandslides, layerVisibility.landslides, layerOpacity.landslides, markerRadius, onSelectPoint]);

  // 6. Handle Reset View / Initial fit bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (districtsLayerRef.current && districtsLayerRef.current.getLayers().length > 0) {
      map.fitBounds(districtsLayerRef.current.getBounds(), { padding: [40, 40] });
    } else if (landslidesLayerRef.current && landslidesLayerRef.current.getLayers().length > 0) {
      map.fitBounds(landslidesLayerRef.current.getBounds(), { padding: [40, 40] });
    } else {
      map.setView([13.88, 75.12], 9);
    }
  }, [resetViewTrigger, districtsData]);

  // 7. Handle Zoom Target (from directory or inspector)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zoomTarget) return;

    map.flyTo([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom || 14, {
      duration: 1.2,
    });

    if (selectedPoint) {
      const id = selectedPoint.properties.Point_ID || selectedPoint.properties.fid;
      const marker = markersMapRef.current.get(id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [zoomTarget, selectedPoint]);

  // 8. Handle Zoom to selected district
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsLayerRef.current) return;

    if (selectedDistrict === 'ALL') {
      if (districtsLayerRef.current.getLayers().length > 0) {
        map.fitBounds(districtsLayerRef.current.getBounds(), { padding: [40, 40] });
      }
      return;
    }

    districtsLayerRef.current.eachLayer((layer: any) => {
      const p = layer.feature?.properties as DistrictProperties;
      if (p?.Dist_Name === selectedDistrict) {
        map.fitBounds(layer.getBounds(), { padding: [35, 35] });
      }
    });
  }, [selectedDistrict]);

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
};
