'use client';

import { 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Snowflake, 
  AlertTriangle, 
  ShieldCheck, 
  Flame,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ActiveShiftState } from './types';
import { ShiftScenarioConfig } from './scenarios';

interface WeatherAlertBannerProps {
  shiftState: ActiveShiftState;
  currentScenario?: ShiftScenarioConfig;
  onOpenScenarioModal?: () => void;
}

export default function WeatherAlertBanner({ 
  shiftState,
  currentScenario,
  onOpenScenarioModal
}: WeatherAlertBannerProps) {
  const isExtremeWeather =
    shiftState.clima.includes('STORM') ||
    shiftState.clima.includes('TORMENTA') ||
    shiftState.clima.includes('HAIL') ||
    shiftState.clima.includes('GRANIZO') ||
    shiftState.temperatura >= 39;

  const hasIncident = !!shiftState.avenidaCerrada;

  // Weather icon based on description
  const getWeatherIcon = () => {
    const c = shiftState.clima.toUpperCase();
    if (c.includes('STORM') || c.includes('TORMENTA')) {
      return <CloudLightning className="w-4 h-4 text-amber-300 animate-bounce" />;
    }
    if (c.includes('RAIN') || c.includes('LLUVIA')) {
      return <CloudRain className="w-4 h-4 text-cyan-300" />;
    }
    if (c.includes('HAIL') || c.includes('GRANIZO')) {
      return <Snowflake className="w-4 h-4 text-blue-200 animate-spin" />;
    }
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* 1. Weather Card & Surge Multiplier */}
      <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900/50 border border-white/15">
            {getWeatherIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{shiftState.clima.replace(/^[^\w\s&]+/, '').trim().split(' (')[0]}</span>
              <span className="text-[11px] font-mono text-emerald-200">{shiftState.temperatura}°C</span>
            </div>
            <div className="text-[10px] text-slate-300">
              Traffic Index: <strong className="text-white">{shiftState.factorTrafico}x</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Fare Surge Badge */}
        {shiftState.factorSurge > 1.0 ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-linear-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/50 text-amber-200 text-xs font-black shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
            <span>{shiftState.factorSurge}x Surge</span>
          </div>
        ) : (
          <div className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-medium text-slate-300 border border-white/10">
            Base Fare 1.0x
          </div>
        )}
      </div>

      {/* 2. Road Closure or Traffic Accident Alert */}
      {hasIncident ? (
        <div className="flex-1 bg-linear-to-r from-rose-950/70 to-red-900/50 backdrop-blur-xl border border-rose-400/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/30 text-rose-200 border border-rose-400/30 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Blocked Corridor:</span>
                <span className="text-rose-200 underline decoration-rose-400 font-semibold">{shiftState.avenidaCerrada}</span>
              </div>
              <div className="text-[10px] text-rose-200/80">
                {shiftState.tipoAgente === 'OPTIGO_AI' ? (
                  <span className="text-emerald-300 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>OptiGo Supervisor active: Safe rerouting in progress</span>
                  </span>
                ) : (
                  <span className="text-amber-200">
                    Critical delay and SLA penalty risk in Greedy baseline
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : isExtremeWeather ? (
        <div className="flex-1 bg-linear-to-r from-amber-950/60 to-yellow-900/40 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-3 shadow-lg flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-200 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Severe Weather Advisory</div>
            <div className="text-[10px] text-slate-300">
              High storm surge active across Monterrey. Customer demand and tips elevated.
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Active Scenario Info & Config Button */}
      {onOpenScenarioModal && (
        <button
          type="button"
          onClick={onOpenScenarioModal}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 sm:px-3 shadow-lg flex items-center justify-between gap-2.5 text-left transition-all group shrink-0 cursor-pointer"
          title="Change simulation events & scenario"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] text-slate-300 uppercase font-mono leading-none">Shift Events</div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                {currentScenario?.id === 'DEFAULT_MTY' && <Sparkles className="w-3 h-3 text-amber-400 fill-current" />}
                <span>{currentScenario ? currentScenario.name : 'Average Monterrey Day'}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-400/30 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
            Configure
          </span>
        </button>
      )}
    </div>
  );
}
