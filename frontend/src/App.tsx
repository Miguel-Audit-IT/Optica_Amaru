import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Login } from './components/Login';
import TerminalView from './views/TerminalView';
import DashboardView from './views/DashboardView';
import EntregaView from './views/EntregaView';
import PublicQRView from './views/PublicQRView';
import logoImg from './assets/logo.jpg';
import { isUserStaffOrAdmin, getUserInfo } from './utils/auth';
import { useTheme } from './hooks/useTheme';

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
  const { toggleTheme, isDark } = useTheme();

  const isStaff = isUserStaffOrAdmin();
  const userInfo = getUserInfo();

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
      isActive
        ? 'text-amaru-copper border-b-2 border-amaru-copper font-bold'
        : 'text-[#6C6A68] hover:text-[#201E1C] dark:text-zinc-400 dark:hover:text-zinc-200'
    }`;

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#1E1C1A] text-[#201E1C] dark:text-[#F5F5F4] flex flex-col items-center font-sans transition-colors duration-200">
      {/* ── Header ── */}
      <header className="w-full max-w-6xl flex justify-between items-center bg-white dark:bg-[#282523] border border-slate-200 dark:border-[#3E3A36] px-6 py-4 rounded-2xl shadow-sm dark:shadow-xl mt-6 mb-5 transition-colors">
        {/* Left: logo + title */}
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Óptica Amaru" className="h-10 w-auto object-contain rounded-lg shadow-xs" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#201E1C] dark:text-white flex items-center gap-2">
              Óptica Amaru
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium tracking-normal border ${
                  isStaff
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-700/60'
                    : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-700/60'
                }`}
              >
                {userInfo.rol || (isStaff ? 'ADMIN' : 'OPERADOR')}
              </span>
            </h1>
            <p className="text-xs text-[#6C6A68] dark:text-[#B3B2B0]">Plataforma Health-Tech EPP Minería</p>
          </div>
        </div>

        {/* Centre: navigation tabs (Dashboard sólo visible para usuarios con privilegios) */}
        <nav className="flex items-center gap-2">
          <NavLink to="/terminal" className={navLinkClass}>
            Terminal Faena
          </NavLink>
          <NavLink to="/despacho" className={navLinkClass}>
            Despacho
          </NavLink>
          {isStaff && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard Gerencial
            </NavLink>
          )}
        </nav>

        {/* Right: theme toggle + user tag + online indicator + logout */}
        <div className="flex items-center gap-3">
          {userInfo.username && (
            <span className="text-xs text-[#6C6A68] dark:text-[#B3B2B0] font-mono hidden md:inline">
              {userInfo.username}
            </span>
          )}

          {/* Interruptor de Tema (Sol/Luna) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#3E3A36] bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1C1A] dark:hover:bg-[#37322E] text-[#6C6A68] dark:text-[#B3B2B0] hover:text-amaru-copper dark:hover:text-amaru-copper transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-amaru-dark" />
            )}
          </button>

          {/* Indicador de Conexión */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] px-3 py-1.5 rounded-xl">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-semibold text-[#201E1C] dark:text-[#F5F5F4]">
              {isOnline ? 'En Línea' : 'Offline'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-[#6C6A68] hover:text-amaru-copper dark:text-[#B3B2B0] dark:hover:text-amaru-copper border border-slate-200 dark:border-[#3E3A36] hover:border-amaru-copper dark:hover:border-amaru-copper px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Salir
          </button>
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
          <Route path="/" element={<Navigate to="/terminal" replace />} />
          <Route
            path="/terminal"
            element={<TerminalView isOnline={isOnline} onSessionExpired={handleLogout} />}
          />
          <Route
            path="/despacho"
            element={<EntregaView isOnline={isOnline} onSessionExpired={handleLogout} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAllowed={isStaff}
                onUnauthorized={() =>
                  setAlertaRestringida(
                    'Acceso restringido: Se requieren privilegios de administración o gerencia para acceder al Dashboard Gerencial.'
                  )
                }
              >
                <DashboardView onSessionExpired={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="/qr" element={<PublicQRView />} />
          {/* Catch-all → terminal */}
          <Route path="*" element={<Navigate to="/terminal" replace />} />
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
