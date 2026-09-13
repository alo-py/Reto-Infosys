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

interface DriverMapProps {
  shiftState: ActiveShiftState;
}

export default function DriverMap({ shiftState }: DriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const incidentPolylinesRef = useRef<L.Polyline[]>([]);

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

    // Tiles estilo DiDi/Uber Dark Matter (limpio, elegante y moderno)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    // Dibujar los 9 nodos clave de Monterrey como estaciones fijas
    Object.entries(MONTERREY_NODES).forEach(([name, coords]) => {
      const nodeHtml = `
        <div class="group relative flex items-center justify-center">
          <div class="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-transform group-hover:scale-125"></div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/85 border border-white/20 text-[9px] font-semibold text-slate-200 pointer-events-none shadow-md backdrop-blur-xs opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
            ${name.split(' (')[0]}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: nodeHtml,
        className: 'custom-node-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([coords.lat, coords.lng], { icon }).addTo(map);
    });

    // Marcador del Conductor (Moto / Repartidor con pulso animado)
    const driverHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-2 rounded-full bg-emerald-400/40 animate-ping"></div>
        <div class="relative w-8 h-8 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.9)] flex items-center justify-center text-white">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-4-4zm-12 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm11 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7 6.5C7 7.33 6.33 8 5.5 8S4 7.33 4 6.5 4.67 5 5.5 5 7 5.67 7 6.5z"/>
          </svg>
        </div>
      </div>
    `;

    const driverIcon = L.divIcon({
      html: driverHtml,
      className: 'driver-live-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const driverMarker = L.marker([initialCenter[0], initialCenter[1]], {
      icon: driverIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    driverMarkerRef.current = driverMarker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Actualizar la posición del repartidor suavemente
  useEffect(() => {
    if (!mapInstanceRef.current || !driverMarkerRef.current) return;

    const coords = shiftState.coordenadasActuales;
    driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);

    // Centrar mapa suavemente si cambia de posición significativa
    mapInstanceRef.current.panTo([coords.lat, coords.lng], {
      animate: true,
      duration: 0.8,
    });
  }, [shiftState.coordenadasActuales]);

  // 3. Dibujar la ruta optimizada activa (OR-Tools / Secuencia de paradas)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Eliminar ruta anterior
    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (shiftState.ordenActiva && shiftState.ordenActiva.paradasSecuencia.length > 0) {
      const paradas = shiftState.ordenActiva.paradasSecuencia;
      const latlngs: [number, number][] = [
        [shiftState.coordenadasActuales.lat, shiftState.coordenadasActuales.lng],
      ];

      paradas.forEach((p) => {
        const node = MONTERREY_NODES[p as ZoneName];
        if (node) {
          latlngs.push([node.lat, node.lng]);
        }
      });

      if (latlngs.length >= 2) {
        // Trazado de ruta estilo neón Uber/DiDi
        const polyline = L.polyline(latlngs, {
          color: '#10b981',
          weight: 4.5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineJoin: 'round',
        }).addTo(mapInstanceRef.current);

        routePolylineRef.current = polyline;
      }
    }
  }, [shiftState.ordenActiva, shiftState.coordenadasActuales]);

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
    <div className="relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950">
      {/* Contenedor del mapa de Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Marca de agua / Brújula de Monterrey */}
      <div className="absolute top-4 left-4 z-400 bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">Área Metropolitana de Monterrey</span>
        <span className="text-[10px] text-slate-400 font-mono">GPS Live</span>
      </div>

      {/* Leyenda de ruta en la esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 z-400 bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 text-[11px] text-slate-300 space-y-1.5 shadow-lg hidden sm:block">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
          <span>Repartidor / Conductor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 border-t-2 border-emerald-400 border-dashed"></span>
          <span>Ruta Optimizada (OR-Tools)</span>
        </div>
        {shiftState.avenidaCerrada && (
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <span className="w-4 h-1 border-t-2 border-rose-500 border-dashed"></span>
            <span>{shiftState.avenidaCerrada} (Cerrada)</span>
          </div>
        )}
      </div>
    </div>
  );
}
