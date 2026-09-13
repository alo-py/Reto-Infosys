'use client';

/**
 * OptiGo Authentication Service
 * Communicates with Django REST Framework SimpleJWT endpoints
 */

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
  date_joined?: string;
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
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error('Unable to connect to backend server. Make sure Django is running on http://127.0.0.1:8000.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let message = errorData.detail || errorData.non_field_errors?.[0];
    
    // Friendly translation if Django returns default Spanish JWT error
    if (message === 'La combinación de credenciales no tiene una cuenta activa' || !message) {
      message = 'No registered courier account found with these credentials. Please check your email or create an account.';
    }
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
      // If profile fetch fails, session tokens remain valid
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
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to connect to backend server. Make sure Django is running on http://127.0.0.1:8000.');
  }

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
