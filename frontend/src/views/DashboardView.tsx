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
} from 'lucide-react';
import {
  getResumenDashboard,
  getStockCritico,
  getConveniosResumen,
  TokenExpiredError,
  type ResumenDashboard,
  type RespuestaStockCritico,
  type RespuestaConvenios,
} from '../services/dashboardService';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';

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

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, accent = 'text-[#FF5500]' }) => (
  <div className="bg-[#121826] border border-[#2A364F] rounded-xl p-5 flex flex-col gap-2 shadow-lg">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
      <span className={`${accent}`}>{icon}</span>
    </div>
    <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    {sub && <div className="text-xs text-zinc-400">{sub}</div>}
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
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onSessionExpired]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

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
          <h2 className="text-xl font-bold text-white tracking-tight">Dashboard Gerencial</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Métricas operativas en tiempo real · Óptica Amaru</p>
        </div>
        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Clock size={12} />
              Actualizado {formatTimestamp(ultimaActualizacion)}
            </span>
          )}
          <button
            onClick={() => cargarDatos(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#2A364F] text-zinc-300 hover:border-[#FF5500] hover:text-[#FF5500] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Actualizar métricas
          </button>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Fila 1: KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : resumen ? (
          <>
            {/* Total solicitudes */}
            <KpiCard
              icon={<Package size={18} />}
              label="Total Solicitudes"
              value={resumen.total_solicitudes.toLocaleString('es-CL')}
              sub={
                <span className="flex items-center gap-1">
                  <span className="inline-block bg-[#FF5500]/20 text-[#FF5500] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    +{resumen.solicitudes_hoy} hoy
                  </span>
                  <span className="text-zinc-500">{resumen.solicitudes_mes} este mes</span>
                </span>
              }
            />

            {/* Facturación valorizada */}
            <KpiCard
              icon={<DollarSign size={18} />}
              label="Facturación Valorizada"
              value={formatCLP(resumen.monto_total_valorizado)}
              sub="Solicitudes entregadas / cerradas"
              accent="text-emerald-400"
            />

            {/* Distribución modalidad */}
            <KpiCard
              icon={<Users size={18} />}
              label="Distribución Modalidad"
              value={`${pctConvenio}% Convenio`}
              sub={
                <div className="space-y-1 mt-0.5">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-blue-400">Convenio {resumen.desglose_modalidad.convenio}</span>
                    <span className="text-zinc-500">Particular {resumen.desglose_modalidad.particular}</span>
                  </div>
                  <div className="w-full bg-[#1A2234] rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pctConvenio}%` }}
                    />
                  </div>
                </div>
              }
              accent="text-blue-400"
            />

            {/* Tasa sincronización */}
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Tasa Sincronización"
              value={`${resumen.tasa_sincronizacion}%`}
              sub={
                <span className={`flex items-center gap-1 font-medium ${resumen.tasa_sincronizacion >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {resumen.tasa_sincronizacion >= 95
                    ? <><CheckCircle2 size={11} /> Óptima</>
                    : <><AlertTriangle size={11} /> Requiere atención</>
                  }
                </span>
              }
              accent={resumen.tasa_sincronizacion >= 95 ? 'text-emerald-400' : 'text-amber-400'}
            />
          </>
        ) : null}
      </div>

      {/* ── Fila 2: Stock crítico + Convenios ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stock Crítico */}
        <div className="bg-[#121826] border border-[#2A364F] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Stock Crítico de Inventario</h3>
            </div>
            {stock && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                stock.total_alertas > 0
                  ? 'bg-red-950/60 text-red-400 border-red-800'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
              }`}>
                {stock.total_alertas} alertas
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonTable />
          ) : stock?.items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
              Sin alertas de stock · Inventario saludable
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {stock?.items.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-[#FF5500]">{item.sku}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[180px]">{item.modelo}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      Mínimo: {item.stock_minimo} ud. · Actual: <span className={item.stock_actual === 0 ? 'text-red-400 font-bold' : 'text-amber-400 font-semibold'}>{item.stock_actual}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${
                    item.nivel_alerta === 'critico'
                      ? 'bg-red-950/80 text-red-400 border-red-800'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800'
                  }`}>
                    {item.nivel_alerta === 'critico' ? '⬛ SIN STOCK' : '⚠ BAJO'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Convenios Sindicales */}
        <div className="bg-[#121826] border border-[#2A364F] rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Convenios Sindicales</h3>
            {convenios && (
              <span className="ml-auto text-[10px] font-semibold text-zinc-500 bg-[#1A2234] border border-[#2A364F] px-2 py-0.5 rounded">
                {convenios.total_empresas} empresa{convenios.total_empresas !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonTable />
          ) : convenios?.empresas.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-8">No hay empresas registradas con convenio activo.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {convenios?.empresas.map((empresa) => (
                <div
                  key={empresa.id_empresa}
                  className="bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate">{empresa.empresa_nombre}</p>
                        {empresa.convenio_vigente && (
                          <span className="shrink-0 text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                            VIGENTE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">RUT {empresa.rut_empresa}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-blue-400">{empresa.total_pacientes_atendidos} pac.</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#2A364F] flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500">Descuento proyectado planilla</span>
                    <span className="text-[11px] font-bold text-[#FF5500]">
                      {formatCLP(empresa.monto_proyectado_descuento)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardView;

