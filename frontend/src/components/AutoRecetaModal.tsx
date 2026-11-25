import React, { useState, useRef, useEffect } from 'react';
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
import {
  agregarSolicitudReceta,
  type CiudadAtencion,
  type TipoUsuario,
  type SolicitudReceta,
} from '../services/recetasService';
import {
  validarCodigoSindicato,
  calcularBeneficioConvenio,
  type ResultadoValidacionCodigo,
} from '../services/convenioSindicatoService';
import { getInventario, type ItemInventario } from '../services/inventarioService';
import { PoliticasGarantiaBox } from './PoliticasGarantiaBox';
import { ArmazonThumbnail } from './ArmazonThumbnail';

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
  const [ciudad] = useState<CiudadAtencion>('Calama');
  const [catalogoInventario, setCatalogoInventario] = useState<ItemInventario[]>(() => getInventario());
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('Convenio Minero');
  const [empresaFaena, setEmpresaFaena] = useState<string>(EMPRESAS_CONVENIO_DEFAULT[0]);
  const [codigoConvenio, setCodigoConvenio] = useState<string>('');
  const [resultadoConvenio, setResultadoConvenio] = useState<ResultadoValidacionCodigo | null>(null);
  // Consentimiento legal estricto: NUNCA pre-marcado (inicia en false)
  const [autorizacionLey, setAutorizacionLey] = useState<boolean>(false);
  const [mostrarDerechos, setMostrarDerechos] = useState<boolean>(false);

  // ── PASO 2: Clínica & Embudo ───────────────────────────────────────────────
  const [tipoReceta, setTipoReceta] = useState<'vigente' | 'sin_receta'>('vigente');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreviewUrl, setArchivoPreviewUrl] = useState<string | undefined>(undefined);
  const [archivoNombreSimulado, setArchivoNombreSimulado] = useState<string>('Receta_Medica_Vigente_2026.pdf');
  const [declaracionVeracidadReceta, setDeclaracionVeracidadReceta] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deseaDigitar, setDeseaDigitar] = useState<boolean>(true);
  const [odEsfera, setOdEsfera] = useState<string>('-1.50');
  const [odCilindro, setOdCilindro] = useState<string>('-0.50');
  const [odEje, setOdEje] = useState<string>('90°');
  const [oiEsfera, setOiEsfera] = useState<string>('-1.25');
  const [oiCilindro, setOiCilindro] = useState<string>('-0.75');
  const [oiEje, setOiEje] = useState<string>('85°');

  // ── PASO 3: Cotización, Opciones Ópticas, Convenio y Pago ──────────────────
  const [skuSeleccionado, setSkuSeleccionado] = useState<string>(
    () => getInventario()[0]?.sku || 'EPP-TITAN-001'
  );
  const [materialCristal, setMaterialCristal] = useState<
    'Orgánico / Plástico' | 'Policarbonato' | 'Mineral / Vidrio'
  >('Policarbonato');
  const [filtrosCristal, setFiltrosCristal] = useState<string[]>(['Filtro UV', 'Filtro Luz Azul']);
  const [adelgazamiento, setAdelgazamiento] = useState<
    'Estándar (1.56)' | 'Adelgazado (1.61)' | 'Ultra Delgado (1.67)'
  >('Estándar (1.56)');
  const [contextoUso, setContextoUso] = useState<string>('Faena minera');
  const [especificacionesCliente, setEspecificacionesCliente] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('Descuento por Planilla / Convenio');
  const [modalidadPagoDetalle, setModalidadPagoDetalle] = useState<
    'Pago Total (100%)' | 'Pago a Mitad (50% Abono / 50% Saldo)' | 'Pago en Cuotas'
  >('Pago Total (100%)');
  const [cuotasCantidad, setCuotasCantidad] = useState<3 | 6>(3);

  // Sincronizar catálogo en tiempo real si se suben nuevos armazones en Inventario
  useEffect(() => {
    const onStockUpdate = () => setCatalogoInventario(getInventario());
    window.addEventListener('amaru_stock_updated', onStockUpdate);
    window.addEventListener('storage', onStockUpdate);
    return () => {
      window.removeEventListener('amaru_stock_updated', onStockUpdate);
      window.removeEventListener('storage', onStockUpdate);
    };
  }, []);

  // Estados de proceso
  const [enviando, setEnviando] = useState<boolean>(false);
  const [enviadoExito, setEnviadoExito] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string>('');

  if (!isOpen) return null;

  const armazonActual =
    catalogoInventario.find((i) => i.sku === skuSeleccionado) || catalogoInventario[0];

  const toggleFiltro = (filtro: string) => {
    setFiltrosCristal((prev) =>
      prev.includes(filtro) ? prev.filter((f) => f !== filtro) : [...prev, filtro]
    );
  };

  // Cálculo de recargos ópticos + subtotal + beneficio previo de convenio
  const extraMaterial =
    materialCristal === 'Policarbonato'
      ? 12000
      : materialCristal === 'Mineral / Vidrio'
      ? 15000
      : 0;
  const extraFiltros =
    (filtrosCristal.includes('Filtro Luz Azul') ? 10000 : 0) +
    (filtrosCristal.includes('Filtro Luz Amarilla (Conducción / Baja Luz)') ? 12000 : 0);
  const extraAdelgazamiento =
    adelgazamiento === 'Adelgazado (1.61)'
      ? 18000
      : adelgazamiento === 'Ultra Delgado (1.67)'
      ? 32000
      : 0;

  const precioArmazonBase = armazonActual?.precioClp || 85000;
  const subtotalCotizacion = precioArmazonBase + extraMaterial + extraFiltros + extraAdelgazamiento;
  const tieneConvenioVigente =
    tipoUsuario === 'Convenio Minero' &&
    Boolean(codigoConvenio.trim()) &&
    Boolean(resultadoConvenio?.valido) &&
    !resultadoConvenio?.bloqueado;

  const beneficioConvenio = tieneConvenioVigente
    ? calcularBeneficioConvenio(codigoConvenio.trim().toUpperCase(), subtotalCotizacion)
    : null;
  const descuentoOCobertura = beneficioConvenio ? beneficioConvenio.descuentoOMontoCubierto : 0;
  const totalFinalAPagar = beneficioConvenio
    ? beneficioConvenio.totalAPagarCliente
    : subtotalCotizacion;
  const montoAbono50 = Math.round(totalFinalAPagar / 2);
  const montoSaldo50 = totalFinalAPagar - montoAbono50;
  const valorPorCuota = Math.round(totalFinalAPagar / cuotasCantidad);

  const cargarPreviewArchivo = (f: File) => {
    if (f.size <= 2 * 1024 * 1024 && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setArchivoPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(f);
    } else {
      setArchivoPreviewUrl(undefined);
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
      cargarPreviewArchivo(f);
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
      cargarPreviewArchivo(f);
    }
  };

  const handleValidarCodigoConvenio = (codigoOverride?: string) => {
    const target = (codigoOverride ?? codigoConvenio).trim().toUpperCase();
    if (!target) {
      setResultadoConvenio({
        valido: false,
        bloqueado: false,
        mensajeError: 'Ingresa un código de convenio sindical para validar.',
      });
      return;
    }
    // Consulta estrictamente de solo lectura (sin activar bloqueos ni descontar stock)
    const res = validarCodigoSindicato(target, rutFijo);
    setResultadoConvenio(res);
  };

  const convenioPaso1Valido =
    tipoUsuario !== 'Convenio Minero' ||
    (Boolean(codigoConvenio.trim()) &&
      Boolean(resultadoConvenio?.valido) &&
      !resultadoConvenio?.bloqueado);

  const paso1Habilitado = autorizacionLey && convenioPaso1Valido;

  const paso2Habilitado =
    tipoReceta === 'sin_receta' ||
    (Boolean(archivo) && declaracionVeracidadReceta);

  const avanzarPaso1a2 = () => {
    if (!nombreCompleto.trim()) {
      setErrorValidacion('Por favor ingresa tu Nombre y Apellido completo.');
      return;
    }
    if (!convenioPaso1Valido) {
      setErrorValidacion('Debes validar un Código de Convenio Sindical vigente o cambiar a Cliente Particular.');
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
    if (!paso2Habilitado) {
      setErrorValidacion('Debes adjuntar tu receta vigente y marcar la Declaración de Autenticidad Documental.');
      return;
    }
    setErrorValidacion('');
    setPasoActual(3);
  };

  const handleFinalizarSolicitud = () => {
    setEnviando(true);
    setErrorValidacion('');

    try {
      const resumenModalidad =
        modalidadPagoDetalle === 'Pago a Mitad (50% Abono / 50% Saldo)'
          ? `${metodoPago} · 50% Abono ($${montoAbono50.toLocaleString('es-CL')}) / 50% Saldo ($${montoSaldo50.toLocaleString('es-CL')})`
          : modalidadPagoDetalle === 'Pago en Cuotas'
          ? `${metodoPago} · ${cuotasCantidad} cuotas de $${valorPorCuota.toLocaleString('es-CL')}`
          : `${metodoPago} · Pago Total (100%)`;

      const codigoNormalizado =
        tipoUsuario === 'Convenio Minero' && codigoConvenio.trim()
          ? codigoConvenio.trim().toUpperCase()
          : undefined;

      const hashArchivoReceta = archivo
        ? `sha256_${archivo.name.replace(/[^a-zA-Z0-9]/g, '')}_${archivo.size}_${archivo.lastModified.toString(16)}`
        : undefined;

      const nuevaSolicitud = agregarSolicitudReceta({
        rut: rutFijo,
        nombre: nombreCompleto.trim(),
        correo: correoFijo,
        telefono,
        ciudad: 'Calama',
        tipoUsuario,
        empresa:
          tipoUsuario === 'Convenio Minero'
            ? resultadoConvenio?.infoSindicato?.empresa || empresaFaena
            : undefined,
        tipoReceta,
        archivoNombre: archivo?.name || archivoNombreSimulado,
        archivoPesoKb: archivo ? Math.max(1, Math.round(archivo.size / 1024)) : undefined,
        archivoPreviewUrl,
        hashArchivoReceta,
        dioptriasManuales: deseaDigitar,
        odEsfera: deseaDigitar ? odEsfera : undefined,
        odCilindro: deseaDigitar ? odCilindro : undefined,
        odEje: deseaDigitar ? odEje : undefined,
        oiEsfera: deseaDigitar ? oiEsfera : undefined,
        oiCilindro: deseaDigitar ? oiCilindro : undefined,
        oiEje: deseaDigitar ? oiEje : undefined,
        armazon: armazonActual?.nombre || 'Titanium Shield Pro',
        skuArmazon: armazonActual?.sku,
        materialCristal,
        filtrosCristal,
        adelgazamiento,
        contextoUso,
        especificacionesCliente: especificacionesCliente.trim() || undefined,
        subtotalOriginal: subtotalCotizacion,
        descuentoConvenio: descuentoOCobertura,
        metodoPago,
        modalidadPagoDetalle,
        cuotasCantidad: modalidadPagoDetalle === 'Pago en Cuotas' ? cuotasCantidad : undefined,
        monto: totalFinalAPagar,
        modalidadPago: resumenModalidad,
        origen: 'PORTAL_PACIENTE',
        consentimientoLey21719: true,
        codigoConvenio: codigoNormalizado,
        codigoConvenioEstado:
          codigoNormalizado && resultadoConvenio?.valido && !resultadoConvenio.bloqueado
            ? 'VIGENTE'
            : 'NO_APLICA',
        declaracionVeracidadReceta: tipoReceta === 'vigente' ? true : undefined,
        declaracionVeracidadAt: tipoReceta === 'vigente' ? new Date().toISOString() : undefined,
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
        setArchivo(null);
        setDeclaracionVeracidadReceta(false);
        setCodigoConvenio('');
        setResultadoConvenio(null);
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

                {/* SEDE OPERATIVA ACTIVA: SUCURSAL CALAMA */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                    Sucursal de Atención *
                  </label>
                  <div className="py-2 px-3 rounded-xl border bg-amaru-copper/15 border-amaru-copper text-amaru-copper text-xs font-bold flex items-center justify-between gap-1.5 shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>Sucursal Calama</span>
                    </span>
                    <span className="text-[10px] font-mono bg-white/80 dark:bg-black/30 px-2 py-0.5 rounded-full">
                      Sede Activa
                    </span>
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
                    onClick={() => {
                      setTipoUsuario('Particular');
                      setCodigoConvenio('');
                      setResultadoConvenio(null);
                      setErrorValidacion('');
                    }}
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

              {/* Selector EMPRESA / SINDICATO EN FAENA + Código Sindical si es Convenio */}
              {tipoUsuario === 'Convenio Minero' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1.5">
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

                  {/* Campo Obligatorio: CÓDIGO DE CONVENIO SINDICAL * */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/[0.05] dark:bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-amaru-copper" />
                        <span>Código de Convenio Sindical *</span>
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Validación en solo lectura
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Ej: SDC1326, SDE1126"
                          value={codigoConvenio}
                          onChange={(e) => {
                            setCodigoConvenio(e.target.value.toUpperCase());
                            setResultadoConvenio(null);
                          }}
                          onBlur={() => {
                            if (codigoConvenio.trim()) handleValidarCodigoConvenio();
                          }}
                          autoComplete="off"
                          className={`w-full px-3.5 py-2 bg-white dark:bg-[#1E1C1A] border rounded-xl font-mono text-xs uppercase text-slate-900 dark:text-white placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:outline-hidden transition-all ${
                            resultadoConvenio && (!resultadoConvenio.valido || resultadoConvenio.bloqueado)
                              ? 'border-rose-500 focus:ring-2 focus:ring-rose-400'
                              : resultadoConvenio?.valido
                              ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                              : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-amaru-copper'
                          }`}
                        />
                        {resultadoConvenio?.valido && !resultadoConvenio.bloqueado && (
                          <span className="absolute right-2.5 top-2 text-emerald-600">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleValidarCodigoConvenio()}
                        className="px-4 py-2 rounded-xl bg-[#B85D19] hover:bg-[#8F3B09] active:scale-[0.98] text-white font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-xs"
                      >
                        Validar Código
                      </button>
                    </div>

                    {resultadoConvenio && (
                      resultadoConvenio.valido && !resultadoConvenio.bloqueado ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold animate-in fade-in">
                          ✅ Código Vigente: {resultadoConvenio.infoSindicato?.nombre}
                          {resultadoConvenio.infoSindicato?.tipo === 'TIPO_B' && resultadoConvenio.infoSindicato.tope
                            ? ` · Cobertura hasta $${resultadoConvenio.infoSindicato.tope.toLocaleString('es-CL')} CLP`
                            : resultadoConvenio.infoSindicato?.porcentajeDescuento
                            ? ` · ${resultadoConvenio.infoSindicato.porcentajeDescuento}% Descuento Directo`
                            : ''}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-900 dark:text-rose-200 text-[11px] space-y-1 animate-in fade-in">
                          <p className="font-bold">
                            🚫 Código no vigente o inválido. Verifica con tu sindicato o cambia a Cliente Particular.
                          </p>
                          {resultadoConvenio.mensajeError && (
                            <p className="text-[10px] opacity-90">{resultadoConvenio.mensajeError}</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
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

              {/* Declaración Obligatoria de Veracidad y Autenticidad Documental (solo Receta Vigente) */}
              {tipoReceta === 'vigente' && (
                <label
                  className={`flex items-start gap-2.5 p-3.5 rounded-2xl border transition-all cursor-pointer animate-in fade-in duration-200 ${
                    declaracionVeracidadReceta
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-amber-500/[0.08] border-amber-500/35 hover:border-amber-500/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={declaracionVeracidadReceta}
                    onChange={(e) => {
                      setDeclaracionVeracidadReceta(e.target.checked);
                      if (e.target.checked) setErrorValidacion('');
                    }}
                    className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-amaru-copper accent-[#B85D19] cursor-pointer shrink-0"
                    required
                  />
                  <span className="text-[11px] text-slate-800 dark:text-zinc-200 leading-relaxed select-none">
                    <strong className="text-amber-900 dark:text-amber-300">
                      Declaración de Autenticidad Documental:
                    </strong>{' '}
                    Declaro bajo mi responsabilidad que la receta oftalmológica adjunta es fidedigna, legítima, emitida por un profesional habilitado y tiene menos de 365 días de antigüedad. Comprendo que la adulteración de documentos clínicos o el uso fraudulento de convenios será bloqueado y auditado conforme a la normativa sanitaria vigente.
                  </span>
                </label>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 3: COTIZACIÓN REAL, OPCIONES ÓPTICAS, CONVENIO, PAGO Y GARANTÍAS
             ══════════════════════════════════════════════════════════════════ */}
          {pasoActual === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 1. Selección de Armazón del Inventario Real (Sucursal Calama) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    1. Selecciona tu Armazón (Catálogo Real · Sucursal Calama) *
                  </label>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {catalogoInventario.length} modelos en catálogo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {catalogoInventario.map((item) => {
                    const isSelected = skuSeleccionado === item.sku;
                    const stockCalama = item.stock.Calama || 0;
                    return (
                      <div
                        key={item.sku}
                        onClick={() => setSkuSeleccionado(item.sku)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                            : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 truncate">
                              {item.sku}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                stockCalama > 0
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {stockCalama > 0 ? `${stockCalama} disp.` : 'Agotado'}
                            </span>
                          </div>
                          <div className="h-20 flex items-center justify-center my-1.5 bg-white rounded-xl p-1 border border-slate-200/70">
                            <ArmazonThumbnail
                              imagenUrl={item.imagenUrl}
                              nombre={item.nombre}
                              categoria={item.categoria}
                              size={36}
                              className="max-h-18"
                            />
                          </div>
                          {item.certificaciones && item.certificaciones.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {item.grupo && (
                                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                  {item.grupo}
                                </span>
                              )}
                              {item.certificaciones.map((c) => (
                                <span
                                  key={c}
                                  className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          <h5 className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                            {item.nombre}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {item.marca ? `${item.marca} · ` : ''}{item.material}
                          </p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white text-xs">
                          ${item.precioClp.toLocaleString('es-CL')} CLP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Configuración Óptica y Contexto de Uso del Cliente */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-3.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amaru-copper border-b border-slate-200/60 dark:border-white/5 pb-1.5">
                  2. Especificaciones Ópticas y Contexto de Uso
                </div>

                {/* Material del Cristal */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1.5">
                    Material del Cristal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'Orgánico / Plástico', extra: 'Incluido' },
                        { id: 'Policarbonato', extra: '+$12.000' },
                        { id: 'Mineral / Vidrio', extra: '+$15.000' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMaterialCristal(m.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          materialCristal === m.id
                            ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                            : 'bg-white dark:bg-[#1E1C1A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="block text-[11px] leading-tight">{m.id}</span>
                        <span className="text-[9px] font-mono opacity-80">{m.extra}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tratamientos / Filtros */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1.5">
                    Tratamientos / Filtros Ópticos
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Filtro UV', extra: 'Incluido' },
                      { id: 'Filtro Luz Azul', extra: '+$10.000' },
                      { id: 'Filtro Luz Amarilla (Conducción / Baja Luz)', extra: '+$12.000' },
                    ].map((f) => {
                      const activo = filtrosCristal.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFiltro(f.id)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                            activo
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-white dark:bg-[#1E1C1A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <span className="text-[10.5px] leading-tight">{f.id}</span>
                          <span className="text-[9px] font-mono shrink-0">{f.extra}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Adelgazamiento (Índice) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1.5">
                    Adelgazamiento (Índice Refractivo)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'Estándar (1.56)', extra: 'Base' },
                        { id: 'Adelgazado (1.61)', extra: '+$18.000' },
                        { id: 'Ultra Delgado (1.67)', extra: '+$32.000' },
                      ] as const
                    ).map((idx) => (
                      <button
                        key={idx.id}
                        type="button"
                        onClick={() => setAdelgazamiento(idx.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          adelgazamiento === idx.id
                            ? 'bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-200 font-bold'
                            : 'bg-white dark:bg-[#1E1C1A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="block text-[11px] leading-tight">{idx.id}</span>
                        <span className="text-[9px] font-mono opacity-80">{idx.extra}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contexto de Uso y Especificaciones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                      Contexto Principal de Uso
                    </label>
                    <select
                      value={contextoUso}
                      onChange={(e) => setContextoUso(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amaru-copper"
                    >
                      <option value="Faena minera">Faena minera / Operación en terreno</option>
                      <option value="Turno nocturno">Turno nocturno / Baja luminosidad</option>
                      <option value="Pantallas / Oficina">Pantallas / Computador / Oficina</option>
                      <option value="Conducción">Conducción urbana y carretera</option>
                      <option value="Lectura">Lectura y uso cotidiano</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                      Especificaciones Adicionales del Cliente
                    </label>
                    <input
                      type="text"
                      value={especificacionesCliente}
                      onChange={(e) => setEspecificacionesCliente(e.target.value)}
                      placeholder="Ej: sensibilidad al brillo, ajuste de puente..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amaru-copper"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Desglose Financiero con Beneficio Previo de Convenio */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
                  <span>Subtotal (Armazón + Cristal + Tratamientos):</span>
                  <span className="font-mono font-bold">${subtotalCotizacion.toLocaleString('es-CL')} CLP</span>
                </div>

                {tieneConvenioVigente && beneficioConvenio && (
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                    <div>
                      <span className="font-bold block">
                        ✅ Beneficio Convenio {codigoConvenio.toUpperCase()} ({resultadoConvenio?.infoSindicato?.nombre})
                      </span>
                      <span className="text-[10px] opacity-85">{beneficioConvenio.detalleTexto}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 shrink-0">
                      - ${descuentoOCobertura.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    {tipoUsuario === 'Convenio Minero' ? (
                      <Receipt size={15} className="text-amaru-copper" />
                    ) : (
                      <CreditCard size={15} className="text-sky-500" />
                    )}
                    Total Final a Pagar
                  </span>
                  <span className="font-mono font-black text-base text-amaru-copper">
                    ${totalFinalAPagar.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              {/* 4. Método de Pago y Modalidad (100% / 50% Mitad / Cuotas) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amaru-copper"
                    >
                      <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                      <option value="Débito / Crédito">Débito / Crédito</option>
                      <option value="Efectivo en Sucursal Calama">Efectivo en Sucursal Calama</option>
                      <option value="Descuento por Planilla / Convenio">Descuento por Planilla / Convenio</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                      Modalidad de Pago *
                    </label>
                    <select
                      value={modalidadPagoDetalle}
                      onChange={(e) =>
                        setModalidadPagoDetalle(
                          e.target.value as
                            | 'Pago Total (100%)'
                            | 'Pago a Mitad (50% Abono / 50% Saldo)'
                            | 'Pago en Cuotas'
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amaru-copper"
                    >
                      <option value="Pago Total (100%)">Pago Total (100%)</option>
                      <option value="Pago a Mitad (50% Abono / 50% Saldo)">
                        Pago a Mitad (50% Abono / 50% Saldo)
                      </option>
                      <option value="Pago en Cuotas">Pago en Cuotas</option>
                    </select>
                  </div>
                </div>

                {modalidadPagoDetalle === 'Pago a Mitad (50% Abono / 50% Saldo)' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-2 gap-3 text-xs animate-in fade-in">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                        Abono Inicial (50%)
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        ${montoAbono50.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                        Saldo al Retirar (50%)
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        ${montoSaldo50.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                )}

                {modalidadPagoDetalle === 'Pago en Cuotas' && (
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200">Cuotas:</span>
                      {([3, 6] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCuotasCantidad(c)}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                            cuotasCantidad === c
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#1E1C1A] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {c} cuotas
                        </button>
                      ))}
                    </div>
                    <div className="font-mono font-black text-sky-900 dark:text-sky-200">
                      {cuotasCantidad}x ${valorPorCuota.toLocaleString('es-CL')} CLP/mes
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Titular: <strong>{nombreCompleto}</strong> (RUT: {rutFijo}) · Retiro en <strong>Sucursal Calama</strong>.
                </p>
              </div>

              {/* 5. Políticas de Garantía (Cristal, Marco Roto y Equivocación de Especificación) */}
              <PoliticasGarantiaBox compact />
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
                disabled={!paso1Habilitado}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                  paso1Habilitado
                    ? 'btn-copper cursor-pointer shadow-sm hover:scale-105 active:scale-95'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed opacity-60 shadow-none'
                }`}
                title={
                  !convenioPaso1Valido
                    ? 'Valida un código de convenio sindical vigente o cambia a Cliente Particular'
                    : !autorizacionLey
                    ? 'Debes autorizar el consentimiento legal para continuar'
                    : undefined
                }
              >
                <span>Continuar a Validación Clínica (Paso 2)</span>
                <ArrowRight size={14} />
              </button>
            )}

            {pasoActual === 2 && (
              <button
                type="button"
                onClick={avanzarPaso2a3}
                disabled={!paso2Habilitado}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                  paso2Habilitado
                    ? 'btn-copper cursor-pointer shadow-sm hover:scale-105 active:scale-95'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed opacity-60 shadow-none'
                }`}
                title={
                  !paso2Habilitado
                    ? 'Debes adjuntar el archivo de tu receta vigente y marcar la Declaración de Autenticidad Documental'
                    : undefined
                }
              >
                <span>Continuar a Cotización &amp; Pago (Paso 3)</span>
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
