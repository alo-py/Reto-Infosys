'use client';

import { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Flame, 
  Sliders, 
  RotateCcw,
  AlertTriangle,
  Car
} from 'lucide-react';
import { 
  ShiftScenarioConfig, 
  PRESET_SCENARIOS, 
  DEFAULT_MONTERREY_SCENARIO, 
  WeatherPreset, 
  TrafficLevel, 
  RoadClosureOption 
} from './scenarios';

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  currentScenario: ShiftScenarioConfig;
  onApplyScenario: (scenario: ShiftScenarioConfig) => void;
  onClose: () => void;
}

export default function ScenarioSelectorModal({
  isOpen,
  currentScenario,
  onApplyScenario,
  onClose,
}: ScenarioSelectorModalProps) {
  const [selectedConfig, setSelectedConfig] = useState<ShiftScenarioConfig>(currentScenario);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ShiftScenarioConfig) => {
    setSelectedConfig({ ...preset });
  };

  const handleCustomFieldChange = <K extends keyof ShiftScenarioConfig>(
    field: K,
    value: ShiftScenarioConfig[K]
  ) => {
    setSelectedConfig((prev) => ({
      ...prev,
      id: 'CUSTOM',
      name: 'Custom Shift Scenario',
      badge: '🛠️ Custom Environment',
      [field]: value,
    }));
  };

  const handleSave = () => {
    onApplyScenario(selectedConfig);
    onClose();
  };

  const handleResetToDefault = () => {
    setSelectedConfig(DEFAULT_MONTERREY_SCENARIO);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900/95 border border-white/20 rounded-4xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden my-auto">
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Shift Environment & Road Events</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Choose Workday Simulation Events
          </h2>
          <p className="text-xs text-slate-300">
            Configure weather conditions, traffic index, road closures, and demand surge for the Monterrey shift.
          </p>
        </div>

        {/* Preset Cards Selection */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Quick Scenario Presets
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_SCENARIOS.map((preset) => {
              const isSelected = selectedConfig.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400'
                      : 'bg-slate-950/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {preset.id === 'DEFAULT_MTY' && <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                      <span>{preset.name}</span>
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    {preset.description}
                  </p>
                  <span className="text-[10px] font-mono text-emerald-300/90 font-medium">
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Controls */}
        <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Event Parameters</span>
            </span>
            {selectedConfig.id === 'CUSTOM' && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-400/30">
                Customized
              </span>
            )}
          </div>

          {/* 1. Weather Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Weather Condition:</span>
              <span className="text-[11px] text-emerald-300 font-mono">
                {selectedConfig.weather === 'DEFAULT_DYNAMIC' && 'Dynamic Cycle (39°C Heat ➔ Storm ➔ Rain)'}
                {selectedConfig.weather === 'EXTREME_HEAT' && 'Extreme Heatwave (41°C)'}
                {selectedConfig.weather === 'SEVERE_STORM' && 'Severe Storm & Flood Risk (25°C)'}
                {selectedConfig.weather === 'LIGHT_RAIN' && 'Light Rain (28°C)'}
                {selectedConfig.weather === 'CLEAR_SUNNY' && 'Clear & Sunny (24°C)'}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { val: 'DEFAULT_DYNAMIC', label: 'Average Day (Cycle)', icon: Sparkles },
                { val: 'EXTREME_HEAT', label: 'Extreme Heat', icon: Sun },
                { val: 'SEVERE_STORM', label: 'Severe Storm', icon: CloudLightning },
                { val: 'LIGHT_RAIN', label: 'Light Rain', icon: CloudRain },
                { val: 'CLEAR_SUNNY', label: 'Clear & Sunny', icon: Sun },
              ].map(({ val, label, icon: Icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleCustomFieldChange('weather', val as WeatherPreset)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    selectedConfig.weather === val
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Traffic Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Traffic Congestion:</span>
              <span className="text-[11px] text-amber-300 font-mono">
                {selectedConfig.traffic === 'NORMAL' && 'Normal (1.05x speed)'}
                {selectedConfig.traffic === 'MODERATE' && 'Moderate (1.35x delay)'}
                {selectedConfig.traffic === 'SEVERE' && 'Severe (1.75x gridlock)'}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['NORMAL', 'MODERATE', 'SEVERE'] as TrafficLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleCustomFieldChange('traffic', level)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    selectedConfig.traffic === level
                      ? level === 'SEVERE'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                        : level === 'MODERATE'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{level === 'NORMAL' ? 'Normal' : level === 'MODERATE' ? 'Moderate' : 'Severe'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Road Closure / Blocked Corridors */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Blocked Avenue / Incident:</span>
              <span className="text-[11px] text-rose-300 font-mono">
                {selectedConfig.roadClosure === 'NONE' ? 'None (Clear roadways)' : selectedConfig.roadClosure}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['NONE', 'Av. Gonzalitos', 'Av. Constitución', 'Av. Morones Prieto', 'Blvd. Díaz Ordaz'] as RoadClosureOption[]).map((road) => (
                <button
                  key={road}
                  type="button"
                  onClick={() => handleCustomFieldChange('roadClosure', road)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    selectedConfig.roadClosure === road
                      ? road === 'NONE'
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md'
                        : 'bg-rose-600 text-white font-bold border-rose-400 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{road === 'NONE' ? 'None (Clear)' : road.replace('Av. ', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Surge Multiplier */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
              <span>Dynamic Fare Surge:</span>
              <span className="text-[11px] text-orange-300 font-mono font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400 fill-current" />
                <span>{selectedConfig.surgeMultiplier.toFixed(2)}x Dynamic Multiplier</span>
              </span>
            </label>
            <div className="flex items-center gap-2">
              {[1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleCustomFieldChange('surgeMultiplier', s)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    Math.abs(selectedConfig.surgeMultiplier - s) < 0.05
                      ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {s.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Average Monterrey Day</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply Scenario to Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}
