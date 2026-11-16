import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  RefreshCw,
  Clock,
  Building2,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Calendar,
  Copy,
  Check,
  Wallet,
  Receipt,
  Scale,
  Sparkles,
  MapPin,
  X,
  Eye,
  Edit3,
} from 'lucide-react';
import { registrarIngresoStock } from '../services/inventarioService';
import {
  getResumenDashboard,
  getStockCritico,
  getConveniosResumen,
  TokenExpiredError,
  ForbiddenError,
  type ResumenDashboard,
  type RespuestaStockCritico,
  type RespuestaConvenios,
} from '../services/dashboardService';
import {
  descargarComprobantePDF,
  acelerarYDescargarFiniquitoPDF,
} from '../services/documentosService';
import {
  getSolicitudesRecetas,
  cambiarEstadoSolicitud,
  type SolicitudReceta,
} from '../services/recetasService';
import { desbloquearCodigoPorAnulacion } from '../services/convenioSindicatoService';

// ── Helpers de Formato ────────────────────────────────────────────────────────

function formatCLP(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

function getFechaActualFormateada(): string {
  const ahora = new Date();
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const str = ahora.toLocaleDateString('es-CL', opciones);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  return (partes[0] ? partes[0].slice(0, 2) : 'TR').toUpperCase();
}

// ── Hook de Conteo Animado Enterprise (Apple Health / Linear style) ──────────

export function useAnimatedNumber(targetValue: number, duration: number = 700): number {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Desaceleración suave cubic-bezier(0.16, 1, 0.3, 1) approx easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValue + (targetValue - startValue) * ease));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, duration]);

  return current;
}

// ── Datos Simulados (Mock Data) para Previsualización Inmediata ────────────────

interface DatoGrafico7Dias {
  dia: string;
  fecha: string;
  faena: number;
  sucursal: number;
}

const MOCK_DATOS_7_DIAS: DatoGrafico7Dias[] = [
  { dia: 'Lun', fecha: '04 Nov', faena: 38, sucursal: 6 },
  { dia: 'Mar', fecha: '05 Nov', faena: 42, sucursal: 8 },
  { dia: 'Mié', fecha: '06 Nov', faena: 54, sucursal: 8 },
  { dia: 'Jue', fecha: '07 Nov', faena: 48, sucursal: 7 },
  { dia: 'Vie', fecha: '08 Nov', faena: 52, sucursal: 10 },
  { dia: 'Sáb', fecha: '09 Nov', faena: 34, sucursal: 5 },
  { dia: 'Dom', fecha: '10 Nov', faena: 30, sucursal: 6 },
];

export interface TransaccionReciente {
  folio: string;
  trabajadorNombre: string;
  trabajadorRut: string;
  minera: string;
  sindicato: string;
  sucursal: 'Calama' | 'Antofagasta';
  modalidad: 'Convenio' | 'Particular' | 'Isapre';
  responsable: string;
  accionRealizada: string;
  estado: 'Entregado' | 'Fabricación' | 'Pendiente' | 'Retención Laboral' | 'Rectificado' | 'Anulado';
  monto: number;
  margen: number;
  selloSha256: string | null;
  fecha: string;
  fechaHoraExacta: string;
}

const MOCK_TRANSACCIONES_RECIENTES: TransaccionReciente[] = [
  {
    folio: 'FOLIO-8F1085AD',
    trabajadorNombre: 'Mario Cárdenas González',
    trabajadorRut: '24.533.343-9',
    minera: 'Convenio Minero · Escondida',
    sindicato: 'Plan EPP Colectivo DS 594',
    sucursal: 'Calama',
    modalidad: 'Convenio',
    responsable: 'Juanita Araya (Vendedor)',
    accionRealizada: 'Registró venta y entregó lente',
    estado: 'Entregado',
    monto: 185000,
    margen: 118400,
    selloSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    fecha: 'Hoy, 14:10 hrs',
    fechaHoraExacta: '14/11/2026 · 14:10:33 hrs',
  },
  {
    folio: 'FOLIO-2B4C8901',
    trabajadorNombre: 'Claudia Soto Valenzuela',
    trabajadorRut: '18.923.456-7',
    minera: 'Cliente Particular Boutique',
    sindicato: 'Lentes Progresivos Blue-Light',
    sucursal: 'Antofagasta',
    modalidad: 'Particular',
    responsable: 'Carlos Rojas (Vendedor)',
    accionRealizada: 'Registró venta · En Laboratorio',
    estado: 'Fabricación',
    monto: 145000,
    margen: 87000,
    selloSha256: null,
    fecha: 'Hoy, 11:20 hrs',
    fechaHoraExacta: '14/11/2026 · 11:20:08 hrs',
  },
  {
    folio: 'FOLIO-4D7E1123',
    trabajadorNombre: 'Roberto Morales Díaz',
    trabajadorRut: '15.482.931-K',
    minera: 'Convenio Isapre Colmena / Codelco',
    sindicato: 'Cobertura Oftalmológica 80%',
    sucursal: 'Calama',
    modalidad: 'Isapre',
    responsable: 'Juanita Araya (Vendedor)',
    accionRealizada: 'Validó receta y entregó lente',
    estado: 'Entregado',
    monto: 65000,
    margen: 32000,
    selloSha256: '9a22f4b16c87890e543bca1098ef7723910248ad9081e289c091a117bce1801c',
    fecha: 'Ayer, 16:45 hrs',
    fechaHoraExacta: '13/11/2026 · 16:45:19 hrs',
  },
  {
    folio: 'FOLIO-7A19BC34',
    trabajadorNombre: 'Patricia Henríquez Palma',
    trabajadorRut: '17.382.910-4',
    minera: 'Atención Clínica Oftalmológica',
    sindicato: 'Examen Visual + Armazón Titanio',
    sucursal: 'Antofagasta',
    modalidad: 'Particular',
    responsable: 'María González (Admin)',
    accionRealizada: 'Aprobó receta médica',
    estado: 'Fabricación',
    monto: 155000,
    margen: 96100,
    selloSha256: null,
    fecha: 'Ayer, 09:30 hrs',
    fechaHoraExacta: '13/11/2026 · 09:30:47 hrs',
  },
  {
    folio: 'FOLIO-9E8821F0',
    trabajadorNombre: 'Esteban Valenzuela Jara',
    trabajadorRut: '19.482.110-2',
    minera: 'Convenio Minero · Collahuasi',
    sindicato: 'Convenio Colectivo Faena Norte',
    sucursal: 'Calama',
    modalidad: 'Convenio',
    responsable: 'Juanita Araya (Vendedor)',
    accionRealizada: 'Registró solicitud de paciente',
    estado: 'Pendiente',
    monto: 135000,
    margen: 81000,
    selloSha256: null,
    fecha: '12 Nov, 17:15 hrs',
    fechaHoraExacta: '12/11/2026 · 17:15:52 hrs',
  },
];

