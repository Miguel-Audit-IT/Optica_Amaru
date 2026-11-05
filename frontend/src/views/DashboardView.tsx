import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  FileCheck2,
  Download,
  AlertCircle,
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
  type PedidoReciente,
} from '../services/dashboardService';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import {
  descargarComprobantePDF,
  acelerarYDescargarFiniquitoPDF,
} from '../services/documentosService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCLP(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Componentes de UI ─────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accent?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, accent = 'text-amaru-copper' }) => (
  <div className="bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-xl p-5 flex flex-col gap-2 shadow-sm dark:shadow-lg transition-colors">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-[#6C6A68] dark:text-zinc-400 font-medium">{label}</span>
      <span className={`${accent}`}>{icon}</span>
    </div>
    <p className="text-3xl font-bold text-[#201E1C] dark:text-white tracking-tight">{value}</p>
    {sub && <div className="text-xs text-[#6C6A68] dark:text-zinc-400">{sub}</div>}
  </div>
);

// ── Vista Principal ───────────────────────────────────────────────────────────

interface DashboardViewProps {
  onSessionExpired: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSessionExpired }) => {
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [stock, setStock] = useState<RespuestaStockCritico | null>(null);
  const [convenios, setConvenios] = useState<RespuestaConvenios | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para descarga de PDFs
  const [descargandoFolio, setDescargandoFolio] = useState<string | null>(null);
  const [feedbackDoc, setFeedbackDoc] = useState<string | null>(null);
  const [folioDirecto, setFolioDirecto] = useState('');

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [r, s, c] = await Promise.all([
        getResumenDashboard(),
        getStockCritico(5),
        getConveniosResumen(),
      ]);
      setResumen(r);
      setStock(s);
      setConvenios(c);
      setUltimaActualizacion(new Date());
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        onSessionExpired();
        return;
      }
      if (err instanceof ForbiddenError) {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onSessionExpired]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Handlers para descarga de PDFs
  const handleDescargarComprobante = async (folio: string) => {
    if (!folio) return;
    setDescargandoFolio(folio);
    setFeedbackDoc(`Generando comprobante oficial para ${folio}...`);
    try {
      await descargarComprobantePDF(folio);
      setFeedbackDoc(`✓ Comprobante de entrega ${folio} descargado.`);
    } catch (err) {
      setFeedbackDoc(`Error al descargar comprobante: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setDescargandoFolio(null);
    }
  };

  const handleAcelerarFiniquito = async (folio: string) => {
    if (!folio) return;
    const confirma = window.confirm(
      `¿Desea acelerar el crédito y generar el Certificado Legal de Finiquito para el folio ${folio}?\nEsta acción actualizará las cuotas a Cobrado_Finiquito y generará la pista forense inmutable SHA-256.`
    );
    if (!confirma) return;

    setDescargandoFolio(folio);
    setFeedbackDoc(`Ejecutando aceleración y emitiendo certificado con firma SHA-256...`);
    try {
      await acelerarYDescargarFiniquitoPDF(folio);
      setFeedbackDoc(`✓ Finiquito acelerado y certificado legal descargado para ${folio}.`);
      cargarDatos(true);
    } catch (err) {
      setFeedbackDoc(`Error al acelerar finiquito: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setDescargandoFolio(null);
    }
  };

  // ── Derivados ──────────────────────────────────────────────────────────────
  const totalModalidad = resumen
    ? resumen.desglose_modalidad.convenio + resumen.desglose_modalidad.particular
    : 0;
  const pctConvenio = totalModalidad > 0
    ? Math.round((resumen!.desglose_modalidad.convenio / totalModalidad) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Barra de título + acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#201E1C] dark:text-white tracking-tight">Dashboard Gerencial</h2>
          <p className="text-xs text-[#6C6A68] dark:text-zinc-400 mt-0.5">Métricas operativas en tiempo real · Óptica Amaru</p>
        </div>
        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6C6A68] dark:text-zinc-500">
              <Clock size={12} />
              Actualizado {formatTimestamp(ultimaActualizacion)}
            </span>
          )}
          <button
            onClick={() => cargarDatos(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#2A364F] border border-[#E2E8F0] dark:border-[#2A364F] text-[#201E1C] dark:text-zinc-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-amaru-copper' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de error global */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => cargarDatos()}
            className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline ml-4 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Fila 1: KPIs Principales ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Total Solicitudes"
              value={resumen?.total_solicitudes ?? '—'}
              sub={
                <span className="text-[#6C6A68] dark:text-zinc-500 text-[11px]">
                  Hoy: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{resumen?.solicitudes_hoy ?? 0}</span>
                  {' '}· Mes: <span className="text-[#201E1C] dark:text-zinc-300 font-semibold">{resumen?.solicitudes_mes ?? 0}</span>
                </span>
              }
            />

            <KpiCard
              icon={<DollarSign size={18} />}
              label="Facturación Valorizada"
              value={resumen ? formatCLP(resumen.monto_total_valorizado) : '—'}
              sub={<span className="text-[11px] text-[#6C6A68] dark:text-zinc-500">EPP entregados y cerrados</span>}
              accent="text-emerald-600 dark:text-emerald-400"
            />

            <KpiCard
              icon={<Users size={18} />}
              label="Modalidad Entrega"
              value={`${pctConvenio}% Convenio`}
              sub={
                <div className="flex items-center gap-2 text-[11px] text-[#6C6A68] dark:text-zinc-500 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{resumen?.desglose_modalidad.convenio ?? 0} sindical</span>
                  <span>·</span>
                  <span className="text-[#201E1C] dark:text-zinc-400">{resumen?.desglose_modalidad.particular ?? 0} particular</span>
                </div>
              }
              accent="text-blue-600 dark:text-blue-400"
            />

            <KpiCard
              icon={<CheckCircle2 size={18} />}
              label="Tasa Sincronización"
              value={resumen ? `${resumen.tasa_sincronizacion}%` : '—'}
              sub={
                <div className="w-full bg-slate-200 dark:bg-[#1A1816] rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(resumen?.tasa_sincronizacion ?? 0, 100)}%` }}
                  />
                </div>
              }
              accent="text-emerald-600 dark:text-emerald-400"
            />
          </>
        )}
      </div>

      {/* ── Fila 2: Stock crítico + Convenios ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stock Crítico */}
        <div className="bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-[#201E1C] dark:text-white">Stock Crítico de Inventario</h3>
            </div>
            {stock && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                stock.total_alertas > 0
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
              }`}>
                {stock.total_alertas} alertas
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonTable />
          ) : stock?.items.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
              Sin alertas de stock · Inventario saludable
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {stock?.items.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between bg-slate-50 dark:bg-[#1A1816] border border-[#E2E8F0] dark:border-[#37322E] rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-amaru-copper">{item.sku}</p>
                    <p className="text-[11px] text-[#524944] dark:text-zinc-400 mt-0.5 truncate max-w-[180px]">{item.modelo}</p>
                    <p className="text-[10px] text-[#6C6A68] dark:text-zinc-600 mt-0.5">
                      Mínimo: {item.stock_minimo} ud. · Actual: <span className={item.stock_actual === 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>{item.stock_actual}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${
                    item.nivel_alerta === 'critico'
                      ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-400 dark:border-red-800'
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800'
                  }`}>
                    {item.nivel_alerta === 'critico' ? '⬛ SIN STOCK' : '⚠ BAJO'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Convenios Sindicales */}
        <div className="bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-xl p-5 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-[#201E1C] dark:text-white">Convenios Sindicales</h3>
            {convenios && (
              <span className="ml-auto text-[10px] font-semibold text-[#6C6A68] dark:text-zinc-500 bg-slate-100 dark:bg-[#1A1816] border border-[#E2E8F0] dark:border-[#37322E] px-2 py-0.5 rounded">
                {convenios.total_empresas} empresa{convenios.total_empresas !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonTable />
          ) : convenios?.empresas.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">No hay empresas registradas con convenio activo.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {convenios?.empresas.map((empresa) => (
                <div
                  key={empresa.id_empresa}
                  className="bg-slate-50 dark:bg-[#1A1816] border border-[#E2E8F0] dark:border-[#37322E] rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[#201E1C] dark:text-white truncate">{empresa.empresa_nombre}</p>
                        {empresa.convenio_vigente && (
                          <span className="shrink-0 text-[9px] font-bold bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                            VIGENTE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6C6A68] dark:text-zinc-500 mt-0.5">RUT {empresa.rut_empresa}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{empresa.total_pacientes_atendidos} pac.</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#37322E] flex justify-between items-center">
                    <span className="text-[10px] text-[#6C6A68] dark:text-zinc-500">Descuento proyectado planilla</span>
                    <span className="text-[11px] font-bold text-amaru-copper">
                      {formatCLP(empresa.monto_proyectado_descuento)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Fila 3: Generación de Documentos PDF y Finiquitos (Semana 3) ────── */}
      <div className="bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-xl p-5 shadow-sm dark:shadow-lg transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#201E1C] dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-amaru-copper" />
              Emisión de Documentos Oficiales (Comprobantes y Finiquitos PDF)
            </h3>
            <p className="text-xs text-[#6C6A68] dark:text-zinc-400 mt-0.5">
              Generación de comprobantes de entrega con código QR y aceleración de liquidaciones con sello forense SHA-256.
            </p>
          </div>

          {/* Consulta directa por Folio */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Folio (ej. FOLIO-001)"
              value={folioDirecto}
              onChange={(e) => setFolioDirecto(e.target.value.trim().toUpperCase())}
              className="bg-white dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#2A364F] rounded-lg px-3 py-1.5 text-xs text-[#201E1C] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amaru-copper dark:focus:border-amaru-copper outline-none"
            />
            <button
              onClick={() => handleDescargarComprobante(folioDirecto)}
              disabled={!folioDirecto || !!descargandoFolio}
              title="Descargar Comprobante PDF de Entrega"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1816] dark:hover:bg-[#2A364F] border border-[#E2E8F0] dark:border-[#37322E] text-xs font-semibold rounded-lg text-[#201E1C] dark:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              PDF Entrega
            </button>
            <button
              onClick={() => handleAcelerarFiniquito(folioDirecto)}
              disabled={!folioDirecto || !!descargandoFolio}
              title="Acelerar y Descargar Finiquito Legal"
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/70 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 text-xs font-semibold rounded-lg text-red-700 dark:text-red-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Finiquito
            </button>
          </div>
        </div>

        {/* Mensaje de feedback para descargas */}
        {feedbackDoc && (
          <div className="mb-3 text-xs p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{feedbackDoc}</span>
            </div>
            <button onClick={() => setFeedbackDoc(null)} className="text-blue-600 dark:text-blue-400 hover:underline px-1 cursor-pointer">✕</button>
          </div>
        )}

        {/* Tabla de Pedidos */}
        <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#37322E] rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#1A1816] text-[#6C6A68] dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] dark:border-[#37322E]">
              <tr>
                <th className="px-3 py-2.5">Folio Único</th>
                <th className="px-3 py-2.5">Paciente / RUT</th>
                <th className="px-3 py-2.5">Armazón EPP</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">Monto</th>
                <th className="px-3 py-2.5 text-right">Acciones Documentales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#37322E]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-400 dark:text-zinc-500">
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : !resumen?.pedidos_recientes || resumen.pedidos_recientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-400 dark:text-zinc-500">
                    No hay solicitudes registradas actualmente.
                  </td>
                </tr>
              ) : (
                resumen.pedidos_recientes.map((ped: PedidoReciente) => (
                  <tr key={ped.folio_unico_qr} className="hover:bg-slate-50 dark:hover:bg-[#1A1816]/60 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-bold text-amaru-copper">
                      {ped.folio_unico_qr}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[#201E1C] dark:text-white font-medium">{ped.nombre_paciente}</div>
                      <div className="text-[10px] text-[#6C6A68] dark:text-zinc-500">{ped.rut_paciente}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[#201E1C] dark:text-white">{ped.sku_armazon}</div>
                      <div className="text-[10px] text-[#524944] dark:text-zinc-400 truncate max-w-[160px]">{ped.modelo_armazon}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        ped.estado_pedido === 'Entregada' || ped.estado_pedido === 'Cerrada'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800'
                          : ped.estado_pedido === 'Retencion_Laboral'
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-400 dark:border-purple-800'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800'
                      }`}>
                        {ped.estado_pedido}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#201E1C] dark:text-zinc-300">
                      {formatCLP(ped.monto_total)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDescargarComprobante(ped.folio_unico_qr)}
                          disabled={descargandoFolio === ped.folio_unico_qr}
                          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1816] dark:hover:bg-[#2A364F] border border-[#E2E8F0] dark:border-[#37322E] hover:border-amaru-copper/50 text-[#201E1C] dark:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Download size={12} className="text-amaru-copper" />
                          <span>Comprobante PDF</span>
                        </button>
                        <button
                          onClick={() => handleAcelerarFiniquito(ped.folio_unico_qr)}
                          disabled={descargandoFolio === ped.folio_unico_qr}
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800/80 hover:border-red-400 text-red-700 dark:text-red-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <FileCheck2 size={12} className="text-red-500 dark:text-red-400" />
                          <span>Finiquito</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
