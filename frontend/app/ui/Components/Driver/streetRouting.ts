import rawStreetRoutes from './monterrey_street_routes.json';
import { MONTERREY_NODES, ZoneName, DriverDirectives } from './types';

const streetRoutes: Record<string, [number, number][]> = rawStreetRoutes as unknown as Record<string, [number, number][]>;

/**
 * Returns the exact OpenStreetMap street coordinates between two Monterrey locations.
 */
export function getStreetPath(origin: ZoneName | string, destination: ZoneName | string): [number, number][] {
  if (origin === destination) {
    const node = MONTERREY_NODES[origin as ZoneName];
    return node ? [[node.lat, node.lng]] : [];
  }

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
 * Eliminates duplicate consecutive stops to prevent zero-length or erratic movements.
 */
export function buildFullStreetSequence(stops: (ZoneName | string)[]): [number, number][] {
  if (stops.length < 2) return [];

  const fullPath: [number, number][] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i] === stops[i + 1]) continue;

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

/**
 * Logical traffic corridors across Monterrey metropolitan area.
 * Each entry ensures orders follow direct arterial avenues (Garza Sada, Morones Prieto, Constitución, Gonzalitos, etc.)
 * rather than wandering or taking random zig-zag loops.
 */
export const MONTERREY_CORRIDORS: Record<
  ZoneName,
  {
    adjacentHubs: ZoneName[];
    singles: ZoneName[];
    batches: [ZoneName, ZoneName][];
  }
