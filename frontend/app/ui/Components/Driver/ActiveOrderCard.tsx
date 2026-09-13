'use client';

import { 
  Package, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Clock, 
  DollarSign 
} from 'lucide-react';
import { ActiveShiftState } from './types';

interface ActiveOrderCardProps {
  shiftState: ActiveShiftState;
}

export default function ActiveOrderCard({ shiftState }: ActiveOrderCardProps) {
  const orden = shiftState.ordenActiva;

  if (!orden) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Package className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Buscando Ofertas Cercanas</div>
            <div className="text-xs text-slate-300">
              Ubicación actual: <strong className="text-emerald-200">{shiftState.ubicacionActual}</strong>
            </div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 animate-pulse">
          Disponible
        </div>
      </div>
    );
  }

  const isBatch = orden.tipo === 'BATCH';

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-xl space-y-4">
      {/* 1. Header de la Orden */}
      <div className="flex justify-between items-center border-b border-white/15 pb-3">
        <div className="flex items-center gap-2">
          {isBatch ? (
            <div className="px-2.5 py-1 rounded-xl bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/40 flex items-center gap-1.5 shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>Smart Batch (2 Pedidos)</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/40 flex items-center gap-1.5 shadow-sm">
              <Package className="w-3.5 h-3.5" />
              <span>Pedido Individual</span>
            </div>
          )}
          <span className="text-xs font-medium text-slate-300">
            {isBatch ? 'Google OR-Tools VRPTW' : 'Ruta Directa'}
          </span>
        </div>

        {/* Tarifa de la entrega */}
        <div className="text-right">
          <div className="text-base font-black text-white flex items-center justify-end gap-0.5">
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>${orden.tarifaTotal.toFixed(2)}</span>
            <span className="text-[10px] text-slate-300 font-normal">MXN</span>
          </div>
          {orden.propinaTotal > 0 && (
            <div className="text-[10px] text-emerald-300 font-medium">
              Incluye +${orden.propinaTotal.toFixed(2)} propina
            </div>
          )}
        </div>
      </div>

      {/* 2. Secuencia de Ruta (Pickups y Entregas) */}
      <div className="space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shrink-0" />
          <div className="text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Restaurante (Pickup):</span>
            <div className="font-semibold text-white">{orden.origen}</div>
          </div>
        </div>

        <div className="ml-1.5 w-0.5 h-4 bg-white/20 border-l border-dashed border-white/40 my-0.5" />

        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 shrink-0" />
          <div className="text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Destino (Entrega):</span>
            <div className="font-semibold text-white">{orden.destino}</div>
          </div>
        </div>
      </div>

      {/* 3. Trazabilidad Agéntica (DeepSeek Estratega + Supervisor) */}
      {orden.logExplicativo && (
        <div className="bg-slate-950/50 border border-white/15 rounded-2xl p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deliberación del Sistema Dual DeepSeek:</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
            {orden.logExplicativo}
          </p>
        </div>
      )}
    </div>
  );
}
