import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Truck,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Users,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  QrCode,
  PenTool,
  Eraser,
  FileText,
  Lock,
} from 'lucide-react';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';
import { confirmarDespacho, type ConfirmarDespachoResponse } from '../services/despachoService';
import { getSucursalActiva } from '../services/inventarioService';

interface PedidoListoRetiro {
  folio: string;
  titular: string;
  rut: string;
  armazon: string;
  tipoConvenio: string;
}

const PEDIDOS_LISTOS_RETIRO: PedidoListoRetiro[] = [
  {
    folio: 'FOLIO-8F1085AD',
    titular: 'Mario Cárdenas Gómez',
    rut: '16.784.920-3',
    armazon: 'Titanio Pro ANSI Z87.1',
    tipoConvenio: 'Convenio Minero Faena',
  },
  {
    folio: 'FOLIO-4D7E1123',
    titular: 'Roberto Morales Pérez',
    rut: '14.238.901-5',
    armazon: 'Cristales Progresivos Antifatiga',
    tipoConvenio: 'Atención Sucursal',
  },
  {
    folio: 'FOLIO-2B4C8901',
    titular: 'Claudia Soto Riquelme',
    rut: '18.904.512-8',
    armazon: 'Acetato Lumière Blue-Light',
    tipoConvenio: 'Cliente Particular',
  },
];

interface EntregaViewProps {
  isOnline: boolean;
  onSessionExpired?: () => void;
}