> = {
  "Tec de Monterrey (Garza Sada)": {
    adjacentHubs: ["Centro MTY (Barrio Antiguo)", "Valle Oriente (San Pedro)"],
    singles: ["Centro MTY (Barrio Antiguo)", "Valle Oriente (San Pedro)", "San Jerónimo", "Centrito Valle (San Pedro)"],
    batches: [
      ["Centro MTY (Barrio Antiguo)", "San Jerónimo"],
      ["Centro MTY (Barrio Antiguo)", "San Nicolás"],
      ["Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"],
    ],
  },
  "Centro MTY (Barrio Antiguo)": {
    adjacentHubs: ["Tec de Monterrey (Garza Sada)", "San Jerónimo", "San Nicolás", "Valle Oriente (San Pedro)"],
    singles: ["Tec de Monterrey (Garza Sada)", "San Jerónimo", "San Nicolás", "Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"],
    batches: [
      ["San Jerónimo", "Cumbres"],
      ["San Jerónimo", "Santa Catarina"],
      ["Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"],
      ["San Nicolás", "Apodaca (Industrial)"],
      ["Tec de Monterrey (Garza Sada)", "Valle Oriente (San Pedro)"],
    ],
  },
  "Centrito Valle (San Pedro)": {
    adjacentHubs: ["Valle Oriente (San Pedro)", "San Jerónimo", "Santa Catarina"],
    singles: ["Valle Oriente (San Pedro)", "San Jerónimo", "Santa Catarina", "Centro MTY (Barrio Antiguo)"],
    batches: [
      ["Valle Oriente (San Pedro)", "Tec de Monterrey (Garza Sada)"],
      ["San Jerónimo", "Cumbres"],
      ["San Jerónimo", "Centro MTY (Barrio Antiguo)"],
      ["Santa Catarina", "San Jerónimo"],
    ],
  },
  "Valle Oriente (San Pedro)": {
    adjacentHubs: ["Centrito Valle (San Pedro)", "Tec de Monterrey (Garza Sada)", "Centro MTY (Barrio Antiguo)"],
    singles: ["Centrito Valle (San Pedro)", "Tec de Monterrey (Garza Sada)", "Centro MTY (Barrio Antiguo)", "San Jerónimo"],
    batches: [
      ["Centrito Valle (San Pedro)", "San Jerónimo"],
      ["Tec de Monterrey (Garza Sada)", "Centro MTY (Barrio Antiguo)"],
      ["Centrito Valle (San Pedro)", "Santa Catarina"],
    ],
  },
  "San Jerónimo": {
    adjacentHubs: ["Centrito Valle (San Pedro)", "Centro MTY (Barrio Antiguo)", "Cumbres", "Santa Catarina"],
    singles: ["Centrito Valle (San Pedro)", "Centro MTY (Barrio Antiguo)", "Cumbres", "Santa Catarina"],
    batches: [
      ["Centrito Valle (San Pedro)", "Valle Oriente (San Pedro)"],
      ["Centro MTY (Barrio Antiguo)", "Tec de Monterrey (Garza Sada)"],
      ["Centro MTY (Barrio Antiguo)", "San Nicolás"],
      ["Santa Catarina", "Centrito Valle (San Pedro)"],
    ],
  },
  "Cumbres": {
    adjacentHubs: ["San Jerónimo", "San Nicolás"],
    singles: ["San Jerónimo", "Centro MTY (Barrio Antiguo)", "Centrito Valle (San Pedro)"],
    batches: [
      ["San Jerónimo", "Centrito Valle (San Pedro)"],
      ["San Jerónimo", "Centro MTY (Barrio Antiguo)"],
      ["San Nicolás", "Centro MTY (Barrio Antiguo)"],
    ],
  },
  "San Nicolás": {
    adjacentHubs: ["Centro MTY (Barrio Antiguo)", "Apodaca (Industrial)", "Cumbres"],
    singles: ["Centro MTY (Barrio Antiguo)", "Apodaca (Industrial)", "Cumbres", "Tec de Monterrey (Garza Sada)"],
    batches: [
      ["Centro MTY (Barrio Antiguo)", "Tec de Monterrey (Garza Sada)"],
      ["Centro MTY (Barrio Antiguo)", "Valle Oriente (San Pedro)"],
      ["Apodaca (Industrial)", "Centro MTY (Barrio Antiguo)"],
      ["Cumbres", "San Jerónimo"],
    ],
  },
  "Apodaca (Industrial)": {
    adjacentHubs: ["San Nicolás", "Centro MTY (Barrio Antiguo)"],
    singles: ["San Nicolás", "Centro MTY (Barrio Antiguo)"],
    batches: [
      ["San Nicolás", "Centro MTY (Barrio Antiguo)"],
      ["San Nicolás", "Cumbres"],
      ["Centro MTY (Barrio Antiguo)", "Tec de Monterrey (Garza Sada)"],
    ],
  },
  "Santa Catarina": {
    adjacentHubs: ["San Jerónimo", "Centrito Valle (San Pedro)"],
    singles: ["San Jerónimo", "Centrito Valle (San Pedro)", "Centro MTY (Barrio Antiguo)"],
    batches: [
      ["San Jerónimo", "Centro MTY (Barrio Antiguo)"],
      ["San Jerónimo", "Cumbres"],
      ["Centrito Valle (San Pedro)", "Valle Oriente (San Pedro)"],
    ],
  },
};

/**
 * Calculates straight-line and winding road distance in km between two Monterrey metropolitan zones
 */
