import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
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
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Inbox,
  ShoppingBag,
  HeartPulse,
  Glasses,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { db } from '../db/dexie';
import { sincronizarColaOffline } from '../sw/syncService';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';
import { RecetaModal } from '../components/RecetaModal';
import { ReservaHoraWidget } from '../components/ReservaHoraWidget';
import { type RecetaOpticaItem } from '../services/clinicoService';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import {
  TitanioProIcon,
  AcetatoLumiereIcon,
  UltralightFlexIcon,
} from '../components/icons/ArmazonesSVGs';
import {
  getInventario,
  getSucursalActiva,
  setSucursalActiva,
  descontarStock,
  type ItemInventario,
} from '../services/inventarioService';
import {
  getSolicitudesRecetas,
  cambiarEstadoSolicitud,
  type SolicitudReceta,
} from '../services/recetasService';

interface TerminalViewProps {
  isOnline: boolean;
  onSessionExpired: () => void;
}

const EMPRESAS_CONVENIO = [
  'Minera Centinela · Faena Esperanza',
  'Minera Escondida · Sindicato N° 1',
  'Codelco Chuquicamata · Sindicato N° 2',
  'Minera Zaldívar · Faena Cordillera',
  'Minera Collahuasi · Faena Patache',
  'Albemarle Planta Salar · Faena Atacama',
];

// Base demo de clientes frecuentes para autocompletado inteligente
const CLIENTES_FRECUENTES_DEMO: Record<
  string,
  {
    nombre: string;
    telefono: string;
    email: string;
    ciudad: 'Calama' | 'Antofagasta';
    tipo: 'Particular' | 'Convenio' | 'Isapre';
    empresa?: string;
  }
> = {
  '18234567-8': {
    nombre: 'Miguel Jorge Valenzuela',
    telefono: '+56 9 8586 0973',
    email: 'm.jorge@minera-norte.cl',
    ciudad: 'Calama',
    tipo: 'Convenio',
    empresa: 'Minera Centinela · Faena Esperanza',
  },
  '24533343-9': {
    nombre: 'Mario Cárdenas González',
    telefono: '+56 9 7654 3210',
    email: 'mario.cardenas@escondida.cl',
    ciudad: 'Antofagasta',
    tipo: 'Convenio',
    empresa: 'Minera Escondida · Sindicato N° 1',
  },
  '18923456-7': {
    nombre: 'Claudia Soto Valenzuela',
    telefono: '+56 9 9123 4567',
    email: 'claudia.soto@gmail.com',
    ciudad: 'Calama',
    tipo: 'Particular',
  },
  '15678901-2': {
    nombre: 'Patricia Morales Duarte',
    telefono: '+56 9 8234 5678',
    email: 'pmorales@chuqui.cl',
    ciudad: 'Calama',
    tipo: 'Convenio',
    empresa: 'Codelco Chuquicamata · Sindicato N° 2',
  },
};

