'use client';

import { 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Snowflake, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';
import { ActiveShiftState } from './types';

interface WeatherAlertBannerProps {
  shiftState: ActiveShiftState;
}

export default function WeatherAlertBanner({ shiftState }: WeatherAlertBannerProps) {
  const isExtremeWeather =
    shiftState.clima.includes('TORMENTA') ||
    shiftState.clima.includes('GRANIZO') ||
    shiftState.temperatura >= 39;

  const hasIncident = !!shiftState.avenidaCerrada;

  // Icono del clima según descripción
  const getWeatherIcon = () => {
    if (shiftState.clima.includes('TORMENTA')) {
      return <CloudLightning className="w-4 h-4 text-amber-300 animate-bounce" />;
    }
    if (shiftState.clima.includes('LLUVIA')) {
      return <CloudRain className="w-4 h-4 text-cyan-300" />;
    }
    if (shiftState.clima.includes('GRANIZO')) {
      return <Snowflake className="w-4 h-4 text-blue-200 animate-spin" />;
    }
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* 1. Tarjeta Clima y Tarifa Dinámica (Surge) */}
      <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900/50 border border-white/15">
            {getWeatherIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{shiftState.clima.split(' (')[0]}</span>
              <span className="text-[11px] font-mono text-emerald-200">{shiftState.temperatura}°C</span>
            </div>
            <div className="text-[10px] text-slate-300">
              Tráfico vial: <strong className="text-white">{shiftState.factorTrafico}x</strong>
            </div>
          </div>
        </div>

        {/* Badge Surge Tarifa Dinámica */}
        {shiftState.factorSurge > 1.0 ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-linear-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/50 text-amber-200 text-xs font-black shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
            <span>{shiftState.factorSurge}x Surge</span>
          </div>
        ) : (
          <div className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-medium text-slate-300 border border-white/10">
            Tarifa Base 1.0x
          </div>
        )}
      </div>

      {/* 2. Indicador de Vía Cerrada o Accidente Vial */}
      {hasIncident ? (
        <div className="flex-1 bg-linear-to-r from-rose-950/70 to-red-900/50 backdrop-blur-xl border border-rose-400/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/30 text-rose-200 border border-rose-400/30 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🚧 Vía Bloqueada:</span>
                <span className="text-rose-200 underline decoration-rose-400 font-semibold">{shiftState.avenidaCerrada}</span>
              </div>
              <div className="text-[10px] text-rose-200/80">
                {shiftState.tipoAgente === 'OPTIGO_AI' ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Supervisor OptiGo activo: Desviando ruta por zonas seguras</span>
                  </span>
                ) : (
                  <span className="text-amber-200">
                    ⚠️ Riesgo de retraso crítico en agente Greedy
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
            <div className="text-xs font-bold text-white">Alerta Meteorológica Activa</div>
            <div className="text-[10px] text-slate-300">
              Condición climática severa en Monterrey. Demanda y tarifas elevadas.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
