import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Login } from './components/Login';
import TerminalView from './views/TerminalView';
import DashboardView from './views/DashboardView';
import logoImg from './assets/logo.jpg';

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
}

// ── Inner layout (rendered when authenticated) ────────────────────────────────

interface AppLayoutProps {
  isOnline: boolean;
  onLogout: () => void;
}

function AppLayout({ isOnline, onLogout }: AppLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
      isActive
        ? 'text-[#FF5500] border-b-2 border-[#FF5500]'
        : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-zinc-100 flex flex-col items-center font-sans">
      {/* ── Header ── */}
      <header className="w-full max-w-6xl flex justify-between items-center bg-[#121826] border border-[#2A364F] px-6 py-4 rounded-xl shadow-xl mt-6 mb-6">
        {/* Left: logo + title */}
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Óptica Amaru" className="h-10 w-auto object-contain rounded" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Óptica Amaru</h1>
            <p className="text-xs text-zinc-400">Plataforma Health-Tech EPP Minería</p>
          </div>
        </div>

        {/* Centre: navigation tabs */}
        <nav className="flex items-center gap-1">
          <NavLink to="/terminal" className={navLinkClass}>
            Terminal Faena
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard Gerencial
          </NavLink>
        </nav>

        {/* Right: online indicator + logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-[#1A2234] border border-[#2A364F] px-3 py-1.5 rounded-lg">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-semibold">{isOnline ? 'En Línea' : 'Offline'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-zinc-400 hover:text-[#FF5500] border border-[#2A364F] hover:border-[#FF5500] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="w-full max-w-6xl px-0 pb-10">
        <Routes>
          <Route path="/" element={<Navigate to="/terminal" replace />} />
          <Route
            path="/terminal"
            element={<TerminalView isOnline={isOnline} onSessionExpired={handleLogout} />}
          />
          <Route
            path="/dashboard"
            element={<DashboardView onSessionExpired={handleLogout} />}
          />
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

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <AppLayout isOnline={isOnline} onLogout={handleLogout} />;
}
