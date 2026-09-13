'use client';

import { useState, useEffect } from 'react';
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
    Cpu,
    Lock,
    LogOut
} from 'lucide-react';
import { getAuthToken, getStoredUser, UserProfile } from '@/app/services/auth';

export default function HomePage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        setMounted(true);
        const syncAuth = () => {
            setHasToken(!!getAuthToken());
            setUser(getStoredUser());
        };
        syncAuth();
        window.addEventListener('optigo_auth_change', syncAuth);
        window.addEventListener('storage', syncAuth);
        return () => {
            window.removeEventListener('optigo_auth_change', syncAuth);
            window.removeEventListener('storage', syncAuth);
        };
    }, []);

    const isAuth = mounted && hasToken;

    // Estimated pricing model:
    // 1. DeepSeek API cost (dual agent: strategist + risk supervisor ~20k tokens/shift * 20 shifts = 400k tokens ~ $18 - $25 MXN/mo)
    // 2. Cloud compute infrastructure: Google OR-Tools solver + OSMnx road network server (~$80 - $110 MXN/mo)
    // 3. Platform maintenance and dedicated driver support
    const pricing = {
        starter: {
            name: 'Rider Starter',
            desc: 'For on-demand gig drivers looking for essential route and deadhead optimization.',
            monthlyPrice: 149,
            yearlyPrice: 119, // ~$1,428/yr
            features: [
                'Google OR-Tools combinatorial route optimization',
                'Anti-deadhead filter (drastically fewer unpaid km)',
                'Real-time municipal weather and rain forecasting',
                'Detailed on-time SLA breakdown per delivery'
            ]
        },
        autonomous: {
            name: 'OptiGo AI Autonomous',
            desc: 'Full dual-agent intelligence system to maximize earnings and eliminate SLA penalties.',
            monthlyPrice: 249,
            yearlyPrice: 199, // ~$2,388/yr
            popular: true,
            features: [
                'DeepSeek Dual-Agent System (Strategist + Risk Supervisor)',
                'Proactive rerouting around flooded avenues and severe storms',
                'Smart multi-order batching with zero cancellation risk',
                'Unlimited agentic deliberation tokens',
                'Priority support and automated fuel expense tracking'
            ]
        }
    };

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
                
                {/* ========================================================================= */}
                {/* MAIN PITCH CARD (Value Proposition, Features, Call to Action)            */}
                {/* ========================================================================= */}
                <section className="lg:col-span-7 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    {/* Subtle ambient light glows */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 border border-white/30 text-white backdrop-blur-md shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Dual-Agent Engine + Google OR-Tools</span>
                        </div>

                        {/* Heading and Tagline */}
                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                                Maximize your earnings with <span className="bg-linear-to-r from-emerald-200 via-emerald-300 to-teal-100 bg-clip-text text-transparent">OptiGo</span>
                            </h1>
                            <p className="text-lg sm:text-xl font-medium text-emerald-100/90 leading-snug">
                                Real-time autonomous routing copilot and decision intelligence for urban delivery riders.
                            </p>
                        </div>

                        {/* Core Application Description */}
                        <p className="text-slate-100/85 text-sm sm:text-base leading-relaxed">
                            Engineered specifically for gig economy couriers (Uber Eats, DiDi Food, Rappi). 
                            OptiGo solves complex pickup and delivery routing with time windows (<span className="font-semibold text-white">PDPTW</span>) 
                            and orchestrates a <span className="font-semibold text-white">DeepSeek dual-agent system (Strategist + Risk Supervisor)</span> that 
                            profitable groups orders (*batching*), slashes unpaid deadhead miles, and navigates around flooded 
                            avenues and traffic jams—protecting customer tips and eliminating late SLA penalties.
                        </p>

                        {/* Key Metrics Micro-Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">+61.1%</div>
                                    <div className="text-slate-200/80 text-xs mt-1">Net profit/shift</div>
                                </div>
                            </div>

                            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">0 Fines</div>
                                    <div className="text-slate-200/80 text-xs mt-1">SLA protection</div>
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

                    {/* Action Buttons */}
                    <div className="relative z-10 pt-8 mt-6 border-t border-white/20">
                        {isAuth ? (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/driver"
                                    className="flex-1 bg-linear-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-900 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                                >
                                    <span>Enter Driver Cockpit</span>
                                    <ArrowRight className="w-4 h-4 text-slate-900" />
                                </Link>

                                <div className="flex-1 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-2xl backdrop-blur-md flex items-center justify-center gap-2 text-center text-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Active Session: {user?.nombre || 'Courier'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href="/login?redirect=/driver"
                                        className="flex-1 bg-linear-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-900 font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                                    >
                                        <Lock className="w-4 h-4 text-slate-900" />
                                        <span>Sign In to Launch Cockpit</span>
                                    </Link>

                                    <Link
                                        href="/register"
                                        className="flex-1 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-2xl backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                                    >
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <span>Register as Courier</span>
                                    </Link>
                                </div>
                                <p className="text-[11px] text-amber-200/90 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                                    <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                    <span>Authentication required: Only authorized couriers can launch the live simulation engine.</span>
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* PRICING & COST BREAKDOWN CARD (DeepSeek & OR-Tools Transparency)          */}
                {/* ========================================================================= */}
                <section className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        {/* Tab Switcher (Monthly / Yearly) */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>Plans & Pricing</span>
                                </h2>
                                <span className="text-xs text-emerald-200/90 font-medium">ROI in &lt; 2 shifts</span>
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
                                    Monthly
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
                                    <span>Annual</span>
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400 text-slate-950">
                                        -20%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Cost Structure Transparency */}
                        <div className="bg-slate-900/35 border border-white/15 rounded-2xl p-4 backdrop-blur-md space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                                <Cpu className="w-3.5 h-3.5" />
                                <span>Estimated Cost Structure</span>
                            </div>
                            <p className="text-xs text-slate-200/85 leading-relaxed">
                                Subscription covers monthly <strong className="text-white">DeepSeek API</strong> tokens (structured JSON inference ~ $20 MXN/mo for ~60 decisions/shift) and high-performance <strong className="text-white">Google OR-Tools</strong> cloud servers with Monterrey OSMnx road matrices (~ $85 MXN/mo).
                            </p>
                        </div>

                        {/* Plan Cards */}
                        <div className="space-y-4">
                            {/* Autonomous Plan (Recommended) */}
                            <div className="relative bg-linear-to-b from-white/20 to-white/10 border-2 border-emerald-300/60 rounded-2xl p-5 shadow-xl">
                                <div className="absolute -top-3 right-4 bg-emerald-400 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                                    Recommended
                                </div>

                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="font-bold text-white text-lg">{pricing.autonomous.name}</h3>
                                    <div className="text-right">
                                        <span className="text-2xl sm:text-3xl font-black text-white">
                                            ${billingPeriod === 'monthly' ? pricing.autonomous.monthlyPrice : pricing.autonomous.yearlyPrice}
                                        </span>
                                        <span className="text-xs text-emerald-100 font-medium"> MXN/mo</span>
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
                                    href={isAuth ? "/driver" : "/register"}
                                    className="mt-4 w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                                >
                                    {isAuth ? (
                                        <>
                                            <span>Launch Autonomous Cockpit</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>Sign Up for Autonomous</span>
                                        </>
                                    )}
                                </Link>
                            </div>

                            {/* Starter Plan */}
                            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-white text-base">{pricing.starter.name}</h3>
                                    <div>
                                        <span className="text-xl font-black text-white">
                                            ${billingPeriod === 'monthly' ? pricing.starter.monthlyPrice : pricing.starter.yearlyPrice}
                                        </span>
                                        <span className="text-xs text-slate-300"> MXN/mo</span>
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
                                    href={isAuth ? "/driver" : "/register"}
                                    className="mt-3 w-full bg-white/15 hover:bg-white/25 text-white font-medium text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-all border border-white/20"
                                >
                                    {isAuth ? (
                                        <span>Launch Starter Cockpit</span>
                                    ) : (
                                        <span>Sign Up for Starter</span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 pt-4 mt-4 border-t border-white/15 text-center">
                        <p className="text-[11px] text-slate-300/80 flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Transparent billing with no long-term contracts. Cancel anytime.</span>
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}