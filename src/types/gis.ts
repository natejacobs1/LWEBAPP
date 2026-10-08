export type RiskLevel = 'Low' | 'High' | 'Very High';

export interface LandslideProperties {
  fid: number;
  Point_ID: number;
  Latitude: number;
  Longitude: number;
  NDVI1?: number;
  Elevation1?: number;
  aspect1?: number;
  profile_curvature1?: number;
  LD1?: number;
  slope1?: number;
  Rainfall1?: number;
  TWI1?: number;
  distance_to_road1?: number;
  Geomorphology?: string;
  Landslide_Prediction?: boolean;
  Landslide_Probability?: number;
  Susceptibility_Percentage?: number;
  Susceptibility_Class?: string;
  Village?: string | null;
  Town?: string | null;
  City?: string | null;
  Taluk?: string | null;
  District?: string | null;
  State?: string | null;
  Pincode?: number | string | null;
  Country?: string;
  [key: string]: unknown;
}

export interface DistrictProperties {
  fid?: number;
  Dist_Name?: string;
  State_Name?: string;
  [key: string]: unknown;
}

export interface RoadProperties {
  id?: string;
  name?: string;
  'name:kn'?: string;
  ref?: string;
  highway?: string;
  surface?: string;
  lanes?: string;
  maxspeed?: string;
  oneway?: string;
  [key: string]: unknown;
}

export type GeoJsonFeature<P, G = GeoJSON.Geometry> = {
  type: 'Feature';
  geometry: G;
  properties: P;
  id?: string | number;
};

export type GeoJsonFeatureCollection<P, G = GeoJSON.Geometry> = {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P, G>[];
};

export interface LayerVisibility {
  districts: boolean;
  roads: boolean;
  landslides: boolean;
}

export interface LayerOpacity {
  districts: number;
  roads: number;
  landslides: number;
}

export type BasemapId = 'osm' | 'carto_dark' | 'carto_light' | 'topo';

export type GisTab = 'layers' | 'inspector' | 'analytics' | 'susceptibility';

export interface BasemapOption {
  id: BasemapId;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}
