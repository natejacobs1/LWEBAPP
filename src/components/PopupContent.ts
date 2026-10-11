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
    <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 255px; max-width: min(320px, calc(100vw - 48px)); padding: 13px; background: #17251F; color: #F3F4EF; border-radius: 6px;">
      <!-- Feature ID & Title -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid rgba(169, 180, 171, 0.2); padding-bottom: 8px; margin-bottom: 8px;">
        <div>
          <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; color: #A9B4AB;">
            POINT #${props.Point_ID || props.fid || '—'}
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #F3F4EF; margin-top: 1px;">${village}</div>
          <div style="font-size: 12px; color: #A9B4AB;">${taluk}, ${district}</div>
        </div>
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #26362E; border: 1px solid rgba(169, 180, 171, 0.3); color: ${color.fill};">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color.fill};"></span>
          ${risk}
        </span>
      </div>

      <!-- Susceptibility Meter -->
      <div style="background: #101a15; border: 1px solid rgba(169, 180, 171, 0.2); border-radius: 4px; padding: 7px 9px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span style="color: #A9B4AB;">Susceptibility</span>
          <span style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace;">${susc}%</span>
        </div>
        <div style="height: 4px; width: 100%; background: #26362E; border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${Math.min(100, Math.max(5, Number(props.Susceptibility_Percentage || 50)))}%; background: ${color.fill};"></div>
        </div>
        ${prob ? `
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #A9B4AB; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
            <span>Probability</span>
            <span style="color: #D5DFD4;">${prob}%</span>
          </div>
        ` : ''}
      </div>

      <!-- Terrain Attribute Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; margin-bottom: 8px;">
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">Elevation</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.Elevation1, 0)} m</div>
        </div>
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">Slope</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.slope1, 1)}°</div>
        </div>
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">Rainfall</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.Rainfall1, 0)} mm</div>
        </div>
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">Road Proximity</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.distance_to_road1, 0)} m</div>
        </div>
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">NDVI</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.NDVI1, 3)}</div>
        </div>
        <div style="background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18);">
          <div style="color: #A9B4AB; font-size: 10px; text-transform: uppercase;">TWI</div>
          <div style="font-weight: 600; color: #F3F4EF; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${formatNum(props.TWI1, 2)}</div>
        </div>
      </div>

      <!-- Geomorphology -->
      ${props.Geomorphology ? `
        <div style="font-size: 11px; color: #A9B4AB; background: #101a15; padding: 5px 7px; border-radius: 4px; border: 1px solid rgba(169, 180, 171, 0.18); margin-bottom: 8px;">
          <span style="color: #A9B4AB; text-transform: uppercase; font-size: 10px;">Geomorphology:</span>
          <span style="color: #F3F4EF; font-weight: 500;"> ${props.Geomorphology}</span>
        </div>
      ` : ''}

      <!-- Coordinate Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #A9B4AB; font-family: 'JetBrains Mono', monospace; border-top: 1px solid rgba(169, 180, 171, 0.2); padding-top: 6px;">
        <span>${formatNum(props.Latitude, 4)}° N, ${formatNum(props.Longitude, 4)}° E</span>
        <span>WGS 84</span>
      </div>
    </div>
  `;
}
