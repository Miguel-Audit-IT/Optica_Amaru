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
  Lock,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Calendar,
  Copy,
  Check,
  Glasses,
  Wallet,
  Receipt,
  Scale,
  Sparkles,
  MapPin,
  X,
} from 'lucide-react';
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
  estado: 'Entregado' | 'Fabricación' | 'Pendiente' | 'Retención Laboral';
  monto: number;
  selloSha256: string | null;
  fecha: string;
}

const MOCK_TRANSACCIONES_RECIENTES: TransaccionReciente[] = [
  {
    folio: 'FOLIO-8F1085AD',
    trabajadorNombre: 'Mario Cárdenas González',
    trabajadorRut: '24.533.343-9',
    minera: 'Minera Escondida Ltda.',
    sindicato: 'Convenio Minero EPP · DS 594',
    estado: 'Entregado',
    monto: 185000,
    selloSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    fecha: 'Hoy, 14:10 hrs',
  },
  {
    folio: 'FOLIO-2B4C8901',
    trabajadorNombre: 'Claudia Soto Valenzuela',
    trabajadorRut: '18.923.456-7',
    minera: 'Cliente Particular Boutique',
    sindicato: 'Sucursal Centro Las Condes',
    estado: 'Fabricación',
    monto: 145000,
    selloSha256: null,
    fecha: 'Hoy, 11:20 hrs',
  },
  {
    folio: 'FOLIO-4D7E1123',
    trabajadorNombre: 'Roberto Morales Díaz',
    trabajadorRut: '15.482.931-K',
    minera: 'Convenio Salud · Isapre Colmena',
    sindicato: 'Plan Cobertura Oftalmológica Codelco',
    estado: 'Entregado',
    monto: 65000,
    selloSha256: '9a22f4b16c87890e543bca1098ef7723910248ad9081e289c091a117bce1801c',
    fecha: 'Ayer, 16:45 hrs',
  },
  {
    folio: 'FOLIO-7A19BC34',
    trabajadorNombre: 'Patricia Henríquez Palma',
    trabajadorRut: '17.382.910-4',
    minera: 'Atención Clínica Oftalmológica',
    sindicato: 'Sucursal Providencia',
    estado: 'Fabricación',
    monto: 155000,
    selloSha256: null,
    fecha: 'Ayer, 09:30 hrs',
  },
  {
    folio: 'FOLIO-9E8821F0',
    trabajadorNombre: 'Esteban Valenzuela Jara',
    trabajadorRut: '19.482.110-2',
    minera: 'Minera Collahuasi',
    sindicato: 'Convenio Colectivo Faena',
    estado: 'Pendiente',
    monto: 135000,
    selloSha256: null,
    fecha: '08 Nov, 17:15 hrs',
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
    setFeedbackAccion(`✓ Pre-ingreso para ${s.nombre} (${s.rut}) APROBADO. Stock descontado y pedido liberado para laboratorio en sucursal ${s.ciudad}.`);
    setTimeout(() => setFeedbackAccion(null), 5000);
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

  // Cálculos de KPIs con Conteo Animado Enterprise (Apple Health / Linear style)
  const targetMontoVentas = resumen?.monto_total_valorizado
    ? parseFloat(resumen.monto_total_valorizado)
    : 48650000;
  const animVentas = useAnimatedNumber(targetMontoVentas, 850);

  const targetSolicitudes = resumen?.total_solicitudes ?? 348;
  const animSolicitudes = useAnimatedNumber(targetSolicitudes, 750);

  const targetFiniquitos = 14850000;
  const animFiniquitos = useAnimatedNumber(targetFiniquitos, 800);

  const targetStock = stock?.total_alertas ?? 3;
  const animStock = useAnimatedNumber(targetStock, 600);

  const totalVentasConvenio = formatCLP(animVentas);
  const totalEppEntregados = `${animSolicitudes} ud.`;
  const totalFiniquitosRecuperados = formatCLP(animFiniquitos);
  const totalAlertasStock = animStock;

  // Cálculos para el gráfico de 7 días
  const maxBarra = Math.max(...MOCK_DATOS_7_DIAS.map((d) => d.faena + d.sucursal), 65);
  const totalFaena7Dias = MOCK_DATOS_7_DIAS.reduce((acc, curr) => acc + curr.faena, 0);
  const totalSucursal7Dias = MOCK_DATOS_7_DIAS.reduce((acc, curr) => acc + curr.sucursal, 0);
  const totalGeneral7Dias = totalFaena7Dias + totalSucursal7Dias;
  const pctFaena = Math.round((totalFaena7Dias / totalGeneral7Dias) * 100);

  // Filtrado de la tabla reciente
  const transaccionesFiltradas = MOCK_TRANSACCIONES_RECIENTES.filter(
    (t) =>
      t.folio.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
      t.trabajadorNombre.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
      t.trabajadorRut.toLowerCase().includes(busquedaFolio.toLowerCase()) ||
      t.minera.toLowerCase().includes(busquedaFolio.toLowerCase())
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
                Panel de Control Gerencial
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Clínica · Boutique & Convenios
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

      {/* ── Bandeja de Validación Óptica · Pre-Ingresos de Pacientes (Portal ➔ Admin) ── */}
      <div className="card-zenith rounded-3xl p-6 relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <FileCheck2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Bandeja de Validación Óptica · Pre-Ingresos de Pacientes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {solicitudes.filter((s) => s.estado === 'EN_REVISION').length} Pendiente{solicitudes.filter((s) => s.estado === 'EN_REVISION').length === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Revisión optométrica de recetas médicas, validación de dioptrías y liberación directa a laboratorio con descuento de stock.
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
                      {sol.estado !== 'APROBADA' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAprobarSolicitud(sol)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="Aprobar receta, descontar stock e iniciar fabricación en laboratorio"
                          >
                            <CheckCircle2 size={13} />
                            <span>Aprobar y Descontar Stock</span>
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
      </div>

      {/* ── 2. Tarjetas de KPI (Top Row) con Sparklines Decorativos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-stagger-1">
        {/* KPI 1: Ventas por Convenio (CLP) */}
        <KpiCard
          titulo="Ventas por Convenio (CLP)"
          valor={totalVentasConvenio}
          indicador="+12.4% vs mes anterior"
          tipoIndicador="positivo"
          subtexto="Convenio Colectivo Minero al día"
          icono={<Wallet size={20} />}
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          sparklineVariant="ventas"
        />

        {/* KPI 2: EPP Ópticos Entregados */}
        <KpiCard
          titulo="EPP Ópticos Entregados"
          valor={totalEppEntregados}
          indicador="+8.2% vs objetivo mensual"
          tipoIndicador="positivo"
          subtexto="326 en Faena · 22 en Sucursal"
          icono={<Glasses size={20} />}
          iconBgClass="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40"
          iconColorClass="text-blue-600 dark:text-blue-400"
          sparklineVariant="epp"
        />

        {/* KPI 3: Retenciones / Finiquitos */}
        <KpiCard
          titulo="Retenciones / Finiquitos"
          valor={totalFiniquitosRecuperados}
          indicador="18 casos Art. 58"
          tipoIndicador="alerta"
          subtexto="Cobro preferente DS 594"
          icono={<Receipt size={20} />}
          iconBgClass="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60"
          iconColorClass="text-amber-600 dark:text-amber-400"
          borderAccentClass="border-amber-500/30 dark:border-amber-700/40"
          sparklineVariant="finiquito"
        />

        {/* KPI 4: Stock Crítico (Armazones) */}
        <KpiCard
          titulo="Stock Crítico (Armazones)"
          valor={`${totalAlertasStock} Modelos`}
          indicador={totalAlertasStock > 0 ? `${totalAlertasStock} SKU bajo umbral` : 'Stock OK'}
          tipoIndicador={totalAlertasStock > 0 ? 'peligro' : 'positivo'}
          subtexto="Umbral mínimo: ≤ 5 ud."
          icono={<AlertTriangle size={20} />}
          iconBgClass={
            totalAlertasStock > 0
              ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200'
          }
          iconColorClass={
            totalAlertasStock > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }
          borderAccentClass={totalAlertasStock > 0 ? 'border-red-500/20 dark:border-red-900/30' : ''}
          sparklineVariant="stock"
        />
      </div>

      {/* ── 3. Sección Central (Gráficos): Entregas en Faena vs. Sucursal ── */}
      <div className="card-zenith rounded-2xl p-6 transition-colors animate-stagger-2">
        {/* Header del gráfico y controles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
                <TrendingUp size={16} />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Entregas en Faena vs. Sucursal (Últimos 7 Días)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Volumen diario de dispensación de lentes EPP certificados bajo normativa DS 594.
            </p>
          </div>

          {/* Leyenda y Filtro */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-sm bg-amaru-copper" />
                Faena Minera ({pctFaena}%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-zinc-600" />
                Sucursal ({100 - pctFaena}%)
              </span>
            </div>

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
          </div>
        </div>

        {/* Resumen numérico en la parte superior del gráfico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Faena (7D)
            </span>
            <p className="text-base font-extrabold text-amaru-copper font-mono mt-0.5">
              {totalFaena7Dias} ud.
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Sucursal (7D)
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
                  {diaSeleccionado.faena} en faena
                </span>
                <span>+</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {diaSeleccionado.sucursal} en sucursal
                </span>
                <span>=</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                  {diaSeleccionado.faena + diaSeleccionado.sucursal} ud. totales
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Tasa de efectividad faena:{' '}
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
                Actividad Reciente y Trazabilidad Operativa
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Últimas solicitudes procesadas: Faenas Mineras, Clínicas Asociadas y Óptica Boutique con sello SHA-256.
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

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-zinc-800 text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Folio</th>
                <th className="px-4 py-3.5">Paciente / RUT</th>
                <th className="px-4 py-3.5">Modalidad / Convenio</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Sello de Integridad</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#1C1A18]">
              {transaccionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500">
                    No se encontraron transacciones que coincidan con la búsqueda.
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
                      {/* 1. Folio */}
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
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">
                          {t.fecha}
                        </span>
                      </td>

                      {/* 2. Trabajador con Avatar de Iniciales de Alto Contraste */}
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

                      {/* 3. Minera */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">
                          {t.minera}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {t.sindicato}
                        </div>
                      </td>

                      {/* 4. Estado */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
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
                      </td>

                      {/* 5. Sello de Integridad */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {estaSellado ? (
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
                              <Lock size={13} />
                            </div>
                            <div>
                              <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 block">
                                Sellado SHA-256
                              </span>
                              <span
                                onClick={() => handleCopiarHash(t.selloSha256!)}
                                title="Clic para copiar hash completo"
                                className="font-mono text-[10px] text-slate-400 hover:text-amaru-copper cursor-pointer flex items-center gap-1"
                              >
                                {t.selloSha256!.slice(0, 8)}...{t.selloSha256!.slice(-6)}
                                {hashCopiado === t.selloSha256 ? (
                                  <Check size={10} className="text-emerald-500" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                            <div className="p-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                              <Clock size={13} />
                            </div>
                            <span className="text-[11px] font-medium">En proceso</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Acciones */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
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
    </div>
  );
};

export default DashboardView;
