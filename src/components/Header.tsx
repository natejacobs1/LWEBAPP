import React from 'react';
import { Layers, MapPin, BarChart3, RotateCcw, Compass, Map as MapIcon, Crosshair, Images } from 'lucide-react';
import { BasemapId, GisTab } from '../types/gis';
import { BASEMAPS } from '../utils/gis';

interface HeaderProps {
  pointsCount?: number;
  roadsCount?: number;
  districtsCount?: number;
  selectedBasemap: BasemapId;
  onSelectBasemap: (id: BasemapId) => void;
  onResetView: () => void;
  activeTab: GisTab;
  setActiveTab: (tab: GisTab) => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBasemap,
  onSelectBasemap,
  onResetView,
  activeTab,
  setActiveTab,
}) => {
  const [basemapDropdown, setBasemapDropdown] = React.useState(false);

  const activeBasemapObj = BASEMAPS.find((b) => b.id === selectedBasemap) || BASEMAPS[0];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-3 sm:gap-4 lg:gap-6 shrink-0 z-20 select-none">
      {/* Zone 1: LIRA Brand and Spatial CRS Subtitle */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 border border-orange-400/20 shrink-0">
          <Compass className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-white leading-tight flex items-center gap-1.5 whitespace-nowrap">
            <span>LIRA</span>
            <span className="text-slate-400 font-normal hidden xl:inline">— Landslide Intelligence & Risk Analytics</span>
            <span className="text-slate-400 font-normal hidden md:inline xl:hidden">— Risk Analytics</span>
          </h1>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <span className="hidden sm:inline">Karnataka Western Ghats</span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="text-cyan-400">EPSG:4326 WGS 84</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'layers'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Layer controls and hazard filtering"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>Layers & Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'inspector'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Inspect selected landslide feature"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>Feature Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Terrain and hazard analytics"
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span>Spatial Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('susceptibility')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'susceptibility'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Sample landslide susceptibility raster"
        >
          <Crosshair className="w-3.5 h-3.5 shrink-0" />
          <span>Susceptibility</span>
        </button>

        <button
          onClick={() => setActiveTab('lcf')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'lcf'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Landslide Conditioning Factors (LCF) Maps"
        >
          <Images className="w-3.5 h-3.5 shrink-0" />
          <span>LCF Maps</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Basemap switcher, Fit Extent) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Basemap dropdown */}
        <div className="relative">
          <button
            onClick={() => setBasemapDropdown(!basemapDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
            title="Change Basemap"
          >
            <MapIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">{activeBasemapObj.name}</span>
          </button>

          {basemapDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setBasemapDropdown(false)}
              />
              <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-40 text-xs">
                <div className="px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                  Select Basemap Layer
                </div>
                {BASEMAPS.map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => {
                      onSelectBasemap(bm.id);
                      setBasemapDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700 transition-colors ${
                      selectedBasemap === bm.id
                        ? 'text-cyan-400 font-semibold bg-slate-700/50'
                        : 'text-slate-200'
                    }`}
                  >
                    <span>{bm.name}</span>
                    {selectedBasemap === bm.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fit Extent */}
        <button
          onClick={onResetView}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
          title="Reset View to Full Extent"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-white shrink-0" />
          <span className="hidden sm:inline">Fit Extent</span>
        </button>
      </div>
    </header>
  );
};
