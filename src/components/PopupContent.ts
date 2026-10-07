import { LandslideProperties } from '../types/gis';
import { getRiskLevel, RISK_COLORS, formatNum } from '../utils/gis';

export function createLandslidePopupHtml(props: LandslideProperties): string {
  const risk = getRiskLevel(props);
  const color = RISK_COLORS[risk];
  const prob = props.Landslide_Probability !== undefined ? (Number(props.Landslide_Probability) * 100).toFixed(1) : null;
  const susc = props.Susceptibility_Percentage !== undefined ? formatNum(props.Susceptibility_Percentage, 1) : null;

  const village = props.Village || 'Unincorporated Area';
  const taluk = props.Taluk || '—';
  const district = props.District || '—';

  return `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 280px; max-width: 320px; padding: 12px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600;">Landslide Point #${props.Point_ID || props.fid || '—'}</div>
          <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 1px;">${village}</div>
        </div>
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${color.stroke}33; border: 1px solid ${color.stroke}; color: ${color.fill};">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color.fill};"></span>
          ${risk} Risk
        </span>
      </div>

      <!-- Location Metadata -->
      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 6px 10px;">
        <span><strong>Taluk:</strong> <span style="color: #cbd5e1;">${taluk}</span></span>
        <span><strong>District:</strong> <span style="color: #cbd5e1;">${district}</span></span>
        ${props.Pincode ? `<span><strong>PIN:</strong> <span style="color: #cbd5e1;">${props.Pincode}</span></span>` : ''}
      </div>

      <!-- Probability / Susceptibility Gauge -->
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #94a3b8;">Susceptibility:</span>
          <span style="font-weight: 700; color: ${color.fill}; font-family: 'JetBrains Mono', monospace;">${susc}% (${risk} Risk)</span>
        </div>
        <div style="height: 5px; width: 100%; background: #334155; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; width: ${Math.min(100, Math.max(5, Number(props.Susceptibility_Percentage || 50)))}%; background: ${color.fill}; border-radius: 3px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
          <span>Scale: 0–60% Low</span>
          <span>&gt;60–80% High</span>
          <span>&gt;80% Very High</span>
        </div>
        ${prob ? `
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 6px;">
            <span>Model Probability:</span>
            <span style="font-family: 'JetBrains Mono', monospace; color: #e2e8f0;">${prob}%</span>
          </div>
        ` : ''}
      </div>

      <!-- Geo-environmental Attribute Matrix -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">Elevation</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.Elevation1, 0)} m</div>
        </div>
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">Slope</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.slope1, 1)}°</div>
        </div>
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">Rainfall</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.Rainfall1, 0)} mm</div>
        </div>
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">Dist to Road</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.distance_to_road1, 0)} m</div>
        </div>
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">NDVI (Veg)</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.NDVI1, 3)}</div>
        </div>
        <div style="background: #182234; padding: 5px 7px; border-radius: 4px; border-left: 2px solid #38bdf8;">
          <div style="color: #64748b; font-size: 9px; text-transform: uppercase;">TWI (Wetness)</div>
          <div style="font-weight: 600; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;">${formatNum(props.TWI1, 2)}</div>
        </div>
      </div>

      <!-- Geomorphology & Coordinates -->
      ${props.Geomorphology ? `
        <div style="font-size: 10px; color: #94a3b8; background: #131d2e; padding: 5px 8px; border-radius: 4px; margin-bottom: 8px;">
          <strong style="color: #cbd5e1;">Geomorphology:</strong> ${props.Geomorphology}
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace; border-top: 1px solid #334155; padding-top: 6px;">
        <span>${formatNum(props.Latitude, 5)}° N, ${formatNum(props.Longitude, 5)}° E</span>
        <span>EPSG:4326</span>
      </div>
    </div>
  `;
}
