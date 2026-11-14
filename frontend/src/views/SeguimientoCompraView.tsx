import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  ShieldCheck,
  FileCheck2,
  Building2,
  User,
  DollarSign,
  Copy,
  Check,
  Download,
  Package,
  Layers,
  ExternalLink,
  Calendar,
  Sparkles,
  FileUp,
  ArrowRight,
  Edit3,
  Mail,
  Phone,
  Eye,
  X,
  Lock,
  MapPin,
  Plus,
  Compass,
  PackageCheck,
} from 'lucide-react';
import { formatearRUT } from '../utils/rut';
import { getUserInfo, isUserPatient, isUserOperator } from '../utils/auth';
import { AutoRecetaModal } from '../components/AutoRecetaModal';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { getSucursalActiva } from '../services/inventarioService';
import {
  TitanioProIcon,
  AcetatoLumiereIcon,
  UltralightFlexIcon,
} from '../components/icons/ArmazonesSVGs';
import {
  descargarComprobantePDF,
  acelerarYDescargarFiniquitoPDF,
} from '../services/documentosService';
import {
  getSolicitudesRecetas,
  type SolicitudReceta,
  type CiudadAtencion,
} from '../services/recetasService';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type EstadoHito = 'completed' | 'active' | 'pending' | 'alert';
export type TipoIconoHito = 'clinica' | 'laboratorio' | 'despacho' | 'entrega' | 'finanzas';

export interface HitoTrazabilidad {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  fecha?: string;
  estado: EstadoHito;
  tipoIcono: TipoIconoHito;
  selloSha256?: string;
  detalles?: {
    receptor?: string;
    tipoReceptor?: string;
    saldoAcelerado?: number;
    cuotasAfectadas?: number;
    observacionLegal?: string;
    codigoDespacho?: string;
    laboratorioNombre?: string;
    tecnicoOptico?: string;
  };
}

export interface PedidoTrazabilidad {
  folio: string;
  rutTitular: string;
  nombreTitular: string;
  empresaEmpleadora: string;
  sindicatoFaena: string;
  saldoTotal: number;
  modeloArmazon: string;
  fechaIngreso: string;
  estadoBadge: string;
  tieneAceleracionFiniquito: boolean;
  hitos: HitoTrazabilidad[];
}

export const limpiarEstadoHumano = (estado?: string): string => {
  if (!estado) return 'EN PROCESAMIENTO';
  const e = estado.toUpperCase();
  if (e.includes('RETENCION_LABORAL') || e.includes('FINIQUITO')) {
    return 'CONVENIO ACTIVO · LISTO EN SUCURSAL';
  }
  if (e.includes('DESPACHO')) {
    return 'EN DESPACHO A SUCURSAL';
  }
  if (e.includes('LABORATORIO')) {
    return 'EN LABORATORIO ÓPTICO';
  }
  if (e.includes('ENTREGADO')) {
    return 'ENTREGADO CONFORME';
  }
  return estado.replace(/_/g, ' ').trim();
};

// ── Base de Datos Simulada para Demostración e Inspección Inmediata ──────────

const PEDIDO_PRECARGADO_DEFAULT: PedidoTrazabilidad = {
  folio: 'FOLIO-8F1085AD',
  rutTitular: '24533343-9',
  nombreTitular: 'Mario Cárdenas González',
  empresaEmpleadora: 'Convenio Minero · Minera Escondida',
  sindicatoFaena: 'Plan EPP Colectivo - Faena Coloso',
  saldoTotal: 185000,
  modeloArmazon: 'EPP-TITAN-001 - Lente Hermético Pro Titanio (ANSI Z87.1 / DS 594)',
  fechaIngreso: '28 de Octubre 2026, 09:15 hrs',
  estadoBadge: 'ENTREGADO / EN FINIQUITO',
  tieneAceleracionFiniquito: true,
  hitos: [
    {
      id: 'hito-clinico',
      nombre: 'Validación Clínica & Graduación',
      subtitulo: 'Receta médica visada por backend',
      descripcion:
        'Refracción OD: -1.50 esf (-0.50 cil 90°) / OI: -1.25 esf. Validación biométrica y nómina de faena autorizada exitosamente.',
      fecha: '28-10-2026 10:45 hrs',
      estado: 'completed',
      tipoIcono: 'clinica',
      detalles: {
        tecnicoOptico: 'Dra. Valentina Montes (Reg. SIS 114820)',
        observacionLegal: 'Certificación de Agudeza Visual Ocupacional vigente según DS 594.',
      },
    },
    {
      id: 'hito-laboratorio',
      nombre: 'Laboratorio Óptico Central',
      subtitulo: 'En proceso de fabricación',
      descripcion:
        'Biselado industrial de policarbonato alto impacto, tratamiento hidrofóbico y monocapa antirreflejo para faena minera de alta radiación UV.',
      fecha: '30-10-2026 16:20 hrs',
      estado: 'completed',
      tipoIcono: 'laboratorio',
      detalles: {
        laboratorioNombre: 'Lab Industrial Amaru Antofagasta',
        observacionLegal: 'Conformidad de norma técnica chilena NCh 1411/4.',
      },
    },
    {
      id: 'hito-despacho',
      nombre: 'Despacho a Faena',
      subtitulo: 'En tránsito a sucursal de faena',
      descripcion:
        'Lente verificado y embalado en estuche dieléctrico sellado. Envío consolidado en valija de seguridad hacia Campamento Escondida.',
      fecha: '02-11-2026 11:30 hrs',
      estado: 'completed',
      tipoIcono: 'despacho',
      detalles: {
        codigoDespacho: 'GD-9921-MIN-ESC',
      },
    },
    {
      id: 'hito-entrega',
      nombre: 'Entrega DS 594',
      subtitulo: 'Entregado al trabajador',
      descripcion:
        'Entrega presencial y recepción formal con firma digital simple y cotejo de cédula de identidad mediante escaneo PDF417.',
      fecha: '03-11-2026 14:10 hrs',
      estado: 'completed',
      tipoIcono: 'entrega',
      selloSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      detalles: {
        receptor: 'Mario Cárdenas González',
        tipoReceptor: 'Titular (Cédula Vigente)',
        observacionLegal:
          'Cumplimiento estricto DS N° 594, Art. 53: Entrega a título gratuito y constancia formal del trabajador.',
      },
    },
    {
      id: 'hito-financiero',
      nombre: 'Estado Financiero',
      subtitulo: 'Aceleración por Finiquito - Exigible Hoy',
      descripcion:
        'El trabajador registra aviso de término laboral ingresado por el área de Personas de la minera. Conforme a la Cláusula 5ta del Convenio Colectivo, las 3 cuotas pendientes se han consolidado en un cobro único directo sobre la liquidación final.',
      fecha: '04-11-2026 08:30 hrs',
      estado: 'alert',
      tipoIcono: 'finanzas',
      detalles: {
        saldoAcelerado: 185000,
        cuotasAfectadas: 3,
        observacionLegal:
          'Cláusula de Aceleración y Descuento por Finiquito ejecutada conforme al Art. 177 del Código del Trabajo.',
      },
    },
  ],
};