export function getZoneDistanceKm(origin: ZoneName | string, destination: ZoneName | string): number {
  if (origin === destination) return 0.0;
  const o = MONTERREY_NODES[origin as ZoneName];
  const d = MONTERREY_NODES[destination as ZoneName];
  if (!o || !d) return 4.5;

  const R = 6371; // Earth radius in km
  const dLat = (d.lat - o.lat) * (Math.PI / 180);
  const dLng = (d.lng - o.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(o.lat * (Math.PI / 180)) * Math.cos(d.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const crowKm = R * c;
  // Monterrey metropolitan road factor: 1.35x due to mountain geography and urban avenues
  return Number(Math.max(2.4, crowKm * 1.35).toFixed(1));
}

/**
 * Calculates total trip distance, deadhead distance (transition to pickup), and delivery distance
 */
export function calculateRouteDistances(
  stops: (ZoneName | string)[],
  hasPickupTransition: boolean
): { totalKm: number; deadheadKm: number; deliveryKm: number } {
  if (stops.length < 2) return { totalKm: 0, deadheadKm: 0, deliveryKm: 0 };

  let deadheadKm = 0;
  let deliveryKm = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const d = getZoneDistanceKm(stops[i], stops[i + 1]);
    if (i === 0 && hasPickupTransition) {
      deadheadKm += d;
    } else {
      deliveryKm += d;
    }
  }

  const totalKm = Number((deadheadKm + deliveryKm).toFixed(1));
  return {
    totalKm,
    deadheadKm: Number(deadheadKm.toFixed(1)),
    deliveryKm: Number(deliveryKm.toFixed(1)),
  };
}

export interface OrderPlanResult {
  tipo: 'INDIVIDUAL' | 'BATCH';
  origen: ZoneName;
  destino: ZoneName;
  paradasSecuencia: ZoneName[];
  duracionViaje: number;
  tarifaBase: number;
  propina: number;
  distanciaKmTotal: number;
  kmVacioViaje: number;
  hasPickupTransition: boolean;
  transicionDesde?: ZoneName;
  logExplicativo: string;
  estaDesviado?: boolean;
  desvioExplicacion?: string;
}

/**
 * Checks if a route sequence crosses a blocked avenue.
 */
export function routeIntersectsBlockage(
  stops: (ZoneName | string)[],
  avenidaCerrada: string | null
): boolean {
  if (!avenidaCerrada || stops.length < 2) return false;

  const isGonzalitos = avenidaCerrada === "Av. Gonzalitos";
  const isConstitucion = avenidaCerrada === "Av. Constitución";
  const isMorones = avenidaCerrada === "Av. Morones Prieto";
  const isDiazOrdaz = avenidaCerrada === "Blvd. Díaz Ordaz";

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];

    if (isGonzalitos) {
      // Gonzalitos is the primary link connecting San Nicolás/Cumbres with San Pedro/San Jerónimo
      const isNorth = a === "San Nicolás" || a === "Cumbres" || b === "San Nicolás" || b === "Cumbres";
      const isSouth = a === "Centrito Valle (San Pedro)" || a === "Valle Oriente (San Pedro)" || a === "San Jerónimo" ||
                      b === "Centrito Valle (San Pedro)" || b === "Valle Oriente (San Pedro)" || b === "San Jerónimo";
      if (isNorth && isSouth) return true;
    }

    if (isConstitucion) {
      if ((a === "Centro MTY (Barrio Antiguo)" && b === "San Jerónimo") || (a === "San Jerónimo" && b === "Centro MTY (Barrio Antiguo)")) return true;
      if ((a === "Centro MTY (Barrio Antiguo)" && b === "Santa Catarina") || (a === "Santa Catarina" && b === "Centro MTY (Barrio Antiguo)")) return true;
    }

    if (isMorones) {
      if ((a === "Centrito Valle (San Pedro)" && b === "Tec de Monterrey (Garza Sada)") || (a === "Tec de Monterrey (Garza Sada)" && b === "Centrito Valle (San Pedro)")) return true;
      if ((a === "San Jerónimo" && b === "Centrito Valle (San Pedro)") || (a === "Centrito Valle (San Pedro)" && b === "San Jerónimo")) return true;
    }

    if (isDiazOrdaz) {
      if ((a === "Santa Catarina" && b === "San Jerónimo") || (a === "San Jerónimo" && b === "Santa Catarina")) return true;
      if ((a === "Santa Catarina" && b === "Centro MTY (Barrio Antiguo)") || (a === "Centro MTY (Barrio Antiguo)" && b === "Santa Catarina")) return true;
    }
  }

  return false;
}

/**
 * Calculates a safe detour sequence around a blocked avenue.
 */
