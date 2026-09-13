/**
 * OptiGo Django Backend REST API Client
 * Connects Next.js frontend to Django REST Framework (http://127.0.0.1:8000/api/v1/shifts/)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1/shifts';

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
