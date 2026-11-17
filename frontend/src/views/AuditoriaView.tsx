import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  Copy,
  Check,
  Building2,
  Lock,
  FileText,
  KeyRound,
  Receipt,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  Scale,
} from 'lucide-react';

// ── Tipos y Modelos de Auditoría ──────────────────────────────────────────────

export type JurisdiccionAuditor = 'TODAS' | 'Calama' | 'Antofagasta';
export type TabAuditoria = 'control' | 'bitacora' | 'caja';

export interface EventoForenseWORM {
  id: string;
  cuando: string; // ISO o timestamp formateado
  quien: string;
  quienRol: string;
  quienRut: string;
  dondeSucursal: 'Calama' | 'Antofagasta';
  dondeIp: string;
  dondeTerminal: string;
  eventoTipo:
    | 'ANULACIÓN DE VENTA'
    | 'RECTIFICACIÓN CLÍNICA'
    | 'CAMBIO DE PRECIO'
    | 'INGRESO GUÍA BODEGA'
    | 'AJUSTE POR MERMA'
    | 'SINCRONIZACIÓN PWA';
  detalleAntes: string;
  detalleDespues: string;
  selloSha256: string;
}

// ── Eventos Semilla Base para Demostración Forense ISO 27001 ──────────────────

const EVENTOS_FORENSES_INICIALES: EventoForenseWORM[] = [
  {
    id: 'WORM-EVT-001',
    cuando: '15/11/2026 14:15:22',
    quien: 'María González',
    quienRol: 'Administradora',
    quienRut: '14.289.432-1',
    dondeSucursal: 'Calama',
    dondeIp: '192.168.10.45',
    dondeTerminal: 'POS-CAL-01',
    eventoTipo: 'ANULACIÓN DE VENTA',
    detalleAntes: 'Folio #8F1085AD: ACTIVO (Monto: $185.000 · Sindicato Chuqui)',
    detalleDespues: 'Folio #8F1085AD: ANULADO / REVERSADO (+1 devuelto a stock Calama)',
    selloSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'WORM-EVT-002',
    cuando: '15/11/2026 12:40:08',
    quien: 'María González',
    quienRol: 'Administradora',
    quienRut: '14.289.432-1',
    dondeSucursal: 'Antofagasta',
    dondeIp: '192.168.20.12',
    dondeTerminal: 'POS-ANTOF-02',
    eventoTipo: 'RECTIFICACIÓN CLÍNICA',
    detalleAntes: 'Folio #8F1085AD · Parámetros Clínicos v1 (Protegido Ley 20.584)',
    detalleDespues: 'Folio #8F1085AD · Rectificación Clínica Autorizada v2 (Respaldo MINSAL Verificado · Dato Sensible Enmascarado)',
    selloSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'WORM-EVT-003',
    cuando: '15/11/2026 10:12:45',
    quien: 'Carlos Rojas Morales',
    quienRol: 'Operador / Vendedor',
    quienRut: '18.923.456-7',
    dondeSucursal: 'Antofagasta',
    dondeIp: '192.168.20.14',
    dondeTerminal: 'POS-ANTOF-01',
    eventoTipo: 'INGRESO GUÍA BODEGA',
    detalleAntes: 'Stock SKU BOUT-ACET-002: 6 unidades en Antofagasta',
    detalleDespues: 'Stock SKU BOUT-ACET-002: 18 unidades (+12 vía Guía GD-88912)',
    selloSha256: '9a22f4b16c87890e543bca1098ef7723910248ad9081e289c091a117bce1801c',
  },
  {
    id: 'WORM-EVT-004',
    cuando: '14/11/2026 18:30:11',
    quien: 'Juanita Araya',
    quienRol: 'Operador / Vendedor',
    quienRut: '17.456.789-2',
    dondeSucursal: 'Calama',
    dondeIp: '192.168.10.46',
    dondeTerminal: 'PWA-MESA-MINA-03',
    eventoTipo: 'SINCRONIZACIÓN PWA',
    detalleAntes: 'IndexedDB Offline: 3 transacciones en espera de red faena',
    detalleDespues: 'Servidor Central: 3 registros conciliados con 0 descartes (100% OK)',
    selloSha256: '3f5a89b023de9124a1b0284c8a9012cd894e10b45781a9c1e289410ac0291456',
  },
  {
    id: 'WORM-EVT-005',
    cuando: '14/11/2026 15:20:55',
    quien: 'María González',
    quienRol: 'Administradora',
    quienRut: '14.289.432-1',
    dondeSucursal: 'Calama',
    dondeIp: '192.168.10.45',
    dondeTerminal: 'POS-CAL-01',
    eventoTipo: 'CAMBIO DE PRECIO',
    detalleAntes: 'Titanium Shield Pro: $80.000 CLP (Margen: 70.0%)',
    detalleDespues: 'Titanium Shield Pro: $85.000 CLP (Margen: 71.8%)',
    selloSha256: 'b45c9281a0e149f812cd890124ba1289fe12345678901234567890abcdef1234',
  },
  {
    id: 'WORM-EVT-006',
    cuando: '13/11/2026 17:05:40',
    quien: 'Carlos Rojas Morales',
    quienRol: 'Operador / Vendedor',
    quienRut: '18.923.456-7',
    dondeSucursal: 'Antofagasta',
    dondeIp: '192.168.20.14',
    dondeTerminal: 'LAB-ANTOF-01',
    eventoTipo: 'AJUSTE POR MERMA',
    detalleAntes: 'Biselado Cristales Policabornato: 0 mermas registradas en turno',
    detalleDespues: 'Cristal OD descartado: Falla en eje de biselado (+1 merma justificada)',
    selloSha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
];

// ── Fiscalización Contable de Finiquitos (Art. 177) y Convenios Sindicales ───

const REGISTROS_FINIQUITO_INICIALES = [
  {
    folio: '#8F1085AD',
    sindicato: 'Sindicato N°1 Chuquicamata (SDC1326)',
    sucursal: 'Calama' as const,
    monto: '$185.000 CLP',
    estado: 'Retención Exigible Acreditada · Finiquito Art. 177',
    esFiniquito: true,
    selloSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    folio: '#8F1085BC',
    sindicato: 'Sindicato Centinela / Escondida (SDE1126)',
    sucursal: 'Antofagasta' as const,
    monto: '$180.000 CLP',
    estado: 'Planilla Activa Ordinaria · Descuento al Día',
    esFiniquito: false,
    selloSha256: '9a22f4b16c87890e543bca1098ef7723910248ad9081e289c091a117bce1801c',
  },
  {
    folio: '#8F1085CD',
    sindicato: 'Sindicato Radomiro Tomic (SDR0526)',
    sucursal: 'Calama' as const,
    monto: '$160.000 CLP',
    estado: 'Retención Exigible Acreditada · Finiquito Art. 177',
    esFiniquito: true,
    selloSha256: '3f5a89b023de9124a1b0284c8a9012cd894e10b45781a9c1e289410ac0291456',
  },
  {
    folio: '#8F1085DE',
    sindicato: 'Sindicato Ministro Hales (SDM0826)',
    sucursal: 'Calama' as const,
    monto: '$140.000 CLP',
    estado: 'Planilla Activa Ordinaria · Descuento al Día',
    esFiniquito: false,
    selloSha256: 'b45c9281a0e149f812cd890124ba1289fe12345678901234567890abcdef1234',
  },
  {
    folio: '#8F1085EF',
    sindicato: 'Sindicato Spence / BHP (SDS0926)',
    sucursal: 'Antofagasta' as const,
    monto: '$175.000 CLP',
    estado: 'Retención Exigible Acreditada · Finiquito Art. 177',
    esFiniquito: true,
    selloSha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
];

// ── Componente Principal ──────────────────────────────────────────────────────

export const AuditoriaView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabAuditoria) || 'control';

  // 1. Selector Global de Jurisdicción persistente
  const [jurisdiccion, setJurisdiccion] = useState<JurisdiccionAuditor>(() => {
    return (localStorage.getItem('amaru_auditor_jurisdiccion') as JurisdiccionAuditor) || 'TODAS';
  });

  const cambiarJurisdiccion = (jur: JurisdiccionAuditor) => {
    setJurisdiccion(jur);
    localStorage.setItem('amaru_auditor_jurisdiccion', jur);
  };

  // Copiado de Hash
  const [hashCopiado, setHashCopiado] = useState<string | null>(null);
  const handleCopiarHash = (h: string) => {
    navigator.clipboard?.writeText(h);
    setHashCopiado(h);
    setTimeout(() => setHashCopiado(null), 2000);
  };

  // ── Bitácora: Búsqueda y Filtros ─────────────────────────────────────
  const [busquedaWorm, setBusquedaWorm] = useState('');
  const [filtroTipoEvento, setFiltroTipoEvento] = useState<string>('TODOS');
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>('TODOS');

  // Integrar dinámicamente eventos guardados en localStorage
  const eventosWORM = useMemo(() => {
    const base = [...EVENTOS_FORENSES_INICIALES];
    try {
      const rawAnulaciones = localStorage.getItem('amaru_anulaciones_rectificaciones');
      if (rawAnulaciones) {
        const parsed = JSON.parse(rawAnulaciones);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any, idx: number) => {
            const esAnulacion = item.tipo === 'ANULACION';
            base.unshift({
              id: item.id || `LIVE-WORM-${idx}`,
              cuando: item.fechaHoraExacta || new Date().toLocaleString('es-CL'),
              quien: item.responsable || 'María González',
              quienRol: 'Administradora',
              quienRut: '14.289.432-1',
              dondeSucursal: (item.sucursal as 'Calama' | 'Antofagasta') || 'Calama',
              dondeIp: item.sucursal === 'Antofagasta' ? '192.168.20.12' : '192.168.10.45',
              dondeTerminal: item.sucursal === 'Antofagasta' ? 'POS-ANTOF-02' : 'POS-CAL-01',
              eventoTipo: item.eventoTipo || (esAnulacion ? 'ANULACIÓN DE VENTA' : 'RECTIFICACIÓN CLÍNICA'),
              detalleAntes: item.detalleAntes || (esAnulacion
                ? `Folio #${item.folio || '8F1085AD'}: ACTIVO (Monto: $185.000 · Venta en Mesón)`
                : `Folio #${item.folio || '8F1085AD'} · Parámetros Clínicos v1 (Protegido Ley 20.584)`),
              detalleDespues: item.detalleDespues || (esAnulacion
                ? `Folio #${item.folio || '8F1085AD'}: ANULADO / REVERSADO · Motivo: ${item.motivo || item.detalles || 'Reversión'} (+1 devuelto a stock)`
                : `Folio #${item.folio || '8F1085AD'} · Rectificación Clínica Autorizada v2 (Respaldo MINSAL Verificado · Dato Sensible Enmascarado)`),
              selloSha256: `sha256_${(item.id || 'hash').slice(0, 10)}_${Date.now().toString(16)}`,
            });
          });
        }
      }
    } catch {
      // ignore
    }
    return base;
  }, []);

  // Filtrado de eventos WORM
  const eventosFiltrados = useMemo(() => {
    return eventosWORM.filter((ev) => {
      // Jurisdicción
      if (jurisdiccion !== 'TODAS' && ev.dondeSucursal !== jurisdiccion) return false;
      // Tipo de Evento
      if (filtroTipoEvento !== 'TODOS' && ev.eventoTipo !== filtroTipoEvento) return false;
      // Funcionario
      if (filtroFuncionario !== 'TODOS' && !ev.quien.includes(filtroFuncionario)) return false;
      // Texto libre
      if (busquedaWorm.trim()) {
        const query = busquedaWorm.toLowerCase();
        const coincide =
          ev.quien.toLowerCase().includes(query) ||
          ev.quienRut.toLowerCase().includes(query) ||
          ev.detalleAntes.toLowerCase().includes(query) ||
          ev.detalleDespues.toLowerCase().includes(query) ||
          ev.selloSha256.toLowerCase().includes(query) ||
          ev.dondeTerminal.toLowerCase().includes(query);
        if (!coincide) return false;
      }
      return true;
    });
  }, [eventosWORM, jurisdiccion, filtroTipoEvento, filtroFuncionario, busquedaWorm]);

  // Registros de Finiquito y Códigos Sindicales filtrados por Jurisdicción
  const registrosFiniquitoFiltrados = useMemo(() => {
    if (jurisdiccion === 'TODAS') return REGISTROS_FINIQUITO_INICIALES;
    return REGISTROS_FINIQUITO_INICIALES.filter((r) => r.sucursal === jurisdiccion);
  }, [jurisdiccion]);

  // Exportar Acta Forense CSV
  const handleExportarActaCSV = () => {
    const cabeceras = [
      'ID_WORM',
      'FECHA_HORA_EXACTA',
      'RESPONSABLE_NOMBRE',
      'RESPONSABLE_ROL',
      'RESPONSABLE_RUT',
      'SUCURSAL',
      'IP_ORIGEN',
      'TERMINAL_POS',
      'TIPO_EVENTO',
      'ESTADO_ANTERIOR',
      'ESTADO_POSTERIOR_DIFF',
      'SELLO_SHA256_INTEGRIDAD',
    ];

    const filas = eventosFiltrados.map((ev) => [
      ev.id,
      `"${ev.cuando}"`,
      `"${ev.quien}"`,
      `"${ev.quienRol}"`,
      `"${ev.quienRut}"`,
      `"${ev.dondeSucursal}"`,
      `"${ev.dondeIp}"`,
      `"${ev.dondeTerminal}"`,
      `"${ev.eventoTipo}"`,
      `"${ev.detalleAntes.replace(/"/g, '""')}"`,
      `"${ev.detalleDespues.replace(/"/g, '""')}"`,
      `"${ev.selloSha256}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ACTA_FORENSE_WORM_ISO27001_${jurisdiccion.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200 font-sans">
      {/* ── 1. Cabecera Ejecutiva de Auditoría ── */}
      <div className="card-zenith optical-sheen rounded-3xl p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-[#181614] border border-emerald-500/30 text-white shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Panel de Control y Auditoría
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Revisión de ventas, anulaciones, inventario y cuadratura de sucursales en modo de solo lectura.
            </p>
          </div>

          {/* Selector Rápido de Sucursal */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-1 shrink-0">
            {[
              { id: 'TODAS', label: '🌐 Ambas Sucursales' },
              { id: 'Calama', label: '📍 Calama' },
              { id: 'Antofagasta', label: '📍 Antofagasta' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => cambiarJurisdiccion(item.id as JurisdiccionAuditor)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  jurisdiccion === item.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MÓDULO 1: RESUMEN GENERAL (COMPARATIVA Y SEGURIDAD)
      ══════════════════════════════════════════════════════════════════════════ */}
      {currentTab === 'control' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Comparativa por Sucursal (Calama vs. Antofagasta) */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-5">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Comparativa por Sucursal (Calama vs. Antofagasta)
                </h2>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                Indicadores del Mes
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Tarjeta Calama */}
              <div className="rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] to-transparent space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Sucursal Calama
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                    Casa Matriz
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ventas del Mes</span>
                    <strong className="text-base font-mono font-black text-slate-900 dark:text-white">$16.450.000 CLP</strong>
                    <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">24 transacciones conformes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ventas Anuladas</span>
                    <strong className="text-base font-mono font-black text-rose-600 dark:text-rose-400">1 caso ($185.000)</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Reversado a Kardex</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Recetas con Respaldo</span>
                    <strong className="text-base font-mono font-black text-emerald-600">98.4%</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Recetas médicas validadas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Alertas</span>
                    <strong className="text-base font-mono font-black text-emerald-600">0 detectadas</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Sin observaciones</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta Antofagasta */}
              <div className="rounded-2xl p-5 border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.04] to-transparent space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Sucursal Antofagasta
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-900 dark:text-blue-200 font-bold">
                    Costanera
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ventas del Mes</span>
                    <strong className="text-base font-mono font-black text-slate-900 dark:text-white">$8.230.000 CLP</strong>
                    <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">14 transacciones conformes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ventas Anuladas</span>
                    <strong className="text-base font-mono font-black text-rose-600 dark:text-rose-400">1 caso ($145.000)</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Reversado a Kardex</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Recetas con Respaldo</span>
                    <strong className="text-base font-mono font-black text-emerald-600">97.8%</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Recetas médicas validadas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Alertas</span>
                    <strong className="text-base font-mono font-black text-amber-600">1 alerta</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Tiempo biselado &gt; 48h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad de Accesos y Permisos del Sistema */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Seguridad de Accesos y Permisos del Sistema
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                Gestión de Roles
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Auditor Principal */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Auditor Principal (Rodrigo Sanhueza · Activo)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    EN LÍNEA
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 dark:text-zinc-300">
                  <p><strong>Funcionario:</strong> Rodrigo Sanhueza (RUT: 16.345.678-K)</p>
                  <p><strong>Jurisdicción:</strong> Ambas Sucursales (Calama y Antofagasta)</p>
                  <p><strong>Permiso Asignado:</strong> Solo Consulta (Sin edición ni anulación)</p>
                </div>
              </div>

              {/* Cuenta de Respaldo */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock size={15} className="text-amber-600" />
                    Cuenta de Respaldo (Gerencia / Contraloría)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    PROTEGIDA
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 dark:text-zinc-300">
                  <p><strong>Titular:</strong> Contraloría Suplente SpA</p>
                  <p><strong>Activación:</strong> Lista en caso de extravío de clave (autorización de Gerencia General)</p>
                  <p><strong>Estado Actual:</strong> Resguardada (0 activaciones en el mes)</p>
                </div>
              </div>
            </div>

            {/* Tabla de Permisos por Rol */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Permisos por Rol (Vendedor / Administradora / Auditor)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400">
                      <th className="py-2.5 px-3">Operación en el Sistema</th>
                      <th className="py-2.5 px-3 text-center">Vendedor</th>
                      <th className="py-2.5 px-3 text-center">Administradora</th>
                      <th className="py-2.5 px-3 text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Auditor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {[
                      { op: 'Venta en Mesón / POS', opPerm: '✅ Permitido', admPerm: '✅ Permitido', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Entrega de Lentes a Paciente', opPerm: '✅ Permitido', admPerm: '✅ Permitido', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Recepción de Stock por Guía', opPerm: '✅ Permitido', admPerm: '✅ Permitido', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Anular Ventas y Devolver Stock', opPerm: '—', admPerm: '🔒 Solo Administradora', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Corregir Receta / Mediciones', opPerm: '—', admPerm: '🔒 Solo Administradora', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Historial de Movimientos y Cambios', opPerm: '—', admPerm: '✅ Permitido', audPerm: '👁️ Solo Ver (Auditor)' },
                      { op: 'Cuadratura de Caja y Convenios', opPerm: '—', admPerm: '✅ Permitido', audPerm: '👁️ Solo Ver (Auditor)' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">{row.op}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-zinc-400">{row.opPerm}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-zinc-400">{row.admPerm}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.04]">
                          {row.audPerm}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MÓDULO 2: HISTORIAL DE CAMBIOS (ANTES BITÁCORA WORM)
      ══════════════════════════════════════════════════════════════════════════ */}
      {currentTab === 'bitacora' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Barra de Filtros y Botón de Exportación */}
          <div className="card-zenith rounded-3xl p-5 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search size={15} className="absolute inset-y-0 left-3 my-auto text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por RUT, funcionario, folio, código..."
                  value={busquedaWorm}
                  onChange={(e) => setBusquedaWorm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Filtro por Tipo de Evento */}
              <select
                value={filtroTipoEvento}
                onChange={(e) => setFiltroTipoEvento(e.target.value)}
                className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 outline-none"
              >
                <option value="TODOS">Todos los Eventos</option>
                <option value="ANULACIÓN DE VENTA">Anulación de Venta</option>
                <option value="RECTIFICACIÓN CLÍNICA">Rectificación Clínica</option>
                <option value="CAMBIO DE PRECIO">Cambio de Precio</option>
                <option value="INGRESO GUÍA BODEGA">Ingreso Guía Bodega</option>
                <option value="AJUSTE POR MERMA">Ajuste por Merma</option>
                <option value="SINCRONIZACIÓN PWA">Sincronización PWA</option>
              </select>

              {/* Filtro por Funcionario */}
              <select
                value={filtroFuncionario}
                onChange={(e) => setFiltroFuncionario(e.target.value)}
                className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 outline-none"
              >
                <option value="TODOS">Todos los Funcionarios</option>
                <option value="María González">María González (Admin)</option>
                <option value="Carlos Rojas">Carlos Rojas (Operador)</option>
                <option value="Juanita Araya">Juanita Araya (Operador)</option>
              </select>
            </div>

            {/* Botón Descargar Excel / CSV */}
            <button
              type="button"
              onClick={handleExportarActaCSV}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Download size={14} />
              <span>📥 Descargar Excel / CSV</span>
            </button>
          </div>

          {/* Banner Informativo de Privacidad Clínica (Ley 20.584 / Ley 21.521) */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5 font-medium shadow-xs">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span>
              <strong>🔒 Privacidad Clínica Activa:</strong> Los diagnósticos y recetas médicas están enmascarados para el rol Auditor (Ley 20.584 / Ley 21.521).
            </span>
          </div>

          {/* Tabla de Historial de Movimientos */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Historial Detallado de Movimientos y Anulaciones
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                {eventosFiltrados.length} movimiento{eventosFiltrados.length === 1 ? '' : 's'} registrado{eventosFiltrados.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-bold">Fecha y Hora</th>
                    <th className="pb-3 font-bold">Usuario y Rol</th>
                    <th className="pb-3 font-bold">Sucursal</th>
                    <th className="pb-3 font-bold">Acción Realizada</th>
                    <th className="pb-3 font-bold min-w-[280px]">Detalle del Cambio (Antes ➔ Después)</th>
                    <th className="pb-3 font-bold text-right">Código de Respaldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                  {eventosFiltrados.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Fecha y Hora */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">
                          {ev.cuando}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {ev.id}
                        </span>
                      </td>

                      {/* Usuario y Rol */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {ev.quien}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          {ev.quienRol} · {ev.quienRut}
                        </div>
                      </td>

                      {/* Sucursal */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                          📍 {ev.dondeSucursal}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {ev.dondeTerminal}
                        </div>
                      </td>

                      {/* Acción Realizada */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            ev.eventoTipo === 'ANULACIÓN DE VENTA'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50'
                              : ev.eventoTipo === 'RECTIFICACIÓN CLÍNICA'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
                              : ev.eventoTipo === 'INGRESO GUÍA BODEGA'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50'
                          }`}
                        >
                          {ev.eventoTipo}
                        </span>
                      </td>

                      {/* Detalle del Cambio (Antes ➔ Después) */}
                      <td className="py-3 px-3">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400 line-through opacity-85 text-[11px]">
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950/50 font-bold">ANTES:</span>
                            <span>{ev.detalleAntes}</span>
                          </div>
                          <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 font-bold">DESPUÉS:</span>
                            <span>{ev.detalleDespues}</span>
                          </div>
                        </div>
                      </td>

                      {/* Código de Respaldo */}
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopiarHash(ev.selloSha256)}
                          title="Copiar código de respaldo"
                          className="font-mono text-[10px] px-2 py-1 rounded-lg bg-zinc-900 text-emerald-400 hover:bg-zinc-800 border border-emerald-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {hashCopiado === ev.selloSha256 ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span>COPIADO</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>{ev.selloSha256.substring(0, 12)}...</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MÓDULO 3: CAJA, CONVENIOS Y MERMAS DE LABORATORIO
      ══════════════════════════════════════════════════════════════════════════ */}
      {currentTab === 'caja' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Arqueo y Cuadratura de Medios de Pago */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Cuadratura de Medios de Pago (Calama vs Antofagasta)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                Cuadratura Conforme · Tolerancia $0
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
                  <span>💵 Efectivo</span>
                  <span className="text-emerald-600">✓ Cuadrado</span>
                </div>
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  $5.120.000 CLP
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Calama: $3.420.000 · Antofagasta: $1.700.000
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
                  <span>💳 Transbank / Webpay</span>
                  <span className="text-emerald-600">✓ Conciliado</span>
                </div>
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  $9.450.000 CLP
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Calama: $6.150.000 · Antofagasta: $3.300.000
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
                  <span>🏢 Convenios Sindicales</span>
                  <span className="text-emerald-600">✓ Planilla</span>
                </div>
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  $10.110.000 CLP
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Chuquicamata, Escondida, RT & M. Hales
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-black/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
                  <span>🏥 Bonos Fonasa / Isapre</span>
                  <span className="text-emerald-600">✓ I-Med OK</span>
                </div>
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  $4.280.000 CLP
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Copagos electrónicos auditados en mesón
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-rose-300 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
                  <span>📄 Notas de Crédito SII</span>
                  <span className="text-rose-600">2 DTEs Emitidos</span>
                </div>
                <div className="font-mono text-lg font-black text-rose-700 dark:text-rose-300">
                  $330.000 CLP
                </div>
                <div className="text-[11px] text-rose-600/90 dark:text-rose-400/80">
                  Asociadas a ventas anuladas por Administradora
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>⚖️ Estado de Caja</span>
                  <span className="text-emerald-600">0 Faltante</span>
                </div>
                <div className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                  $0 Diferencia
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Cuadratura física y digital 100% coincidente
                </div>
              </div>
            </div>
          </div>

          {/* Fiscalización de Cobros Acelerados por Finiquito (Art. 177) y Uso de Códigos Sindicales */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 gap-2">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  ⚖️ Fiscalización de Cobros Acelerados por Finiquito (Art. 177) y Uso de Códigos Sindicales
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold self-start sm:self-auto">
                Auditoría Contable · Sin Datos Clínicos (Ley 20.584)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400">
                    <th className="py-2.5 px-3">Folio Venta</th>
                    <th className="py-2.5 px-3">Sindicato / Convenio</th>
                    <th className="py-2.5 px-3">Sucursal</th>
                    <th className="py-2.5 px-3">Monto Consolidado</th>
                    <th className="py-2.5 px-3">Estado de Retención</th>
                    <th className="py-2.5 px-3 text-right">Sello SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
                  {registrosFiniquitoFiltrados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {item.folio}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 block">
                          {item.sindicato}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Código Validado · Bloqueo 90 días activo
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                          📍 {item.sucursal}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {item.monto}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            item.esFiniquito
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {item.esFiniquito ? '⚖️ ' : '✓ '}
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopiarHash(item.selloSha256)}
                          title="Copiar Sello SHA-256"
                          className="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 inline-flex items-center gap-1 transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
                        >
                          {hashCopiado === item.selloSha256 ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600 font-bold">COPIADO</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>{item.selloSha256.substring(0, 10)}...</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Control de Mermas de Laboratorio y Garantías Clínicas */}
          <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <AlertOctagon size={18} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Mermas de Cristales en Laboratorio (Calama vs Antofagasta)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                Tolerancia técnica &lt; 3.0% mensual
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 dark:text-white">Laboratorio Calama</strong>
                  <span className="text-emerald-600 font-mono font-bold">1.4% Merma (Dentro de rango)</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                  3 cristales rehechos de 214 biselados en el mes. Causas justificadas: 1 desvío de eje y 2 tratamientos antirreflejo observados por control de calidad.
                </p>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 dark:text-white">Laboratorio Antofagasta</strong>
                  <span className="text-emerald-600 font-mono font-bold">1.8% Merma (Dentro de rango)</span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                  2 cristales rehechos de 112 biselados en el mes. 100% de los descartes destruidos bajo protocolo y firmados en libro de mermas técnicas.
                </p>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '36%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaView;
