'use client';

import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Bot, 
  User, 
  UserCheck,
  Clock, 
  Flag,
  Sliders,
  Zap
} from 'lucide-react';
import { ActiveShiftState } from './types';
import { ShiftScenarioConfig } from './scenarios';

interface DriverHeaderProps {
  activeTab: 'OPTIGO_AI' | 'GREEDY';
  shiftState: ActiveShiftState;
  isPlaying: boolean;
  isOptigoRunning: boolean;
  isGreedyRunning: boolean;
  isOptigoFinished: boolean;
  isGreedyFinished: boolean;
  onTogglePlay: () => void;
  onTogglePlayBoth?: () => void;
  isBothPlaying?: boolean;
  onStepForward: (mins: number) => void;
  onResetShift: () => void;
  onEndShift: () => void;
  onSelectTab: (tab: 'OPTIGO_AI' | 'GREEDY') => void;
  onOpenComparison?: () => void;
  currentScenario?: ShiftScenarioConfig;
  onOpenScenarioModal?: () => void;
  onToggleAutonomyMode?: () => void;
  isBackendConnected?: boolean;
  backendShiftId?: string | null;
}

export default function DriverHeader({
  activeTab,
  shiftState,
  isPlaying,
  isOptigoRunning,
  isGreedyRunning,
  isOptigoFinished,
  isGreedyFinished,
  onTogglePlay,
  onTogglePlayBoth,
  isBothPlaying = false,
  onStepForward,
  onResetShift,
  onEndShift,
  onSelectTab,
  onOpenComparison,
  currentScenario,
  onOpenScenarioModal,
  onToggleAutonomyMode,
  isBackendConnected,
  backendShiftId,
}: DriverHeaderProps) {
  const isOnline = shiftState.estadoConexion !== 'DESCONECTADO';
  const progressPct = Math.min(100, Math.round((shiftState.minuto / shiftState.duracionTotal) * 100));

  // Format 12-hour clock (starting at 12:00 PM)
  const hour = 12 + Math.floor(shiftState.minuto / 60);
  const min = shiftState.minuto % 60;
  const timeClock = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} PM`;

  // Countdown timer (time left until 0)
  const remainingMins = Math.max(0, shiftState.duracionTotal - shiftState.minuto);
  const remHours = Math.floor(remainingMins / 60);
  const remMins = remainingMins % 60;
  const timerCountdown = `${remHours.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}`;

  return (
    <header className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* 1. Connection Status, Backend Live Indicator and Dual Simulation Tabs */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start flex-wrap">
        <div className="flex items-center gap-2.5 bg-slate-950/40 border border-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-md">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-slate-500'}`} />
          <div className="text-left">
            <div className="text-[10px] text-slate-300 font-mono leading-none">STATUS</div>
            <div className="text-xs font-bold text-white leading-tight">
              {shiftState.estadoTurno === 'FINALIZADO' ? 'Shift Completed' : isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Django Backend Live Connection Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/40 border border-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-md">
          <span className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-amber-400'}`} />
          <div className="text-left">
            <div className="text-[9px] text-slate-400 font-mono leading-none">ENGINE</div>
            <div className="text-xs font-bold leading-tight">
              {isBackendConnected ? (
                <span className="text-emerald-300" title={backendShiftId ? `Django Shift ID: ${backendShiftId}` : 'Django REST API'}>
                  Django Live
                </span>
              ) : (
                <span className="text-amber-300" title="Django server offline - running on local client engine">
                  Local Simulation
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Simulation Tabs (OptiGo AI vs Greedy Base) */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner gap-1">
          <button
            type="button"
            onClick={() => onSelectTab('OPTIGO_AI')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all relative ${
              activeTab === 'OPTIGO_AI'
                ? 'bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>OptiGo AI</span>
            {isOptigoRunning && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            {isOptigoFinished && (
              <span className="text-[9px] bg-emerald-950/90 text-emerald-300 px-1 py-0.2 rounded font-mono border border-emerald-400/40">
                ✓ Done
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('GREEDY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all relative ${
              activeTab === 'GREEDY'
                ? 'bg-linear-to-r from-amber-500 to-orange-400 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Greedy Base</span>
            {isGreedyRunning && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            {isGreedyFinished && (
              <span className="text-[9px] bg-amber-950/90 text-amber-300 px-1 py-0.2 rounded font-mono border border-amber-400/40">
                ✓ Done
              </span>
            )}
          </button>
        </div>

        {onOpenComparison && (
          <button
            type="button"
            onClick={onOpenComparison}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-500/25 hover:bg-purple-500/35 text-purple-200 border border-purple-400/30 flex items-center gap-1.5 shadow-sm transition-all"
            title="Compare dual simulation results"
          >
            <span>Compare Results</span>
          </button>
        )}

        {onOpenScenarioModal && (
          <button
            type="button"
            onClick={onOpenScenarioModal}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5 shadow-sm transition-all"
            title="Configure shift weather, traffic & road events"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span>Scenario: {currentScenario ? currentScenario.name.split(' ')[0] : 'Monterrey'}</span>
          </button>
        )}

        {/* Autonomy Mode Switcher: 100% Auto-Pilot vs Co-Pilot (Manual Decision) */}
        {onToggleAutonomyMode && (
          <button
            type="button"
            onClick={onToggleAutonomyMode}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border shadow-sm ${
              shiftState.directives?.autonomyMode === 'COPILOT'
                ? 'bg-linear-to-r from-purple-500 to-indigo-500 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] scale-[1.02]'
                : 'bg-slate-950/60 text-slate-300 border-white/20 hover:text-white hover:border-white/40'
            }`}
            title="Click to toggle between 100% Autonomous Auto-Pilot and Interactive Co-Pilot"
          >
            {shiftState.directives?.autonomyMode === 'COPILOT' ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-purple-200" />
                <span>Mode: 🤝 Co-Pilot</span>
                <span className="text-[9px] bg-purple-950 text-purple-200 px-1 py-0.5 rounded font-mono border border-purple-400/40">
                  Manual
                </span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mode: ⚡ Auto-Pilot</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.5 rounded font-mono border border-emerald-400/40">
                  Auto
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 2. Shift Progress Bar & Clock */}
      <div className="flex-1 max-w-md w-full px-2">
        <div className="flex justify-between items-center text-xs mb-1.5 text-slate-200">
          <span className="flex items-center gap-1 font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{timeClock}</span>
            <span className="text-slate-400 text-[11px] ml-1 bg-slate-950/50 px-2 py-0.5 rounded-md border border-white/10">
              Timer: {timerCountdown}
            </span>
          </span>
          <span className="font-semibold text-white text-xs">
            {remainingMins === 0 ? (
              <span className="text-emerald-300 font-bold">Shift Ended (0m remaining)</span>
            ) : (
              <span>{remainingMins}m remaining</span>
            )}
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
      <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
        {/* Run Both Simulations Concurrently (OptiGo + Greedy) */}
        {onTogglePlayBoth && (
          <button
            type="button"
            onClick={onTogglePlayBoth}
            disabled={isOptigoFinished && isGreedyFinished}
            className={`px-3 py-2 rounded-2xl border transition-all flex items-center gap-1.5 font-bold text-xs shadow-md ${
              isBothPlaying
                ? 'bg-linear-to-r from-amber-500/25 to-orange-500/25 border-amber-400/50 text-amber-200 hover:from-amber-500/35 hover:to-orange-500/35'
                : 'bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-500 text-white border-white/25 hover:brightness-115 shadow-purple-950/40 hover:scale-[1.02]'
            } disabled:opacity-50 disabled:pointer-events-none`}
            title={isBothPlaying ? 'Pause both simulations' : 'Run both OptiGo AI and Greedy simulations simultaneously in parallel'}
          >
            <Zap className={`w-3.5 h-3.5 ${isBothPlaying ? 'text-amber-300 animate-pulse' : 'text-yellow-300 fill-current'}`} />
            <span>{isBothPlaying ? 'Pause Both' : '⚡ Run Both'}</span>
          </button>
        )}

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
          title={isPlaying ? `Pause ${activeTab === 'OPTIGO_AI' ? 'OptiGo' : 'Greedy'}` : `Start ${activeTab === 'OPTIGO_AI' ? 'OptiGo' : 'Greedy'}`}
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