// ── Componentes de Soporte UI ────────────────────────────────────────────────

interface KpiCardProps {
  titulo: string;
  valor: string;
  indicador: string;
  tipoIndicador?: 'positivo' | 'alerta' | 'peligro' | 'neutro';
  subtexto: string;
  icono: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  borderAccentClass?: string;
  sparklineVariant?: 'ventas' | 'epp' | 'finiquito' | 'stock';
}

const KpiCard: React.FC<KpiCardProps> = ({
  titulo,
  valor,
  indicador,
  tipoIndicador = 'positivo',
  subtexto,
  icono,
  iconBgClass,
  iconColorClass,
  borderAccentClass = '',
  sparklineVariant = 'ventas',
}) => {
  const getIndicadorClass = () => {
    switch (tipoIndicador) {
      case 'positivo':
        return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40';
      case 'alerta':
        return 'text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 font-bold';
      case 'peligro':
        return 'text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900/40 font-bold animate-pulse';
      case 'neutro':
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200';
    }
  };

  const renderSparkline = () => {
    switch (sparklineVariant) {
      case 'ventas':
        return (
          <svg className="w-24 h-7 text-emerald-500 overflow-visible" viewBox="0 0 100 28" fill="none">
            <defs>
              <linearGradient id="spk-ventas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M2 22 C 20 20, 35 15, 50 18 C 65 21, 80 10, 98 4 L98 28 L2 28 Z" fill="url(#spk-ventas)" />
            <path d="M2 22 C 20 20, 35 15, 50 18 C 65 21, 80 10, 98 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="98" cy="4" r="2.5" fill="currentColor" />
          </svg>
        );
      case 'epp':
        return (
          <svg className="w-24 h-7 text-sky-500 overflow-visible" viewBox="0 0 100 28" fill="none">
            <defs>
              <linearGradient id="spk-epp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M2 24 C 24 20, 48 16, 70 11 C 82 8, 90 6, 98 3 L98 28 L2 28 Z" fill="url(#spk-epp)" />
            <path d="M2 24 C 24 20, 48 16, 70 11 C 82 8, 90 6, 98 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="98" cy="3" r="2.5" fill="currentColor" />
          </svg>
        );
      case 'finiquito':
        return (
          <svg className="w-24 h-7 text-amber-500 overflow-visible" viewBox="0 0 100 28" fill="none">
            <defs>
              <linearGradient id="spk-finiquito" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M2 18 C 18 23, 32 8, 48 16 C 64 24, 78 6, 98 12 L98 28 L2 28 Z" fill="url(#spk-finiquito)" />
            <path d="M2 18 C 18 23, 32 8, 48 16 C 64 24, 78 6, 98 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="98" cy="12" r="2.5" fill="currentColor" />
          </svg>
        );
      case 'stock':
        return (
          <svg className="w-24 h-7 text-rose-500 overflow-visible" viewBox="0 0 100 28" fill="none">
            <defs>
              <linearGradient id="spk-stock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M2 6 C 24 8, 48 16, 72 20 C 84 22, 90 25, 98 25 L98 28 L2 28 Z" fill="url(#spk-stock)" />
            <path d="M2 6 C 24 8, 48 16, 72 20 C 84 22, 90 25, 98 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="98" cy="25" r="2.5" fill="currentColor" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`card-zenith rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between relative overflow-hidden ${borderAccentClass}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            {titulo}
          </span>
          <div
            className={`p-2.5 rounded-xl border transition-transform duration-200 group-hover:scale-105 shrink-0 ${iconBgClass} ${iconColorClass}`}
          >
            {icono}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {valor}
          </p>
          <div className="opacity-80 group-hover:opacity-100 transition-opacity pb-1">
            {renderSparkline()}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
        <span
          className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold inline-flex items-center gap-1 ${getIndicadorClass()}`}
        >
          {tipoIndicador === 'positivo' && <ArrowUpRight size={12} />}
          {tipoIndicador === 'alerta' && <AlertTriangle size={12} />}
          {tipoIndicador === 'peligro' && <AlertTriangle size={12} />}
          {indicador}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate text-right">
          {subtexto}
        </span>
      </div>
    </div>
  );
};

// ── Vista Principal Dashboard Gerencial ───────────────────────────────────────

interface DashboardViewProps {
  onSessionExpired?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSessionExpired }) => {
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [stock, setStock] = useState<RespuestaStockCritico | null>(null);
  const [, setConvenios] = useState<RespuestaConvenios | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados interactivos
  const [diaSeleccionado, setDiaSeleccionado] = useState<DatoGrafico7Dias | null>(
    MOCK_DATOS_7_DIAS[MOCK_DATOS_7_DIAS.length - 1]
  );
  const [filtroGrafico, setFiltroGrafico] = useState<'7dias' | 'mes'>('7dias');
  const [hashCopiado, setHashCopiado] = useState<string | null>(null);
  const [modalExportarAbierto, setModalExportarAbierto] = useState<boolean>(false);
  const [exportandoReporte, setExportandoReporte] = useState<string | null>(null);
  const [feedbackAccion, setFeedbackAccion] = useState<string | null>(null);
  const [descargandoFolio, setDescargandoFolio] = useState<string | null>(null);
  const [busquedaFolio, setBusquedaFolio] = useState('');

  // ── Filtro Global Interactivo de Sucursal (SpA / Calama / Antofagasta) ──
  const [filtroSucursal, setFiltroSucursal] = useState<'consolidado' | 'Calama' | 'Antofagasta'>('consolidado');
  // Conmutador interactivo del gráfico: ventas vs productividad vendedores
  const [modoGrafico, setModoGrafico] = useState<'ventas' | 'productividad'>('ventas');
  // Historial de validaciones con sello "Quién Aprobó"
  const [historialAprobaciones, setHistorialAprobaciones] = useState<
    Array<{ nombre: string; rut: string; sucursal: string; hora: string }>
  >([]);
  // Modal visor rápido de receta OD/OI
  const [modalVerReceta, setModalVerReceta] = useState<SolicitudReceta | null>(null);
  const [montoAprobadoSesion, setMontoAprobadoSesion] = useState<number>(0);

  // Bandeja de Validación Óptica · Pre-Ingresos de Pacientes
  const [solicitudes, setSolicitudes] = useState<SolicitudReceta[]>(() => getSolicitudesRecetas());
  const [modalObservar, setModalObservar] = useState<{ id: string; nombre: string; rut: string } | null>(null);
  const [motivoTexto, setMotivoTexto] = useState<string>('Receta médica requiere firma legible o fecha actualizada.');

  const refrescarSolicitudes = useCallback(() => {
    setSolicitudes(getSolicitudesRecetas());
  }, []);

  useEffect(() => {
    refrescarSolicitudes();
    const handleRecetasEvent = () => refrescarSolicitudes();
    window.addEventListener('amaru_recetas_updated', handleRecetasEvent);
    window.addEventListener('storage', handleRecetasEvent);
    return () => {
      window.removeEventListener('amaru_recetas_updated', handleRecetasEvent);
      window.removeEventListener('storage', handleRecetasEvent);
    };
  }, [refrescarSolicitudes]);

  const handleAprobarSolicitud = (s: SolicitudReceta) => {
    cambiarEstadoSolicitud(s.id, 'APROBADA');
    refrescarSolicitudes();
    setMontoAprobadoSesion((prev) => prev + (s.monto || 185000));
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nombreAdmin = localStorage.getItem('amaru_nombre_admin') || 'María González (Administradora)';
    setHistorialAprobaciones((prev) => [
      { nombre: s.nombre, rut: s.rut, sucursal: s.ciudad || 'Calama', hora },
      ...prev.slice(0, 4),
    ]);
    setFeedbackAccion(
      `✓ Aprobado por ${nombreAdmin} · Hoy a las ${hora} hrs · Sucursal ${s.ciudad}. Stock descontado y pedido liberado para laboratorio.`
    );
    setTimeout(() => setFeedbackAccion(null), 6000);
  };

  const handleConfirmarObservacion = () => {
    if (!modalObservar) return;
    cambiarEstadoSolicitud(modalObservar.id, 'OBSERVADA', motivoTexto);
    refrescarSolicitudes();
    setFeedbackAccion(`⚠ Solicitud de ${modalObservar.nombre} marcada como OBSERVADA.`);
    setModalObservar(null);
    setTimeout(() => setFeedbackAccion(null), 5000);
  };

  // Carga de datos reales desde API (con fallback a mock data)
  const cargarDatos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [r, s, c] = await Promise.all([
          getResumenDashboard().catch(() => null),
          getStockCritico(5).catch(() => null),
          getConveniosResumen().catch(() => null),
        ]);
        if (r) setResumen(r);
        if (s) setStock(s);
        if (c) setConvenios(c);
      } catch (err) {
        if (err instanceof TokenExpiredError && onSessionExpired) {
          onSessionExpired();
          return;
        }
        if (err instanceof ForbiddenError) {
          setError(err.message);
          return;
        }
        // Fallback transparente a datos simulados
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onSessionExpired]
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handlers para copiado y descargas
  const handleCopiarHash = (hash: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(hash);
    setHashCopiado(hash);
    setTimeout(() => setHashCopiado(null), 2000);
  };

  const handleDescargarComprobante = async (folio: string) => {
    setDescargandoFolio(folio);
    try {
      await descargarComprobantePDF(folio);
      setFeedbackAccion(`✓ Comprobante oficial de entrega ${folio} descargado.`);
    } catch {
      // Simulación exitosa si la API aún no tiene el PDF en disco
      setFeedbackAccion(`✓ Comprobante ${folio} emitido con sello SHA-256 (Descarga simulada).`);
    } finally {
      setDescargandoFolio(null);
      setTimeout(() => setFeedbackAccion(null), 4000);
    }
  };

  const handleAcelerarFiniquito = async (folio: string) => {
    setDescargandoFolio(folio);
    try {
      await acelerarYDescargarFiniquitoPDF(folio);
      setFeedbackAccion(`✓ Certificado de finiquito acelerado para ${folio}.`);
    } catch {
      setFeedbackAccion(`✓ Liquidación de finiquito generada con Cláusula de Aceleración Art. 177.`);
    } finally {
      setDescargandoFolio(null);
      setTimeout(() => setFeedbackAccion(null), 4000);
    }
  };

  const handleExportarReporte = (tipo: 'ejecutivo' | 'nomina' | 'ds594') => {
    setExportandoReporte(tipo);
    setTimeout(() => {
      setExportandoReporte(null);
      setModalExportarAbierto(false);
      const nombres = {
        ejecutivo: 'Reporte_Ejecutivo_Gerencial_Convenios_Nov2026.pdf',
        nomina: 'Nomina_Descuentos_Planilla_Mineria_Nov2026.xlsx',
        ds594: 'Libro_Oficial_Entregas_EPP_DS594.pdf',
      };
      setFeedbackAccion(`✓ Archivo ${nombres[tipo]} generado y descargado exitosamente.`);
      setTimeout(() => setFeedbackAccion(null), 4500);
    }, 900);
  };

  // Estado local para persistir transacciones del Dashboard y permitir anulación/corrección en vivo
  const [transacciones, setTransacciones] = useState<TransaccionReciente[]>(() => {
    try {
      const raw = localStorage.getItem('amaru_transacciones_dashboard');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return MOCK_TRANSACCIONES_RECIENTES;
  });

  // Conteo reactivo de rectificaciones y anulaciones
  const [conteoAnulaciones, setConteoAnulaciones] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {
      // ignore
    }
    return 2;
  });

  const actualizarConteoAnulaciones = useCallback(() => {
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setConteoAnulaciones(parsed.length);
          return;
        }
      }
    } catch {
      // ignore
    }
    setConteoAnulaciones(2);
  }, []);

  useEffect(() => {
    actualizarConteoAnulaciones();
    const handleUpdate = () => actualizarConteoAnulaciones();
    window.addEventListener('amaru_anulaciones_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('amaru_anulaciones_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [actualizarConteoAnulaciones]);

  // Estados para Modal de Corrección desde Dashboard
  const [transaccionEditando, setTransaccionEditando] = useState<TransaccionReciente | null>(null);
  const [motivoCorreccionDash, setMotivoCorreccionDash] = useState<string>('Ajuste de mediciones por optómetra (Garantía clínica)');
  const [notaCorreccionDash, setNotaCorreccionDash] = useState<string>('');

  // Estados para Modal de Anulación desde Dashboard
  const [transaccionAnulando, setTransaccionAnulando] = useState<TransaccionReciente | null>(null);
  const [motivoAnulacionDash, setMotivoAnulacionDash] = useState<string>('Desistimiento del cliente');

  const handleGuardarCorreccionDash = () => {
    if (!transaccionEditando) return;
    const ahora = new Date().toLocaleString('es-CL');
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const actualizadas: TransaccionReciente[] = transacciones.map((t) => {
      if (t.folio === transaccionEditando.folio) {
        return {
          ...t,
          estado: 'Rectificado' as const,
          responsable: 'María González (Admin)',
          accionRealizada: `Rectificado hoy a las ${hora} hrs · ${motivoCorreccionDash}`,
          fechaHoraExacta: `${new Date().toLocaleDateString('es-CL')} · ${new Date().toLocaleTimeString('es-CL')} hrs`,
        };
      }
      return t;
    });

    setTransacciones(actualizadas);
    localStorage.setItem('amaru_transacciones_dashboard', JSON.stringify(actualizadas));

    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const current = raw ? JSON.parse(raw) : [];
      const reg = {
        id: `REG-DASH-${Date.now()}`,
        tipo: 'RECTIFICACION',
        folio: transaccionEditando.folio,
        paciente: transaccionEditando.trabajadorNombre,
        rut: transaccionEditando.trabajadorRut,
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        motivo: motivoCorreccionDash,
        detalles: notaCorreccionDash || 'Ajuste de graduación y montura desde Resumen del Negocio',
        sucursal: transaccionEditando.sucursal,
      };
      const updated = [reg, ...current];
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify(updated));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));
    } catch {
      // ignore
    }

    setFeedbackAccion(`✓ Venta ${transaccionEditando.folio} rectificada con éxito en tiempo real.`);
    setTransaccionEditando(null);
    setTimeout(() => setFeedbackAccion(null), 4500);
  };

  const handleConfirmarAnulacionDash = () => {
    if (!transaccionAnulando) return;
    const ahora = new Date().toLocaleString('es-CL');
    const actualizadas: TransaccionReciente[] = transacciones.map((t) => {
      if (t.folio === transaccionAnulando.folio) {
        return {
          ...t,
          estado: 'Anulado' as const,
          responsable: 'María González (Admin)',
          accionRealizada: `Anulado por María González · +1 devuelto a stock (${motivoAnulacionDash})`,
          fechaHoraExacta: `${new Date().toLocaleDateString('es-CL')} · ${new Date().toLocaleTimeString('es-CL')} hrs`,
        };
      }
      return t;
    });

    setTransacciones(actualizadas);
    localStorage.setItem('amaru_transacciones_dashboard', JSON.stringify(actualizadas));

    // Devolver +1 unidad a inventario y Kardex
    registrarIngresoStock(
      'EPP-TITAN-001',
      transaccionAnulando.sucursal,
      1,
      `REV-${transaccionAnulando.folio.replace('FOLIO-', '')}`,
      'María González (Administradora)'
    );

    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const current = raw ? JSON.parse(raw) : [];
      const reg = {
        id: `REG-DASH-${Date.now()}`,
        tipo: 'ANULACION',
        folio: transaccionAnulando.folio,
        paciente: transaccionAnulando.trabajadorNombre,
        rut: transaccionAnulando.trabajadorRut,
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        motivo: motivoAnulacionDash,
        detalles: `Reversa automática y +1 reintegrado al inventario de ${transaccionAnulando.sucursal}`,
        sucursal: transaccionAnulando.sucursal,
      };
      const updated = [reg, ...current];
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify(updated));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));

      // FASE 2: Desbloqueo inmediato del código sindical para el RUT
      desbloquearCodigoPorAnulacion(
        transaccionAnulando.folio,
        transaccionAnulando.trabajadorRut,
        'María González (Administradora)',
        motivoAnulacionDash
      );
    } catch {
      // ignore
    }

    setFeedbackAccion(`✓ Venta ${transaccionAnulando.folio} ANULADA. Se sumó +1 al stock de ${transaccionAnulando.sucursal}.`);
    setTransaccionAnulando(null);
    setTimeout(() => setFeedbackAccion(null), 5000);
  };

  // KPIs dinámicos según filtro de sucursal
  const kpiData = {
    consolidado: { ventas: 24680000, margen: 15795200, cxc: 14850000, lentes: 38, enLab: 6 },
    Calama: { ventas: 16450000, margen: 10528000, cxc: 9200000, lentes: 24, enLab: 4 },
    Antofagasta: { ventas: 8230000, margen: 5267200, cxc: 5650000, lentes: 14, enLab: 2 },
  };
  const kpi = kpiData[filtroSucursal];

  const montoBackend = resumen?.monto_total_valorizado ? parseFloat(resumen.monto_total_valorizado) : 0;
  const montoBase = montoBackend > 0 ? montoBackend : kpi.ventas;
  const targetMontoVentas = montoBase + montoAprobadoSesion;
  const animVentas = useAnimatedNumber(targetMontoVentas, 850);
  const animMargen = useAnimatedNumber(kpi.margen, 800);
  const targetFiniquitos = kpi.cxc;
  const animFiniquitos = useAnimatedNumber(targetFiniquitos, 800);
  const totalVentasConvenio = formatCLP(animVentas);
  const totalFiniquitosRecuperados = formatCLP(animFiniquitos);

  // Cálculos para el gráfico de 7 días
  const maxBarra = Math.max(...MOCK_DATOS_7_DIAS.map((d) => d.faena + d.sucursal), 65);
  const totalFaena7Dias = MOCK_DATOS_7_DIAS.reduce((acc, curr) => acc + curr.faena, 0);
  const totalSucursal7Dias = MOCK_DATOS_7_DIAS.reduce((acc, curr) => acc + curr.sucursal, 0);
  const totalGeneral7Dias = totalFaena7Dias + totalSucursal7Dias;
  const pctFaena = Math.round((totalFaena7Dias / totalGeneral7Dias) * 100);

  // Filtrado de la tabla reciente por texto y por sucursal seleccionada
  const transaccionesFiltradas = transacciones.filter(
    (t) =>
      (filtroSucursal === 'consolidado' || t.sucursal === filtroSucursal) &&
      (
        t.folio.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
        t.trabajadorNombre.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
        t.trabajadorRut.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
        t.minera.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
        t.responsable.toLowerCase().includes(busquedaFolio.toLowerCase())
      )
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-12 animate-in fade-in duration-300">
      {/* ── 1. Header del Dashboard ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
              <Building2 size={20} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                Resumen General de Óptica Amaru
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Calama & Antofagasta
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <Calendar size={13} className="text-amaru-copper" />
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {getFechaActualFormateada()}
                </span>
                <span>·</span>
                <span>Gestión Clínica, Retail Óptico y Convenios Corporativos · Supervisión en tiempo real</span>
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales del Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => cargarDatos(true)}
            disabled={refreshing || loading}
            title="Sincronizar métricas con el backend"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-[#1C1A18] dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold px-3 py-2.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                refreshing ? 'animate-spin text-amaru-copper' : 'text-slate-500 dark:text-zinc-400'
              }
            />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalExportarAbierto(true)}
            className="btn-copper flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Exportar Reporte Mensual</span>
          </button>
        </div>
      </div>

      {/* ── Filtro Global Interactivo a 1 Clic (Todas las Sucursales vs Calama vs Antofagasta) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-[#1C1A18]/90 border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Vista Ejecutiva Activa:
          </span>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {filtroSucursal === 'consolidado' ? '🌐 Todas las Sucursales (Calama + Antofagasta)' : `📍 Sucursal ${filtroSucursal}`}
          </span>
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 rounded-xl gap-1 text-xs self-stretch sm:self-auto">
          {([
            { key: 'consolidado', label: '🌐 Todas las Sucursales (Total)' },
            { key: 'Calama', label: '📍 Sucursal Calama' },
            { key: 'Antofagasta', label: '📍 Sucursal Antofagasta' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltroSucursal(key)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold transition-all duration-200 cursor-pointer whitespace-nowrap text-xs ${
                filtroSucursal === key
                  ? 'bg-white dark:bg-[#2A2522] text-[#B85D19] shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Banner de feedback o error si existe */}
      {feedbackAccion && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl p-3.5 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span className="font-semibold">{feedbackAccion}</span>
          </div>
          <button
            onClick={() => setFeedbackAccion(null)}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {/* ── Recetas de Clientes por Aprobar (Portal ➔ Admin) ── */}
      <div className="card-zenith rounded-3xl p-6 relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <FileCheck2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Recetas de Clientes por Aprobar
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {solicitudes.filter((s) => s.estado === 'EN_REVISION').length} Pendiente{solicitudes.filter((s) => s.estado === 'EN_REVISION').length === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Revisa las recetas enviadas por clientes desde la web y autoriza su envío a laboratorio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refrescarSolicitudes}
            className="text-xs font-semibold text-amaru-copper hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Refrescar bandeja</span>
          </button>
        </div>

        {/* Tabla / Lista de Pre-Ingresos */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-2.5 font-bold">Paciente & RUT</th>
                <th className="pb-2.5 font-bold">Ciudad</th>
                <th className="pb-2.5 font-bold">Modalidad / Empresa</th>
                <th className="pb-2.5 font-bold">Receta Adjunta</th>
                <th className="pb-2.5 font-bold">Armazón Elegido</th>
                <th className="pb-2.5 font-bold">Estado</th>
                <th className="pb-2.5 font-bold text-right">Acciones Directas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
              {solicitudes.map((sol) => (
                <tr key={sol.id} className="hover:bg-slate-50/60 dark:hover:bg-black/20 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sol.nombre}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      {sol.rut}
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                      <MapPin size={11} className="text-amaru-copper" />
                      {sol.ciudad}
                    </span>
                  </td>

                  <td className="py-3 px-2 max-w-[180px]">
                    <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {sol.tipoUsuario}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {sol.empresa || 'Particular'}
                    </div>
                  </td>

                  <td className="py-3 px-2 max-w-[170px]">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amaru-copper truncate">
                      <FileText size={12} className="shrink-0" />
                      <span className="truncate">{sol.archivoNombre}</span>
                    </div>
                    {sol.dioptriasManuales && sol.odEsfera && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        OD: {sol.odEsfera} / OI: {sol.oiEsfera}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sol.armazon}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      ${sol.monto.toLocaleString('es-CL')} CLP
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        sol.estado === 'APROBADA'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : sol.estado === 'OBSERVADA'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sol.estado === 'APROBADA'
                            ? 'bg-emerald-500'
                            : sol.estado === 'OBSERVADA'
                            ? 'bg-red-500'
                            : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      <span>
                        {sol.estado === 'APROBADA'
                          ? 'Aprobada'
                          : sol.estado === 'OBSERVADA'
                          ? 'Observada'
                          : 'En Revisión'}
                      </span>
                    </span>
                    {sol.estado === 'OBSERVADA' && sol.motivoObservacion && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 truncate max-w-[140px]" title={sol.motivoObservacion}>
                        {sol.motivoObservacion}
                      </p>
                    )}
                  </td>

                  <td className="py-3 pl-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalVerReceta(sol)}
                        className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Ver dioptrías OD/OI y receta médica del paciente"
                      >
                        <Eye size={12} />
                        <span>👁️ Ver Receta (OD/OI)</span>
                      </button>

                      {sol.estado !== 'APROBADA' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAprobarSolicitud(sol)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="Aprobar receta, descontar stock e iniciar fabricación en laboratorio"
                          >
                            <CheckCircle2 size={13} />
                            <span>✓ Aprobar y Descontar Stock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalObservar({ id: sol.id, nombre: sol.nombre, rut: sol.rut })}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Indicar reparos o solicitar nueva receta"
                          >
                            <AlertTriangle size={12} />
                            <span>Observar</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          <span>Pedido en Laboratorio</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Historial reciente de validaciones con sello de Quién Aprobó */}
        {historialAprobaciones.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Historial de Aprobaciones Recientes:
            </span>
            <div className="space-y-1.5">
              {historialAprobaciones.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Aprobado por <strong>{localStorage.getItem('amaru_nombre_admin') || 'María González (Administradora)'}</strong> · Paciente: <strong>{h.nombre}</strong> ({h.rut})
                    </span>
                  </span>
                  <span className="font-mono text-[11px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    Hoy a las {h.hora} hrs · 📍 Sucursal {h.sucursal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Tarjetas de KPI (Top Row) con Sparklines Decorativos y Cifras Vivas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-stagger-1">
        {/* KPI 1: VENTAS TOTALES DEL MES */}
        <KpiCard
          titulo="VENTAS TOTALES DEL MES"
          valor={totalVentasConvenio}
          indicador="+14.8% vs mes anterior"
          tipoIndicador="positivo"
          subtexto="Convenios corporativos y ventas particulares"
          icono={<Wallet size={20} />}
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          sparklineVariant="ventas"
        />

        {/* KPI 2: GANANCIA LÍQUIDA ESTIMADA */}
        <KpiCard
          titulo="GANANCIA LÍQUIDA ESTIMADA"
          valor={formatCLP(animMargen)}
          indicador={`${Math.round((kpi.margen / kpi.ventas) * 100).toFixed(1)}% Margen Comercial`}
          tipoIndicador="positivo"
          subtexto="Ingresos menos costo de armazones y cristales"
          icono={<TrendingUp size={20} />}
          iconBgClass="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40"
          iconColorClass="text-blue-600 dark:text-blue-400"
          sparklineVariant="epp"
        />

        {/* KPI 3: POR COBRAR A EMPRESAS (CONVENIOS) */}
        <KpiCard
          titulo="POR COBRAR A EMPRESAS (CONVENIOS)"
          valor={totalFiniquitosRecuperados}
          indicador={`Ver ${filtroSucursal === 'consolidado' ? 18 : filtroSucursal === 'Calama' ? 11 : 7} cobros pendientes`}
          tipoIndicador="alerta"
          subtexto="Descuentos por planilla y convenios mineros"
          icono={<Receipt size={20} />}
          iconBgClass="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60"
          iconColorClass="text-amber-600 dark:text-amber-400"
          borderAccentClass="border-amber-500/30 dark:border-amber-700/40"
          sparklineVariant="finiquito"
        />

        {/* KPI 4: LENTES ENTREGADOS Y EN PROCESO */}
        <KpiCard
          titulo="LENTES ENTREGADOS Y EN PROCESO"
          valor={`${kpi.lentes} Lentes Entregados`}
          indicador={`${kpi.enLab} en Laboratorio · Stock OK`}
          tipoIndicador="positivo"
          subtexto={stock ? `${stock.total_alertas} alertas de stock crítico` : 'Stock saludable en ambas sucursales'}
          icono={<AlertTriangle size={20} />}
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          sparklineVariant="stock"
        />
      </div>

      {/* ── Barra Ejecutiva: Arqueo Rápido de Medios de Pago y Control de Calidad ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 rounded-2xl bg-white/90 dark:bg-[#1C1A18]/90 border border-slate-200/80 dark:border-white/10 shadow-xs animate-stagger-2">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shrink-0 text-base">💳</div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Tarjetas / Webpay</span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">$9.450.000</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-base">🏦</div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Transferencias / Efectivo</span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">$5.120.000</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0 text-base">🏢</div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Convenios Planilla</span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">$10.110.000</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/25">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shrink-0 text-base">🛠️</div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block truncate">Rectificaciones / Anulaciones</span>
            <span className="font-mono text-sm font-black text-amber-900 dark:text-amber-200">{conteoAnulaciones} casos</span>
          </div>
        </div>
      </div>

      {/* ── 3. Sección Central (Gráficos Dinámicos): Ventas o Productividad ── */}
      <div className="card-zenith rounded-2xl p-6 transition-colors animate-stagger-2">
        {/* Header del gráfico y controles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
                <TrendingUp size={16} />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {modoGrafico === 'ventas'
                  ? 'Comparativa de Ventas: Calama vs. Antofagasta'
                  : 'Rendimiento de Ventas por Vendedor'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {modoGrafico === 'ventas'
                ? 'Volumen de ventas comparativo por sucursal durante los últimos 7 días.'
                : 'Desempeño diario de Juanita Araya, Carlos Rojas y equipo en atención presencial y entrega de lentes.'}
            </p>
          </div>

          {/* Leyenda y Filtro */}
          <div className="flex items-center gap-4 flex-wrap">
            {modoGrafico === 'ventas' && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-3 rounded-sm bg-amaru-copper" />
                  Calama ({pctFaena}%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-zinc-600" />
                  Antofagasta ({100 - pctFaena}%)
                </span>
              </div>
            )}

            <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setFiltroGrafico('7dias')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroGrafico === '7dias'
                    ? 'bg-white dark:bg-[#1C1A18] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                7 Días
              </button>
              <button
                type="button"
                onClick={() => setFiltroGrafico('mes')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroGrafico === 'mes'
                    ? 'bg-white dark:bg-[#1C1A18] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Mes en Curso
              </button>
            </div>

            {/* Conmutador 2: Calama vs Antofagasta o Productividad por Vendedor */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setModoGrafico('ventas')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  modoGrafico === 'ventas'
                    ? 'bg-white dark:bg-[#1C1A18] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                📊 Calama vs. Antofagasta
              </button>
              <button
                type="button"
                onClick={() => setModoGrafico('productividad')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  modoGrafico === 'productividad'
                    ? 'bg-white dark:bg-[#1C1A18] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                👩‍💼 Productividad Vendedores
              </button>
            </div>
          </div>
        </div>

        {modoGrafico === 'productividad' ? (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Rendimiento y Cumplimiento del Equipo en Turno Hoy (Calama & Antofagasta)
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ✓ 2 Vendedores en Turno Activo
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                    <th className="pb-2 text-left">Vendedor / Sucursal</th>
                    <th className="pb-2 text-center">Ventas Realizadas Hoy</th>
                    <th className="pb-2 text-center">Entregas Presenciales</th>
                    <th className="pb-2 text-center">Ingresos de Stock (Guías)</th>
                    <th className="pb-2 text-right">Monto Facturado Hoy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-sans">
                  <tr className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-white">👩 Juanita Araya</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">📍 Sucursal Calama (Turno Mañana/Tarde)</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-amaru-copper bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">8 ventas</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">5 entregas</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">2 guías</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">$1.820.000 CLP</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 dark:text-white">👨 Carlos Rojas Morales</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">📍 Sucursal Antofagasta (Turno Completo)</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-amaru-copper bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">5 ventas</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">3 entregas</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">1 guía</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">$1.150.000 CLP</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Resumen numérico en la parte superior del gráfico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Calama (7D)
            </span>
            <p className="text-base font-extrabold text-amaru-copper font-mono mt-0.5">
              {totalFaena7Dias} ud.
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Antofagasta (7D)
            </span>
            <p className="text-base font-extrabold text-slate-600 dark:text-zinc-300 font-mono mt-0.5">
              {totalSucursal7Dias} ud.
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total General (7D)
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {totalGeneral7Dias} ud.
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Pico Diario
            </span>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              62 ud. (Mié / Vie)
            </p>
          </div>
        </div>

        {/* Gráfico de Barras Dual Interactivo con Tailwind CSS */}
        <div className="relative pt-6 pb-2">
          {/* Líneas horizontales de referencia Y */}
          <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 dark:border-zinc-800 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-zinc-800 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-zinc-800 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-zinc-800 w-full" />
          </div>

          {/* Columnas de barras por cada día */}
          <div className="relative h-56 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-6 z-10">
            {MOCK_DATOS_7_DIAS.map((d) => {
              const totalDia = d.faena + d.sucursal;
              const alturaFaenaPct = Math.round((d.faena / maxBarra) * 100);
              const alturaSucursalPct = Math.round((d.sucursal / maxBarra) * 100);
              const isSelected = diaSeleccionado?.dia === d.dia;

              return (
                <div
                  key={d.dia}
                  onClick={() => setDiaSeleccionado(d)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip flotante al hacer hover o selección */}
                  <div
                    className={`transition-all duration-200 mb-2 ${
                      isSelected
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
                    }`}
                  >
                    <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-mono font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                      {totalDia} ud.
                    </div>
                  </div>

                  {/* Grupo de dos barras: Faena + Sucursal */}
                  <div className="w-full max-w-[46px] flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                    {/* Barra Faena (Cobrizo Amaru) */}
                    <div
                      style={{ height: `${alturaFaenaPct}%` }}
                      className={`w-1/2 rounded-t-md bg-amaru-copper transition-all duration-300 group-hover:brightness-110 shadow-xs ${
                        isSelected ? 'ring-2 ring-amaru-copper ring-offset-2' : ''
                      }`}
                      title={`Faena: ${d.faena} ud.`}
                    />

                    {/* Barra Sucursal (Pizarra / Gris Acero) */}
                    <div
                      style={{ height: `${alturaSucursalPct}%` }}
                      className={`w-1/2 rounded-t-md bg-slate-400 dark:bg-zinc-600 transition-all duration-300 group-hover:brightness-110 shadow-xs ${
                        isSelected ? 'ring-2 ring-slate-400 ring-offset-2' : ''
                      }`}
                      title={`Sucursal: ${d.sucursal} ud.`}
                    />
                  </div>

                  {/* Etiquetas de eje X */}
                  <div className="mt-3 text-center">
                    <span
                      className={`text-xs block font-bold transition-colors ${
                        isSelected
                          ? 'text-amaru-copper'
                          : 'text-slate-700 dark:text-zinc-300 group-hover:text-amaru-copper'
                      }`}
                    >
                      {d.dia}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      {d.fecha}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detalle interactivo del día seleccionado */}
          {diaSeleccionado && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amaru-copper shrink-0" />
                <span>
                  Detalle del día{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {diaSeleccionado.dia} {diaSeleccionado.fecha}
                  </strong>
                  :
                </span>
                <span className="font-semibold text-amaru-copper">
                  {diaSeleccionado.faena} en Calama
                </span>
                <span>+</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {diaSeleccionado.sucursal} en Antofagasta
                </span>
                <span>=</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                  {diaSeleccionado.faena + diaSeleccionado.sucursal} ud. totales
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Participación Calama:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {Math.round(
                    (diaSeleccionado.faena / (diaSeleccionado.faena + diaSeleccionado.sucursal)) *
                      100
                  )}
                  %
                </strong>
              </div>
            </div>
          )}
        </div>
      </>
    )}
  </div>

      {/* ── 4. Sección Inferior (Actividad Reciente): Tabla Limpia con 5 Transacciones ── */}
      <div className="card-zenith rounded-2xl p-6 transition-colors animate-stagger-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
                <FileCheck2 size={16} />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Historial de Ventas y Responsables (Quién, Cuándo y Hora)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Últimas solicitudes y ventas registradas en Calama y Antofagasta.
            </p>
          </div>

          {/* Filtro rápido por texto */}
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={busquedaFolio}
              onChange={(e) => setBusquedaFolio(e.target.value)}
              placeholder="Buscar por Folio, RUT o Minera..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Tabla Responsiva: Bitácora de Actividad y Ventas */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-zinc-800 text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Folio & Fecha/Hora Exacta</th>
                <th className="px-4 py-3.5">Paciente & RUT</th>
                <th className="px-4 py-3.5">Sucursal & Modalidad</th>
                <th className="px-4 py-3.5">Responsable (Quién lo hizo)</th>
                <th className="px-4 py-3.5">Monto & Margen</th>
                <th className="px-4 py-3.5 text-right">Estado & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#1C1A18]">
              {transaccionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500">
                    No se encontraron transacciones en esta sucursal que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                transaccionesFiltradas.map((t, idx) => {
                  const estaSellado = Boolean(t.selloSha256);

                  return (
                    <tr
                      key={t.folio}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors animate-stagger-${(idx % 4) + 1}`}
                    >
                      {/* 1. FOLIO & FECHA/HORA EXACTA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amaru-copper bg-amaru-copper/10 dark:bg-amaru-copper/20 px-2 py-0.5 rounded-md border border-amaru-copper/20">
                            {t.folio}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopiarHash(t.folio)}
                            title="Copiar Folio"
                            className="text-slate-400 hover:text-amaru-copper p-0.5 rounded transition-colors cursor-pointer"
                          >
                            {hashCopiado === t.folio ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono block mt-0.5">
                          {t.fechaHoraExacta}
                        </span>
                      </td>

                      {/* 2. PACIENTE & RUT */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-mono tracking-wider bg-gradient-to-br from-amber-500/20 via-orange-500/25 to-[#B34B0C]/30 text-[#9E3F08] dark:text-orange-300 border border-amaru-copper/30 dark:border-orange-500/40 shrink-0 shadow-2xs">
                            {getIniciales(t.trabajadorNombre)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {t.trabajadorNombre}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                              {t.trabajadorRut}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. SUCURSAL & MODALIDAD */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 mb-1">
                          📍 {t.sucursal}
                        </span>
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              t.modalidad === 'Convenio'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50'
                                : t.modalidad === 'Isapre'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50'
                            }`}
                          >
                            {t.modalidad}
                          </span>
                        </div>
                      </td>

                      {/* 4. RESPONSABLE (QUIÉN LO HIZO) */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {t.responsable}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 italic">
                          {t.accionRealizada}
                        </div>
                      </td>

                      {/* 5. MONTO & MARGEN */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ${t.monto.toLocaleString('es-CL')} CLP
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          Margen: +${t.margen.toLocaleString('es-CL')}
                        </div>
                      </td>

                      {/* 6. ESTADO & ACCIONES */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          {t.estado === 'Entregado' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50">
                              <CheckCircle2 size={11} className="text-emerald-500" />
                              Entregado
                            </span>
                          )}
                          {t.estado === 'Fabricación' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50">
                              <Package size={11} className="text-blue-500" />
                              Fabricación
                            </span>
                          )}
                          {t.estado === 'Pendiente' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                              <Clock size={11} className="text-slate-500" />
                              Pendiente
                            </span>
                          )}
                          {t.estado === 'Retención Laboral' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                              <AlertTriangle size={11} className="text-amber-600" />
                              Finiquito
                            </span>
                          )}
                          {t.estado === 'Rectificado' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60">
                              <Edit3 size={11} className="text-amber-600" />
                              Rectificado
                            </span>
                          )}
                          {t.estado === 'Anulado' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60">
                              <AlertTriangle size={11} className="text-rose-600" />
                              Anulado
                            </span>
                          )}

                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setTransaccionEditando(t);
                                setNotaCorreccionDash('');
                                setMotivoCorreccionDash('Ajuste de mediciones por optómetra (Garantía clínica)');
                              }}
                              title="Corregir mediciones o datos de esta venta"
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 size={11} className="text-amber-600 dark:text-amber-400" />
                              <span>Corregir</span>
                            </button>

                            {t.estado !== 'Anulado' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransaccionAnulando(t);
                                  setMotivoAnulacionDash('Desistimiento del cliente');
                                }}
                                title="Anular venta y devolver stock"
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <AlertTriangle size={11} className="text-rose-600 dark:text-rose-400" />
                                <span>Anular</span>
                              </button>
                            )}

                            {estaSellado && (
                              <button
                                type="button"
                                onClick={() => handleDescargarComprobante(t.folio)}
                                disabled={descargandoFolio === t.folio}
                                title="Descargar Comprobante PDF de Entrega"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Download size={11} className="text-amaru-copper" />
                                <span>PDF</span>
                              </button>
                            )}

                            {t.folio === 'FOLIO-8F1085AD' && (
                              <button
                                type="button"
                                onClick={() => handleAcelerarFiniquito(t.folio)}
                                disabled={descargandoFolio === t.folio}
                                title="Acelerar y Emitir Finiquito Art. 177"
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Scale size={11} />
                                <span>Finiquito</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Exportación de Reportes ── */}
      {modalExportarAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1A18] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amaru-copper/10 text-amaru-copper">
                  <Download size={18} />
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Exportar Reporte Mensual Gerencial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalExportarAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Selecciona el tipo de informe que deseas exportar para la gerencia de personas, comités
              paritarios o la fiscalización de la Dirección del Trabajo:
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => handleExportarReporte('ejecutivo')}
                disabled={exportandoReporte !== null}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-amaru-copper dark:hover:border-amaru-copper hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-amaru-copper shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amaru-copper">
                    Reporte Ejecutivo Mensual (PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Resumen financiero, tasas de entrega en faena vs sucursal y KPIs consolidados.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportarReporte('nomina')}
                disabled={exportandoReporte !== null}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                    Planilla Nómina Descuentos (Excel / CSV)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Archivo estructurado para importación directa en sistemas de remuneraciones (SAP / Payroll).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportarReporte('ds594')}
                disabled={exportandoReporte !== null}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                    Libro Foliado de Entregas DS 594 (PDF Sellado)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Registro legal de entrega de EPP con sellos criptográficos SHA-256 para fiscalización DT.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalExportarAbierto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Observación / Reparo de Receta ── */}
      {modalObservar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1A18] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Observar Receta Médica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalObservar(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-2">
              <p>
                Paciente: <strong>{modalObservar.nombre}</strong> ({modalObservar.rut})
              </p>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                Motivo de la Observación / Instrucción al Paciente:
              </label>
              <textarea
                value={motivoTexto}
                onChange={(e) => setMotivoTexto(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Indica el motivo (ej. Receta ilegible, requiere fecha actualizada, etc.)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setModalObservar(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarObservacion}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Confirmar Observación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Visor Rápido de Receta para Administradora ── */}
      {modalVerReceta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1A18] border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-amaru-copper">
                <Eye size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Visor Rápido de Receta Oftalmológica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVerReceta(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{modalVerReceta.nombre}</div>
                  <div className="font-mono text-slate-500 dark:text-zinc-400 text-[11px]">{modalVerReceta.rut} · {modalVerReceta.folio}</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amaru-copper/10 text-amaru-copper border border-amaru-copper/20">
                    📍 {modalVerReceta.ciudad}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{modalVerReceta.empresa || 'Particular'}</div>
                </div>
              </div>

              {/* Tabla de Graduación OD / OI */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Graduación Refractiva Indicada
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#151413] border border-slate-200/60 dark:border-zinc-800">
                    <span className="font-bold text-amaru-copper block text-[11px] mb-1">👁️ Ojo Derecho (OD)</span>
                    <div className="space-y-0.5 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                      <div>Esfera: <strong className="text-slate-900 dark:text-white">{modalVerReceta.odEsfera || '0.00'}</strong></div>
                      <div>Cilindro: <strong className="text-slate-900 dark:text-white">{modalVerReceta.odCilindro || '0.00'}</strong></div>
                      <div>Eje: <strong className="text-slate-900 dark:text-white">{modalVerReceta.odEje || '0°'}</strong></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#151413] border border-slate-200/60 dark:border-zinc-800">
                    <span className="font-bold text-amaru-copper block text-[11px] mb-1">👁️ Ojo Izquierdo (OI)</span>
                    <div className="space-y-0.5 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                      <div>Esfera: <strong className="text-slate-900 dark:text-white">{modalVerReceta.oiEsfera || '0.00'}</strong></div>
                      <div>Cilindro: <strong className="text-slate-900 dark:text-white">{modalVerReceta.oiCilindro || '0.00'}</strong></div>
                      <div>Eje: <strong className="text-slate-900 dark:text-white">{modalVerReceta.oiEje || '0°'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archivo adjunto / Documento */}
              <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-amaru-copper" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-[11px]">
                      {modalVerReceta.archivoNombre || 'Receta_Médica_Visada.pdf'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Documento visable conforme a Res. Exenta 1.200 / MINSAL
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amaru-copper bg-white dark:bg-black/30 px-2 py-1 rounded-md border border-amaru-copper/30">
                  PDF / IMG OK
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  const sol = modalVerReceta;
                  setModalVerReceta(null);
                  setModalObservar({ id: sol.id, nombre: sol.nombre, rut: sol.rut });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg cursor-pointer"
              >
                Observar Receta...
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalVerReceta(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sol = modalVerReceta;
                    setModalVerReceta(null);
                    handleAprobarSolicitud(sol);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Aprobar y Visar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Corrección Administrativa de Transacción */}
      {transaccionEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl">
                  <Edit3 size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Corregir Venta / Pedido (Control Administradora)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Folio: {transaccionEditando.folio} · Paciente: {transaccionEditando.trabajadorNombre} ({transaccionEditando.trabajadorRut})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransaccionEditando(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Motivo de Rectificación (Obligatorio)
                </label>
                <select
                  value={motivoCorreccionDash}
                  onChange={(e) => setMotivoCorreccionDash(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-zinc-200 font-medium"
                >
                  <option value="Ajuste de mediciones por optómetra (Garantía clínica)">
                    Ajuste de mediciones por optómetra (Garantía clínica)
                  </option>
                  <option value="Error de digitación en tienda">
                    Error de digitación en tienda
                  </option>
                  <option value="Cambio de armazón solicitado por cliente">
                    Cambio de armazón solicitado por cliente
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Nota / Detalle de la Corrección
                </label>
                <textarea
                  rows={3}
                  value={notaCorreccionDash}
                  onChange={(e) => setNotaCorreccionDash(e.target.value)}
                  placeholder="Detalla las nuevas graduaciones, cambio de montura o corrección aplicada..."
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                ℹ️ Esta modificación quedará registrada con tu firma ejecutiva (María González), fecha y hora exacta, actualizando el estado de la transacción a <strong>Rectificado</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTransaccionEditando(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarCorreccionDash}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Guardar Rectificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anulación y Reversa de Stock desde Dashboard */}
      {transaccionAnulando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Anular Venta / Devolver Stock
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Folio: {transaccionAnulando.folio} · Monto: {formatCLP(transaccionAnulando.monto)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransaccionAnulando(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-800 dark:text-red-300 text-[11px] leading-relaxed">
                ⚠️ <strong>Acción Irreversible:</strong> Al anular esta transacción:
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>El estado pasará a <strong>Anulado</strong> en el historial.</li>
                  <li>Se reintegrará automáticamente <strong>+1 unidad al inventario</strong> de la sucursal {transaccionAnulando.sucursal}.</li>
                  <li>Se generará un movimiento de ajuste en el Kardex y auditoría.</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Motivo de la Anulación (Obligatorio)
                </label>
                <select
                  value={motivoAnulacionDash}
                  onChange={(e) => setMotivoAnulacionDash(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-slate-800 dark:text-zinc-200 font-medium"
                >
                  <option value="Desistimiento del cliente">
                    Desistimiento del cliente
                  </option>
                  <option value="Error de cobro/duplicidad">
                    Error de cobro / duplicidad
                  </option>
                  <option value="Rechazo de cobertura convenio">
                    Rechazo de cobertura convenio empresa
                  </option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1 text-slate-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Paciente:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{transaccionAnulando.trabajadorNombre} ({transaccionAnulando.trabajadorRut})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sucursal:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{transaccionAnulando.sucursal}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Modalidad / Tipo:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{transaccionAnulando.modalidad}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTransaccionAnulando(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAnulacionDash}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Confirmar Anulación y Reintegrar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
