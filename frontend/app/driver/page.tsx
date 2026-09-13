'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  MONTERREY_NODES, 
  ZoneName 
} from '@/app/ui/Components/Driver/types';
import { 
  buildFullStreetSequence, 
  getNextOrderPlan, 
  routeIntersectsBlockage, 
  calculateDetourRoute 
} from '@/app/ui/Components/Driver/streetRouting';

// Carga dinámica de Leaflet con SSR desactivado para evitar errores de window
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

const ZONAS_MONTERREY: ZoneName[] = [
  "Tec de Monterrey (Garza Sada)",
  "Centro MTY (Barrio Antiguo)",
  "Centrito Valle (San Pedro)",
  "Valle Oriente (San Pedro)",
  "San Jerónimo",
  "Cumbres",
  "San Nicolás",
  "Apodaca (Industrial)",
  "Santa Catarina",
];

const ESTADO_INICIAL: ActiveShiftState = {
  minuto: 0,
  duracionTotal: 120,
  estadoTurno: 'EN_CURSO',
  estadoConexion: 'DISPONIBLE',
  tipoAgente: 'OPTIGO_AI',
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
};

export default function DriverAppPage() {
  const [shiftState, setShiftState] = useState<ActiveShiftState>(ESTADO_INICIAL);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to advance simulation by N minutes
  const stepSimulation = useCallback((minutosAvance: number = 1) => {
    setShiftState((prev) => {
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

      // Incidente vial en Gonzalitos o Constitución durante la tormenta
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

      // Verificar si la orden activa se completa
      if (ordenActiva && nuevoMinuto >= ordenActiva.minutoFinViaje) {
        // Viaje finalizado con éxito
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

        // Si es agente Greedy y cruzó en avenida cerrada sin desvío, penalizar
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
        // 🛡️ Detección de incidente vial y cálculo de desvío dinámico en pleno trayecto
        if (avenidaCerrada && !ordenActiva.estaDesviado) {
          const crossesBlock = routeIntersectsBlockage(ordenActiva.paradasSecuencia, avenidaCerrada);
          if (crossesBlock) {
            if (prev.tipoAgente === 'OPTIGO_AI') {
              // OptiGo AI: Supervisor recalcula la ruta en tiempo real hacia una vía alterna
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
                  logExplicativo: `🛡️ [SUPERVISOR DYNAMIC REROUTE]: Road closure detected on ${avenidaCerrada}! Real-time detour activated: ${detour.bypassDescription}. Avoiding +25 min delay!`,
                };
              }
            } else {
              // Greedy baseline: ignora el bloqueo olímpicamente
              ordenActiva = {
                ...ordenActiva,
                logExplicativo: `⚠️ [GREEDY BLIND PATH]: Driver proceeding directly into blocked ${avenidaCerrada} without detour! Experiencing severe gridlock delay and SLA penalties.`,
              };
            }
          }
        }

        // Desplazamiento dinámico continuo a lo largo de las calles reales de Monterrey
        const duracion = Math.max(1, ordenActiva.minutoFinViaje - ordenActiva.minutoInicioViaje);
        const transcurrido = Math.max(0, nuevoMinuto - ordenActiva.minutoInicioViaje);
        const ratio = Math.min(1.0, transcurrido / duracion);

        // Actualizar fase de conexión (Pickup Transition vs Customer Delivery)
        if (ordenActiva.hasPickupTransition && ordenActiva.paradasSecuencia.length >= 3) {
          const pickupRatioThreshold = 1 / (ordenActiva.paradasSecuencia.length - 1);
          if (ratio < pickupRatioThreshold) {
            estadoConexion = 'EN_CAMINO_PICKUP';
            ordenActiva.faseActual = 'TRANSICION_PICKUP';
          } else {
            estadoConexion = 'EN_CAMINO_DELIVERY';
            ordenActiva.faseActual = 'ENTREGA';
          }
        } else {
          estadoConexion = 'EN_CAMINO_DELIVERY';
          ordenActiva.faseActual = 'ENTREGA';
        }

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

      // Si el conductor está libre y no ha terminado el turno, asignar nueva orden
      if (!ordenActiva && !isFinished) {
        const plan = getNextOrderPlan(
          ubicacionActual,
          prev.tipoAgente === 'OPTIGO_AI',
          surge,
          avenidaCerrada
        );
        const streetPath = buildFullStreetSequence(plan.paradasSecuencia);
        const tarifaTotal = Number(((plan.tarifaBase * surge) + plan.propina).toFixed(2));

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
        };

        // ZERO TELEPORTATION: Driver starts exactly at ubicacionActual.
        // Smooth continuous movement through Monterrey streets.
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
    });
  }, []);

  // Intervalo de auto-reproducción (1 tick = 600ms avanza 1 minuto con animación continua)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        stepSimulation(1);
      }, 600);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stepSimulation]);

  // Si el turno finaliza automáticamente, pausar y abrir modal de resumen
  useEffect(() => {
    if (shiftState.estadoTurno === 'FINALIZADO') {
      setIsPlaying(false);
      setIsSummaryOpen(true);
    }
  }, [shiftState.estadoTurno]);

  // Manejadores de control
  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleStepForward = (mins: number) => stepSimulation(mins);
  const handleResetShift = () => {
    setIsPlaying(false);
    setShiftState(ESTADO_INICIAL);
  };
  const handleEndShift = () => {
    setIsPlaying(false);
    setShiftState((prev) => ({
      ...prev,
      estadoTurno: 'FINALIZADO',
      estadoConexion: 'DESCONECTADO',
    }));
    setIsSummaryOpen(true);
  };

  const handleChangeAgent = (tipo: 'OPTIGO_AI' | 'GREEDY') => {
    setShiftState((prev) => ({
      ...prev,
      tipoAgente: tipo,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Botón de Regreso a Home */}
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
          <span>OptiGo Driver App • Monterrey</span>
        </div>
      </div>

      {/* Header Principal de Control de Conductor */}
      <DriverHeader
        shiftState={shiftState}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStepForward={handleStepForward}
        onResetShift={handleResetShift}
        onEndShift={handleEndShift}
        onChangeAgent={handleChangeAgent}
      />

      {/* Banner de Alertas Meteorológicas e Incidentes Viales */}
      <WeatherAlertBanner shiftState={shiftState} />

      {/* Grid Principal: Mapa a la izquierda / Paneles de Ganancias y Orden a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
        {/* Mapa Interactivo de Monterrey (7 Columnas en Desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <DriverMap shiftState={shiftState} />
        </div>

        {/* Panel Lateral: Ganancias en tiempo real + Orden activa (5 Columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
          <DriverEarningsCard shiftState={shiftState} />
          <ActiveOrderCard shiftState={shiftState} />
        </div>
      </div>

      {/* Modal de Fin de Turno con Balance Completo */}
      <ShiftSummaryModal
        isOpen={isSummaryOpen}
        shiftState={shiftState}
        onClose={() => setIsSummaryOpen(false)}
        onRestartShift={handleResetShift}
      />
    </div>
  );
}
