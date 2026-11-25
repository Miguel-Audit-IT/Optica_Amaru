import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  Wrench,
  UserCheck,
  LogOut,
  UserPlus,
  Truck,
  Compass,
  BarChart3,
  CloudAlert,
  CloudCheck,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ShoppingBag,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
} from 'lucide-react';
import { Login } from './components/Login';
import TerminalView from './views/TerminalView';
import DashboardView from './views/DashboardView';
import EntregaView from './views/EntregaView';
import PublicQRView from './views/PublicQRView';
import SeguimientoCompraView from './views/SeguimientoCompraView';
import { InventarioView } from './views/InventarioView';
import AuditoriaView from './views/AuditoriaView';
import logoImg from './assets/logo.jpg';
import { isUserAdmin, isUserPatient, getUserInfo } from './utils/auth';
import { useTheme } from './hooks/useTheme';
import { db } from './db/dexie';
import { sincronizarColaOffline } from './sw/syncService';
import { getSucursalActiva, setSucursalActiva } from './services/inventarioService';

// ── Auth helpers ──────────────────────────────────────────────────────────────

function checkSession(): boolean {
  const isActive = localStorage.getItem('amaru_session_active') === 'true';
  const expiresAt = localStorage.getItem('amaru_session_expires_at');
  if (isActive && expiresAt) {
    if (new Date().getTime() < Number(expiresAt)) return true;
    localStorage.clear();
  }
  return false;
}

function clearSession() {
  localStorage.removeItem('amaru_access_token');
  localStorage.removeItem('amaru_refresh_token');
  localStorage.removeItem('amaru_session_expires_at');
  localStorage.removeItem('amaru_session_active');
  localStorage.removeItem('amaru_is_staff');
  localStorage.removeItem('amaru_rol');
  localStorage.removeItem('amaru_username');
}

// ── Protected Route Component ─────────────────────────────────────────────────

interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectPath?: string;
  onUnauthorized?: () => void;
  children: React.ReactNode;
}

function ProtectedRoute({
  isAllowed,
  redirectPath = '/terminal',
  onUnauthorized,
  children,
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!isAllowed && onUnauthorized) {
      onUnauthorized();
    }
  }, [isAllowed, onUnauthorized]);

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// ── Inner layout (rendered when authenticated) ────────────────────────────────

interface AppLayoutProps {
  isOnline: boolean;
  onLogout: () => void;
}

