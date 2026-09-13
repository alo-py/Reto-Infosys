/**
 * OptiGo Django Backend REST API Client
 * Connects Next.js frontend to Django REST Framework (http://127.0.0.1:8000/api/v1/shifts/)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1/shifts';
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://127.0.0.1:8000/api/v1/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  tipo_vehiculo: 'MOTO' | 'BICI' | 'AUTO';
  zona_base: string;
  consumo_gasolina_km?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  tipo_vehiculo: 'MOTO' | 'BICI' | 'AUTO';
  zona_base: string;
  consumo_gasolina_km: string;
}

export interface AuthResponse {
  user?: UserProfile;
  tokens?: {
    access: string;
    refresh: string;
  };
  access?: string;
  refresh?: string;
}

export interface BackendShiftData {
  id: string;
  modalidad: string;
  franja_horaria: string;
  duracion_programada_min: number;
  minuto_progreso: number;
  zona_cobertura: string;
  estado_turno: 'PROGRAMADO' | 'EN_CURSO' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO';
  estado_conexion: string;
  tipo_agente: 'OPTIGO_AI' | 'GREEDY';
  ganancia_neta_total: string;
  ingresos_brutos: string;
  gasto_gasolina_total: string;
  pedidos_completados: number;
  batches_realizados: number;
  pedidos_con_retraso: number;
  penalizaciones_sla_total: string;
  km_totales: string;
  km_en_vacio: string;
  ultimas_decisiones: Array<{
    id: number;
    minuto: number;
    tipo_accion: string;
    log_explicativo: string;
    ganancia_neta_proyectada: string;
  }>;
  ultimo_estado_entorno: {
    id: number;
    minuto: number;
    hora_reloj: string;
    clima: string;
    temperatura_c: number;
    factor_trafico: number;
    factor_surge: number;
    avenida_cerrada: string | null;
    zonas_afectadas: string[];
  } | null;
}

export interface StepResponse {
  progreso: {
    minuto_actual: number;
    duracion_total: number;
    estado_turno: string;
    ubicacion_actual?: string;
    disponible_en_minuto?: number;
    ganancia_neta: number;
    ingresos_brutos?: number;
    gasto_gasolina?: number;
    pedidos_completados: number;
    batches_realizados?: number;
    pedidos_con_retraso?: number;
    penalizaciones_sla?: number;
    km_totales?: number;
    km_en_vacio?: number;
    decisiones_en_este_paso: Array<{
      minuto: number;
      log: string;
    }>;
  };
  turno: BackendShiftData;
}

/**
 * Checks if the Django backend server is alive and reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/start/`, {
      method: 'OPTIONS',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 200 || res.status === 405;
  } catch {
    return false;
  }
}

/**
 * Creates and starts a new shift block in Django database (BloqueTurno)
 */
export async function startBackendShift(
  tipoAgente: 'OPTIGO_AI' | 'GREEDY',
  duracionMin: number = 120,
  zonaInicio: string = 'Centro MTY (Barrio Antiguo)'
): Promise<BackendShiftData> {
  const res = await fetch(`${API_BASE_URL}/start/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tipo_agente: tipoAgente,
      duracion_programada_min: duracionMin,
      zona_cobertura: zonaInicio,
      modalidad: 'BLOQUE_RESERVADO',
      franja_horaria: 'ALMUERZO',
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to start shift on backend: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Advances the simulation by N minutes in Django backend
 * Runs OSMnx routing, OR-Tools optimization, and logs telemetry in PostgreSQL/SQLite
 */
export async function stepBackendShift(
  shiftId: string,
  minutos: number = 1
): Promise<StepResponse> {
  const res = await fetch(`${API_BASE_URL}/${shiftId}/step/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      minutos,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to step shift on backend: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Finalizes the shift on Django backend
 */
export async function endBackendShift(shiftId: string): Promise<BackendShiftData> {
  const res = await fetch(`${API_BASE_URL}/${shiftId}/end/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to end shift on backend: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Retrieves the full shift status and telemetry snapshots
 */
export async function getBackendShift(shiftId: string): Promise<BackendShiftData> {
  const res = await fetch(`${API_BASE_URL}/${shiftId}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve shift on backend: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const MONTERREY_BASE_ZONES = [
  "Centro MTY (Barrio Antiguo)",
  "Tec de Monterrey (Garza Sada)",
  "Centrito Valle (San Pedro)",
  "Valle Oriente (San Pedro)",
  "San Jerónimo",
  "Cumbres",
  "San Nicolás",
  "Apodaca (Industrial)",
  "Santa Catarina",
] as const;

export const VEHICLE_CONFIGS = {
  MOTO: { label: 'Motorcycle', rate: 0.90, desc: '$0.90 MXN/km gas expense' },
  BICI: { label: 'Bicycle / E-Bike', rate: 0.00, desc: '$0.00 MXN/km zero emissions' },
  AUTO: { label: 'Automobile', rate: 1.40, desc: '$1.40 MXN/km high capacity' },
} as const;

/**
 * Authenticate existing user credentials via Django JWT endpoint
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || errorData.non_field_errors?.[0] || 'Invalid email or password.';
    throw new Error(message);
  }

  const tokenData = await res.json();
  let userProfile: UserProfile | undefined = undefined;

  if (tokenData.access) {
    try {
      const profileRes = await fetch(`${AUTH_BASE_URL}/me/`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
        },
      });
      if (profileRes.ok) {
        userProfile = await profileRes.json();
      }
    } catch {
      // If profile fetch fails, we still have valid tokens
    }
  }

  const authResponse: AuthResponse = {
    tokens: {
      access: tokenData.access,
      refresh: tokenData.refresh,
    },
    access: tokenData.access,
    refresh: tokenData.refresh,
    user: userProfile,
  };

  saveAuthSession(authResponse);
  return authResponse;
}

/**
 * Register a new courier into Django PostgreSQL database and obtain JWT session
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_BASE_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const firstKey = Object.keys(errorData)[0];
    const message = firstKey
      ? `${firstKey}: ${Array.isArray(errorData[firstKey]) ? errorData[firstKey].join(', ') : errorData[firstKey]}`
      : 'Registration failed. Please verify your submitted data.';
    throw new Error(message);
  }

  const authResponse: AuthResponse = await res.json();
  saveAuthSession(authResponse);
  return authResponse;
}

/**
 * Persist tokens and profile in local storage
 */
export function saveAuthSession(auth: AuthResponse): void {
  if (typeof window === 'undefined') return;
  const access = auth.tokens?.access || auth.access;
  const refresh = auth.tokens?.refresh || auth.refresh;
  if (access) localStorage.setItem('optigo_auth_token', access);
  if (refresh) localStorage.setItem('optigo_auth_refresh', refresh);
  if (auth.user) localStorage.setItem('optigo_auth_user', JSON.stringify(auth.user));
}

/**
 * Retrieve saved JWT access token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('optigo_auth_token');
}

/**
 * Retrieve saved user profile
 */
export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('optigo_auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Clear authentication session
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('optigo_auth_token');
  localStorage.removeItem('optigo_auth_refresh');
  localStorage.removeItem('optigo_auth_user');
}
