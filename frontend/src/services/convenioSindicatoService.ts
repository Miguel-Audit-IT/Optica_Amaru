/**
 * Servicio de Validación y Control de Bloqueo de Códigos de Convenio (30 Días / 1 Ciclo Mensual)
 * Cumplimiento de Políticas de Beneficios Corporativos, Prevención de Doble Uso y Anti-Suplantación.
 *
 * Catálogo Oficial Clasificado:
 * ── TIPO B: Subvención / Descuento por Planilla (Riesgo Financiero Alto · Requiere Validación Pre-Laboratorio) ──
 * - SDC1326: Sindicato N°1 Chuquicamata (Cobertura: $150.000 CLP · Descuento por Planilla)
 * - SDM0826: Sindicato Ministro Hales (Cobertura: $140.000 CLP · Descuento por Planilla)
 * - SDE1126: Sindicato Escondida / BHP (Cobertura: $180.000 CLP · Descuento por Planilla)
 * - GOB-LOA26: Bienestar Gobernación / Servicio Público El Loa (Cobertura: $120.000 CLP · Cargo Bienestar)
 *
 * ── TIPO A: Descuento Directo al Contado (Riesgo Financiero Cero · Pago Inmediato en Mesón) ──
 * - COL-CALAMA: Convenio Colegios & Docentes Calama (20% Descuento Directo · Contado/Tarjeta)
 * - JJVV-NORTE: Convenio Juntas de Vecinos Calama & Antofagasta (15% Descuento Directo · Contado/Tarjeta)
 */

export type TipoConvenio = 'TIPO_A' | 'TIPO_B';

export interface InfoSindicato {
  codigo: string;
  nombre: string;
  tipo: TipoConvenio;
  tipoNombre: string; // 'Descuento Directo al Contado' | 'Subvención / Descuento por Planilla'
  tope?: number; // Monto en CLP para Tipo B (ej: 150000)
  porcentajeDescuento?: number; // Porcentaje para Tipo A (ej: 20 para 20%)
  empresa: string;
  descripcion: string;
  fechaVigencia?: string; // YYYY-MM-DD
  estado?: 'Vigente' | 'Vencido';
  contactoWhatsAppDirectiva?: string;
}

export const STORAGE_KEY_CATALOGO_CONVENIOS = 'amaru_catalogo_convenios';

export const CATALOGO_CODIGOS_SINDICALES: Record<string, InfoSindicato> = {
  // ── TIPO B: Planilla / Subvención Corporativa ─────────────────────────────────
  SDC1326: {
    codigo: 'SDC1326',
    nombre: 'Sindicato N°1 Chuquicamata',
    tipo: 'TIPO_B',
    tipoNombre: 'Subvención / Descuento por Planilla',
    tope: 150000,
    empresa: 'Codelco Chuquicamata',
    descripcion: 'Cobertura hasta $150.000 CLP vía descuento por planilla minera.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
    contactoWhatsAppDirectiva: '+56985860973',
  },
  SDM0826: {
    codigo: 'SDM0826',
    nombre: 'Sindicato Ministro Hales',
    tipo: 'TIPO_B',
    tipoNombre: 'Subvención / Descuento por Planilla',
    tope: 140000,
    empresa: 'Codelco Ministro Hales',
    descripcion: 'Cobertura hasta $140.000 CLP vía descuento por planilla minera.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
    contactoWhatsAppDirectiva: '+56985860973',
  },
  SDE1126: {
    codigo: 'SDE1126',
    nombre: 'Sindicato Escondida / BHP',
    tipo: 'TIPO_B',
    tipoNombre: 'Subvención / Descuento por Planilla',
    tope: 180000,
    empresa: 'Minera Escondida / BHP',
    descripcion: 'Cobertura hasta $180.000 CLP vía descuento por planilla faena Coloso/Mina.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
    contactoWhatsAppDirectiva: '+56985860973',
  },
  'GOB-LOA26': {
    codigo: 'GOB-LOA26',
    nombre: 'Bienestar Gobernación / Servicio Público El Loa',
    tipo: 'TIPO_B',
    tipoNombre: 'Subvención / Descuento por Planilla',
    tope: 120000,
    empresa: 'Gobernación Provincial El Loa / Servicios Públicos',
    descripcion: 'Cobertura hasta $120.000 CLP con cargo al fondo de bienestar público.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
    contactoWhatsAppDirectiva: '+56985860973',
  },

  // ── TIPO A: Descuento Directo al Contado ─────────────────────────────────────
  'COL-CALAMA': {
    codigo: 'COL-CALAMA',
    nombre: 'Convenio Colegios & Docentes Calama',
    tipo: 'TIPO_A',
    tipoNombre: 'Descuento Directo al Contado',
    porcentajeDescuento: 20,
    empresa: 'Colegios y Docentes Provincia El Loa',
    descripcion: '20% de Descuento Directo en armazones y cristales al pagar con tarjeta o efectivo.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
  },
  'JJVV-NORTE': {
    codigo: 'JJVV-NORTE',
    nombre: 'Convenio Juntas de Vecinos Calama',
    tipo: 'TIPO_A',
    tipoNombre: 'Descuento Directo al Contado',
    porcentajeDescuento: 15,
    empresa: 'Unión Comunal de Juntas de Vecinos',
    descripcion: '15% de Descuento Directo para vecinos acreditados al pagar con tarjeta o efectivo.',
    fechaVigencia: '2026-12-31',
    estado: 'Vigente',
  },
};

