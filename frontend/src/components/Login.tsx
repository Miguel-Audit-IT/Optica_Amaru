import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';
import loginBg from '../assets/login.jpg';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [rut, setRut] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (rut.trim() && password.trim()) {
                onLoginSuccess();
            } else {
                setError('Por favor ingrese RUT y contraseña');
            }
        } catch {
            setError('Credenciales inválidas o falla de conexión');
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
                {/* Capa blanca semitransparente al 85% para mantener el estilo claro */}
                <div className="absolute inset-0 bg-slate-50/85 backdrop-blur-sm"></div>
            </div>

            {/* Esferas Flotantes Animadas (Colores Amaru sutiles) */}
            <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-[#FF5500]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
            <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>

            {/* Contenedor Glassmorphism (Efecto Vidrio) */}
            <div className="relative z-10 w-full max-w-4xl mx-6 flex flex-col md:flex-row bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/60 overflow-hidden">

                {/* Panel Izquierdo (Branding) */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-white/70 to-white/30 p-10 flex flex-col justify-center items-center border-r border-white/40">
                    <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 transition-transform duration-300 hover:scale-105">
                        <img src={logoImg} alt="Óptica Amaru" className="h-16 w-auto object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#0B0F19] tracking-tight mb-2">BIENVENIDO</h2>
                    <p className="text-[#FF5500] font-bold tracking-widest text-xs uppercase mb-6">Portal Industrial</p>

                    <div className="w-12 h-1.5 bg-[#FF5500] rounded-full mb-6"></div>

                    <p className="text-center text-sm text-slate-700 font-medium px-4">
                        Gestión certificada de EPP óptico en terreno minero.
                    </p>
                </div>

                {/* Panel Derecho (Formulario) */}
                <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center relative bg-white/40">
                    {/* Botón flotante central de la referencia */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 items-center justify-center text-[#FF5500] hidden md:flex z-20 hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-extrabold text-[#0B0F19] mb-8 text-center md:text-left tracking-wide">
                        INICIAR SESIÓN <span className="text-[#FF5500]">.</span>
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#FF5500] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Usuario (RUT)"
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-white/80 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#FF5500] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-white/80 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 pt-1 text-xs font-medium text-slate-500">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-[#0B0F19] transition-colors">
                                <input type="checkbox" className="rounded border-slate-300 text-[#FF5500] focus:ring-[#FF5500]" />
                                Recordar cuenta
                            </label>
                            <a href="#" className="hover:text-[#FF5500] transition-colors">¿Olvidaste tu contraseña?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-[#0B0F19] text-white font-bold tracking-wider py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-[#FF5500] transform hover:-translate-y-1 transition-all duration-300"
                        >
                            {loading ? 'Autenticando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-8 flex justify-center space-x-4 text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-[#FF5500] hover:text-white transition-colors cursor-pointer shadow-sm">
                            <span className="text-xs font-bold">f</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-[#FF5500] hover:text-white transition-colors cursor-pointer shadow-sm">
                            <span className="text-xs font-bold">in</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};