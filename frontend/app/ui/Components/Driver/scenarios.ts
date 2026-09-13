export type WeatherPreset = 
  | 'DEFAULT_DYNAMIC' // Realistic Monterrey cycle: extreme heat -> afternoon storm -> light rain
  | 'EXTREME_HEAT'    // 40°C Extreme Heatwave
  | 'SEVERE_STORM'   // 26°C Severe storm & flooding risk
  | 'LIGHT_RAIN'     // 28°C Light rain / overcast
  | 'CLEAR_SUNNY';   // 24°C Pleasant clear skies

export type TrafficLevel = 'NORMAL' | 'MODERATE' | 'SEVERE';

export type RoadClosureOption = 
  | 'NONE'
  | 'Av. Gonzalitos'
  | 'Av. Constitución'
  | 'Av. Morones Prieto'
  | 'Blvd. Díaz Ordaz';

export interface ShiftScenarioConfig {
  id: 'DEFAULT_MTY' | 'HEATWAVE' | 'STORM_FLOOD' | 'RUSH_HOUR' | 'CUSTOM';
  name: string;
  badge: string;
  description: string;
  weather: WeatherPreset;
  traffic: TrafficLevel;
  roadClosure: RoadClosureOption;
  surgeMultiplier: number;
}

export function getAvenueAffectedZones(avenue: RoadClosureOption): string[] {
  switch (avenue) {
    case 'Av. Gonzalitos':
      return ["San Nicolás", "Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"];
    case 'Av. Constitución':
      return ["Centro MTY (Barrio Antiguo)", "San Jerónimo", "Santa Catarina"];
    case 'Av. Morones Prieto':
      return ["Centrito Valle (San Pedro)", "Tec de Monterrey (Garza Sada)"];
    case 'Blvd. Díaz Ordaz':
      return ["Santa Catarina", "San Jerónimo"];
    case 'NONE':
    default:
      return [];
  }
}

export const DEFAULT_MONTERREY_SCENARIO: ShiftScenarioConfig = {
  id: 'DEFAULT_MTY',
  name: 'Average Monterrey Day',
  badge: '🌟 Default Daily Cycle',
  description: 'Simulates a typical workday in Monterrey: starts with scorching 39°C heat, followed by an unexpected afternoon flash storm & Av. Gonzalitos blockage, ending in light rain.',
  weather: 'DEFAULT_DYNAMIC',
  traffic: 'MODERATE',
  roadClosure: 'Av. Gonzalitos',
  surgeMultiplier: 1.55,
};

export const PRESET_SCENARIOS: ShiftScenarioConfig[] = [
  DEFAULT_MONTERREY_SCENARIO,
  {
    id: 'HEATWAVE',
    name: 'Canícula Summer Heatwave',
    badge: '☀️ Extreme Heat (41°C)',
    description: 'Dry asphalt, 41°C scorching temperature throughout the entire shift, moderate traffic corridor, 1.2x surge with high driver vehicle thermal stress.',
    weather: 'EXTREME_HEAT',
    traffic: 'MODERATE',
    roadClosure: 'NONE',
    surgeMultiplier: 1.2,
  },
  {
    id: 'STORM_FLOOD',
    name: 'Tropical Storm & Flash Flooding',
    badge: '⛈️ Severe Storm & Gridlock',
    description: 'Sudden tropical cloudburst from start to finish. Av. Gonzalitos underpasses flooded, gridlock traffic index (1.75x), and 1.8x maximum dynamic surge.',
    weather: 'SEVERE_STORM',
    traffic: 'SEVERE',
    roadClosure: 'Av. Gonzalitos',
    surgeMultiplier: 1.8,
  },
  {
    id: 'RUSH_HOUR',
    name: 'Friday Rush Hour Gridlock',
    badge: '🚗 Highway Bottleneck',
    description: 'Heavy 6:00 PM commuter flow across metropolitan Monterrey. Express lane obstruction on Av. Constitución, severe traffic delay (1.75x), and 1.5x surge.',
    weather: 'CLEAR_SUNNY',
    traffic: 'SEVERE',
    roadClosure: 'Av. Constitución',
    surgeMultiplier: 1.5,
  },
  {
    id: 'CUSTOM',
    name: 'Custom Shift Scenario',
    badge: '🛠️ Custom Environment',
    description: 'Freely customize weather conditions, traffic index, road closures, and dynamic surge pricing for testing.',
    weather: 'CLEAR_SUNNY',
    traffic: 'NORMAL',
    roadClosure: 'NONE',
    surgeMultiplier: 1.0,
  },
];
