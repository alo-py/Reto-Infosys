'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  User, 
  Navigation, 
  LogOut, 
  Lock, 
  ShieldCheck, 
  Menu, 
  X, 
  Globe, 
  ChevronDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import OptiGoLogo from '@/public/Assets/OptiGo_Logo.png';
import { getAuthToken, getStoredUser, logoutUser, UserProfile } from '@/app/services/auth';
import { useLanguage, Language } from '@/app/context/LanguageContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSidenavOpen, setIsSidenavOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncAuth = () => {
      const token = getAuthToken();
      const stored = getStoredUser();
      setHasToken(!!token);
      setUser(stored);
    };

    syncAuth();
    window.addEventListener('optigo_auth_change', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('optigo_auth_change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Close sidenav on route change or ESC key
  useEffect(() => {
    setIsSidenavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidenavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsSidenavOpen(false);
    router.push('/');
  };

  // Safe SSR/Hydration fallback state
  const isAuth = mounted && hasToken;
  const isHomeActive = pathname === '/';
  const isDriverActive = pathname === '/driver';

  return (
    <>
      <nav className="bg-gradient-to-r from-gray-200/30 to-emerald-200/30 backdrop-blur-lg p-3 sm:p-4 border border-white/30 rounded-b-4xl shadow-md w-full sticky top-0 z-40">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link
              href="/"
              className="text-white font-bold text-lg sm:text-xl flex items-center hover:opacity-90 transition-opacity"
            >
              <Image
                src={OptiGoLogo}
                alt="OptiGo Logo"
                className="inline-block h-8 w-8 mr-2 object-contain"
                priority
              />
              <span className="flex items-center gap-1.5">
                OptiGo
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-semibold border border-emerald-400/40">
                  AI
                </span>
              </span>
            </Link>

            {/* Nav Items & Sidenav Trigger */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Home link on medium+ screens */}
              <Link
                href="/"
                className={`hidden sm:inline-flex p-2 rounded-lg text-sm font-medium transition-colors ${
                  isHomeActive
                    ? 'text-white bg-white/20 font-bold'
                    : 'text-white/90 hover:bg-slate-200/30 hover:text-white'
                }`}
              >
                {t('nav.home')}
              </Link>

              {/* DYNAMIC AUTH COMPONENT: Logged In vs Default */}
              {isAuth ? (
                <>
                  {/* Driver App Link (Active) */}
                  <Link
                    href="/driver"
                    className={`font-bold px-3 py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] ${
                      isDriverActive
                        ? 'bg-emerald-300 text-slate-950 ring-2 ring-emerald-200 shadow-emerald-500/30'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t('nav.driverApp')}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-800 animate-pulse ml-0.5" />
                  </Link>

                  {/* User Session Info & Logout */}
                  <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/20">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold text-white leading-tight">
                        {user ? `${user.nombre} ${user.apellidos?.[0] || ''}.` : 'Courier'}
                      </span>
                      <span className="text-[10px] text-emerald-200 font-medium">
                        {user?.tipo_vehiculo || 'Driver'} • {user?.zona_base?.split(' ')[0] || 'MTY'}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      title={t('nav.signOut')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-rose-500/25 hover:text-rose-100 transition-colors text-xs font-semibold cursor-pointer border border-white/10"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-300" />
                      <span>{t('nav.signOut')}</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Driver App Link (Locked / Prompts Auth) */}
                  <Link
                    href="/login?redirect=/driver"
                    title="Authentication required to launch driver cockpit"
                    className="hidden sm:flex bg-white/15 hover:bg-white/25 text-white font-medium px-3 py-2 rounded-xl text-xs md:text-sm items-center gap-1.5 border border-white/20 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{t('nav.driverApp')}</span>
                  </Link>

                  {/* Default Login and Register Buttons */}
                  <Link
                    href="/login"
                    className="text-white hover:bg-slate-200/30 hover:text-gray-800 px-2.5 sm:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                  >
                    {t('nav.signIn')}
                  </Link>

                  <Link
                    href="/register"
                    className="hidden sm:flex bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs md:text-sm items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('nav.register')}</span>
                  </Link>
                </>
              )}

              {/* Language pill indicator & Sidenav trigger */}
              <button
                onClick={() => setIsSidenavOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm"
                title={`${t('nav.language')}: ${language.toUpperCase()}`}
                aria-label={t('nav.menu')}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <span className="uppercase tracking-wider font-mono">{language}</span>
                <span className="hidden sm:inline text-white/50">|</span>
                <Menu className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* SIDENAV / OFFCANVAS DRAWER                                                */}
      {/* ========================================================================= */}
      {isSidenavOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidenavOpen(false)}
            aria-hidden="true"
          />

          {/* Sidenav Panel */}
          <aside
            className="fixed inset-y-0 right-0 max-w-full flex pl-10"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.sidenavTitle')}
          >
            <div className="w-screen max-w-sm bg-slate-900/95 backdrop-blur-2xl border-l border-white/15 shadow-2xl text-white flex flex-col justify-between p-6">
              
              {/* TOP HEADER */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={OptiGoLogo}
                      alt="OptiGo Logo"
                      className="h-8 w-8 object-contain"
                    />
                    <div>
                      <div className="text-base font-black text-white flex items-center gap-1.5 leading-none">
                        OptiGo
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/40">
                          AI
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {t('nav.sidenavTitle')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSidenavOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={t('nav.closeMenu')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* =============================================================== */}
                {/* SELECTOR DE IDIOMAS (SELECT DENTRO DEL SIDENAV)                 */}
                {/* =============================================================== */}
                <div className="bg-slate-950/70 border border-emerald-500/35 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="sidenav-language-select"
                      className="flex items-center gap-2 text-xs font-bold text-white tracking-wide"
                    >
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>{t('nav.language')}</span>
                    </label>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                      {language.toUpperCase()}
                    </span>
                  </div>

                  {/* The Select Menu */}
                  <div className="relative">
                    <select
                      id="sidenav-language-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full appearance-none bg-slate-900 border border-white/20 hover:border-emerald-400/70 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all cursor-pointer pr-10 shadow-inner"
                      aria-label={t('nav.selectLanguage')}
                    >
                      {supportedLanguages.map((lang) => (
                        <option
                          key={lang.code}
                          value={lang.code}
                          className="bg-slate-900 text-white py-1.5"
                        >
                          {lang.flag} {lang.nativeName} ({lang.code.toUpperCase()})
                        </option>
                      ))}
                    </select>

                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t('nav.languageHelp')}
                  </p>
                </div>

                {/* QUICK NAVIGATION LINKS */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    {t('nav.quickLinks')}
                  </div>

                  <Link
                    href="/"
                    onClick={() => setIsSidenavOpen(false)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                      isHomeActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{t('nav.home')}</span>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                  </Link>

                  <Link
                    href="/driver"
                    onClick={() => setIsSidenavOpen(false)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                      isDriverActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>{t('nav.driverApp')}</span>
                    </span>
                    {isAuth ? (
                      <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                        Live
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                    )}
                  </Link>
                </div>
              </div>

              {/* BOTTOM SECTION: USER AUTH OR LOGIN/REGISTER */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                {isAuth ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-sm">
                        {user?.nombre?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {user ? `${user.nombre} ${user.apellidos || ''}` : 'Courier'}
                        </div>
                        <div className="text-xs text-emerald-300 font-medium">
                          {user?.tipo_vehiculo || 'Driver'} • {user?.zona_base || 'Monterrey'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-300" />
                      <span>{t('nav.signOut')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Link
                      href="/login"
                      onClick={() => setIsSidenavOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold text-center block transition-colors"
                    >
                      {t('nav.signIn')}
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setIsSidenavOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-bold text-center block transition-all shadow-md"
                    >
                      {t('nav.register')}
                    </Link>
                  </div>
                )}

                <div className="text-center text-[10px] text-slate-500 pt-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{t('nav.versionTag')}</span>
                </div>
              </div>

            </div>
          </aside>
        </div>
      )}
    </>
  );
}

