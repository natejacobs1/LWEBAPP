import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
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
  roadsCount,
  districtsCount,
  selectedRiskFilters,
  onToggleRiskFilter,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-[1000] select-none font-sans w-60 transition-all">
      <div className="bg-[#17251F] border border-[#A9B4AB]/30 rounded shadow-lg overflow-hidden text-xs text-[#F3F4EF]">
        {/* Legend Header */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between px-3 py-1.5 bg-[#101a15]/85 border-b border-[#A9B4AB]/20 cursor-pointer hover:bg-[#101a15] transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#D5DFD4]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#D5DFD4] font-semibold">
              Legend
            </span>
          </div>
          <button className="text-[#A9B4AB] hover:text-[#F3F4EF] p-0.5">
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Legend Content */}
        {!collapsed && (
          <div className="p-2.5 space-y-2.5 text-xs">
            {/* Susceptibility Risk Tiers */}
            <div>
              <div className="text-[11px] font-mono text-[#A9B4AB] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Susceptibility Tier</span>
                <span className="text-[10px] text-[#A9B4AB]/70 lowercase">(toggle)</span>
              </div>
              <div className="space-y-0.5">
                {(['Very High', 'High', 'Low'] as RiskLevel[]).map((level) => {
                  const color = RISK_COLORS[level];
                  const count = counts[level] || 0;
                  const isActive = selectedRiskFilters[level];
                  const rangeLabel =
                    level === 'Very High' ? '>80–100%' : level === 'High' ? '>60–80%' : '0–60%';

                  return (
                    <button
                      key={level}
                      onClick={() => onToggleRiskFilter(level)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors text-left ${
                        isActive
                          ? 'bg-[#26362E] hover:bg-[#34473d] text-[#F3F4EF]'
                          : 'opacity-40 hover:opacity-60 bg-transparent text-[#A9B4AB] line-through'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                          style={{
                            backgroundColor: color.fill,
                          }}
                        />
                        <span className="font-medium text-[13px] text-[#F3F4EF]">{level}</span>
                        <span className="text-[11px] text-[#A9B4AB] font-mono">({rangeLabel})</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#D5DFD4] tabular-nums">
                        {count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vector Layers */}
            <div className="pt-2 border-t border-[#A9B4AB]/20 space-y-1">
              <div className="text-[11px] font-mono text-[#A9B4AB] uppercase tracking-wider mb-1">
                Layers
              </div>

              <div className="flex items-center justify-between px-2 py-0.5 text-[#F3F4EF]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 bg-amber-400 rounded-xs" />
                  <span className="text-[#F3F4EF] text-[13px]">Road Network</span>
                </div>
                <span className="font-mono text-[11px] text-[#A9B4AB] tabular-nums">{roadsCount}</span>
              </div>

              <div className="flex items-center justify-between px-2 py-0.5 text-[#F3F4EF]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-dashed border-sky-400/80 bg-sky-500/10 rounded-xs" />
                  <span className="text-[#F3F4EF] text-[13px]">District Borders</span>
                </div>
                <span className="font-mono text-[11px] text-[#A9B4AB] tabular-nums">{districtsCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