const PEDIDOS_DEMO: Record<string, PedidoTrazabilidad> = {
  'FOLIO-8F1085AD': PEDIDO_PRECARGADO_DEFAULT,
  'FOLIO-2B4C8901': {
    folio: 'FOLIO-2B4C8901',
    rutTitular: '18923456-7',
    nombreTitular: 'Claudia Soto Valenzuela',
    empresaEmpleadora: 'Cliente Particular · Atención Boutique',
    sindicatoFaena: 'Sucursal Centro Las Condes · Asesoría Estilística',
    saldoTotal: 145000,
    modeloArmazon: 'AMARU-LUMIERE-04 - Lentes Progresivos Acetato Italiano + Blue-Light',
    fechaIngreso: '07 de Noviembre 2026, 11:20 hrs',
    estadoBadge: 'EN LABORATORIO ÓPTICO',
    tieneAceleracionFiniquito: false,
    hitos: [
      {
        id: 'hito-clinico',
        nombre: 'Consulta Clínica & Graduación',
        subtitulo: 'Receta médica visada',
        descripcion:
          'Refracción OD: -1.25 esf (-0.50 cil 85°) / OI: -1.00 esf. Tallado digital para descanso visual y filtro Blue-Block.',
        fecha: '07-11-2026 12:05 hrs',
        estado: 'completed',
        tipoIcono: 'clinica',
        detalles: {
          tecnicoOptico: 'Dr. Alejandro Silva (Reg. SIS 94812)',
          observacionLegal: 'Examen de agudeza visual y refracción computarizada en Sucursal.',
        },
      },
      {
        id: 'hito-laboratorio',
        nombre: 'Laboratorio Boutique Central',
        subtitulo: 'En proceso de fabricación',
        descripcion:
          'Tallado digital de alta definición en cristales orgánicos ultradelgados (Index 1.67) y multicapa antirreflejo Crizal Sapphire.',
        fecha: '08-11-2026 09:00 hrs',
        estado: 'active',
        tipoIcono: 'laboratorio',
        detalles: {
          laboratorioNombre: 'Laboratorio Central de Precisión Santiago',
        },
      },
      {
        id: 'hito-despacho',
        nombre: 'Control de Calidad Óptico',
        subtitulo: 'Calibración milimétrica',
        descripcion: 'Verificación de centros ópticos pupilar y ajuste térmico de montura de acetato.',
        estado: 'pending',
        tipoIcono: 'despacho',
      },
      {
        id: 'hito-entrega',
        nombre: 'Entrega en Sucursal',
        subtitulo: 'Listo para retiro boutique',
        descripcion: 'Programado para retiro con estuche rígido de cuero y microfibra en Sucursal Centro.',
        estado: 'pending',
        tipoIcono: 'entrega',
      },
      {
        id: 'hito-financiero',
        nombre: 'Estado Financiero',
        subtitulo: 'Pago Particular Completado',
        descripcion:
          'Cancelado mediante Webpay Plus (Transbank). Boleta Electrónica SII N° 4819 emitida conforme a ley.',
        fecha: '07-11-2026',
        estado: 'completed',
        tipoIcono: 'finanzas',
      },
    ],
  },
  'FOLIO-4D7E1123': {
    folio: 'FOLIO-4D7E1123',
    rutTitular: '15482931-K',
    nombreTitular: 'Roberto Morales Díaz',
    empresaEmpleadora: 'Convenio Salud · Isapre Colmena / Codelco',
    sindicatoFaena: 'Plan Cobertura Oftalmológica 80%',
    saldoTotal: 65000,
    modeloArmazon: 'AMARU-MULTI-PRO - Cristales Progresivos Digitales Antifatiga',
    fechaIngreso: '04 de Noviembre 2026, 14:40 hrs',
    estadoBadge: 'EN DESPACHO A DOMICILIO',
    tieneAceleracionFiniquito: false,
    hitos: [
      {
        id: 'hito-clinico',
        nombre: 'Validación Clínica & Isapre',
        subtitulo: 'Bono Electrónico I-Med Aprobado',
        descripcion: 'Bonificación 80% procesada en línea. Copago único de $65.000 CLP confirmado por Isapre.',
        fecha: '04-11-2026 15:10 hrs',
        estado: 'completed',
        tipoIcono: 'clinica',
        detalles: {
          observacionLegal: 'Bono Electrónico N° 881290-IMED aprobado en convenio institucional.',
        },
      },
      {
        id: 'hito-laboratorio',
        nombre: 'Laboratorio Óptico Digital',
        subtitulo: 'En proceso de fabricación',
        descripcion: 'Fabricación finalizada y control de calidad ISO 9001 conforme con certificación óptica.',
        fecha: '06-11-2026 17:30 hrs',
        estado: 'completed',
        tipoIcono: 'laboratorio',
      },
      {
        id: 'hito-despacho',
        nombre: 'Despacho a Domicilio',
        subtitulo: 'En tránsito con mensajería express',
        descripcion: 'En ruta terrestre con mensajería especializada hacia dirección registrada con guía TR-9021.',
        fecha: '09-11-2026 08:15 hrs',
        estado: 'active',
        tipoIcono: 'despacho',
        detalles: {
          codigoDespacho: 'ENV-DOM-9021-CHL',
        },
      },
      {
        id: 'hito-entrega',
        nombre: 'Entrega Conforme',
        subtitulo: 'Recepción por paciente',
        descripcion: 'Programada para entrega en domicilio con confirmación digital de recepción.',
        estado: 'pending',
        tipoIcono: 'entrega',
      },
      {
        id: 'hito-financiero',
        nombre: 'Estado Financiero',
        subtitulo: 'Copago Cancelado',
        descripcion: 'Copago cancelado en 3 cuotas sin interés mediante Transbank al momento del pedido.',
        fecha: '04-11-2026',
        estado: 'completed',
        tipoIcono: 'finanzas',
      },
    ],
  },
};

// ── Formateador de moneda local ──────────────────────────────────────────────

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Componente Principal ─────────────────────────────────────────────────────

