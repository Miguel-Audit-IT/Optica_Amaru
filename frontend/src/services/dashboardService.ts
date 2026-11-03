/**
 * Servicio de datos para el Dashboard Administrativo.
 * Adjunta automáticamente el token JWT desde localStorage.
 * Lanza error typed si el token expiró (HTTP 401).
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export class TokenExpiredError extends Error {
  constructor() {
    super('Sesión expirada. Por favor inicia sesión nuevamente.');
    this.name = 'TokenExpiredError';
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('amaru_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) throw new TokenExpiredError();
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${path}`);
  return res.json() as Promise<T>;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ResumenDashboard {
  total_solicitudes: number;
  solicitudes_hoy: number;
  solicitudes_mes: number;
  monto_total_valorizado: string;
  desglose_modalidad: {
    convenio: number;
    particular: number;
  };
  tasa_sincronizacion: number;
}

export interface ItemStockCritico {
  sku: string;
  modelo: string;
  stock_actual: number;
  stock_minimo: number;
  nivel_alerta: 'critico' | 'bajo';
}

export interface RespuestaStockCritico {
  umbral_aplicado: number;
  total_alertas: number;
  items: ItemStockCritico[];
}

export interface EmpresaConvenioResumen {
  id_empresa: number;
  empresa_nombre: string;
  rut_empresa: string;
  convenio_vigente: boolean;
  total_pacientes_atendidos: number;
  monto_proyectado_descuento: string;
}

export interface RespuestaConvenios {
  total_empresas: number;
  empresas: EmpresaConvenioResumen[];
}

// ── Funciones públicas ────────────────────────────────────────────────────────

export const getResumenDashboard = () =>
  apiFetch<ResumenDashboard>('/transacciones/dashboard/resumen/');

export const getStockCritico = (umbral = 5) =>
  apiFetch<RespuestaStockCritico>(`/transacciones/dashboard/stock-critico/?umbral=${umbral}`);

export const getConveniosResumen = () =>
  apiFetch<RespuestaConvenios>('/transacciones/dashboard/convenios-resumen/');

