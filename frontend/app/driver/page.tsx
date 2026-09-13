'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Car } from 'lucide-react';
import DriverHeader from '@/app/ui/Components/Driver/DriverHeader';
import WeatherAlertBanner from '@/app/ui/Components/Driver/WeatherAlertBanner';
import DriverEarningsCard from '@/app/ui/Components/Driver/DriverEarningsCard';
import ActiveOrderCard from '@/app/ui/Components/Driver/ActiveOrderCard';
import ShiftSummaryModal from '@/app/ui/Components/Driver/ShiftSummaryModal';
import ScenarioSelectorModal from '@/app/ui/Components/Driver/ScenarioSelectorModal';
import { 
  ActiveShiftState, 
  MONTERREY_NODES,
  ZoneName 
} from '@/app/ui/Components/Driver/types';
import { 
  buildFullStreetSequence, 
  getNextOrderPlan, 
  routeIntersectsBlockage, 
  calculateDetourRoute 
} from '@/app/ui/Components/Driver/streetRouting';
import { 
  ShiftScenarioConfig, 
  DEFAULT_MONTERREY_SCENARIO, 
  getAvenueAffectedZones 
} from '@/app/ui/Components/Driver/scenarios';
import { 
  checkBackendHealth, 
  startBackendShift, 
  stepBackendShift, 
  endBackendShift 
} from '@/app/services/api';

// Dynamic loading of Leaflet with SSR disabled
const DriverMap = dynamic(
  () => import('@/app/ui/Components/Driver/DriverMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-3xl bg-slate-950/80 border border-white/20 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-emerald-300">Loading Monterrey road network...</p>
      </div>
    )
  }
);

/**
 * Creates the initial shift state for a given agent and scenario
 */
const createInitialState = (
  tipo: 'OPTIGO_AI' | 'GREEDY',
  scenario: ShiftScenarioConfig = DEFAULT_MONTERREY_SCENARIO
): ActiveShiftState => {
  let clima = "☀️ EXTREME_HEAT (39°C)";
  let temp = 39;
  let trafico = 1.10;
  let surge = 1.0;
  let avenidaCerrada: string | null = null;
  let zonasAfectadas: string[] = [];

  if (scenario.id !== 'DEFAULT_MTY' && scenario.weather !== 'DEFAULT_DYNAMIC') {
    switch (scenario.weather) {
      case 'EXTREME_HEAT':
        clima = "☀️ EXTREME_HEAT (41°C)";
        temp = 41;
        break;
      case 'SEVERE_STORM':
        clima = "🌧️ SEVERE_STORM (Flooding risk)";
        temp = 25;
        break;
      case 'LIGHT_RAIN':
        clima = "🌦️ LIGHT_RAIN";
        temp = 28;
        break;
      case 'CLEAR_SUNNY':
      default:
        clima = "🌤️ CLEAR & SUNNY (24°C)";
        temp = 24;
        break;
    }

    trafico = scenario.traffic === 'SEVERE' ? 1.75 : scenario.traffic === 'MODERATE' ? 1.35 : 1.05;
    surge = scenario.surgeMultiplier;
    avenidaCerrada = scenario.roadClosure === 'NONE' ? null : scenario.roadClosure;
    zonasAfectadas = avenidaCerrada ? getAvenueAffectedZones(scenario.roadClosure) : [];
  }

  return {
    minuto: 0,
    duracionTotal: 120,
    estadoTurno: 'EN_CURSO',
    estadoConexion: 'DISPONIBLE',
    tipoAgente: tipo,
    ubicacionActual: "Centro MTY (Barrio Antiguo)",
    coordenadasActuales: MONTERREY_NODES["Centro MTY (Barrio Antiguo)"],

    gananciaNeta: 0.0,
    ingresosBrutos: 0.0,
    gastoGasolina: 0.0,
    penalizacionesSla: 0.0,
    pedidosCompletados: 0,
    batchesRealizados: 0,
    pedidosConRetraso: 0,
    kmTotales: 0.0,
    kmVacio: 0.0,

    clima,
    temperatura: temp,
    factorTrafico: trafico,
    factorSurge: surge,
    avenidaCerrada,
    zonasAfectadas,

    ordenActiva: null,
  };
};

/**
 * Pure function to advance any simulation state forward by N minutes
 * Dynamically computes weather, traffic, road closures, detours, street navigation, and order fulfillment
 */
