'use client';

import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Bot, 
  User, 
  Clock, 
  Flag 
} from 'lucide-react';
import { ActiveShiftState } from './types';

interface DriverHeaderProps {
  shiftState: ActiveShiftState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: (mins: number) => void;
  onResetShift: () => void;
  onEndShift: () => void;
  onChangeAgent: (tipo: 'OPTIGO_AI' | 'GREEDY') => void;
}

export default function DriverHeader({
  shiftState,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onResetShift,
  onEndShift,
  onChangeAgent,
}: DriverHeaderProps) {
  const isOnline = shiftState.estadoConexion !== 'DESCONECTADO';
  const progressPct = Math.min(100, Math.round((shiftState.minuto / shiftState.duracionTotal) * 100));

  // Format 12-hour clock (starting at 12:00 PM)
  const hour = 12 + Math.floor(shiftState.minuto / 60);
  const min = shiftState.minuto % 60;
  const timeClock = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} PM`;

  return (
    <header className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* 1. Connection Status and Driver AI Mode */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5 bg-slate-950/40 border border-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-md">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-slate-500'}`} />
          <div className="text-left">
            <div className="text-[10px] text-slate-300 font-mono leading-none">STATUS</div>
            <div className="text-xs font-bold text-white leading-tight">
              {shiftState.estadoTurno === 'FINALIZADO' ? 'Shift Completed' : isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Agent Toggle (OptiGo AI vs Greedy) */}
        <div className="flex items-center bg-slate-950/40 p-1 rounded-2xl border border-white/15 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onChangeAgent('OPTIGO_AI')}
            className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              shiftState.tipoAgente === 'OPTIGO_AI'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>OptiGo AI</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeAgent('GREEDY')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              shiftState.tipoAgente === 'GREEDY'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Greedy Base</span>
          </button>
        </div>
      </div>

      {/* 2. Shift Progress Bar & Clock */}
      <div className="flex-1 max-w-md w-full px-2">
        <div className="flex justify-between items-center text-xs mb-1.5 text-slate-200">
          <span className="flex items-center gap-1 font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{timeClock}</span>
          </span>
          <span className="font-semibold text-white">
            Minute {shiftState.minuto} / {shiftState.duracionTotal} min
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950/50 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-300 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 3. Playback & Simulation Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={shiftState.estadoTurno === 'FINALIZADO'}
          className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 font-semibold text-xs ${
            isPlaying
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-md shadow-emerald-900/30'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Start Live Simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Start'}</span>
        </button>

        {/* Step Forward (+5 Minutes) */}
        <button
          type="button"
          onClick={() => onStepForward(5)}
          disabled={shiftState.estadoTurno === 'FINALIZADO'}
          className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl transition-all flex items-center gap-1 text-xs font-medium backdrop-blur-md"
          title="Advance 5 minutes"
        >
          <FastForward className="w-4 h-4" />
          <span>+5m</span>
        </button>

        {/* End Shift / Summary */}
        <button
          type="button"
          onClick={onEndShift}
          className="p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-white/20 text-emerald-300 rounded-2xl transition-all flex items-center gap-1 text-xs font-semibold backdrop-blur-md"
          title="End shift and view summary"
        >
          <Flag className="w-4 h-4 text-emerald-400" />
          <span>Summary</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onResetShift}
          className="p-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 rounded-2xl transition-all"
          title="Reset Shift"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
