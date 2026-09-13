'use client';

import { 
  DollarSign, 
  Fuel, 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  Navigation 
} from 'lucide-react';
import { ActiveShiftState } from './types';

interface DriverEarningsCardProps {
  shiftState: ActiveShiftState;
}

export default function DriverEarningsCard({ shiftState }: DriverEarningsCardProps) {
  // Goal of 5 orders for a guaranteed $80 MXN block bonus
  const metaPedidos = 5;
  const bonoMxn = 80.0;
  const progresoMeta = Math.min(100, (shiftState.pedidosCompletados / metaPedidos) * 100);
  const bonoObtenido = shiftState.pedidosCompletados >= metaPedidos;

  // Hourly rate calculation
  const horasTranscurridas = Math.max(shiftState.minuto / 60, 0.1);
  const tasaHora = (shiftState.gananciaNeta / horasTranscurridas).toFixed(1);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-xl space-y-4">
      {/* 1. Net Earnings Header */}
      <div className="flex justify-between items-start border-b border-white/15 pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-200/90 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Shift Net Earnings</span>
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1 drop-shadow-sm flex items-baseline gap-1">
            <span>${shiftState.gananciaNeta.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-300">MXN</span>
          </div>
        </div>

        {/* $/hr Rate */}
        <div className="text-right bg-slate-950/40 px-3 py-1.5 rounded-2xl border border-white/15">
          <div className="text-[10px] text-slate-300 font-mono">AVG RATE</div>
          <div className="text-sm font-bold text-emerald-300 flex items-center justify-end gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>${tasaHora}/hr</span>
          </div>
        </div>
      </div>

      {/* 2. Operational Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Gross Revenue */}
        <div className="bg-slate-950/30 border border-white/10 rounded-2xl p-2.5 text-left">
          <span className="text-[10px] text-slate-300">Gross Revenue</span>
          <div className="text-sm font-bold text-white mt-0.5">
            ${shiftState.ingresosBrutos.toFixed(2)}
          </div>
        </div>

        {/* Fuel Expense */}
        <div className="bg-slate-950/30 border border-white/10 rounded-2xl p-2.5 text-left">
          <span className="text-[10px] text-slate-300 flex items-center gap-1">
            <Fuel className="w-3 h-3 text-amber-300" />
            <span>Fuel Cost</span>
          </span>
          <div className="text-sm font-bold text-amber-200 mt-0.5">
            -${shiftState.gastoGasolina.toFixed(2)}
          </div>
        </div>

        {/* SLA Penalties */}
        <div className="bg-slate-950/30 border border-white/10 rounded-2xl p-2.5 text-left">
          <span className="text-[10px] text-slate-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-300" />
            <span>SLA Penalties</span>
          </span>
          <div className={`text-sm font-bold mt-0.5 ${shiftState.penalizacionesSla > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            -${shiftState.penalizacionesSla.toFixed(2)}
          </div>
        </div>

        {/* Total Distance */}
        <div className="bg-slate-950/30 border border-white/10 rounded-2xl p-2.5 text-left">
          <span className="text-[10px] text-slate-300 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-teal-300" />
            <span>Total Dist.</span>
          </span>
          <div className="text-sm font-bold text-teal-200 mt-0.5">
            {shiftState.kmTotales.toFixed(1)} km
          </div>
        </div>
      </div>

      {/* 3. Shift Bonus Progress */}
      <div className="bg-slate-950/40 border border-white/15 rounded-2xl p-3 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300" />
            <span>Block Incentive Goal (+${bonoMxn} MXN)</span>
          </span>
          <span className="font-mono text-emerald-300 font-bold">
            {shiftState.pedidosCompletados} / {metaPedidos} orders
          </span>
        </div>

        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-linear-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progresoMeta}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-300">
          <span>{bonoObtenido ? '🎉 $80 MXN Bonus Unlocked!' : `${Math.max(0, metaPedidos - shiftState.pedidosCompletados)} deliveries left to claim bonus`}</span>
          <span>Batches completed: <strong className="text-white">{shiftState.batchesRealizados}</strong></span>
        </div>
      </div>
    </div>
  );
}