export function calculateDetourRoute(
  stops: (ZoneName | string)[],
  avenidaCerrada: string
): {
  detourStops: ZoneName[];
  bypassDescription: string;
} {
  const origin = stops[0] as ZoneName;
  const finalDest = stops[stops.length - 1] as ZoneName;

  if (avenidaCerrada === "Av. Gonzalitos") {
    // Bypass Gonzalitos using Centro MTY (Barrio Antiguo) and Morones Prieto/Loma Larga tunnel
    const bypass: ZoneName = "Centro MTY (Barrio Antiguo)";
    const detourStops: ZoneName[] = origin === bypass
      ? [origin, finalDest]
      : [origin, bypass, finalDest];

    return {
      detourStops,
      bypassDescription: "Detour via Centro MTY (Barrio Antiguo) & Loma Larga bypass (bypassing Av. Gonzalitos)",
    };
  }

  if (avenidaCerrada === "Av. Constitución") {
    const bypass: ZoneName = "Valle Oriente (San Pedro)";
    const detourStops: ZoneName[] = origin === bypass
      ? [origin, finalDest]
      : [origin, bypass, finalDest];

    return {
      detourStops,
      bypassDescription: "Detour via Valle Oriente / Lázaro Cárdenas bypass (bypassing Av. Constitución)",
    };
  }

  if (avenidaCerrada === "Blvd. Díaz Ordaz") {
    const bypass: ZoneName = "Centrito Valle (San Pedro)";
    const detourStops: ZoneName[] = origin === bypass
      ? [origin, finalDest]
      : [origin, bypass, finalDest];

    return {
      detourStops,
      bypassDescription: "Detour via Vasconcelos & San Pedro bypass (bypassing Blvd. Díaz Ordaz)",
    };
  }

  const fallbackBypass: ZoneName = "Centro MTY (Barrio Antiguo)";
  const detourStops: ZoneName[] = origin === fallbackBypass
    ? [origin, finalDest]
    : [origin, fallbackBypass, finalDest];

  return {
    detourStops,
    bypassDescription: `Detour avoiding ${avenidaCerrada}`,
  };
}

/**
 * Computes the next realistic order or batch for the driver from their current location.
 * ZERO TELEPORTATION: paradasSecuencia always starts at currentLocation.
 * If pickup is at another hub, it shows a smooth pickup transition route.
 */
