import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Glasses,
  CheckCircle2,
  UploadCloud,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';
import { ReservaHoraWidget } from '../components/ReservaHoraWidget';
import { useTheme } from '../hooks/useTheme';

export const PublicQRView: React.FC = () => {
  const { toggleTheme, isDark } = useTheme();

  // ── Estados de Navegación por Pasos ─────────────────────────────────────────
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // ── Paso 1: Filiación y Consentimiento Legal ─────────────────────────────────
  const [rut, setRut] = useState('');
  const [errorRut, setErrorRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);

  // ── Paso 2: Validación Clínica y Embudo ─────────────────────────────────────
  const [estadoReceta, setEstadoReceta] = useState<'vigente' | 'vencida'>('vigente');
  const [archivoReceta, setArchivoReceta] = useState<File | null>(null);
  const [armazonSeleccionado, setArmazonSeleccionado] = useState('EPP-MIN-001');

  // ── Paso 3: Confirmación y Folio Pre-Ingreso ─────────────────────────────────
  const [codigoPreIngreso, setCodigoPreIngreso] = useState('');
  const [reservaDetalle, setReservaDetalle] = useState<{
    fecha: string;
    bloque: string;
    rut: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validaciones del RUT
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRut(v);
    if (v.length > 3) {
      setErrorRut(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    } else {
      setErrorRut('');
    }
  };

  const handleRutBlur = () => {
    if (!rut) return;
    const f = formatearRUT(rut);
    setRut(f);
    setErrorRut(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
  };

  const paso1Valido = !!rut && validarRUT(rut) && nombre.trim().length >= 3 && consentimiento;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoReceta(file);
    }
  };

  const handleContinuarPaso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paso1Valido) return;
    setPaso(2);
  };

  // Completar Pre-Ingreso cuando tiene receta vigente
  const handleCompletarPreIngresoConReceta = () => {
    const randomCode = `PRE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setCodigoPreIngreso(randomCode);
    setPaso(3);
  };

  const handleReiniciar = () => {
    setRut('');
    setErrorRut('');
    setNombre('');
    setConsentimiento(false);
    setEstadoReceta('vigente');
    setArchivoReceta(null);
    setCodigoPreIngreso('');
    setReservaDetalle(null);
    setPaso(1);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#1E1C1A] text-[#201E1C] dark:text-[#F5F5F4] flex flex-col justify-between py-6 px-4 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-5">
        {/* ── Cabecera Corporativa Móvil ── */}
        <header className="flex items-center justify-between bg-white dark:bg-[#2A2522] border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Óptica Amaru" className="h-8 w-auto object-contain rounded-lg shadow-xs" />
              <div className="p-1.5 bg-[#B34B0C]/10 text-[#B34B0C] rounded-xl">
                <Glasses size={18} className="text-[#B34B0C]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Óptica Amaru
                </h1>
                <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold px-2 py-0.5 rounded-md">
                  AUTO-ATENCIÓN FAENA
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Portal de Admisión Digital — Faena Minera
              </p>
            </div>
          </div>

          {/* Toggle de Tema Sol/Luna */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1816] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>
        </header>

        {/* ── Card Principal con Asistente ── */}
        <main className="bg-white dark:bg-[#2A2522] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl transition-all">
          {/* Indicador de Paso */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {paso === 1 && 'Paso 1: Identificación'}
              {paso === 2 && 'Paso 2: Evaluación Clínica'}
              {paso === 3 && 'Paso 3: Confirmación'}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((num) => (
                <span
                  key={num}
                  className={`h-2 rounded-full transition-all ${
                    paso === num
                      ? 'w-6 bg-[#B34B0C]'
                      : paso > num
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ════════════ PASO 1: FILIACIÓN Y CONSENTIMIENTO ════════════ */}
          {paso === 1 && (
            <form onSubmit={handleContinuarPaso1} className="space-y-4 animate-in fade-in duration-200" noValidate>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-[#B34B0C]" />
                  Identificación del Trabajador
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Ingrese sus datos para validar la cobertura de EPP óptico en faena
                </p>
              </div>

              {/* Input RUT */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  RUT / RUN Trabajador <span className="text-[#B34B0C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="12345678-9"
                  value={rut}
                  onChange={handleRutChange}
                  onBlur={handleRutBlur}
                  maxLength={12}
                  className={`w-full bg-slate-50 dark:bg-[#1A1816] border rounded-xl px-3.5 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all ${
                    errorRut
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                      : rut && validarRUT(rut)
                      ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-[#B34B0C]'
                  }`}
                />
                {errorRut ? (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errorRut}</p>
                ) : rut && validarRUT(rut) ? (
                  <p className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> RUT válido
                  </p>
                ) : null}
              </div>

              {/* Input Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Completo del Trabajador <span className="text-[#B34B0C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez González"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1A1816] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[#B34B0C] transition-all"
                />
              </div>

              {/* Checkbox Obligatorio Ley N° 21.719 (Protección de Datos Médicos y Biométricos) */}
              <div className="bg-slate-50 dark:bg-[#1A1816] border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl space-y-1">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2A2522] accent-[#B34B0C] cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-tight">
                    Acepto el tratamiento de mis datos médicos y biométricos para la confección del EPP óptico, según la{' '}
                    <strong className="text-slate-900 dark:text-white">Ley N° 21.719</strong>.
                  </span>
                </label>
              </div>

              {/* Botón Continuar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!paso1Valido}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso1Valido
                      ? 'bg-[#B34B0C] hover:bg-[#8F3B09] text-white shadow-orange-950/20 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 dark:bg-[#1A1816] dark:text-zinc-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ════════════ PASO 2: VALIDACIÓN CLÍNICA Y EMBUDO ════════════ */}
          {paso === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#B34B0C]" />
                  Estado de su Receta Médica
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Cumplimiento de norma técnica minera D.S. 594 (&lt; 365 días)
                </p>
              </div>

              {/* Tarjetas Interactivas de Selección */}
              <div className="grid grid-cols-1 gap-3">
                <div
                  onClick={() => setEstadoReceta('vigente')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    estadoReceta === 'vigente'
                      ? 'border-[#B34B0C] ring-1 ring-[#B34B0C] bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2A2522]'
                  }`}
                >
                  <input
                    type="radio"
                    name="estadoReceta"
                    checked={estadoReceta === 'vigente'}
                    onChange={() => setEstadoReceta('vigente')}
                    className="mt-1 text-[#B34B0C] accent-[#B34B0C] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Receta Vigente (&lt; 365 días)
                    </p>
                    <p className={`text-xs mt-0.5 ${estadoReceta === 'vigente' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      Dispongo de receta médica emitida dentro de los últimos 12 meses
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setEstadoReceta('vencida')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    estadoReceta === 'vencida'
                      ? 'border-[#B34B0C] ring-1 ring-[#B34B0C] bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2A2522]'
                  }`}
                >
                  <input
                    type="radio"
                    name="estadoReceta"
                    checked={estadoReceta === 'vencida'}
                    onChange={() => setEstadoReceta('vencida')}
                    className="mt-1 text-[#B34B0C] accent-[#B34B0C] cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Sin Receta / Vencida (Requiere agendar)
                    </p>
                    <p className={`text-xs mt-0.5 ${estadoReceta === 'vencida' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      No poseo receta o tiene más de 1 año. Requiere evaluación médica en faena
                    </p>
                  </div>
                </div>
              </div>

              {/* ── BIFURCACIÓN A: Receta Vigente ── */}
              {estadoReceta === 'vigente' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700 animate-in fade-in duration-200">
                  {/* Carga de Receta Médica */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="border-dashed border-2 border-slate-300 dark:border-slate-600 hover:border-[#B34B0C] rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#1A1816] flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-2.5 bg-[#B34B0C]/10 text-[#B34B0C] rounded-xl">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {archivoReceta ? archivoReceta.name : 'Tocar para adjuntar foto o documento'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {archivoReceta
                            ? `${(archivoReceta.size / 1024).toFixed(0)} KB adjuntados`
                            : 'Formatos aceptados: JPG, PNG o PDF'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selector rápido de Armazón */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Modelo EPP de Interés
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { sku: 'EPP-MIN-001', nombre: 'Titanium Shield Pro', desc: 'ANSI Z87.1' },
                        { sku: 'EPP-MIN-002', nombre: 'Vulcan Flex Extreme', desc: 'TR90 Impacto' },
                      ].map((item) => (
                        <div
                          key={item.sku}
                          onClick={() => setArmazonSeleccionado(item.sku)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            armazonSeleccionado === item.sku
                              ? 'border-[#B34B0C] bg-orange-50/50 dark:bg-orange-950/30 ring-1 ring-[#B34B0C] font-semibold text-[#B34B0C] dark:text-amber-400'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A1816] text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-mono text-[10px] block">{item.sku}</span>
                          <span className="font-bold block mt-0.5">{item.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones de Navegación */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCompletarPreIngresoConReceta}
                      className="flex-1 bg-[#B34B0C] hover:bg-[#8F3B09] text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <span>Completar Pre-Ingreso</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── BIFURCACIÓN B: Sin Receta / Vencida (EMBUDO ACTIVO CON WIDGET) ── */}
              {estadoReceta === 'vencida' && (
                <div className="pt-2 animate-in fade-in duration-200 space-y-4">
                  <ReservaHoraWidget
                    rutPaciente={rut}
                    nombrePaciente={nombre}
                    onVolverInicio={() => setPaso(1)}
                    onReservaExitosa={(detalle) => {
                      setReservaDetalle(detalle);
                      const randomCode = `MED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                      setCodigoPreIngreso(randomCode);
                      setPaso(3);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium py-2.5 rounded-xl text-xs w-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a Identificación</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════ PASO 3: CONFIRMACIÓN Y PANTALLA DE ÉXITO ════════════ */}
          {paso === 3 && (
            <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-3.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 size={42} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {reservaDetalle ? '¡Evaluación Oftalmológica Agendada!' : '¡Pre-Ingreso Digital Exitoso!'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  {reservaDetalle
                    ? 'Su cita médica en el policlínico de faena ha quedado confirmada con trazabilidad D.S. 594.'
                    : 'Su solicitud ha sido pre-ingresada en el sistema. Presente su código o cédula al operador de Óptica Amaru en faena.'}
                </p>
              </div>

              {/* Tarjeta con Código de Pre-Atención */}
              <div className="bg-slate-50 dark:bg-[#1A1816] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Código de Atención:
                  </span>
                  <span className="font-mono text-base font-extrabold text-[#B34B0C]">
                    {codigoPreIngreso || 'PRE-992182'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Trabajador:</span>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">RUT / RUN:</span>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{rut}</p>
                  </div>

                  {reservaDetalle ? (
                    <>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Fecha Agendada:</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {reservaDetalle.fecha}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Bloque:</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {reservaDetalle.bloque}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Estado Receta:</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">Vigente (&lt; 365d)</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Armazón EPP:</span>
                        <p className="font-mono font-semibold text-[#B34B0C]">{armazonSeleccionado}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Botón Reiniciar */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReiniciar}
                  className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-[#1A1816] dark:hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <RotateCcw size={15} />
                  <span>Iniciar Nueva Solicitud</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── Footer Informativo ── */}
        <footer className="text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p>© 2026 Óptica Amaru — Plataforma Health-Tech EPP Minería</p>
          <p className="font-mono text-[10px]">Trazabilidad D.S. 594 & Ley N° 21.719</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicQRView;
