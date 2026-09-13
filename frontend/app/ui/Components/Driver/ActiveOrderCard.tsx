'use client';

import { 
  Package, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Layers, 
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
            <div className="text-sm font-bold text-white">Searching Nearby Orders</div>
            <div className="text-xs text-slate-300">
              Current location: <strong className="text-emerald-200">{shiftState.ubicacionActual}</strong>
            </div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 animate-pulse">
          Available
        </div>
      </div>
    );
  }

  const isBatch = orden.tipo === 'BATCH';

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-xl space-y-4">
      {/* 1. Order Header */}
      <div className="flex justify-between items-center border-b border-white/15 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isBatch ? (
            <div className="px-2.5 py-1 rounded-xl bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/40 flex items-center gap-1.5 shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>Smart Batch (2 Orders)</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/40 flex items-center gap-1.5 shadow-sm">
              <Package className="w-3.5 h-3.5" />
              <span>Single Order</span>
            </div>
          )}

          {/* Real-time Navigation Phase Badge */}
          {orden.faseActual === 'TRANSICION_PICKUP' ? (
            <div className="px-2 py-0.5 rounded-full bg-sky-500/25 border border-sky-400/40 text-sky-200 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Heading to Restaurant</span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Delivering to Customer</span>
            </div>
          )}

          {orden.estaDesviado && (
            <div className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Detour Active</span>
            </div>
          )}
        </div>

        {/* Fare & Tips */}
        <div className="text-right">
          <div className="text-base font-black text-white flex items-center justify-end gap-0.5">
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>${orden.tarifaTotal.toFixed(2)}</span>
            <span className="text-[10px] text-slate-300 font-normal">MXN</span>
          </div>
          {orden.propinaTotal > 0 && (
            <div className="text-[10px] text-emerald-300 font-medium">
              Includes +${orden.propinaTotal.toFixed(2)} tip
            </div>
          )}
        </div>
      </div>

      {/* 2. Route Waypoints (Transition -> Pickups -> Drop-offs) */}
      <div className="space-y-2">
        {orden.hasPickupTransition && orden.transicionDesde && (
          <>
            <div className="flex items-start gap-2.5">
              <div className="mt-1 w-3 h-3 rounded-full bg-sky-400 border-2 border-slate-900 shrink-0 shadow-[0_0_6px_#38bdf8]" />
              <div className="text-xs">
                <span className="text-[10px] text-sky-300 uppercase font-mono">Deadhead Relocation:</span>
                <div className="font-semibold text-white">{orden.transicionDesde}</div>
              </div>
            </div>
            <div className="ml-1.5 w-0.5 h-3 bg-sky-400/40 border-l border-dashed border-sky-400/60 my-0.5" />
          </>
        )}

        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shrink-0 shadow-[0_0_6px_#f59e0b]" />
          <div className="text-xs">
            <span className="text-[10px] text-amber-300 uppercase font-mono">Restaurant (Pickup):</span>
            <div className="font-semibold text-white">{orden.origen}</div>
          </div>
        </div>

        {/* If Batch with 2 drop-offs, display Stop 1 then Final Stop 2 */}
        {isBatch && orden.paradasSecuencia.length >= (orden.hasPickupTransition ? 4 : 3) && (
          <>
            <div className="ml-1.5 w-0.5 h-3 bg-purple-400/40 border-l border-dashed border-purple-400/60 my-0.5" />
            <div className="flex items-start gap-2.5">
              <div className="mt-1 w-3 h-3 rounded-full bg-purple-400 border-2 border-slate-900 shrink-0 shadow-[0_0_6px_#c084fc]" />
              <div className="text-xs">
                <span className="text-[10px] text-purple-300 uppercase font-mono">Drop-off 1 (Customer A):</span>
                <div className="font-semibold text-white">{orden.paradasSecuencia[orden.hasPickupTransition ? 2 : 1]}</div>
              </div>
            </div>
          </>
        )}

        <div className="ml-1.5 w-0.5 h-3 bg-emerald-400/40 border-l border-dashed border-emerald-400/60 my-0.5" />

        <div className="flex items-start gap-2.5">
          <div className="mt-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 shrink-0 shadow-[0_0_6px_#10b981]" />
          <div className="text-xs">
            <span className="text-[10px] text-emerald-300 uppercase font-mono">
              {isBatch ? 'Drop-off 2 (Customer B - Final):' : 'Destination (Drop-off):'}
            </span>
            <div className="font-semibold text-white">{orden.destino}</div>
          </div>
        </div>

        {orden.distanciaKmTotal && (
          <div className="pt-1 text-[10px] text-slate-300 font-mono flex items-center gap-2">
            <span>Route: <strong>{orden.distanciaKmTotal} km</strong></span>
            {orden.kmVacioViaje ? (
              <span className="text-sky-300">• ({orden.kmVacioViaje} km deadhead to pickup)</span>
            ) : null}
          </div>
        )}
      </div>

      {/* 3. DeepSeek Dual-Agent Deliberation */}
      {orden.logExplicativo && (
        <div className="bg-slate-950/50 border border-white/15 rounded-2xl p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DeepSeek Dual-Agent Deliberation:</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
            {orden.logExplicativo}
          </p>
        </div>
      )}
    </div>
  );
}