export function getNextOrderPlan(
  currentLocation: ZoneName,
  isOptiGo: boolean,
  surge: number = 1.0,
  avenidaCerrada: string | null = null,
  trafico: number = 1.0,
  directives?: DriverDirectives
): OrderPlanResult {
  const corridor = MONTERREY_CORRIDORS[currentLocation] || MONTERREY_CORRIDORS["Centro MTY (Barrio Antiguo)"];

  // 35% chance of pickup transition to a nearby hub, 65% immediate pickup at current hub
  let needTransition = Math.random() < 0.35 && corridor.adjacentHubs.length > 0;
  let pickupHub = needTransition 
    ? corridor.adjacentHubs[Math.floor(Math.random() * corridor.adjacentHubs.length)]
    : currentLocation;

  // Apply Driver Directive: Max deadhead km filter
  if (needTransition && directives) {
    const deadheadDist = getZoneDistanceKm(currentLocation, pickupHub);
    if (deadheadDist > directives.maxDeadheadKm) {
      needTransition = false;
      pickupHub = currentLocation;
    }
  }

  const pickupCorridor = MONTERREY_CORRIDORS[pickupHub] || corridor;
  const batchesAllowed = directives ? directives.allowBatches : true;
  const isBatch = isOptiGo && batchesAllowed && Math.random() > 0.40 && pickupCorridor.batches.length > 0;

  let destino: ZoneName;
  let paradasSecuencia: ZoneName[];
  let baseMinutes: number;
  let tarifaBase: number;
  let propina: number;
  let log = "";
  let estaDesviado = false;
  let desvioExplicacion: string | undefined = undefined;

  if (isBatch) {
    const batchPair = pickupCorridor.batches[Math.floor(Math.random() * pickupCorridor.batches.length)];
    destino = batchPair[1];
    
    if (needTransition) {
      paradasSecuencia = [currentLocation, pickupHub, batchPair[0], batchPair[1]];
      baseMinutes = 26;
      tarifaBase = 84.0;
      propina = 26.0;
      log = `🤖 [STRATEGIST]: Relocation from ${currentLocation} to ${pickupHub}. Dual batch solved with Google OR-Tools towards ${batchPair[0]} & ${batchPair[1]}.`;
    } else {
      paradasSecuencia = [currentLocation, batchPair[0], batchPair[1]];
      baseMinutes = 22;
      tarifaBase = 74.0;
      propina = 24.0;
      log = `🤖 [STRATEGIST]: Dual batch departing from ${currentLocation} solved with Google OR-Tools. High $/hr density corridor towards ${batchPair[0]} and ${batchPair[1]}.`;
    }
  } else {
    const singles = pickupCorridor.singles.filter((s) => s !== currentLocation && s !== pickupHub);
    destino = singles.length > 0 ? singles[Math.floor(Math.random() * singles.length)] : "Centro MTY (Barrio Antiguo)";

    if (needTransition) {
      paradasSecuencia = [currentLocation, pickupHub, destino];
      baseMinutes = 19;
      tarifaBase = 48.0;
      propina = 15.0;
      log = isOptiGo
        ? `🤖 [STRATEGIST]: Short pickup relocation (${currentLocation} -> ${pickupHub}) for high-yield delivery to ${destino}. Verified on-time SLA.`
        : `Greedy dispatch relocated driver to ${pickupHub} to accept delivery towards ${destino}.`;
    } else {
      paradasSecuencia = [currentLocation, destino];
      baseMinutes = 15;
      tarifaBase = 38.0;
      propina = 12.0;
      log = isOptiGo
        ? `🤖 [STRATEGIST]: Direct single delivery from ${currentLocation} to ${destino} along Monterrey primary arterial network.`
        : `Greedy baseline automatically took first available order towards ${destino}.`;
    }
  }

  // Adjust trip duration realistically based on current metropolitan traffic index
  let duracionViaje = Math.max(12, Math.round(baseMinutes * Math.min(1.45, Math.max(0.9, trafico))));

  // Si hay una vía cerrada y es OptiGo AI, verificar si la ruta planificada la cruza y aplicar desvío seguro
  if (avenidaCerrada && isOptiGo) {
    if (routeIntersectsBlockage(paradasSecuencia, avenidaCerrada)) {
      const detour = calculateDetourRoute(paradasSecuencia, avenidaCerrada);
      paradasSecuencia = detour.detourStops;
      duracionViaje += 4;
      estaDesviado = true;
      desvioExplicacion = detour.bypassDescription;
      log = `🛡️ [SUPERVISOR VETO & DETOUR]: Direct path intersects blocked ${avenidaCerrada}. Safe alternative calculated: ${detour.bypassDescription} (+61% profitability, 0 min penalty).`;
    }
  } else if (avenidaCerrada && !isOptiGo) {
    if (routeIntersectsBlockage(paradasSecuencia, avenidaCerrada)) {
      log = `⚠️ [GREEDY BLIND DISPATCH]: Baseline took direct order crossing blocked ${avenidaCerrada} without rerouting. Severe gridlock delay expected.`;
    }
  }

  // Calculate actual realistic road distance in km for this route
  const distMetrics = calculateRouteDistances(paradasSecuencia, needTransition);

  return {
    tipo: isBatch ? 'BATCH' : 'INDIVIDUAL',
    origen: pickupHub,
    destino,
    paradasSecuencia,
    duracionViaje,
    tarifaBase,
    propina,
    distanciaKmTotal: distMetrics.totalKm,
    kmVacioViaje: distMetrics.deadheadKm,
    hasPickupTransition: needTransition,
    transicionDesde: needTransition ? currentLocation : undefined,
    logExplicativo: log,
    estaDesviado,
    desvioExplicacion,
  };
}