const TerminalView: React.FC<TerminalViewProps> = ({ isOnline, onSessionExpired: _onSessionExpired }) => {
  // ── Control de Pasos del Wizard (1, 2, 3) ───────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ── Sucursal Activa ────────────────────────────────────────────────────────
  const [sucursalActiva, setSucursalActivaState] = useState<'Calama' | 'Antofagasta'>(() => getSucursalActiva());

  // ── Inventario y Catálogo en Vivo ──────────────────────────────────────────
  const [catalogo, setCatalogo] = useState<ItemInventario[]>(() => getInventario());

  // ── Solicitudes Web de Pacientes ('EN_REVISION') ────────────────────────────
  const [solicitudesWeb, setSolicitudesWeb] = useState<SolicitudReceta[]>([]);
  const [bandejaWebAbierta, setBandejaWebAbierta] = useState<boolean>(true);

  // ── Paso 1: Identificación del Paciente y Modalidad ─────────────────────────
  const [rutPaciente, setRutPaciente] = useState('');
  const [errorRutPaciente, setErrorRutPaciente] = useState('');
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [telefonoPaciente, setTelefonoPaciente] = useState('');
  const [emailPaciente, setEmailPaciente] = useState('');
  const [clienteReconocido, setClienteReconocido] = useState<boolean>(false);
  const [tipoUsuario, setTipoUsuario] = useState<'Particular' | 'Convenio' | 'Isapre'>('Convenio');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(EMPRESAS_CONVENIO[0]);
  const [autorizacionBiometrica, setAutorizacionBiometrica] = useState(false);

  // ── Paso 2: Validación Clínica y Armazón ─────────────────────────────────────
  const [tipoReceta, setTipoReceta] = useState<'vigente' | 'vencida'>('vigente');
  const [mostrarModalReceta, setMostrarModalReceta] = useState(false);
  const [recetaActiva, setRecetaActiva] = useState<RecetaOpticaItem | null>(null);
  const [skuSeleccionado, setSkuSeleccionado] = useState('EPP-TITAN-001');
  const [montoTotal, setMontoTotal] = useState('85000');

  // ── Paso 3: Cotización, Stock y Medio de Pago ──────────────────────────────
  const [modalidadPago, setModalidadPago] = useState<'Planilla' | 'Abono50' | 'Total'>('Planilla');
  const [rutTitular, setRutTitular] = useState('');
  const [errorRutTitular, setErrorRutTitular] = useState('');
  const [esMismoTitular, setEsMismoTitular] = useState(true);
  const [numCuotas, setNumCuotas] = useState<number>(3);

  // Feedback y mensajes
  const [mensajeSync, setMensajeSync] = useState('');

  // Sincronizar catálogo y sucursal
  const refrescarDatos = () => {
    setCatalogo(getInventario());
    setSucursalActivaState(getSucursalActiva());
    const todas = getSolicitudesRecetas();
    setSolicitudesWeb(todas.filter((s) => s.estado === 'EN_REVISION'));
  };

  useEffect(() => {
    refrescarDatos();

    // Precargar armazón si viene desde la vitrina de Inventario & Stock
    const precargadoRaw = localStorage.getItem('amaru_armazon_precargado');
    if (precargadoRaw) {
      try {
        const precargado = JSON.parse(precargadoRaw);
        if (precargado.sku) {
          setSkuSeleccionado(precargado.sku);
          if (precargado.precio) setMontoTotal(precargado.precio.toString());
          setMensajeSync(`✓ Armazón seleccionado desde vitrina: ${precargado.nombre} (${precargado.sku})`);
        }
      } catch {
        // Ignorar error parsing
      } finally {
        localStorage.removeItem('amaru_armazon_precargado');
      }
    }

    const handleStockEvent = () => setCatalogo(getInventario());
    const handleRecetasEvent = () => {
      const todas = getSolicitudesRecetas();
      setSolicitudesWeb(todas.filter((s) => s.estado === 'EN_REVISION'));
    };
    const handleSucursalEvent = () => setSucursalActivaState(getSucursalActiva());

    window.addEventListener('amaru_stock_updated', handleStockEvent);
    window.addEventListener('amaru_recetas_updated', handleRecetasEvent);
    window.addEventListener('amaru_sucursal_updated', handleSucursalEvent);
    window.addEventListener('storage', refrescarDatos);

    return () => {
      window.removeEventListener('amaru_stock_updated', handleStockEvent);
      window.removeEventListener('amaru_recetas_updated', handleRecetasEvent);
      window.removeEventListener('amaru_sucursal_updated', handleSucursalEvent);
      window.removeEventListener('storage', refrescarDatos);
    };
  }, []);

  // Saludo dinámico según hora
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días';
    if (hora < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // ── Buscador Inteligente por RUT ───────────────────────────────────────────
  const procesarBusquedaRut = (rutRaw: string) => {
    const limpio = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 8) {
      setClienteReconocido(false);
      return;
    }

    // 1. Buscar en Clientes Frecuentes Demo
    for (const [keyRut, datos] of Object.entries(CLIENTES_FRECUENTES_DEMO)) {
      if (keyRut.replace(/[^0-9kK]/g, '').toUpperCase() === limpio) {
        setNombrePaciente(datos.nombre);
        setTelefonoPaciente(datos.telefono);
        setEmailPaciente(datos.email);
        setSucursalActivaState(datos.ciudad);
        setSucursalActiva(datos.ciudad);
        setTipoUsuario(datos.tipo);
        if (datos.empresa) setEmpresaSeleccionada(datos.empresa);
        setClienteReconocido(true);
        if (esMismoTitular) setRutTitular(formatearRUT(rutRaw));
        return;
      }
    }

    // 2. Buscar en solicitudes previas de pacientes
    const solicitudes = getSolicitudesRecetas();
    const encontrada = solicitudes.find(
      (s) => s.rut.replace(/[^0-9kK]/g, '').toUpperCase() === limpio
    );
    if (encontrada) {
      setNombrePaciente(encontrada.nombre);
      if (encontrada.telefono) setTelefonoPaciente(encontrada.telefono);
      if (encontrada.correo) setEmailPaciente(encontrada.correo);
      if (encontrada.ciudad) {
        setSucursalActivaState(encontrada.ciudad);
        setSucursalActiva(encontrada.ciudad);
      }
      if (encontrada.tipoUsuario === 'Convenio Minero') {
        setTipoUsuario('Convenio');
        if (encontrada.empresa) setEmpresaSeleccionada(encontrada.empresa);
      } else {
        setTipoUsuario('Particular');
      }
      setClienteReconocido(true);
      if (esMismoTitular) setRutTitular(formatearRUT(rutRaw));
      return;
    }

    setClienteReconocido(false);
  };

  const handleRutPacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutPaciente(v);
    if (v.length > 3) {
      setErrorRutPaciente(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
      if (validarRUT(v)) procesarBusquedaRut(v);
    } else {
      setErrorRutPaciente('');
      setClienteReconocido(false);
    }
  };

  const handleRutPacienteBlur = () => {
    if (!rutPaciente) return;
    const f = formatearRUT(rutPaciente);
    setRutPaciente(f);
    const esValido = validarRUT(f);
    setErrorRutPaciente(esValido ? '' : 'RUT inválido (Módulo 11)');
    if (esValido) {
      procesarBusquedaRut(f);
      if (esMismoTitular) setRutTitular(f);
    }
  };

  // Cargar Solicitud Web de Paciente en el Wizard
  const handleCargarSolicitudWeb = (sol: SolicitudReceta) => {
    setRutPaciente(formatearRUT(sol.rut));
    setNombrePaciente(sol.nombre);
    setTelefonoPaciente(sol.telefono || '');
    setEmailPaciente(sol.correo || '');
    setSucursalActivaState(sol.ciudad);
    setSucursalActiva(sol.ciudad);
    setTipoUsuario(sol.tipoUsuario === 'Convenio Minero' ? 'Convenio' : 'Particular');
    if (sol.empresa) setEmpresaSeleccionada(sol.empresa);
    setClienteReconocido(true);
    setAutorizacionBiometrica(true);

    if (sol.armazon) {
      const match = catalogo.find(
        (i) => i.nombre.toLowerCase() === sol.armazon.toLowerCase()
      );
      if (match) {
        setSkuSeleccionado(match.sku);
        setMontoTotal(match.precioClp.toString());
      }
    }

    if (esMismoTitular) setRutTitular(formatearRUT(sol.rut));

    setMensajeSync(`✓ Pre-ingreso web cargado para ${sol.nombre} (${sol.rut}).`);
    setCurrentStep(1);
  };

  // Validar y Aprobar Stock directo desde la bandeja
  const handleAprobarSolicitudDirecta = (sol: SolicitudReceta) => {
    cambiarEstadoSolicitud(sol.id, 'APROBADA');
    descontarStock(sol.armazon, sol.ciudad, 1);
    refrescarDatos();
    setMensajeSync(`✓ Solicitud de ${sol.nombre} aprobada. Se descontó 1 unidad de stock en ${sol.ciudad}.`);
  };

  // Validaciones de pasos
  const paso1Valido =
    !!rutPaciente &&
    validarRUT(rutPaciente) &&
    nombrePaciente.trim().length >= 3 &&
    !!telefonoPaciente.trim() &&
    autorizacionBiometrica;

  const paso2Valido =
    tipoReceta === 'vigente' && !!skuSeleccionado;

  const paso3Valido =
    (modalidadPago !== 'Planilla' || (!!rutTitular && validarRUT(rutTitular))) &&
    Number(montoTotal) > 0;

  const handleLimpiarTodo = () => {
    setRutPaciente('');
    setNombrePaciente('');
    setTelefonoPaciente('');
    setEmailPaciente('');
    setErrorRutPaciente('');
    setRutTitular('');
    setErrorRutTitular('');
    setClienteReconocido(false);
    setAutorizacionBiometrica(false);
    setTipoReceta('vigente');
    setRecetaActiva(null);
    setCurrentStep(1);
    setMensajeSync('Formulario de atención restablecido con éxito.');
  };

  // Finalizar Atención
  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paso3Valido) return;

    const nuevoFolio = `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`;
    const cuotaMonto = Math.round(Number(montoTotal) / numCuotas).toString();

    // Generar cuotas para modalidad planilla
    const cuotasArray =
      modalidadPago === 'Planilla'
        ? Array.from({ length: numCuotas }, (_, idx) => {
            const d = new Date();
            d.setMonth(d.getMonth() + idx + 1);
            return {
              numero_cuota: idx + 1,
              monto_cuota: cuotaMonto,
              mes_ejecucion: d.toISOString().split('T')[0],
            };
          })
        : [];

    // Guardar en Dexie cola de pedidos
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

    // Descontar 1 unidad en el inventario de la sucursal activa
    descontarStock(skuSeleccionado, sucursalActiva, 1);

    // Notificar eventos reactivos
    window.dispatchEvent(new CustomEvent('amaru_sync_updated'));
    window.dispatchEvent(new Event('amaru_stock_updated'));

    if (isOnline) {
      sincronizarColaOffline().catch(() => {});
    }

    setMensajeSync(
      `✓ Venta registrada exitosamente (Folio: ${nuevoFolio}) para ${nombrePaciente}. Stock descontado en ${sucursalActiva}.`
    );

    // Resetear formulario
    handleLimpiarTodo();
  };

  const handleRecetaGuardada = (receta: RecetaOpticaItem) => {
    setRecetaActiva(receta);
    setTipoReceta('vigente');
    setMensajeSync(`✓ Receta médica ${receta.id_receta.slice(0, 8)} asociada.`);
  };

  const armazonActualInfo = catalogo.find((i) => i.sku === skuSeleccionado);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200 font-sans">
      {/* ── 1. Banner de Bienvenida Cálido y Amigable al Vendedor ── */}
      <div className="card-zenith optical-sheen rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.02] to-transparent border border-amber-500/25 dark:border-amber-500/35 shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-amaru-copper animate-pulse" />
              <span>Terminal de Ventas & Atención Mesón</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {getSaludo()}, equipo Amaru!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              Listos para una gran jornada en <strong className="text-amaru-copper">Sucursal {sucursalActiva}</strong>. Atención clínica, boutique óptica y convenios en un solo flujo ágil.
            </p>
          </div>

          {/* Mini-Resumen de Turno en 3 Píldoras Amigables */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBandejaWebAbierta(!bandejaWebAbierta)}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                solicitudesWeb.length > 0
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-white/80 dark:bg-black/30 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/10'
              }`}
            >
              <Inbox size={15} className="text-amaru-copper" />
              <span>📋 {solicitudesWeb.length} Solicitud{solicitudesWeb.length === 1 ? '' : 'es'} Web</span>
              {solicitudesWeb.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <div className="px-3 py-2 rounded-2xl bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2 shadow-2xs">
              <ShoppingBag size={15} className="text-sky-500" />
              <span>📦 4 Lentes para entregar hoy</span>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>👓 Stock sincronizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Bandeja Rápida de Solicitudes Web de Pacientes ('EN_REVISION') ── */}
      {solicitudesWeb.length > 0 && bandejaWebAbierta && (
        <div className="card-zenith rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amaru-copper">
                <Inbox size={16} />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Bandeja Rápida · Pre-Ingresos Web de Pacientes ({solicitudesWeb.length} Pendientes)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setBandejaWebAbierta(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              Ocultar bandeja
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {solicitudesWeb.map((sol) => (
              <div
                key={sol.id}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {sol.nombre}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      {formatearRUT(sol.rut)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 uppercase shrink-0">
                    {sol.ciudad}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-zinc-300 space-y-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Glasses size={12} className="text-amaru-copper shrink-0" />
                    <span className="font-semibold truncate">{sol.armazon}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-[10px]">
                    <FileText size={11} className="shrink-0" />
                    <span className="truncate">{sol.archivoNombre}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                  {sol.telefono && (
                    <a
                      href={`https://wa.me/${sol.telefono.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(sol.nombre)},%20te%20saludamos%20desde%20%C3%93ptica%20Amaru%20Sucursal%20${sol.ciudad}.%20Recibimos%20tu%20receta%20para%20los%20lentes%20${encodeURIComponent(sol.armazon)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                      title="Contactar al paciente por WhatsApp"
                    >
                      <WhatsAppIcon size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCargarSolicitudWeb(sol)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amaru-copper/10 hover:bg-amaru-copper/20 text-amaru-copper font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Cargar en Atención</span>
                    <ArrowRight size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAprobarSolicitudDirecta(sol)}
                    className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                    title="Aprobar directamente y descontar stock"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast de Feedback */}
      {mensajeSync && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{mensajeSync}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeSync('')}
            className="text-xs text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 3. Wizard Moderno de 3 Pasos ── */}
      <div className="w-full max-w-4xl mx-auto">
        <section className="card-zenith rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-white/10 shadow-sm transition-all">
          {/* Stepper Superior */}
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: 'Identificación & Modalidad' },
                { step: 2, label: 'Clínica & Armazón' },
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
                            ? 'bg-amaru-copper text-white shadow-md shadow-orange-600/30 ring-2 ring-amaru-copper/30'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
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
                            : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                          currentStep > item.step ? 'bg-emerald-500' : 'bg-slate-200 dark:border-white/10'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════ PASO 1: IDENTIFICACIÓN DEL PACIENTE Y MODALIDAD ════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="pb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <User size={18} />
                  <span>Paso 1: Identificación del Paciente y Modalidad</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Búsqueda inteligente por RUT, datos de contacto del paciente y convenio aplicable
                </p>
              </div>

              {/* RUT Paciente con Buscador Inteligente */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    RUT del Paciente <span className="text-amaru-copper">*</span>
                  </label>
                  {clienteReconocido && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <BadgeCheck size={14} className="text-emerald-500" />
                      <span>✓ Cliente frecuente reconocido en Óptica Amaru</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="12.345.678-9 (digita y pulsa Tab para autocompletar)"
                  value={rutPaciente}
                  onChange={handleRutPacienteChange}
                  onBlur={handleRutPacienteBlur}
                  maxLength={12}
                  className={`w-full bg-slate-50 dark:bg-black/30 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-mono font-medium outline-hidden transition-all ${
                    errorRutPaciente
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                      : clienteReconocido
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10'
                      : 'border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-amaru-copper'
                  }`}
                />
                {errorRutPaciente && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {errorRutPaciente}
                  </p>
                )}
              </div>

              {/* Nombre y Apellido */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Nombre Completo del Paciente <span className="text-amaru-copper">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Miguel Jorge Valenzuela"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-amaru-copper rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden transition-all"
                />
              </div>

              {/* Teléfono WhatsApp y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                    Teléfono Móvil / WhatsApp <span className="text-amaru-copper">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                      <Phone size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="+56 9 8586 0973"
                      value={telefonoPaciente}
                      onChange={(e) => setTelefonoPaciente(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amaru-copper outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                    Correo Electrónico (Boleta/Garantía)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      placeholder="paciente@correo.cl"
                      value={emailPaciente}
                      onChange={(e) => setEmailPaciente(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amaru-copper outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Sucursal de Atención */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Sucursal de Atención / Mesón <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSucursalActivaState('Calama');
                      setSucursalActiva('Calama');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      sucursalActiva === 'Calama'
                        ? 'border-amaru-copper bg-amaru-copper/15 text-amaru-copper ring-2 ring-amaru-copper/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <MapPin size={14} />
                    <span>📍 Sucursal Calama</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSucursalActivaState('Antofagasta');
                      setSucursalActiva('Antofagasta');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      sucursalActiva === 'Antofagasta'
                        ? 'border-amaru-copper bg-amaru-copper/15 text-amaru-copper ring-2 ring-amaru-copper/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <MapPin size={14} />
                    <span>📍 Sucursal Antofagasta</span>
                  </button>
                </div>
              </div>

              {/* Modalidad de Atención Omnicanal: Particular vs Convenio Minero vs Isapre */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                  Modalidad de Atención <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setTipoUsuario('Particular')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      tipoUsuario === 'Particular'
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-sky-500" />
                        Particular / Boutique
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Atención clínica particular con boleta médica y Webpay.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipoUsuario('Convenio')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      tipoUsuario === 'Convenio'
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building size={14} className="text-amaru-copper" />
                        Convenio Corporativo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Descuento por planilla en faena minera y subsidio sindicato.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipoUsuario('Isapre')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      tipoUsuario === 'Isapre'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <HeartPulse size={14} className="text-emerald-500" />
                        Convenio Salud / Isapre
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Reembolso complementario I-Med y Fonasa MLE.
                    </p>
                  </div>
                </div>

                {/* Badges de Ayuda al Vendedor según tipo */}
                {tipoUsuario === 'Convenio' && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                      <CheckCircle2 size={14} className="text-amaru-copper" />
                      <span>✓ Beneficio Convenio Activo · Tope Cobertura: $150.000 CLP</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                        Empresa / Sindicato en Faena *
                      </label>
                      <select
                        value={empresaSeleccionada}
                        onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amaru-copper outline-hidden"
                      >
                        {EMPRESAS_CONVENIO.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {tipoUsuario === 'Isapre' && (
                  <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2 animate-in fade-in duration-150">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>✓ Cobertura Isapre / Fonasa Nivel 3 · Reembolso Inmediato I-Med en Mesón</span>
                  </div>
                )}
              </div>

              {/* Consentimiento Activo Estricto Ley 21.719 y Ley 21.663 */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autorizacionBiometrica}
                  onChange={(e) => setAutorizacionBiometrica(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-amaru-copper focus:ring-amaru-copper cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed select-none">
                  <strong>Consentimiento Clínico y Ciberseguridad (Ley N° 21.719 y Ley N° 21.663):</strong> El paciente autoriza a Óptica Amaru al resguardo confidencial de sus datos refractivos y receta oftálmica para la fabricación y entrega técnica en sucursal.
                </span>
              </label>

              {/* Botón Siguiente Paso */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!paso1Valido}
                  onClick={() => setCurrentStep(2)}
                  className={`w-full font-bold uppercase tracking-wider rounded-xl text-xs py-3.5 transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso1Valido
                      ? 'btn-copper cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continuar a Selección de Clínica y Armazón (Paso 2)</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ════════════ PASO 2: VALIDACIÓN CLÍNICA Y ARMAZÓN ════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <Glasses size={18} />
                  <span>Paso 2: Validación Clínica y Selección de Armazón</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Verificación de receta médica vigente (&lt; 365 días) y elección de montura con stock real
                </p>
              </div>

              {/* Selector de Receta Vigente vs Vencida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setTipoReceta('vigente')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    tipoReceta === 'vigente'
                      ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
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
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      1) Posee receta vigente (&lt; 365 días)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Permite elegir armazón y pasar a cotización inmediata
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setTipoReceta('vencida');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    tipoReceta === 'vencida'
                      ? 'border-amber-600 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoReceta"
                    checked={tipoReceta === 'vencida'}
                    onChange={() => setTipoReceta('vencida')}
                    className="mt-0.5 text-amber-600 accent-amber-600 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      2) Sin receta o requiere evaluación
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Agenda hora con tecnólogo médico u optometrista
                    </p>
                  </div>
                </div>
              </div>

              {/* Rama 1: Receta Vigente */}
              {tipoReceta === 'vigente' && (
                <div className="space-y-4 pt-1">
                  {/* Ficha de Refracción / Botón para ingresar receta */}
                  {recetaActiva ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 transition-all space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <Eye size={15} className="text-emerald-600" />
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
                            <tr className="border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold uppercase">
                              <th className="py-1 px-2">Ojo</th>
                              <th className="py-1 px-2 text-center">SPH</th>
                              <th className="py-1 px-2 text-center">CYL</th>
                              <th className="py-1 px-2 text-center">AXIS</th>
                              <th className="py-1 px-2 text-center">ADD</th>
                              <th className="py-1 px-2 text-center">DP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-500/10 font-mono text-slate-900 dark:text-white">
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
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          Parámetros de Refracción Oftálmica
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Digita los valores OD/OI de la receta para el montaje en laboratorio
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarModalReceta(true)}
                        className="text-xs font-bold text-amaru-copper border border-amaru-copper/40 hover:bg-amaru-copper hover:text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        + Ingresar Parámetros
                      </button>
                    </div>
                  )}

                  {/* Catálogo de Armazones con Stock en Vivo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        Selecciona el Armazón en Stock ({sucursalActiva}) <span className="text-amaru-copper">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Semáforo en tiempo real
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {catalogo.slice(0, 3).map((arm) => {
                        const isSelected = skuSeleccionado === arm.sku;
                        const stockActual = arm.stock[sucursalActiva] || 0;

                        return (
                          <div
                            key={arm.sku}
                            onClick={() => {
                              setSkuSeleccionado(arm.sku);
                              setMontoTotal(arm.precioClp.toString());
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper shadow-xs'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1 mb-2">
                                <span className="font-mono text-[10px] font-bold text-amaru-copper bg-amaru-copper/10 px-2 py-0.5 rounded-md">
                                  {arm.sku}
                                </span>
                                {stockActual >= 5 ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    🟢 {stockActual} disp.
                                  </span>
                                ) : stockActual > 0 ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                    🟡 Últimas {stockActual} unid.
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 border border-rose-500/30">
                                    🔴 Agotado
                                  </span>
                                )}
                              </div>

                              {/* Ilustración SVG */}
                              <div className="py-3 flex items-center justify-center">
                                {arm.sku === 'EPP-TITAN-001' && <TitanioProIcon size={34} className="text-amaru-copper" />}
                                {arm.sku === 'BOUT-ACET-002' && <AcetatoLumiereIcon size={34} className="text-amaru-copper" />}
                                {arm.sku === 'FLEX-STEEL-003' && <UltralightFlexIcon size={34} className="text-amaru-copper" />}
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                {arm.nombre}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                                {arm.material}
                              </p>
                            </div>

                            <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-white/5 flex items-baseline justify-between">
                              <span className="text-[10px] text-slate-400 uppercase">Total:</span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                ${arm.precioClp.toLocaleString('es-CL')} CLP
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
                      className="px-4 py-3 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} />
                      <span>Volver</span>
                    </button>
                    <button
                      type="button"
                      disabled={!paso2Valido}
                      onClick={() => setCurrentStep(3)}
                      className={`flex-1 font-bold uppercase tracking-wider rounded-xl text-xs py-3.5 transition-all flex items-center justify-center gap-2 shadow-md ${
                        paso2Valido
                          ? 'btn-copper cursor-pointer active:scale-[0.99]'
                          : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>Continuar a Cotización y Pago (Paso 3)</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Rama 2: Sin Receta (Embudo de Policlínico) */}
              {tipoReceta === 'vencida' && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <ReservaHoraWidget
                    rutPaciente={rutPaciente}
                    nombrePaciente={nombrePaciente}
                    onVolverInicio={handleLimpiarTodo}
                    onReservaExitosa={(detalle) => {
                      setMensajeSync(
                        `✓ Evaluación oftalmológica agendada para ${detalle.rut}: ${detalle.fecha} (${detalle.bloque}) en ${sucursalActiva}.`
                      );
                    }}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver a Identificación (Paso 1)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════ PASO 3: COTIZACIÓN, STOCK EN VIVO Y MEDIO DE PAGO ════════════ */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalizarPedido} className="space-y-5 animate-in fade-in duration-200" noValidate>
              <div className="pb-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <CreditCard size={18} />
                  <span>Paso 3: Cotización, Stock en Vivo y Medio de Pago</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Modalidad de cobro, cuotas por planilla o abono en mesón con descuento automático de stock
                </p>
              </div>

              {/* Resumen de Montura y Stock en Vivo */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10">
                    {skuSeleccionado === 'EPP-TITAN-001' && <TitanioProIcon size={28} className="text-amaru-copper" />}
                    {skuSeleccionado === 'BOUT-ACET-002' && <AcetatoLumiereIcon size={28} className="text-amaru-copper" />}
                    {skuSeleccionado === 'FLEX-STEEL-003' && <UltralightFlexIcon size={28} className="text-amaru-copper" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {armazonActualInfo?.nombre || skuSeleccionado}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Sucursal de Despacho: <strong>{sucursalActiva}</strong> (Disponible: {armazonActualInfo?.stock[sucursalActiva] || 0} un.)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    ${Number(montoTotal).toLocaleString('es-CL')}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">
                    CLP Total
                  </span>
                </div>
              </div>

              {/* Selector de Modalidad de Pago / Abono */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                  Modalidad de Pago / Abono <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setModalidadPago('Planilla')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      modalidadPago === 'Planilla'
                        ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">
                      Descuento Planilla
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      En 1 a 4 cuotas mensuales sin interés para convenios.
                    </p>
                  </div>

                  <div
                    onClick={() => setModalidadPago('Abono50')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      modalidadPago === 'Abono50'
                        ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">
                      Abono 50% Mesón
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      50% hoy (${Math.round(Number(montoTotal) * 0.5).toLocaleString('es-CL')}) y 50% al entregar.
                    </p>
                  </div>

                  <div
                    onClick={() => setModalidadPago('Total')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      modalidadPago === 'Total'
                        ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1">
                      Pago Total en Tienda
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Webpay Plus, Tarjeta de Débito/Crédito o Efectivo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Si es Planilla: Cuotas y Titular */}
              {modalidadPago === 'Planilla' && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                  {/* Selector de Cuotas (1 a 4) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                      Número de Cuotas por Planilla (1 a 4) <span className="text-amaru-copper">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNumCuotas(n)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            numCuotas === n
                              ? 'border-amaru-copper bg-amaru-copper text-white shadow-xs'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {n} {n === 1 ? 'Cuota' : 'Cuotas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RUT Titular Independiente */}
                  <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                        RUT del Titular Responsable del Descuento
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
                        {esMismoTitular ? '✓ Es el mismo paciente' : '+ Ingresar otro RUT'}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="12.345.678-9"
                      value={rutTitular}
                      onChange={(e) => {
                        const v = normalizarInputRUT(e.target.value);
                        setRutTitular(v);
                        if (v.length > 3) setErrorRutTitular(validarRUT(v) ? '' : 'RUT inválido');
                        else setErrorRutTitular('');
                      }}
                      disabled={esMismoTitular}
                      className={`w-full bg-white dark:bg-black/40 border rounded-xl px-3 py-2 text-xs font-mono ${
                        esMismoTitular
                          ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400 cursor-not-allowed'
                          : 'border-slate-300 dark:border-white/10'
                      }`}
                    />
                    {errorRutTitular && (
                      <p className="text-red-500 text-[11px] mt-1 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} /> {errorRutTitular}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botón Finalizar Venta y Descontar Stock */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-3.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a Clínica</span>
                </button>

                <button
                  type="submit"
                  disabled={!paso3Valido}
                  className={`flex-1 font-bold uppercase tracking-wider rounded-xl text-xs py-3.5 transition-all flex items-center justify-center gap-2 shadow-md ${
                    paso3Valido
                      ? 'btn-copper cursor-pointer active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 border border-slate-300 dark:border-zinc-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <QrCode size={17} />
                  <span>Completar Atención y Descontar Stock (1 Unid.)</span>
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
    </div>
  );
};

export default TerminalView;