export const EntregaView: React.FC<EntregaViewProps> = ({ isOnline }) => {
  const [sucursalActiva, setSucursalActiva] = useState<'Calama' | 'Antofagasta'>(() => getSucursalActiva());
  const [folio, setFolio] = useState('');
  const [tipoReceptor, setTipoReceptor] = useState<'Titular' | 'Tercero_Autorizado'>('Titular');
  const [rutReceptor, setRutReceptor] = useState('');
  const [errorRutReceptor, setErrorRutReceptor] = useState('');
  const [codigoPdf417, setCodigoPdf417] = useState('');
  const [escanExitoso, setEscanExitoso] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);
  const [errorFirma, setErrorFirma] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConfirmarDespachoResponse | null>(null);

  const sigPadRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    const handleSucursal = () => setSucursalActiva(getSucursalActiva());
    window.addEventListener('amaru_sucursal_updated', handleSucursal);
    window.addEventListener('storage', handleSucursal);
    return () => {
      window.removeEventListener('amaru_sucursal_updated', handleSucursal);
      window.removeEventListener('storage', handleSucursal);
    };
  }, []);

  const handleSeleccionarPedidoListo = (pedido: PedidoListoRetiro) => {
    setFolio(pedido.folio);
    setTipoReceptor('Titular');
    setRutReceptor(pedido.rut);
    setErrorRutReceptor('');
    const rutLimpio = pedido.rut.replace(/[^0-9kK]/g, '');
    setCodigoPdf417(`CHL-SRC-RUN-${rutLimpio}-DOC-8823910-TYP-CED-VER-2026`);
    setEscanExitoso(true);
  };

  useEffect(() => {
    const precargado = localStorage.getItem('amaru_folio_entrega_precargado');
    if (precargado) {
      setFolio(precargado.toUpperCase());
      localStorage.removeItem('amaru_folio_entrega_precargado');
      const match = PEDIDOS_LISTOS_RETIRO.find(
        (p) => p.folio.toUpperCase() === precargado.toUpperCase()
      );
      if (match) {
        handleSeleccionarPedidoListo(match);
      }
    }
  }, []);

  // Manejo de cambio en el RUT del receptor
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutReceptor(v);
    if (v.length > 3) {
      setErrorRutReceptor(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    } else {
      setErrorRutReceptor('');
    }
  };

  const handleRutBlur = () => {
    if (!rutReceptor) return;
    const f = formatearRUT(rutReceptor);
    setRutReceptor(f);
    setErrorRutReceptor(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
  };

  // Simulación de lectura de código de barras PDF417 chileno al reverso de la cédula
  const handleSimularEscanerPDF417 = () => {
    const rutSimulado = tipoReceptor === 'Titular' ? '15482931-K' : '18923456-7';
    const codigoSimulado = `CHL-SRC-RUN-${rutSimulado.replace('-', '')}-DOC-8823910-TYP-CED-VER-2026`;
    setCodigoPdf417(codigoSimulado);
    setRutReceptor(rutSimulado);
    setErrorRutReceptor('');
    setEscanExitoso(true);
  };

  const handleLimpiarEscaner = () => {
    setCodigoPdf417('');
    setEscanExitoso(false);
  };

  const handleLimpiarFirma = () => {
    sigPadRef.current?.clear();
    setTieneFirma(false);
    setErrorFirma('');
  };

  const handleEndDrawing = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      setTieneFirma(true);
      setErrorFirma('');
    }
  };

  const formularioValido =
    folio.trim().length >= 4 &&
    rutReceptor.trim().length >= 8 &&
    validarRUT(rutReceptor) &&
    escanExitoso &&
    tieneFirma;

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setErrorFirma('Debe registrar la firma del trabajador/receptor (DS 594).');
      return;
    }
    if (!formularioValido || guardando) return;

    setGuardando(true);
    setErrorEnvio(null);

    try {
      // Capturar trazo en formato de imagen Base64 (PNG transparente)
      const firmaB64 = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');

      const res = await confirmarDespacho({
        folio: folio.trim().toUpperCase(),
        tipo_receptor: tipoReceptor,
        rut_receptor: formatearRUT(rutReceptor),
        codigo_pdf417: codigoPdf417 || 'PDF417_AUTENTICADO_MANUAL',
        firma_trabajador_b64: firmaB64,
      });
      setResultado(res);
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al confirmar despacho');
    } finally {
      setGuardando(false);
    }
  };

  const handleNuevoDespacho = () => {
    setFolio('');
    setTipoReceptor('Titular');
    setRutReceptor('');
    setErrorRutReceptor('');
    setCodigoPdf417('');
    setEscanExitoso(false);
    setResultado(null);
    setErrorEnvio(null);
    sigPadRef.current?.clear();
    setTieneFirma(false);
    setErrorFirma('');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Header del Módulo de Despacho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amaru-copper/10 dark:bg-amaru-copper/20 text-amaru-copper rounded-2xl border border-amaru-copper/20 shadow-xs">
            <Truck size={26} className="text-amaru-copper" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-[#201E1C] dark:text-white">
                Paso Final: Entrega de Lentes en Sucursal
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-semibold">
                Sucursal {sucursalActiva}
              </span>
            </div>
            <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
              Acreditación de identidad, firma de recepción conforme y cierre del pedido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-[#6C6A68] dark:text-amaru-light-gray bg-white dark:bg-amaru-surface-dark px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3E3A36]">
            {isOnline ? '● Modo En Línea' : '○ Modo Contingencia Offline'}
          </span>
        </div>
      </div>

      {/* ── Resultado de Despacho Exitoso ── */}
      {resultado ? (
        <div className="bg-white dark:bg-amaru-surface-dark border border-emerald-300 dark:border-emerald-800 rounded-2xl p-8 shadow-sm dark:shadow-xl text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 size={44} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#201E1C] dark:text-white">
              ¡Despacho Confirmado Exitosamente!
            </h3>
            <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-1">
              {resultado.mensaje}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-amaru-dark/50 border border-slate-200 dark:border-[#3E3A36] rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#6C6A68] dark:text-amaru-light-gray">Folio Despachado:</span>
              <p className="font-mono font-bold text-amaru-copper">{resultado.folio}</p>
            </div>
            <div>
              <span className="text-[#6C6A68] dark:text-amaru-light-gray">Tipo de Receptor:</span>
              <p className="font-semibold text-[#201E1C] dark:text-white">{resultado.tipo_receptor}</p>
            </div>
            <div>
              <span className="text-[#6C6A68] dark:text-amaru-light-gray">RUT Acreditado:</span>
              <p className="font-mono font-semibold text-[#201E1C] dark:text-white">{resultado.rut_receptor}</p>
            </div>
            <div>
              <span className="text-[#6C6A68] dark:text-amaru-light-gray">Estado de Solicitud:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {resultado.estado || 'Entregada'}
              </p>
            </div>
            {resultado.sello_integridad_pdf && (
              <div className="col-span-2 bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-[#3E3A36] rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#6C6A68] dark:text-amaru-light-gray">
                  <span className="font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                    <Lock size={12} className="text-emerald-500" /> Sello Criptográfico SHA-256 (DS 594):
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Inmutable</span>
                </div>
                <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all select-all">
                  {resultado.sello_integridad_pdf}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`http://127.0.0.1:8000/api/v1/transacciones/pedidos/${resultado.folio}/comprobante-pdf/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs"
            >
              <FileText size={16} className="text-amaru-copper" />
              <span>Ver Comprobante PDF Sellado</span>
            </a>

            <button
              type="button"
              onClick={handleNuevoDespacho}
              className="flex-1 bg-gradient-to-r from-amaru-copper to-amaru-earth hover:from-amaru-earth hover:to-amaru-copper text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <RotateCcw size={16} />
              <span>Procesar Siguiente Despacho</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Formulario de Entrega y Validación ── */
        <form onSubmit={handleConfirmar} className="grid grid-cols-1 lg:grid-cols-12 gap-6" noValidate>
          {/* Columna Izquierda: Folio y Receptor */}
          <div className="lg:col-span-6 space-y-5 card-zenith p-6 rounded-2xl transition-all">
            <div className="pb-3 border-b border-slate-100 dark:border-[#3E3A36]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                <Search size={18} />
                Identificación del Pedido
              </h3>
              <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                Seleccione un pedido listo para entrega o pistolee el código QR
              </p>
            </div>

            {/* ── Selector Rápido: Pedidos Listos para Retiro en Sucursal ── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Pedidos Listos para Retiro en Sucursal {sucursalActiva}</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                  Selección rápida en mesón
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {PEDIDOS_LISTOS_RETIRO.map((item) => {
                  const isSelected = folio.toUpperCase() === item.folio.toUpperCase();
                  return (
                    <button
                      key={item.folio}
                      type="button"
                      onClick={() => handleSeleccionarPedidoListo(item)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper/40 shadow-xs'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 hover:border-amaru-copper/50 hover:bg-white dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-amaru-copper">
                            {item.folio}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Listo para Retiro
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate mt-0.5">
                          {item.titular} · <span className="font-mono font-medium text-slate-500 dark:text-zinc-400">{item.rut}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {item.armazon} · <span className="text-slate-400">{item.tipoConvenio}</span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-amaru-copper text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                        }`}>
                          {isSelected ? 'Cargado ✓' : 'Cargar'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buscador de Folio */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-1.5">
                Folio Único de Solicitud <span className="text-amaru-copper">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: FOLIO-A1B2C3D4"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-[#1E1C1A] border border-slate-300 dark:border-[#4A4540] focus:ring-2 focus:ring-amaru-copper focus:border-transparent rounded-xl px-4 py-3 text-base font-mono font-bold text-[#201E1C] dark:text-[#F5F5F4] placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-amaru-steel outline-none transition-all uppercase"
                />
                <div className="absolute right-3.5 top-3.5 text-amaru-steel dark:text-amaru-light-gray pointer-events-none">
                  <QrCode size={20} />
                </div>
              </div>
            </div>

            {/* Selector de Receptor (Toggle Visual) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amaru-gray dark:text-amaru-light-gray mb-2">
                Tipo de Receptor de Entrega <span className="text-amaru-copper">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoReceptor('Titular')}
                  className={`p-3.5 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    tipoReceptor === 'Titular'
                      ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper text-amaru-copper dark:text-amber-400'
                      : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A] text-[#201E1C] dark:text-amaru-light-gray hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} />
                    <span>Paciente / Titular</span>
                  </div>
                  {tipoReceptor === 'Titular' && <CheckCircle2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setTipoReceptor('Tercero_Autorizado')}
                  className={`p-3.5 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    tipoReceptor === 'Tercero_Autorizado'
                      ? 'border-amaru-copper bg-amaru-copper/10 ring-2 ring-amaru-copper text-amaru-copper dark:text-amber-400'
                      : 'border-slate-200 dark:border-[#3E3A36] bg-slate-50 dark:bg-[#1E1C1A] text-[#201E1C] dark:text-amaru-light-gray hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span>Tercero Autorizado</span>
                  </div>
                  {tipoReceptor === 'Tercero_Autorizado' && <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>

            {/* Lógica de Tercero: RUT del Tercero Obligatorio */}
            {tipoReceptor === 'Tercero_Autorizado' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amaru-copper" />
                    RUT del Tercero (Quien retira) <span className="text-amaru-copper">*</span>
                  </label>
                  {rutReceptor && validarRUT(rutReceptor) && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Válido
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ej: 18923456-7"
                  value={rutReceptor}
                  onChange={handleRutChange}
                  onBlur={handleRutBlur}
                  maxLength={12}
                  className={`w-full bg-white dark:bg-[#1E1C1A] border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${
                    errorRutReceptor
                      ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-400'
                      : rutReceptor && validarRUT(rutReceptor)
                      ? 'border-emerald-600 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-amaru-gray focus:ring-2 focus:ring-amaru-copper'
                  }`}
                />
                {errorRutReceptor && (
                  <p className="text-red-500 text-[11px] font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {errorRutReceptor}
                  </p>
                )}
                <p className="text-[10px] text-[#6C6A68] dark:text-amaru-light-gray">
                  * Acreditación obligatoria mediante validación de cédula de identidad y registro de firma física.
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Área de Escaneo PDF417 y Confirmación */}
          <div className="lg:col-span-6 space-y-5 card-zenith p-6 rounded-2xl flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amaru-copper flex items-center gap-2">
                  <CreditCard size={18} />
                  Validación Legal (No Repudio)
                </h3>
                <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5">
                  Acreditación de identidad con trazabilidad forense mediante código PDF417
                </p>
              </div>

              {/* Área de Escaneo PDF417 con borde punteado */}
              <div className="border-dashed border-2 border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-black/20 rounded-2xl p-6 text-center space-y-3 transition-colors">
                <div
                  className={`inline-flex p-3 rounded-2xl transition-colors ${
                    escanExitoso
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-amaru-copper/10 text-amaru-copper'
                  }`}
                >
                  <ScanLine size={36} className={escanExitoso ? 'text-emerald-600' : 'text-amaru-copper'} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#201E1C] dark:text-white">
                    {escanExitoso ? 'Cédula Validada Exitosamente' : 'Escanear Cédula de Identidad'}
                  </h4>
                  <p className="text-xs text-[#6C6A68] dark:text-amaru-light-gray mt-0.5 max-w-sm mx-auto">
                    {escanExitoso
                      ? `RUT Verificado: ${rutReceptor}`
                      : 'Acerque el lector de código de barras al reverso del carnet de identidad (PDF417)'}
                  </p>
                </div>

                {/* Código Leído */}
                {escanExitoso && codigoPdf417 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2.5 text-left text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span className="truncate pr-2">{codigoPdf417}</span>
                    <button
                      type="button"
                      onClick={handleLimpiarEscaner}
                      className="text-xs text-red-600 hover:text-red-700 underline font-sans cursor-pointer"
                    >
                      Re-escanear
                    </button>
                  </div>
                )}

                {/* Botón de Escaneo / Simulación de Lectura PDF417 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimularEscanerPDF417}
                    className="btn-copper inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Escanear Cédula de Identidad</span>
                  </button>
                </div>
              </div>

              {/* ── Lienzo de Firma Electrónica Simple (DS 594) — Instrumento de Precisión ── */}
              <div className="bg-slate-50/80 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amaru-copper/10 text-amaru-copper rounded-lg">
                      <PenTool size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#201E1C] dark:text-white flex items-center gap-1.5 font-mono">
                        FIRMA CONFORME · PACIENTE / TITULAR
                        <span className="text-amaru-copper">*</span>
                      </h4>
                      <p className="text-[11px] text-[#6C6A68] dark:text-amaru-light-gray">
                        Acreditación de entrega presencial para fiscalización DT o resguardo clínico
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tieneFirma && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-mono font-semibold">
                        <CheckCircle2 size={12} />
                        REGISTRADA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleLimpiarFirma}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 rounded-lg transition-colors cursor-pointer"
                      title="Limpiar trazo"
                    >
                      <Eraser size={13} />
                      <span>Limpiar</span>
                    </button>
                  </div>
                </div>

                {/* Lienzo de firma: Calibrado óptico con marcas de precisión y guías */}
                <div className="relative bg-white border-2 border-slate-300 dark:border-white/20 rounded-xl overflow-hidden shadow-inner">
                  {/* Marcas de precisión en esquinas (Crosshairs) */}
                  <span className="absolute top-1 left-2 text-[10px] font-mono text-slate-300 select-none pointer-events-none">+</span>
                  <span className="absolute top-1 right-2 text-[10px] font-mono text-slate-300 select-none pointer-events-none">+</span>
                  <span className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-300 select-none pointer-events-none">+</span>
                  <span className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-300 select-none pointer-events-none">+</span>

                  {/* Línea guía de firma industrial */}
                  <div className="absolute bottom-6 left-6 right-6 border-b border-dashed border-slate-300 pointer-events-none" />
                  <span className="absolute bottom-1.5 right-6 text-[9px] font-mono text-slate-400 select-none pointer-events-none uppercase">
                    LÍNEA BASE DE FIRMA DIGITAL
                  </span>

                  <SignatureCanvas
                    ref={sigPadRef}
                    onEnd={handleEndDrawing}
                    canvasProps={{
                      className: 'w-full h-32 cursor-crosshair touch-none bg-white',
                    }}
                    penColor="#0F172A"
                    minWidth={1.2}
                    maxWidth={2.8}
                  />
                  {!tieneFirma && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-xs italic select-none">
                      Dibuje aquí la firma con el dedo o puntero
                    </div>
                  )}
                </div>

                {/* Subtexto de calibración técnica */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 pt-0.5">
                  <span>RESOLUCIÓN: VECTORIAL 2D TOUCH</span>
                  <span>ESTÁNDAR: LEY N° 19.799</span>
                </div>

                {errorFirma && (
                  <p className="text-red-500 text-[11px] font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {errorFirma}
                  </p>
                )}
              </div>

              {errorEnvio && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorEnvio}</span>
                </div>
              )}
            </div>

            {/* Acción Final: Botón Confirmar Entrega y Descontar Stock */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                type="submit"
                disabled={!formularioValido || guardando}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  formularioValido && !guardando
                    ? 'btn-copper cursor-pointer'
                    : 'bg-slate-200 text-slate-400 dark:bg-white/[0.04] dark:text-zinc-600 border border-slate-300 dark:border-white/10 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle2 size={18} />
                <span>
                  {guardando ? 'Confirmando Entrega en Servidor...' : 'Confirmar Entrega y Descontar Stock'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default EntregaView;

