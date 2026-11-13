/**
 * Servicio clínico para gestión de recetas ópticas y reservas de horas médicas.
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1/clinico';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('amaru_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ParametrosOjo {
  esfera: number | string;
  cilindro: number | string;
  eje: number | string;
  adicion?: number | string;
  dp?: number | string;
}

export interface ParametrosOftalmologicos {
  ojo_derecho: ParametrosOjo;
  ojo_izquierdo: ParametrosOjo;
  observaciones?: string;
}

export interface RecetaOpticaItem {
  id_receta: string;
  rut_paciente: string;
  paciente_nombre?: string;
  fecha_emision: string;
  parametros_oftalmologicos: ParametrosOftalmologicos;
  archivo_url?: string;
  version_seq: number;
  es_vigente: boolean;
  dias_antiguedad: number;
}

export interface NuevaRecetaPayload {
  rut_paciente: string;
  fecha_emision: string;
  parametros_oftalmologicos: ParametrosOftalmologicos;
  archivo_url?: string;
  archivo_receta?: File;
}

/**
 * Calcula en cliente los días de antigüedad y si está vigente (<365 días).
 */
export function calcularVigenciaReceta(fechaEmision: string): { dias: number; esVigente: boolean } {
  if (!fechaEmision) return { dias: 0, esVigente: false };
  const emision = new Date(fechaEmision);
  const hoy = new Date();
  const diffTime = hoy.getTime() - emision.getTime();
  const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return {
    dias,
    esVigente: dias >= 0 && dias <= 365,
  };
}

export async function registrarReceta(payload: NuevaRecetaPayload | FormData): Promise<RecetaOpticaItem> {
  const isFormData = payload instanceof FormData;
  const token = localStorage.getItem('amaru_access_token');

  // Si es FormData, omitimos Content-Type para que el navegador fije el boundary multipart/form-data
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/recetas/`, {
    method: 'POST',
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg =
      errorData.archivo_receta?.[0] ||
      errorData.fecha_emision?.[0] ||
      errorData.rut_paciente?.[0] ||
      errorData.detail ||
      `Error ${res.status} al registrar receta óptica`;
    throw new Error(errorMsg);
  }

  return res.json() as Promise<RecetaOpticaItem>;
}

export async function getRecetasPaciente(rut: string): Promise<RecetaOpticaItem[]> {
  const res = await fetch(`${API_BASE}/recetas/?rut_paciente=${encodeURIComponent(rut)}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar recetas del paciente`);
  }

  return res.json() as Promise<RecetaOpticaItem[]>;
}

export async function agendarReservaHora(rut_paciente: string, fecha_hora_reserva: string): Promise<{ id_reserva: string }> {
  const res = await fetch(`${API_BASE}/reservas/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      rut_paciente,
      fecha_hora_reserva,
      estado_reserva: 'Pendiente',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al agendar reserva oftalmológica');
  }

  return res.json();
}

