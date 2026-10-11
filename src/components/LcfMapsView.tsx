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
  Info,
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
    description: 'Compass direction and azimuth exposure that terrain slopes face across the Western Ghats basin.',
    unitOrScale: 'Azimuth (0° – 360°)',
    significance: 'Governs solar insolation, evapotranspiration rates, micro-climates, and monsoon windward moisture retention.',
    icon: Compass,
  },
  {
    id: 'twi',
    name: 'TWI',
    filename: 'TWI.png',
    src: '/TWI.png',
    category: 'Hydrological',
    description: 'Topographic Wetness Index quantifying topographical control on hydrological accumulation and pore saturation.',
    unitOrScale: 'ln(a / tan β)',
    significance: 'Identifies concave depressions and slope toes prone to saturated soil conditions and elevated pore water pressure.',
    icon: Droplets,
  },
  {
    id: 'slope',
    name: 'Slope',
    filename: 'slope.png',
    src: '/slope.png',
    category: 'Topographic',
    description: 'Terrain inclination gradient measuring the maximum rate of elevation change.',
    unitOrScale: 'Degrees (0° – 90°)',
    significance: 'Primary direct driver of shear stress acting along failure planes; steeper gradients dramatically accelerate landslide initiation.',
    icon: Mountain,
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    filename: 'rainfall.png',
    src: '/rainfall.png',
    category: 'Hydrological',
    description: 'Spatial distribution of cumulative southwest monsoon precipitation across Karnataka ghat escarpments.',
    unitOrScale: 'Millimeters (mm / yr)',
    significance: 'Primary trigger for debris flows and slope failures through saturation and loss of soil shear strength.',
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
    significance: 'Controls the acceleration or deceleration of surface runoff and gravitational mass movement along slopes.',
    icon: Activity,
  },
  {
    id: 'ndvi',
    name: 'NDVI',
    filename: 'NDVI.png',
    src: '/NDVI.png',
    category: 'Environmental',
    description: 'Normalized Difference Vegetation Index representing vegetation health, canopy density, and surface cover.',
    unitOrScale: 'Index (-1.0 to +1.0)',
    significance: 'Denser vegetation provides mechanical root cohesion and reinforces soil mantle against shallow translational slides.',
    icon: Trees,
  },
  {
    id: 'ldensity',
    name: 'Landslide Density',
    filename: 'ldensity.png',
    src: '/ldensity.png',
    category: 'Environmental',
    description: 'Spatial concentration and point cluster density of historical slope failure occurrences.',
    unitOrScale: 'Density (events / km²)',
    significance: 'Historical landslide clusters directly correlate with recurring high-susceptibility geological zones.',
    icon: AlertTriangle,
  },
  {
    id: 'geomorphology',
    name: 'Geomorphology',
    filename: 'geomorphology.png',
    src: '/geomorphology.png',
    category: 'Topographic',
    description: 'Classification of structural landforms, denudational hills, pediplains, and dissected plateaus.',
    unitOrScale: 'Geomorphic Units',
    significance: 'Structural weaknesses, fault scarps, and valley fills delineate localized geomechanical vulnerability.',
    icon: Layers,
  },
  {
    id: 'dtr',
    name: 'Distance to Road',
    filename: 'dtr.png',
    src: '/dtr.png',
    category: 'Anthropogenic',
    description: 'Euclidean distance buffer zones radiating from highway corridors and paved road cuts.',
    unitOrScale: 'Meters (m)',
    significance: 'Anthropogenic slope toes cut for road infrastructure destabilize natural talus angles and increase failure risk.',
    icon: Milestone,
  },
  {
    id: 'dem',
    name: 'DEM',
    filename: 'dem.png',
    src: '/dem.png',
    category: 'Topographic',
    description: 'Digital Elevation Model rendering continuous topographical elevation above mean sea level.',
    unitOrScale: 'Elevation (m AMSL)',
    significance: 'Fundamental baseline elevation model from which morphological parameters (slope, aspect, curvature) derive.',
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

  // Reset zoom and image state when factor changes
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
      className="flex flex-col lg:flex-row flex-1 h-full w-full overflow-hidden bg-slate-950 text-slate-100 font-sans"
    >
      {/* 1. LEFT SIDE: Vertical List of 10 Selectable LCF Factors */}
      <aside className="w-full lg:w-80 xl:w-96 shrink-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col h-72 lg:h-full overflow-hidden select-none">
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-semibold tracking-wide text-white uppercase">
                LCF Conditioning Factors
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 font-medium">
              10 Layers
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Select any factor to display the high-resolution geospatial raster map.
          </p>
        </div>

        {/* Scrollable Factor List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 focus:outline-none">
          {LCF_FACTORS.map((factor, index) => {
            const Icon = factor.icon;
            const isSelected = factor.id === selectedFactorId;

            return (
              <button
                key={factor.id}
                onClick={() => setSelectedFactorId(factor.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-3 group relative ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500/60 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r" />
                )}

                {/* Factor Icon */}
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Factor Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {index + 1}. {factor.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {factor.filename}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span className="text-slate-400">{factor.category}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 truncate">{factor.unitOrScale}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center gap-2 shrink-0">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">Raw PNG rasters rendered at 1:1 geospatial fidelity</span>
        </div>
      </aside>

      {/* 2. RIGHT SIDE: Large Viewer Panel Displaying Selected PNG */}
      <main className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950 relative min-w-0">
        {/* Top Control Bar: Displays Selected Factor's Name & Tools */}
        <div className="h-14 px-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between shrink-0 z-10 gap-3">
          {/* Factor Title Header */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <currentFactor.icon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight truncate">
                  {currentFactor.name}
                </h2>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 shrink-0">
                  {currentFactor.filename}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                <span>{currentFactor.category} Factor</span>
                <span className="text-slate-600">·</span>
                <span className="truncate">{currentFactor.description}</span>
              </div>
            </div>
          </div>

          {/* Interactive Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-md border border-slate-800">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-300 px-1.5 tabular-nums min-w-[2.75rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Reset Zoom to 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Open in new tab */}
            <a
              href={currentFactor.src}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800 bg-slate-950/50 transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Download Image */}
            <a
              href={currentFactor.src}
              download={currentFactor.filename}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800 bg-slate-950/50 transition-colors"
              title={`Download ${currentFactor.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
            </a>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800 bg-slate-950/50 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Center Image Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-auto min-h-0 bg-slate-950/90">
          {/* Subtle grid background to highlight transparent edges */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Loading Indicator */}
          {isLoadingImage && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg mb-3">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Rendering {currentFactor.name} Raster Map...
              </p>
              <p className="text-[11px] font-mono text-cyan-400 mt-1">
                {currentFactor.filename}
              </p>
            </div>
          )}

          {/* Error Message if image fails to load */}
          {imageError ? (
            <div className="relative z-20 max-w-md bg-slate-900 border border-rose-500/40 rounded-xl p-6 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-rose-200">
                Failed to Load LCF Map Image
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Could not load raster asset <code className="font-mono text-rose-300 bg-rose-950/80 px-1 py-0.5 rounded">{currentFactor.filename}</code> from <code className="font-mono text-slate-400">{currentFactor.src}</code>.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setImageError(false);
                    setIsLoadingImage(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Loading</span>
                </button>
                <a
                  href={currentFactor.src}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Open Directly
                </a>
              </div>
            </div>
          ) : (
            /* Centered Image with preserved aspect ratio, no stretching, no cropping */
            <div
              className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                key={currentFactor.id}
                src={currentFactor.src}
                alt={`${currentFactor.name} - Landslide Conditioning Factor Map (${currentFactor.filename})`}
                className={`max-h-[calc(100vh-12rem)] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800/90 transition-opacity duration-200 ${
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
        <div className="h-10 px-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-300">Geotechnical Significance:</span>
            <span className="truncate text-slate-400">{currentFactor.significance}</span>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0 font-mono text-[10px] text-slate-500">
            <span>Western Ghats Basin</span>
            <span>·</span>
            <span>Cartographic PNG Output</span>
          </div>
        </div>
      </main>
    </div>
  );
};
