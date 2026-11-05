import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import loginBg from '../assets/login.jpg';
import { useTheme } from '../hooks/useTheme';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const { toggleTheme, isDark } = useTheme();
    const [rut, setRut] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validación si intenta autenticarse por primera vez sin internet
        if (!navigator.onLine) {
            setError('El primer inicio de turno requiere conexión para validar credenciales.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: rut.trim(),
                    password: password.trim(),
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Credenciales inválidas. Verifique RUT y contraseña.');
                }
                throw new Error(`Error en el servidor (${response.status})`);
            }

            const data = await response.json();

            // Almacenamos tokens y timestamp de expiración (14 horas)
            const now = new Date().getTime();
            const expirationTime = now + 14 * 60 * 60 * 1000;

            localStorage.setItem('amaru_access_token', data.access);
            localStorage.setItem('amaru_refresh_token', data.refresh);
            localStorage.setItem('amaru_session_expires_at', expirationTime.toString());
            localStorage.setItem('amaru_session_active', 'true');
            localStorage.setItem('amaru_is_staff', String(Boolean(data.is_staff)));
            localStorage.setItem('amaru_rol', data.rol || (data.is_staff ? 'ADMIN' : 'OPERADOR'));
            localStorage.setItem('amaru_username', data.username || rut.trim());

            onLoginSuccess();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
            {/* Estilos inyectados para el movimiento fluido de las esferas */}
            <style>
                {`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}
            </style>

            {/* Fondo de Calama con Transparencia Blanca (Efecto Premium) */}
            <div className="absolute inset-0 z-0">
                <img
                    src={loginBg}
                    alt="Entrada de Calama"
                    className="w-full h-full object-cover"
                />
                {/* Capa semitransparente con soporte dual claro/oscuro */}
                <div className="absolute inset-0 bg-slate-50/85 dark:bg-[#1A1816]/90 backdrop-blur-sm transition-colors"></div>
            </div>

            {/* Toggle Flotante de Tema Claro/Oscuro */}
            <div className="absolute top-5 right-5 z-20">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-2.5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-[#2A2522]/80 hover:bg-white dark:hover:bg-[#2A2522] text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                    title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                >
                    {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                </button>
            </div>

            {/* Esferas Flotantes Animadas (Colores Cobre Amaru) */}
            <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-[#B34B0C]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
            <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-amber-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>

            {/* Contenedor Glassmorphism (Efecto Vidrio) */}
            <div className="relative z-10 w-full max-w-4xl mx-6 flex flex-col md:flex-row bg-white/70 dark:bg-[#2A2522]/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/60 dark:border-white/10 overflow-hidden">

                {/* Panel Izquierdo (Branding) */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-white/70 to-white/30 dark:from-[#2A2522]/80 dark:to-[#1A1816]/80 p-8 md:p-10 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-white/40 dark:border-white/10">
                    <div className="bg-white dark:bg-[#1A1816] p-4 rounded-3xl shadow-sm mb-6 transition-transform duration-300 hover:scale-105 border border-slate-100 dark:border-slate-800">
                        <img src={logoImg} alt="Óptica Amaru" className="h-16 w-auto object-contain rounded-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#37322E] dark:text-white tracking-tight mb-2">BIENVENIDO</h2>
                    <p className="text-[#B34B0C] font-bold tracking-widest text-xs uppercase mb-6">Portal Industrial</p>

                    <div className="w-12 h-1.5 bg-[#B34B0C] rounded-full mb-6"></div>

                    <p className="text-center text-sm text-slate-700 dark:text-slate-300 font-medium px-4">
                        Gestión certificada de EPP óptico en terreno minero.
                    </p>
                </div>

                {/* Panel Derecho (Formulario) */}
                <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center relative bg-white/40 dark:bg-[#201E1C]/80">
                    {/* Botón flotante central de la referencia */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-[#2A2522] rounded-full shadow-lg border border-slate-100 dark:border-slate-700 items-center justify-center text-[#B34B0C] hidden md:flex z-20 hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-extrabold text-[#37322E] dark:text-white mb-6 text-center md:text-left tracking-wide">
                        INICIAR SESIÓN <span className="text-[#B34B0C]">.</span>
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3.5">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#B34B0C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Usuario (RUT)"
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-[#1A1816]/70 border border-white/80 dark:border-slate-700 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#B34B0C]/50 transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#B34B0C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-[#1A1816]/70 border border-white/80 dark:border-slate-700 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#B34B0C]/50 transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 pt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-[#37322E] dark:hover:text-white transition-colors">
                                <input type="checkbox" className="rounded border-slate-300 text-[#B34B0C] focus:ring-[#B34B0C]" />
                                Recordar cuenta
                            </label>
                            <a href="#" className="hover:text-[#B34B0C] transition-colors">¿Olvidaste tu contraseña?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-1 bg-[#37322E] hover:bg-[#B34B0C] text-white font-bold tracking-wider py-3.5 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm"
                        >
                            {loading ? 'Autenticando...' : 'Entrar'}
                        </button>
                    </form>

                    {/* Separador — O auto-atención en faena — */}
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300/80 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase">
                            <span className="bg-white/80 dark:bg-[#201E1C] px-3 text-slate-500 dark:text-slate-400 font-semibold tracking-wider rounded-full backdrop-blur-xs">
                                — O auto-atención en faena —
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta interactiva de Auto-Atención en Faena (Acceso QR) */}
                    <div
                        onClick={() => navigate('/qr')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                navigate('/qr');
                            }
                        }}
                        className="group border-2 border-dashed border-[#B34B0C]/40 hover:border-[#B34B0C] bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50/80 dark:hover:bg-orange-950/30 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-[#1A1816] rounded-xl shadow-xs border border-orange-200/60 dark:border-orange-900/50 text-[#B34B0C] group-hover:scale-105 transition-transform shrink-0">
                                <QrCode size={34} className="text-[#B34B0C]" strokeWidth={2.2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#B34B0C] transition-colors">
                                        ¿Eres trabajador sin cuenta?
                                    </h4>
                                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#B34B0C]/10 text-[#B34B0C] font-bold">
                                        QR
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                    Escanea este código o pulsa aquí para solicitar tu lente EPP o agendar evaluación médica con tu RUT.
                                </p>
                            </div>
                        </div>

                        {/* Botón de acceso directo */}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/qr');
                                }}
                                className="w-full bg-[#B34B0C] hover:bg-[#8F3B09] text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                                <QrCode size={15} />
                                <span>Ingresar con RUT (Auto-Atención Faena)</span>
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
