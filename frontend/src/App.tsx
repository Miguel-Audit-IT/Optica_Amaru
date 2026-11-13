import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  ShieldAlert,
  Wrench,
  FileCheck,
  UserCheck,
  LogOut,
  UserPlus,
  Truck,
  Compass,
  BarChart3,
  CloudAlert,
  CloudCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Login } from './components/Login';
import TerminalView from './views/TerminalView';
import DashboardView from './views/DashboardView';
import EntregaView from './views/EntregaView';
import PublicQRView from './views/PublicQRView';
import SeguimientoCompraView from './views/SeguimientoCompraView';
import logoImg from './assets/logo.jpg';
import { isUserAdmin, isUserPatient, getUserInfo } from './utils/auth';
import { useTheme } from './hooks/useTheme';
import { db } from './db/dexie';
import { sincronizarColaOffline } from './sw/syncService';

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
  const { toggleTheme, isDark } = useTheme();

  const isAdmin = isUserAdmin();
  const isPatient = isUserPatient();
  const userInfo = getUserInfo();

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center gap-1.5 ${
      isActive
        ? 'laser-tab-active font-bold text-amaru-copper dark:text-[#E27230]'
        : 'text-[#6C6A68] hover:text-[#201E1C] dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
    }`;

  // Determinación de badge de Rol activo con iconografía distintiva y alta jerarquía sólida
  const rolActivo = (userInfo.rol || (isAdmin ? 'ADMINISTRADOR' : isPatient ? 'PACIENTE' : 'OPERADOR')).toUpperCase();
  const roleBadge = rolActivo.includes('ADMIN')
    ? {
        label: 'ADMINISTRADOR',
        icon: <ShieldAlert size={15} className="text-white" />,
        classes: 'bg-amber-600 text-white border border-amber-500 shadow-md shadow-amber-600/30',
      }
    : rolActivo.includes('AUDIT')
    ? {
        label: 'AUDITOR',
        icon: <FileCheck size={15} className="text-white" />,
        classes: 'bg-slate-700 text-white border border-slate-600 shadow-md shadow-slate-700/30',
      }
    : rolActivo.includes('PACIENTE')
    ? {
        label: `${(nombrePaciente || 'MIGUEL JORGE').toUpperCase()} · PACIENTE`,
        icon: <UserCheck size={15} className="text-white" />,
        classes: 'bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-600/30',
      }
    : {
        label: 'OPERADOR',
        icon: <Wrench size={15} className="text-white" />,
        classes: 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-600/30',
      };

  return (
    <div className="min-h-screen text-[#1F1D1A] dark:text-[#F7F6F3] flex flex-col items-center transition-colors duration-200">
      {/* ── Barra de Comando Industrial & Navbar Glassmorphism ── */}
      <header className="w-full max-w-6xl sticky top-4 z-40 px-3 sm:px-0 mt-3 sm:mt-5 mb-5">
        <div className="w-full backdrop-blur-md bg-white/85 dark:bg-[#141210]/85 border border-slate-200/90 dark:border-white/10 border-b-2 border-b-amaru-copper/40 px-4 sm:px-6 py-3.5 rounded-2xl shadow-sm dark:shadow-2xl transition-all flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: logo + title + role badge */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3.5">
              <div className="h-12 sm:h-14 w-auto flex items-center justify-center p-1.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200/90 dark:border-white/10 shadow-sm">
                <img src={logoImg} alt="Óptica Amaru" className="h-full w-auto object-contain rounded-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1F1D1A] dark:text-white">
                    Óptica Amaru
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-black tracking-widest uppercase px-3 py-1 sm:px-3.5 sm:py-1 rounded-full shadow-sm transition-transform hover:scale-105 ${roleBadge.classes}`}
                  >
                    {roleBadge.icon}
                    <span>{roleBadge.label}</span>
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#6C6A68] dark:text-zinc-400 mt-0.5">
                  Plataforma de Salud Visual
                </p>
              </div>
            </div>
          </div>

          {/* Centre: navigation tabs with laser pill indicator */}
          <nav className="flex items-center gap-1 bg-slate-100/70 dark:bg-black/40 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-x-auto max-w-full">
            {!isPatient && (
              <>
                <NavLink to="/terminal" className={navLinkClass}>
                  <UserPlus size={14} className="opacity-70" />
                  <span>Nueva Atención</span>
                </NavLink>
                <NavLink to="/despacho" className={navLinkClass}>
                  <Truck size={14} className="opacity-70" />
                  <span>Entregas</span>
                </NavLink>
              </>
            )}
            <NavLink to="/seguimiento" className={navLinkClass}>
              <Compass size={14} className="opacity-70" />
              <span>{isPatient ? 'Mis Pedidos' : 'Trazabilidad'}</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 size={14} className="opacity-70" />
                <span>Dashboard</span>
              </NavLink>
            )}
          </nav>

          {/* Right: Unified Network & Sync Monitor Widget + Theme toggle + User Tag + Logout */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end relative">
            {/* Monitor Unificado de Red y Cola FIFO Dexie */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPopoverSincronizacionOpen(!popoverSincronizacionOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  !isOnline
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20'
                    : pendientesOffline > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                }`}
                title="Ver estado de conexión y sincronización local"
              >
                {!isOnline ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      Modo Sin Conexión{pendientesOffline > 0 ? ` (${pendientesOffline})` : ''}
                    </span>
                  </>
                ) : pendientesOffline > 0 ? (
                  <>
                    <CloudAlert
                      size={15}
                      className={sincronizandoOffline ? 'animate-spin text-amber-500' : 'text-amber-500 animate-pulse'}
                    />
                    <span className="font-mono text-[11px] font-bold">
                      En Línea · {pendientesOffline} por sincronizar
                    </span>
                  </>
                ) : (
                  <>
                    <CloudCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-[11px]">En Línea · Guardado al día</span>
                  </>
                )}
              </button>

              {/* Popover / Dropdown de Diagnóstico de Red y Dexie */}
              {popoverSincronizacionOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-2xl bg-white/95 dark:bg-[#1C1A18]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
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

            {userInfo.username && (
              <span className="text-[11px] text-[#6C6A68] dark:text-zinc-400 font-mono hidden md:inline px-2 py-1 rounded-lg bg-slate-100/60 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-700/50">
                {userInfo.username}
              </span>
            )}

            {/* Interruptor de Tema (Sol/Luna) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              className="p-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-[#6C6A68] dark:text-zinc-300 hover:text-amaru-copper dark:hover:text-amber-400 transition-all cursor-pointer shadow-2xs"
            >
              {isDark ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-amaru-dark" />
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión Segura"
              className="text-xs font-semibold text-[#6C6A68] hover:text-white dark:text-zinc-300 dark:hover:text-white border border-slate-200/90 dark:border-white/10 hover:bg-amaru-copper dark:hover:bg-amaru-copper hover:border-amaru-copper dark:hover:border-amaru-copper px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Banner de Alerta por Acceso No Autorizado ── */}
      {alertaRestringida && (
        <div className="w-full max-w-6xl mb-4 bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-md animate-in fade-in duration-300">
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

      {/* ── Main content ── */}
      <main className="w-full max-w-6xl px-0 pb-10">
        <Routes>
          <Route path="/" element={<Navigate to={isPatient ? "/seguimiento" : "/terminal"} replace />} />
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
            path="/despacho"
            element={
              isPatient ? (
                <Navigate to="/seguimiento" replace />
              ) : (
                <EntregaView isOnline={isOnline} onSessionExpired={handleLogout} />
              )
            }
          />
          <Route
            path="/seguimiento"
            element={<SeguimientoCompraView />}
          />
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
          <Route path="/qr" element={<PublicQRView />} />
          {/* Catch-all → seguimiento si es paciente, sino terminal */}
          <Route path="*" element={<Navigate to={isPatient ? "/seguimiento" : "/terminal"} replace />} />
        </Routes>
      </main>
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
