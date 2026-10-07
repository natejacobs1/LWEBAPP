import React from 'react';
import { Layers, MapPin, Navigation, BarChart3, RotateCcw, Compass, Map as MapIcon } from 'lucide-react';
import { BasemapId, BasemapOption } from '../types/gis';
import { BASEMAPS } from '../utils/gis';

interface HeaderProps {
  pointsCount: number;
  roadsCount: number;
  districtsCount: number;
  selectedBasemap: BasemapId;
  onSelectBasemap: (id: BasemapId) => void;
  onResetView: () => void;
  activeTab: 'layers' | 'inspector' | 'analytics' | 'points';
  setActiveTab: (tab: 'layers' | 'inspector' | 'analytics' | 'points') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  pointsCount,
  roadsCount,
  districtsCount,
  selectedBasemap,
  onSelectBasemap,
  onResetView,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  isLoading,
}) => {
  const [basemapDropdown, setBasemapDropdown] = React.useState(false);

  const activeBasemapObj = BASEMAPS.find((b) => b.id === selectedBasemap) || BASEMAPS[0];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Zone 1: Single text element wordmark with technical spatial subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/40 border border-orange-400/20">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
              Landslide Risk Monitoring System
            </h1>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>Karnataka Western Ghats</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">EPSG:4326 WGS 84</span>
            </div>
          </div>
        </div>

        {/* Live data badges */}
        {!isLoading && (
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              <span className="text-slate-200 tabular-nums font-semibold">{pointsCount.toLocaleString()}</span> points
            </span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block shadow-[0_0_4px_#facc15]"></span>
              <span className="text-slate-200 tabular-nums font-semibold">{roadsCount}</span> roads
            </span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-slate-200 tabular-nums font-semibold">{districtsCount}</span> districts
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation tabs / Console switchers */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => {
            setActiveTab('layers');
            if (!sidebarOpen) setSidebarOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            sidebarOpen && activeTab === 'layers'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Layer controls and hazard filtering"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers & Risk</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('inspector');
            if (!sidebarOpen) setSidebarOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            sidebarOpen && activeTab === 'inspector'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Inspect selected landslide feature"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Feature Inspector</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('analytics');
            if (!sidebarOpen) setSidebarOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            sidebarOpen && activeTab === 'analytics'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Terrain and hazard analytics"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Spatial Analytics</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('points');
            if (!sidebarOpen) setSidebarOpen(true);
          }}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            sidebarOpen && activeTab === 'points'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Browse all points"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directory</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions (Basemap switcher, Reset Extent, Sidebar toggle) */}
      <div className="flex items-center gap-2">
        {/* Basemap dropdown */}
        <div className="relative">
          <button
            onClick={() => setBasemapDropdown(!basemapDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-colors"
            title="Change Basemap"
          >
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{activeBasemapObj.name}</span>
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

        {/* Reset Extent */}
        <button
          onClick={onResetView}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-colors"
          title="Reset View to Full Extent"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          <span className="hidden sm:inline">Fit Extent</span>
        </button>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-1.5 rounded-md border text-xs transition-colors ${
            sidebarOpen
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
