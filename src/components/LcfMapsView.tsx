import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Droplets,
  Mountain,
  CloudRain,
  Activity,
  Trees,
  AlertTriangle,
  Layers,
  Milestone,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface LcfFactorItem {
  id: string;
  name: string;
  filename: string;
  src: string;
  category: 'Topographic' | 'Hydrological' | 'Environmental' | 'Anthropogenic';
  description: string;
  unitOrScale: string;
  significance: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LCF_FACTORS: LcfFactorItem[] = [
  {
    id: 'aspect',
    name: 'Aspect',
    filename: 'aspect.png',
    src: '/aspect.png',
    category: 'Topographic',
    description: 'Compass direction and azimuth exposure that terrain slopes face.',
    unitOrScale: 'Azimuth (0° – 360°)',
    significance: 'Governs solar exposure, evapotranspiration rates, and monsoon moisture retention.',
    icon: Compass,
  },
  {
    id: 'twi',
    name: 'TWI',
    filename: 'TWI.png',
    src: '/TWI.png',
    category: 'Hydrological',
    description: 'Topographic Wetness Index quantifying topographic control on saturation.',
    unitOrScale: 'ln(a / tan β)',
    significance: 'Identifies concave depressions and slope toes prone to saturated soil and high pore water pressure.',
    icon: Droplets,
  },
  {
    id: 'slope',
    name: 'Slope',
    filename: 'slope.png',
    src: '/slope.png',
    category: 'Topographic',
    description: 'Terrain steepness gradient measuring the maximum rate of elevation change.',
    unitOrScale: 'Degrees (0° – 90°)',
    significance: 'Primary direct driver of gravitational shear stress acting along failure planes.',
    icon: Mountain,
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    filename: 'rainfall.png',
    src: '/rainfall.png',
    category: 'Hydrological',
    description: 'Spatial distribution of cumulative monsoon precipitation.',
    unitOrScale: 'Millimeters (mm / yr)',
    significance: 'Primary trigger for debris flows and slope failures through soil saturation.',
    icon: CloudRain,
  },
  {
    id: 'profile_curvature',
    name: 'Profile Curvature',
    filename: 'profile curve.png',
    src: encodeURI('/profile curve.png'),
    category: 'Topographic',
    description: 'Vertical surface curvature along the line of maximum slope inclination.',
    unitOrScale: 'Curvature Units (1/m)',
    significance: 'Controls the acceleration or deceleration of surface runoff and mass movement.',
    icon: Activity,
  },
  {
    id: 'ndvi',
    name: 'NDVI',
    filename: 'NDVI.png',
    src: '/NDVI.png',
    category: 'Environmental',
    description: 'Normalized Difference Vegetation Index representing canopy density.',
    unitOrScale: 'Index (-1.0 to +1.0)',
    significance: 'Denser vegetation provides mechanical root cohesion and reinforces soil mantle.',
    icon: Trees,
  },
  {
    id: 'ldensity',
    name: 'Landslide Density',
    filename: 'ldensity.png',
    src: '/ldensity.png',
    category: 'Environmental',
    description: 'Spatial concentration of historical slope failure occurrences.',
    unitOrScale: 'Density (events / km²)',
    significance: 'Historical landslide clusters directly correlate with recurring high-hazard zones.',
    icon: AlertTriangle,
  },
  {
    id: 'geomorphology',
    name: 'Geomorphology',
    filename: 'geomorphology.png',
    src: '/geomorphology.png',
    category: 'Topographic',
    description: 'Classification of structural landforms and denudational units.',
    unitOrScale: 'Geomorphic Units',
    significance: 'Structural weaknesses, fault scarps, and valley fills delineate localized vulnerability.',
    icon: Layers,
  },
  {
    id: 'dtr',
    name: 'Distance to Road',
    filename: 'dtr.png',
    src: '/dtr.png',
    category: 'Anthropogenic',
    description: 'Euclidean distance buffer zones radiating from highway corridors.',
    unitOrScale: 'Meters (m)',
    significance: 'Slope toes cut for road infrastructure destabilize natural talus angles.',
    icon: Milestone,
  },
  {
    id: 'dem',
    name: 'DEM',
    filename: 'dem.png',
    src: '/dem.png',
    category: 'Topographic',
    description: 'Digital Elevation Model rendering continuous topographical elevation.',
    unitOrScale: 'Elevation (m AMSL)',
    significance: 'Baseline elevation model from which morphological parameters derive.',
    icon: MapPin,
  },
];

export const LcfMapsView: React.FC = () => {
  const [selectedFactorId, setSelectedFactorId] = useState<string>('aspect');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFactor = LCF_FACTORS.find((f) => f.id === selectedFactorId) || LCF_FACTORS[0];

  useEffect(() => {
    setIsLoadingImage(true);
    setImageError(false);
    setZoomLevel(1);
  }, [selectedFactorId]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(!isFullscreen);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row flex-1 h-full w-full overflow-hidden bg-[#0f1814] text-[#F3F4EF] font-sans"
    >
      {/* 1. Left Factor Selector Panel */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0 bg-[#17251F] border-b lg:border-b-0 lg:border-r border-[#A9B4AB]/25 flex flex-col h-64 lg:h-full overflow-hidden select-none">
        {/* Panel Header */}
        <div className="h-9 px-3.5 border-b border-[#A9B4AB]/20 bg-[#101a15]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#D5DFD4]">
            <Layers className="w-3.5 h-3.5 text-[#A9B4AB]" />
            <span>Conditioning Factors</span>
          </div>
          <span className="font-mono text-[11px] text-[#A9B4AB]">
            10 rasters
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {LCF_FACTORS.map((factor, index) => {
            const Icon = factor.icon;
            const isSelected = factor.id === selectedFactorId;

            return (
              <button
                key={factor.id}
                onClick={() => setSelectedFactorId(factor.id)}
                className={`w-full text-left px-2.5 py-2 rounded border transition-colors flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#26362E] border-[#A9B4AB]/35 text-[#F3F4EF]'
                    : 'bg-transparent border-transparent text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#34473d] text-[#D5DFD4]' : 'text-[#A9B4AB]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-medium truncate text-[#F3F4EF]">
                      {index + 1}. {factor.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#A9B4AB] truncate">
                      {factor.filename}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Footer */}
        <div className="h-8 px-3 border-t border-[#A9B4AB]/20 bg-[#101a15]/60 font-mono text-[11px] text-[#A9B4AB] flex items-center justify-between shrink-0">
          <span>Format: 8-bit PNG</span>
          <span>Coverage: Western Ghats</span>
        </div>
      </aside>

      {/* 2. Right Raster Viewer Panel */}
      <main className="flex-1 h-full flex flex-col overflow-hidden bg-[#0f1814] relative min-w-0">
        {/* Top Control Bar */}
        <div className="h-10 px-3.5 border-b border-[#A9B4AB]/25 bg-[#17251F] flex items-center justify-between shrink-0 z-10 gap-3">
          {/* Factor Metadata */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#F3F4EF] truncate">
              {currentFactor.name}
            </span>
            <span className="text-[#A9B4AB]/40">·</span>
            <span className="font-mono text-xs text-[#A9B4AB] truncate">
              {currentFactor.filename}
            </span>
            <span className="text-[#A9B4AB]/40 hidden sm:inline">·</span>
            <span className="text-xs text-[#D5DFD4] hidden sm:inline truncate">
              {currentFactor.category}
            </span>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-[#101a15] p-0.5 rounded border border-[#A9B4AB]/25">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 text-[#A9B4AB] hover:text-[#F3F4EF] disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-[#D5DFD4] px-1 tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 text-[#A9B4AB] hover:text-[#F3F4EF] disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-[#A9B4AB] hover:text-[#F3F4EF] transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* External link */}
            <a
              href={currentFactor.src}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-[#F3F4EF] bg-[#26362E] hover:bg-[#34473d] rounded border border-[#A9B4AB]/30 transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Download */}
            <a
              href={currentFactor.src}
              download={currentFactor.filename}
              className="p-1.5 text-[#F3F4EF] bg-[#26362E] hover:bg-[#34473d] rounded border border-[#A9B4AB]/30 transition-colors"
              title={`Download ${currentFactor.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-[#F3F4EF] bg-[#26362E] hover:bg-[#34473d] rounded border border-[#A9B4AB]/30 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Centered Image Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-3 sm:p-5 overflow-auto min-h-0 bg-[#0f1814]">
          {isLoadingImage && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f1814]/75">
              <Loader2 className="w-5 h-5 text-[#D5DFD4] animate-spin mb-2" />
              <p className="text-xs text-[#A9B4AB] font-mono">
                Loading {currentFactor.filename}...
              </p>
            </div>
          )}

          {imageError ? (
            <div className="relative z-20 max-w-sm bg-[#17251F] border border-[#A9B4AB]/30 rounded p-4 text-center">
              <AlertCircle className="w-5 h-5 text-rose-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-rose-200">
                Failed to Load Map Image
              </div>
              <p className="text-[11px] text-[#A9B4AB] mt-1 font-mono">
                {currentFactor.filename}
              </p>
              <button
                onClick={() => {
                  setImageError(false);
                  setIsLoadingImage(true);
                }}
                className="mt-3 px-2.5 py-1 bg-[#26362E] hover:bg-[#34473d] text-[#F3F4EF] border border-[#A9B4AB]/30 rounded text-xs font-mono transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                key={currentFactor.id}
                src={currentFactor.src}
                alt={`${currentFactor.name} (${currentFactor.filename})`}
                className={`max-h-[calc(100vh-8.5rem)] max-w-full object-contain rounded border border-[#A9B4AB]/20 transition-opacity duration-150 ${
                  isLoadingImage ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => {
                  setIsLoadingImage(false);
                  setImageError(false);
                }}
                onError={() => {
                  setIsLoadingImage(false);
                  setImageError(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Technical Context Footer */}
        <div className="h-7 px-3.5 border-t border-[#A9B4AB]/25 bg-[#17251F] flex items-center justify-between text-[11px] text-[#A9B4AB] font-mono shrink-0">
          <div className="truncate">
            <span className="text-[#D5DFD4]">Impact: </span>
            <span>{currentFactor.significance}</span>
          </div>
          <span className="shrink-0 hidden md:inline text-[#A9B4AB]">
            Unit: {currentFactor.unitOrScale}
          </span>
        </div>
      </main>
    </div>
  );
};
