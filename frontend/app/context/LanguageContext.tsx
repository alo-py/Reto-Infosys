'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en' | 'pt';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
];

export const translations = {
  es: {
    nav: {
      home: 'Inicio',
      driverApp: 'Driver App',
      signIn: 'Iniciar Sesión',
      register: 'Registrarse',
      signOut: 'Cerrar Sesión',
      menu: 'Menú',
      sidenavTitle: 'Panel de Navegación',
      settings: 'Configuración',
      language: 'Idioma del Sistema',
      selectLanguage: 'Seleccionar idioma',
      languageHelp: 'Elige tu idioma preferido. La interfaz se actualizará inmediatamente.',
      activeDriver: 'Conductor Activo',
      quickLinks: 'Accesos Directos',
      sessionInfo: 'Sesión Actual',
      roleDriver: 'Conductor',
      closeMenu: 'Cerrar menú',
      versionTag: 'Versión HackMTY 2026',
    },
    home: {
      engineBadge: 'Motor Dual-Agent + Google OR-Tools',
      heroTitle: 'Maximiza tus ganancias con',
      heroSubtitle: 'Copiloto de ruteo autónomo e inteligencia de decisiones en tiempo real para repartidores urbanos.',
      heroDescription: 'Diseñado específicamente para repartidores de la economía gig (Uber Eats, DiDi Food, Rappi). OptiGo resuelve el ruteo complejo de recolección y entrega con ventanas de tiempo (PDPTW) y orquesta un sistema dual de agentes DeepSeek (Estratega + Supervisor de Riesgo) que agrupa pedidos rentables (batching), reduce drásticamente los kilómetros muertos sin pago y evita avenidas inundadas y atascos de tráfico—protegiendo propinas y eliminando multas por retrasos.',
      statProfit: '+61.1%',
      statProfitDesc: 'Ganancia neta/turno',
      statFines: '0 Multas',
      statFinesDesc: 'Protección de SLA',
      statBatch: 'Lotes Inteligentes',
      statBatchDesc: 'Google OR-Tools',
      btnEnterCockpit: 'Entrar a la Cabina del Conductor',
      activeSession: 'Sesión Activa',
      btnSignInCockpit: 'Iniciar Sesión para Abrir Cabina',
      btnRegisterCourier: 'Registrarse como Repartidor',
      authNotice: 'Autenticación requerida: Solo conductores autorizados pueden ejecutar la simulación en tiempo real.',
      pricingTitle: 'Planes y Tarifas',
      pricingRoi: 'ROI en < 2 turnos',
      monthly: 'Mensual',
      annual: 'Anual',
      discountBadge: '-20%',
      costStructureTitle: 'Estructura de Costos Estimada',
      costStructureDesc: 'La suscripción cubre tokens mensuales de DeepSeek API (~$20 MXN/mes para ~60 decisiones/turno) y cómputo de alto rendimiento con matrices de Monterrey en Google OR-Tools (~$85 MXN/mes).',
      planAutonomous: 'OptiGo AI Autónomo',
      planAutonomousDesc: 'Sistema dual de inteligencia para maximizar ganancias y eliminar multas de SLA.',
      planStarter: 'Rider Starter',
      planStarterDesc: 'Para conductores independientes que buscan optimización esencial de rutas y menos kilómetros muertos.',
      btnLaunchAutonomous: 'Lanzar Cabina Autónoma',
      btnSignupAutonomous: 'Contratar Plan Autónomo',
      btnLaunchStarter: 'Lanzar Cabina Starter',
      btnSignupStarter: 'Contratar Plan Starter',
      recommended: 'Recomendado',
      perMonth: 'MXN/mes',
      pricingGuarantee: 'Facturación transparente y sin contratos forzosos. Cancela en cualquier momento.',
    },
    common: {
      loading: 'Cargando...',
      backToHome: 'Regresar al Inicio',
      welcome: 'Bienvenido',
    }
  },
  en: {
    nav: {
      home: 'Home',
      driverApp: 'Driver App',
      signIn: 'Sign In',
      register: 'Register',
      signOut: 'Sign Out',
      menu: 'Menu',
      sidenavTitle: 'Navigation Drawer',
      settings: 'Settings',
      language: 'System Language',
      selectLanguage: 'Select language',
      languageHelp: 'Choose your preferred language. The interface will update immediately.',
      activeDriver: 'Active Courier',
      quickLinks: 'Quick Links',
      sessionInfo: 'Active Session',
      roleDriver: 'Driver',
      closeMenu: 'Close menu',
      versionTag: 'HackMTY 2026 Edition',
    },
    home: {
      engineBadge: 'Dual-Agent Engine + Google OR-Tools',
      heroTitle: 'Maximize your earnings with',
      heroSubtitle: 'Real-time autonomous routing copilot and decision intelligence for urban delivery riders.',
      heroDescription: 'Engineered specifically for gig economy couriers (Uber Eats, DiDi Food, Rappi). OptiGo solves complex pickup and delivery routing with time windows (PDPTW) and orchestrates a DeepSeek dual-agent system (Strategist + Risk Supervisor) that profitably groups orders (batching), slashes unpaid deadhead miles, and navigates around flooded avenues and traffic jams—protecting customer tips and eliminating late SLA penalties.',
      statProfit: '+61.1%',
      statProfitDesc: 'Net profit/shift',
      statFines: '0 Fines',
      statFinesDesc: 'SLA protection',
      statBatch: 'Smart Batch',
      statBatchDesc: 'Google OR-Tools',
      btnEnterCockpit: 'Enter Driver Cockpit',
      activeSession: 'Active Session',
      btnSignInCockpit: 'Sign In to Launch Cockpit',
      btnRegisterCourier: 'Register as Courier',
      authNotice: 'Authentication required: Only authorized couriers can launch the live simulation engine.',
      pricingTitle: 'Plans & Pricing',
      pricingRoi: 'ROI in < 2 shifts',
      monthly: 'Monthly',
      annual: 'Annual',
      discountBadge: '-20%',
      costStructureTitle: 'Estimated Cost Structure',
      costStructureDesc: 'Subscription covers monthly DeepSeek API tokens (~$20 MXN/mo for ~60 decisions/shift) and high-performance Google OR-Tools cloud servers with Monterrey OSMnx matrices (~$85 MXN/mo).',
      planAutonomous: 'OptiGo AI Autonomous',
      planAutonomousDesc: 'Full dual-agent intelligence system to maximize earnings and eliminate SLA penalties.',
      planStarter: 'Rider Starter',
      planStarterDesc: 'For on-demand gig drivers looking for essential route and deadhead optimization.',
      btnLaunchAutonomous: 'Launch Autonomous Cockpit',
      btnSignupAutonomous: 'Sign Up for Autonomous',
      btnLaunchStarter: 'Launch Starter Cockpit',
      btnSignupStarter: 'Sign Up for Starter',
      recommended: 'Recommended',
      perMonth: 'MXN/mo',
      pricingGuarantee: 'Transparent billing with no long-term contracts. Cancel anytime.',
    },
    common: {
      loading: 'Loading...',
      backToHome: 'Back to Home',
      welcome: 'Welcome',
    }
  },
  pt: {
    nav: {
      home: 'Início',
      driverApp: 'Driver App',
      signIn: 'Entrar',
      register: 'Cadastrar',
      signOut: 'Sair',
      menu: 'Menu',
      sidenavTitle: 'Painel de Navegação',
      settings: 'Configurações',
      language: 'Idioma do Sistema',
      selectLanguage: 'Selecionar idioma',
      languageHelp: 'Escolha o seu idioma de preferência. A interface atualizará instantaneamente.',
      activeDriver: 'Entregador Ativo',
      quickLinks: 'Links Rápidos',
      sessionInfo: 'Sessão Atual',
      roleDriver: 'Motorista',
      closeMenu: 'Fechar menu',
      versionTag: 'Edição HackMTY 2026',
    },
    home: {
      engineBadge: 'Motor Dual-Agent + Google OR-Tools',
      heroTitle: 'Maximize seus ganhos com',
      heroSubtitle: 'Copiloto de rotas autônomas e inteligência de decisões em tempo real para entregadores urbanos.',
      heroDescription: 'Desenvolvido especificamente para entregadores de plataformas (Uber Eats, DiDi Food, Rappi). O OptiGo resolve o roteamento complexo de coleta e entrega com janelas de tempo (PDPTW) e orquestra um sistema de agente duplo DeepSeek (Estrategista + Supervisor de Risco) que agrupa pedidos com lucro (batching), reduz drasticamente km ociosos e contorna avenidas alagadas e engarrafamentos.',
      statProfit: '+61.1%',
      statProfitDesc: 'Lucro líquido/turno',
      statFines: '0 Multas',
      statFinesDesc: 'Proteção de SLA',
      statBatch: 'Lotes Inteligentes',
      statBatchDesc: 'Google OR-Tools',
      btnEnterCockpit: 'Entrar na Cabine do Entregador',
      activeSession: 'Sessão Ativa',
      btnSignInCockpit: 'Entrar para Abrir a Cabine',
      btnRegisterCourier: 'Cadastrar-se como Entregador',
      authNotice: 'Autenticação necessária: Apenas entregadores autorizados podem iniciar o simulador.',
      pricingTitle: 'Planos e Preços',
      pricingRoi: 'ROI em < 2 turnos',
      monthly: 'Mensal',
      annual: 'Anual',
      discountBadge: '-20%',
      costStructureTitle: 'Estrutura de Custos Estimada',
      costStructureDesc: 'A assinatura cobre tokens mensais da API DeepSeek (~$20 MXN/mês para ~60 decisões/turno) e servidores Google OR-Tools com matrizes de Monterrey (~$85 MXN/mês).',
      planAutonomous: 'OptiGo AI Autônomo',
      planAutonomousDesc: 'Sistema completo de inteligência dual para maximizar lucros e evitar penalidades.',
      planStarter: 'Rider Starter',
      planStarterDesc: 'Para motoristas que buscam otimização essencial de rotas e menos viagens sem carga.',
      btnLaunchAutonomous: 'Iniciar Cabine Autônoma',
      btnSignupAutonomous: 'Assinar Plano Autônomo',
      btnLaunchStarter: 'Iniciar Cabine Starter',
      btnSignupStarter: 'Assinar Plano Starter',
      recommended: 'Recomendado',
      perMonth: 'MXN/mês',
      pricingGuarantee: 'Cobrança transparente sem fidelidade. Cancele quando quiser.',
    },
    common: {
      loading: 'Carregando...',
      backToHome: 'Voltar ao Início',
      welcome: 'Bem-vindo',
    }
  }
};

