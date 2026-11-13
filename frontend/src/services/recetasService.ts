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
  dioptriasManuales?: boolean;
  odEsfera?: string;
  odCilindro?: string;
  odEje?: string;
  oiEsfera?: string;
  oiCilindro?: string;
  oiEje?: string;
  armazon: string;
  monto: number;
  modalidadPago: string;
  fecha: string;
  estado: EstadoSolicitudReceta;
  motivoObservacion?: string;
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

