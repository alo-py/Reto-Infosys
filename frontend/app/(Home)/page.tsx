'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    Sparkles, 
    ArrowRight, 
    ShieldCheck, 
    TrendingUp, 
    Zap, 
    Check, 
    User,
    Clock,
    Cpu
} from 'lucide-react';

export default function HomePage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    // Cálculos de precios ficticios basados en:
    // 1. Costo API DeepSeek (dual agent: estratega + supervisor ~20k tokens/turno * 20 días = 400k tokens ~ $18 - $25 MXN/mes)
    // 2. Costo de infraestructura y cómputo Google OR-Tools + servidor de mapas OSMnx (~$80 - $110 MXN/mes)
    // 3. Margen y soporte de plataforma
    const pricing = {
        starter: {
            name: 'Rider Starter',
            desc: 'Para repartidores en conexión libre que buscan optimizar rutas básicas.',
            monthlyPrice: 149,
            yearlyPrice: 119, // ~$1,428 al año
            features: [
                'Optimización combinatoria Google OR-Tools',
                'Filtro anti-deadhead (menos km en vacío)',
                'Pronóstico meteorológico básico',
                'Auditoría y desglose de SLA en entregas'
            ]
        },
        autonomous: {
            name: 'OptiGo AI Autonomous',
            desc: 'Sistema agéntico dual completo para maximizar ganancias y blindar tu SLA.',
            monthlyPrice: 249,
            yearlyPrice: 199, // ~$2,388 al año
            popular: true,
            features: [
                'Sistema Dual DeepSeek (Estratega + Supervisor)',
                'Desvíos automáticos ante cierres viales y tormentas',
                'Batching multi-pedido sin riesgo de cancelación',
                'Tokens ilimitados de deliberación de IA',
                'Soporte prioritario y reportes fiscales de gasolina'
            ]
        }
    };

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
                
                {/* ========================================================================= */}
                {/* CARD PRINCIPAL (Información, Propuesta de Valor, Botones de Acción)      */}
                {/* ========================================================================= */}
                <section className="lg:col-span-7 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    {/* Brillo ambiental sutil */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        {/* Chip Superior */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 border border-white/30 text-white backdrop-blur-md shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Motor Agéntico Dual + Google OR-Tools</span>
                        </div>

                        {/* Título y Subtítulo */}
                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                                Multiplica tus ingresos con <span className="bg-linear-to-r from-emerald-200 via-emerald-300 to-teal-100 bg-clip-text text-transparent">OptiGo</span>
                            </h1>
                            <p className="text-lg sm:text-xl font-medium text-emerald-100/90 leading-snug">
                                Copiloto de ruteo autónomo y toma de decisiones en tiempo real para repartidores urbanos.
                            </p>
                        </div>

                        {/* Descripción de la aplicación */}
                        <p className="text-slate-100/85 text-sm sm:text-base leading-relaxed">
                            Diseñado específicamente para conductores en plataformas de delivery (Rappi, DiDi Food y Uber Eats). 
                            OptiGo resuelve el problema de ruteo con ventanas de tiempo (<span className="font-semibold text-white">PDPTW</span>) 
                            y utiliza un <span className="font-semibold text-white">sistema agéntico con DeepSeek (Estratega + Supervisor de Riesgo)</span> que 
                            agrupa pedidos de forma rentable (*batching*), elimina kilómetros en vacío (*deadhead*) y desvía tus rutas 
                            ante tormentas o avenidas bloqueadas, protegiendo tus propinas y evitando multas de SLA.
                        </p>

                        {/* Métricas clave en micro-cards glass */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">+61.1%</div>
                                    <div className="text-slate-200/80 text-xs mt-1">Ganancia neta/turno</div>
                                </div>
                            </div>

                            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">0 Multas</div>
                                    <div className="text-slate-200/80 text-xs mt-1">Protección de SLA</div>
                                </div>
                            </div>

                            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">Smart Batch</div>
                                    <div className="text-slate-200/80 text-xs mt-1">Google OR-Tools</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción (Registro y Login) */}
                    <div className="relative z-10 pt-8 mt-6 border-t border-white/20 flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/register"
                            className="flex-1 bg-linear-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-900 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                        >
                            <span>Crear Cuenta Gratis</span>
                            <ArrowRight className="w-4 h-4 text-slate-900" />
                        </Link>

                        <Link
                            href="/login"
                            className="flex-1 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-2xl backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                        >
                            <User className="w-4 h-4 text-white" />
                            <span>Iniciar Sesión</span>
                        </Link>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* CARD LATERAL (Precios, Desglose de Costo de DeepSeek y Tab de Suscripción)*/}
                {/* ========================================================================= */}
                <section className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    {/* Brillo ambiental */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        {/* Selector Tab (Mensual / Anual) */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>Planes y Precios</span>
                                </h2>
                                <span className="text-xs text-emerald-200/90 font-medium">ROI en &lt; 2 turnos</span>
                            </div>

                            <div className="bg-slate-950/30 p-1.5 rounded-2xl flex items-center border border-white/15 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setBillingPeriod('monthly')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                                        billingPeriod === 'monthly'
                                            ? 'bg-white/25 text-white shadow-md border border-white/30'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    Mensual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingPeriod('yearly')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                        billingPeriod === 'yearly'
                                            ? 'bg-white/25 text-white shadow-md border border-white/30'
                                            : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    <span>Anual</span>
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400 text-slate-950">
                                        -20%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Desglose explicativo de costos (Cómputo OR-Tools + API DeepSeek) */}
                        <div className="bg-slate-900/35 border border-white/15 rounded-2xl p-4 backdrop-blur-md space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                                <Cpu className="w-3.5 h-3.5" />
                                <span>Estructura de Costos Estimada</span>
                            </div>
                            <p className="text-xs text-slate-200/85 leading-relaxed">
                                El precio mensual cubre el consumo de la <strong className="text-white">API de DeepSeek</strong> (inferencia en modo JSON estructurado ~ $20 MXN/mes en ~60 decisiones agénticas/turno) y el servidor de <strong className="text-white">Google OR-Tools</strong> con grafo vial OSMnx (~ $85 MXN/mes).
                            </p>
                        </div>

                        {/* Planes */}
                        <div className="space-y-4">
                            {/* Plan Autónomo (Recomendado) */}
                            <div className="relative bg-linear-to-b from-white/20 to-white/10 border-2 border-emerald-300/60 rounded-2xl p-5 shadow-xl">
                                <div className="absolute -top-3 right-4 bg-emerald-400 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                                    Recomendado
                                </div>

                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="font-bold text-white text-lg">{pricing.autonomous.name}</h3>
                                    <div className="text-right">
                                        <span className="text-2xl sm:text-3xl font-black text-white">
                                            ${billingPeriod === 'monthly' ? pricing.autonomous.monthlyPrice : pricing.autonomous.yearlyPrice}
                                        </span>
                                        <span className="text-xs text-emerald-100 font-medium"> MXN/mes</span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-200/90 mb-3">{pricing.autonomous.desc}</p>

                                <ul className="space-y-2 text-xs text-slate-100">
                                    {pricing.autonomous.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className="mt-4 w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                                >
                                    <span>Elegir Plan Autónomo</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {/* Plan Básico */}
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-white text-base">{pricing.starter.name}</h3>
                                    <div>
                                        <span className="text-xl font-black text-white">
                                            ${billingPeriod === 'monthly' ? pricing.starter.monthlyPrice : pricing.starter.yearlyPrice}
                                        </span>
                                        <span className="text-xs text-slate-300"> MXN/mes</span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 mb-2.5">{pricing.starter.desc}</p>

                                <ul className="space-y-1.5 text-xs text-slate-200">
                                    {pricing.starter.features.slice(0, 3).map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className="mt-3 w-full bg-white/15 hover:bg-white/25 text-white font-medium text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-all border border-white/20"
                                >
                                    <span>Seleccionar Starter</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Pie de precios */}
                    <div className="relative z-10 pt-4 mt-4 border-t border-white/15 text-center">
                        <p className="text-[11px] text-slate-300/80 flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Facturación transparente sin plazos forzosos. Cancela en cualquier momento.</span>
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}