export function getCatalogoConvenios(): InfoSindicato[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOGO_CONVENIOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as InfoSindicato[];
      }
    }
  } catch {
    // fallback
  }
  const inicial = Object.values(CATALOGO_CODIGOS_SINDICALES);
  try {
    localStorage.setItem(STORAGE_KEY_CATALOGO_CONVENIOS, JSON.stringify(inicial));
  } catch {
    // ignore
  }
  return inicial;
}

export function guardarCatalogoConvenios(lista: InfoSindicato[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATALOGO_CONVENIOS, JSON.stringify(lista));
    window.dispatchEvent(new Event('amaru_convenios_updated'));
  } catch {
    // ignore
  }
}

export function getMapaConvenios(): Record<string, InfoSindicato> {
  const lista = getCatalogoConvenios();
  const mapa: Record<string, InfoSindicato> = {};
  for (const item of lista) {
    mapa[item.codigo.trim().toUpperCase()] = item;
  }
  return mapa;
}

export function estaConvenioVigente(info: InfoSindicato): boolean {
  if (info.estado === 'Vencido') return false;
  if (info.fechaVigencia) {
    const limite = new Date(`${info.fechaVigencia}T23:59:59`);
    if (!isNaN(limite.getTime()) && limite < new Date()) {
      return false;
    }
  }
  return true;
}

export function crearConvenio(nuevo: InfoSindicato): {
  exito: boolean;
  error?: string;
  convenio?: InfoSindicato;
} {
  const codigoLimpio = nuevo.codigo.trim().toUpperCase();
  if (!codigoLimpio) {
    return { exito: false, error: 'El código del convenio es obligatorio.' };
  }
  const lista = getCatalogoConvenios();
  if (lista.some((c) => c.codigo.trim().toUpperCase() === codigoLimpio)) {
    return { exito: false, error: `Ya existe un convenio registrado con el código "${codigoLimpio}".` };
  }
  const registro: InfoSindicato = {
    ...nuevo,
    codigo: codigoLimpio,
    tipoNombre:
      nuevo.tipo === 'TIPO_B'
        ? 'Subvención / Descuento por Planilla'
        : 'Descuento Directo al Contado',
    estado: nuevo.estado || 'Vigente',
    fechaVigencia: nuevo.fechaVigencia || '2026-12-31',
  };
  guardarCatalogoConvenios([registro, ...lista]);
  return { exito: true, convenio: registro };
}

export function actualizarConvenio(
  codigoOriginal: string,
  cambios: Partial<InfoSindicato>
): { exito: boolean; error?: string; convenio?: InfoSindicato } {
  const target = codigoOriginal.trim().toUpperCase();
  const lista = getCatalogoConvenios();
  const idx = lista.findIndex((c) => c.codigo.trim().toUpperCase() === target);
  if (idx === -1) {
    return { exito: false, error: 'No se encontró el convenio a actualizar.' };
  }
  const actual = lista[idx];
  const nuevoTipo = cambios.tipo || actual.tipo;
  const actualizado: InfoSindicato = {
    ...actual,
    ...cambios,
    codigo: actual.codigo,
    tipo: nuevoTipo,
    tipoNombre:
      nuevoTipo === 'TIPO_B'
        ? 'Subvención / Descuento por Planilla'
        : 'Descuento Directo al Contado',
  };
  const nuevaLista = [...lista];
  nuevaLista[idx] = actualizado;
  guardarCatalogoConvenios(nuevaLista);
  return { exito: true, convenio: actualizado };
}

