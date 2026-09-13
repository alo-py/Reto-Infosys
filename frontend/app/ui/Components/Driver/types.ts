export interface LocationCoord {
  lat: number;
  lng: number;
}

export type ZoneName =
  | "Tec de Monterrey (Garza Sada)"
  | "Centro MTY (Barrio Antiguo)"
  | "Centrito Valle (San Pedro)"
  | "Valle Oriente (San Pedro)"
  | "San Jerónimo"
  | "Cumbres"
  | "San Nicolás"
  | "Apodaca (Industrial)"
  | "Santa Catarina";

export interface ZoneNode {
  name: ZoneName;
  coords: LocationCoord;
  type: 'hub' | 'delivery' | 'base';
}

export interface OrderItem {
  id: number;
  restaurantZone: ZoneName;
  deliveryZone: ZoneName;
  prepTimeMin: number;
  baseFee: number;
  tip: number;
  surgeFactor: number;
  finalFee: number;
  deadlineMinute: number;
  arrivalMinute: number;
  distanceKm: number;
  tripTimeMin: number;
}

export interface DriverDirectives {
  autonomyMode: 'AUTONOMOUS' | 'COPILOT';
  allowBatches: boolean;
  maxDeadheadKm: number;
  avoidFloodedAvenues: boolean;
}

export const DEFAULT_DRIVER_DIRECTIVES: DriverDirectives = {
  autonomyMode: 'AUTONOMOUS',
  allowBatches: true,
  maxDeadheadKm: 6.0,
  avoidFloodedAvenues: true,
};

export interface ActiveShiftState {
  minuto: number;
  duracionTotal: number;
  estadoTurno: 'EN_CURSO' | 'PAUSADO' | 'FINALIZADO';
  estadoConexion: 'DISPONIBLE' | 'OFERTA_ENTRANTE' | 'EN_CAMINO_PICKUP' | 'EN_ESPERA_RESTAURANTE' | 'EN_CAMINO_DELIVERY' | 'DESCONECTADO';
  tipoAgente: 'OPTIGO_AI' | 'GREEDY';
  ubicacionActual: ZoneName;
  coordenadasActuales: LocationCoord;
  
  // Métricas Financieras
  gananciaNeta: number;
  ingresosBrutos: number;
  gastoGasolina: number;
  penalizacionesSla: number;
  pedidosCompletados: number;
  batchesRealizados: number;
  pedidosConRetraso: number;
  kmTotales: number;
  kmVacio: number;

  // Clima y Vías
  clima: string;
  temperatura: number;
  factorTrafico: number;
  factorSurge: number;
  avenidaCerrada: string | null;
  zonasAfectadas: string[];

  // Dynamic Simulation Timing & Incentives
  disponibleEnMinuto?: number;
  bonoDesbloqueado?: boolean;

  // Driver Policy Directives & Co-Pilot
  directives: DriverDirectives;

  // Oferta entrante en espera de decisión (Co-Pilot Mode)
  ofertaPendiente?: {
    tipo: 'INDIVIDUAL' | 'BATCH';
    origen: ZoneName;
    destino: ZoneName;
    paradasSecuencia: ZoneName[];
    duracionViaje: number;
    tarifaTotal: number;
    propinaTotal: number;
    distanciaKmTotal: number;
    kmVacioViaje: number;
    hasPickupTransition: boolean;
    transicionDesde?: ZoneName;
    logExplicativo: string;
    recomendacionIA: 'ACEPTAR' | 'RECHAZAR';
    motivoIA: string;
    rentabilidadEstimadaHr: number;
  } | null;

  // Orden activa o batch en ejecución
  ordenActiva: {
    tipo: 'INDIVIDUAL' | 'BATCH';
    pedidos: OrderItem[];
    origen: ZoneName;
    destino: ZoneName;
    paradasSecuencia: ZoneName[];
    minutoInicioViaje: number;
    minutoFinViaje: number;
    tarifaTotal: number;
    propinaTotal: number;
    distanciaKmTotal?: number;
    kmVacioViaje?: number;
    logExplicativo: string;
    agenteRazonamiento?: string;
    hasPickupTransition?: boolean;
    transicionDesde?: ZoneName;
    faseActual?: 'TRANSICION_PICKUP' | 'ENTREGA';
    streetPath?: [number, number][];
    estaDesviado?: boolean;
    desvioExplicacion?: string;
    indiceTramoActual: number;
    tramoActualOrigen: ZoneName;
    tramoActualDestino: ZoneName;
  } | null;
}

export const MONTERREY_NODES: Record<ZoneName, LocationCoord> = {
  "Tec de Monterrey (Garza Sada)": { lat: 25.6514, lng: -100.2895 },
  "Centro MTY (Barrio Antiguo)": { lat: 25.6693, lng: -100.3099 },
  "Centrito Valle (San Pedro)": { lat: 25.6572, lng: -100.3662 },
  "Valle Oriente (San Pedro)": { lat: 25.6420, lng: -100.3160 },
  "San Jerónimo": { lat: 25.6725, lng: -100.3551 },
  "Cumbres": { lat: 25.7225, lng: -100.3860 },
  "San Nicolás": { lat: 25.7480, lng: -100.2850 },
  "Apodaca (Industrial)": { lat: 25.7808, lng: -100.1873 },
  "Santa Catarina": { lat: 25.6750, lng: -100.4639 },
};

export const MONTERREY_AVENUES: Record<string, [number, number][]> = {
  "Av. Constitución": [
    [25.6660, -100.3600],
    [25.6680, -100.3300],
    [25.6693, -100.3099],
    [25.6670, -100.2800],
  ],
  "Av. Gonzalitos": [
    [25.7100, -100.3420],
    [25.6880, -100.3480],
    [25.6725, -100.3551],
    [25.6580, -100.3600],
  ],
  "Av. Morones Prieto": [
    [25.6610, -100.3680],
    [25.6630, -100.3320],
    [25.6645, -100.3080],
    [25.6620, -100.2780],
  ],
  "Blvd. Díaz Ordaz": [
    [25.6750, -100.4639],
    [25.6720, -100.4100],
    [25.6710, -100.3700],
    [25.6725, -100.3551],
  ]
};
