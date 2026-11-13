import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ShieldCheck,
  FilePlus,
  Glasses,
  CheckCircle2,
  QrCode,
  Eye,
  AlertTriangle,
  Building,
  ArrowRight,
  ArrowLeft,
  User,
  Check,
  CreditCard,
  Camera,
} from 'lucide-react';
import { db, type ArmazonLocal } from '../db/dexie';
import { sincronizarColaOffline } from '../sw/syncService';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';
import { RecetaModal } from '../components/RecetaModal';
import { CapturaPhygital } from '../components/CapturaPhygital';
import { ReservaHoraWidget } from '../components/ReservaHoraWidget';
import { type RecetaOpticaItem } from '../services/clinicoService';

interface TerminalViewProps {
  isOnline: boolean;
  onSessionExpired: () => void;
}

const EMPRESAS_CONVENIO = [
  'Minera Centinela',
  'Minera Escondida',
  'Codelco Chuquicamata',
  'Minera Los Pelambres',
  'Compañía Minera Doña Inés de Collahuasi',
];

const TerminalView: React.FC<TerminalViewProps> = ({ isOnline, onSessionExpired: _onSessionExpired }) => {
  // ── Control de Pasos del Wizard (1, 2, 3) ───────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ── Paso 1: Filiación y Contexto ───────────────────────────────────────────
  const [rutPaciente, setRutPaciente] = useState('');
  const [errorRutPaciente, setErrorRutPaciente] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'Particular' | 'Convenio'>('Convenio');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(EMPRESAS_CONVENIO[0]);
  const [autorizacionBiometrica, setAutorizacionBiometrica] = useState(false);

  // ── Paso 2: Validación Clínica y Embudo ─────────────────────────────────────
  // 'vigente' = Poseo receta vigente (< 365 días)
  // 'vencida' = No poseo receta o requiere actualización (Embudo Activo)
  const [tipoReceta, setTipoReceta] = useState<'vigente' | 'vencida'>('vigente');
  const [mostrarModalReceta, setMostrarModalReceta] = useState(false);
  const [recetaActiva, setRecetaActiva] = useState<RecetaOpticaItem | null>(null);
  const [skuSeleccionado, setSkuSeleccionado] = useState('');
  const [montoTotal, setMontoTotal] = useState('85000');

  // ── Paso 3: Cotización y Pago ──────────────────────────────────────────────
  const [rutTitular, setRutTitular] = useState('');
  const [errorRutTitular, setErrorRutTitular] = useState('');
  const [esMismoTitular, setEsMismoTitular] = useState(true);
  const [numCuotas, setNumCuotas] = useState<number>(2);

  // ── Módulo Phygital: Respaldo de Vale Sindical ─────────────────────────────
  const [mostrarPhygital, setMostrarPhygital] = useState(false);
  const [folioPhygital, setFolioPhygital] = useState('');

  // ── Datos Locales y Armazones ──────────────────────────────────────────────
  const [armazonesList, setArmazonesList] = useState<ArmazonLocal[]>([]);
  const [mensajeSync, setMensajeSync] = useState('');

  const cargarDatosLocales = async () => {
    try {
      const count = await db.armazones.count();
      if (count === 0) {
        await db.armazones.bulkAdd([
          {
            sku_armazon: 'EPP-MIN-001',
            modelo_lente: 'Titanium Shield Industrial Pro',
            caracteristicas_tecnicas: { material: 'Policarbonato Reforzado', filtro_uv: 'UV400' },
            certificaciones_multiples: ['ANSI Z87.1', 'EN 166'],
            stock_disponible: 15,
            precio_clp: 85000,
          },
          {
            sku_armazon: 'EPP-MIN-002',
            modelo_lente: 'Vulcan Flex Faena Extreme',
            caracteristicas_tecnicas: { material: 'TR90 Resistente a Impacto', patillas: 'Ajustables' },
            certificaciones_multiples: ['ANSI Z87.1'],
            stock_disponible: 8,
            precio_clp: 92000,
          },
        ]);
      }
      const armazones = await db.armazones.toArray();
      setArmazonesList(armazones);
    } catch (err) {
      console.error('Error al cargar datos locales de Dexie:', err);
    }
  };

  useEffect(() => {
    cargarDatosLocales();
  }, []);

  // Validaciones RUT Paciente
  const handleRutPacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutPaciente(v);
    if (v.length > 3) setErrorRutPaciente(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    else setErrorRutPaciente('');
  };

  const handleRutPacienteBlur = () => {
    if (!rutPaciente) return;
    const f = formatearRUT(rutPaciente);
    setRutPaciente(f);
    setErrorRutPaciente(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
    if (esMismoTitular) setRutTitular(f);
  };

  // Validaciones RUT Titular (Paso 3)
  const handleRutTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutTitular(v);
    if (v.length > 3) setErrorRutTitular(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    else setErrorRutTitular('');
  };

  const handleRutTitularBlur = () => {
    if (!rutTitular) return;
    const f = formatearRUT(rutTitular);
    setRutTitular(f);
    setErrorRutTitular(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
  };

  // Validaciones por paso
  const paso1Valido =
    !!rutPaciente &&
    validarRUT(rutPaciente) &&
    nombrePaciente.trim().length >= 3 &&
    (tipoUsuario === 'Particular' || !!empresaSeleccionada) &&
    autorizacionBiometrica;

  const paso2Valido =
    tipoReceta === 'vigente' && !!skuSeleccionado;

  const paso3Valido =
    !!rutTitular && validarRUT(rutTitular) && numCuotas >= 1 && numCuotas <= 4;

  const handleLimpiarTodo = () => {
    setRutPaciente('');
    setNombrePaciente('');
    setErrorRutPaciente('');
    setRutTitular('');
    setErrorRutTitular('');
    setSkuSeleccionado('');
    setRecetaActiva(null);
    setAutorizacionBiometrica(false);
    setTipoReceta('vigente');
    setCurrentStep(1);
    setMensajeSync('Terminal restablecido para una nueva atención.');
  };

  // Finalizar y Guardar en Dexie (Paso 3)
  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paso3Valido) return;

    const nuevoFolio = `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`;
    const cuotaMonto = Math.round(Number(montoTotal) / numCuotas).toString();

    // Generar array de cuotas dinámico
    const cuotasArray = Array.from({ length: numCuotas }, (_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() + idx + 1);
      return {
        numero_cuota: idx + 1,
        monto_cuota: cuotaMonto,
        mes_ejecucion: d.toISOString().split('T')[0],
      };
    });

    await db.cola_pedidos.add({
      folio_unico_qr: nuevoFolio,
      rut_paciente: formatearRUT(rutPaciente),
      id_receta: recetaActiva?.id_receta || null,
      sku_armazon: skuSeleccionado,
      rut_titular_pago: tipoUsuario === 'Convenio' ? formatearRUT(rutTitular) : null,
      version_seq: 1,
      monto_total: montoTotal,
      cuotas: cuotasArray,
      fecha_creacion: new Date().toISOString(),
      sincronizado: false,
      estado: 'en_cola',
      conflicto_msg: null,
    });

    // Notificar al Navbar para actualizar el indicador de nube
    window.dispatchEvent(new CustomEvent('amaru_sync_updated'));

    // Sincronización transparente en segundo plano si hay red
    if (isOnline) {
      sincronizarColaOffline()
        .then(() => {
          window.dispatchEvent(new CustomEvent('amaru_sync_updated'));
        })
        .catch(() => {});
    }

    // Reset wizard
    setRutPaciente('');
    setNombrePaciente('');
    setErrorRutPaciente('');
    setRutTitular('');
    setErrorRutTitular('');
    setSkuSeleccionado('');
    setRecetaActiva(null);
    setAutorizacionBiometrica(false);
    setCurrentStep(1);

    await cargarDatosLocales();
    setMensajeSync(`✓ Atención registrada con éxito (Folio: ${nuevoFolio}). Guardado seguro.`);
  };

  const handleRecetaGuardada = (receta: RecetaOpticaItem) => {
    setRecetaActiva(receta);
    setTipoReceta('vigente');
    setMensajeSync(`✓ Receta ${receta.id_receta.slice(0, 8)} asociada con vigencia confirmada.`);
  };

  return (
    <>
      {/* ── Header del Módulo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shadow-xs">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#201E1C] dark:text-white">
              Nueva Atención · Registro de Paciente
            </h2>
            <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
              Flujo guiado para pacientes particulares y convenios con validación clínica y cotización
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFolioPhygital('');
              setMostrarPhygital(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-amaru-copper dark:text-amber-400 bg-white dark:bg-amaru-surface-dark border border-amaru-copper/40 hover:bg-amaru-copper hover:text-white px-3.5 py-2 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Camera size={15} />
            <span>Captura Phygital</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarModalReceta(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amaru-copper to-amaru-earth hover:from-amaru-earth hover:to-amaru-copper px-3.5 py-2 rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
          >
            <FilePlus size={15} />
            <span>+ Nueva Receta</span>
          </button>
        </div>
      </div>

      {mensajeSync && (
        <div className="max-w-4xl mx-auto mb-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl p-3.5 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span className="font-semibold">{mensajeSync}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeSync('')}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full max-w-4xl mx-auto">
        {/* ── Asistente por Pasos (Wizard) ── */}
        <section className="w-full bg-white dark:bg-amaru-surface-dark border border-slate-200 dark:border-[#3E3A36] p-6 sm:p-8 rounded-2xl shadow-sm dark:shadow-xl transition-all">
          {/* Barra de Progreso del Asistente */}
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-[#3E3A36]">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: 'Filiación' },
                { step: 2, label: 'Clínica & Embudo' },
                { step: 3, label: 'Cotización & Pago' },
              ].map((item, idx) => {
                const isActive = currentStep === item.step;
                const isCompleted = currentStep > item.step;
                return (
                  <div key={item.step} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-amaru-copper text-white shadow-md shadow-amaru-copper/30 ring-2 ring-amaru-copper/30'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-amaru-dark text-amaru-steel dark:text-amaru-light-gray'
                        }`}
                      >
                        {isCompleted ? <Check size={14} /> : item.step}
                      </div>
                      <span
                        className={`text-xs font-semibold hidden sm:inline ${
                          isActive
                            ? 'text-amaru-copper font-bold'
                            : isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amaru-steel dark:text-amaru-light-gray'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                          currentStep > item.step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-[#3E3A36]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════ PASO 1: FILIACIÓN Y CONTEXTO ════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <User size={18} />
                  Paso 1: Filiación y Contexto Laboral
                </h3>
                <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                  Identificación del trabajador y consentimiento legal Ley N° 19.628
                </p>
              </div>

              {/* RUT Paciente */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray">
                    RUT Paciente Trabajador <span className="text-amaru-copper">*</span>
                  </label>
                  {rutPaciente && validarRUT(rutPaciente) && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> RUT Válido
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="12345678-9"
                  value={rutPaciente}
                  onChange={handleRutPacienteChange}
                  onBlur={handleRutPacienteBlur}
                  maxLength={12}
                  className={`w-full bg-white dark:bg-[#1E1C1A] border rounded-xl px-3.5 py-2.5 text-sm text-[#201E1C] dark:text-[#F5F5F4] placeholder:text-slate-400 dark:placeholder:text-amaru-steel outline-none transition-all ${
                    errorRutPaciente
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                      : rutPaciente && validarRUT(rutPaciente)
                      ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-[#4A4540] focus:ring-2 focus:ring-amaru-copper'
                  }`}
                />
                {errorRutPaciente && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {errorRutPaciente}
                  </p>
                )}
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-1.5">
                  Nombre Completo del Trabajador <span className="text-amaru-copper">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez González"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-[#4A4540] focus:ring-2 focus:ring-amaru-copper rounded-xl px-3.5 py-2.5 text-sm text-[#201E1C] dark:text-[#F5F5F4] placeholder:text-slate-400 dark:placeholder:text-amaru-steel outline-none transition-all"
                />
              </div>

              {/* Selector Tipo de Usuario: Particular / Convenio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-1.5">
                  Tipo de Usuario <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Convenio', 'Particular'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoUsuario(tipo)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        tipoUsuario === tipo
                          ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper text-amaru-copper dark:text-amber-400'
                          : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A] text-[#201E1C] dark:text-amaru-light-gray'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Building size={14} />
                        {tipo === 'Convenio' ? 'Convenio Minero' : 'Particular'}
                      </span>
                      {tipoUsuario === tipo && <CheckCircle2 size={15} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Empresa (Sindicato) */}
              {tipoUsuario === 'Convenio' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-1.5">
                    Empresa / Sindicato en Faena <span className="text-amaru-copper">*</span>
                  </label>
                  <select
                    value={empresaSeleccionada}
                    onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-[#4A4540] rounded-xl px-3.5 py-2.5 text-sm text-[#201E1C] dark:text-[#F5F5F4] focus:ring-2 focus:ring-amaru-copper outline-none transition-all"
                  >
                    {EMPRESAS_CONVENIO.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Checkbox Autorización Biométrica Ley N° 19.628 */}
              <div className="bg-slate-50 dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] p-3.5 rounded-xl">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autorizacionBiometrica}
                    onChange={(e) => setAutorizacionBiometrica(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-[#4A4540] bg-white dark:bg-[#282523] accent-amaru-copper cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-[#524944] dark:text-zinc-200 leading-tight">
                    <strong className="text-[#201E1C] dark:text-white">
                      Autorización Biométrica Ley N° 19.628:
                    </strong>{' '}
                    El trabajador autoriza el tratamiento y captura de sus datos biométricos, refracción oftalmológica y entrega de EPP en faena.
                  </span>
                </label>
              </div>

              {/* Botón Siguiente Paso */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!paso1Valido}
                  onClick={() => setCurrentStep(2)}
                  className={`w-full font-semibold rounded-xl text-sm py-3.5 transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso1Valido
                      ? 'bg-gradient-to-r from-amaru-copper to-amaru-earth hover:from-amaru-earth hover:to-amaru-copper text-white shadow-amaru-copper/20 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 dark:bg-[#1E1C1A] dark:text-zinc-600 border border-slate-300 dark:border-[#3E3A36] cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continuar a Validación Clínica (Paso 2)</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ════════════ PASO 2: VALIDACIÓN CLÍNICA Y EMBUDO ════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <Glasses size={18} />
                  Paso 2: Validación Clínica y Embudo Normativo
                </h3>
                <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                  Verificación de vigencia médica (&lt; 365 días) según D.S. 594
                </p>
              </div>

              {/* Pregunta Inicial con Radio Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray">
                  ¿Estado de la Receta Médica Oftalmológica? <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTipoReceta('vigente')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      tipoReceta === 'vigente'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-600'
                        : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoReceta"
                      checked={tipoReceta === 'vigente'}
                      onChange={() => setTipoReceta('vigente')}
                      className="mt-0.5 text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#201E1C] dark:text-white">
                        1) Poseo receta vigente (&lt; 365 días)
                      </p>
                      <p className="text-[11px] text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                        Permite seleccionar armazón y pasar a cotización
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setTipoReceta('vencida');
                      setSkuSeleccionado('');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      tipoReceta === 'vencida'
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-600'
                        : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoReceta"
                      checked={tipoReceta === 'vencida'}
                      onChange={() => {
                        setTipoReceta('vencida');
                        setSkuSeleccionado('');
                      }}
                      className="mt-0.5 text-amber-600 accent-amber-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        2) No poseo receta o requiere actualización
                      </p>
                      <p className="text-[11px] text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                        Activa embudo y agenda evaluación en policlínico
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RAMA 1: Receta Vigente ── */}
              {tipoReceta === 'vigente' && (
                <div className="space-y-4 pt-1">
                  {/* Ficha de Refracción o Botón para ingresar receta */}
                  {recetaActiva ? (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 transition-all">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
                        <div className="flex items-center gap-2">
                          <Eye size={15} className="text-emerald-700 dark:text-emerald-300" />
                          <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Ficha de Refracción Oftalmológica
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            (ID: {recetaActiva.id_receta.slice(0, 8)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRecetaActiva(null)}
                          className="text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                          <thead>
                            <tr className="border-b border-emerald-200/50 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold uppercase">
                              <th className="py-1 px-2">Ojo</th>
                              <th className="py-1 px-2 text-center">SPH</th>
                              <th className="py-1 px-2 text-center">CYL</th>
                              <th className="py-1 px-2 text-center">AXIS</th>
                              <th className="py-1 px-2 text-center">ADD</th>
                              <th className="py-1 px-2 text-center">DP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/30 font-mono text-[#201E1C] dark:text-[#F5F5F4]">
                            <tr>
                              <td className="py-1 px-2 font-bold text-amaru-copper">OD</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_derecho.esfera ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_derecho.cilindro ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_derecho.eje ?? '-'}°</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_derecho.adicion ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_derecho.dp ?? '-'}</td>
                            </tr>
                            <tr>
                              <td className="py-1 px-2 font-bold text-amaru-copper">OI</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_izquierdo.esfera ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_izquierdo.cilindro ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_izquierdo.eje ?? '-'}°</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_izquierdo.adicion ?? '-'}</td>
                              <td className="py-1 px-2 text-center">{recetaActiva.parametros_oftalmologicos.ojo_izquierdo.dp ?? '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] p-3.5 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-[#201E1C] dark:text-white">
                          Parámetros de Refracción
                        </p>
                        <p className="text-[11px] text-[#6C6A68] dark:text-amaru-light-gray">
                          Asocie los datos OD/OI de la receta para el lente correctivo
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarModalReceta(true)}
                        className="text-xs font-semibold text-amaru-copper border border-amaru-copper/40 hover:bg-amaru-copper hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        + Ingresar Receta
                      </button>
                    </div>
                  )}

                  {/* Catálogo de Armazones Certificados */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-2">
                      Catálogo de Armazones Certificados (D.S. 594) <span className="text-amaru-copper">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {armazonesList.map((arm) => {
                        const isSelected = skuSeleccionado === arm.sku_armazon;
                        return (
                          <div
                            key={arm.sku_armazon}
                            onClick={() => {
                              setSkuSeleccionado(arm.sku_armazon);
                              setMontoTotal(arm.precio_clp.toString());
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-amaru-copper bg-amaru-copper/5 dark:bg-amaru-copper/10 ring-2 ring-amaru-copper'
                                : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50/70 dark:bg-[#1E1C1A] hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-mono text-[11px] font-bold text-amaru-copper bg-amaru-copper/10 px-2 py-0.5 rounded">
                                {arm.sku_armazon}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                                Stock: {arm.stock_disponible} un.
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#201E1C] dark:text-[#F5F5F4] mb-1">
                              {arm.modelo_lente}
                            </h5>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-[#3E3A36]/60">
                              <span className="text-[11px] text-[#6C6A68] dark:text-amaru-light-gray">Precio CLP:</span>
                              <span className="text-sm font-extrabold text-[#201E1C] dark:text-white">
                                ${arm.precio_clp.toLocaleString('es-CL')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Acciones de Navegación Rama 1 */}
                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-3 rounded-xl border border-slate-300 dark:border-[#3E3A36] text-xs font-semibold text-[#6C6A68] dark:text-amaru-light-gray hover:text-[#201E1C] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} />
                      <span>Volver</span>
                    </button>
                    <button
                      type="button"
                      disabled={!paso2Valido}
                      onClick={() => setCurrentStep(3)}
                      className={`flex-1 font-semibold rounded-xl text-sm py-3 transition-all flex items-center justify-center gap-2 shadow-md ${
                        paso2Valido
                          ? 'bg-gradient-to-r from-amaru-copper to-amaru-earth hover:from-amaru-earth hover:to-amaru-copper text-white shadow-amaru-copper/20 cursor-pointer active:scale-[0.99]'
                          : 'bg-slate-200 text-slate-400 dark:bg-[#1E1C1A] dark:text-zinc-600 border border-slate-300 dark:border-[#3E3A36] cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>Continuar a Cotización y Pago (Paso 3)</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── RAMA 2: No Poseo Receta o Requiere Actualización (EMBUDO ACTIVO: OCULTA CATÁLOGO Y PAGO) ── */}
              {tipoReceta === 'vencida' && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <ReservaHoraWidget
                    rutPaciente={rutPaciente}
                    nombrePaciente={nombrePaciente}
                    onVolverInicio={handleLimpiarTodo}
                    onReservaExitosa={(detalle) => {
                      setMensajeSync(
                        `✓ Evaluación oftalmológica agendada para ${detalle.rut}: ${detalle.fecha} (${detalle.bloque}).`
                      );
                    }}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3E3A36] text-xs font-semibold text-[#6C6A68] dark:text-amaru-light-gray hover:text-[#201E1C] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver a Filiación (Paso 1)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════ PASO 3: COTIZACIÓN Y PAGO ════════════ */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalizarPedido} className="space-y-5 animate-in fade-in duration-200" noValidate>
              <div className="pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <CreditCard size={18} />
                  Paso 3: Cotización y Modalidad de Pago
                </h3>
                <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                  Desacople del RUT titular y definición de cuotas por planilla
                </p>
              </div>

              {/* RUT Titular Independiente */}
              <div className="bg-slate-50 dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray">
                    RUT del Titular (Socio del Convenio) <span className="text-amaru-copper">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nuevo = !esMismoTitular;
                      setEsMismoTitular(nuevo);
                      if (nuevo && rutPaciente) setRutTitular(rutPaciente);
                    }}
                    className="text-[11px] font-semibold text-amaru-copper hover:underline cursor-pointer"
                  >
                    {esMismoTitular ? '✓ Es el mismo trabajador' : '+ Ingresar RUT distinto'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="12345678-9"
                  value={rutTitular}
                  onChange={handleRutTitularChange}
                  onBlur={handleRutTitularBlur}
                  disabled={esMismoTitular}
                  maxLength={12}
                  className={`w-full bg-white dark:bg-amaru-surface-dark border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${
                    esMismoTitular
                      ? 'bg-slate-100 dark:bg-amaru-dark text-amaru-steel cursor-not-allowed'
                      : errorRutTitular
                      ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-400'
                      : rutTitular && validarRUT(rutTitular)
                      ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-[#4A4540] focus:ring-2 focus:ring-amaru-copper'
                  }`}
                />
                {errorRutTitular && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {errorRutTitular}
                  </p>
                )}
              </div>

              {/* Selector de Cuotas (1 a 4) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-2">
                  Número de Cuotas por Planilla (1 a 4) <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumCuotas(n)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        numCuotas === n
                          ? 'border-amaru-copper bg-amaru-copper text-white shadow-sm ring-2 ring-amaru-copper/30'
                          : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A] text-[#201E1C] dark:text-amaru-light-gray hover:border-slate-300'
                      }`}
                    >
                      {n} {n === 1 ? 'Cuota' : 'Cuotas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen de Cotización */}
              <div className="bg-slate-50 dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#6C6A68] dark:text-amaru-light-gray">Armazón EPP:</span>
                  <span className="font-semibold text-[#201E1C] dark:text-white font-mono">{skuSeleccionado}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6C6A68] dark:text-amaru-light-gray">Monto Total:</span>
                  <span className="font-bold text-sm text-[#201E1C] dark:text-white">
                    ${Number(montoTotal).toLocaleString('es-CL')} CLP
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-[#3E3A36]">
                  <span className="text-amaru-copper font-semibold">Valor por Cuota:</span>
                  <span className="font-bold text-amaru-copper text-sm">
                    {numCuotas}x ${Math.round(Number(montoTotal) / numCuotas).toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              {/* Acciones de Navegación y Guardado */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-3.5 rounded-xl border border-slate-300 dark:border-[#3E3A36] text-xs font-semibold text-[#6C6A68] dark:text-amaru-light-gray hover:text-[#201E1C] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a Clínica</span>
                </button>

                <button
                  type="submit"
                  disabled={!paso3Valido}
                  className={`flex-1 font-semibold rounded-xl text-sm py-3.5 transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso3Valido
                      ? 'bg-gradient-to-r from-amaru-copper to-amaru-earth hover:from-amaru-earth hover:to-amaru-copper text-white shadow-amaru-copper/20 cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 dark:bg-[#1E1C1A] dark:text-zinc-600 border border-slate-300 dark:border-[#3E3A36] cursor-not-allowed shadow-none'
                  }`}
                >
                  <QrCode size={17} />
                  <span>Completar Atención y Generar Folio</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Modal de Registro de Receta Oftalmológica */}
      <RecetaModal
        isOpen={mostrarModalReceta}
        onClose={() => setMostrarModalReceta(false)}
        initialRut={rutPaciente}
        onRecetaGuardada={handleRecetaGuardada}
      />

      {/* Modal de Captura Phygital (Respaldo Sindical) */}
      <CapturaPhygital
        isOpen={mostrarPhygital}
        folio={folioPhygital}
        onClose={() => setMostrarPhygital(false)}
        onSuccess={async (folioActualizado) => {
          setMensajeSync(`✓ Respaldo sindical validado para ${folioActualizado}. Transición a En_Fabricacion.`);
          await cargarDatosLocales();
        }}
      />
    </>
  );
};

export default TerminalView;