function advanceSimulation(
  prev: ActiveShiftState, 
  scenario: ShiftScenarioConfig, 
  minutosAvance: number = 1
): ActiveShiftState {
  if (prev.estadoTurno === 'FINALIZADO') return prev;

  const nuevoMinuto = Math.min(prev.minuto + minutosAvance, prev.duracionTotal);
  const isFinished = nuevoMinuto >= prev.duracionTotal;

  // Derive environment and road conditions based on active scenario
  let clima: string;
  let temp: number;
  let trafico: number;
  let surge: number;
  let avenidaCerrada: string | null;
  let zonasAfectadas: string[];

  if (scenario.id === 'DEFAULT_MTY' || scenario.weather === 'DEFAULT_DYNAMIC') {
    // Average Monterrey day dynamic cycle: extreme heat -> afternoon storm -> light rain
    if (nuevoMinuto >= 35 && nuevoMinuto <= 75) {
      clima = "🌧️ SEVERE_STORM (Flooding risk)";
      temp = 26;
      trafico = 1.65;
      surge = 1.55;
    } else if (nuevoMinuto > 75) {
      clima = "🌦️ LIGHT_RAIN";
      temp = 29;
      trafico = 1.25;
      surge = 1.20;
    } else {
      clima = "☀️ EXTREME_HEAT (40°C)";
      temp = 40;
      trafico = nuevoMinuto >= 40 ? 1.25 : 1.10;
      surge = 1.0;
    }

    // Dynamic Road closure on Gonzalitos during storm
    if (nuevoMinuto >= 45 && nuevoMinuto <= 80) {
      avenidaCerrada = "Av. Gonzalitos";
      zonasAfectadas = getAvenueAffectedZones("Av. Gonzalitos");
    } else {
      avenidaCerrada = null;
      zonasAfectadas = [];
    }
  } else {
    // Preset or custom customized shift events
    switch (scenario.weather) {
      case 'EXTREME_HEAT':
        clima = "☀️ EXTREME_HEAT (41°C)";
        temp = 41;
        break;
      case 'SEVERE_STORM':
        clima = "🌧️ SEVERE_STORM (Flooding risk)";
        temp = 25;
        break;
      case 'LIGHT_RAIN':
        clima = "🌦️ LIGHT_RAIN";
        temp = 28;
        break;
      case 'CLEAR_SUNNY':
      default:
        clima = "🌤️ CLEAR & SUNNY (24°C)";
        temp = 24;
        break;
    }

    switch (scenario.traffic) {
      case 'SEVERE':
        trafico = 1.75;
        break;
      case 'MODERATE':
        trafico = 1.35;
        break;
      case 'NORMAL':
      default:
        trafico = 1.05;
        break;
    }

    surge = scenario.surgeMultiplier;
    avenidaCerrada = scenario.roadClosure === 'NONE' ? null : scenario.roadClosure;
    zonasAfectadas = avenidaCerrada ? getAvenueAffectedZones(scenario.roadClosure) : [];
  }

  let ordenActiva = prev.ordenActiva;
  let gananciaNeta = prev.gananciaNeta;
  let ingresosBrutos = prev.ingresosBrutos;
  let gastoGasolina = prev.gastoGasolina;
  let penalizacionesSla = prev.penalizacionesSla;
  let pedidosCompletados = prev.pedidosCompletados;
  let batchesRealizados = prev.batchesRealizados;
  let pedidosConRetraso = prev.pedidosConRetraso;
  let kmTotales = prev.kmTotales;
  let kmVacio = prev.kmVacio;
  let ubicacionActual = prev.ubicacionActual;
  let coordenadasActuales = prev.coordenadasActuales;
  let estadoConexion = prev.estadoConexion;

  // Check if active order completes
  if (ordenActiva && nuevoMinuto >= ordenActiva.minutoFinViaje) {
    ubicacionActual = ordenActiva.destino;
    coordenadasActuales = MONTERREY_NODES[ubicacionActual] || coordenadasActuales;
    estadoConexion = 'DISPONIBLE';

    const pedidosEnViaje = ordenActiva.tipo === 'BATCH' ? 2 : 1;
    pedidosCompletados += pedidosEnViaje;
    if (ordenActiva.tipo === 'BATCH') {
      batchesRealizados += 1;
    }

    const tarifaGarantizada = ordenActiva.tarifaTotal;
    const kmViaje = ordenActiva.tipo === 'BATCH' ? 14.5 : 8.2;
    const costoGas = Number((kmViaje * 0.90).toFixed(2));

    // If Greedy agent crossed during road closure without detour, apply penalty
    let multa = 0;
    if (prev.tipoAgente === 'GREEDY' && avenidaCerrada) {
      multa = 22.50;
      pedidosConRetraso += 1;
      penalizacionesSla += multa;
    }

    const neto = Number((tarifaGarantizada - costoGas - multa).toFixed(2));
    ingresosBrutos += tarifaGarantizada;
    gastoGasolina += costoGas;
    gananciaNeta += neto;
    kmTotales += kmViaje;

    ordenActiva = null;
  } else if (ordenActiva && nuevoMinuto < ordenActiva.minutoFinViaje) {
    // Road incident detection and dynamic detour reroute mid-journey
    if (avenidaCerrada && !ordenActiva.estaDesviado) {
      const crossesBlock = routeIntersectsBlockage(ordenActiva.paradasSecuencia, avenidaCerrada);
      if (crossesBlock) {
        if (prev.tipoAgente === 'OPTIGO_AI') {
          // OptiGo AI: Supervisor recalculates detour in real time
          const detour = calculateDetourRoute([ubicacionActual, ordenActiva.destino], avenidaCerrada);
          const detourPath = buildFullStreetSequence(detour.detourStops);
          if (detourPath.length >= 2) {
            ordenActiva = {
              ...ordenActiva,
              paradasSecuencia: detour.detourStops,
              streetPath: detourPath,
              minutoInicioViaje: nuevoMinuto,
              minutoFinViaje: nuevoMinuto + 14,
              estaDesviado: true,
              desvioExplicacion: detour.bypassDescription,
              hasPickupTransition: false,
              faseActual: 'ENTREGA',
              indiceTramoActual: 0,
              tramoActualOrigen: detour.detourStops[0],
              tramoActualDestino: detour.detourStops[1],
              logExplicativo: `🛡️ [SUPERVISOR DYNAMIC REROUTE]: Road closure detected on ${avenidaCerrada}! Real-time detour activated: ${detour.bypassDescription}. Avoiding +25 min delay!`,
            };
          }
        } else {
          // Greedy baseline: ignores road closure and gets caught in gridlock
          ordenActiva = {
            ...ordenActiva,
            logExplicativo: `⚠️ [GREEDY BLIND PATH]: Driver proceeding directly into blocked ${avenidaCerrada} without detour! Experiencing severe gridlock delay and SLA penalties.`,
          };
        }
      }
    }

    // Continuous dynamic displacement along Monterrey streets
    const duracion = Math.max(1, ordenActiva.minutoFinViaje - ordenActiva.minutoInicioViaje);
    const transcurrido = Math.max(0, nuevoMinuto - ordenActiva.minutoInicioViaje);
    const ratio = Math.min(1.0, transcurrido / duracion);

    // Compute active stop leg
    const paradas = ordenActiva.paradasSecuencia;
    const totalTramos = Math.max(1, paradas.length - 1);
    const indiceTramoActual = Math.min(Math.floor(ratio * totalTramos), totalTramos - 1);
    const tramoActualOrigen = paradas[indiceTramoActual];
    const tramoActualDestino = paradas[indiceTramoActual + 1];

    // Update connection status
    const isTransition = ordenActiva.hasPickupTransition && indiceTramoActual === 0;
    const faseActual = isTransition ? 'TRANSICION_PICKUP' : 'ENTREGA';
    estadoConexion = isTransition ? 'EN_CAMINO_PICKUP' : 'EN_CAMINO_DELIVERY';

    ordenActiva = {
      ...ordenActiva,
      indiceTramoActual,
      tramoActualOrigen,
      tramoActualDestino,
      faseActual,
    };

    const streetPath = ordenActiva.streetPath || buildFullStreetSequence(ordenActiva.paradasSecuencia);

    if (streetPath.length >= 2) {
      const numSegmentos = streetPath.length - 1;
      const posEscalada = ratio * numSegmentos;
      const idxSeg = Math.min(Math.floor(posEscalada), numSegmentos - 1);
      const tSeg = posEscalada - idxSeg;

      const pA = streetPath[idxSeg];
      const pB = streetPath[idxSeg + 1];
      if (pA && pB) {
        coordenadasActuales = {
          lat: Number((pA[0] + (pB[0] - pA[0]) * tSeg).toFixed(5)),
          lng: Number((pA[1] + (pB[1] - pA[1]) * tSeg).toFixed(5)),
        };
      }
    }
  }

  // Assign new order if driver is idle and shift not finished
  if (!ordenActiva && !isFinished) {
    const plan = getNextOrderPlan(
      ubicacionActual,
      prev.tipoAgente === 'OPTIGO_AI',
      surge,
      avenidaCerrada
    );
    const streetPath = buildFullStreetSequence(plan.paradasSecuencia);
    const tarifaTotal = Number(((plan.tarifaBase * surge) + plan.propina).toFixed(2));
    const paradas = plan.paradasSecuencia;
    const tramoActualOrigen = paradas[0];
    const tramoActualDestino = paradas[1];

    ordenActiva = {
      tipo: plan.tipo,
      pedidos: [],
      origen: plan.origen,
      destino: plan.destino,
      paradasSecuencia: plan.paradasSecuencia,
      minutoInicioViaje: nuevoMinuto,
      minutoFinViaje: nuevoMinuto + plan.duracionViaje,
      tarifaTotal,
      propinaTotal: plan.propina,
      logExplicativo: plan.logExplicativo,
      hasPickupTransition: plan.hasPickupTransition,
      transicionDesde: plan.transicionDesde,
      faseActual: plan.hasPickupTransition ? 'TRANSICION_PICKUP' : 'ENTREGA',
      streetPath,
      estaDesviado: plan.estaDesviado,
      desvioExplicacion: plan.desvioExplicacion,
      indiceTramoActual: 0,
      tramoActualOrigen,
      tramoActualDestino,
    };

    estadoConexion = plan.hasPickupTransition ? 'EN_CAMINO_PICKUP' : 'EN_CAMINO_DELIVERY';
  }

  return {
    ...prev,
    minuto: nuevoMinuto,
    estadoTurno: isFinished ? 'FINALIZADO' : 'EN_CURSO',
    estadoConexion: isFinished ? 'DESCONECTADO' : estadoConexion,
    clima,
    temperatura: temp,
    factorTrafico: trafico,
    factorSurge: surge,
    avenidaCerrada,
    zonasAfectadas,
    ubicacionActual,
    coordenadasActuales,
    ordenActiva,
    gananciaNeta: Number(gananciaNeta.toFixed(2)),
    ingresosBrutos: Number(ingresosBrutos.toFixed(2)),
    gastoGasolina: Number(gastoGasolina.toFixed(2)),
    penalizacionesSla: Number(penalizacionesSla.toFixed(2)),
    pedidosCompletados,
    batchesRealizados,
    pedidosConRetraso,
    kmTotales: Number(kmTotales.toFixed(1)),
    kmVacio: Number(kmVacio.toFixed(1)),
  };
}

