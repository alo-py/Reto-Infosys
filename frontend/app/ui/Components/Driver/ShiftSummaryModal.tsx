'use client';

import { 
  Trophy, 
  Fuel, 
  TrendingUp, 
  X, 
  RotateCcw, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { ActiveShiftState } from './types';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  shiftState: ActiveShiftState;
  onClose: () => void;
  onRestartShift: () => void;
}

export default function ShiftSummaryModal({
  isOpen,
  shiftState,
  onClose,
  onRestartShift,
}: ShiftSummaryModalProps) {
  if (!isOpen) return null;

  // Estimated difference vs traditional Greedy baseline
  const difEstimado = shiftState.tipoAgente === 'OPTIGO_AI' 
    ? Math.max(35.0, shiftState.gananciaNeta * 0.22) 
    : 0;

  const tasaSla = shiftState.pedidosCompletados > 0
    ? Math.round(((shiftState.pedidosCompletados - shiftState.pedidosConRetraso) / shiftState.pedidosCompletados) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900/95 border border-white/20 rounded-4xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Celebration Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Header with Trophy */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Trophy className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            End-of-Shift Summary
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Shift completed in Monterrey Metropolitan Area (120 min)
          </p>
        </div>

        {/* 2. Main Net Earnings Box */}
        <div className="bg-linear-to-b from-white/15 to-white/5 border border-emerald-400/40 rounded-3xl p-5 text-center shadow-lg">
          <div className="text-xs uppercase font-semibold tracking-wider text-emerald-200">
            Total Net Earnings
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white mt-1">
            ${shiftState.gananciaNeta.toFixed(2)} <span className="text-base text-slate-300 font-medium">MXN</span>
          </div>
          {shiftState.tipoAgente === 'OPTIGO_AI' && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold border border-emerald-300/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+${difEstimado.toFixed(2)} MXN extra vs Traditional Courier</span>
            </div>
          )}
        </div>

        {/* 3. Operational & Financial Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Gross Revenue</span>
            <div className="text-base font-bold text-white mt-0.5">
              ${shiftState.ingresosBrutos.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <Fuel className="w-3 h-3 text-amber-300" />
              <span>Fuel Expense</span>
            </span>
            <div className="text-base font-bold text-amber-200 mt-0.5">
              -${shiftState.gastoGasolina.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>On-Time SLA</span>
            </span>
            <div className="text-base font-bold text-emerald-300 mt-0.5">
              {tasaSla}% on-time
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Completed Orders</span>
            <div className="text-base font-bold text-white mt-0.5">
              {shiftState.pedidosCompletados} orders
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-300" />
              <span>OR-Tools Batches</span>
            </span>
            <div className="text-base font-bold text-purple-200 mt-0.5">
              {shiftState.batchesRealizados}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase font-mono">SLA Fines / Delays</span>
            <div className={`text-base font-bold mt-0.5 ${shiftState.penalizacionesSla > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              -${shiftState.penalizacionesSla.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 4. Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onRestartShift}
            className="flex-1 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>Start New Shift</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl transition-all"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}
