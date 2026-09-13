'use client';

import { useState } from 'react';
import { 
  Package, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  DollarSign,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Bot,
  UserCheck,
  Fuel,
  Info
} from 'lucide-react';
import { ActiveShiftState, DriverDirectives } from './types';

interface ActiveOrderCardProps {
  shiftState: ActiveShiftState;
  onAcceptOffer?: () => void;
  onRejectOffer?: () => void;
  onUpdateDirectives?: (newDirectives: DriverDirectives) => void;
}

export default function ActiveOrderCard({ 
  shiftState,
  onAcceptOffer,
  onRejectOffer,
  onUpdateDirectives
}: ActiveOrderCardProps) {
  const [activeTab, setActiveTab] = useState<'DELIVERY' | 'COPILOT'>('DELIVERY');
  const orden = shiftState.ordenActiva;
  const oferta = shiftState.ofertaPendiente;
  const directives = shiftState.directives;

  // Handle directive toggles
  const handleToggleAutonomy = () => {
    if (!onUpdateDirectives) return;
    const nextMode = directives.autonomyMode === 'AUTONOMOUS' ? 'COPILOT' : 'AUTONOMOUS';
    onUpdateDirectives({
      ...directives,
      autonomyMode: nextMode,
    });
  };

  const handleToggleBatches = () => {
    if (!onUpdateDirectives) return;
    onUpdateDirectives({
      ...directives,
      allowBatches: !directives.allowBatches,
    });
  };

  const handleToggleFloods = () => {
    if (!onUpdateDirectives) return;
    onUpdateDirectives({
      ...directives,
      avoidFloodedAvenues: !directives.avoidFloodedAvenues,
    });
  };

  const handleDeadheadChange = (val: number) => {
    if (!onUpdateDirectives) return;
    onUpdateDirectives({
      ...directives,
      maxDeadheadKm: val,
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Top Card Header with Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/50 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('DELIVERY')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'DELIVERY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Order & Trip</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COPILOT')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'COPILOT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Co-Pilot & Directives</span>
          </button>
        </div>

        {/* Autonomy Mode Badge */}
        <button
          type="button"
          onClick={handleToggleAutonomy}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
            directives.autonomyMode === 'COPILOT'
              ? 'bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30'
              : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30'
          }`}
          title="Click to toggle between Autonomous and Co-Pilot mode"
        >
          {directives.autonomyMode === 'COPILOT' ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Co-Pilot (Manual)</span>
            </>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>100% Auto-Pilot</span>
            </>
          )}
        </button>
      </div>

      {/* TAB 1: ORDER & TRIP INFO (Active Order, Incoming Offer, or Idle Search) */}
      {activeTab === 'DELIVERY' && (
        <>
          {/* CASE A: INCOMING OFFER PENDING DECISION (Co-Pilot Mode) */}
          {oferta && !orden && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Incoming Order Offer</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {oferta.tipo === 'BATCH' ? 'Smart Dual Batch (2 Deliveries)' : 'Single Order Delivery'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-white flex items-center justify-end gap-0.5">
                    <DollarSign className="w-5 h-5 text-emerald-300" />
                    <span>${oferta.tarifaTotal.toFixed(2)}</span>
                    <span className="text-xs text-slate-300 font-normal">MXN</span>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-medium flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>~${oferta.rentabilidadEstimadaHr}/hr yield</span>
                  </div>
                </div>
              </div>

              {/* Waypoint summary */}
              <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 text-xs space-y-1.5 font-sans">
                <div className="flex justify-between text-slate-300">
                  <span>Pickup: <strong className="text-white">{oferta.origen}</strong></span>
                  <span>Destination: <strong className="text-white">{oferta.destino}</strong></span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 border-t border-white/10 pt-1">
                  <span>Total Distance: <strong className="text-slate-200">{oferta.distanciaKmTotal} km</strong></span>
                  <span>Deadhead: <strong className="text-sky-300">{oferta.kmVacioViaje} km</strong></span>
                  <span>Est. Time: <strong className="text-slate-200">{oferta.duracionViaje} min</strong></span>
                </div>
              </div>

              {/* AI Recommendation Banner */}
              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                oferta.recomendacionIA === 'ACEPTAR'
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-100'
                  : 'bg-rose-500/15 border-rose-400/30 text-rose-100'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DeepSeek AI Deliberation:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${
                    oferta.recomendacionIA === 'ACEPTAR' ? 'bg-emerald-400/30 text-emerald-200' : 'bg-rose-400/30 text-rose-200'
                  }`}>
                    {oferta.recomendacionIA}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200/90 leading-relaxed font-sans">
                  {oferta.motivoIA}
                </p>
              </div>

              {/* Accept / Reject Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onAcceptOffer}
                  className="flex-1 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Accept Order</span>
                </button>

                <button
                  type="button"
                  onClick={onRejectOffer}
                  className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-300" />
                  <span>Reject / Skip</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE B: ACTIVE IN-TRANSIT ORDER */}
          {orden && (
            <div className="space-y-4 animate-fade-in">
              {/* Order Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {orden.tipo === 'BATCH' ? (
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

              {/* Waypoints Sequence */}
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

                {orden.tipo === 'BATCH' && orden.paradasSecuencia.length >= (orden.hasPickupTransition ? 4 : 3) && (
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
                      {orden.tipo === 'BATCH' ? 'Drop-off 2 (Customer B - Final):' : 'Destination (Drop-off):'}
                    </span>
                    <div className="font-semibold text-white">{orden.destino}</div>
                  </div>
                </div>

                {orden.distanciaKmTotal && (
                  <div className="pt-1 text-[10px] text-slate-300 font-mono flex items-center gap-2">
                    <span>Route: <strong>{orden.distanciaKmTotal} km</strong></span>
                    {orden.kmVacioViaje ? (
                      <span className="text-sky-300">• ({orden.kmVacioViaje} km deadhead)</span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Deliberation Explanation */}
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
          )}

          {/* CASE C: IDLE SEARCHING NEARBY ORDERS */}
          {!orden && !oferta && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Package className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Searching Nearby Orders</div>
                    <div className="text-xs text-slate-300">
                      Current zone: <strong className="text-emerald-200">{shiftState.ubicacionActual}</strong>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 animate-pulse">
                  Available
                </div>
              </div>

              {/* Interactive Co-Pilot Activation Callout */}
              {directives.autonomyMode === 'AUTONOMOUS' ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-linear-to-r from-purple-500/20 to-indigo-500/10 border border-purple-400/40 text-xs shadow-sm">
                  <div className="flex items-center gap-2 text-purple-200">
                    <UserCheck className="w-4 h-4 text-purple-300 shrink-0" />
                    <span>Want manual control to accept or reject incoming orders?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutonomy}
                    className="px-3 py-1.5 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-purple-950/40 shrink-0 flex items-center gap-1.5"
                  >
                    <span>Activate Co-Pilot Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-purple-500/20 border border-purple-400/50 text-xs text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0" />
                    <span>
                      <strong className="text-purple-200">Co-Pilot Mode Active:</strong> Simulation will pause upon next order ping for your manual approval.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutonomy}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-semibold rounded-xl text-[11px] transition-all shrink-0"
                  >
                    Switch to Auto-Pilot
                  </button>
                </div>
              )}

              <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 text-xs space-y-1 text-slate-300 font-sans">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Dispatch Directives:</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  • Mode: <strong className={directives.autonomyMode === 'COPILOT' ? 'text-purple-300' : 'text-emerald-300'}>{directives.autonomyMode}</strong> • Batches: <strong>{directives.allowBatches ? 'Enabled' : 'Disabled'}</strong> • Max Deadhead: <strong>{directives.maxDeadheadKm} km</strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: COPILOT DIRECTIVES & CONTROLS */}
      {activeTab === 'COPILOT' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Driver Policy & Autonomy Directives</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Configure how OptiGo AI filters incoming delivery pings and optimizes your route across Monterrey.
            </p>
          </div>

          {/* Autonomy Mode Switch */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-white text-xs">Decision Autonomy Mode</span>
                <p className="text-[10px] text-slate-300 font-sans">
                  {directives.autonomyMode === 'AUTONOMOUS' 
                    ? 'AI automatically accepts optimal orders using OR-Tools'
                    : 'AI pauses and presents offer with recommendation for your approval'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutonomy}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs border ${
                  directives.autonomyMode === 'COPILOT'
                    ? 'bg-purple-500 text-slate-950 border-purple-400'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400'
                }`}
              >
                {directives.autonomyMode === 'COPILOT' ? '🤝 Co-Pilot' : '⚡ Auto-Pilot'}
              </button>
            </div>
          </div>

          {/* Smart Batching Directive */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-white text-xs">Allow Dual Smart Batches</span>
              <p className="text-[10px] text-slate-300 font-sans">Chain 2 orders simultaneously to maximize $/hr revenue</p>
            </div>
            <button
              type="button"
              onClick={handleToggleBatches}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                directives.allowBatches ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                directives.allowBatches ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Max Deadhead Distance Slider */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs">Anti-Deadhead Maximum Distance</span>
              <span className="font-mono text-emerald-300 font-bold">{directives.maxDeadheadKm} km</span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans">
              Reject orders requiring relocation pickup greater than this limit to save fuel.
            </p>
            <input
              type="range"
              min={2.0}
              max={10.0}
              step={0.5}
              value={directives.maxDeadheadKm}
              onChange={(e) => handleDeadheadChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>2.0 km (Strict)</span>
              <span>6.0 km (Balanced)</span>
              <span>10.0 km (Permissive)</span>
            </div>
          </div>

          {/* Flooded Passage Avoidance Toggle */}
          <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-white text-xs">Supervisor Weather Detour Veto</span>
              <p className="text-[10px] text-slate-300 font-sans">Automatically detour around blocked underpasses (Gonzalitos, Constitución)</p>
            </div>
            <button
              type="button"
              onClick={handleToggleFloods}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                directives.avoidFloodedAvenues ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                directives.avoidFloodedAvenues ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
