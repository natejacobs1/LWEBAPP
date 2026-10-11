import React, { useState } from 'react';
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
  const [basemapDropdown, setBasemapDropdown] = useState(false);

  const activeBasemapObj = BASEMAPS.find((b) => b.id === selectedBasemap) || BASEMAPS[0];

  return (
    <header className="h-11 bg-[#17251F] border-b border-[#A9B4AB]/25 px-3.5 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* Zone 1: LIRA Brand and CRS Subtitle */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="w-6.5 h-6.5 rounded bg-[#26362E] border border-[#A9B4AB]/30 flex items-center justify-center shrink-0 text-[#D5DFD4]">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold tracking-wider text-[#F3F4EF] font-mono">
            LIRA
          </span>
          <span className="text-[#A9B4AB]/40 hidden sm:inline" aria-hidden="true">|</span>
          <span className="text-[13px] text-[#A9B4AB] font-normal hidden xl:inline truncate">
            Landslide Intelligence & Risk Analytics
          </span>
          <span className="text-[13px] text-[#A9B4AB] font-normal hidden md:inline xl:hidden truncate">
            Risk Analytics
          </span>
          <span className="text-[#A9B4AB]/40 hidden md:inline" aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#D5DFD4] hidden sm:inline shrink-0">
            EPSG:4326
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Tabs (Environmental GIS Segment Control) */}
      <nav className="flex items-center gap-1 bg-[#101a15] p-0.5 rounded border border-[#A9B4AB]/20 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'layers'
              ? 'bg-[#26362E] text-[#F3F4EF] border border-[#A9B4AB]/35'
              : 'text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50 border border-transparent'
          }`}
          title="Layer controls and hazard filtering"
        >
          <Layers className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'layers' ? 'text-[#D5DFD4]' : 'text-[#A9B4AB]'}`} />
          <span>Layers & Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'inspector'
              ? 'bg-[#26362E] text-[#F3F4EF] border border-[#A9B4AB]/35'
              : 'text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50 border border-transparent'
          }`}
          title="Inspect selected landslide feature"
        >
          <MapPin className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'inspector' ? 'text-[#D5DFD4]' : 'text-[#A9B4AB]'}`} />
          <span>Feature Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#26362E] text-[#F3F4EF] border border-[#A9B4AB]/35'
              : 'text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50 border border-transparent'
          }`}
          title="Terrain and hazard analytics"
        >
          <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'analytics' ? 'text-[#D5DFD4]' : 'text-[#A9B4AB]'}`} />
          <span>Spatial Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('susceptibility')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'susceptibility'
              ? 'bg-[#26362E] text-[#F3F4EF] border border-[#A9B4AB]/35'
              : 'text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50 border border-transparent'
          }`}
          title="Sample landslide susceptibility raster"
        >
          <Crosshair className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'susceptibility' ? 'text-[#D5DFD4]' : 'text-[#A9B4AB]'}`} />
          <span>Susceptibility</span>
        </button>

        <button
          onClick={() => setActiveTab('lcf')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'lcf'
              ? 'bg-[#26362E] text-[#F3F4EF] border border-[#A9B4AB]/35'
              : 'text-[#A9B4AB] hover:text-[#F3F4EF] hover:bg-[#26362E]/50 border border-transparent'
          }`}
          title="Landslide Conditioning Factors (LCF) Maps"
        >
          <Images className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'lcf' ? 'text-[#D5DFD4]' : 'text-[#A9B4AB]'}`} />
          <span>LCF Maps</span>
        </button>
      </nav>

      {/* Zone 3: Primary Map Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Basemap dropdown */}
        <div className="relative">
          <button
            onClick={() => setBasemapDropdown(!basemapDropdown)}
            className="flex items-center gap-1.5 h-7.5 px-2.5 text-xs font-medium rounded bg-[#26362E] hover:bg-[#34473d] text-[#F3F4EF] border border-[#A9B4AB]/30 transition-colors whitespace-nowrap"
            title="Change Basemap"
          >
            <MapIcon className="w-3.5 h-3.5 text-[#D5DFD4] shrink-0" />
            <span className="hidden sm:inline text-xs">{activeBasemapObj.name}</span>
          </button>

          {basemapDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setBasemapDropdown(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-[#17251F] border border-[#A9B4AB]/30 rounded shadow-xl py-1 z-40 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#A9B4AB] border-b border-[#A9B4AB]/20">
                  Basemap Layer
                </div>
                {BASEMAPS.map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => {
                      onSelectBasemap(bm.id);
                      setBasemapDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#26362E] transition-colors ${
                      selectedBasemap === bm.id
                        ? 'text-[#D5DFD4] font-medium bg-[#26362E]/80'
                        : 'text-[#F3F4EF]'
                    }`}
                  >
                    <span>{bm.name}</span>
                    {selectedBasemap === bm.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D5DFD4]"></span>
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
          className="flex items-center gap-1.5 h-7.5 px-2.5 text-xs font-medium rounded bg-[#26362E] hover:bg-[#34473d] text-[#F3F4EF] border border-[#A9B4AB]/30 transition-colors whitespace-nowrap"
          title="Reset View to Full Extent"
        >
          <RotateCcw className="w-3 h-3 text-[#A9B4AB] hover:text-[#F3F4EF] shrink-0" />
          <span className="hidden sm:inline">Fit Extent</span>
        </button>
      </div>
    </header>
  );
};
