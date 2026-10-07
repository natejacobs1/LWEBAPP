import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';
import { RiskLevel } from '../types/gis';
import { RISK_COLORS } from '../utils/gis';

interface LegendProps {
  counts: Record<RiskLevel, number>;
  totalPoints: number;
  roadsCount: number;
  districtsCount: number;
  selectedRiskFilters: Record<RiskLevel, boolean>;
  onToggleRiskFilter: (risk: RiskLevel) => void;
}

export const Legend: React.FC<LegendProps> = ({
  counts,
  totalPoints,
  roadsCount,
  districtsCount,
  selectedRiskFilters,
  onToggleRiskFilter,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-5 right-4 z-[1000] select-none font-sans max-w-xs transition-all">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden text-xs text-slate-200">
        {/* Legend Header */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px] tracking-wide uppercase text-slate-200">
              Map Legend & Hazard Scale
            </span>
          </div>
          <button className="text-slate-400 hover:text-white">
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Legend Body */}
        {!collapsed && (
          <div className="p-3 space-y-3">
            {/* Landslide Risk Category */}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Landslide Susceptibility</span>
                <span className="text-[9px] text-slate-500 lowercase">(click to filter)</span>
              </div>
              <div className="space-y-1">
                {(['Very High', 'High', 'Low'] as RiskLevel[]).map((level) => {
                  const color = RISK_COLORS[level];
                  const count = counts[level] || 0;
                  const isActive = selectedRiskFilters[level];

                  return (
                    <button
                      key={level}
                      onClick={() => onToggleRiskFilter(level)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left ${
                        isActive
                          ? 'bg-slate-800/70 hover:bg-slate-800'
                          : 'opacity-40 hover:opacity-75 bg-slate-900/50 line-through'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 border"
                          style={{
                            backgroundColor: color.fill,
                            borderColor: color.stroke,
                            boxShadow: `0 0 6px ${color.fill}66`,
                          }}
                        />
                        <span className="font-medium text-slate-200">{level} Risk</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Linear & Polygon Features */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Geospatial Layers
              </div>

              <div className="flex items-center justify-between px-2 py-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-cyan-400 shadow-[0_0_4px_#38bdf8] rounded" />
                  <span>Road Network</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">{roadsCount}</span>
              </div>

              <div className="flex items-center justify-between px-2 py-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-dashed border-sky-400/80 bg-sky-500/10 rounded-sm" />
                  <span>District Boundaries</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">{districtsCount}</span>
              </div>
            </div>

            {/* Note */}
            <div className="pt-2 border-t border-slate-800 flex items-start gap-1.5 text-[10px] text-slate-400 leading-snug">
              <Info className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
              <span>Click any point on the map to inspect all terrain, rainfall & model attributes.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
