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
  Trash2,
  Receipt,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  validarPrestador,
  enrolarPrestadorRNPI,
  type PrestadorRNPI,
} from '../services/rnpiService';
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
import { PoliticasGarantiaBox } from '../components/PoliticasGarantiaBox';
import { ArmazonThumbnail } from '../components/ArmazonThumbnail';
import {
  extraerDigitosMovilCL,
  formatearDigitosMovilCL,
  normalizarMovilCL,
} from '../utils/telefono';
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
  descartarSolicitudReceta,
  type SolicitudReceta,
} from '../services/recetasService';
import {
  validarCodigoSindicato,
  registrarUsoCodigoSindicato,
  calcularBeneficioConvenio,
  type ResultadoValidacionCodigo,
} from '../services/convenioSindicatoService';

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

  // ── Opciones Ópticas, Contexto de Uso y Modalidad de Pago (Parte 2) ──
  const [materialCristal, setMaterialCristal] = useState<
    'Orgánico / Plástico' | 'Policarbonato' | 'Mineral / Vidrio'
  >('Policarbonato');
  const [filtrosCristal, setFiltrosCristal] = useState<string[]>(['Filtro UV', 'Filtro Luz Azul']);
  const [adelgazamiento, setAdelgazamiento] = useState<
    'Estándar (1.56)' | 'Adelgazado (1.61)' | 'Ultra Delgado (1.67)'
  >('Estándar (1.56)');
  const [contextoUso, setContextoUso] = useState<string>('Faena minera');
  const [especificacionesCliente, setEspecificacionesCliente] = useState<string>('');
  const [modalidadPagoPos, setModalidadPagoPos] = useState<
    'Pago Total (100%)' | 'Pago a Mitad (50% Abono / 50% Saldo)' | 'Pago en Cuotas'
  >('Pago Total (100%)');
  const [cuotasPos, setCuotasPos] = useState<3 | 6>(3);

  const toggleFiltroPos = (f: string) => {
    setFiltrosCristal((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  // ── FASE 2: Convenios Institucionales, Validación Física Mesón & Candado 30 Días ──
  const [codigoConvenio, setCodigoConvenio] = useState('');
  const [resultadoConvenio, setResultadoConvenio] = useState<ResultadoValidacionCodigo | null>(null);
  const [nroSocioMinero, setNroSocioMinero] = useState('');
  const [fePublicaVerificacion, setFePublicaVerificacion] = useState<
    'PRESENCIAL_VERIFICADO' | 'CUARENTENA_PRE_LABORATORIO'
  >('PRESENCIAL_VERIFICADO');

  // ── FASE 2: Arqueo de Caja y Medios de Pago Tributarios SII ──
  const [medioPagoTributario, setMedioPagoTributario] = useState<
    'TRANSBANK' | 'EFECTIVO' | 'PLANILLA_SINDICATO' | 'BONO_ISAPRE'
  >('PLANILLA_SINDICATO');
  const [voucherTransbank, setVoucherTransbank] = useState('');
  const [folioBonoIsapre, setFolioBonoIsapre] = useState('');
  const [documentoTributarioSII, setDocumentoTributarioSII] = useState<
    'BOLETA_SII' | 'GUIA_FACTURA_COLECTIVO'
  >('GUIA_FACTURA_COLECTIVO');

  // ── Paso 2: Validación Clínica y Armazón ─────────────────────────────────────
  const [tipoReceta, setTipoReceta] = useState<'vigente' | 'vencida'>('vigente');
  const [mostrarModalReceta, setMostrarModalReceta] = useState(false);
  const [recetaActiva, setRecetaActiva] = useState<RecetaOpticaItem | null>(null);
  const [skuSeleccionado, setSkuSeleccionado] = useState('EPP-TITAN-001');
  const [montoTotal, setMontoTotal] = useState('85000');

  // ── Verificación Sanitaria MINSAL y Prestador RNPI ──
  const [rutMedicoReceta, setRutMedicoReceta] = useState('15.421.890-3');
  const [nombreMedicoReceta, setNombreMedicoReceta] = useState('Dr. Felipe Andrés Araya Cortés');
  const [centroSaludReceta, setCentroSaludReceta] = useState('Hospital del Cobre Salvador Allende - Calama');
  const [rnpiMedicoReceta, setRnpiMedicoReceta] = useState('384912');
  const [especialidadMedicoReceta, setEspecialidadMedicoReceta] = useState('Médico Oftalmólogo');
  const [mostrarModalEnrolarRNPI, setMostrarModalEnrolarRNPI] = useState(false);
  const [feedbackCopiadoRNPI, setFeedbackCopiadoRNPI] = useState<string | null>(null);

  // Enrolamiento rápido de facultativo en mesón
  const [nuevoEnrolRut, setNuevoEnrolRut] = useState('');
  const [nuevoEnrolNombre, setNuevoEnrolNombre] = useState('');
  const [nuevoEnrolEspecialidad, setNuevoEnrolEspecialidad] = useState('Médico Oftalmólogo');
  const [nuevoEnrolRnpi, setNuevoEnrolRnpi] = useState('');
  const [nuevoEnrolCentro, setNuevoEnrolCentro] = useState('');
  const [nuevoEnrolCiudad, setNuevoEnrolCiudad] = useState<'Calama' | 'Antofagasta'>('Calama');

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
    if (sol.codigoConvenio) {
      setCodigoConvenio(sol.codigoConvenio);
      const res = validarCodigoSindicato(sol.codigoConvenio, sol.rut);
      setResultadoConvenio(res);
      if (res.infoSindicato?.tipo === 'TIPO_B') {
        setMedioPagoTributario('PLANILLA_SINDICATO');
        setDocumentoTributarioSII('GUIA_FACTURA_COLECTIVO');
      }
    }

    // Autocompletar mediciones ópticas (OCR) y prestador facultativo si vienen de la web
    if (sol.tipoReceta === 'vigente' || sol.odEsfera) {
      setTipoReceta('vigente');
      setRecetaActiva({
        id_receta: `REC-WEB-${sol.folio || sol.id}`,
        rut_paciente: sol.rut,
        fecha_emision: sol.fechaEmisionReceta || new Date().toISOString().split('T')[0],
        parametros_oftalmologicos: {
          ojo_derecho: {
            esfera: sol.odEsfera || '-1.50',
            cilindro: sol.odCilindro || '-0.50',
            eje: sol.odEje ? sol.odEje.replace('°', '') : '90',
            dp: sol.dpMm || '63',
          },
          ojo_izquierdo: {
            esfera: sol.oiEsfera || '-1.25',
            cilindro: sol.oiCilindro || '-0.75',
            eje: sol.oiEje ? sol.oiEje.replace('°', '') : '85',
            dp: sol.dpMm || '63',
          },
        },
        version_seq: 1,
        es_vigente: true,
        dias_antiguedad: 10,
      });

      if (sol.rutMedico) {
        setRutMedicoReceta(sol.rutMedico);
        const resRNPI = validarPrestador(sol.rutMedico);
        if (resRNPI.prestador) {
          setNombreMedicoReceta(resRNPI.prestador.nombre);
          setCentroSaludReceta(resRNPI.prestador.centroSalud);
          setRnpiMedicoReceta(resRNPI.prestador.rnpi);
          setEspecialidadMedicoReceta(resRNPI.prestador.especialidad);
        } else {
          setNombreMedicoReceta(sol.nombreMedico || '');
          setCentroSaludReceta(sol.centroSalud || '');
        }
      }
    } else if (sol.tipoReceta === 'sin_receta') {
      setTipoReceta('vencida');
    }

    setMensajeSync(`✓ Pre-ingreso web cargado para ${sol.nombre} (${sol.rut}).`);
    setCurrentStep(1);
  };

  // Descartar Solicitud Spam o No Confirmada
  const handleDescartarSpam = (id: string, nombre: string) => {
    descartarSolicitudReceta(id);
    refrescarDatos();
    setMensajeSync(`🗑️ Solicitud web de ${nombre} descartada. No se afectó stock ni se bloqueó al RUT.`);
  };

  // Validar y Aprobar Stock directo desde la bandeja con activación de candado de 30 días
  const handleAprobarSolicitudDirecta = (sol: SolicitudReceta) => {
    cambiarEstadoSolicitud(sol.id, 'APROBADA');
    descontarStock(sol.armazon, sol.ciudad, 1);

    if (sol.codigoConvenio) {
      registrarUsoCodigoSindicato({
        rut: sol.rut,
        codigo: sol.codigoConvenio,
        sindicato: sol.empresa || 'Convenio Institucional',
        folio: sol.folio,
        verificacionMeson: 'PRESENCIAL_VERIFICADO',
      });
    }

    // Registro forense para Auditor
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const current = raw ? JSON.parse(raw) : [];
      const nuevoEvt = {
        id: `REG-POS-${Date.now()}`,
        tipo: 'VENTA_POS',
        folio: sol.folio,
        paciente: sol.nombre,
        rut: formatearRUT(sol.rut),
        fechaHoraExacta: new Date().toLocaleString('es-CL'),
        responsable: localStorage.getItem('amaru_nombre_vendedor') || 'Carlos Rojas Morales',
        motivo: `Aprobación en Mesón Pre-Ingreso Web · Sucursal ${sol.ciudad}`,
        detalles: `Armazón: ${sol.armazon} · Monto: $${sol.monto.toLocaleString('es-CL')} CLP ${
          sol.codigoConvenio ? `· Convenio: ${sol.codigoConvenio} (30 días de carencia activados)` : ''
        }`,
        sucursal: sol.ciudad,
      };
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify([nuevoEvt, ...current]));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));
    } catch {
      // ignore
    }

    refrescarDatos();
    setMensajeSync(`✓ Solicitud de ${sol.nombre} aprobada en mesón. Stock descontado en ${sol.ciudad}.`);
  };

  const handleCodigoConvenioChange = (cod: string) => {
    const limpio = cod.trim().toUpperCase();
    setCodigoConvenio(limpio);
    if (!limpio) {
      setResultadoConvenio(null);
      return;
    }
    const res = validarCodigoSindicato(limpio, rutPaciente);
    setResultadoConvenio(res);
    if (res.infoSindicato) {
      setEmpresaSeleccionada(res.infoSindicato.empresa);
      if (res.infoSindicato.tipo === 'TIPO_B') {
        setMedioPagoTributario('PLANILLA_SINDICATO');
        setDocumentoTributarioSII('GUIA_FACTURA_COLECTIVO');
      } else {
        setMedioPagoTributario('TRANSBANK');
        setDocumentoTributarioSII('BOLETA_SII');
      }
    }
  };

  // Validaciones de pasos
  const esConvenioTipoB =
    tipoUsuario === 'Convenio' &&
    (!resultadoConvenio || resultadoConvenio.infoSindicato?.tipo === 'TIPO_B');
  const validacionSocioMinero = !esConvenioTipoB || nroSocioMinero.trim().length >= 2;

  const paso1Valido =
    Boolean(rutPaciente) &&
    validarRUT(rutPaciente) &&
    nombrePaciente.trim().length >= 3 &&
    Boolean(telefonoPaciente.trim()) &&
    autorizacionBiometrica &&
    (tipoUsuario !== 'Convenio' || !resultadoConvenio?.bloqueado) &&
    validacionSocioMinero;

  const paso2Valido =
    tipoReceta === 'vigente' && Boolean(skuSeleccionado);

  const paso3Valido =
    Number(montoTotal) > 0 &&
    (medioPagoTributario !== 'TRANSBANK' || voucherTransbank.trim().length >= 3) &&
    (medioPagoTributario !== 'BONO_ISAPRE' || folioBonoIsapre.trim().length >= 3) &&
    (medioPagoTributario !== 'PLANILLA_SINDICATO' || (Boolean(rutTitular) && validarRUT(rutTitular)));

  const handleLimpiarTodo = () => {
    setRutPaciente('');
    setNombrePaciente('');
    setTelefonoPaciente('');
    setEmailPaciente('');
    setErrorRutPaciente('');
    setRutTitular('');
    setErrorRutTitular('');
    setNroSocioMinero('');
    setVoucherTransbank('');
    setFolioBonoIsapre('');
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
      modalidadPago === 'Planilla' || medioPagoTributario === 'PLANILLA_SINDICATO'
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

    // Si tiene convenio institucional activo, activar el candado de 30 días
    if (tipoUsuario === 'Convenio' && codigoConvenio.trim()) {
      registrarUsoCodigoSindicato({
        rut: formatearRUT(rutPaciente),
        codigo: codigoConvenio,
        sindicato: resultadoConvenio?.infoSindicato?.nombre || empresaSeleccionada,
        folio: nuevoFolio,
        tipoConvenio: resultadoConvenio?.infoSindicato?.tipo || 'TIPO_B',
        nroSocio: nroSocioMinero.trim() || undefined,
        verificacionMeson: fePublicaVerificacion,
      });
    }

    // Registro en la Bitácora Forense del Auditor
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const current = raw ? JSON.parse(raw) : [];
      const nuevoEvt = {
        id: `REG-POS-${Date.now()}`,
        tipo: 'VENTA_POS',
        folio: nuevoFolio,
        paciente: nombrePaciente,
        rut: formatearRUT(rutPaciente),
        fechaHoraExacta: new Date().toLocaleString('es-CL'),
        responsable: localStorage.getItem('amaru_nombre_vendedor') || 'Carlos Rojas Morales',
        motivo: `Emisión de Venta en Mesón (${sucursalActiva}) · Doc SII: ${
          documentoTributarioSII === 'BOLETA_SII' ? 'Boleta Electrónica' : 'Factura Convenio Colectivo'
        }`,
        detalles: `Medio: ${medioPagoTributario} · Total: $${Number(montoTotal).toLocaleString('es-CL')} CLP ${
          medioPagoTributario === 'TRANSBANK'
            ? `(Voucher: ${voucherTransbank})`
            : medioPagoTributario === 'BONO_ISAPRE'
            ? `(Bono I-Med: ${folioBonoIsapre})`
            : ''
        }${
          tipoUsuario === 'Convenio' && codigoConvenio
            ? ` · Convenio: ${codigoConvenio} (${fePublicaVerificacion}${
                nroSocioMinero ? ` · Socio: ${nroSocioMinero}` : ''
              })`
            : ''
        }`,
        sucursal: sucursalActiva,
      };
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify([nuevoEvt, ...current]));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));
    } catch {
      // ignore
    }

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

                <div className="text-[11px] text-slate-600 dark:text-zinc-300 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Glasses size={12} className="text-amaru-copper shrink-0" />
                    <span className="font-semibold truncate">{sol.armazon}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-[10px]">
                    <FileText size={11} className="shrink-0" />
                    <span className="truncate">{sol.archivoNombre}</span>
                  </div>

                  {/* Estado de Verificación WhatsApp & Convenio */}
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        sol.contactoVerificado
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {sol.contactoVerificado ? '🟢 CONTACTO VERIFICADO' : '🟡 PENDIENTE CONTACTO'}
                    </span>
                    {sol.codigoConvenio && (
                      <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#B85D19]/10 text-amaru-copper border border-amaru-copper/20">
                        {sol.codigoConvenio}
                      </span>
                    )}
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
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amaru-copper/10 hover:bg-amaru-copper/20 text-amaru-copper font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                  >
                    <span>Cargar</span>
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

                  <button
                    type="button"
                    onClick={() => handleDescartarSpam(sol.id, sol.nombre)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                    title="Descartar spam / no confirmado (sin descontar stock ni bloquear RUT)"
                  >
                    <Trash2 size={13} />
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

              {/* Teléfono WhatsApp (+56 9 automático) y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                    Teléfono Móvil / WhatsApp <span className="text-amaru-copper">*</span>
                  </label>
                  <div className="flex items-center bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amaru-copper">
                    <span className="pl-3 pr-2.5 py-2.5 bg-slate-100 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-zinc-200 select-none shrink-0">
                      <Phone size={13} className="text-emerald-600" />
                      <span>+56 9</span>
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="8586 0973"
                      value={formatearDigitosMovilCL(telefonoPaciente)}
                      onChange={(e) => setTelefonoPaciente(normalizarMovilCL(e.target.value))}
                      className="w-full px-3 py-2.5 bg-transparent text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden"
                    />
                  </div>
                  {telefonoPaciente && extraerDigitosMovilCL(telefonoPaciente).length < 8 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      Ingresa los 8 dígitos de tu móvil (actual: {extraerDigitosMovilCL(telefonoPaciente).length}/8).
                    </p>
                  )}
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
                <div className="p-3 rounded-xl border border-amaru-copper bg-amaru-copper/15 text-amaru-copper text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>📍 Sucursal Calama (Sede Operativa Activa)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white/80 dark:bg-black/30 px-2 py-0.5 rounded-full">
                    En Línea
                  </span>
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
                  <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                        <CheckCircle2 size={15} className="text-amaru-copper shrink-0" />
                        <span>Gestión Blindada de Convenio Institucional</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold uppercase">
                        Carencia 30 Días
                      </span>
                    </div>

                    {/* Input de Código de Convenio (Sin exponer atajos internos en mesón) */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-1">
                        Código de Convenio Activo *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={codigoConvenio}
                          onChange={(e) => handleCodigoConvenioChange(e.target.value)}
                          onBlur={() => {
                            if (codigoConvenio.trim()) handleCodigoConvenioChange(codigoConvenio);
                          }}
                          placeholder="Ingresa código entregado por sindicato o empresa"
                          className="flex-1 bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase placeholder:font-sans placeholder:normal-case placeholder:font-normal focus:ring-2 focus:ring-amaru-copper outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleCodigoConvenioChange(codigoConvenio)}
                          className="px-3.5 py-2 rounded-xl bg-[#B85D19] hover:bg-[#8F3B09] text-white font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-xs"
                        >
                          Validar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                        Por control interno, el catálogo de códigos se administra exclusivamente desde el panel de Administración.
                      </p>
                    </div>

                    {/* Feedback y clasificación del convenio */}
                    {resultadoConvenio && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-medium border leading-relaxed ${
                          resultadoConvenio.bloqueado
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
                            : resultadoConvenio.valido
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {resultadoConvenio.valido ? resultadoConvenio.mensajeExito : resultadoConvenio.mensajeError}
                      </div>
                    )}

                    {/* Control Físico Sin Fotos para Tipo B (Planilla / Subvención) */}
                    {esConvenioTipoB && (
                      <div className="pt-2 border-t border-amber-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                            N° de Socio / Rol Minero o Folio de Pase *
                          </label>
                          <a
                            href={`https://wa.me/56985860973?text=${encodeURIComponent(
                              `Estimada directiva sindicato/bienestar ${empresaSeleccionada}: Consulta de verificación de socio RUT ${formatearRUT(
                                rutPaciente
                              )} (N° Socio: ${nroSocioMinero.trim() || 'En evaluación'}) para confección de lentes ópticos en Óptica Amaru Sucursal ${sucursalActiva}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                            title="Consultar socio con directiva sindical vía WhatsApp"
                          >
                            <WhatsAppIcon size={12} />
                            <span>📲 Consultar Socio a Directiva</span>
                          </a>
                        </div>

                        <input
                          type="text"
                          placeholder="Ej: ROL-88421 / COD-9912"
                          value={nroSocioMinero}
                          onChange={(e) => setNroSocioMinero(e.target.value.toUpperCase())}
                          className="w-full bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amaru-copper outline-hidden"
                        />

                        {/* Fe Pública del Vendedor vs Cuarentena Pre-Laboratorio */}
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer">
                            <input
                              type="radio"
                              name="fePublica"
                              checked={fePublicaVerificacion === 'PRESENCIAL_VERIFICADO'}
                              onChange={() => setFePublicaVerificacion('PRESENCIAL_VERIFICADO')}
                              className="mt-0.5 text-amaru-copper accent-amaru-copper cursor-pointer"
                            />
                            <span className="text-[11px] text-slate-700 dark:text-zinc-300 leading-tight">
                              <strong>👁️ Doy fe de haber verificado presencialmente</strong> la Credencial Sindical/Corporativa física del titular en mesón (No se almacenan fotografías de documentos por Ley N° 21.521).
                            </span>
                          </label>

                          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer">
                            <input
                              type="radio"
                              name="fePublica"
                              checked={fePublicaVerificacion === 'CUARENTENA_PRE_LABORATORIO'}
                              onChange={() => setFePublicaVerificacion('CUARENTENA_PRE_LABORATORIO')}
                              className="mt-0.5 text-amber-600 accent-amber-600 cursor-pointer"
                            />
                            <span className="text-[11px] text-slate-700 dark:text-zinc-300 leading-tight">
                              <strong>⏳ Dejar en Cuarentena Pre-Laboratorio:</strong> Requiere confirmación con Directiva Sindical por WhatsApp antes de tallar y biselar cristal.
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
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

                  {/* Panel de Verificación Sanitaria y Facultativo RNPI */}
                  <div className="bg-stone-50 dark:bg-black/25 border border-stone-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/80 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-[#B85D19]" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          🏛️ Verificación Sanitaria de Receta y Prestador (MINSAL / RNPI)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Padrón Oficial Offline-First
                      </span>
                    </div>

                    {/* Semáforo de Estado RNPI */}
                    {(() => {
                      const resRNPI = validarPrestador(rutMedicoReceta);
                      const esHabilitado = resRNPI.estado === 'RNPI_HABILITADO';
                      const esInvalido = resRNPI.estado === 'RUT_INVALIDO';

                      return (
                        <div
                          className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                            esHabilitado
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                              : esInvalido
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                          }`}
                        >
                          <ShieldCheck size={16} className={`shrink-0 mt-0.5 ${esHabilitado ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <div className="flex-1">
                            {esHabilitado ? (
                              <>
                                <strong className="block text-emerald-950 dark:text-emerald-100">
                                  🟢 Prestador Habilitado en Padrón RNPI
                                </strong>
                                <span>
                                  {resRNPI.prestador?.nombre} · {resRNPI.prestador?.especialidad} · Registro Superintendencia #{resRNPI.prestador?.rnpi} ({resRNPI.prestador?.centroSalud})
                                </span>
                              </>
                            ) : esInvalido ? (
                              <>
                                <strong className="block text-rose-950 dark:text-rose-100">
                                  🔴 Timbre / RUT Médico Inválido (Fallo Módulo 11)
                                </strong>
                                <span>Verifique el timbre legible en la receta física.</span>
                              </>
                            ) : (
                              <>
                                <strong className="block text-amber-950 dark:text-amber-100">
                                  🟡 Pendiente Consulta Superintendencia
                                </strong>
                                <span>
                                  RUT {rutMedicoReceta ? formatearRUT(rutMedicoReceta) : 'profesional'} es matemáticamente válido, pero no figura en el padrón local norte. Consulta el portal RNPI e incorpóralo.
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Inputs de Identificación Facultativo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                          RUT Facultativo:
                        </label>
                        <input
                          type="text"
                          value={rutMedicoReceta}
                          onChange={(e) => {
                            const val = normalizarInputRUT(e.target.value);
                            setRutMedicoReceta(val);
                            if (val.length >= 7) {
                              const r = validarPrestador(val);
                              if (r.prestador) {
                                setNombreMedicoReceta(r.prestador.nombre);
                                setCentroSaludReceta(r.prestador.centroSalud);
                                setRnpiMedicoReceta(r.prestador.rnpi);
                                setEspecialidadMedicoReceta(r.prestador.especialidad);
                              }
                            }
                          }}
                          placeholder="15.421.890-3"
                          className="w-full bg-white dark:bg-[#1A1816] border border-slate-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                          Nombre Profesional:
                        </label>
                        <input
                          type="text"
                          value={nombreMedicoReceta}
                          onChange={(e) => setNombreMedicoReceta(e.target.value)}
                          placeholder="Dr. Nombre Apellido"
                          className="w-full bg-white dark:bg-[#1A1816] border border-slate-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                          Centro / Institución:
                        </label>
                        <input
                          type="text"
                          value={centroSaludReceta}
                          onChange={(e) => setCentroSaludReceta(e.target.value)}
                          placeholder="Hospital del Cobre, RedSalud..."
                          className="w-full bg-white dark:bg-[#1A1816] border border-slate-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {rnpiMedicoReceta && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                        <span>Especialidad: <strong className="text-slate-700 dark:text-zinc-200">{especialidadMedicoReceta}</strong></span>
                        <span>•</span>
                        <span>Reg. RNPI: <strong className="font-mono text-slate-700 dark:text-zinc-200">#{rnpiMedicoReceta}</strong></span>
                      </div>
                    )}

                    {/* Botones de Acción Oficial RNPI */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const rutTarget = rutMedicoReceta ? formatearRUT(rutMedicoReceta) : '';
                          if (rutTarget && navigator.clipboard) {
                            navigator.clipboard.writeText(rutTarget);
                          }
                          setFeedbackCopiadoRNPI(`RUT ${rutTarget} copiado. Abriendo Superintendencia...`);
                          setTimeout(() => setFeedbackCopiadoRNPI(null), 4000);
                          window.open('https://rnpi.superdesalud.gob.cl/', '_blank', 'noopener,noreferrer');
                        }}
                        className="flex-1 border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Copy size={13} className="text-[#B85D19]" />
                        <span>🔍 Copiar RUT Médico y Abrir Portal Oficial RNPI</span>
                        <ExternalLink size={12} className="text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNuevoEnrolRut(rutMedicoReceta);
                          setNuevoEnrolNombre(nombreMedicoReceta);
                          setNuevoEnrolCentro(centroSaludReceta);
                          setMostrarModalEnrolarRNPI(!mostrarModalEnrolarRNPI);
                        }}
                        className="border border-[#B85D19]/40 bg-[#B85D19]/10 hover:bg-[#B85D19] text-[#B85D19] hover:text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <span>➕ Validar e Incorporar Profesional al Padrón Local RNPI</span>
                      </button>
                    </div>

                    {feedbackCopiadoRNPI && (
                      <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>{feedbackCopiadoRNPI}</span>
                      </p>
                    )}

                    {/* Mini Formulario In-line de Enrolamiento de Mesón */}
                    {mostrarModalEnrolarRNPI && (
                      <div className="p-3.5 bg-white dark:bg-[#1A1816] border border-[#B85D19]/30 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
                          <span className="text-xs font-bold text-[#B85D19]">
                            Enrolar Nuevo Profesional en Padrón Local RNPI
                          </span>
                          <button
                            type="button"
                            onClick={() => setMostrarModalEnrolarRNPI(false)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            ✕ Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">RUT Facultativo:</label>
                            <input
                              type="text"
                              value={nuevoEnrolRut}
                              onChange={(e) => setNuevoEnrolRut(normalizarInputRUT(e.target.value))}
                              placeholder="12.345.678-9"
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nombre Completo:</label>
                            <input
                              type="text"
                              value={nuevoEnrolNombre}
                              onChange={(e) => setNuevoEnrolNombre(e.target.value)}
                              placeholder="Dr. Juan Pérez"
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Especialidad:</label>
                            <select
                              value={nuevoEnrolEspecialidad}
                              onChange={(e) => setNuevoEnrolEspecialidad(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5"
                            >
                              <option value="Médico Oftalmólogo">Médico Oftalmólogo</option>
                              <option value="Tecnólogo Médico Mención Oftalmología">Tecnólogo Médico Mención Oftalmología</option>
                              <option value="Optometrista">Optometrista</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">N° Registro RNPI Superintendencia:</label>
                            <input
                              type="text"
                              value={nuevoEnrolRnpi}
                              onChange={(e) => setNuevoEnrolRnpi(e.target.value)}
                              placeholder="Ej: 549812"
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Centro de Salud:</label>
                            <input
                              type="text"
                              value={nuevoEnrolCentro}
                              onChange={(e) => setNuevoEnrolCentro(e.target.value)}
                              placeholder="Hospital del Cobre, RedSalud..."
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jurisdicción / Ciudad:</label>
                            <select
                              value={nuevoEnrolCiudad}
                              onChange={(e) => setNuevoEnrolCiudad(e.target.value as 'Calama' | 'Antofagasta')}
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-zinc-700 rounded-lg p-1.5"
                            >
                              <option value="Calama">Calama</option>
                              <option value="Antofagasta">Antofagasta</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!nuevoEnrolRut.trim() || !nuevoEnrolNombre.trim() || !nuevoEnrolRnpi.trim()) {
                                alert('Por favor complete RUT, Nombre y N° de Registro RNPI.');
                                return;
                              }
                              const nuevo: PrestadorRNPI = {
                                rut: formatearRUT(nuevoEnrolRut),
                                nombre: nuevoEnrolNombre.trim(),
                                especialidad: nuevoEnrolEspecialidad,
                                rnpi: nuevoEnrolRnpi.trim(),
                                centroSalud: nuevoEnrolCentro.trim() || 'Consulta Particular',
                                ciudad: nuevoEnrolCiudad,
                              };
                              enrolarPrestadorRNPI(nuevo);
                              setRutMedicoReceta(nuevo.rut);
                              setNombreMedicoReceta(nuevo.nombre);
                              setCentroSaludReceta(nuevo.centroSalud);
                              setRnpiMedicoReceta(nuevo.rnpi);
                              setEspecialidadMedicoReceta(nuevo.especialidad);
                              setMostrarModalEnrolarRNPI(false);
                              setMensajeSync(`✓ Profesional ${nuevo.nombre} incorporado con éxito al Padrón Local RNPI.`);
                            }}
                            className="bg-[#B85D19] hover:bg-[#8F3B09] text-white text-xs font-bold py-1.5 px-4 rounded-xl cursor-pointer transition-colors shadow-sm"
                          >
                            Guardar en Padrón Local RNPI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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
                      {catalogo.map((arm) => {
                        const isSelected = skuSeleccionado === arm.sku;
                        const stockActual = arm.stock.Calama || 0;

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

                              {/* Imagen real de catálogo o fallback SVG */}
                              <div className="p-2 flex items-center justify-center bg-white rounded-xl my-2 border border-slate-200/70 min-h-[84px]">
                                <ArmazonThumbnail
                                  imagenUrl={arm.imagenUrl}
                                  nombre={arm.nombre}
                                  categoria={arm.categoria}
                                  size={34}
                                  className="max-h-20"
                                />
                              </div>

                              {arm.certificaciones && arm.certificaciones.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                  {arm.grupo && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                      {arm.grupo}
                                    </span>
                                  )}
                                  {arm.certificaciones.map((c) => (
                                    <span
                                      key={c}
                                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    >
                                      ✓ {c}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                {arm.nombre}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                                {arm.marca ? `${arm.marca} · ` : ''}{arm.material}
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

                  {/* Especificaciones Ópticas y Contexto de Uso del Cliente */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amaru-copper block">
                      Especificaciones de Cristal, Filtros y Contexto de Uso
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Material Cristal</label>
                        <select
                          value={materialCristal}
                          onChange={(e) => setMaterialCristal(e.target.value as 'Orgánico / Plástico' | 'Policarbonato' | 'Mineral / Vidrio')}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold"
                        >
                          <option value="Orgánico / Plástico">Orgánico / Plástico</option>
                          <option value="Policarbonato">Policarbonato (+$12.000)</option>
                          <option value="Mineral / Vidrio">Mineral / Vidrio (+$15.000)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Adelgazamiento</label>
                        <select
                          value={adelgazamiento}
                          onChange={(e) => setAdelgazamiento(e.target.value as 'Estándar (1.56)' | 'Adelgazado (1.61)' | 'Ultra Delgado (1.67)')}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold"
                        >
                          <option value="Estándar (1.56)">Estándar (1.56)</option>
                          <option value="Adelgazado (1.61)">Adelgazado (1.61 · +$18.000)</option>
                          <option value="Ultra Delgado (1.67)">Ultra Delgado (1.67 · +$32.000)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contexto de Uso</label>
                        <select
                          value={contextoUso}
                          onChange={(e) => setContextoUso(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs font-semibold"
                        >
                          <option value="Faena minera">Faena minera</option>
                          <option value="Turno nocturno">Turno nocturno</option>
                          <option value="Pantallas / Oficina">Pantallas / Oficina</option>
                          <option value="Conducción">Conducción</option>
                          <option value="Lectura">Lectura</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Filtro UV', 'Filtro Luz Azul', 'Filtro Luz Amarilla (Conducción / Baja Luz)'].map((f) => {
                        const on = filtrosCristal.includes(f);
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => toggleFiltroPos(f)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              on
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-white dark:bg-[#1E1C1A] border-slate-200 dark:border-white/10 text-slate-500'
                            }`}
                          >
                            {on ? '✓ ' : '+ '}{f}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={especificacionesCliente}
                      onChange={(e) => setEspecificacionesCliente(e.target.value)}
                      placeholder="Especificaciones adicionales del cliente (ej: sensibilidad al reflejo nocturno, tipo de uso en faena)..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 text-xs"
                    />
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

              {/* Resumen de Montura y Desglose Financiero */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
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
                        Sucursal: <strong>{sucursalActiva}</strong> (Disponible: {armazonActualInfo?.stock[sucursalActiva] || 0} un.)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      ${Number(montoTotal).toLocaleString('es-CL')}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">
                      Valor Base
                    </span>
                  </div>
                </div>

                {/* Desglose Convenio Institucional + Total Final */}
                {(() => {
                  const extraMat =
                    materialCristal === 'Policarbonato'
                      ? 12000
                      : materialCristal === 'Mineral / Vidrio'
                      ? 15000
                      : 0;
                  const extraFil =
                    (filtrosCristal.includes('Filtro Luz Azul') ? 10000 : 0) +
                    (filtrosCristal.includes('Filtro Luz Amarilla (Conducción / Baja Luz)') ? 12000 : 0);
                  const extraIdx =
                    adelgazamiento === 'Adelgazado (1.61)'
                      ? 18000
                      : adelgazamiento === 'Ultra Delgado (1.67)'
                      ? 32000
                      : 0;
                  const subtotalPos = Number(montoTotal) + extraMat + extraFil + extraIdx;
                  const convCalc =
                    tipoUsuario === 'Convenio' && codigoConvenio && resultadoConvenio?.valido
                      ? calcularBeneficioConvenio(codigoConvenio, subtotalPos)
                      : null;
                  const totalPos = convCalc ? convCalc.totalAPagarCliente : subtotalPos;
                  const abono50 = Math.round(totalPos / 2);
                  const saldo50 = totalPos - abono50;
                  const cuotaVal = Math.round(totalPos / cuotasPos);

                  return (
                    <div className="space-y-2.5 text-xs">
                      <div className="text-[11px] text-slate-600 dark:text-zinc-400 flex flex-wrap gap-2">
                        <span><strong>Cristal:</strong> {materialCristal}</span>
                        <span>·</span>
                        <span><strong>Índice:</strong> {adelgazamiento}</span>
                        <span>·</span>
                        <span><strong>Uso:</strong> {contextoUso}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                        <span>Subtotal (Armazón + Configuración Óptica):</span>
                        <span className="font-mono font-bold">${subtotalPos.toLocaleString('es-CL')} CLP</span>
                      </div>

                      {convCalc && (
                        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                              ✅ Beneficio Previo Convenio {codigoConvenio}
                            </span>
                            <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                              {convCalc.detalleTexto}
                            </span>
                          </div>
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 shrink-0">
                            - ${convCalc.descuentoOMontoCubierto.toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Total Final a Pagar
                        </span>
                        <span className="font-mono font-black text-base text-amaru-copper">
                          ${totalPos.toLocaleString('es-CL')} CLP
                        </span>
                      </div>

                      {/* Modalidad de Pago: 100% / 50% Mitad / Cuotas */}
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Modalidad de Pago (Total / A Mitad 50% / A Cuotas)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(
                            [
                              'Pago Total (100%)',
                              'Pago a Mitad (50% Abono / 50% Saldo)',
                              'Pago en Cuotas',
                            ] as const
                          ).map((mod) => (
                            <button
                              key={mod}
                              type="button"
                              onClick={() => setModalidadPagoPos(mod)}
                              className={`p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                                modalidadPagoPos === mod
                                  ? 'bg-amaru-copper/15 border-amaru-copper text-amaru-copper'
                                  : 'bg-white dark:bg-[#1E1C1A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              {mod}
                            </button>
                          ))}
                        </div>

                        {modalidadPagoPos === 'Pago a Mitad (50% Abono / 50% Saldo)' && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between font-mono text-[11px]">
                            <span>Abono 50%: <strong>${abono50.toLocaleString('es-CL')}</strong></span>
                            <span>Saldo 50%: <strong>${saldo50.toLocaleString('es-CL')}</strong></span>
                          </div>
                        )}

                        {modalidadPagoPos === 'Pago en Cuotas' && (
                          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2">
                            <div className="flex gap-1.5">
                              {([3, 6] as const).map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setCuotasPos(c)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                    cuotasPos === c
                                      ? 'bg-sky-600 text-white'
                                      : 'bg-white dark:bg-zinc-800 text-slate-600'
                                  }`}
                                >
                                  {c} cuotas
                                </button>
                              ))}
                            </div>
                            <span className="font-mono font-black text-sky-800 dark:text-sky-200">
                              {cuotasPos}x ${cuotaVal.toLocaleString('es-CL')} CLP/mes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Políticas de Garantía Óptica Amaru · Sucursal Calama */}
              <PoliticasGarantiaBox compact />

              {/* Selector de Medio de Pago Tributario (Arqueo de Caja) */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Medio de Pago Tributario (Arqueo de Caja) <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'TRANSBANK' as const,
                      label: '💳 Transbank POS (Débito/Crédito)',
                      desc: 'Voucher electrónico conciliado en terminal físico',
                    },
                    {
                      id: 'EFECTIVO' as const,
                      label: '💵 Efectivo / Transferencia Bancaria (Calama)',
                      desc: 'Pago físico o transferencia bancaria verificada en Sucursal Calama',
                    },
                    {
                      id: 'PLANILLA_SINDICATO' as const,
                      label: '🏛️ Orden de Compra / Planilla',
                      desc: 'Descuento por planilla sindicato/bienestar (Tipo B)',
                      disabled: tipoUsuario !== 'Convenio',
                    },
                    {
                      id: 'BONO_ISAPRE' as const,
                      label: '🏥 Bono Fonasa MLE / I-Med + Copago',
                      desc: 'Bono electrónico de salud acreditado en mesón',
                    },
                  ].map((mp) => {
                    const isSelected = medioPagoTributario === mp.id;
                    return (
                      <div
                        key={mp.id}
                        onClick={() => {
                          if (mp.disabled) return;
                          setMedioPagoTributario(mp.id);
                          if (mp.id === 'PLANILLA_SINDICATO') {
                            setModalidadPago('Planilla');
                            setDocumentoTributarioSII('GUIA_FACTURA_COLECTIVO');
                          } else {
                            setModalidadPago('Total');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          mp.disabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-white/5'
                            : isSelected
                            ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/30 cursor-pointer shadow-xs'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 dark:text-white block mb-0.5">
                          {mp.label}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {mp.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Campos dinámicos según Medio de Pago */}
                {medioPagoTributario === 'TRANSBANK' && (
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1.5 animate-in fade-in">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200 block">
                      N° de Operación / Código Voucher POS *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: OP-889123 / VOUCHER 4321"
                      value={voucherTransbank}
                      onChange={(e) => setVoucherTransbank(e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-[#1E1C1A] border border-sky-300 dark:border-sky-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}

                {medioPagoTributario === 'BONO_ISAPRE' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 animate-in fade-in">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 block">
                      N° de Bono Fonasa MLE o Folio I-Med *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: BONO-771239 / IMED-9001"
                      value={folioBonoIsapre}
                      onChange={(e) => setFolioBonoIsapre(e.target.value.toUpperCase())}
                      className="w-full bg-white dark:bg-[#1E1C1A] border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Selector de Documento Tributario SII */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Documento Tributario SII Obligatorio <span className="text-amaru-copper">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setDocumentoTributarioSII('BOLETA_SII')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      documentoTributarioSII === 'BOLETA_SII'
                        ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/25 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Receipt size={14} className="text-amaru-copper" />
                      <span>🧾 Boleta Electrónica SII</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Venta Mesón / Paciente Particular</span>
                  </div>

                  <div
                    onClick={() => setDocumentoTributarioSII('GUIA_FACTURA_COLECTIVO')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      documentoTributarioSII === 'GUIA_FACTURA_COLECTIVO'
                        ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/25 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <FileSpreadsheet size={14} className="text-amaru-copper" />
                      <span>📑 Factura / Guía Convenio</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Despacho Colectivo por Planilla</span>
                  </div>
                </div>
              </div>

              {/* Si es Planilla / Descuento Sindicato: Cuotas y Titular */}
              {(modalidadPago === 'Planilla' || medioPagoTributario === 'PLANILLA_SINDICATO') && (
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