function AppLayout({ isOnline, onLogout }: AppLayoutProps) {
  const navigate = useNavigate();
  const [alertaRestringida, setAlertaRestringida] = useState<string | null>(null);
  const [pendientesOffline, setPendientesOffline] = useState<number>(0);
  const [sincronizandoOffline, setSincronizandoOffline] = useState<boolean>(false);
  const [popoverSincronizacionOpen, setPopoverSincronizacionOpen] = useState<boolean>(false);
  const [nombrePaciente, setNombrePaciente] = useState<string>(() => {
    return localStorage.getItem('amaru_nombre_paciente') || 'MIGUEL JORGE';
  });
  const [sucursalActiva, setSucursalActivaState] = useState<'Calama' | 'Antofagasta'>(() => getSucursalActiva());
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(() => {
    return localStorage.getItem('amaru_sidebar_colapsado') === 'true';
  });
  const { toggleTheme, isDark } = useTheme();

  const toggleSidebar = () => {
    setSidebarColapsado((prev) => {
      const next = !prev;
      localStorage.setItem('amaru_sidebar_colapsado', String(next));
      return next;
    });
  };

  const isAdmin = isUserAdmin();
  const isPatient = isUserPatient();
  const userInfo = getUserInfo();
  const location = useLocation();
  const searchTab = new URLSearchParams(location.search).get('tab') || 'resumen';
  const isDashboardPath = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleSucursalUpdated = () => {
      setSucursalActivaState(getSucursalActiva());
    };
    window.addEventListener('amaru_sucursal_updated', handleSucursalUpdated);
    window.addEventListener('storage', handleSucursalUpdated);
    return () => {
      window.removeEventListener('amaru_sucursal_updated', handleSucursalUpdated);
      window.removeEventListener('storage', handleSucursalUpdated);
    };
  }, []);

  const handleToggleSucursal = () => {
    // Alcance operativo actual centrado exclusivamente en Sucursal Calama
    setSucursalActiva('Calama');
    setSucursalActivaState('Calama');
  };

  useEffect(() => {
    const handlePerfilUpdated = () => {
      const stored = localStorage.getItem('amaru_nombre_paciente');
      if (stored) {
        setNombrePaciente(stored);
      }
    };
    window.addEventListener('amaru_perfil_updated', handlePerfilUpdated);
    window.addEventListener('storage', handlePerfilUpdated);
    return () => {
      window.removeEventListener('amaru_perfil_updated', handlePerfilUpdated);
      window.removeEventListener('storage', handlePerfilUpdated);
    };
  }, []);

  // Monitoreo y sincronización reactiva de cola offline Dexie
  const actualizarPendientes = useCallback(async () => {
    try {
      const count = await db.cola_pedidos
        .filter((p) => p.estado === 'en_cola' || p.estado === 'conflicto')
        .count();
      setPendientesOffline(count);
    } catch {
      // Ignorar si db aún no inicializa
    }
  }, []);

  useEffect(() => {
    actualizarPendientes();
    const handleSyncEvent = () => actualizarPendientes();
    window.addEventListener('amaru_sync_updated', handleSyncEvent);
    const interval = setInterval(actualizarPendientes, 3000);
    return () => {
      window.removeEventListener('amaru_sync_updated', handleSyncEvent);
      clearInterval(interval);
    };
  }, [actualizarPendientes]);

  const handleSincronizarNube = async () => {
    if (!isOnline || sincronizandoOffline || pendientesOffline === 0) return;
    setSincronizandoOffline(true);
    try {
      await sincronizarColaOffline();
      await actualizarPendientes();
    } catch (err) {
      console.error('Error sincronizando cola offline:', err);
    } finally {
      setSincronizandoOffline(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  const sidebarNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full ${sidebarColapsado ? 'px-2 py-3 justify-center' : 'px-4 py-3'} rounded-xl font-bold text-sm flex items-center ${sidebarColapsado ? 'justify-center' : 'gap-3'} transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-amaru-copper text-white shadow-md shadow-orange-500/20 border-l-4 border-white'
        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
    }`;

  // Determinación de vendedor y nombres operativos
  const esVendedor = !isAdmin && !isPatient;
  const nombreVendedorCompleto = (
    localStorage.getItem('amaru_nombre_vendedor') ||
    (userInfo.username === '17456789-2' ? 'JUANITA ARAYA' : 'CARLOS ROJAS MORALES')
  ).toUpperCase();

  return (
    <div className="min-h-screen text-[#1F1D1A] dark:text-[#F7F6F3] flex flex-col md:flex-row w-full transition-colors duration-200 bg-[#FBFBFA] dark:bg-[#121110]">
      {/* ── SIDEBAR IZQUIERDO FIJO Y COLAPSABLE ── */}
      <aside className={`w-full ${sidebarColapsado ? 'md:w-20' : 'md:w-64 lg:w-72'} shrink-0 border-b md:border-b-0 md:border-r border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#181614] ${sidebarColapsado ? 'p-3' : 'p-4 sm:p-5'} flex flex-col justify-between md:min-h-screen md:sticky md:top-0 z-30 shadow-xs transition-all duration-200`}>
        {/* Cabecera del Sidebar (Logo y Botón Colapsar) */}
        <div>
          <div className={`flex items-center ${sidebarColapsado ? 'flex-col gap-2 pb-4 justify-center' : 'justify-between gap-2 pb-5'} border-b border-slate-200/70 dark:border-white/10`}>
            <div className={`flex items-center ${sidebarColapsado ? 'justify-center' : 'gap-3'} min-w-0`}>
              <div className={`${sidebarColapsado ? 'h-11 w-11 p-1.5' : 'h-14 w-auto p-2'} flex items-center justify-center rounded-2xl bg-white dark:bg-black/40 border border-slate-200/90 dark:border-white/10 shadow-sm shrink-0 transition-all`}>
                <img src={logoImg} alt="Óptica Amaru" className="h-full w-auto object-contain rounded-xl" />
              </div>
              {!sidebarColapsado && (
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                    Óptica Amaru
                  </h1>
                  <p className="text-xs font-semibold text-amaru-copper dark:text-orange-400 truncate">
                    Salud Visual
                  </p>
                </div>
              )}
            </div>

            {/* Botón discreto para contraer / expandir en Desktop */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={sidebarColapsado ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {sidebarColapsado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Menú Vertical de Navegación */}
          <nav className="mt-4 space-y-1.5">
            {isPatient ? (
              <NavLink to="/seguimiento" className={sidebarNavLinkClass} title="Mis Pedidos">
                <Compass size={18} className="shrink-0" />
                {!sidebarColapsado && <span>Mis Pedidos</span>}
              </NavLink>
            ) : isAdmin ? (
              /* ── Sidebar Administradora: Control Total Consolidado (Negocio + Convenios + Auditoría SHA-256) ── */
              <div className="space-y-4">
                {/* 1. GESTIÓN DEL NEGOCIO */}
                <div>
                  {!sidebarColapsado ? (
                    <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Gestión del Negocio
                    </div>
                  ) : (
                    <div className="h-px bg-slate-200/70 dark:bg-white/10 my-2 mx-1" />
                  )}
                  <div className="space-y-1">
                    <NavLink
                      to="/dashboard"
                      className={() =>
                        sidebarNavLinkClass({ isActive: isDashboardPath && searchTab !== 'convenios' })
                      }
                      title="Resumen del Negocio"
                    >
                      <BarChart3 size={18} className="shrink-0" />
                      {!sidebarColapsado && (
                        <>
                          <span className="flex-1">Resumen del Negocio</span>
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            EN VIVO
                          </span>
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard?tab=convenios"
                      className={() =>
                        sidebarNavLinkClass({ isActive: isDashboardPath && searchTab === 'convenios' })
                      }
                      title="Convenios Sindicales"
                    >
                      <Receipt size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Convenios Sindicales</span>}
                    </NavLink>
                    <NavLink to="/auditoria" className={sidebarNavLinkClass} title="Auditoría SHA-256">
                      <ShieldAlert size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Auditoría SHA-256</span>}
                    </NavLink>
                    <NavLink to="/inventario" className={sidebarNavLinkClass} title="Inventario y Ganancias">
                      <ShoppingBag size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Inventario y Ganancias</span>}
                    </NavLink>
                    <NavLink to="/seguimiento" className={sidebarNavLinkClass} title="Estado de Pedidos y Cobros">
                      <Compass size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Estado de Pedidos y Cobros</span>}
                    </NavLink>
                  </div>
                </div>

                {/* 2. OPERACIÓN EN TIENDA */}
                <div>
                  {!sidebarColapsado ? (
                    <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Operación en Tienda
                    </div>
                  ) : (
                    <div className="h-px bg-slate-200/70 dark:bg-white/10 my-2 mx-1" />
                  )}
                  <div className="space-y-1">
                    <NavLink to="/terminal" className={sidebarNavLinkClass} title="Vender en Tienda">
                      <UserPlus size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Vender en Tienda</span>}
                    </NavLink>
                    <NavLink to="/despacho" className={sidebarNavLinkClass} title="Entregar Lentes">
                      <Truck size={18} className="shrink-0" />
                      {!sidebarColapsado && <span>Entregar Lentes</span>}
                    </NavLink>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Sidebar Operador/Vendedor: Orden Cronológico POS ── */
              <div className="space-y-1">
                <NavLink to="/terminal" className={sidebarNavLinkClass} title="Nueva Atención">
                  <UserPlus size={18} className="shrink-0" />
                  {!sidebarColapsado && <span>Nueva Atención</span>}
                </NavLink>
                <NavLink to="/inventario" className={sidebarNavLinkClass} title="Inventario & Stock">
                  <ShoppingBag size={18} className="shrink-0" />
                  {!sidebarColapsado && <span>Inventario & Stock</span>}
                </NavLink>
                <NavLink to="/seguimiento" className={sidebarNavLinkClass} title="Seguimiento de Pedidos">
                  <Compass size={18} className="shrink-0" />
                  {!sidebarColapsado && <span>Seguimiento de Pedidos</span>}
                </NavLink>
                <NavLink to="/despacho" className={sidebarNavLinkClass} title="Entregas">
                  <Truck size={18} className="shrink-0" />
                  {!sidebarColapsado && <span>Entregas</span>}
                </NavLink>
              </div>
            )}
          </nav>
        </div>

        {/* Pie del Sidebar */}
        <div className="pt-4 mt-4 border-t border-slate-200/70 dark:border-white/10 space-y-2.5">
          {/* Indicador de Sucursal Activa (Calama) */}
          {!isPatient && (
            <div
              onClick={handleToggleSucursal}
              className={`w-full flex items-center ${sidebarColapsado ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs`}
              title="Sucursal Operativa Activa: Calama (arquitectura escalable multi-sucursal)"
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-amaru-copper shrink-0" />
                {!sidebarColapsado && <span>Sucursal Activa</span>}
              </div>
              {!sidebarColapsado && (
                <span className="bg-amber-500/20 dark:bg-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                  Calama
                </span>
              )}
            </div>
          )}

          {/* Widget de Estado de Red / Sincronización */}
          <div className="relative">
              <button
                type="button"
                onClick={() => setPopoverSincronizacionOpen(!popoverSincronizacionOpen)}
                className={`w-full flex items-center ${sidebarColapsado ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  !isOnline
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20'
                    : pendientesOffline > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                }`}
                title={!isOnline ? 'Sin Conexión' : pendientesOffline > 0 ? `${pendientesOffline} en cola offline` : 'En Línea'}
              >
                {!isOnline ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      {!sidebarColapsado && <span className="font-mono text-[11px] font-bold">Sin Conexión</span>}
                    </div>
                    {pendientesOffline > 0 && !sidebarColapsado && (
                      <span className="font-mono text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">
                        {pendientesOffline}
                      </span>
                    )}
                  </>
                ) : pendientesOffline > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CloudAlert
                        size={15}
                        className={sincronizandoOffline ? 'animate-spin text-amber-500' : 'text-amber-500 animate-pulse'}
                      />
                      {!sidebarColapsado && <span className="font-mono text-[11px] font-bold">En Línea</span>}
                    </div>
                    {!sidebarColapsado && (
                      <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                        {pendientesOffline} cola
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CloudCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                      {!sidebarColapsado && <span className="font-medium text-[11px]">En Línea</span>}
                    </div>
                    {!sidebarColapsado && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Al día
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Popover / Dropdown de Diagnóstico de Red y Dexie */}
              {popoverSincronizacionOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-full sm:w-72 p-4 rounded-2xl bg-white/95 dark:bg-[#1C1A18]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Monitor de Conexión
                    </span>
                    <button
                      type="button"
                      onClick={() => setPopoverSincronizacionOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="py-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-zinc-400">Estado de Red</span>
                      <span className="inline-flex items-center gap-1.5 font-bold font-mono">
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {isOnline ? 'Internet Conectado' : 'Sin Conexión'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-zinc-400">Motor de Resguardo</span>
                      <span className="font-semibold text-amaru-copper dark:text-orange-400">
                        Dexie IndexedDB (Local)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-zinc-400">Registros en Cola</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {pendientesOffline} registro{pendientesOffline === 1 ? '' : 's'}
                      </span>
                    </div>

                    {isPatient ? (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
                        <span>Conexión Segura Activa. Tus recetas y datos viajan encriptados bajo Ley 21.719.</span>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSincronizarNube}
                          disabled={!isOnline || sincronizandoOffline || pendientesOffline === 0}
                          className="w-full py-2 px-3 rounded-xl bg-amaru-copper hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <RefreshCw size={13} className={sincronizandoOffline ? 'animate-spin' : ''} />
                          <span>{sincronizandoOffline ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={handleLogout}
            title="Cerrar Sesión Segura"
            className={`w-full flex items-center ${sidebarColapsado ? 'justify-center p-2.5' : 'justify-center gap-2 px-3.5 py-2.5'} rounded-xl text-xs font-bold text-slate-600 hover:text-white dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:bg-rose-600 hover:border-rose-600 dark:hover:bg-rose-600 dark:hover:border-rose-600 transition-all cursor-pointer shadow-2xs`}
          >
            <LogOut size={14} className="shrink-0" />
            {!sidebarColapsado && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── ÁREA DE CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior del Área Principal */}
        <header className="w-full sticky top-0 z-20 bg-white/85 dark:bg-[#181614]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          {/* Identidad Destacada del Usuario: Formato exacto requerido */}
          <div className="flex items-center gap-3 flex-wrap">
            {esVendedor ? (
              <div className="px-4 sm:px-5 py-2 rounded-2xl bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-600/30 flex items-center gap-2.5">
                <Wrench size={18} className="text-white shrink-0" />
                <span className="text-base sm:text-lg font-black tracking-tight uppercase">
                  {nombreVendedorCompleto} (VENDEDOR)
                </span>
              </div>
            ) : isAdmin ? (
              <div className="px-4 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-800 to-[#B85D19] text-white border border-amber-600/60 shadow-md shadow-amber-800/30 flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-white shrink-0" />
                <span className="text-base sm:text-lg font-black tracking-tight uppercase">
                  {(localStorage.getItem('amaru_nombre_admin') || 'MARÍA GONZÁLEZ').toUpperCase()} (ADMINISTRADORA)
                </span>
              </div>
            ) : (
              <div className="px-4 sm:px-5 py-2 rounded-2xl bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-600/30 flex items-center gap-2.5">
                <UserCheck size={18} className="text-white shrink-0" />
                <span className="text-base sm:text-lg font-black tracking-tight uppercase">
                  {(nombrePaciente || 'MIGUEL JORGE').toUpperCase()} · PACIENTE
                </span>
              </div>
            )}

            {userInfo.rut && (
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl">
                RUT: {userInfo.rut}
              </span>
            )}
          </div>

          {/* Controles de la Barra Superior */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!isPatient && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <MapPin size={13} className="text-amaru-copper shrink-0" />
                <span>📍 Sucursal {sucursalActiva}</span>
              </div>
            )}

            {/* Interruptor de Tema (Sol/Luna) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              className="p-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-[#6C6A68] dark:text-zinc-300 hover:text-amaru-copper dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-amaru-dark" />
              )}
            </button>
          </div>
        </header>

        {/* ── Banner de Alerta por Acceso No Autorizado ── */}
        {alertaRestringida && (
          <div className="mx-4 sm:mx-8 mt-4 bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-md animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600 dark:text-red-400 text-sm">⚠</span>
              <span>{alertaRestringida}</span>
            </div>
            <button
              onClick={() => setAlertaRestringida(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-white font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Contenido de Vistas ── */}
        <main className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={isPatient ? "/seguimiento" : isAdmin ? "/dashboard" : "/terminal"}
                replace
              />
            }
          />
          <Route
            path="/terminal"
            element={
              isPatient ? (
                <Navigate to="/seguimiento" replace />
              ) : (
                <TerminalView isOnline={isOnline} onSessionExpired={handleLogout} />
              )
            }
          />
          <Route
            path="/inventario"
            element={
              isPatient ? (
                <Navigate to="/seguimiento" replace />
              ) : (
                <InventarioView />
              )
            }
          />
          <Route
            path="/despacho"
            element={
              isPatient ? (
                <Navigate to="/seguimiento" replace />
              ) : (
                <EntregaView isOnline={isOnline} onSessionExpired={handleLogout} />
              )
            }
          />
          <Route path="/seguimiento" element={<SeguimientoCompraView />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAllowed={isAdmin}
                redirectPath="/seguimiento"
                onUnauthorized={() =>
                  setAlertaRestringida(
                    'Acceso restringido: Se requieren privilegios de Administrador para acceder al Dashboard Gerencial.'
                  )
                }
              >
                <DashboardView onSessionExpired={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute
                isAllowed={isAdmin}
                redirectPath="/seguimiento"
                onUnauthorized={() =>
                  setAlertaRestringida(
                    'Acceso restringido: La Auditoría Inmutable SHA-256 es exclusiva del rol Administrador.'
                  )
                }
              >
                <AuditoriaView />
              </ProtectedRoute>
            }
          />
          <Route path="/qr" element={<PublicQRView />} />
          {/* Catch-all → seguimiento si es paciente, dashboard si es admin, sino terminal */}
          <Route
            path="*"
            element={
              <Navigate
                to={isPatient ? "/seguimiento" : isAdmin ? "/dashboard" : "/terminal"}
                replace
              />
            }
          />
        </Routes>
      </main>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkSession());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // Inicializar y sincronizar tema en raíz para que aplique en login y vistas
  useTheme();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('amaru_session_active', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  return (
    <Routes>
      {/* ── Ruta Pública para Admisión Self-Service vía QR en Faena ── */}
      <Route path="/qr" element={<PublicQRView />} />
      <Route
        path="/seguimiento-publico"
        element={
          <div className="min-h-screen text-[#1F1D1A] dark:text-[#F7F6F3] p-4 sm:p-6 max-w-6xl mx-auto">
            <SeguimientoCompraView />
          </div>
        }
      />

      {/* ── Rutas Autenticadas de la Plataforma ── */}
      <Route
        path="/*"
        element={
          !isAuthenticated ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <AppLayout isOnline={isOnline} onLogout={handleLogout} />
          )
        }
      />
    </Routes>
  );
}