export function eliminarConvenio(codigo: string): { exito: boolean } {
  const target = codigo.trim().toUpperCase();
  const lista = getCatalogoConvenios();
  const filtrada = lista.filter((c) => c.codigo.trim().toUpperCase() !== target);
  guardarCatalogoConvenios(filtrada);
  return { exito: true };
}

export type EstadoBloqueoCodigo =
  | 'BLOQUEADO_30_DIAS'
  | 'BLOQUEADO_90_DIAS' // Compatibilidad histórica
  | 'LIBERADO_POR_ANULACION'
  | 'EXPIRADO_HABILITADO';

export interface RegistroUsoCodigoSindicato {
  id: string;
  rut: string;
  codigo: string;
  sindicato: string;
  tipoConvenio: TipoConvenio;
  folio: string;
  fechaUso: string; // ISO string
  fechaDesbloqueo: string; // ISO string (+30 días)
  estado: EstadoBloqueoCodigo;
  nroSocio?: string;
  verificacionMeson?: 'PRESENCIAL_VERIFICADO' | 'CUARENTENA_PRE_LABORATORIO';
  liberadoEl?: string;
  liberadoPor?: string;
  motivoLiberacion?: string;
}

const STORAGE_KEY = 'amaru_uso_codigos_sindicato';
export const CARENCIA_DIAS = 30; // 30 DÍAS (1 ciclo mensual)

const MOCK_USOS_INICIALES: RegistroUsoCodigoSindicato[] = [
  {
    id: 'USO-SEED-001',
    rut: '24.533.343-9',
    codigo: 'SDC1326',
    sindicato: 'Sindicato N°1 Chuquicamata',
    tipoConvenio: 'TIPO_B',
    folio: 'FOLIO-8F1085AD',
    fechaUso: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    fechaDesbloqueo: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    estado: 'BLOQUEADO_30_DIAS',
    nroSocio: 'ROL-88421',
    verificacionMeson: 'PRESENCIAL_VERIFICADO',
  },
];

export function getUsosCodigosSindicato(): RegistroUsoCodigoSindicato[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USOS_INICIALES));
      return MOCK_USOS_INICIALES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback
  }
  return MOCK_USOS_INICIALES;
}

export function guardarUsosCodigosSindicato(registros: RegistroUsoCodigoSindicato[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
    window.dispatchEvent(new Event('amaru_codigos_sindicato_updated'));
  } catch {
    // ignore
  }
}

export interface ResultadoValidacionCodigo {
  valido: boolean;
  bloqueado: boolean;
  infoSindicato?: InfoSindicato;
  mensajeError?: string;
  mensajeExito?: string;
  bloqueoExistente?: RegistroUsoCodigoSindicato;
  diasRestantes?: number;
}

export function normalizarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Valida un código institucional ingresado verificando existencia en catálogo
 * y período de carencia de 30 días por RUT.
 */
