import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  CheckCircle2,
  Phone,
  FileUp,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Building2,
  User,
  CreditCard,
  Receipt,
  MapPin,
  Check,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { TitanioProIcon, AcetatoLumiereIcon, UltralightFlexIcon } from './icons/ArmazonesSVGs';
import {
  agregarSolicitudReceta,
  type CiudadAtencion,
  type TipoUsuario,
  type SolicitudReceta,
} from '../services/recetasService';

export type ModeloInteresEnum = 'Titanium Shield Pro' | 'Acetato Vintage Lumière' | 'Ultralight Flex-Steel';

interface AutoRecetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutPaciente?: string;
  onRecetaEnviada?: (datos: SolicitudReceta) => void;
}

const EMPRESAS_CONVENIO_DEFAULT = [
  'Minera Centinela · Faena Esperanza',
  'Minera Escondida · Sindicato N° 1',
  'Codelco Chuquicamata · Sindicato N° 2',
  'Minera Zaldívar · Faena Cordillera',
  'Minera Collahuasi · Faena Patache',
  'Albemarle Planta Salar · Faena Atacama',
];

export const AutoRecetaModal: React.FC<AutoRecetaModalProps> = ({
  isOpen,
  onClose,
  rutPaciente = '',
  onRecetaEnviada,
}) => {
  // ── Stepper: 1. Filiación ➔ 2. Clínica & Embudo ➔ 3. Cotización & Pago ─────
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);

  // ── PASO 1: Filiación y Contexto Laboral ───────────────────────────────────
  const [rutFijo] = useState<string>(() => rutPaciente || localStorage.getItem('amaru_username') || '18.234.567-8');
  const [correoFijo] = useState<string>(() => localStorage.getItem('amaru_email') || 'm.jorge@minera-norte.cl');
  const [nombreCompleto, setNombreCompleto] = useState<string>(() => localStorage.getItem('amaru_nombre_paciente') || 'Miguel Jorge Valenzuela');
  const [telefono, setTelefono] = useState<string>(() => localStorage.getItem('amaru_telefono') || '+56 9 8586 0973');
  const [ciudad, setCiudad] = useState<CiudadAtencion>(() => (localStorage.getItem('amaru_ciudad') as CiudadAtencion) || 'Calama');
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('Convenio Minero');
  const [empresaFaena, setEmpresaFaena] = useState<string>(EMPRESAS_CONVENIO_DEFAULT[0]);
  // Consentimiento legal estricto: NUNCA pre-marcado (inicia en false)
  const [autorizacionLey, setAutorizacionLey] = useState<boolean>(false);
  const [mostrarDerechos, setMostrarDerechos] = useState<boolean>(false);

  // ── PASO 2: Clínica & Embudo ───────────────────────────────────────────────
  const [tipoReceta, setTipoReceta] = useState<'vigente' | 'sin_receta'>('vigente');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoNombreSimulado, setArchivoNombreSimulado] = useState<string>('Receta_Medica_Vigente_2026.pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deseaDigitar, setDeseaDigitar] = useState<boolean>(true);
  const [odEsfera, setOdEsfera] = useState<string>('-1.50');
  const [odCilindro, setOdCilindro] = useState<string>('-0.50');
  const [odEje, setOdEje] = useState<string>('90°');
  const [oiEsfera, setOiEsfera] = useState<string>('-1.25');
  const [oiCilindro, setOiCilindro] = useState<string>('-0.75');
  const [oiEje, setOiEje] = useState<string>('85°');

  // ── PASO 3: Cotización & Pago ──────────────────────────────────────────────
  const [armazonSeleccionado, setArmazonSeleccionado] = useState<ModeloInteresEnum>('Titanium Shield Pro');

  // Estados de proceso
  const [enviando, setEnviando] = useState<boolean>(false);
  const [enviadoExito, setEnviadoExito] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string>('');

  if (!isOpen) return null;

  const getPrecioArmazon = (modelo: ModeloInteresEnum): number => {
    switch (modelo) {
      case 'Titanium Shield Pro':
        return 85000;
      case 'Acetato Vintage Lumière':
        return 72000;
      case 'Ultralight Flex-Steel':
        return 64000;
      default:
        return 85000;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 15 * 1024 * 1024) {
        setErrorValidacion('El archivo excede el límite máximo de 15 MB.');
        return;
      }
      setErrorValidacion('');
      setArchivo(f);
      setArchivoNombreSimulado(f.name);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.size > 15 * 1024 * 1024) {
        setErrorValidacion('El archivo excede el límite máximo de 15 MB.');
        return;
      }
      setErrorValidacion('');
      setArchivo(f);
      setArchivoNombreSimulado(f.name);
    }
  };

  const avanzarPaso1a2 = () => {
    if (!nombreCompleto.trim()) {
      setErrorValidacion('Por favor ingresa tu Nombre y Apellido completo.');
      return;
    }
    if (!autorizacionLey) {
      setErrorValidacion('Debes autorizar el tratamiento clínico conforme a la Ley N° 21.719 y Ley N° 21.663.');
      return;
    }
    setErrorValidacion('');
    // Sincronizar nombre y ciudad en localStorage
    localStorage.setItem('amaru_nombre_paciente', nombreCompleto.trim());
    localStorage.setItem('amaru_ciudad', ciudad);
    localStorage.setItem('amaru_telefono', telefono);
    window.dispatchEvent(new Event('amaru_perfil_updated'));
    setPasoActual(2);
  };

  const avanzarPaso2a3 = () => {
    setErrorValidacion('');
    setPasoActual(3);
  };

  const handleFinalizarSolicitud = () => {
    setEnviando(true);
    setErrorValidacion('');

    try {
      const montoTotal = getPrecioArmazon(armazonSeleccionado);
      const modalidadPago =
        tipoUsuario === 'Convenio Minero'
          ? 'Descuento por Planilla en Convenio (3 cuotas sin interés)'
          : 'Pago Particular Webpay Plus / Transferencia';

      const nuevaSolicitud = agregarSolicitudReceta({
        rut: rutFijo,
        nombre: nombreCompleto.trim(),
        correo: correoFijo,
        telefono,
        ciudad,
        tipoUsuario,
        empresa: tipoUsuario === 'Convenio Minero' ? empresaFaena : undefined,
        tipoReceta,
        archivoNombre: archivo?.name || archivoNombreSimulado,
        dioptriasManuales: deseaDigitar,
        odEsfera: deseaDigitar ? odEsfera : undefined,
        odCilindro: deseaDigitar ? odCilindro : undefined,
        odEje: deseaDigitar ? odEje : undefined,
        oiEsfera: deseaDigitar ? oiEsfera : undefined,
        oiCilindro: deseaDigitar ? oiCilindro : undefined,
        oiEje: deseaDigitar ? oiEje : undefined,
        armazon: armazonSeleccionado,
        monto: montoTotal,
        modalidadPago,
      });

      // Actualizar perfil local
      localStorage.setItem('amaru_nombre_paciente', nombreCompleto.trim());
      localStorage.setItem('amaru_ciudad', ciudad);
      localStorage.setItem('amaru_telefono', telefono);
      window.dispatchEvent(new Event('amaru_perfil_updated'));

      setEnviadoExito(true);
      if (onRecetaEnviada) {
        onRecetaEnviada(nuevaSolicitud);
      }

      setTimeout(() => {
        setEnviando(false);
        setEnviadoExito(false);
        setPasoActual(1);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorValidacion(err.message || 'Error al enviar la solicitud óptica');
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#181614] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Franja de Acento Cobrizo Metalizado */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230]" />

        {/* ── Cabecera y Stepper Superior ── */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
          <div className="flex items-center justify-between pb-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={11} className="text-amaru-copper" />
                <span>Flujo de Captura Oficial · Auto-Servicio Óptico</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mt-1">
                Ingreso y Cotización de Receta Médica
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={enviando}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Superior: 1. Filiación ➔ 2. Clínica & Embudo ➔ 3. Cotización & Pago */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* Paso 1 */}
            <div
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all ${
                pasoActual === 1
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
                  : pasoActual > 1
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'bg-slate-100/50 dark:bg-zinc-800/40 border-slate-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                  pasoActual === 1
                    ? 'bg-amber-600 text-white font-bold'
                    : pasoActual > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {pasoActual > 1 ? <Check size={12} /> : '1'}
              </span>
              <span className="truncate hidden sm:inline">1. Filiación</span>
            </div>

            {/* Paso 2 */}
            <div
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all ${
                pasoActual === 2
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
                  : pasoActual > 2
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'bg-slate-100/50 dark:bg-zinc-800/40 border-slate-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                  pasoActual === 2
                    ? 'bg-amber-600 text-white font-bold'
                    : pasoActual > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {pasoActual > 2 ? <Check size={12} /> : '2'}
              </span>
              <span className="truncate hidden sm:inline">2. Clínica & Embudo</span>
            </div>

            {/* Paso 3 */}
            <div
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all ${
                pasoActual === 3
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
                  : 'bg-slate-100/50 dark:bg-zinc-800/40 border-slate-200 dark:border-white/5 text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                  pasoActual === 3
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-300 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}
              >
                3
              </span>
              <span className="truncate hidden sm:inline">3. Cotización & Pago</span>
            </div>
          </div>
        </div>

        {/* ── Cuerpo del Wizard ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠</span>
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 1: FILIACIÓN Y CONTEXTO LABORAL
             ══════════════════════════════════════════════════════════════════ */}
          {pasoActual === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* RUT PACIENTE - Bloqueado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      RUT Paciente
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <Lock size={10} />
                      <span>Dato inalterable de seguridad</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={rutFijo}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl font-mono text-slate-600 dark:text-zinc-400 cursor-not-allowed select-none font-bold"
                  />
                </div>

                {/* CORREO ELECTRÓNICO - Bloqueado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Correo Electrónico
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <Lock size={10} />
                      <span>Dato inalterable de seguridad</span>
                    </span>
                  </div>
                  <input
                    type="email"
                    value={correoFijo}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-zinc-400 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* NOMBRE Y APELLIDO COMPLETO * (Editable) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                  Nombre y Apellido Completo *
                </label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Miguel Jorge Valenzuela"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-amaru-copper focus:outline-hidden"
                />
              </div>

              {/* TELÉFONO / WHATSAPP & CIUDAD EXCLUSIVA (Calama vs Antofagasta) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                    Teléfono Móvil / WhatsApp *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={13} />
                    </span>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+56 9 8586 0973"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl font-mono text-slate-800 dark:text-zinc-200 focus:ring-2 focus:ring-amaru-copper focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* CIUDAD / SUCURSAL * (SOLO Calama y Antofagasta) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                    Ciudad de Atención / Sucursal *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCiudad('Calama')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        ciudad === 'Calama'
                          ? 'bg-amaru-copper/15 border-amaru-copper text-amaru-copper shadow-xs'
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <MapPin size={13} />
                      <span>Calama</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCiudad('Antofagasta')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        ciudad === 'Antofagasta'
                          ? 'bg-amaru-copper/15 border-amaru-copper text-amaru-copper shadow-xs'
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <MapPin size={13} />
                      <span>Antofagasta</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TIPO DE USUARIO *: Convenio Minero vs Particular */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Tipo de Atención *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTipoUsuario('Convenio Minero')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      tipoUsuario === 'Convenio Minero'
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 size={15} className="text-amaru-copper" />
                        Convenio Minero
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold uppercase">
                        Planilla
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      Descuento por planilla en 3 cuotas sin interés y subsidio según contrato colectivo.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipoUsuario('Particular')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      tipoUsuario === 'Particular'
                        ? 'bg-sky-500/10 border-sky-500/50 shadow-xs'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User size={15} className="text-sky-500" />
                        Cliente Particular
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold uppercase">
                        Boutique
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      Atención clínica boutique, boleta médica electrónica y Webpay Plus.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector EMPRESA / SINDICATO EN FAENA si es Convenio */}
              {tipoUsuario === 'Convenio Minero' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                    Empresa / Sindicato en Faena *
                  </label>
                  <select
                    value={empresaFaena}
                    onChange={(e) => setEmpresaFaena(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                  >
                    {EMPRESAS_CONVENIO_DEFAULT.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Marco Legal, Derechos ARCO y Consentimiento Obligatorio Ley 21.719 / Ley 21.663 */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Consentimiento Legal y Protección de Datos
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarDerechos(!mostrarDerechos)}
                    className="text-xs font-semibold text-amaru-copper hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={13} className="text-amaru-copper" />
                    <span>{mostrarDerechos ? 'Ocultar mis derechos' : 'Leer mis derechos (Ley 21.719 y Ley 21.663)'}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${mostrarDerechos ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* Acordeón Desplegable con 3 Viñetas Normativas */}
                {mostrarDerechos && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-start gap-2.5 text-slate-700 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-emerald-700 dark:text-emerald-400">1. Privacidad Clínica (Ley 21.719):</strong> Uso confidencial y exclusivo de tu receta médica y parámetros refractivos únicamente para la fabricación técnica de tus lentes.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5 text-slate-700 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-blue-700 dark:text-blue-400">2. Ciberseguridad (Ley 21.663):</strong> Resguardo bajo estándares de infraestructura crítica de la información, con firma digital e inalterabilidad criptográfica de registros.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5 text-slate-700 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-amber-700 dark:text-amber-400">3. Derechos ARCO:</strong> Facultad permanente de ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición sobre tus archivos clínicos en cualquier momento.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkbox Obligatorio - Estrictamente NO pre-marcado */}
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                    autorizacionLey
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:border-amaru-copper/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={autorizacionLey}
                    onChange={(e) => {
                      setAutorizacionLey(e.target.checked);
                      if (e.target.checked) setErrorValidacion('');
                    }}
                    className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-amaru-copper focus:ring-amaru-copper cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed select-none">
                    <strong>Consentimiento Informado:</strong> He leído mis derechos y autorizo expresamente a Óptica Amaru al tratamiento confidencial de mis datos clínicos y recetas oftálmicas conforme a la <strong>Ley N° 21.719</strong> y <strong>Ley N° 21.663</strong>.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 2: CLÍNICA & EMBUDO
             ══════════════════════════════════════════════════════════════════ */}
          {pasoActual === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Selector de Condición: Vigente vs Sin Receta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setTipoReceta('vigente')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    tipoReceta === 'vigente'
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Receta Vigente
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                      &lt; 365 días
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Poseo orden oftalmológica emitida por oftalmólogo o tecnólogo médico.
                  </p>
                </div>

                <div
                  onClick={() => setTipoReceta('sin_receta')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    tipoReceta === 'sin_receta'
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar size={16} className="text-amber-500" />
                      Sin Receta / Vencida
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold uppercase">
                      Requiere Examen
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Coordinaremos un operativo clínico en faena o agendaremos evaluación en sucursal {ciudad}.
                  </p>
                </div>
              </div>

              {/* Zona Drag & Drop de Archivo */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-amaru-copper dark:hover:border-amaru-copper rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-black/20"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amaru-copper/10 text-amaru-copper flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {archivo ? archivo.name : 'Arrastra tu receta médica o haz clic para subir'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Formatos aceptados: JPG, PNG, PDF (Máx. 15 MB)
                </p>
              </div>

              {/* Grilla Opcional de Dioptrías (OD / OI) */}
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 bg-slate-50/50 dark:bg-black/20">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Parámetros de Refracción (Opcional)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] font-semibold text-amaru-copper">Digitar dioptrías</span>
                    <input
                      type="checkbox"
                      checked={deseaDigitar}
                      onChange={(e) => setDeseaDigitar(e.target.checked)}
                      className="rounded-sm border-slate-300 text-amaru-copper focus:ring-amaru-copper"
                    />
                  </label>
                </div>

                {deseaDigitar && (
                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ojo Derecho */}
                    <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amaru-copper block">
                        Ojo Derecho (OD)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Esfera</label>
                          <input
                            type="text"
                            value={odEsfera}
                            onChange={(e) => setOdEsfera(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Cilindro</label>
                          <input
                            type="text"
                            value={odCilindro}
                            onChange={(e) => setOdCilindro(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Eje</label>
                          <input
                            type="text"
                            value={odEje}
                            onChange={(e) => setOdEje(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ojo Izquierdo */}
                    <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amaru-copper block">
                        Ojo Izquierdo (OI)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Esfera</label>
                          <input
                            type="text"
                            value={oiEsfera}
                            onChange={(e) => setOiEsfera(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Cilindro</label>
                          <input
                            type="text"
                            value={oiCilindro}
                            onChange={(e) => setOiCilindro(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Eje</label>
                          <input
                            type="text"
                            value={oiEje}
                            onChange={(e) => setOiEje(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-center text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 3: COTIZACIÓN & PAGO
             ══════════════════════════════════════════════════════════════════ */}
          {pasoActual === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                Selecciona tu Armazón de Interés *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Titanium Shield Pro */}
                <div
                  onClick={() => setArmazonSeleccionado('Titanium Shield Pro')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    armazonSeleccionado === 'Titanium Shield Pro'
                      ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      DS 594 · FAENA
                    </span>
                    <div className="h-16 flex items-center justify-center my-2 text-amber-600 dark:text-amber-400">
                      <TitanioProIcon className="w-full h-full" />
                    </div>
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Titanium Shield Pro
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Sello hermético industrial & titanio aeroespacial.
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white">
                    $85.000 CLP
                  </div>
                </div>

                {/* 2. Acetato Vintage Lumière */}
                <div
                  onClick={() => setArmazonSeleccionado('Acetato Vintage Lumière')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    armazonSeleccionado === 'Acetato Vintage Lumière'
                      ? 'bg-sky-500/10 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-300">
                      BLUE-BLOCK
                    </span>
                    <div className="h-16 flex items-center justify-center my-2 text-sky-600 dark:text-sky-400">
                      <AcetatoLumiereIcon className="w-full h-full" />
                    </div>
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Acetato Vintage Lumière
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Boutique urbana con descanso visual digital.
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white">
                    $72.000 CLP
                  </div>
                </div>

                {/* 3. Ultralight Flex-Steel */}
                <div
                  onClick={() => setArmazonSeleccionado('Ultralight Flex-Steel')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    armazonSeleccionado === 'Ultralight Flex-Steel'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                      ULTRALIGHT 12g
                    </span>
                    <div className="h-16 flex items-center justify-center my-2 text-emerald-600 dark:text-emerald-400">
                      <UltralightFlexIcon className="w-full h-full" />
                    </div>
                    <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Ultralight Flex-Steel
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Acero quirúrgico flexible con memoria mecánica.
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white">
                    $64.000 CLP
                  </div>
                </div>
              </div>

              {/* Resumen de Modalidad de Pago y Filiación */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {tipoUsuario === 'Convenio Minero' ? (
                      <Receipt size={15} className="text-amaru-copper" />
                    ) : (
                      <CreditCard size={15} className="text-sky-500" />
                    )}
                    Modalidad de Pago Asignada
                  </span>
                  <span className="font-mono font-black text-sm text-amaru-copper">
                    ${getPrecioArmazon(armazonSeleccionado).toLocaleString('es-CL')} CLP
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-1">
                  {tipoUsuario === 'Convenio Minero' ? (
                    <p>
                      <strong>Descuento por Planilla en Convenio:</strong> 3 cuotas mensuales sin interés deducibles de tu liquidación de sueldo en <strong>{empresaFaena}</strong>. Cero desembolso hoy.
                    </p>
                  ) : (
                    <p>
                      <strong>Atención Particular / Webpay Plus:</strong> Pago en cuotas sin interés mediante tarjeta de débito/crédito en sucursal {ciudad} o vía link de pago Webpay.
                    </p>
                  )}
                  <p className="text-slate-400 dark:text-zinc-500 pt-1">
                    Titular: <strong>{nombreCompleto}</strong> (RUT: {rutFijo}) · Sucursal de Despacho: <strong>{ciudad}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Pie de Botones de Navegación ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-black/30 flex items-center justify-between gap-3">
          <div>
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={() => setPasoActual((p) => (p - 1) as 1 | 2)}
                disabled={enviando}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Volver</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {pasoActual === 1 && (
              <button
                type="button"
                onClick={avanzarPaso1a2}
                disabled={!autorizacionLey}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                  autorizacionLey
                    ? 'btn-copper cursor-pointer shadow-sm hover:scale-105 active:scale-95'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed opacity-60 shadow-none'
                }`}
                title={!autorizacionLey ? 'Debes autorizar el consentimiento legal para continuar' : undefined}
              >
                <span>Continuar a Validación Clínica (Paso 2)</span>
                <ArrowRight size={14} />
              </button>
            )}

            {pasoActual === 2 && (
              <button
                type="button"
                onClick={avanzarPaso2a3}
                className="btn-copper px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <span>Continuar a Cotización & Pago (Paso 3)</span>
                <ArrowRight size={14} />
              </button>
            )}

            {pasoActual === 3 && (
              <button
                type="button"
                onClick={handleFinalizarSolicitud}
                disabled={enviando || enviadoExito}
                className="btn-copper px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {enviando ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Procesando Pre-Ingreso...</span>
                  </>
                ) : enviadoExito ? (
                  <>
                    <CheckCircle2 size={16} className="text-white" />
                    <span>¡Solicitud Enviada con Éxito!</span>
                  </>
                ) : (
                  <>
                    <FileUp size={16} />
                    <span>ENVIAR SOLICITUD A VALIDACIÓN ÓPTICA</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