export const SeguimientoCompraView: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const esPaciente = isUserPatient();
  const esOperador = isUserOperator();
  const [sucursalActiva, setSucursalActivaState] = useState<'Calama' | 'Antofagasta'>(() => getSucursalActiva());

  const [llegadasAcreditadas, setLlegadasAcreditadas] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('amaru_llegadas_acreditadas');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleAcreditarLlegada = (folio: string) => {
    const updated = { ...llegadasAcreditadas, [folio]: true };
    setLlegadasAcreditadas(updated);
    localStorage.setItem('amaru_llegadas_acreditadas', JSON.stringify(updated));
    setToastMensaje(`✓ Llegada a Tienda acreditada para el pedido ${folio}. Listo para entrega.`);
    setTimeout(() => setToastMensaje(null), 4000);
  };

  const handleIrAEntregar = (folio: string) => {
    localStorage.setItem('amaru_folio_entrega_precargado', folio);
    navigate('/despacho');
  };

  useEffect(() => {
    const handleSucursalUpdated = () => setSucursalActivaState(getSucursalActiva());
    window.addEventListener('amaru_sucursal_updated', handleSucursalUpdated);
    window.addEventListener('storage', handleSucursalUpdated);
    return () => {
      window.removeEventListener('amaru_sucursal_updated', handleSucursalUpdated);
      window.removeEventListener('storage', handleSucursalUpdated);
    };
  }, []);

  const [inputFolio, setInputFolio] = useState<string>(
    esPaciente ? (userInfo.rut || '') : 'FOLIO-8F1085AD'
  );
  const [pedidoActual, setPedidoActual] = useState<PedidoTrazabilidad | null>(
    esPaciente ? null : PEDIDO_PRECARGADO_DEFAULT
  );
  const [sinPedidos, setSinPedidos] = useState<boolean>(false);
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(esPaciente);
  const [buscando, setBuscando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [hashCopiado, setHashCopiado] = useState<boolean>(false);
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null);

  // ── Estados para el Portal del Paciente (Self-Service) ──────────────────────
  const [isModalRecetaOpen, setIsModalRecetaOpen] = useState<boolean>(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);
  const [recetaCargadaLocal, setRecetaCargadaLocal] = useState<boolean>(false);
  const [editandoDatos, setEditandoDatos] = useState<boolean>(false);
  const [telefonoContacto, setTelefonoContacto] = useState<string>(
    () => localStorage.getItem('amaru_telefono') || '+56 9 8586 0973'
  );
  const [emailContacto] = useState<string>(
    () => localStorage.getItem('amaru_email') || 'm.jorge@minera-norte.cl'
  );
  const [nombrePaciente, setNombrePaciente] = useState<string>(
    () => localStorage.getItem('amaru_nombre_paciente') || 'Miguel Jorge Valenzuela'
  );
  const [ciudadAtencion, setCiudadAtencion] = useState<CiudadAtencion>(
    () => (localStorage.getItem('amaru_ciudad') as CiudadAtencion) || 'Calama'
  );

  const [inputNombreTemp, setInputNombreTemp] = useState<string>(nombrePaciente);
  const [inputTelefonoTemp, setInputTelefonoTemp] = useState<string>(telefonoContacto);
  const [inputCiudadTemp, setInputCiudadTemp] = useState<CiudadAtencion>(ciudadAtencion);

  // Solicitud en revisión o aprobada para este paciente
  const [solicitudPaciente, setSolicitudPaciente] = useState<SolicitudReceta | null>(null);

  const actualizarSolicitudPaciente = () => {
    const todas = getSolicitudesRecetas();
    const rutLimpioUser = (userInfo.rut || userInfo.username || '').replace(/[^0-9kK]/g, '').toUpperCase();
    const encontrada = todas.find((s) => s.rut.replace(/[^0-9kK]/g, '').toUpperCase() === rutLimpioUser) || null;
    setSolicitudPaciente(encontrada);

    // Si la solicitud está aprobada y no hay pedidoActual, generar pedido representativo
    if (encontrada && encontrada.estado === 'APROBADA' && !pedidoActual) {
      setPedidoActual({
        folio: encontrada.folio,
        rutTitular: encontrada.rut,
        nombreTitular: encontrada.nombre,
        empresaEmpleadora: encontrada.empresa || (encontrada.tipoUsuario === 'Convenio Minero' ? 'Convenio Minero Faena' : 'Cliente Particular'),
        sindicatoFaena: `Atención y Despacho Sucursal ${encontrada.ciudad}`,
        saldoTotal: encontrada.monto,
        modeloArmazon: `${encontrada.armazon} - Conforme a Receta Médica`,
        fechaIngreso: encontrada.fecha,
        estadoBadge: 'EN LABORATORIO ÓPTICO',
        tieneAceleracionFiniquito: false,
        hitos: [
          {
            id: 'hito-clinico',
            nombre: 'Validación Clínica & Graduación',
            subtitulo: 'Receta médica aprobada por Óptico Director',
            descripcion: `Graduación autorizada para ${encontrada.nombre}. Parámetros visados conforme a receta médica oficial.`,
            fecha: encontrada.fecha,
            estado: 'completed',
            tipoIcono: 'clinica',
          },
          {
            id: 'hito-laboratorio',
            nombre: 'Laboratorio Óptico',
            subtitulo: 'Biselado y Montaje de Cristales',
            descripcion: `Montaje en montura ${encontrada.armazon} con control de calidad ISO 9001 en sucursal ${encontrada.ciudad}.`,
            estado: 'active',
            tipoIcono: 'laboratorio',
          },
          {
            id: 'hito-despacho',
            nombre: 'Despacho Logístico',
            subtitulo: `Despacho a sucursal ${encontrada.ciudad}`,
            descripcion: `Programado para entrega en ${encontrada.ciudad}.`,
            estado: 'pending',
            tipoIcono: 'despacho',
          },
          {
            id: 'hito-entrega',
            nombre: 'Entrega Conforme',
            subtitulo: 'Recepción por paciente',
            descripcion: 'Entrega con certificación óptica y garantía de adaptación 100%.',
            estado: 'pending',
            tipoIcono: 'entrega',
          },
          {
            id: 'hito-financiero',
            nombre: 'Estado Financiero',
            subtitulo: encontrada.modalidadPago,
            descripcion: encontrada.modalidadPago,
            estado: 'completed',
            tipoIcono: 'finanzas',
          },
        ],
      });
      setSinPedidos(false);
    }
  };

  useEffect(() => {
    actualizarSolicitudPaciente();
    const handleRecetasUpdated = () => actualizarSolicitudPaciente();
    window.addEventListener('amaru_recetas_updated', handleRecetasUpdated);
    window.addEventListener('storage', handleRecetasUpdated);
    return () => {
      window.removeEventListener('amaru_recetas_updated', handleRecetasUpdated);
      window.removeEventListener('storage', handleRecetasUpdated);
    };
  }, [userInfo.rut, userInfo.username]);

  const handleGuardarDatosContacto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNombreTemp.trim()) {
      setToastMensaje('El Nombre y Apellido no puede estar vacío.');
      setTimeout(() => setToastMensaje(null), 3000);
      return;
    }
    setNombrePaciente(inputNombreTemp.trim());
    setTelefonoContacto(inputTelefonoTemp.trim());
    setCiudadAtencion(inputCiudadTemp);

    localStorage.setItem('amaru_nombre_paciente', inputNombreTemp.trim());
    localStorage.setItem('amaru_telefono', inputTelefonoTemp.trim());
    localStorage.setItem('amaru_ciudad', inputCiudadTemp);

    window.dispatchEvent(new Event('amaru_perfil_updated'));
    setEditandoDatos(false);
    setToastMensaje('Tus datos de contacto han sido actualizados con éxito.');
    setTimeout(() => setToastMensaje(null), 4000);
  };

  const handleRecetaEnviada = (datos: SolicitudReceta) => {
    setRecetaCargadaLocal(true);
    setSolicitudPaciente(datos);
    if (datos.nombre) {
      setNombrePaciente(datos.nombre);
      setInputNombreTemp(datos.nombre);
    }
    if (datos.telefono) {
      setTelefonoContacto(datos.telefono);
      setInputTelefonoTemp(datos.telefono);
    }
    if (datos.ciudad) {
      setCiudadAtencion(datos.ciudad);
      setInputCiudadTemp(datos.ciudad);
    }
    setToastMensaje(`¡Solicitud ${datos.folio} enviada con éxito! Tu receta y armazón ${datos.armazon} están en validación.`);
    setTimeout(() => setToastMensaje(null), 6000);
  };

  // Consulta inicial de pedidos si el usuario es Paciente
  const cargarPedidosPaciente = async (rut: string) => {
    setBuscando(true);
    setMensajeError(null);
    try {
      const token = localStorage.getItem('amaru_access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/v1/transacciones/seguimiento/?rut=${encodeURIComponent(rut)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 403) {
        setMensajeError('Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos.');
        setSinPedidos(true);
        setPedidoActual(null);
        return;
      }

      if (!res.ok) {
        setSinPedidos(true);
        setPedidoActual(null);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPedidoActual(data[0]);
        setInputFolio(data[0].folio);
        setSinPedidos(false);
      } else {
        setSinPedidos(true);
        setPedidoActual(null);
      }
    } catch (err) {
      console.warn('Backend no disponible para cargar pedidos del paciente:', err);
      setSinPedidos(true);
      setPedidoActual(null);
    } finally {
      setBuscando(false);
      setCargandoInicial(false);
    }
  };

  useEffect(() => {
    if (esPaciente) {
      const rut = userInfo.rut || userInfo.username;
      if (rut) {
        cargarPedidosPaciente(rut);
      } else {
        setSinPedidos(true);
        setCargandoInicial(false);
      }
    }
  }, [esPaciente, userInfo.rut, userInfo.username]);

  // Manejo de la búsqueda protegida con RBAC Ley 21.719
  const handleBuscar = async (folioBuscado?: string) => {
    const termino = (folioBuscado || inputFolio).trim();
    if (!termino) {
      setMensajeError('Por favor ingresa un número de Folio o RUT para buscar.');
      return;
    }

    const rutLimpioUser = (userInfo.rut || userInfo.username).replace(/[^0-9kK]/g, '').toUpperCase();
    const terminoLimpio = termino.replace(/[^0-9kK]/g, '').toUpperCase();
    const terminoMayus = termino.toUpperCase();

    // Si el usuario es Paciente, bloquear intentos de buscar a terceros
    if (esPaciente) {
      const pareceRut = termino.includes('-') || (terminoLimpio.length >= 7 && /^[0-9]+[0-9K]$/.test(terminoLimpio));
      if (pareceRut && terminoLimpio !== rutLimpioUser) {
        setMensajeError('Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos.');
        return;
      }

      if (PEDIDOS_DEMO[terminoMayus]) {
        const rutTitularDemo = PEDIDOS_DEMO[terminoMayus].rutTitular.replace(/[^0-9kK]/g, '').toUpperCase();
        if (rutTitularDemo !== rutLimpioUser) {
          setMensajeError('Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos.');
          return;
        }
      }
    }

    setBuscando(true);
    setMensajeError(null);

    try {
      const token = localStorage.getItem('amaru_access_token');

      // 1. Intentar consulta directa por folio
      const urlFolio = `http://127.0.0.1:8000/api/v1/transacciones/pedidos/${encodeURIComponent(terminoMayus)}/seguimiento/`;
      const resFolio = await fetch(urlFolio, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      if (resFolio.status === 403) {
        const err = await resFolio.json().catch(() => ({}));
        setMensajeError(err.detail || 'Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos.');
        setBuscando(false);
        return;
      }

      if (resFolio.ok) {
        const dataFolio = await resFolio.json();
        setPedidoActual(dataFolio);
        setInputFolio(dataFolio.folio);
        setSinPedidos(false);
        setBuscando(false);
        return;
      }

      // 2. Intentar consulta por RUT
      const urlRut = `http://127.0.0.1:8000/api/v1/transacciones/seguimiento/?rut=${encodeURIComponent(termino)}`;
      const resRut = await fetch(urlRut, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      if (resRut.status === 403) {
        const err = await resRut.json().catch(() => ({}));
        setMensajeError(err.detail || 'Acceso denegado: Por protección de datos clínicos (Ley 21.719), solo puede consultar sus propios pedidos.');
        setBuscando(false);
        return;
      }

      if (resRut.ok) {
        const dataRut = await resRut.json();
        if (Array.isArray(dataRut) && dataRut.length > 0) {
          setPedidoActual(dataRut[0]);
          setInputFolio(dataRut[0].folio);
          setSinPedidos(false);
          setBuscando(false);
          return;
        }
      }

      // 3. Si es paciente y no se halló en backend, no mostrar demos de otros
      if (esPaciente) {
        setSinPedidos(true);
        setPedidoActual(null);
        setBuscando(false);
        return;
      }

      // 4. Si no es paciente, permitir catálogo demo o simulación (búsqueda por Folio, RUT o Nombre)
      const matchDemo = Object.values(PEDIDOS_DEMO).find(
        (p) =>
          p.folio.toUpperCase() === terminoMayus ||
          (terminoLimpio.length >= 7 && p.rutTitular.replace(/[^0-9kK]/g, '').toUpperCase() === terminoLimpio) ||
          p.nombreTitular.toLowerCase().includes(termino.toLowerCase())
      );
      if (matchDemo) {
        setPedidoActual(matchDemo);
        setInputFolio(matchDemo.folio);
        setSinPedidos(false);
      } else if (PEDIDOS_DEMO[terminoMayus]) {
        setPedidoActual(PEDIDOS_DEMO[terminoMayus]);
        setInputFolio(terminoMayus);
        setSinPedidos(false);
      } else {
        const nuevoMock: PedidoTrazabilidad = {
          folio: terminoMayus,
          rutTitular: '16.784.920-3',
          nombreTitular: 'Colaborador Minería En Consulta',
          empresaEmpleadora: 'Consorcio Minero del Norte',
          sindicatoFaena: 'Sindicato Base de Trabajadores',
          saldoTotal: 120000,
          modeloArmazon: 'EPP-ESTANDAR-004 - Lente de Seguridad Policarbonato',
          fechaIngreso: 'Reciente',
          estadoBadge: 'EN PROCESAMIENTO',
          tieneAceleracionFiniquito: false,
          hitos: [
            {
              id: 'hito-clinico',
              nombre: 'Validación Clínica',
              subtitulo: 'Receta médica visada por backend',
              descripcion: 'Parámetros ópticos registrados en terminal.',
              fecha: 'Hoy',
              estado: 'completed',
              tipoIcono: 'clinica',
            },
            {
              id: 'hito-laboratorio',
              nombre: 'Laboratorio Óptico Central',
              subtitulo: 'En proceso de fabricación',
              descripcion: 'Asignado a línea de producción.',
              estado: 'active',
              tipoIcono: 'laboratorio',
            },
            {
              id: 'hito-despacho',
              nombre: 'Despacho a Faena',
              subtitulo: 'En tránsito a sucursal de faena',
              descripcion: 'Pendiente de despacho logístico.',
              estado: 'pending',
              tipoIcono: 'despacho',
            },
            {
              id: 'hito-entrega',
              nombre: 'Entrega DS 594',
              subtitulo: 'Entregado al trabajador',
              descripcion: 'Pendiente de entrega física en policlínico/faena.',
              estado: 'pending',
              tipoIcono: 'entrega',
            },
            {
              id: 'hito-financiero',
              nombre: 'Estado Financiero',
              subtitulo: 'Cobranza Normal',
              descripcion: 'Modalidad convenio cuotas normales.',
              estado: 'completed',
              tipoIcono: 'finanzas',
            },
          ],
        };
        setPedidoActual(nuevoMock);
        setInputFolio(terminoMayus);
        setSinPedidos(false);
      }
    } catch (e: any) {
      if (esPaciente) {
        setSinPedidos(true);
        setPedidoActual(null);
      } else {
        setMensajeError(e.message || 'Error al consultar seguimiento');
      }
    } finally {
      setBuscando(false);
    }
  };

  const handleCopiarHash = (hash: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(hash);
    setHashCopiado(true);
    setTimeout(() => setHashCopiado(false), 2500);
  };

  const handleDescargarComprobante = async (folio: string) => {
    try {
      setDescargandoPDF('comprobante');
      await descargarComprobantePDF(folio);
    } catch (e: any) {
      alert(`Información: ${e.message || 'Error al descargar comprobante PDF'}`);
    } finally {
      setDescargandoPDF(null);
    }
  };

  const handleDescargarFiniquito = async (folio: string) => {
    if (!pedidoActual) return;
    try {
      setDescargandoPDF('finiquito');
      await acelerarYDescargarFiniquitoPDF(folio, pedidoActual.rutTitular);
    } catch (e: any) {
      alert(`Información: ${e.message || 'Error al generar documento de finiquito'}`);
    } finally {
      setDescargandoPDF(null);
    }
  };

  // Renderizador del ícono según el tipo de hito y su estado
  const renderIconoHito = (hito: HitoTrazabilidad) => {
    const size = 20;

    switch (hito.tipoIcono) {
      case 'clinica':
        return <FileCheck2 size={size} />;
      case 'laboratorio':
        return <Package size={size} />;
      case 'despacho':
        return <Truck size={size} />;
      case 'entrega':
        return <ShieldCheck size={size} />;
      case 'finanzas':
        return hito.estado === 'alert' ? <AlertTriangle size={size} /> : <DollarSign size={size} />;
      default:
        return <CheckCircle2 size={size} />;
    }
  };

  // Clases cromáticas para los nodos del Stepper
  const getBadgeColors = (estado: EstadoHito) => {
    switch (estado) {
      case 'completed':
        return {
          nodeBg:
            'bg-emerald-500 text-white border-4 border-emerald-100 dark:border-emerald-950/80 shadow-xs',
          lineBg: 'bg-emerald-500 dark:bg-emerald-600',
          pillBg:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
          titleColor: 'text-slate-900 dark:text-white',
        };
      case 'active':
        return {
          nodeBg:
            'bg-blue-600 text-white border-4 border-blue-100 dark:border-blue-950/80 shadow-md ring-4 ring-blue-500/20 animate-pulse',
          lineBg: 'bg-slate-200 dark:bg-zinc-700',
          pillBg:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
          titleColor: 'text-blue-700 dark:text-blue-300 font-bold',
        };
      case 'alert':
        return {
          nodeBg:
            'bg-amber-600 text-white border-4 border-amber-100 dark:border-amber-950/80 shadow-md ring-4 ring-amber-500/20 animate-bounce',
          lineBg: 'bg-slate-200 dark:bg-zinc-700',
          pillBg:
            'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
          titleColor: 'text-amber-800 dark:text-amber-300 font-bold',
        };
      case 'pending':
      default:
        return {
          nodeBg:
            'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-4 border-slate-50 dark:border-zinc-900',
          lineBg: 'bg-slate-200 dark:bg-zinc-800',
          pillBg:
            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/50',
          titleColor: 'text-slate-500 dark:text-zinc-400',
        };
    }
  };

  // ── Estados y auxiliares computados para Portal del Paciente (Live Tracking vs Nueva Receta) ──
  const tieneSolicitudOPedido = Boolean(solicitudPaciente || pedidoActual);
  const nombreArmazonActivo =
    solicitudPaciente?.armazon ||
    (pedidoActual?.modeloArmazon ? pedidoActual.modeloArmazon.split(' - ')[0] : 'Titanium Shield Pro');
  const folioActivo = solicitudPaciente?.folio || pedidoActual?.folio || 'FOLIO-AMARU';
  const ciudadDespachoActiva = solicitudPaciente?.ciudad || ciudadAtencion || 'Calama';
  const estadoSolicitudActiva = solicitudPaciente?.estado || (pedidoActual ? 'APROBADA' : 'EN_REVISION');
  const esSolicitudAprobada = estadoSolicitudActiva === 'APROBADA' || Boolean(pedidoActual);
  const esSolicitudObservada = estadoSolicitudActiva === 'OBSERVADA';

  const renderIconoArmazon = (nombre?: string) => {
    const n = nombre || '';
    if (n.includes('Lumière') || n.includes('Acetato')) {
      return <AcetatoLumiereIcon size={34} className="text-amaru-copper shrink-0" />;
    }
    if (n.includes('Flex') || n.includes('Steel')) {
      return <UltralightFlexIcon size={34} className="text-amaru-copper shrink-0" />;
    }
    return <TitanioProIcon size={34} className="text-amaru-copper shrink-0" />;
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── Encabezado de Vista: Saludo Humano para Paciente vs Trazabilidad Técnica para Operador / Admin ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          {esPaciente ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Hola, {nombrePaciente}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Resumen de tu salud visual y seguimiento de tus lentes.
              </p>
            </>
          ) : esOperador ? (
            <>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
                  <Compass size={18} />
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-amaru-copper">
                  Consulta Rápida de Pedidos en Mesón
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Seguimiento de Venta y Laboratorio
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Información en tiempo real para informar el avance a tus pacientes y coordinar entregas.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper dark:bg-amaru-copper/20">
                  <Layers size={18} />
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-amaru-copper">
                  Trazabilidad Clínica & Logística Omnicanal
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Seguimiento de Pedido Óptico
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Control integral de hitos clínicos, fabricación en laboratorio, despacho (domicilio o faena) y resguardo financiero.
              </p>
            </>
          )}
        </div>

        {/* Acceso rápido a comprobantes PDF y Soporte WhatsApp */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Botón de Soporte por WhatsApp (Ocultar estrictamente para el Vendedor) */}
          {!esOperador && (
            <a
              href={`https://wa.me/56985860973?text=Hola,%20necesito%20asistencia%20en%20el%20Portal%20del%20Paciente%20(RUT:%20${encodeURIComponent(userInfo.rut || userInfo.username || '')})`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir chat de WhatsApp para asistencia técnica o logística"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <WhatsAppIcon size={16} />
              <span>Contactar Soporte</span>
            </a>
          )}

          {pedidoActual?.hitos?.find((h) => h.id === 'hito-entrega' && h.selloSha256) && (
            <button
              onClick={() => handleDescargarComprobante(pedidoActual.folio)}
              disabled={descargandoPDF !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#24211F] border border-slate-200 dark:border-zinc-800 hover:border-amaru-copper text-slate-700 dark:text-zinc-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Download size={14} className="text-amaru-copper" />
              <span>
                {descargandoPDF === 'comprobante' ? 'Generando...' : 'Comprobante Entrega PDF'}
              </span>
            </button>
          )}

          {/* Ocultar Liquidación Finiquito PDF estrictamente para el Vendedor */}
          {!esOperador && pedidoActual?.tieneAceleracionFiniquito && (
            <button
              onClick={() => handleDescargarFiniquito(pedidoActual.folio)}
              disabled={descargandoPDF !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <AlertTriangle size={14} />
              <span>
                {descargandoPDF === 'finiquito' ? 'Generando...' : 'Liquidación Finiquito PDF'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMensaje && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMensaje}</span>
          </div>
          <button
            onClick={() => setToastMensaje(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 rounded-lg cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Módulos del Portal del Paciente (Self-Service Bento Grid Dinámico) ── */}
      {esPaciente && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-stagger-1">
          {/* Columna Izquierda: Dinámica (CASO A: Trazabilidad en Tiempo Real vs CASO B: Renovación Directa) */}
          {tieneSolicitudOPedido ? (
            /* ── CASO A: Trazabilidad en Tiempo Real de su Producto ── */
            <div className="lg:col-span-7 card-zenith optical-sheen rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.02] to-transparent border border-amber-500/25 dark:border-amber-500/35 shadow-md flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230]" />

              {/* Cabecera Limpia: SVG Armazón + Folio + Ciudad + Botón "+ Nueva Receta" */}
              <div>
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 rounded-2xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-center shrink-0">
                      {renderIconoArmazon(nombreArmazonActivo)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                          {nombreArmazonActivo}
                        </h3>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          {folioActivo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-amaru-copper">
                          <MapPin size={12} />
                          <span>Despacho {ciudadDespachoActiva}</span>
                        </span>
                        <span>·</span>
                        <span className="truncate">
                          {solicitudPaciente?.tipoUsuario || 'Atención Oftálmica'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalRecetaOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-amaru-copper text-amaru-copper text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>+ Nueva Receta</span>
                  </button>
                </div>

                {/* Stepper Visual de 4 Etapas (sin textos largos) */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Estado de Fabricación en Tiempo Real
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        esSolicitudAprobada
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : esSolicitudObservada
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {esSolicitudAprobada
                        ? 'En Fabricación Óptica'
                        : esSolicitudObservada
                        ? 'Receta Observada'
                        : 'En Validación Médica'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Etapa 1: Receta Recibida */}
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-black/30 border border-emerald-500/40 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 font-bold">
                        <Check size={16} strokeWidth={2.8} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        1. Receta Recibida
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5">
                        Completado ✓
                      </span>
                    </div>

                    {/* Etapa 2: Validación Óptica */}
                    <div
                      className={`p-3 rounded-2xl flex flex-col items-center text-center shadow-2xs border ${
                        esSolicitudAprobada
                          ? 'bg-white/80 dark:bg-black/30 border-emerald-500/40'
                          : esSolicitudObservada
                          ? 'bg-red-500/5 dark:bg-red-500/15 border-red-500/40'
                          : 'bg-amber-500/5 dark:bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/20'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 font-bold ${
                          esSolicitudAprobada
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : esSolicitudObservada
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {esSolicitudAprobada ? (
                          <Check size={16} strokeWidth={2.8} />
                        ) : esSolicitudObservada ? (
                          <AlertTriangle size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                        2. Validación Óptica
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase mt-0.5 ${
                          esSolicitudAprobada
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : esSolicitudObservada
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400 font-extrabold'
                        }`}
                      >
                        {esSolicitudAprobada
                          ? 'Validada ✓'
                          : esSolicitudObservada
                          ? 'Observada'
                          : 'En Curso'}
                      </span>
                    </div>

                    {/* Etapa 3: Montaje de Cristales en Laboratorio */}
                    <div
                      className={`p-3 rounded-2xl flex flex-col items-center text-center shadow-2xs border ${
                        esSolicitudAprobada
                          ? 'bg-blue-500/5 dark:bg-blue-500/15 border-blue-500/40 ring-2 ring-blue-500/20'
                          : 'bg-slate-50/50 dark:bg-black/20 border-slate-200/60 dark:border-white/5 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 font-bold ${
                          esSolicitudAprobada
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse'
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-400'
                        }`}
                      >
                        <Layers size={15} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                        3. Montaje Cristales
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase mt-0.5 ${
                          esSolicitudAprobada
                            ? 'text-blue-600 dark:text-blue-400 font-black'
                            : 'text-slate-400'
                        }`}
                      >
                        {esSolicitudAprobada ? 'En Laboratorio' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Etapa 4: Listo para Entrega en [Ciudad] */}
                    <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 opacity-60 flex flex-col items-center text-center shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mb-1.5">
                        <Truck size={15} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate max-w-full">
                        4. Entrega {ciudadDespachoActiva}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                        Pendiente
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie con Canal de Asistencia Directa */}
              <div className="pt-4 mt-4 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  ¿Deseas asistencia o consultar con el óptico a cargo?
                </span>
                <a
                  href={`https://wa.me/56985860973?text=Hola,%20consulto%20por%20mi%20pedido%20(${folioActivo})%20en%20sucursal%20${encodeURIComponent(ciudadDespachoActiva)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <WhatsAppIcon size={14} />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* ── CASO B: Sin solicitud ni pedido - Máxima Simplificación ── */
            <div className="lg:col-span-7 card-zenith optical-sheen rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent border border-amber-500/25 dark:border-amber-500/35 shadow-md flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230]" />

              <div className="space-y-2.5 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles size={13} className="text-amaru-copper animate-pulse" />
                  <span>Salud Visual & Óptica</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  ¿Necesitas renovar tus lentes?
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Sube tu receta médica o solicita evaluación en Calama y Antofagasta.
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-amber-500/15 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalRecetaOpen(true)}
                  className="w-full sm:w-auto flex-1 btn-copper px-6 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-orange-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <FileUp size={18} />
                  <span>Ingresar / Subir Receta Médica</span>
                  <ArrowRight size={16} />
                </button>
                <a
                  href="https://wa.me/56985860973?text=Hola,%20quiero%20cotizar%20mis%20lentes%20ópticos%20en%20Óptica%20Amaru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-amaru-copper text-slate-700 dark:text-zinc-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <WhatsAppIcon size={16} />
                  <span>Asesoría Directa</span>
                </a>
              </div>
            </div>
          )}

          {/* Columna Derecha: Tarjeta Compacta de Contacto y Estado (40% / col-span-5) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Ficha de Datos de Contacto */}
            <div className="card-zenith rounded-3xl p-5 relative flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper">
                    <User size={15} />
                  </span>
                  <h4 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
                    Mis Datos de Contacto
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditandoDatos(!editandoDatos);
                    setInputNombreTemp(nombrePaciente);
                    setInputTelefonoTemp(telefonoContacto);
                    setInputCiudadTemp(ciudadAtencion);
                  }}
                  className="text-xs font-semibold text-amaru-copper hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} />
                  <span>{editandoDatos ? 'Cancelar' : 'Editar'}</span>
                </button>
              </div>

              {editandoDatos ? (
                <form onSubmit={handleGuardarDatosContacto} className="pt-3 space-y-3">
                  {/* Nombre y Apellido Editable */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      value={inputNombreTemp}
                      onChange={(e) => setInputNombreTemp(e.target.value)}
                      placeholder="Registra tu Nombre y Apellido real"
                      required
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-zinc-200 font-semibold focus:ring-2 focus:ring-amaru-copper focus:outline-hidden"
                    />
                  </div>

                  {/* RUT y Correo Electrónico INALTERABLES con candado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          RUT
                        </label>
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                          <Lock size={9} />
                          <span>Inalterable</span>
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formatearRUT(userInfo.rut || userInfo.username)}
                        readOnly
                        disabled
                        className="w-full px-2.5 py-1 text-xs bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl font-mono text-slate-500 cursor-not-allowed select-none font-bold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Correo
                        </label>
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                          <Lock size={9} />
                          <span>Inalterable</span>
                        </span>
                      </div>
                      <input
                        type="email"
                        value={emailContacto}
                        readOnly
                        disabled
                        className="w-full px-2.5 py-1 text-xs bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 cursor-not-allowed select-none truncate"
                      />
                    </div>
                  </div>

                  {/* Teléfono Móvil */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                      Teléfono Móvil / WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={inputTelefonoTemp}
                      onChange={(e) => setInputTelefonoTemp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                    />
                  </div>

                  {/* Ciudad de Atención / Despacho (SOLO Calama y Antofagasta) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block mb-1">
                      Ciudad de Despacho * (Opciones Estrictas)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInputCiudadTemp('Calama')}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputCiudadTemp === 'Calama'
                            ? 'bg-amaru-copper/15 border-amaru-copper text-amaru-copper shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <MapPin size={12} />
                        <span>Calama</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputCiudadTemp('Antofagasta')}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputCiudadTemp === 'Antofagasta'
                            ? 'bg-amaru-copper/15 border-amaru-copper text-amaru-copper shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <MapPin size={12} />
                        <span>Antofagasta</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="btn-copper px-4 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-medium text-slate-400">Titular</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[190px]">
                      {nombrePaciente}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1" title="Dato inalterable de seguridad">
                      <span>RUT</span>
                      <Lock size={10} className="text-amber-500" />
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {formatearRUT(userInfo.rut || userInfo.username)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1" title="Dato inalterable de seguridad">
                      <span>Correo</span>
                      <Lock size={10} className="text-amber-500" />
                    </span>
                    <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 truncate max-w-[180px]">
                      <Mail size={11} className="text-sky-500 shrink-0" />
                      <span className="truncate">{emailContacto}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-medium text-slate-400">Teléfono</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Phone size={11} className="text-emerald-500 shrink-0" />
                      <span>{telefonoContacto}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] font-medium text-slate-400">Ciudad de Despacho</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                      <MapPin size={11} className="text-amaru-copper shrink-0" />
                      <span>{ciudadAtencion}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de Estado en 2 Líneas (Receta + Pedido en Curso) */}
            <div className="card-zenith rounded-3xl p-5 relative">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/5">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Eye size={15} />
                </span>
                <h4 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
                  Estado Clínico y de Pedido
                </h4>
              </div>

              <div className="pt-3 space-y-2.5 text-xs">
                {/* Línea 1: Estado de Receta */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Receta Médica</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200 text-xs truncate block">
                      {solicitudPaciente?.estado === 'APROBADA'
                        ? 'Validada conforme (12 meses MINSAL)'
                        : solicitudPaciente?.estado === 'OBSERVADA'
                        ? `Observada: ${solicitudPaciente.motivoObservacion || 'Requiere nueva receta'}`
                        : solicitudPaciente?.estado === 'EN_REVISION' || recetaCargadaLocal
                        ? 'En validación por el Director Óptico'
                        : pedidoActual
                        ? 'Validada por especialista'
                        : 'Sin receta activa'}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                      solicitudPaciente?.estado === 'APROBADA'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-black'
                        : solicitudPaciente?.estado === 'OBSERVADA'
                        ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                        : solicitudPaciente?.estado === 'EN_REVISION' || recetaCargadaLocal
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : pedidoActual
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300'
                    }`}
                  >
                    {solicitudPaciente?.estado === 'APROBADA'
                      ? 'Validada'
                      : solicitudPaciente?.estado === 'OBSERVADA'
                      ? 'Observada'
                      : solicitudPaciente?.estado === 'EN_REVISION' || recetaCargadaLocal
                      ? 'En Revisión'
                      : pedidoActual
                      ? 'Vigente'
                      : 'Pendiente'}
                  </span>
                </div>

                {/* Línea 2: Estado de Pedido */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pedido en Curso</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200 text-xs truncate block max-w-[200px]">
                      {solicitudPaciente?.estado === 'APROBADA'
                        ? `${solicitudPaciente.armazon} (En Fabricación)`
                        : solicitudPaciente?.estado === 'EN_REVISION'
                        ? `${solicitudPaciente.armazon} (Pre-Ingreso)`
                        : pedidoActual
                        ? pedidoActual.modeloArmazon
                        : 'Sin pedidos activos'}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${
                      solicitudPaciente?.estado === 'APROBADA'
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-black'
                        : solicitudPaciente?.estado === 'EN_REVISION'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : pedidoActual
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300'
                    }`}
                  >
                    {solicitudPaciente?.estado === 'APROBADA'
                      ? 'En Fabricación'
                      : solicitudPaciente?.estado === 'EN_REVISION'
                      ? 'En Revisión'
                      : pedidoActual
                      ? pedidoActual.estadoBadge
                      : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Buscador Superior Minimalista (Solo para Operador / Admin / Auditor) ── */}
      {!esPaciente && (
        <div className="card-zenith rounded-2xl p-5 sm:p-6 transition-all">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBuscar();
            }}
            className="flex flex-col sm:flex-row gap-3 items-stretch"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={inputFolio}
                onChange={(e) => setInputFolio(e.target.value)}
                placeholder={
                  esOperador
                    ? "Buscar por RUT, Nombre del Cliente o Folio (ej. Mario Cárdenas, 24.533.343-9, FOLIO-8F1085AD)..."
                    : "Ingresa Folio del Pedido (ej. FOLIO-8F1085AD)..."
                }
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amaru-copper focus:border-transparent text-slate-900 dark:text-white placeholder:text-slate-400 font-medium transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={buscando}
              className="btn-copper px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {buscando ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <Search size={16} />
              )}
              <span>{esOperador ? 'Buscar Pedido' : 'Buscar Folio'}</span>
            </button>

            {!esOperador && (
              <a
                href={`https://wa.me/56985860973?text=Hola,%20necesito%20ayuda%20con%20mi%20pedido%20folio:%20${encodeURIComponent(pedidoActual?.folio || inputFolio || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Contactar soporte por WhatsApp"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                <WhatsAppIcon size={16} />
                <span>Contactar Soporte</span>
              </a>
            )}
          </form>

          {mensajeError && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-medium">
              <AlertTriangle size={15} className="shrink-0 text-red-500" />
              <span>{mensajeError}</span>
            </div>
          )}

          {/* Selector rápido de folios/clientes de prueba */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              {esOperador ? 'Ejemplos Rápidos de Clientes:' : 'Ejemplos de Atención Omnicanal:'}
            </span>
            <button
              type="button"
              onClick={() => handleBuscar('FOLIO-8F1085AD')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                pedidoActual?.folio === 'FOLIO-8F1085AD'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-amaru-copper'
              }`}
            >
              <span className="font-semibold">{esOperador ? 'Mario Cárdenas' : 'FOLIO-8F1085AD'}</span>
              <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-medium">
                Convenio Minero
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleBuscar('FOLIO-2B4C8901')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                pedidoActual?.folio === 'FOLIO-2B4C8901'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-800 dark:text-sky-200 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-amaru-copper'
              }`}
            >
              <span className="font-semibold">{esOperador ? 'Claudia Soto' : 'FOLIO-2B4C8901'}</span>
              <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-medium">
                Cliente Particular
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleBuscar('FOLIO-4D7E1123')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                pedidoActual?.folio === 'FOLIO-4D7E1123'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-amaru-copper'
              }`}
            >
              <span className="font-semibold">{esOperador ? 'Roberto Morales' : 'FOLIO-4D7E1123'}</span>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">
                Convenio Salud
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido Principal: Cargando / Sin Pedidos (Empty State) / Detalle de Pedido ── */}
      {cargandoInicial ? (
        <div className="card-zenith rounded-2xl p-12 text-center max-w-md mx-auto my-6 border border-slate-200/80 dark:border-zinc-800/80 animate-pulse">
          <div className="w-12 h-12 mx-auto rounded-full bg-amaru-copper/20 flex items-center justify-center text-amaru-copper mb-4">
            <span className="text-xl animate-spin">⏳</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Consultando tus pedidos en Óptica Amaru...
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
            Validando identidad y credenciales clínicas
          </p>
        </div>
      ) : (sinPedidos || !pedidoActual) ? (
        esPaciente ? null : (
          <div className="card-zenith animate-stagger-3 rounded-2xl p-8 text-center max-w-lg mx-auto my-6 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Search size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No se encontró el folio o RUT buscado
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Verifica el identificador ingresado en el buscador superior o selecciona un ejemplo de atención omnicanal.
            </p>
          </div>
        )
      ) : (
        <>
          {/* ── 2. Tarjeta de Resumen del Pedido (Vendedor Amigable vs Técnico Admin) ── */}
          {esOperador ? (
            <div
              key={`vendedor-card-${pedidoActual.folio}`}
              className="card-zenith optical-sheen animate-stagger-1 rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-200 border border-slate-200/90 dark:border-white/10 shadow-sm"
            >
              {/* Cabecera del Resumen: Nombre del Cliente + Estado Actual */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amaru-copper">
                      Folio: {pedidoActual.folio}
                    </span>
                    <span className="text-slate-300 dark:text-zinc-600">·</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Ingresado: {pedidoActual.fechaIngreso}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {pedidoActual.nombreTitular}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{limpiarEstadoHumano(pedidoActual.estadoBadge)}</span>
                  </span>
                </div>
              </div>

              {/* Grid de 4 Bloques: RUT, Teléfono, Sucursal, Armazón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-5 border-b border-slate-100 dark:border-white/5">
                {/* 1. RUT */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-amaru-copper" />
                    RUT del Paciente
                  </span>
                  <p className="font-mono text-base font-extrabold text-slate-800 dark:text-zinc-100">
                    {formatearRUT(pedidoActual.rutTitular)}
                  </p>
                </div>

                {/* 2. Teléfono / Contacto */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
                    Teléfono / WhatsApp
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-100">
                    +56 9 8586 0973
                  </p>
                </div>

                {/* 3. Ciudad / Sucursal */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={13} className="text-amaru-copper" />
                    Sucursal de Retiro
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
                    Sucursal {sucursalActiva || (pedidoActual.folio === 'FOLIO-8F1085AD' ? 'Calama' : 'Antofagasta')}
                  </p>
                </div>

                {/* 4. Armazón Elegido */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amaru-copper" />
                    Armazón Seleccionado
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-1">
                    {pedidoActual.modeloArmazon.split('-')[0].trim()}
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate block">
                    {pedidoActual.modeloArmazon}
                  </span>
                </div>
              </div>

              {/* Acciones del Vendedor en Mesón */}
              <div className="pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <Building2 size={15} className="text-amaru-copper shrink-0" />
                  <span>Modalidad: <strong className="text-slate-800 dark:text-zinc-200">{pedidoActual.empresaEmpleadora}</strong></span>
                  <span>·</span>
                  <span>Total: <strong className="text-slate-900 dark:text-white font-mono">{formatCLP(pedidoActual.saldoTotal)}</strong></span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Acción Principal: Avisar al Cliente por WhatsApp */}
                  <a
                    href={`https://wa.me/56985860973?text=${encodeURIComponent(
                      `Hola ${pedidoActual.nombreTitular}, te escribimos de Óptica Amaru Sucursal ${sucursalActiva || 'Calama'} para informarte sobre tus lentes (Folio ${pedidoActual.folio}): actualmente se encuentran en estado '${limpiarEstadoHumano(pedidoActual.estadoBadge)}'. Si tienes dudas o deseas coordinar tu retiro, avísanos por este medio.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <WhatsAppIcon size={16} />
                    <span>Avisar al Cliente por WhatsApp</span>
                  </a>

                  {/* Botón Secundario: Comprobante Entrega PDF */}
                  <button
                    type="button"
                    onClick={() => handleDescargarComprobante(pedidoActual.folio)}
                    disabled={descargandoPDF !== null}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 hover:border-amaru-copper text-slate-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download size={14} className="text-amaru-copper" />
                    <span>{descargandoPDF === 'comprobante' ? 'Generando...' : 'Comprobante Entrega PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={pedidoActual.folio}
              className="card-zenith optical-sheen animate-stagger-1 rounded-2xl relative overflow-hidden transition-all duration-200"
            >
              {/* Franja superior metálica / cobriza con textura industrial */}
              <div className="h-2.5 w-full bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230] border-b border-amber-300/30" />

              {/* Sub-header Contextual: Minero, Particular o Isapre */}
              <div className="px-6 pt-3 pb-2 bg-slate-50/80 dark:bg-black/20 border-b border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${pedidoActual.tieneAceleracionFiniquito ? 'bg-amber-500' : 'bg-amaru-copper'} animate-pulse`} />
                  <span className="font-bold tracking-widest uppercase text-amaru-copper dark:text-orange-400">
                    {pedidoActual.tieneAceleracionFiniquito || pedidoActual.modeloArmazon.includes('DS 594')
                      ? 'PASE TÉCNICO DE FAENA · PROTOCOLO DS N° 594'
                      : pedidoActual.empresaEmpleadora.toLowerCase().includes('particular')
                      ? 'COMPROBANTE CLÍNICO & BOUTIQUE · ÓPTICA AMARU'
                      : 'CONVENIO INSTITUCIONAL & SALUD · ÓPTICA AMARU'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
                  <span>
                    {pedidoActual.tieneAceleracionFiniquito || pedidoActual.modeloArmazon.includes('DS 594')
                      ? 'SERIE: AMARU-IND-2026'
                      : pedidoActual.empresaEmpleadora.toLowerCase().includes('particular')
                      ? 'SERIE: AMARU-BOUTIQUE-2026'
                      : 'SERIE: AMARU-SALUD-2026'}
                  </span>
                  <span>·</span>
                  <span>
                    {pedidoActual.tieneAceleracionFiniquito || pedidoActual.modeloArmazon.includes('DS 594')
                      ? 'HOMOLOGACIÓN SALUD OCUPACIONAL'
                      : 'GARANTÍA DE ADAPTACIÓN ÓPTICA 100%'}
                  </span>
                </div>
              </div>

              {/* Marcas de registro en las 4 esquinas (CAD Crosshairs) */}
              <span className="absolute top-5 left-3 text-[11px] font-mono text-amaru-copper/50 select-none pointer-events-none">+</span>
              <span className="absolute top-5 right-3 text-[11px] font-mono text-amaru-copper/50 select-none pointer-events-none">+</span>
              <span className="absolute bottom-3 left-3 text-[11px] font-mono text-amaru-copper/50 select-none pointer-events-none">+</span>
              <span className="absolute bottom-3 right-3 text-[11px] font-mono text-amaru-copper/50 select-none pointer-events-none">+</span>

              <div className="p-6 relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                    {/* Campo 1: Folio */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        Folio Único Trazable
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {pedidoActual.folio}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopiarHash(pedidoActual.folio)}
                          title="Copiar Folio"
                          className="text-slate-400 hover:text-amaru-copper p-1 rounded-md transition-colors cursor-pointer"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
                        <Calendar size={12} className="text-amaru-copper" /> {pedidoActual.fechaIngreso}
                      </span>
                    </div>

                    {/* Campo 2: RUT y Nombre Paciente / Titular */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        RUT Paciente / Titular
                      </span>
                      <div className="flex items-center gap-1.5">
                        <User size={15} className="text-amaru-copper shrink-0" />
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-zinc-200">
                          {formatearRUT(pedidoActual.rutTitular)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 truncate">
                        {pedidoActual.nombreTitular}
                      </p>
                    </div>

                    {/* Campo 3: Modalidad / Convenio */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        Modalidad / Convenio
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Building2 size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="font-semibold text-sm text-slate-800 dark:text-zinc-200 truncate">
                          {pedidoActual.empresaEmpleadora}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                        {pedidoActual.sindicatoFaena}
                      </p>
                    </div>

                    {/* Campo 4: Saldo Total */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                        Saldo Total Pedido
                      </span>
                      <div className="flex items-center gap-1.5">
                        <DollarSign
                          size={16}
                          className={
                            pedidoActual.tieneAceleracionFiniquito
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }
                        />
                        <span
                          className={`text-lg font-extrabold tracking-tight font-mono ${
                            pedidoActual.tieneAceleracionFiniquito
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatCLP(pedidoActual.saldoTotal)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full inline-block ${
                          pedidoActual.tieneAceleracionFiniquito
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                        }`}
                      >
                        {pedidoActual.tieneAceleracionFiniquito
                          ? 'Exigible en Finiquito'
                          : 'Pago Confirmado'}
                      </span>
                    </div>
                  </div>

                  {/* Badge Estado General */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-zinc-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:block">
                      Estado Trazable
                    </span>
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wider uppercase flex items-center gap-2 ${
                        pedidoActual.tieneAceleracionFiniquito
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-2xs'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          pedidoActual.tieneAceleracionFiniquito
                            ? 'bg-amber-500 animate-ping'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span>{limpiarEstadoHumano(pedidoActual.estadoBadge)}</span>
                    </div>
                  </div>
                </div>

                {/* Modelo de Armazón Asignado */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amaru-copper shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">
                      Equipo / Modelo Óptico:
                    </span>
                    <span className="font-mono text-slate-900 dark:text-zinc-100">
                      {pedidoActual.modeloArmazon}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400">
                    <span>CERTIFICACIÓN DE PRECISIÓN ÓPTICA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Alerta Destacada si existe Aceleración por Finiquito (Solo Finanzas/Admin) ── */}
          {!esOperador && pedidoActual.tieneAceleracionFiniquito && (
            <div className="bg-amber-50/90 dark:bg-[#251D14] border-l-4 border-amber-500 border-y border-r border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-2">
                      <span>Aceleración por Finiquito - Exigible Hoy</span>
                      <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-mono font-semibold">
                        DS 594 & Art. 177 CdT
                      </span>
                    </h3>
                    <span className="text-xs font-mono font-extrabold text-amber-800 dark:text-amber-300">
                      Total Exigible: {formatCLP(pedidoActual.saldoTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Este pedido ha sido retenido legalmente por término de contrato laboral con la empresa minera.
                    Las 3 cuotas pendientes de descuento por planilla han sido consolidadas y quedan declaradas
                    en cobro preferente de retención inmediata contra la liquidación final de sueldo e indemnizaciones.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDescargarFiniquito(pedidoActual.folio)}
                      disabled={descargandoPDF !== null}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download size={13} />
                      <span>Descargar Copia Legal de Liquidación PDF</span>
                    </button>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">
                      * Hash forense registrado inmutablemente en el registro de auditoría de faena.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. Línea de Tiempo (Stepper): Vendedor Acreditado vs Técnico ── */}
          {esOperador ? (
            (() => {
              const paso2Acreditado = !pedidoActual.estadoBadge.includes('LABORATORIO') && pedidoActual.folio !== 'FOLIO-2B4C8901';
              const paso3Acreditado = Boolean(llegadasAcreditadas[pedidoActual.folio]) || (pedidoActual.folio === 'FOLIO-8F1085AD') || (!pedidoActual.estadoBadge.includes('LABORATORIO') && !pedidoActual.estadoBadge.includes('DESPACHO') && pedidoActual.folio !== 'FOLIO-2B4C8901' && pedidoActual.folio !== 'FOLIO-4D7E1123');
              const paso3EnTransito = !paso3Acreditado && (pedidoActual.estadoBadge.includes('DESPACHO') || pedidoActual.folio === 'FOLIO-4D7E1123');
              const paso4Acreditado = (pedidoActual.hitos.find(h => h.id === 'hito-entrega')?.estado === 'completed') && (pedidoActual.folio === 'FOLIO-8F1085AD');

              const totalAcreditados = 1 + (paso2Acreditado ? 1 : 0) + (paso3Acreditado ? 1 : 0) + (paso4Acreditado ? 1 : 0);

              return (
                <div key={`stepper-vendedor-${pedidoActual.folio}`} className="card-zenith animate-stagger-2 rounded-3xl p-6 sm:p-7 space-y-6 border border-slate-200/90 dark:border-white/10 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                        Progreso del Pedido (Atención al Cliente)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        4 pasos acreditados para informar al paciente y verificar disponibilidad en tienda.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-300 w-fit">
                      {totalAcreditados} de 4 Pasos Acreditados
                    </span>
                  </div>

                  {/* 4 Pasos Acreditados y Numerados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* PASO 1: Receta Validada */}
                    <div className="rounded-2xl p-4.5 border transition-all flex flex-col justify-between relative overflow-hidden bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 shadow-2xs">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-emerald-500 text-white shadow-2xs">
                            ✓
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            PASO 1 · ACREDITADO ✓
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Receta Validada
                          </h4>
                          <p className="text-[11px] font-medium text-amaru-copper dark:text-orange-400">
                            Graduación Aprobada
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            Graduación óptica y parámetros clínicos visados por especialista.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck size={14} className="shrink-0" />
                        <span className="truncate">Acreditado por Óptico Clínico · Aprobado</span>
                      </div>
                    </div>

                    {/* PASO 2: En Laboratorio Óptico */}
                    <div className={`rounded-2xl p-4.5 border transition-all flex flex-col justify-between relative overflow-hidden shadow-2xs ${
                      paso2Acreditado
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                        : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-500/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                    }`}>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-2xs ${
                            paso2Acreditado ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                          }`}>
                            {paso2Acreditado ? '✓' : '2'}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            paso2Acreditado
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}>
                            {paso2Acreditado ? 'PASO 2 · ACREDITADO ✓' : 'PASO 2 · EN LABORATORIO'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            En Laboratorio Óptico
                          </h4>
                          <p className="text-[11px] font-medium text-amaru-copper dark:text-orange-400">
                            {paso2Acreditado ? 'Montaje y Biselado Concluido' : 'Montaje en Proceso'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {paso2Acreditado
                              ? 'Cristales tallados y biselados con estándar de calidad ISO 9001.'
                              : 'Cristales de alta precisión en tallado y biselado robótico.'}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-4 pt-3 border-t flex items-center gap-1.5 text-[11px] font-semibold ${
                        paso2Acreditado
                          ? 'border-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'border-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}>
                        {paso2Acreditado ? (
                          <>
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span className="truncate">Biselado y control de calidad aprobado</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="shrink-0 animate-spin" />
                            <span className="truncate">Control de Calidad ISO 9001 en curso</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PASO 3: Recepción en Sucursal / Llegada a Tienda */}
                    <div className={`rounded-2xl p-4.5 border transition-all flex flex-col justify-between relative overflow-hidden shadow-2xs ${
                      paso3Acreditado
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                        : paso3EnTransito
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-500/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                        : 'bg-slate-50/60 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-400 opacity-70'
                    }`}>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-2xs ${
                            paso3Acreditado
                              ? 'bg-emerald-500 text-white'
                              : paso3EnTransito
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}>
                            {paso3Acreditado ? '✓' : '3'}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            paso3Acreditado
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : paso3EnTransito
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700'
                          }`}>
                            {paso3Acreditado
                              ? 'PASO 3 · ACREDITADO ✓'
                              : paso3EnTransito
                              ? 'PASO 3 · EN TRÁNSITO'
                              : 'PASO 3 · PENDIENTE'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Recepción en Sucursal
                          </h4>
                          <p className="text-[11px] font-medium text-amaru-copper dark:text-orange-400">
                            Sucursal {sucursalActiva || 'Calama'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {paso3Acreditado
                              ? `Lentes recepcionados físicamente en Sucursal ${sucursalActiva || 'Calama'}.`
                              : paso3EnTransito
                              ? `Valija óptica en camino a Sucursal ${sucursalActiva || 'Calama'}.`
                              : 'A la espera de despacho desde laboratorio óptico.'}
                          </p>
                        </div>
                      </div>

                      {paso3Acreditado ? (
                        <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">Recibido en Sucursal {sucursalActiva || 'Calama'} por Vendedor</span>
                        </div>
                      ) : paso3EnTransito ? (
                        <div className="mt-4 pt-2">
                          <button
                            type="button"
                            onClick={() => handleAcreditarLlegada(pedidoActual.folio)}
                            className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <PackageCheck size={14} />
                            <span>Acreditar Llegada a Tienda</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                          <Clock size={14} className="shrink-0" />
                          <span className="truncate">Pendiente de despacho a tienda</span>
                        </div>
                      )}
                    </div>

                    {/* PASO 4: Entrega Final al Paciente */}
                    <div className={`rounded-2xl p-4.5 border transition-all flex flex-col justify-between relative overflow-hidden shadow-2xs ${
                      paso4Acreditado
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                        : 'bg-white dark:bg-[#1E1C1A] border-amaru-copper/30 dark:border-amaru-copper/40 text-slate-800 dark:text-zinc-100 ring-1 ring-amaru-copper/20'
                    }`}>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-2xs ${
                            paso4Acreditado
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amaru-copper text-white'
                          }`}>
                            {paso4Acreditado ? '✓' : '4'}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            paso4Acreditado
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amaru-copper/15 text-amaru-copper dark:text-amber-400 border-amaru-copper/30 font-bold'
                          }`}>
                            {paso4Acreditado ? 'PASO 4 · ACREDITADO ✓' : 'PASO 4 · PENDIENTE'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Entrega Final al Paciente
                          </h4>
                          <p className="text-[11px] font-medium text-amaru-copper dark:text-orange-400">
                            {paso4Acreditado ? 'Conformidad de Entrega Registrada' : 'Listo para Entrega en Tienda'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {paso4Acreditado
                              ? 'Recepción conforme registrada y firmada en tienda.'
                              : 'Esperando retiro del titular o tercero autorizado en mesón.'}
                          </p>
                        </div>
                      </div>

                      {paso4Acreditado ? (
                        <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">Entrega conforme acreditada · Firma registrada</span>
                        </div>
                      ) : (
                        <div className="mt-4 pt-2">
                          <button
                            type="button"
                            onClick={() => handleIrAEntregar(pedidoActual.folio)}
                            className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-amaru-copper to-amaru-earth hover:brightness-105 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span>Ir a Entregar Pedido</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div key={`stepper-${pedidoActual.folio}`} className="card-zenith animate-stagger-2 rounded-2xl p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Hitos de Trazabilidad del Pedido
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Evolución cronológica desde la validación clínica hasta la entrega certificada al paciente.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-zinc-400">
                  {pedidoActual.hitos.filter(h => h.estado === 'completed').length} / {pedidoActual.hitos.length} Hitos Completados
                </span>
              </div>

              {/* Contenedor del Stepper Vertical */}
              <div className="relative pl-2 sm:pl-4 space-y-8">
                {pedidoActual.hitos.map((hito, index) => {
                  const isLast = index === pedidoActual.hitos.length - 1;
                  const colors = getBadgeColors(hito.estado);

                  return (
                    <div key={hito.id} className="relative flex items-start group">
                      {/* Línea conectora vertical entre nodos con animación de llenado */}
                      {!isLast && (
                        <div
                          className={`timeline-line-fill absolute left-[19px] top-[40px] bottom-[-32px] w-[3px] transition-colors ${
                            hito.estado === 'completed'
                              ? 'bg-emerald-500 dark:bg-emerald-600'
                              : 'bg-slate-200 dark:bg-zinc-800'
                          }`}
                        />
                      )}

                      {/* Nodo Circular con Icono */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colors.nodeBg}`}
                      >
                        {renderIconoHito(hito)}
                      </div>

                      {/* Contenido descriptivo del Hito */}
                      <div className="ml-5 flex-1 bg-slate-50/70 dark:bg-[#24211F]/60 border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm ${colors.titleColor}`}>
                              {hito.nombre}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colors.pillBg}`}
                            >
                              {hito.subtitulo}
                            </span>
                          </div>
                          {hito.fecha && (
                            <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                              <Clock size={12} />
                              {hito.fecha}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-3">
                          {hito.descripcion}
                        </p>

                        {/* Detalles adicionales específicos por hito */}

                        {/* Sello SHA-256 en Entrega DS 594: Terminal Forense Oscura */}
                        {hito.selloSha256 && (
                          <div className="mt-3 bg-zinc-950 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5 shadow-lg shadow-black/40">
                            {/* Terminal prompt header */}
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400/90 font-bold tracking-wider flex items-center gap-1.5 pl-1">
                                  <ShieldCheck size={13} className="text-emerald-400" />
                                  AUDITORÍA FORENSE · SELLO INMUTABLE SHA-256
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopiarHash(hito.selloSha256!)}
                                className="text-[11px] font-mono font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-500/30"
                              >
                                {hashCopiado ? (
                                  <>
                                    <Check size={11} className="text-emerald-300" />
                                    <span className="text-emerald-300 font-bold">COPIADO</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>COPIAR</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Hash output */}
                            <div className="p-2.5 bg-black/60 rounded-lg border border-emerald-500/20 font-mono text-xs">
                              <div className="text-[10px] text-emerald-500/60 select-none pb-1">
                                root@amaru-audit:~# sha256sum acta_recepcion_ds594.pdf
                              </div>
                              <code className="text-emerald-400 break-all select-all block font-bold tracking-wider">
                                {hito.selloSha256}
                              </code>
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                              <span>
                                Receptor Titular: <strong className="text-zinc-200">{hito.detalles?.receptor}</strong> ({hito.detalles?.tipoReceptor})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDescargarComprobante(pedidoActual.folio)}
                                disabled={descargandoPDF !== null}
                                className="text-amber-400 hover:text-amber-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Download size={12} />
                                <span>Descargar Acta Certificada DS 594</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Detalle si es el hito financiero y está en alerta */}
                        {hito.tipoIcono === 'finanzas' && hito.estado === 'alert' && hito.detalles?.saldoAcelerado && (
                          <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                                Monto Acelerado en Liquidación: {formatCLP(hito.detalles.saldoAcelerado)}
                              </span>
                              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                                {hito.detalles.cuotasAfectadas} cuotas consolidadas. Código del Trabajo Art. 177.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDescargarFiniquito(pedidoActual.folio)}
                              disabled={descargandoPDF !== null}
                              className="px-2.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <ExternalLink size={12} />
                              <span>Ver Documento Legal</span>
                            </button>
                          </div>
                        )}

                        {/* Observaciones técnicas si existen */}
                        {hito.detalles?.observacionLegal && !hito.selloSha256 && (
                          <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400 italic">
                            ℹ {hito.detalles.observacionLegal}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 5. Vitrina Ligera ("Oportunidades") ── */}
      <div className="card-zenith animate-stagger-4 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amaru-copper/10 text-amaru-copper">
                <Sparkles size={16} />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-amaru-copper">
                Vitrina de Oportunidades
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Armazones Destacados para Montaje Inmediato
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Modelos certificados en stock listos para montar con tu graduación óptica o descanso visual.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            Disponibilidad Inmediata · Despacho Express
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: EPP Titanio */}
          <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-black/20 hover:border-amaru-copper/60 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  DS 594 · ANSI Z87.1
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  FAENA
                </span>
              </div>
              <div className="h-28 rounded-xl bg-slate-200/40 dark:bg-zinc-800/40 p-2 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <TitanioProIcon className="w-full h-20" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  EPP Titanio Pro
                </h4>
                <p className="text-[11px] text-amaru-copper font-medium mt-0.5">
                  Línea Industrial & Alta Exigencia
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Montura de titanio aeroespacial con sello perimetral hermético contra partículas y protección UV 400.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">
                  Precio Convenio
                </span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  $85.000 CLP
                </span>
              </div>
              <a
                href="https://wa.me/56985860973?text=Hola,%20me%20interesa%20el%20modelo%20EPP%20Titanio%20Pro%20($85.000)%20visto%20en%20el%20Portal%20del%20Paciente"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-copper px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <WhatsAppIcon size={14} />
                <span>Me interesa</span>
              </a>
            </div>
          </div>

          {/* Card 2: Acetato Vintage */}
          <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-black/20 hover:border-amaru-copper/60 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                  Blue-Block · Filtro Pantallas
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  BOUTIQUE
                </span>
              </div>
              <div className="h-28 rounded-xl bg-slate-200/40 dark:bg-zinc-800/40 p-2 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                <AcetatoLumiereIcon className="w-full h-20" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Acetato Vintage Lumière
                </h4>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                  Boutique Urbana & Trabajo Digital
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Acetato italiano pulido a mano con bisagra alemana reforzada y descanso visual de alta definición.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">
                  Precio Particular
                </span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  $72.000 CLP
                </span>
              </div>
              <a
                href="https://wa.me/56985860973?text=Hola,%20me%20interesa%20el%20modelo%20Acetato%20Vintage%20Lumiere%20($72.000)%20visto%20en%20el%20Portal%20del%20Paciente"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-copper px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <WhatsAppIcon size={14} />
                <span>Me interesa</span>
              </a>
            </div>
          </div>

          {/* Card 3: Ultralight Flex */}
          <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-black/20 hover:border-amaru-copper/60 transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Memoria de Forma · 12g
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ULTRALIGHT
                </span>
              </div>
              <div className="h-28 rounded-xl bg-slate-200/40 dark:bg-zinc-800/40 p-2 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <UltralightFlexIcon className="w-full h-20" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Ultralight Flex-Steel
                </h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Confort Diario & Alta Flexibilidad
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Acero quirúrgico flexible hipoalergénico con memoria mecánica y plaquetas de silicona médica ergonómica.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-bold">
                  Precio Lanzamiento
                </span>
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  $64.000 CLP
                </span>
              </div>
              <a
                href="https://wa.me/56985860973?text=Hola,%20me%20interesa%20el%20modelo%20Ultralight%20Flex-Steel%20($64.000)%20visto%20en%20el%20Portal%20del%20Paciente"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-copper px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <WhatsAppIcon size={14} />
                <span>Me interesa</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Marco Normativo y Legal Omnicanal ── */}
      <div className="card-zenith animate-stagger-3 rounded-2xl p-5 text-xs text-slate-500 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-amaru-copper shrink-0" />
          <p className="leading-relaxed">
            Plataforma homologada bajo normativa chilena de Salud Ocupacional (<strong>DS N° 594</strong>),
            certificación de calidad visual <strong>ANSI Z87.1</strong>, convenios de Salud / Isapre y Ley de Firma Electrónica Simple <strong>N° 19.799</strong>.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>AMARU HEALTH-TECH & BOUTIQUE</span>
          <span>•</span>
          <span>SISTEMA AUDITADO</span>
        </div>
      </div>

      {/* ── Modal AutoRecetaModal ── */}
      <AutoRecetaModal
        isOpen={isModalRecetaOpen}
        onClose={() => setIsModalRecetaOpen(false)}
        rutPaciente={formatearRUT(userInfo.rut || userInfo.username)}
        onRecetaEnviada={handleRecetaEnviada}
      />
    </div>
  );
};

export default SeguimientoCompraView;
