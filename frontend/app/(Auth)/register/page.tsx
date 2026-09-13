'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Bike,
  Car,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  registerUser,
  MONTERREY_BASE_ZONES,
  VEHICLE_CONFIGS,
  RegisterPayload,
} from '@/app/services/api';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    tipo_vehiculo: 'MOTO' as 'MOTO' | 'BICI' | 'AUTO',
    zona_base: MONTERREY_BASE_ZONES[0] as string,
    consumo_gasolina_km: 0.9,
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVehicleSelect = (type: 'MOTO' | 'BICI' | 'AUTO') => {
    setFormData((prev) => ({
      ...prev,
      tipo_vehiculo: type,
      consumo_gasolina_km: VEHICLE_CONFIGS[type].rate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      setErrorMessage('First and last name are required.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the terms of service.');
      return;
    }

    setLoading(true);

    const payload: RegisterPayload = {
      nombre: formData.nombre.trim(),
      apellidos: formData.apellidos.trim(),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono.trim() || undefined,
      tipo_vehiculo: formData.tipo_vehiculo,
      zona_base: formData.zona_base,
      consumo_gasolina_km: formData.consumo_gasolina_km,
      password: formData.password,
    };

    try {
      await registerUser(payload);
      setSuccessMessage('Courier account created successfully! Setting up your session...');
      setTimeout(() => {
        router.push('/driver');
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* Registration Card */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-950/40 relative">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Join OptiGo Courier Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create Courier Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Optimized route batching, weather awareness & zero unpaid kilometers
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="nombre"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Carlos"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="apellidos"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Last Name *
              </label>
              <input
                id="apellidos"
                type="text"
                required
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({ ...formData, apellidos: e.target.value })
                }
                placeholder="Hernández"
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="carlos@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="+52 81 1234 5678"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Vehicle Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Vehicle Type & Fuel Profile *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Motorcycle */}
              <button
                type="button"
                onClick={() => handleVehicleSelect('MOTO')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center ${
                  formData.tipo_vehiculo === 'MOTO'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500/40'
                    : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 mb-1.5">
                  <Bike className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold">Motorcycle</span>
                <span className="text-[10px] text-slate-400 mt-0.5">$0.90 /km</span>
              </button>

              {/* Bicycle */}
              <button
                type="button"
                onClick={() => handleVehicleSelect('BICI')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center ${
                  formData.tipo_vehiculo === 'BICI'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500/40'
                    : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 mb-1.5">
                  <Zap className="w-5 h-5 text-teal-400" />
                </div>
                <span className="text-xs font-bold">Bicycle / EV</span>
                <span className="text-[10px] text-slate-400 mt-0.5">$0.00 /km</span>
              </button>

              {/* Car */}
              <button
                type="button"
                onClick={() => handleVehicleSelect('AUTO')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center ${
                  formData.tipo_vehiculo === 'AUTO'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500/40'
                    : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 mb-1.5">
                  <Car className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs font-bold">Automobile</span>
                <span className="text-[10px] text-slate-400 mt-0.5">$1.40 /km</span>
              </button>
            </div>
          </div>

          {/* Section: Operational Base Zone */}
          <div>
            <label
              htmlFor="zona_base"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Base Operational Zone (Monterrey Metropolitan Area) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <select
                id="zona_base"
                value={formData.zona_base}
                onChange={(e) =>
                  setFormData({ ...formData, zona_base: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
              >
                {MONTERREY_BASE_ZONES.map((zone) => (
                  <option key={zone} value={zone} className="bg-slate-900 text-white">
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-slate-950/60 border-white/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 accent-emerald-500"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I agree to the{' '}
                <span className="text-emerald-400 underline underline-offset-2">
                  Terms of Service
                </span>{' '}
                and allow OptiGo to optimize my shifts using simulated municipal telemetry.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Courier...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Link to Login */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Already have a courier account?{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
