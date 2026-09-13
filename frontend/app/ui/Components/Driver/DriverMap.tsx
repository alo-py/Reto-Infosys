'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Radio, 
  AlertCircle, 
  X,
  Crosshair
} from 'lucide-react';
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

export interface DeviceTelemetry {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null; // km/h
  heading: number | null; // degrees
  altitude: number | null;
  timestamp: number;
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

  // Telemetría GPS Real del Dispositivo
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [deviceTelemetry, setDeviceTelemetry] = useState<DeviceTelemetry | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const deviceMarkerRef = useRef<L.Marker | null>(null);
  const deviceAccuracyCircleRef = useRef<L.Circle | null>(null);

  // Referencias para la animación continua de movimiento fluido (60 FPS)
  const currentCoordsRef = useRef<LocationCoord>(shiftState.coordenadasActuales);
  const animationFrameRef = useRef<number | null>(null);
  const currentBearingRef = useRef<number>(0);
  const lastAgentRef = useRef<'OPTIGO_AI' | 'GREEDY'>(shiftState.tipoAgente);

  // Limpieza del observador de geolocalización al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Alternar lectura de Telemetría Real del Dispositivo
  const toggleLiveGps = () => {
    if (isLiveGpsActive) {
      // Detener seguimiento
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (deviceMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(deviceMarkerRef.current);
        deviceMarkerRef.current = null;
      }
      if (deviceAccuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(deviceAccuracyCircleRef.current);
        deviceAccuracyCircleRef.current = null;
      }
      setIsLiveGpsActive(false);
      setDeviceTelemetry(null);
      setGpsError(null);

      // Re-centrar cámara en la posición simulada de Monterrey
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([currentCoordsRef.current.lat, currentCoordsRef.current.lng], 13, {
          duration: 1.2
        });
      }
    } else {
      // Iniciar seguimiento
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setGpsError('Geolocation is not supported by your browser or device.');
        return;
      }

      setGpsError(null);
      setIsLiveGpsActive(true);

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
          const telemetry: DeviceTelemetry = {
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            speed: speed !== null ? Math.round(speed * 3.6) : null, // m/s a km/h
            heading: heading !== null ? Math.round(heading) : null,
            altitude: altitude !== null ? Math.round(altitude) : null,
            timestamp: pos.timestamp,
          };
          setDeviceTelemetry(telemetry);

          if (!mapInstanceRef.current) return;
          const map = mapInstanceRef.current;

          const deviceHtml = `
            <div class="relative flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-cyan-500/25 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-pulse">
                <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md"></div>
              </div>
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-400/40 text-[9px] font-bold text-cyan-300 shadow-md backdrop-blur-xs">
                My Device GPS
              </div>
            </div>
          `;

          const deviceIcon = L.divIcon({
            html: deviceHtml,
            className: 'custom-device-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          if (!deviceMarkerRef.current) {
            deviceMarkerRef.current = L.marker([latitude, longitude], {
              icon: deviceIcon,
              zIndexOffset: 1200,
            }).addTo(map);

            deviceAccuracyCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.12,
              weight: 1.5,
            }).addTo(map);

            // Centrar la vista del mapa en la posición real del dispositivo
            map.flyTo([latitude, longitude], 15, { duration: 1.5 });
          } else {
            deviceMarkerRef.current.setLatLng([latitude, longitude]);
            if (deviceAccuracyCircleRef.current) {
              deviceAccuracyCircleRef.current.setLatLng([latitude, longitude]);
              deviceAccuracyCircleRef.current.setRadius(accuracy);
            }
          }
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
          let msg = 'Unable to acquire device GPS position.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow GPS access in your browser settings.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS signal is currently unavailable.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS location request timed out.';
          }
          setGpsError(msg);
          setIsLiveGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 1000,
        }
      );

      watchIdRef.current = id;
    }
  };

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

    // Observer para ajustar el canvas de Leaflet dinámicamente si el contenedor cambia de tamaño
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
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
    <div className="isolate relative z-0 w-full h-[620px] lg:h-[680px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950">
      {/* Contenedor del mapa de Leaflet que llena el 100% absoluto */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Monterrey Live Compass & Watermark */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">Monterrey Metropolitan Area</span>
        <span className="text-[10px] text-slate-400 font-mono">GPS Live • 60 FPS</span>
      </div>

      {/* Floating Toggle Button: Read Real Device GPS Telemetry */}
      <button
        type="button"
        onClick={toggleLiveGps}
        className={`absolute top-20 right-3 z-[1000] px-3 py-2 rounded-2xl border transition-all shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold cursor-pointer ${
          isLiveGpsActive
            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-[1.02]'
            : 'bg-slate-950/85 hover:bg-slate-900 border-white/20 text-slate-200 hover:text-white'
        }`}
        title={isLiveGpsActive ? 'Click to disable device live GPS' : 'Click to track device real location & telemetry'}
      >
        <Navigation className={`w-4 h-4 ${isLiveGpsActive ? 'text-slate-950 fill-current animate-pulse' : 'text-cyan-400'}`} />
        <span>{isLiveGpsActive ? 'GPS Active' : 'Read Device GPS'}</span>
      </button>

      {/* Real-Time Device Telemetry HUD Overlay */}
      {isLiveGpsActive && deviceTelemetry && (
        <div className="absolute top-16 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-3 text-xs text-slate-200 shadow-2xl space-y-1.5 animate-fade-in max-w-xs">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>Device Telemetry Stream</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-400/40">
              ±{deviceTelemetry.accuracy}m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono pt-0.5">
            <div>
              <span className="text-slate-400">Lat:</span> <strong className="text-white">{deviceTelemetry.lat.toFixed(5)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Lng:</span> <strong className="text-white">{deviceTelemetry.lng.toFixed(5)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Speed:</span> <strong className="text-emerald-300">{deviceTelemetry.speed !== null ? `${deviceTelemetry.speed} km/h` : '0 km/h'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Heading:</span> <strong className="text-sky-300">{deviceTelemetry.heading !== null ? `${deviceTelemetry.heading}°` : 'N/A'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error Notification */}
      {gpsError && (
        <div className="absolute top-16 left-4 right-4 sm:right-auto z-[1000] bg-rose-950/90 backdrop-blur-md border border-rose-400/50 rounded-2xl p-3 text-xs text-rose-200 shadow-2xl flex items-center justify-between gap-3 animate-fade-in max-w-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGpsError(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Route Legend in Bottom Left (Exactamente una ruta activa mostrada) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 text-[11px] text-slate-300 space-y-1.5 shadow-lg hidden sm:block">
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
