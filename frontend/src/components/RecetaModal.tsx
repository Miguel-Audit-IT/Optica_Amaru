import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  calcularVigenciaReceta,
  registrarReceta,
  agendarReservaHora,
  type ParametrosOftalmologicos,
  type RecetaOpticaItem,
} from '../services/clinicoService';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';

interface RecetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRut?: string;
  onRecetaGuardada?: (receta: RecetaOpticaItem) => void;
}

export const RecetaModal: React.FC<RecetaModalProps> = ({
  isOpen,
  onClose,
  initialRut = '',
  onRecetaGuardada,
}) => {
  const [rut, setRut] = useState('');
  const [errorRut, setErrorRut] = useState('');
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaEmision, setFechaEmision] = useState(hoyStr);

  // Parámetros Ojo Derecho (OD)
  const [odEsfera, setOdEsfera] = useState('-1.50');
  const [odCilindro, setOdCilindro] = useState('-0.50');
  const [odEje, setOdEje] = useState('90');
  const [odAdicion, setOdAdicion] = useState('1.75');
  const [odDp, setOdDp] = useState('31.5');

  // Parámetros Ojo Izquierdo (OI)
  const [oiEsfera, setOiEsfera] = useState('-1.25');
  const [oiCilindro, setOiCilindro] = useState('-0.75');
  const [oiEje, setOiEje] = useState('85');
  const [oiAdicion, setOiAdicion] = useState('1.75');
  const [oiDp, setOiDp] = useState('31.0');

  const [observaciones, setObservaciones] = useState('');

  // ── HU-SEC-02: Estado y referencia para archivo físico de la receta ─────────
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Términos y Condiciones / Consentimiento Legal Ley 21.719 y 21.663 ──────
  const [consentimientoLegal, setConsentimientoLegal] = useState<boolean>(false);

  // Estados de interfaz y feedback
  const [loading, setLoading] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado para la reserva oftalmológica (funnel de retención)
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [fechaReserva, setFechaReserva] = useState('');
  const [reservaConfirmada, setReservaConfirmada] = useState(false);

  // Limpiar archivo y estados cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setArchivo(null);
      setConsentimientoLegal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialRut) {
      const f = formatearRUT(initialRut);
      setRut(f);
    }
  }, [initialRut]);

  if (!isOpen) return null;

  const vigencia = calcularVigenciaReceta(fechaEmision);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      setMensajeError('');
    }
  };

  const handleEliminarArchivo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGuardarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!rut || !validarRUT(rut)) {
      setErrorRut('Ingrese un RUT de paciente válido.');
      return;
    }

    if (!vigencia.esVigente) {
      setMensajeError(
        `Receta no válida: Tiene ${vigencia.dias} días de antigüedad. La norma técnica DS 594 exige recetas emitidas hace menos de 365 días.`
      );
      return;
    }

    setLoading(true);

    try {
      const parametros: ParametrosOftalmologicos = {
        ojo_derecho: {
          esfera: parseFloat(odEsfera) || 0,
          cilindro: parseFloat(odCilindro) || 0,
          eje: parseInt(odEje, 10) || 0,
          adicion: parseFloat(odAdicion) || 0,
          dp: parseFloat(odDp) || 0,
        },
        ojo_izquierdo: {
          esfera: parseFloat(oiEsfera) || 0,
          cilindro: parseFloat(oiCilindro) || 0,
          eje: parseInt(oiEje, 10) || 0,
          adicion: parseFloat(oiAdicion) || 0,
          dp: parseFloat(oiDp) || 0,
        },
        observaciones: observaciones.trim() || undefined,
      };

      // ── Construcción de FormData para envío multipart con archivo ─────────
      const formData = new FormData();
      formData.append('rut_paciente', formatearRUT(rut));
      formData.append('fecha_emision', fechaEmision);

      // Valores refractivos individuales
      formData.append('esfera_od', odEsfera);
      formData.append('cilindro_od', odCilindro);
      formData.append('eje_od', odEje);
      formData.append('adicion_od', odAdicion);
      formData.append('dp_od', odDp);

      formData.append('esfera_oi', oiEsfera);
      formData.append('cilindro_oi', oiCilindro);
      formData.append('eje_oi', oiEje);
      formData.append('adicion_oi', oiAdicion);
      formData.append('dp_oi', oiDp);

      if (observaciones.trim()) {
        formData.append('observaciones', observaciones.trim());
      }

      // Parámetros JSON estructurados para el serializador de Django
      formData.append('parametros_oftalmologicos', JSON.stringify(parametros));

      // Adjuntar archivo físico si fue seleccionado (validación backend magic bytes)
      if (archivo) {
        formData.append('archivo_receta', archivo);
      }

      const nuevaReceta = await registrarReceta(formData);

      setMensajeExito(`✓ Receta ${nuevaReceta.id_receta.slice(0, 8)} guardada con éxito.`);
      if (onRecetaGuardada) {
        onRecetaGuardada(nuevaReceta);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la receta médica';
      setMensajeError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAgendarEvaluacion = async () => {
    if (!rut || !validarRUT(rut)) {
      setErrorRut('Ingrese un RUT válido para agendar.');
      return;
    }
    const fechaHora = fechaReserva || new Date(Date.now() + 86400000).toISOString();
    setLoading(true);
    try {
      await agendarReservaHora(formatearRUT(rut), fechaHora);
      setReservaConfirmada(true);
      setMensajeExito('✓ Hora de evaluación oftalmológica agendada en policlínico de faena.');
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : 'Error al agendar hora');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-[#201E1C] dark:text-zinc-100 relative max-h-[90vh] overflow-y-auto transition-colors">
        {/* Encabezado */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E2E8F0] dark:border-[#37322E]">
          <div>
            <h2 className="text-lg font-bold text-[#201E1C] dark:text-white flex items-center gap-2">
              <span className="text-amaru-copper">✦</span> Módulo Clínico: Registro de Receta Oftalmológica
            </h2>
            <p className="text-xs text-[#6C6A68] dark:text-zinc-400">
              Validación de vigencia clínica (&lt; 365 días) y graduación para EPP correctivo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6C6A68] hover:text-[#201E1C] dark:text-zinc-400 dark:hover:text-white px-2.5 py-1 rounded-lg border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#37322E] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Notificaciones */}
        {mensajeError && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <span>⚠</span>
            <span>{mensajeError}</span>
          </div>
        )}
        {mensajeExito && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs p-3 rounded-xl">
            {mensajeExito}
          </div>
        )}

        <form onSubmit={handleGuardarReceta} className="space-y-4">
          {/* Fila 1: Paciente y Fecha de Emisión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6C6A68] dark:text-zinc-400 mb-1">
                RUT Paciente Trabajador *
              </label>
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                onBlur={handleRutBlur}
                placeholder="12345678-9"
                maxLength={12}
                required
                className={`w-full bg-white dark:bg-[#37322E] border rounded-lg px-3 py-2 text-sm text-[#201E1C] dark:text-white outline-none transition-colors ${
                  errorRut
                    ? 'border-red-500'
                    : rut && validarRUT(rut)
                    ? 'border-emerald-600'
                    : 'border-[#B3B2B0] dark:border-[#524944] focus:border-amaru-copper dark:focus:border-amaru-copper'
                }`}
              />
              {errorRut && <p className="text-red-500 text-[11px] mt-1">⚠ {errorRut}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6C6A68] dark:text-zinc-400 mb-1">
                Fecha de Emisión de la Receta *
              </label>
              <input
                type="date"
                value={fechaEmision}
                max={hoyStr}
                onChange={(e) => setFechaEmision(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#37322E] border border-[#B3B2B0] dark:border-[#524944] rounded-lg px-3 py-2 text-sm text-[#201E1C] dark:text-white focus:border-amaru-copper dark:focus:border-amaru-copper outline-none"
              />
              {/* Badge de Vigencia */}
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-[#6C6A68] dark:text-zinc-400">Antigüedad: {vigencia.dias} días</span>
                {vigencia.esVigente ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 px-2 py-0.5 rounded">
                    ✓ Receta Vigente (&lt; 365 días)
                  </span>
                ) : (
                  <span className="text-red-700 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800/80 px-2 py-0.5 rounded">
                    ✕ Receta Vencida (&gt; 365 días)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Fila 2: Subida de Archivo Físico de la Receta (HU-SEC-02) ── */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-[#6C6A68] dark:text-zinc-400">
              Archivo Digital o Fotografía de la Receta Médica (Opcional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#B34B0C]/40 hover:border-[#B34B0C] bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50/70 dark:hover:bg-orange-950/30 rounded-xl p-3.5 transition-all duration-200 cursor-pointer group"
            >
              {archivo ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-[#B34B0C]/10 text-[#B34B0C] rounded-lg shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#201E1C] dark:text-white truncate max-w-xs sm:max-w-md">
                        {archivo.name}
                      </p>
                      <p className="text-[10px] text-[#6C6A68] dark:text-zinc-400">
                        {(archivo.size / 1024).toFixed(1)} KB · Listo para validar en backend (Magic Bytes)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Adjunto
                    </span>
                    <button
                      type="button"
                      onClick={handleEliminarArchivo}
                      title="Quitar archivo"
                      className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#B34B0C]/10 text-[#B34B0C] rounded-lg group-hover:scale-105 transition-transform shrink-0">
                    <UploadCloud size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#201E1C] dark:text-white">
                      Haz clic aquí para adjuntar el documento de la receta
                    </p>
                    <p className="text-[11px] text-[#6C6A68] dark:text-zinc-400">
                      Formatos aceptados: <strong className="text-slate-700 dark:text-zinc-300">.pdf, .jpg, .jpeg, .png</strong> (Validación estricta de firma binaria)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banner de alerta si está vencida: Embudo de Retención */}
          {!vigencia.esVigente && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/70 p-4 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <span>⚠</span>
                <span>Embudo de Retención Oftalmológica Activado</span>
              </div>
              <p>
                La receta tiene {vigencia.dias} días. Conforme al D.S. 594, está inhabilitada para la confección
                de EPP correctivo. Puede derivar al paciente directamente a una evaluación oftalmológica en faena:
              </p>
              {!mostrarReserva && !reservaConfirmada && (
                <button
                  type="button"
                  onClick={() => setMostrarReserva(true)}
                  className="bg-amber-700 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Agendar Evaluación Oftalmológica en Faena
                </button>
              )}
              {mostrarReserva && !reservaConfirmada && (
                <div className="mt-2 p-3 bg-white dark:bg-[#121826] border border-amber-300 dark:border-amber-700/60 rounded-lg space-y-2">
                  <label className="block text-[11px] text-[#524944] dark:text-zinc-300">Fecha y hora propuesta para atención:</label>
                  <input
                    type="datetime-local"
                    value={fechaReserva}
                    onChange={(e) => setFechaReserva(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1A2234] border border-[#B3B2B0] dark:border-[#2A364F] rounded px-3 py-1.5 text-xs text-[#201E1C] dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleAgendarEvaluacion}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded cursor-pointer"
                    >
                      Confirmar Reserva
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarReserva(false)}
                      className="text-[#6C6A68] hover:text-[#201E1C] dark:text-zinc-400 dark:hover:text-zinc-200 text-xs px-2 py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {reservaConfirmada && (
                <div className="text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                  ✓ Evaluación agendada con éxito para el trabajador.
                </div>
              )}
            </div>
          )}

          {/* Tabla de Graduación OD y OI — Instrumento de Precisión Óptica */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amaru-copper uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>✦</span>
                <span>INSTRUMENTO DE REFRACCIÓN ÓPTICA OCUPACIONAL (OD / OI)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                NORMA TÉCNICA ANSI Z87.1
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-black/20 shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-zinc-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/10 text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5">OJO</th>
                    <th className="px-3 py-2.5 text-center">SPH (Esfera · D)</th>
                    <th className="px-3 py-2.5 text-center">CYL (Cilindro · D)</th>
                    <th className="px-3 py-2.5 text-center">AXIS (Eje · °)</th>
                    <th className="px-3 py-2.5 text-center">ADD (Adición · D)</th>
                    <th className="px-3 py-2.5 text-center">PD (Distancia · mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/5 bg-white/70 dark:bg-black/30">
                  {/* OD */}
                  <tr>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 inline-flex items-center gap-1">
                        OD <span className="text-[10px] font-normal opacity-80">(Dextro)</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={odEsfera}
                        onChange={(e) => setOdEsfera(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={odCilindro}
                        onChange={(e) => setOdCilindro(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={odEje}
                        onChange={(e) => setOdEje(e.target.value)}
                        className="w-16 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={odAdicion}
                        onChange={(e) => setOdAdicion(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={odDp}
                        onChange={(e) => setOdDp(e.target.value)}
                        className="w-16 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                  </tr>

                  {/* OI */}
                  <tr>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/30 inline-flex items-center gap-1">
                        OI <span className="text-[10px] font-normal opacity-80">(Sinistro)</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={oiEsfera}
                        onChange={(e) => setOiEsfera(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={oiCilindro}
                        onChange={(e) => setOiCilindro(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={oiEje}
                        onChange={(e) => setOiEje(e.target.value)}
                        className="w-16 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.25"
                        value={oiAdicion}
                        onChange={(e) => setOiAdicion(e.target.value)}
                        className="w-20 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={oiDp}
                        onChange={(e) => setOiDp(e.target.value)}
                        className="w-16 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-[#201E1C] dark:text-white font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amaru-copper focus:border-amaru-copper outline-none transition-all"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 px-1">
              <span>RESOLUCIÓN MÉDICA: PASO 0.25 D</span>
              <span>CALIBRACIÓN BIOMÉTRICA CONFORME DS 594</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6C6A68] dark:text-zinc-400 mb-1">
              Observaciones Clínicas / Tratamiento (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Uso permanente en interior mina, filtro antirreflejo y endurecido."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-white dark:bg-[#37322E] border border-[#B3B2B0] dark:border-[#524944] rounded-lg px-3 py-2 text-xs text-[#201E1C] dark:text-white focus:border-amaru-copper dark:focus:border-amaru-copper outline-none"
            />
          </div>

          {/* Bloque Legal: Términos y Condiciones Ley 21.719 y Ley 21.663 */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#1A1816]/70 border border-slate-200/90 dark:border-zinc-800 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentimientoLegal}
                onChange={(e) => setConsentimientoLegal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-xs border-slate-300 text-amaru-copper focus:ring-amaru-copper dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Acepto los Términos y Condiciones sobre validación de identidad y almacenamiento de datos.
              </span>
            </label>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed pl-6.5">
              Conforme a la Ley 21.719 de Protección de Datos Personales y la Ley 21.663 Marco de Ciberseguridad, declaro ser titular de la información clínica y biométrica proporcionada (nombre, RUT, receta óptica). Sus datos personales serán recogidos, encriptados bajo algoritmo SHA-256 y almacenados con las finalidades de: (a) verificar su identidad y trazabilidad para el DS 594; (b) evitar la suplantación de la misma; (c) efectuar la fabricación del EPP óptico. Al aceptar y continuar, usted autoriza este tratamiento para seguir utilizando la plataforma.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#37322E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6C6A68] hover:text-[#201E1C] dark:text-zinc-400 dark:hover:text-white border border-[#E2E8F0] dark:border-[#37322E] hover:border-zinc-400 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading || !vigencia.esVigente || !rut || !!errorRut || !consentimientoLegal}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                vigencia.esVigente && rut && !errorRut && !loading && consentimientoLegal
                  ? 'bg-amaru-copper hover:bg-amaru-earth text-white shadow-amaru-copper/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-300 dark:border-zinc-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {loading ? 'Validando y Guardando...' : 'Guardar y Asociar Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
