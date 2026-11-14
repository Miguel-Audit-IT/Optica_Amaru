import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Eye, EyeOff, QrCode, ArrowRight, User, Briefcase, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import loginBg from '../assets/login.jpg';
import { useTheme } from '../hooks/useTheme';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const { toggleTheme, isDark } = useTheme();
    const [perfil, setPerfil] = useState<'paciente' | 'equipo'>('paciente');
    const [rut, setRut] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            localStorage.setItem('amaru_rol', data.rol || (data.is_staff ? 'ADMINISTRADOR' : 'PACIENTE'));
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

            {/* Fondo de Calama Nítido con High-Key Luminance y Paneo Suave */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src={loginBg}
                    alt="Entrada de Calama"
                    className="w-full h-full object-cover object-center brightness-105 contrast-105 saturate-110 animate-ken-burns"
                />
                {/* Velo Blanco Perlado Luminoso con desenfoque sutil (3px) */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#FAF8F5]/50 to-white/65 dark:from-stone-950/70 dark:via-[#1A1816]/60 dark:to-stone-950/70 backdrop-blur-[3px] transition-colors" />
                {/* Halógeno Radial Cálido detrás de la tarjeta central */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,rgba(184,93,25,0.08)_45%,transparent_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(184,93,25,0.15)_45%,transparent_75%)]" />
            </div>

            {/* Toggle Flotante de Tema Claro/Oscuro */}
            <div className="absolute top-5 right-5 z-20">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-2.5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#2A2522]/80 hover:bg-white dark:hover:bg-[#2A2522] text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                    title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                >
                    {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                </button>
            </div>

            {/* Esferas Flotantes Animadas (Colores Cobre Amaru) */}
            <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-[#B34B0C]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob z-0"></div>
            <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-amber-300/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000 z-0"></div>

            {/* Contenedor Glassmorphism Enterprise de Dimensiones Generosas */}
            <div className="relative z-10 w-full max-w-4xl lg:max-w-5xl mx-4 sm:mx-6 flex flex-col md:flex-row rounded-[32px] border border-white ring-1 ring-stone-900/5 shadow-[0_25px_70px_-15px_rgba(28,25,23,0.16),0_10px_25px_-10px_rgba(184,93,25,0.10)] overflow-hidden backdrop-blur-xl animate-stagger-1 my-8">

                {/* Panel Izquierdo (Branding, Sucursales en Vivo y Protección Leyes) */}
                <div className="w-full md:w-5/12 bg-gradient-to-b from-[#FCFBF9] to-[#F5EFE6]/80 dark:from-[#2A2522]/90 dark:to-[#1A1816]/90 p-8 lg:p-11 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200/60 dark:border-white/10 text-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-float bg-white dark:bg-[#1A1816] p-5 rounded-3xl shadow-md mb-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-xl border border-stone-100 dark:border-stone-800 cursor-pointer">
                            <img src={logoImg} alt="Óptica Amaru" className="h-20 md:h-24 w-auto object-contain rounded-2xl" />
                        </div>
                        <h2 className="text-2xl font-black text-[#37322E] dark:text-white tracking-tight mb-2">
                            BIENVENIDO
                        </h2>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#B85D19]/10 text-[#B85D19] dark:bg-[#B85D19]/20 tracking-[0.2em] font-extrabold text-xs sm:text-sm uppercase mb-3 border border-[#B85D19]/25 shadow-2xs">
                            TU VISIÓN, TU IMAGEN
                        </span>

                        <div className="w-12 h-1 bg-[#B85D19] rounded-full mb-3 opacity-80" />

                        <p className="text-center text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium px-2 leading-relaxed max-w-xs mb-4">
                            Salud visual, boutique óptica y convenios corporativos en Calama y Antofagasta.
                        </p>

                        {/* Píldoras de Sucursales en Vivo con pulsos verdes */}
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Calama · En Línea
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Antofagasta · En Línea
                            </span>
                        </div>
                    </div>

                    {/* Sello de Confianza y Normativa Legal */}
                    <div className="pt-6 border-t border-stone-200/60 dark:border-stone-800/80 mt-6 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        <ShieldCheck size={15} className="text-[#B85D19] shrink-0" />
                        <span>Datos Protegidos · Ley 21.719 & Ley 21.663</span>
                    </div>
                </div>

                {/* Panel Derecho (Formulario Enterprise con Segmented Control + Banner QR) */}
                <div className="w-full md:w-7/12 p-8 lg:p-11 flex flex-col justify-center relative bg-white/95 dark:bg-[#1E1C1A]/95">
                    {/* Botón flotante central con pulso elegante */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-[#2A2522] rounded-full shadow-lg border border-stone-200/80 dark:border-stone-700 items-center justify-center text-[#B85D19] hidden md:flex z-20 hover:scale-110 transition-transform group/arrow animate-pulse">
                        <svg className="w-5 h-5 group-hover/arrow:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-black text-[#37322E] dark:text-white mb-4 text-center md:text-left tracking-tight">
                        INICIAR SESIÓN <span className="text-[#B85D19]">.</span>
                    </h3>

                    {/* Selector Deslizante de Perfil (Segmented Control) */}
                    <div className="mb-3 p-1 bg-stone-100/80 dark:bg-stone-800/80 rounded-2xl flex items-center gap-1 border border-stone-200/60 dark:border-stone-700/60">
                        <button
                            type="button"
                            onClick={() => setPerfil('paciente')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                                perfil === 'paciente'
                                    ? 'bg-white dark:bg-[#2A2522] text-[#B85D19] shadow-sm'
                                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                        >
                            <User size={15} />
                            <span>Soy Paciente</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPerfil('equipo')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                                perfil === 'equipo'
                                    ? 'bg-white dark:bg-[#2A2522] text-[#B85D19] shadow-sm'
                                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                            }`}
                        >
                            <Briefcase size={15} />
                            <span>Equipo / Convenio</span>
                        </button>
                    </div>

                    {/* Hint Dinámico según Perfil */}
                    <div className="mb-4 text-xs font-medium text-stone-500 dark:text-stone-400">
                        {perfil === 'paciente' ? (
                            <p className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D19]" />
                                Ingresa con tu RUT para ver tu receta y el estado de tus lentes.
                            </p>
                        ) : (
                            <p className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D19]" />
                                Acceso operativo para sucursales, laboratorio y auditoría.
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs font-semibold text-red-600 dark:text-red-400 text-center animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3.5">
                            {/* Input RUT / Usuario con Label y Feedback Elevación */}
                            <div>
                                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                                    {perfil === 'paciente' ? 'RUT PACIENTE' : 'USUARIO O RUT'} <span className="text-[#B85D19]">*</span>
                                </label>
                                <div className="relative group rounded-xl border-2 border-stone-200/90 dark:border-stone-700 bg-white dark:bg-[#1A1816] shadow-2xs hover:border-stone-300 dark:hover:border-stone-600 focus-within:border-[#B85D19] focus-within:ring-4 focus-within:ring-[#B85D19]/15 focus-within:-translate-y-[1px] focus-within:shadow-md transition-all duration-200">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-stone-400 group-focus-within:text-[#B85D19] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={perfil === 'paciente' ? '12345678-9' : 'ej: vendedor_calama o 12345678-9'}
                                        value={rut}
                                        onChange={(e) => setRut(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-stone-900 dark:text-white font-semibold placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Input Contraseña con Label, Toggle Eye y Feedback Elevación */}
                            <div>
                                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                                    CONTRASEÑA <span className="text-[#B85D19]">*</span>
                                </label>
                                <div className="relative group rounded-xl border-2 border-stone-200/90 dark:border-stone-700 bg-white dark:bg-[#1A1816] shadow-2xs hover:border-stone-300 dark:hover:border-stone-600 focus-within:border-[#B85D19] focus-within:ring-4 focus-within:ring-[#B85D19]/15 focus-within:-translate-y-[1px] focus-within:shadow-md transition-all duration-200">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-stone-400 group-focus-within:text-[#B85D19] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-11 py-3 bg-transparent text-sm text-stone-900 dark:text-white font-semibold placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-[#B85D19] dark:hover:text-[#B85D19] transition-colors cursor-pointer"
                                        tabIndex={-1}
                                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1 pt-0.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-[#37322E] dark:hover:text-white transition-colors">
                                <input type="checkbox" className="rounded border-stone-300 text-[#B85D19] focus:ring-[#B85D19]" />
                                Recordar cuenta
                            </label>
                            <a href="#" className="hover:text-[#B85D19] transition-colors">¿Olvidaste tu contraseña?</a>
                        </div>

                        {/* Botón Entrar con Shimmer */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="shimmer-btn w-full mt-2 bg-[#37322E] hover:bg-[#B85D19] active:bg-[#96470F] text-white font-bold tracking-wider py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer text-sm flex items-center justify-center gap-2 group"
                        >
                            <span>{loading ? 'Autenticando...' : 'Entrar'}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* ── Banner Destacado de Ancho Completo: QR / Solicitud Rápida con Láser Cobrizo ── */}
                    <div className="mt-5 pt-5 border-t border-stone-200/80 dark:border-stone-700/80 animate-stagger-2">
                        <div className="w-full p-4.5 rounded-2xl bg-gradient-to-br from-[#FFF9F5] to-[#F7EDE2] dark:from-[#2A231D] dark:to-[#1E1915] border border-[#B85D19]/25 shadow-sm space-y-3">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                {/* Código QR grande con animación de escaneo láser cobrizo */}
                                <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm border border-[#B85D19]/20 shrink-0 flex items-center justify-center relative overflow-hidden">
                                    <QrCode size={40} className="text-[#B85D19]" />
                                    <div className="qr-laser-line" />
                                </div>

                                {/* Textos Completos sin Truncar */}
                                <div className="text-center sm:text-left flex-1 min-w-0">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B85D19] bg-[#B85D19]/10 dark:bg-[#B85D19]/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 w-fit mb-1 border border-[#B85D19]/20">
                                        ✨ ATENCIÓN RÁPIDA SIN CUENTA
                                    </span>
                                    <h4 className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                                        Cotiza tu Receta o Agenda tu Hora
                                    </h4>
                                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                                        Ingresa directo a Sucursal Calama o Antofagasta para subir tu receta médica o agendar evaluación visual.
                                    </p>
                                </div>
                            </div>

                            {/* Botón Amplio de Ancho Completo con Shimmer */}
                            <button
                                type="button"
                                onClick={() => navigate('/qr')}
                                className="shimmer-btn w-full py-3 px-4 rounded-xl bg-[#B85D19] hover:bg-[#9A4B12] active:bg-[#7D3809] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                <span>INGRESAR A SOLICITUD Y AGENDAMIENTO RÁPIDO (QR)</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