type DeepKey<T> = T extends object
  ? { [K in keyof T]-?: K extends string ? `${K}` | `${K}.${DeepKey<T[K]>}` : never }[keyof T]
  : never;

export type TranslationKey = DeepKey<typeof translations.es>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (_key: string, fallback?: string) => fallback || _key,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

const STORAGE_KEY = 'optigo_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
        setLanguageState(saved);
      } else {
        // Detect browser language if available
        const browserLang = navigator.language?.slice(0, 2);
        if (browserLang === 'es' || browserLang === 'en' || browserLang === 'pt') {
          setLanguageState(browserLang);
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'es' || e.newValue === 'en' || e.newValue === 'pt') {
          setLanguageState(e.newValue);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && (customEvent.detail === 'es' || customEvent.detail === 'en' || customEvent.detail === 'pt')) {
        setLanguageState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('optigo_language_change', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('optigo_language_change', handleCustomEvent);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent('optigo_language_change', { detail: lang }));
    } catch {
      // Storage unavailable
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    const activeDict = translations[language] || translations.es;
    
    let current: unknown = activeDict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        current = undefined;
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    // Fallback to Spanish dictionary
    let fallbackLookup: unknown = translations.es;
    for (const k of keys) {
      if (fallbackLookup && typeof fallbackLookup === 'object' && k in fallbackLookup) {
        fallbackLookup = (fallbackLookup as Record<string, unknown>)[k];
      } else {
        fallbackLookup = undefined;
        break;
      }
    }

    if (typeof fallbackLookup === 'string') {
      return fallbackLookup;
    }

    return fallback ?? path;
  };

  return (
    <LanguageContext.Provider
      value={{
        language: mounted ? language : 'es',
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
