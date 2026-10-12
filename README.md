# LIRA — Landslide Intelligence & Risk Analytics

> A focused Web GIS workspace for spatial hazard assessment, terrain factor exploration, and landslide susceptibility modeling in the Karnataka Western Ghats.

---

## Why LIRA?

During the southwest monsoon, the steep escarpments and saturated soils of the Western Ghats face recurring slope failures. Roads get cut off, communities in valley basins face isolation, and emergency services need immediate clarity on where slopes are failing and why.

**LIRA (Landslide Intelligence & Risk Analytics)** was built to bridge raw geotechnical datasets with an intuitive, real-time spatial console. Instead of locking GIS rasters and shapefiles inside desktop software like QGIS or ArcGIS, LIRA provides an accessible browser interface for field responders, urban planners, and environmental researchers to explore hazard points, road corridors, and terrain factors side by side.

---

## Key Capabilities

### 1. Geospatial Hazard & Layer Console (`Layers & Risk`)
- **Hazard Inventory Points**: Pinpoints recorded landslide events categorized into clear risk tiers based on susceptibility modeling:
  - 🟢 **Low Risk** (0–60% Susceptibility)
  - 🟠 **High Risk** (>60–80% Susceptibility)
  - 🔴 **Very High Risk** (>80–100% Susceptibility)
- **Road Network Corridors**: Overlays key transportation routes to pinpoint cut-off hazards and high-risk segments located within 150m of unstable slopes.
- **District Boundaries**: Filters and frames analysis specifically for the 4 critical Western Ghats districts: **Shivamogga**, **Chikkamagaluru**, **Udupi**, and **Dakshina Kannada**.
- **Basemap Variety**: Toggle effortlessly between CartoDB Dark Matter, CartoDB Positron, OpenTopoMap (contour elevations), and standard OpenStreetMap.

### 2. Feature Inspector (`Feature Inspector`)
Click any mapped landslide point to reveal its granular terrain telemetry:
- Exact coordinates (WGS 84 / EPSG:4326) with one-click clipboard copying.
- Modeled susceptibility percentage and failure probability.
- Topographic parameters: Elevation (AMSL), Slope (°), Aspect, and Profile Curvature.
- Hydrological & Environmental indices: TWI (Topographic Wetness Index), annual Rainfall, and NDVI (canopy health).
- Distance to nearest transportation corridor.

### 3. Spatial Analytics (`Spatial Analytics`)
- Aggregated terrain statistics across all monitored landslides.
- Mean monsoon rainfall, slope angles, and elevation profiles.
- Breakdown of geomorphological units (denudational hills, pediplains, valley fills) and district-by-district vulnerability.

### 4. Direct Raster Sampling (`Susceptibility`)
- Interactively sample the continuous susceptibility raster at any clicked point on the terrain map.

### 5. Landslide Conditioning Factor Maps (`LCF Maps`)
A dedicated two-column raster viewer providing full-resolution cartographic views of the 10 core Landslide Conditioning Factors (LCFs) driving the susceptibility model:

| Factor | File | Description & Geotechnical Impact |
| :--- | :--- | :--- |
| **Aspect** | `aspect.png` | Compass orientation of slopes; governs sunlight exposure and moisture retention. |
| **TWI** | `TWI.png` | Topographic Wetness Index; highlights moisture accumulation zones. |
| **Slope** | `slope.png` | Terrain steepness in degrees; direct driver of gravitational shear stress. |
| **Rainfall** | `rainfall.png` | Monsoon precipitation patterns triggering pore water pressure spikes. |
| **Profile Curvature** | `profile curve.png` | Surface convexity/concavity influencing flow acceleration and runoff velocity. |
| **NDVI** | `NDVI.png` | Vegetation canopy cover; higher values indicate soil-stabilizing root cohesion. |
| **Landslide Density** | `ldensity.png` | Spatial frequency and clustering of historical failure points. |
| **Geomorphology** | `geomorphology.png` | Structural terrain formations, fault lines, and rock/soil type classifications. |
| **Distance to Road** | `dtr.png` | Proximity to road cuts that alter natural slope toes and destabilize banks. |
| **DEM** | `dem.png` | Digital Elevation Model baseline (m above sea level). |

---

## Tech Stack & Architecture

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (dark mode optimized for geospatial visualization)
- **Mapping & GIS**: Leaflet, Proj4, GeoTIFF, custom GeoJSON layer handlers
- **Icons**: Lucide React
- **Coordinate Reference System**: EPSG:4326 (WGS 84)

---

## Local Development

### Prerequisites
- Node.js (v18+)
- npm or bun

### Setup
```bash
# Clone the repository
git clone https://github.com/natejacobs1/LWEBAPP.git
cd LWEBAPP

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` to interact with LIRA.

### Build for Production
```bash
npm run build
```

---

## Dataset Attribution

Geospatial data for districts, road networks, and landslide hazard points are curated for the Karnataka Western Ghats region, derived from geological survey records, satellite remote sensing, and field verification.
Thank
