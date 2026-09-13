'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ActiveShiftState, 
  MONTERREY_NODES, 
  MONTERREY_AVENUES, 
  LocationCoord, 
  ZoneName 
} from './types';
import { buildFullStreetSequence, getStreetPath } from './streetRouting';

interface DriverMapProps {
  shiftState: ActiveShiftState;
}

// Función para calcular el rumbo (heading / bearing) en grados entre dos puntos GPS
function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(startLat);
  const φ2 = toRad(destLat);
  const Δλ = toRad(destLng - startLng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// Easing suave cúbico para animación realista
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function DriverMap({ shiftState }: DriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const pickupPolylineRef = useRef<L.Polyline | null>(null);
  const incidentPolylinesRef = useRef<L.Polyline[]>([]);

  // Referencias para la animación continua de movimiento fluido (60 FPS)
  const currentCoordsRef = useRef<LocationCoord>(shiftState.coordenadasActuales);
  const animationFrameRef = useRef<number | null>(null);
  const currentBearingRef = useRef<number>(0);
  const lastAgentRef = useRef<'OPTIGO_AI' | 'GREEDY'>(shiftState.tipoAgente);

  // 1. Inicializar el mapa de Monterrey una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Coordenadas centrales de Monterrey: Macroplaza / Centro
    const initialCenter: [number, number] = [25.670, -100.320];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Añadir control de zoom en esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tiles estilo oscuro profesional (Esri World Dark Gray Canvas + Reference) sin requerimiento de API Key
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      maxNativeZoom: 16,
      attribution: 'Tiles &copy; Esri',
    }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      maxNativeZoom: 16,
    }).addTo(map);

    // Dibujar los 9 nodos clave de Monterrey como estaciones fijas
    Object.entries(MONTERREY_NODES).forEach(([name, coords]) => {
      const nodeHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer">
          <div class="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-transform group-hover:scale-135"></div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-950/90 border border-white/20 text-[9px] font-semibold text-slate-200 pointer-events-none shadow-md backdrop-blur-xs opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all z-10">
            ${name.split(' (')[0]}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: nodeHtml,
        className: 'custom-node-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([coords.lat, coords.lng], { icon }).addTo(map);
    });

    // Marcador del Transportista / Repartidor con Animación de Movimiento y Rotación
    const driverHtml = `
      <div id="driver-marker-wrapper" class="relative flex items-center justify-center pointer-events-none">
        <!-- Ondas de radar / pulso de localización continua -->
        <div class="absolute -inset-3 rounded-full bg-emerald-400/30 animate-ping"></div>
        <div class="absolute -inset-1.5 rounded-full bg-teal-400/40 animate-pulse"></div>

        <!-- Contenedor rotativo del vehículo con flecha de dirección -->
        <div id="driver-vehicle-rotator" class="relative w-9 h-9 rounded-full bg-linear-to-tr from-emerald-600 via-emerald-500 to-teal-300 border-2 border-white shadow-[0_0_20px_rgba(16,185,129,1)] flex items-center justify-center transition-transform duration-300 ease-out">
          <!-- Icono de vehículo apuntando hacia arriba (Norte) para rotar con bearing -->
          <svg class="w-5 h-5 text-slate-950 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>
      </div>
    `;

    const driverIcon = L.divIcon({
      html: driverHtml,
      className: 'driver-live-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const driverMarker = L.marker([initialCenter[0], initialCenter[1]], {
      icon: driverIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    driverMarkerRef.current = driverMarker;
    mapInstanceRef.current = map;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Animación Continua de Desplazamiento del Transportista en Tiempo Real (requestAnimationFrame)
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;

    const targetCoords = shiftState.coordenadasActuales;

    // A) CAMBIO DE PESTAÑA O AGENTE: Teleportación inmediata sin vuelo por toda la ciudad
    if (lastAgentRef.current !== shiftState.tipoAgente) {
      lastAgentRef.current = shiftState.tipoAgente;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      currentCoordsRef.current = targetCoords;
      driverMarkerRef.current.setLatLng([targetCoords.lat, targetCoords.lng]);

      const map = mapInstanceRef.current;
      map.stop(); // Detener cualquier animación de paneo pendiente de Leaflet
      map.panTo([targetCoords.lat, targetCoords.lng], { animate: false });
      return;
    }

    const startCoords = currentCoordsRef.current;

    // Si la distancia es imperceptible, evitar animar
    const distLat = targetCoords.lat - startCoords.lat;
    const distLng = targetCoords.lng - startCoords.lng;
    if (Math.abs(distLat) < 0.00001 && Math.abs(distLng) < 0.00001) {
      currentCoordsRef.current = targetCoords;
      return;
    }

    // Calcular ángulo de dirección hacia el nuevo punto
    const newBearing = calculateBearing(
      startCoords.lat,
      startCoords.lng,
      targetCoords.lat,
      targetCoords.lng
    );
    currentBearingRef.current = newBearing;

    // Rotar el vehículo hacia la dirección de avance
    const rotatorElem = document.getElementById('driver-vehicle-rotator');
    if (rotatorElem) {
      rotatorElem.style.transform = `rotate(${newBearing}deg)`;
    }

    // Parámetros de la interpolación fluida (380ms a 60 FPS, termina antes de la sig. orden)
    const duration = 380;
    let startTime: number | null = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const animateMovement = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = easeOutCubic(progress);

      const currLat = startCoords.lat + distLat * ease;
      const currLng = startCoords.lng + distLng * ease;

      // Mantener la coordenada actual sincronizada en todo momento (evita saltos al pausar)
      currentCoordsRef.current = { lat: currLat, lng: currLng };

      // Actualizar marcador
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([currLat, currLng]);
      }

      if (progress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(animateMovement);
      } else {
        // Animación terminada exactamente en destino
        currentCoordsRef.current = targetCoords;
        animationFrameRef.current = null;

        // Centrar mapa suavemente solo si el vehículo se aproxima al borde de la vista
        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current;
          const bounds = map.getBounds();
          if (!bounds.pad(-0.15).contains([targetCoords.lat, targetCoords.lng])) {
            map.panTo([targetCoords.lat, targetCoords.lng], {
              animate: true,
              duration: 0.25,
            });
          }
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [shiftState.coordenadasActuales, shiftState.tipoAgente]);

  // 3. Dibujar ÚNICAMENTE el camino del tramo activo actual (una sola línea visible en el mapa)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Eliminar polilínea anterior si existe
    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (pickupPolylineRef.current) {
      mapInstanceRef.current.removeLayer(pickupPolylineRef.current);
      pickupPolylineRef.current = null;
    }

    const orden = shiftState.ordenActiva;
    // Si no hay orden o el viaje concluyó, cero líneas en el mapa
    if (!orden || !orden.tramoActualOrigen || !orden.tramoActualDestino) return;

    const isTransition = orden.hasPickupTransition && orden.indiceTramoActual === 0;

    // Obtener las coordenadas reales del único tramo activo (de Punto X a Punto Y)
    const activeLegPath = getStreetPath(orden.tramoActualOrigen, orden.tramoActualDestino);

    if (activeLegPath.length >= 2) {
      const polyline = L.polyline(activeLegPath, {
        color: isTransition ? '#38bdf8' : orden.estaDesviado ? '#fbbf24' : '#10b981',
        weight: 5,
        opacity: 0.95,
        dashArray: isTransition ? '6, 6' : orden.estaDesviado ? '6, 4' : '8, 8',
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;
    }
  }, [
    shiftState.ordenActiva?.indiceTramoActual,
    shiftState.ordenActiva?.tramoActualOrigen,
    shiftState.ordenActiva?.tramoActualDestino,
    shiftState.ordenActiva?.estaDesviado,
    shiftState.ordenActiva == null
  ]);

  // 4. Dibujar incidentes viales (Avenidas cerradas en rojo)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Limpiar polilíneas anteriores de incidentes
    incidentPolylinesRef.current.forEach((layer) => {
      mapInstanceRef.current?.removeLayer(layer);
    });
    incidentPolylinesRef.current = [];

    if (shiftState.avenidaCerrada && MONTERREY_AVENUES[shiftState.avenidaCerrada]) {
      const coords = MONTERREY_AVENUES[shiftState.avenidaCerrada];
      const incidentLine = L.polyline(coords, {
        color: '#ef4444',
        weight: 6,
        opacity: 0.9,
        dashArray: '6, 6',
      }).addTo(mapInstanceRef.current);

      incidentPolylinesRef.current.push(incidentLine);
    }
  }, [shiftState.avenidaCerrada]);

  return (
    <div className="isolate relative z-0 w-full h-full min-h-[480px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950">
      {/* Contenedor del mapa de Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Monterrey Live Compass & Watermark */}
      <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">Monterrey Metropolitan Area</span>
        <span className="text-[10px] text-slate-400 font-mono">GPS Live • 60 FPS</span>
      </div>

      {/* Route Legend in Bottom Left (Exactamente una ruta activa mostrada) */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 text-[11px] text-slate-300 space-y-1.5 shadow-lg hidden sm:block">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
          <span>Driver in Transit</span>
        </div>

        {shiftState.ordenActiva && (
          shiftState.ordenActiva.hasPickupTransition && shiftState.ordenActiva.indiceTramoActual === 0 ? (
            <div className="flex items-center gap-2 text-sky-300 font-medium animate-pulse">
              <span className="w-4 h-1 border-t-2 border-sky-400 border-dashed"></span>
              <span>Pickup Leg ➔ {shiftState.ordenActiva.tramoActualDestino.split(' (')[0]}</span>
            </div>
          ) : shiftState.ordenActiva.estaDesviado ? (
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <span className="w-4 h-1 border-t-2 border-amber-400 border-dashed"></span>
              <span>Detour Leg ➔ {shiftState.ordenActiva.tramoActualDestino.split(' (')[0]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-300 font-medium">
              <span className="w-4 h-1 border-t-2 border-emerald-400 border-dashed"></span>
              <span>Delivery Leg ➔ {shiftState.ordenActiva.tramoActualDestino.split(' (')[0]}</span>
            </div>
          )
        )}

        {shiftState.avenidaCerrada && (
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <span className="w-4 h-1 border-t-2 border-rose-500 border-dashed"></span>
            <span>{shiftState.avenidaCerrada} (Closed)</span>
          </div>
        )}
      </div>
    </div>
  );
}
