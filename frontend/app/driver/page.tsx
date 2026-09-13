'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Car } from 'lucide-react';
import DriverHeader from '@/app/ui/Components/Driver/DriverHeader';
import WeatherAlertBanner from '@/app/ui/Components/Driver/WeatherAlertBanner';
import DriverEarningsCard from '@/app/ui/Components/Driver/DriverEarningsCard';
import ActiveOrderCard from '@/app/ui/Components/Driver/ActiveOrderCard';
import ShiftSummaryModal from '@/app/ui/Components/Driver/ShiftSummaryModal';
import { 
  ActiveShiftState, 
  MONTERREY_NODES 
} from '@/app/ui/Components/Driver/types';
import { 
  buildFullStreetSequence, 
  getNextOrderPlan, 
  routeIntersectsBlockage, 
  calculateDetourRoute 
} from '@/app/ui/Components/Driver/streetRouting';

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

const createInitialState = (tipo: 'OPTIGO_AI' | 'GREEDY'): ActiveShiftState => ({
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

  clima: "☀️ EXTREME_HEAT (39°C)",
  temperatura: 39,
  factorTrafico: 1.10,
  factorSurge: 1.0,
  avenidaCerrada: null,
  zonasAfectadas: [],

  ordenActiva: null,
});

/**
 * Pure function to advance any simulation state forward by N minutes
 * Handles weather, road closures, detours, street navigation, order fulfillment, and metrics
 */
function advanceSimulation(prev: ActiveShiftState, minutosAvance: number = 1): ActiveShiftState {
  if (prev.estadoTurno === 'FINALIZADO') return prev;

  const nuevoMinuto = Math.min(prev.minuto + minutosAvance, prev.duracionTotal);
  const isFinished = nuevoMinuto >= prev.duracionTotal;

  // Simulated weather events
  let clima = prev.clima;
  let temp = prev.temperatura;
  let trafico = 1.15;
  let surge = 1.0;
  let avenidaCerrada = prev.avenidaCerrada;
  let zonasAfectadas = prev.zonasAfectadas;

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

  // Road closure on Gonzalitos during the storm
  if (nuevoMinuto >= 45 && nuevoMinuto <= 80) {
    avenidaCerrada = "Av. Gonzalitos";
    zonasAfectadas = ["San Nicolás", "Valle Oriente (San Pedro)", "Centrito Valle (San Pedro)"];
  } else {
    avenidaCerrada = null;
    zonasAfectadas = [];
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
  // Independent active state for each agent
  const [activeTab, setActiveTab] = useState<'OPTIGO_AI' | 'GREEDY'>('OPTIGO_AI');
  const [optigoState, setOptigoState] = useState<ActiveShiftState>(() => createInitialState('OPTIGO_AI'));
  const [greedyState, setGreedyState] = useState<ActiveShiftState>(() => createInitialState('GREEDY'));

  // Dual play states allowing parallel concurrent runs
  const [isOptigoPlaying, setIsOptigoPlaying] = useState<boolean>(false);
  const [isGreedyPlaying, setIsGreedyPlaying] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Independent timers
  const optigoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greedyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // OptiGo AI auto-run interval
  useEffect(() => {
    if (isOptigoPlaying) {
      optigoTimerRef.current = setInterval(() => {
        setOptigoState((prev) => {
          const next = advanceSimulation(prev, 1);
          if (next.estadoTurno === 'FINALIZADO') {
            setIsOptigoPlaying(false);
          }
          return next;
        });
      }, 600);
    } else if (optigoTimerRef.current) {
      clearInterval(optigoTimerRef.current);
      optigoTimerRef.current = null;
    }

    return () => {
      if (optigoTimerRef.current) clearInterval(optigoTimerRef.current);
    };
  }, [isOptigoPlaying]);

  // Greedy Base auto-run interval
  useEffect(() => {
    if (isGreedyPlaying) {
      greedyTimerRef.current = setInterval(() => {
        setGreedyState((prev) => {
          const next = advanceSimulation(prev, 1);
          if (next.estadoTurno === 'FINALIZADO') {
            setIsGreedyPlaying(false);
          }
          return next;
        });
      }, 600);
    } else if (greedyTimerRef.current) {
      clearInterval(greedyTimerRef.current);
      greedyTimerRef.current = null;
    }

    return () => {
      if (greedyTimerRef.current) clearInterval(greedyTimerRef.current);
    };
  }, [isGreedyPlaying]);


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
    if (activeTab === 'OPTIGO_AI') {
      setOptigoState((prev) => advanceSimulation(prev, mins));
    } else {
      setGreedyState((prev) => advanceSimulation(prev, mins));
    }
  };

  const handleResetShift = () => {
    if (activeTab === 'OPTIGO_AI') {
      setIsOptigoPlaying(false);
      hasShownOptigoSummary.current = false;
      setOptigoState(createInitialState('OPTIGO_AI'));
    } else {
      setIsGreedyPlaying(false);
      hasShownGreedySummary.current = false;
      setGreedyState(createInitialState('GREEDY'));
    }
    setIsSummaryOpen(false);
  };

  const handleEndShift = () => {
    if (activeTab === 'OPTIGO_AI') {
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
      />

      {/* Weather Alert and Roadblock Banner */}
      <WeatherAlertBanner shiftState={currentShiftState} />

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
    </div>
  );
}
