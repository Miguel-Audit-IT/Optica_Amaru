export type CiudadAtencion = 'Calama' | 'Antofagasta';
export type TipoUsuario = 'Convenio Minero' | 'Particular';
export type EstadoSolicitudReceta = 'EN_REVISION' | 'APROBADA' | 'OBSERVADA';

export interface SolicitudReceta {
  id: string;
  folio: string;
  rut: string;
  nombre: string;
  correo: string;
  telefono: string;
  ciudad: CiudadAtencion;
  tipoUsuario: TipoUsuario;
  empresa?: string;
  tipoReceta: 'vigente' | 'sin_receta';
  archivoNombre: string;
  archivoPesoKb?: number;
  archivoPreviewUrl?: string;
  dioptriasManuales?: boolean;
  odEsfera?: string;
  odCilindro?: string;
  odEje?: string;
  oiEsfera?: string;
  oiCilindro?: string;
  oiEje?: string;
  dpMm?: string;
  rutMedico?: string;
  nombreMedico?: string;
  centroSalud?: string;
  fechaEmisionReceta?: string;
  hashArchivoReceta?: string;
  estadoRnpi?: 'RNPI_HABILITADO' | 'PENDIENTE_MESON' | 'RUT_INVALIDO' | 'NO_APLICA';
  armazon: string;
  skuArmazon?: string;
  materialCristal?: 'Orgánico / Plástico' | 'Policarbonato' | 'Mineral / Vidrio';
  filtrosCristal?: string[];
  adelgazamiento?: 'Estándar (1.56)' | 'Adelgazado (1.61)' | 'Ultra Delgado (1.67)';
  contextoUso?: string;
  especificacionesCliente?: string;
  subtotalOriginal?: number;
  descuentoConvenio?: number;
  metodoPago?: string;
  modalidadPagoDetalle?: 'Pago Total (100%)' | 'Pago a Mitad (50% Abono / 50% Saldo)' | 'Pago en Cuotas';
  cuotasCantidad?: number;
  monto: number;
  modalidadPago: string;
  fecha: string;
  estado: EstadoSolicitudReceta;
  motivoObservacion?: string;
  origen?: 'PORTAL_PACIENTE' | 'QR_PUBLICO' | 'MESON' | string;
  tipoSolicitud?: string;
  consentimientoLey21719?: boolean;
  consentimientoMinsal?: boolean;
  declaracionAntifraude?: boolean;
  declaracionVeracidadReceta?: boolean;
  declaracionVeracidadAt?: string;
  codigoConvenio?: string;
  codigoConvenioEstado?: 'VIGENTE' | 'NO_APLICA';
  contactoVerificado?: boolean;
  fechaAgenda?: string;
  bloqueAgenda?: string;
  tipoEvaluacionAgenda?: string;
  observacionesAgenda?: string;
}

export const SOLICITUD_DEMO_INICIAL: SolicitudReceta = {
  id: 'SOL-DEMO-001',
  folio: 'FOLIO-8F1085AD',
  rut: '18.234.567-8',
  nombre: 'Miguel Jorge Valenzuela',
  correo: 'm.jorge@minera-norte.cl',
  telefono: '+56 9 8586 0973',
  ciudad: 'Calama',
  tipoUsuario: 'Convenio Minero',
  empresa: 'Minera Centinela · Faena Esperanza',
  tipoReceta: 'vigente',
  archivoNombre: 'Receta_Oftalmologica_2026.pdf',
  archivoPesoKb: 428,
  hashArchivoReceta: 'sha256_9f84b2c7e1a04d3c8812f6e59a01b7d2c4e6f8a9',
  declaracionVeracidadReceta: true,
  declaracionVeracidadAt: '2026-11-12T17:30:00.000Z',
  nombreMedico: 'Dr. Felipe Andrés Araya Cortés',
  rutMedico: '15.421.890-3',
  centroSalud: 'Hospital del Cobre Salvador Allende - Calama',
  fechaEmisionReceta: '2026-11-05',
  dioptriasManuales: true,
  odEsfera: '-1.50',
  odCilindro: '-0.50',
  odEje: '90°',
  oiEsfera: '-1.25',
  oiCilindro: '-0.75',
  oiEje: '85°',
  armazon: 'Titanium Shield Pro',
  monto: 85000,
  modalidadPago: 'Descuento por Planilla en Convenio (3 cuotas sin interés)',
  fecha: '12 Nov 2026, 14:30 hrs',
  estado: 'EN_REVISION',
};

export const STORAGE_KEY_SOLICITUDES = 'amaru_solicitudes_recetas';

export function getSolicitudesRecetas(): SolicitudReceta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOLICITUDES);
    if (!raw) {
      const inicial = [SOLICITUD_DEMO_INICIAL];
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(inicial));
      return inicial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const inicial = [SOLICITUD_DEMO_INICIAL];
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(inicial));
    return inicial;
  } catch {
    return [SOLICITUD_DEMO_INICIAL];
  }
}

export function guardarSolicitudesRecetas(solicitudes: SolicitudReceta[]): void {
  localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes));
  window.dispatchEvent(new Event('amaru_recetas_updated'));
}

export function agregarSolicitudReceta(
  nueva: Omit<SolicitudReceta, 'id' | 'folio' | 'fecha' | 'estado'>
): SolicitudReceta {
  const solicitudes = getSolicitudesRecetas();
  const id = `SOL-${Date.now()}`;
  const folio = `FOLIO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const ahora = new Date();
  const fecha = `${ahora.getDate()} ${ahora.toLocaleString('es-CL', { month: 'short' })} ${ahora.getFullYear()}, ${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')} hrs`;

  const solicitudCompleta: SolicitudReceta = {
    ...nueva,
    id,
    folio,
    fecha,
    estado: 'EN_REVISION',
  };

  const actualizadas = [solicitudCompleta, ...solicitudes];
  guardarSolicitudesRecetas(actualizadas);
  return solicitudCompleta;
}

export function cambiarEstadoSolicitud(
  id: string,
  nuevoEstado: EstadoSolicitudReceta,
  motivoObservacion?: string
): void {
  const solicitudes = getSolicitudesRecetas();
  const actualizadas = solicitudes.map((s) => {
    if (s.id === id) {
      return {
        ...s,
        estado: nuevoEstado,
        motivoObservacion: motivoObservacion || s.motivoObservacion,
      };
    }
    return s;
  });
  guardarSolicitudesRecetas(actualizadas);
}

export function marcarContactoVerificado(folioOId: string): void {
  const solicitudes = getSolicitudesRecetas();
  const target = folioOId.trim().toUpperCase();
  const actualizadas = solicitudes.map((s) => {
    if (s.folio.toUpperCase() === target || s.id.toUpperCase() === target) {
      return { ...s, contactoVerificado: true };
    }
    return s;
  });
  guardarSolicitudesRecetas(actualizadas);
}

export function descartarSolicitudReceta(id: string): void {
  const solicitudes = getSolicitudesRecetas();
  const actualizadas = solicitudes.filter((s) => s.id !== id);
  guardarSolicitudesRecetas(actualizadas);
}

