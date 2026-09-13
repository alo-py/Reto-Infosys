'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Navigation, LogOut, Lock, ShieldCheck } from 'lucide-react';
import OptiGoLogo from '@/public/Assets/OptiGo_Logo.png';
import { getAuthToken, getStoredUser, logoutUser, UserProfile } from '@/app/services/auth';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasToken, setHasToken] = useState(false);

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

  const handleLogout = () => {
    logoutUser();
    router.push('/');
  };

  // Safe SSR/Hydration fallback state
  const isAuth = mounted && hasToken;
  const isHomeActive = pathname === '/';
  const isDriverActive = pathname === '/driver';

  return (
    <nav className="bg-gradient-to-r from-gray-200/30 to-emerald-200/30 backdrop-blur-lg p-4 border border-white/30 rounded-b-4xl shadow-md w-full sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="text-white font-bold text-xl flex items-center hover:opacity-90 transition-opacity"
          >
            <Image
              src={OptiGoLogo}
              alt="OptiGo Logo"
              className="inline-block h-8 w-8 mr-2"
              priority
            />
            <span className="flex items-center gap-1.5">
              OptiGo
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-semibold border border-emerald-400/40">
                AI
              </span>
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/"
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                isHomeActive
                  ? 'text-white bg-white/20 font-bold'
                  : 'text-white/90 hover:bg-slate-200/30 hover:text-white'
              }`}
            >
              Home
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
                  <span>Driver App</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-800 animate-pulse ml-0.5" />
                </Link>

                {/* User Session Info & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user ? `${user.nombre} ${user.apellidos?.[0] || ''}.` : 'Courier'}
                    </span>
                    <span className="text-[10px] text-emerald-200 font-medium">
                      {user?.tipo_vehiculo || 'Driver'} • {user?.zona_base?.split(' ')[0] || 'MTY'}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white hover:bg-rose-500/25 hover:text-rose-100 transition-colors text-xs font-semibold cursor-pointer border border-white/10"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-300" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Driver App Link (Locked / Prompts Auth) */}
                <Link
                  href="/login?redirect=/driver"
                  title="Authentication required to launch driver cockpit"
                  className="bg-white/15 hover:bg-white/25 text-white font-medium px-3 py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 border border-white/20 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Driver App</span>
                </Link>

                {/* Default Login and Register Buttons */}
                <Link
                  href="/login"
                  className="text-white hover:bg-slate-200/30 hover:text-gray-800 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>

                <div className="flex items-center">
                  <Link href="/login">
                    <User
                      className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg cursor-pointer"
                      size={40}
                    />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
