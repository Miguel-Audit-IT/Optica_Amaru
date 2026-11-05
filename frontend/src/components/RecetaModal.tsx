import React, { useState, useEffect } from 'react';
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

  // Estados de interfaz y feedback
  const [loading, setLoading] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado para la reserva oftalmológica (funnel de retención)
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [fechaReserva, setFechaReserva] = useState('');
  const [reservaConfirmada, setReservaConfirmada] = useState(false);

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

      const nuevaReceta = await registrarReceta({
        rut_paciente: formatearRUT(rut),
        fecha_emision: fechaEmision,
        parametros_oftalmologicos: parametros,
      });

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

          {/* Tabla de Graduación OD y OI */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-amaru-copper uppercase tracking-wider">
              Parámetros de Refracción (OD / OI)
            </h3>
            <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#37322E] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-[#1A1816] text-[#524944] dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#E2E8F0] dark:border-[#37322E]">
                  <tr>
                    <th className="px-3 py-2">Ojo</th>
                    <th className="px-3 py-2">Esfera (SPH)</th>
                    <th className="px-3 py-2">Cilindro (CYL)</th>
                    <th className="px-3 py-2">Eje (AXIS °)</th>
                    <th className="px-3 py-2">Adición (ADD)</th>
                    <th className="px-3 py-2">DP (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#37322E]">
                  {/* OD */}
                  <tr>
                    <td className="px-3 py-2 font-bold text-amber-700 dark:text-amber-400">OD (Derecho)</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={odEsfera}
                        onChange={(e) => setOdEsfera(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={odCilindro}
                        onChange={(e) => setOdCilindro(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={odEje}
                        onChange={(e) => setOdEje(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={odAdicion}
                        onChange={(e) => setOdAdicion(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={odDp}
                        onChange={(e) => setOdDp(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                  </tr>

                  {/* OI */}
                  <tr>
                    <td className="px-3 py-2 font-bold text-blue-700 dark:text-blue-400">OI (Izquierdo)</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={oiEsfera}
                        onChange={(e) => setOiEsfera(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={oiCilindro}
                        onChange={(e) => setOiCilindro(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={oiEje}
                        onChange={(e) => setOiEje(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.25"
                        value={oiAdicion}
                        onChange={(e) => setOiAdicion(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={oiDp}
                        onChange={(e) => setOiDp(e.target.value)}
                        className="w-16 bg-slate-50 dark:bg-[#1A1816] border border-[#B3B2B0] dark:border-[#524944] rounded px-2 py-1 text-[#201E1C] dark:text-white text-xs focus:border-amaru-copper"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
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
              disabled={loading || !vigencia.esVigente || !rut || !!errorRut}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-md ${
                vigencia.esVigente && rut && !errorRut && !loading
                  ? 'bg-amaru-copper hover:bg-amaru-earth text-white shadow-amaru-copper/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-300 dark:border-zinc-700 cursor-not-allowed'
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