export function validarCodigoSindicato(
  codigoIngresado: string,
  rutIngresado: string
): ResultadoValidacionCodigo {
  const cod = codigoIngresado.trim().toUpperCase();
  const rutLimpio = normalizarRut(rutIngresado);

  if (!cod) {
    return {
      valido: false,
      bloqueado: false,
      mensajeError: 'Ingresa un código de convenio institucional.',
    };
  }

  const mapa = getMapaConvenios();
  const info = mapa[cod];
  if (!info) {
    return {
      valido: false,
      bloqueado: false,
      mensajeError: `El código "${cod}" no corresponde a ningún convenio activo en el sistema.`,
    };
  }

  if (!estaConvenioVigente(info)) {
    return {
      valido: false,
      bloqueado: false,
      infoSindicato: info,
      mensajeError: `El convenio "${info.nombre}" (${cod}) se encuentra VENCIDO (vigencia hasta ${info.fechaVigencia || 'expirada'}).`,
    };
  }

  if (!rutLimpio) {
    return {
      valido: true,
      bloqueado: false,
      infoSindicato: info,
      mensajeExito:
        info.tipo === 'TIPO_B'
          ? `Código reconocido: ${info.nombre} (Tipo B) — Cobertura: $${info.tope?.toLocaleString('es-CL')} CLP`
          : `Código reconocido: ${info.nombre} (Tipo A) — ${info.porcentajeDescuento}% Descuento Directo`,
    };
  }

  const registros = getUsosCodigosSindicato();
  const ahora = new Date();

  // Buscar si ese RUT tiene un bloqueo activo menor a 30 días
  const bloqueo = registros.find((r) => {
    const rRut = normalizarRut(r.rut);
    if (rRut !== rutLimpio) return false;
    if (r.estado !== 'BLOQUEADO_30_DIAS' && r.estado !== 'BLOQUEADO_90_DIAS') return false;
    const fechaDesbloqueo = new Date(r.fechaDesbloqueo);
    return fechaDesbloqueo > ahora;
  });

  if (bloqueo) {
    const fechaUsoDate = new Date(bloqueo.fechaUso);
    const fechaDesbloqueoDate = new Date(bloqueo.fechaDesbloqueo);
    const msRestantes = fechaDesbloqueoDate.getTime() - ahora.getTime();
    const diasRestantes = Math.max(1, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)));
    const fechaUsoStr = fechaUsoDate.toLocaleDateString('es-CL');
    const fechaDesbloqueoStr = fechaDesbloqueoDate.toLocaleDateString('es-CL');

    return {
      valido: false,
      bloqueado: true,
      infoSindicato: info,
      bloqueoExistente: bloqueo,
      diasRestantes,
      mensajeError: `⛔ Beneficio en Período de Carencia Mensual (30 Días): Utilizado el ${fechaUsoStr} en el pedido ${bloqueo.folio}. Se habilitará automáticamente el ${fechaDesbloqueoStr} (faltan ${diasRestantes} días), o de inmediato si se anula la venta anterior.`,
    };
  }

  const detalleExito =
    info.tipo === 'TIPO_B'
      ? `✅ Convenio Verificado (Tipo B): ${info.nombre} — Cobertura autorizada hasta $${info.tope?.toLocaleString('es-CL')} CLP vía planilla. (Al emitir la venta en caja se activará el candado de 30 días).`
      : `✅ Convenio Verificado (Tipo A): ${info.nombre} — ${info.porcentajeDescuento}% de Descuento Directo en mesón.`;

  return {
    valido: true,
    bloqueado: false,
    infoSindicato: info,
    mensajeExito: detalleExito,
  };
}

/**
 * Calcula el desglose financiero según el tipo de convenio (Tipo A vs Tipo B).
 */
export function calcularBeneficioConvenio(
  codigo: string,
  subtotal: number
): {
  tipo: TipoConvenio;
  descuentoOMontoCubierto: number;
  totalAPagarCliente: number;
  copagoExcedente: number;
  detalleTexto: string;
} {
  const info = getMapaConvenios()[codigo.trim().toUpperCase()];
  if (!info) {
    return {
      tipo: 'TIPO_A',
      descuentoOMontoCubierto: 0,
      totalAPagarCliente: subtotal,
      copagoExcedente: 0,
      detalleTexto: 'Sin convenio aplicado',
    };
  }

  if (info.tipo === 'TIPO_A') {
    const pct = info.porcentajeDescuento || 0;
    const descuento = Math.round((subtotal * pct) / 100);
    const aPagar = Math.max(0, subtotal - descuento);
    return {
      tipo: 'TIPO_A',
      descuentoOMontoCubierto: descuento,
      totalAPagarCliente: aPagar,
      copagoExcedente: 0,
      detalleTexto: `${pct}% Descuento Directo (-$${descuento.toLocaleString('es-CL')} CLP)`,
    };
  }

  // Tipo B (Planilla / Subvención)
  const tope = info.tope || 150000;
  const cubierto = Math.min(subtotal, tope);
  const copago = Math.max(0, subtotal - tope);
  return {
    tipo: 'TIPO_B',
    descuentoOMontoCubierto: cubierto,
    totalAPagarCliente: copago,
    copagoExcedente: copago,
    detalleTexto: `Subvención Planilla: $${cubierto.toLocaleString('es-CL')} CLP${
      copago > 0 ? ` · Copago en Mesón: $${copago.toLocaleString('es-CL')} CLP` : ' (100% Cubierto)'
    }`,
  };
}

