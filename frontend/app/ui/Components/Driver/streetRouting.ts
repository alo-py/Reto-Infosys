import rawStreetRoutes from './monterrey_street_routes.json';
import { MONTERREY_NODES, ZoneName } from './types';

const streetRoutes: Record<string, [number, number][]> = rawStreetRoutes as unknown as Record<string, [number, number][]>;

/**
 * Returns the exact OpenStreetMap street coordinates between two Monterrey locations.
 */
export function getStreetPath(origin: ZoneName | string, destination: ZoneName | string): [number, number][] {
  const key = `${origin}->${destination}`;
  if (streetRoutes[key] && streetRoutes[key].length > 0) {
    return streetRoutes[key];
  }

  // Fallback if not found
  const o = MONTERREY_NODES[origin as ZoneName];
  const d = MONTERREY_NODES[destination as ZoneName];
  if (o && d) {
    return [
      [o.lat, o.lng],
      [(o.lat + d.lat) / 2, (o.lng + d.lng) / 2],
      [d.lat, d.lng],
    ];
  }
  return [];
}

/**
 * Builds the continuous street-by-street GPS path for a multi-stop sequence of deliveries.
 */
export function buildFullStreetSequence(stops: (ZoneName | string)[]): [number, number][] {
  if (stops.length < 2) return [];

  const fullPath: [number, number][] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const segment = getStreetPath(stops[i], stops[i + 1]);
    if (segment.length > 0) {
      if (fullPath.length > 0) {
        fullPath.push(...segment.slice(1));
      } else {
        fullPath.push(...segment);
      }
    }
  }
  return fullPath;
}