export default function DriverAppPage() {
  // Configurable Scenario & Shift Events
  const [scenario, setScenario] = useState<ShiftScenarioConfig>(DEFAULT_MONTERREY_SCENARIO);
  const scenarioRef = useRef<ShiftScenarioConfig>(scenario);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Backend Integration State
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const optigoBackendIdRef = useRef<string | null>(null);
  const greedyBackendIdRef = useRef<string | null>(null);

  // Independent active state for each agent
  const [activeTab, setActiveTab] = useState<'OPTIGO_AI' | 'GREEDY'>('OPTIGO_AI');
  const [optigoState, setOptigoState] = useState<ActiveShiftState>(() => createInitialState('OPTIGO_AI', DEFAULT_MONTERREY_SCENARIO));
  const [greedyState, setGreedyState] = useState<ActiveShiftState>(() => createInitialState('GREEDY', DEFAULT_MONTERREY_SCENARIO));

  // Dual play states allowing parallel concurrent runs
  const [isOptigoPlaying, setIsOptigoPlaying] = useState<boolean>(false);
  const [isGreedyPlaying, setIsGreedyPlaying] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Independent timers & concurrency locks
  const optigoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greedyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOptigoSteppingRef = useRef<boolean>(false);
  const isGreedySteppingRef = useRef<boolean>(false);

  // Check Django backend connectivity on load and every 15s
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const alive = await checkBackendHealth();
      if (isMounted) setIsBackendConnected(alive);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Tracking if summary pop-up was already displayed for each agent
  const hasShownOptigoSummary = useRef<boolean>(false);
  const hasShownGreedySummary = useRef<boolean>(false);

  // Auto-show summary popup the FIRST time a completed simulation (timer at 0) is viewed
  useEffect(() => {
    if (activeTab === 'OPTIGO_AI' && optigoState.estadoTurno === 'FINALIZADO' && !hasShownOptigoSummary.current) {
      hasShownOptigoSummary.current = true;
      setIsSummaryOpen(true);
    } else if (activeTab === 'GREEDY' && greedyState.estadoTurno === 'FINALIZADO' && !hasShownGreedySummary.current) {
      hasShownGreedySummary.current = true;
      setIsSummaryOpen(true);
    }
  }, [activeTab, optigoState.estadoTurno, greedyState.estadoTurno]);

  // Current states based on active tab
  const currentShiftState = activeTab === 'OPTIGO_AI' ? optigoState : greedyState;
  const otherShiftState = activeTab === 'OPTIGO_AI' ? greedyState : optigoState;
  const isCurrentPlaying = activeTab === 'OPTIGO_AI' ? isOptigoPlaying : isGreedyPlaying;

  // Real-time step execution supporting both live Django backend and client engine fallback
  const stepSimulation = useCallback(async (tipo: 'OPTIGO_AI' | 'GREEDY', mins: number = 1) => {
    const isOptigo = tipo === 'OPTIGO_AI';
    const lockRef = isOptigo ? isOptigoSteppingRef : isGreedySteppingRef;

    // Prevent race conditions and overlapping network requests
    if (lockRef.current) return;
    lockRef.current = true;

    const backendIdRef = isOptigo ? optigoBackendIdRef : greedyBackendIdRef;
    const setShift = isOptigo ? setOptigoState : setGreedyState;
    const setIsPlaying = isOptigo ? setIsOptigoPlaying : setIsGreedyPlaying;

    try {
      if (isBackendConnected) {
        try {
          // If not started on Django backend yet, create the shift in PostgreSQL/SQLite
          if (!backendIdRef.current) {
            const created = await startBackendShift(tipo, 120);
            backendIdRef.current = created.id;
          }

        // Advance simulation on Django (runs OR-Tools, OSMnx, Kaggle, PostgreSQL)
        const stepRes = await stepBackendShift(backendIdRef.current, mins);
        const progreso = stepRes.progreso;
        const turno = stepRes.turno;
        const env = turno.ultimo_estado_entorno;

        setShift((prev) => {
          if (prev.estadoTurno === 'FINALIZADO') return prev;
          const isFinished = progreso.estado_turno === 'FINALIZADO' || progreso.minuto_actual >= prev.duracionTotal;
          if (isFinished) setIsPlaying(false);

          let ubicacionActual = prev.ubicacionActual;
          if (progreso.ubicacion_actual && MONTERREY_NODES[progreso.ubicacion_actual as ZoneName]) {
            ubicacionActual = progreso.ubicacion_actual as ZoneName;
          }

          let logExplicativo = prev.ordenActiva?.logExplicativo || '';
          if (progreso.decisiones_en_este_paso && progreso.decisiones_en_este_paso.length > 0) {
            logExplicativo = progreso.decisiones_en_este_paso[progreso.decisiones_en_este_paso.length - 1].log;
          }

          let ordenActiva = prev.ordenActiva;
          let coordenadasActuales = MONTERREY_NODES[ubicacionActual] || prev.coordenadasActuales;

          const duracion = Math.max(1, (ordenActiva?.minutoFinViaje || 15) - (ordenActiva?.minutoInicioViaje || 0));
          const transcurrido = Math.max(0, progreso.minuto_actual - (ordenActiva?.minutoInicioViaje || 0));
          const ratio = Math.min(1.0, transcurrido / duracion);

          if (ordenActiva) {
            const streetPath = ordenActiva.streetPath || buildFullStreetSequence(ordenActiva.paradasSecuencia);
            if (streetPath.length >= 2) {
              const numSegs = streetPath.length - 1;
              const scaled = ratio * numSegs;
              const idxSeg = Math.min(Math.floor(scaled), numSegs - 1);
              const tSeg = scaled - idxSeg;
              const pA = streetPath[idxSeg];
              const pB = streetPath[idxSeg + 1];
              if (pA && pB) {
                coordenadasActuales = {
                  lat: Number((pA[0] + (pB[0] - pA[0]) * tSeg).toFixed(5)),
                  lng: Number((pA[1] + (pB[1] - pA[1]) * tSeg).toFixed(5)),
                };
              }
            }

            if (progreso.minuto_actual >= ordenActiva.minutoFinViaje) {
              ordenActiva = null;
            }
          }

          if (!ordenActiva && !isFinished) {
            const plan = getNextOrderPlan(
              ubicacionActual,
              tipo === 'OPTIGO_AI',
              env?.factor_surge || 1.0,
              env?.avenida_cerrada || null
            );
            const streetPath = buildFullStreetSequence(plan.paradasSecuencia);
            ordenActiva = {
              tipo: plan.tipo,
              pedidos: [],
              origen: plan.origen,
              destino: plan.destino,
              paradasSecuencia: plan.paradasSecuencia,
              minutoInicioViaje: progreso.minuto_actual,
              minutoFinViaje: progreso.minuto_actual + plan.duracionViaje,
              tarifaTotal: Number(((plan.tarifaBase * (env?.factor_surge || 1.0)) + plan.propina).toFixed(2)),
              propinaTotal: plan.propina,
              logExplicativo: logExplicativo || plan.logExplicativo,
              hasPickupTransition: plan.hasPickupTransition,
              transicionDesde: plan.transicionDesde,
              faseActual: plan.hasPickupTransition ? 'TRANSICION_PICKUP' : 'ENTREGA',
              streetPath,
              estaDesviado: plan.estaDesviado,
              desvioExplicacion: plan.desvioExplicacion,
              indiceTramoActual: 0,
              tramoActualOrigen: plan.paradasSecuencia[0],
              tramoActualDestino: plan.paradasSecuencia[1],
            };
          }

          return {
            ...prev,
            minuto: progreso.minuto_actual,
            estadoTurno: isFinished ? 'FINALIZADO' : 'EN_CURSO',
            estadoConexion: isFinished ? 'DESCONECTADO' : (ordenActiva?.faseActual === 'TRANSICION_PICKUP' ? 'EN_CAMINO_PICKUP' : 'EN_CAMINO_DELIVERY'),
            gananciaNeta: progreso.ganancia_neta,
            ingresosBrutos: progreso.ingresos_brutos || parseFloat(turno.ingresos_brutos || '0'),
            gastoGasolina: progreso.gasto_gasolina || parseFloat(turno.gasto_gasolina_total || '0'),
            pedidosCompletados: progreso.pedidos_completados,
            batchesRealizados: progreso.batches_realizados ?? turno.batches_realizados,
            pedidosConRetraso: progreso.pedidos_con_retraso ?? turno.pedidos_con_retraso,
            penalizacionesSla: progreso.penalizaciones_sla ?? parseFloat(turno.penalizaciones_sla_total || '0'),
            kmTotales: progreso.km_totales ?? parseFloat(turno.km_totales || '0'),
            kmVacio: progreso.km_en_vacio ?? parseFloat(turno.km_en_vacio || '0'),
            clima: env?.clima || prev.clima,
            temperatura: env?.temperatura_c ?? prev.temperatura,
            factorTrafico: env?.factor_trafico ?? prev.factorTrafico,
            factorSurge: env?.factor_surge ?? prev.factorSurge,
            avenidaCerrada: env?.avenida_cerrada ?? null,
            zonasAfectadas: env?.zonas_afectadas ?? [],
            ubicacionActual,
            coordenadasActuales,
            ordenActiva,
          };
        });

        return;
      } catch (err) {
        console.warn("Django backend call failed, using client engine fallback:", err);
      }
    }

      // Fallback: Client simulation engine
      setShift((prev) => {
        const next = advanceSimulation(prev, scenarioRef.current, mins);
        if (next.estadoTurno === 'FINALIZADO') setIsPlaying(false);
        return next;
      });
    } finally {
      lockRef.current = false;
    }
  }, [isBackendConnected]);

  // OptiGo AI auto-run interval
  useEffect(() => {
    if (isOptigoPlaying) {
      optigoTimerRef.current = setInterval(() => {
        stepSimulation('OPTIGO_AI', 1);
      }, 700);
    } else if (optigoTimerRef.current) {
      clearInterval(optigoTimerRef.current);
      optigoTimerRef.current = null;
    }

    return () => {
      if (optigoTimerRef.current) clearInterval(optigoTimerRef.current);
    };
  }, [isOptigoPlaying, stepSimulation]);

  // Greedy Base auto-run interval
  useEffect(() => {
    if (isGreedyPlaying) {
      greedyTimerRef.current = setInterval(() => {
        stepSimulation('GREEDY', 1);
      }, 700);
    } else if (greedyTimerRef.current) {
      clearInterval(greedyTimerRef.current);
      greedyTimerRef.current = null;
    }

    return () => {
      if (greedyTimerRef.current) clearInterval(greedyTimerRef.current);
    };
  }, [isGreedyPlaying, stepSimulation]);

  // Handle Scenario Application
  const handleApplyScenario = (newScenario: ShiftScenarioConfig) => {
    setScenario(newScenario);
    scenarioRef.current = newScenario;

    const applyToState = (st: ActiveShiftState): ActiveShiftState => {
      let clima = st.clima;
      let temp = st.temperatura;
      let trafico = st.factorTrafico;
      let surge = st.factorSurge;
      let avenidaCerrada = st.avenidaCerrada;
      let zonasAfectadas = st.zonasAfectadas;

      if (newScenario.id === 'DEFAULT_MTY' || newScenario.weather === 'DEFAULT_DYNAMIC') {
        if (st.minuto >= 35 && st.minuto <= 75) {
          clima = "🌧️ SEVERE_STORM (Flooding risk)";
          temp = 26;
          trafico = 1.65;
          surge = 1.55;
        } else if (st.minuto > 75) {
          clima = "🌦️ LIGHT_RAIN";
          temp = 29;
          trafico = 1.25;
          surge = 1.20;
        } else {
          clima = "☀️ EXTREME_HEAT (40°C)";
          temp = 40;
          trafico = st.minuto >= 40 ? 1.25 : 1.10;
          surge = 1.0;
        }

        if (st.minuto >= 45 && st.minuto <= 80) {
          avenidaCerrada = "Av. Gonzalitos";
          zonasAfectadas = getAvenueAffectedZones("Av. Gonzalitos");
        } else {
          avenidaCerrada = null;
          zonasAfectadas = [];
        }
      } else {
        switch (newScenario.weather) {
          case 'EXTREME_HEAT':
            clima = "☀️ EXTREME_HEAT (41°C)";
            temp = 41;
            break;
          case 'SEVERE_STORM':
            clima = "🌧️ SEVERE_STORM (Flooding risk)";
            temp = 25;
            break;
          case 'LIGHT_RAIN':
            clima = "🌦️ LIGHT_RAIN";
            temp = 28;
            break;
          case 'CLEAR_SUNNY':
          default:
            clima = "🌤️ CLEAR & SUNNY (24°C)";
            temp = 24;
            break;
        }
        trafico = newScenario.traffic === 'SEVERE' ? 1.75 : newScenario.traffic === 'MODERATE' ? 1.35 : 1.05;
        surge = newScenario.surgeMultiplier;
        avenidaCerrada = newScenario.roadClosure === 'NONE' ? null : newScenario.roadClosure;
        zonasAfectadas = avenidaCerrada ? getAvenueAffectedZones(newScenario.roadClosure) : [];
      }

      return {
        ...st,
        clima,
        temperatura: temp,
        factorTrafico: trafico,
        factorSurge: surge,
        avenidaCerrada,
        zonasAfectadas,
      };
    };

    setOptigoState(applyToState);
    setGreedyState(applyToState);
  };

  // Control handlers
  const handleTogglePlay = () => {
    if (activeTab === 'OPTIGO_AI') {
      if (optigoState.estadoTurno === 'FINALIZADO') return;
      setIsOptigoPlaying((prev) => !prev);
    } else {
      if (greedyState.estadoTurno === 'FINALIZADO') return;
      setIsGreedyPlaying((prev) => !prev);
    }
  };

  const handleStepForward = (mins: number) => {
    stepSimulation(activeTab, mins);
  };

  const handleResetShift = () => {
    if (activeTab === 'OPTIGO_AI') {
      setIsOptigoPlaying(false);
      hasShownOptigoSummary.current = false;
      optigoBackendIdRef.current = null;
      setOptigoState(createInitialState('OPTIGO_AI', scenarioRef.current));
    } else {
      setIsGreedyPlaying(false);
      hasShownGreedySummary.current = false;
      greedyBackendIdRef.current = null;
      setGreedyState(createInitialState('GREEDY', scenarioRef.current));
    }
    setIsSummaryOpen(false);
  };

  const handleEndShift = async () => {
    const isOptigo = activeTab === 'OPTIGO_AI';
    const backendId = isOptigo ? optigoBackendIdRef.current : greedyBackendIdRef.current;
    if (backendId && isBackendConnected) {
      try {
        await endBackendShift(backendId);
      } catch (e) {
        console.warn("Could not end shift on Django backend:", e);
      }
    }

    if (isOptigo) {
      setIsOptigoPlaying(false);
      hasShownOptigoSummary.current = true;
      setOptigoState((prev) => ({
        ...prev,
        estadoTurno: 'FINALIZADO',
        estadoConexion: 'DESCONECTADO',
      }));
    } else {
      setIsGreedyPlaying(false);
      hasShownGreedySummary.current = true;
      setGreedyState((prev) => ({
        ...prev,
        estadoTurno: 'FINALIZADO',
        estadoConexion: 'DESCONECTADO',
      }));
    }
    setIsSummaryOpen(true);
  };

  const handleSelectTab = (tab: 'OPTIGO_AI' | 'GREEDY', keepModalOpen: boolean = false) => {
    if (!keepModalOpen) {
      setIsSummaryOpen(false);
    } else {
      if (tab === 'OPTIGO_AI' && optigoState.estadoTurno === 'FINALIZADO') {
        hasShownOptigoSummary.current = true;
      } else if (tab === 'GREEDY' && greedyState.estadoTurno === 'FINALIZADO') {
        hasShownGreedySummary.current = true;
      }
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Back to Home Link and Title */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20 backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-slate-950/60 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
          <Car className="w-4 h-4 text-emerald-400" />
          <span>OptiGo Driver App • Monterrey Dual Sim</span>
        </div>
      </div>

      {/* Driver Control Header */}
      <DriverHeader
        activeTab={activeTab}
        shiftState={currentShiftState}
        isPlaying={isCurrentPlaying}
        isOptigoRunning={isOptigoPlaying}
        isGreedyRunning={isGreedyPlaying}
        isOptigoFinished={optigoState.estadoTurno === 'FINALIZADO'}
        isGreedyFinished={greedyState.estadoTurno === 'FINALIZADO'}
        onTogglePlay={handleTogglePlay}
        onStepForward={handleStepForward}
        onResetShift={handleResetShift}
        onEndShift={handleEndShift}
        onSelectTab={(tab) => handleSelectTab(tab, false)}
        onOpenComparison={() => setIsSummaryOpen(true)}
        currentScenario={scenario}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        isBackendConnected={isBackendConnected}
        backendShiftId={activeTab === 'OPTIGO_AI' ? optigoBackendIdRef.current : greedyBackendIdRef.current}
      />

      {/* Weather Alert and Roadblock Banner with Scenario Config */}
      <WeatherAlertBanner 
        shiftState={currentShiftState}
        currentScenario={scenario}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
      />

      {/* Main Grid: Map on left / Earnings & Active Order on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
        {/* Monterrey Interactive Map (7 Columns on Desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <DriverMap shiftState={currentShiftState} />
        </div>

        {/* Real-Time Earnings & Active Order Card (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          <DriverEarningsCard shiftState={currentShiftState} />
          <ActiveOrderCard shiftState={currentShiftState} />
        </div>
      </div>

      {/* Shift Summary & Dual-Agent Head-to-Head Comparison Modal */}
      <ShiftSummaryModal
        isOpen={isSummaryOpen}
        shiftState={currentShiftState}
        comparisonState={otherShiftState}
        activeTab={activeTab}
        onSwitchTab={(tab) => handleSelectTab(tab, true)}
        onClose={() => setIsSummaryOpen(false)}
        onRestartShift={handleResetShift}
      />

      {/* Shift Scenario & Event Selector Modal */}
      <ScenarioSelectorModal
        isOpen={isScenarioModalOpen}
        currentScenario={scenario}
        onApplyScenario={handleApplyScenario}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </div>
  );
}