/**
 * Registra el uso real del código al confirmar la venta en el Terminal POS.
 * Aplica el candado de 30 días exactos.
 */
export function registrarUsoCodigoSindicato(params: {
  rut: string;
  codigo: string;
  sindicato: string;
  folio: string;
  tipoConvenio?: TipoConvenio;
  nroSocio?: string;
  verificacionMeson?: 'PRESENCIAL_VERIFICADO' | 'CUARENTENA_PRE_LABORATORIO';
}): RegistroUsoCodigoSindicato {
  const info = CATALOGO_CODIGOS_SINDICALES[params.codigo.trim().toUpperCase()];
  const tipoConv = params.tipoConvenio || info?.tipo || 'TIPO_B';

  const ahora = new Date();
  const fechaDesbloqueo = new Date(ahora.getTime() + CARENCIA_DIAS * 24 * 60 * 60 * 1000);

  const nuevo: RegistroUsoCodigoSindicato = {
    id: `USO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    rut: params.rut.trim(),
    codigo: params.codigo.trim().toUpperCase(),
    sindicato: params.sindicato || info?.nombre || 'Convenio Institucional',
    tipoConvenio: tipoConv,
    folio: params.folio,
    fechaUso: ahora.toISOString(),
    fechaDesbloqueo: fechaDesbloqueo.toISOString(),
    estado: 'BLOQUEADO_30_DIAS',
    nroSocio: params.nroSocio,
    verificacionMeson: params.verificacionMeson || 'PRESENCIAL_VERIFICADO',
  };

  const actuales = getUsosCodigosSindicato();
  const actualizados = [nuevo, ...actuales];
  guardarUsosCodigosSindicato(actualizados);
  return nuevo;
}

/**
 * Desbloquea inmediatamente el código sindical cuando se anula la compra.
 */
export function desbloquearCodigoPorAnulacion(
  folioOIdentificador: string,
  rut?: string,
  responsable: string = 'María González (Administradora)',
  motivo: string = 'Anulación de compra por Administradora'
): { desbloqueado: boolean; registrosAfectados: RegistroUsoCodigoSindicato[] } {
  const actuales = getUsosCodigosSindicato();
  const ahora = new Date().toISOString();
  const rutLimpio = rut ? normalizarRut(rut) : null;
  const folioLimpio = folioOIdentificador.trim().toUpperCase();

  const afectados: RegistroUsoCodigoSindicato[] = [];
  const actualizados = actuales.map((reg) => {
    const regFolio = reg.folio.trim().toUpperCase();
    const regRut = normalizarRut(reg.rut);
    const coincide = regFolio === folioLimpio || (rutLimpio !== null && regRut === rutLimpio);

    if (coincide && (reg.estado === 'BLOQUEADO_30_DIAS' || reg.estado === 'BLOQUEADO_90_DIAS')) {
      const regActualizado: RegistroUsoCodigoSindicato = {
        ...reg,
        estado: 'LIBERADO_POR_ANULACION',
        liberadoEl: ahora,
        liberadoPor: responsable,
        motivoLiberacion: motivo,
      };
      afectados.push(regActualizado);
      return regActualizado;
    }
    return reg;
  });

  if (afectados.length > 0) {
    guardarUsosCodigosSindicato(actualizados);
    return { desbloqueado: true, registrosAfectados: afectados };
  }
  return { desbloqueado: false, registrosAfectados: [] };
}

/**
 * Obtiene el registro de uso bloqueado para un folio o RUT.
 */
export function obtenerCodigoPorFolioORut(
  folio: string,
  rut?: string
): RegistroUsoCodigoSindicato | undefined {
  const registros = getUsosCodigosSindicato();
  const folioLimpio = folio.trim().toUpperCase();
  const rutLimpio = rut ? normalizarRut(rut) : null;

  return registros.find((r) => {
    if (r.folio.trim().toUpperCase() === folioLimpio) return true;
    if (rutLimpio && normalizarRut(r.rut) === rutLimpio) return true;
    return false;
  });
}
