import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sun,
  Moon,
  MapPin,
  Phone,
  LogIn,
  AlertTriangle,
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';
import { ReservaHoraWidget } from '../components/ReservaHoraWidget';
import { useTheme } from '../hooks/useTheme';
import {
  agregarSolicitudReceta,
  type CiudadAtencion,
  type SolicitudReceta,
} from '../services/recetasService';

type TipoSolicitud = 'Cotizar Receta Médica' | 'Agendar Examen Visual' | 'Consulta Convenio';

const RATE_LIMIT_SEGUNDOS = 60;

export const PublicQRView: React.FC = () => {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  // ── Estados de Navegación por Pasos ─────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // ── Paso 1: Sucursal, Tipo y Datos del Paciente / Cliente ───────────────────
  const [sucursal, setSucursal] = useState<CiudadAtencion>('Calama');
  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud>('Cotizar Receta Médica');
  const [rut, setRut] = useState('');
  const [errorRut, setErrorRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [errorRateLimit, setErrorRateLimit] = useState<string | null>(null);

  // ── Paso 2: Validación Clínica / Receta o Agenda ─────────────────────────────
  const [estadoReceta, setEstadoReceta] = useState<'vigente' | 'vencida'>('vigente');
  const [archivoReceta, setArchivoReceta] = useState<File | null>(null);
  const [armazonSeleccionado, setArmazonSeleccionado] = useState('Titanio Pro ANSI Z87.1');

  // ── Paso 3: Confirmación y Cuarentena Zero-Trust ────────────────────────────
  const [codigoPreIngreso, setCodigoPreIngreso] = useState('');
  const [solicitudConfirmada, setSolicitudConfirmada] = useState<SolicitudReceta | null>(null);
  const [reservaDetalle, setReservaDetalle] = useState<{
    fecha: string;
    bloque: string;
    rut: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Verificación de Rate-Limit Local (Anti-Spam) ───────────────────────────
  const verificarRateLimit = (): boolean => {
    const ultimoEnvio = localStorage.getItem('amaru_qr_last_submission');
    if (ultimoEnvio) {
      const transcurrido = (Date.now() - parseInt(ultimoEnvio, 10)) / 1000;
      if (transcurrido < RATE_LIMIT_SEGUNDOS) {
        const restantes = Math.ceil(RATE_LIMIT_SEGUNDOS - transcurrido);
        setErrorRateLimit(
          `Por seguridad anti-spam, debes esperar ${restantes} segundos antes de enviar una nueva solicitud.`
        );
        return false;
      }
    }
    setErrorRateLimit(null);
    return true;
  };

  const registrarEnvio = () => {
    localStorage.setItem('amaru_qr_last_submission', Date.now().toString());
  };

  // Validaciones del RUT (Módulo 11 sin enumeración ni autocomplete)
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRut(v);
    if (v.length >= 7) {
      setErrorRut(validarRUT(v) ? '' : 'RUT inválido (Módulo 11). Ingrese un RUT chileno válido.');
    } else {
      setErrorRut('');
    }
  };

  const handleRutBlur = () => {
    if (!rut) return;
    const f = formatearRUT(rut);
    setRut(f);
    setErrorRut(validarRUT(f) ? '' : 'RUT inválido (Módulo 11). Ingrese un RUT chileno válido.');
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTelefono(val);
    if (val.trim().length > 0 && val.replace(/[^0-9]/g, '').length < 8) {
      setErrorTelefono('Ingrese un número de teléfono válido (mínimo 8 dígitos)');
    } else {
      setErrorTelefono('');
    }
  };

  const paso1Valido =
    Boolean(rut) &&
    validarRUT(rut) &&
    nombre.trim().length >= 3 &&
    telefono.trim().length >= 8 &&
    consentimiento;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoReceta(file);
    }
  };

  const handleContinuarPaso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paso1Valido) return;

    if (!verificarRateLimit()) {
      return;
    }

    if (tipoSolicitud === 'Agendar Examen Visual') {
      setEstadoReceta('vencida');
    }
    setPaso(2);
  };

  // ── Completar Solicitud con Receta o Directo (Cuarentena Zero-Trust) ────────
  const handleCompletarPreIngresoConReceta = () => {
    if (!verificarRateLimit()) return;

    const nueva = agregarSolicitudReceta({
      rut: formatearRUT(rut),
      nombre: nombre.trim(),
      correo: `${rut.replace(/[^0-9kK]/g, '')}@solicitud.amaru.cl`,
      telefono: telefono.trim(),
      ciudad: sucursal,
      tipoUsuario: tipoSolicitud === 'Consulta Convenio' ? 'Convenio Minero' : 'Particular',
      tipoReceta: estadoReceta === 'vigente' ? 'vigente' : 'sin_receta',
      archivoNombre: archivoReceta ? archivoReceta.name : 'Receta_Digital.pdf',
      armazon: armazonSeleccionado,
      monto: tipoSolicitud === 'Consulta Convenio' ? 120000 : 85000,
      modalidadPago: tipoSolicitud,
      origen: 'QR_PUBLICO',
      tipoSolicitud,
      consentimientoLey21719: true,
    });

    registrarEnvio();
    setCodigoPreIngreso(nueva.folio);
    setSolicitudConfirmada(nueva);
    setPaso(3);
  };

  const handleReiniciar = () => {
    setRut('');
    setErrorRut('');
    setNombre('');
    setTelefono('');
    setErrorTelefono('');
    setConsentimiento(false);
    setErrorRateLimit(null);
    setEstadoReceta('vigente');
    setArchivoReceta(null);
    setCodigoPreIngreso('');
    setReservaDetalle(null);
    setSolicitudConfirmada(null);
    setPaso(1);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-[#1A1816] text-[#201E1C] dark:text-[#F5F5F4] flex flex-col justify-between py-6 px-4 transition-colors duration-200 font-sans">
      <div className="w-full max-w-lg mx-auto space-y-5">
        {/* ── Cabecera Omnicanal de Alta Gama ── */}
        <header className="flex items-center justify-between bg-white/95 dark:bg-[#2A2522]/95 border border-stone-200/90 dark:border-stone-700/80 px-4.5 py-3.5 rounded-3xl shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate('/')}
              className="p-1 rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
              title="Volver al inicio"
            >
              <img src={logoImg} alt="Óptica Amaru" className="h-9 w-auto object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-stone-900 dark:text-white">
                  Óptica Amaru
                </h1>
                <span className="bg-[#B85D19]/10 text-[#B85D19] dark:bg-[#B85D19]/20 border border-[#B85D19]/30 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  SOLICITUD Y AGENDAMIENTO RÁPIDO
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                Óptica Amaru · Tu Visión, Tu Imagen · Calama & Antofagasta
              </p>
            </div>
          </div>

          {/* Toggle de Tema Sol/Luna */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-[#1A1816] dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
        </header>

        {/* Alerta de Rate-Limit Anti-Spam */}
        {errorRateLimit && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{errorRateLimit}</span>
          </div>
        )}

        {/* ── Card Principal con Asistente ── */}
        <main className="bg-white dark:bg-[#2A2522] border border-stone-200/90 dark:border-stone-700/80 rounded-3xl p-6 sm:p-7 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all">
          {/* Indicador de Paso */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-100 dark:border-stone-700/70">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#B85D19] text-white flex items-center justify-center text-[10px]">
                {paso}
              </span>
              <span>
                {paso === 1 && 'Paso 1: Datos del Paciente'}
                {paso === 2 && 'Paso 2: Evaluación Clínica'}
                {paso === 3 && 'Paso 3: Confirmación en Cuarentena'}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((num) => (
                <span
                  key={num}
                  className={`h-2 rounded-full transition-all ${
                    paso === num
                      ? 'w-6 bg-[#B85D19]'
                      : paso > num
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-stone-300 dark:bg-stone-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ════════════ PASO 1: DATOS DEL PACIENTE / CLIENTE ════════════ */}
          {paso === 1 && (
            <form onSubmit={handleContinuarPaso1} className="space-y-4.5 animate-in fade-in duration-200" noValidate>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-[#B85D19]" />
                  Datos del Paciente / Cliente
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Completa tus datos para cotizar tus lentes o agendar tu evaluación visual en nuestras sucursales.
                </p>
              </div>

              {/* Selector de Sucursal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Sucursal de Atención <span className="text-[#B85D19]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Calama', 'Antofagasta'] as CiudadAtencion[]).map((ciudad) => (
                    <button
                      key={ciudad}
                      type="button"
                      onClick={() => setSucursal(ciudad)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        sucursal === ciudad
                          ? 'border-[#B85D19] bg-[#B85D19]/10 text-[#B85D19] ring-2 ring-[#B85D19]/25 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#1A1816] text-stone-700 dark:text-stone-300 hover:border-stone-300'
                      }`}
                    >
                      <MapPin size={14} className={sucursal === ciudad ? 'text-[#B85D19]' : 'text-stone-400'} />
                      <span>Sucursal {ciudad}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Tipo de Solicitud */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Tipo de Atención <span className="text-[#B85D19]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cotizar Receta Médica', label: 'Cotizar Receta' },
                    { id: 'Agendar Examen Visual', label: 'Agendar Examen' },
                    { id: 'Consulta Convenio', label: 'Convenio' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTipoSolicitud(item.id as TipoSolicitud)}
                      className={`p-2.5 rounded-2xl border text-[11px] font-bold text-center transition-all cursor-pointer truncate ${
                        tipoSolicitud === item.id
                          ? 'border-[#B85D19] bg-[#B85D19]/10 text-[#B85D19] ring-2 ring-[#B85D19]/20 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#1A1816] text-stone-600 dark:text-stone-400 hover:border-stone-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input RUT con Blind Write-Only (Anti-Enumeración) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
                  <span>RUT / RUN Paciente <span className="text-[#B85D19]">*</span></span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-normal">Validación Módulo 11</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="12345678-9"
                    value={rut}
                    onChange={handleRutChange}
                    onBlur={handleRutBlur}
                    maxLength={12}
                    autoComplete="off"
                    className={`w-full bg-stone-50 dark:bg-[#1A1816] border rounded-2xl px-4 py-3 text-sm font-mono text-stone-900 dark:text-white placeholder:font-sans placeholder:text-stone-400 outline-none transition-all ${
                      errorRut
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : rut && validarRUT(rut)
                        ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                        : 'border-stone-200 dark:border-stone-700 focus:border-[#B85D19] focus:ring-2 focus:ring-[#B85D19]/20'
                    }`}
                  />
                  {rut && validarRUT(rut) && (
                    <div className="absolute right-3.5 top-3.5 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>
                {errorRut ? (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{errorRut}</p>
                ) : rut && validarRUT(rut) ? (
                  <p className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> RUT válido según Módulo 11
                  </p>
                ) : null}
              </div>

              {/* Input Nombre Completo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Nombre y Apellido <span className="text-[#B85D19]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Claudia Soto Riquelme"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-stone-50 dark:bg-[#1A1816] border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:border-[#B85D19] focus:ring-2 focus:ring-[#B85D19]/20 transition-all font-medium"
                />
              </div>

              {/* Input Teléfono WhatsApp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Teléfono WhatsApp de Contacto <span className="text-[#B85D19]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone size={15} />
                  </div>
                  <input
                    type="tel"
                    placeholder="+56 9 8586 0973"
                    value={telefono}
                    onChange={handleTelefonoChange}
                    autoComplete="off"
                    className="w-full bg-stone-50 dark:bg-[#1A1816] border border-stone-200 dark:border-stone-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:border-[#B85D19] focus:ring-2 focus:ring-[#B85D19]/20 transition-all font-mono"
                  />
                </div>
                {errorTelefono && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{errorTelefono}</p>
                )}
              </div>

              {/* Checkbox Obligatorio Ley N° 21.719 (Consentimiento Activo Desmarcado) */}
              <div className="bg-stone-50 dark:bg-[#1A1816] border border-stone-200 dark:border-stone-700 p-3.5 rounded-2xl space-y-1">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-stone-300 dark:border-stone-600 bg-white dark:bg-[#2A2522] accent-[#B85D19] cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-stone-600 dark:text-stone-300 leading-tight">
                    Acepto el tratamiento de mis datos personales y de salud visual para la gestión de mi solicitud en Óptica Amaru, conforme a la{' '}
                    <strong className="text-stone-900 dark:text-white">Ley N° 21.719</strong> de Protección de Datos Personales.
                  </span>
                </label>
              </div>

              {/* Botón Continuar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!paso1Valido}
                  className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso1Valido
                      ? 'bg-[#B85D19] hover:bg-[#8F3B09] active:scale-[0.99] text-white shadow-[#B85D19]/20 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 border border-stone-300 dark:border-stone-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continuar a Evaluación</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ════════════ PASO 2: VALIDACIÓN CLÍNICA Y EMBUDO ════════════ */}
          {paso === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#B85D19]" />
                  Evaluación Clínica y Receta
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Indícanos si posees receta médica vigente o si necesitas agendar en Sucursal {sucursal}.
                </p>
              </div>

              {/* Tarjetas de Selección de Estado de Receta */}
              <div className="grid grid-cols-1 gap-3">
                <div
                  onClick={() => setEstadoReceta('vigente')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    estadoReceta === 'vigente'
                      ? 'border-[#B85D19] ring-2 ring-[#B85D19]/20 bg-[#B85D19]/5 dark:bg-[#B85D19]/15'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-[#2A2522] hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="estadoReceta"
                    checked={estadoReceta === 'vigente'}
                    onChange={() => setEstadoReceta('vigente')}
                    className="mt-1 text-[#B85D19] accent-[#B85D19] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      Tengo Receta Vigente (&lt; 12 meses)
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Dispongo de receta médica emitida recientemente para adjuntar.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setEstadoReceta('vencida')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    estadoReceta === 'vencida'
                      ? 'border-[#B85D19] ring-2 ring-[#B85D19]/20 bg-[#B85D19]/5 dark:bg-[#B85D19]/15'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-[#2A2522] hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="estadoReceta"
                    checked={estadoReceta === 'vencida'}
                    onChange={() => setEstadoReceta('vencida')}
                    className="mt-1 text-[#B85D19] accent-[#B85D19] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white">
                      Sin Receta / Vencida (Agendar Evaluación)
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Deseo agendar un examen visual con el tecnólogo médico en Sucursal {sucursal}.
                    </p>
                  </div>
                </div>
              </div>

              {/* BIFURCACIÓN A: Receta Vigente */}
              {estadoReceta === 'vigente' && (
                <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-700 animate-in fade-in duration-200">
                  {/* Adjuntar Archivo */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Adjuntar Fotografía o PDF de Receta
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,.pdf"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-dashed border-2 border-stone-300 dark:border-stone-600 hover:border-[#B85D19] rounded-2xl p-5 text-center cursor-pointer transition-all bg-stone-50/50 dark:bg-[#1A1816] flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-3 bg-[#B85D19]/10 text-[#B85D19] rounded-2xl">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900 dark:text-white">
                          {archivoReceta ? archivoReceta.name : 'Tocar para adjuntar foto o PDF de receta'}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {archivoReceta
                            ? `${(archivoReceta.size / 1024).toFixed(0)} KB listos para validación`
                            : 'Formatos aceptados: JPG, PNG o PDF'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Armazón de Interés */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Línea de Armazón de Interés
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { sku: 'Titanio Pro ANSI Z87.1', desc: 'Boutique & Minero' },
                        { sku: 'Lumière Progresivo Acetato', desc: 'Boutique Alta Gama' },
                        { sku: 'Ultralight Flex TR90', desc: 'Liviano y Flexible' },
                      ].map((item) => (
                        <div
                          key={item.sku}
                          onClick={() => setArmazonSeleccionado(item.sku)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all text-center ${
                            armazonSeleccionado === item.sku
                              ? 'border-[#B85D19] bg-[#B85D19]/10 ring-2 ring-[#B85D19]/20 font-bold text-[#B85D19]'
                              : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#1A1816] text-stone-700 dark:text-stone-300 hover:border-stone-300'
                          }`}
                        >
                          <span className="font-extrabold block text-xs">{item.sku}</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones de Navegación */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold py-3.5 px-5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCompletarPreIngresoConReceta}
                      className="flex-1 bg-[#B85D19] hover:bg-[#8F3B09] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Enviar Solicitud a Revisión</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* BIFURCACIÓN B: Sin Receta / Vencida (Widget de Agenda) */}
              {estadoReceta === 'vencida' && (
                <div className="pt-2 animate-in fade-in duration-200 space-y-4">
                  <ReservaHoraWidget
                    rutPaciente={rut}
                    nombrePaciente={nombre}
                    onVolverInicio={() => setPaso(1)}
                    onReservaExitosa={(detalle) => {
                      if (!verificarRateLimit()) return;
                      setReservaDetalle(detalle);

                      const nueva = agregarSolicitudReceta({
                        rut: formatearRUT(rut),
                        nombre: nombre.trim(),
                        correo: `${rut.replace(/[^0-9kK]/g, '')}@solicitud.amaru.cl`,
                        telefono: telefono.trim(),
                        ciudad: sucursal,
                        tipoUsuario: tipoSolicitud === 'Consulta Convenio' ? 'Convenio Minero' : 'Particular',
                        tipoReceta: 'sin_receta',
                        archivoNombre: 'Evaluacion_Visual_Agendada.pdf',
                        armazon: armazonSeleccionado,
                        monto: 0,
                        modalidadPago: `Evaluación Visual (${detalle.fecha} - ${detalle.bloque})`,
                        origen: 'QR_PUBLICO',
                        tipoSolicitud: 'Agendar Examen Visual',
                        consentimientoLey21719: true,
                      });

                      registrarEnvio();
                      setCodigoPreIngreso(nueva.folio);
                      setSolicitudConfirmada(nueva);
                      setPaso(3);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold py-3 rounded-2xl text-xs w-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a Datos de Contacto</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════ PASO 3: CONFIRMACIÓN Y CUARENTENA ZERO-TRUST ════════════ */}
          {paso === 3 && (
            <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 size={44} />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#B85D19] bg-[#B85D19]/10 px-3 py-1 rounded-full border border-[#B85D19]/20 inline-block mb-2">
                  CUARENTENA ZERO-TRUST ACTIVA
                </span>
                <h2 className="text-xl font-black text-stone-900 dark:text-white">
                  ¡Solicitud Recibida en Bandeja de Revisión!
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Tu solicitud ha sido ingresada en estado <strong>EN REVISIÓN</strong> para <strong>Sucursal {sucursal}</strong>.
                  La Vendedora (<strong>Juanita Araya</strong>) y el equipo de mesón validarán tus antecedentes antes de confirmar la orden.
                </p>
              </div>

              {/* Tarjeta de Resumen con Folio */}
              <div className="bg-stone-50 dark:bg-[#1A1816] border border-stone-200 dark:border-stone-700 rounded-3xl p-5 text-left space-y-3 shadow-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold">
                    Folio de Cuarentena:
                  </span>
                  <span className="font-mono text-base font-black text-[#B85D19]">
                    {solicitudConfirmada?.folio || codigoPreIngreso || 'FOLIO-QR-001'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 text-[11px] block">Paciente:</span>
                    <p className="font-bold text-stone-900 dark:text-white truncate">{nombre}</p>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 text-[11px] block">RUT Acreditado:</span>
                    <p className="font-mono font-bold text-stone-900 dark:text-white">{formatearRUT(rut)}</p>
                  </div>

                  <div>
                    <span className="text-stone-400 dark:text-stone-500 text-[11px] block">Sucursal Destino:</span>
                    <p className="font-bold text-stone-800 dark:text-stone-200">Sucursal {sucursal}</p>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 text-[11px] block">WhatsApp:</span>
                    <p className="font-mono font-bold text-stone-800 dark:text-stone-200">{telefono}</p>
                  </div>

                  {reservaDetalle && (
                    <div className="col-span-2 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                      <span className="text-[11px] text-stone-500 block">Evaluación Agendada:</span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {reservaDetalle.fecha} · Bloque {reservaDetalle.bloque}
                      </p>
                    </div>
                  )}

                  <div className="col-span-2 pt-1 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">Estado de Admisión:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                      EN REVISIÓN (QR PÚBLICO)
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Cierre */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <LogIn size={15} />
                  <span>Ir al Inicio de Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={handleReiniciar}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 dark:bg-[#1A1816] dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <RotateCcw size={15} />
                  <span>Nueva Solicitud</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── Footer Informativo ── */}
        <footer className="text-center text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
          <p>© 2026 Óptica Amaru — Plataforma de Salud Visual & Boutique Óptica</p>
          <p className="font-mono text-[10px]">Protección de Datos Ley N° 21.719 & Ciberseguridad Ley N° 21.663</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicQRView;
