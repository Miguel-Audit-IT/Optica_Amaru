import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  MapPin,
  ArrowRight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  TrendingUp,
  Clock,
  BookOpen,
  Settings,
  MinusCircle,
  DollarSign,
} from 'lucide-react';
import {
  getInventario,
  getSucursalActiva,
  setSucursalActiva,
  registrarIngresoStock,
  descontarStock,
  guardarInventario,
  type ItemInventario,
} from '../services/inventarioService';
import { getUserInfo, isUserAdmin, isUserAuditor } from '../utils/auth';
import {
  TitanioProIcon,
  AcetatoLumiereIcon,
  UltralightFlexIcon,
} from '../components/icons/ArmazonesSVGs';

export const InventarioView: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const isAdmin = isUserAdmin();
  const isAuditor = isUserAuditor();
  const nombreOperador = (
    localStorage.getItem('amaru_nombre_vendedor') ||
    (userInfo.username === '17456789-2' ? 'JUANITA ARAYA' : 'CARLOS ROJAS MORALES')
  ).toUpperCase();

  // Costos confidenciales de proveedor (solo para ADMINISTRADOR)
  const COSTOS_ADMIN: Record<string, { costo: number }> = {
    // Los 6 modelos oficiales del catálogo
    'EPP-TITAN-001': { costo: 24000 },
    'BOUT-ACET-002': { costo: 20500 },
    'FLEX-STEEL-003': { costo: 18200 },
    'BOUT-METRO-004': { costo: 25000 },
    'EPP-VULC-005': { costo: 22000 },
    'FLEX-AERO-006': { costo: 27500 },
    // Mapeos adicionales por SKU secundario
    'AMARU-LUMIERE-04': { costo: 20500 },
    'AMARU-FLEX-07': { costo: 18200 },
    'EPP-ULTRA-003': { costo: 15000 },
    'EPP-SHIELD-002': { costo: 22000 },
    'AMARU-PROGRES-01': { costo: 28500 },
  };

  interface MovimientoKardex {
    fechaHoraExacta?: string;
    fecha?: string;
    responsable?: string;
    operador?: string;
    tipo?: string;
    guia?: string;
    numeroGuia?: string;
    descripcion?: string;
    sucursal?: string;
    modelo?: string;
    sku?: string;
    cantidad?: number;
  }

  // Registros iniciales de Kardex para demo (si no hay datos en localStorage)
  const KARDEX_DEMO_INICIAL: MovimientoKardex[] = [
    {
      fechaHoraExacta: '14/11/2026 · 17:30:22 hrs',
      responsable: 'Juanita Araya (Vendedor)',
      tipo: 'Ingreso',
      guia: 'GD-45892',
      descripcion: 'Ingreso Guía N° GD-45892',
      sucursal: 'Calama',
      modelo: 'Titanium Shield Pro',
      sku: 'EPP-TITAN-001',
      cantidad: 12,
    },
    {
      fechaHoraExacta: '13/11/2026 · 10:15:08 hrs',
      responsable: 'Administración',
      tipo: 'Ingreso',
      guia: 'FAC-88301',
      descripcion: 'Ingreso Factura N° FAC-88301',
      sucursal: 'Antofagasta',
      modelo: 'Lumière Acetato Italiano',
      sku: 'AMARU-LUMIERE-04',
      cantidad: 8,
    },
    {
      fechaHoraExacta: '12/11/2026 · 09:45:33 hrs',
      responsable: 'Carlos Rojas (Vendedor)',
      tipo: 'Descuento',
      guia: 'FOLIO-9E8821F0',
      descripcion: 'Descuento por Venta FOLIO-9E8821F0',
      sucursal: 'Antofagasta',
      modelo: 'Ultralight Flex Titanio',
      sku: 'AMARU-FLEX-07',
      cantidad: -2,
    },
  ];

  const [inventario, setInventario] = useState<ItemInventario[]>(() => getInventario());
  const [sucursalActual, setSucursalActual] = useState<'Calama' | 'Antofagasta'>(() => getSucursalActiva());
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // ── Estados para Recepción Controlada de Stock (Modal de Control Interno) ──
  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false);
  const [skuIngreso, setSkuIngreso] = useState<string>('EPP-TITAN-001');
  const [sucursalIngreso, setSucursalIngreso] = useState<'Calama' | 'Antofagasta'>(sucursalActual);
  const [cantidadIngreso, setCantidadIngreso] = useState<number>(10);
  const [guiaDespacho, setGuiaDespacho] = useState<string>('');
  const [errorModal, setErrorModal] = useState<string>('');
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // ── Estados para Modal Gerencial de Ajuste de Precio y Mermas (Exclusivo Administradora) ──
  const [modalGerencialAbierto, setModalGerencialAbierto] = useState(false);
  const [itemGerencial, setItemGerencial] = useState<ItemInventario | null>(null);
  const [tabGerencial, setTabGerencial] = useState<'PRECIO' | 'MERMA'>('PRECIO');

  // Estado Tab 1: Cambio de Precio
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState<number>(0);
  const [motivoPrecio, setMotivoPrecio] = useState<string>('');

  // Estado Tab 2: Merma / Ajuste de Stock (solo resta)
  const [sucursalMerma, setSucursalMerma] = useState<'Calama' | 'Antofagasta'>('Calama');
  const [cantidadMerma, setCantidadMerma] = useState<number>(1);
  const [tipoMerma, setTipoMerma] = useState<'Rotura en Taller' | 'Garantía Clínica' | 'Traspaso a Sucursal'>('Rotura en Taller');
  const [motivoMerma, setMotivoMerma] = useState<string>('');
  const [errorGerencial, setErrorGerencial] = useState<string>('');

  const refrescarInventario = () => {
    setInventario(getInventario());
    setSucursalActual(getSucursalActiva());
  };

  useEffect(() => {
    refrescarInventario();
    const handleStockUpdate = () => refrescarInventario();
    const handleSucursalUpdate = () => setSucursalActual(getSucursalActiva());

    window.addEventListener('amaru_stock_updated', handleStockUpdate);
    window.addEventListener('amaru_sucursal_updated', handleSucursalUpdate);
    window.addEventListener('storage', handleStockUpdate);

    return () => {
      window.removeEventListener('amaru_stock_updated', handleStockUpdate);
      window.removeEventListener('amaru_sucursal_updated', handleSucursalUpdate);
      window.removeEventListener('storage', handleStockUpdate);
    };
  }, []);

  const handleCambiarSucursal = (sucursal: 'Calama' | 'Antofagasta') => {
    setSucursalActiva(sucursal);
    setSucursalActual(sucursal);
  };

  const handleIniciarVenta = (item: ItemInventario) => {
    localStorage.setItem('amaru_armazon_precargado', JSON.stringify({
      sku: item.sku,
      nombre: item.nombre,
      precio: item.precioClp,
    }));
    navigate('/terminal');
  };

  const handleConfirmarIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guiaDespacho.trim()) {
      setErrorModal('El N° de Guía de Despacho o Factura es obligatorio para la trazabilidad de auditoría.');
      return;
    }
    if (cantidadIngreso <= 0 || cantidadIngreso > 50) {
      setErrorModal('La cantidad a ingresar debe ser entre 1 y 50 unidades.');
      return;
    }

    const res = registrarIngresoStock(
      skuIngreso,
      sucursalIngreso,
      cantidadIngreso,
      guiaDespacho.trim().toUpperCase(),
      `${nombreOperador} (VENDEDOR)`
    );

    if (res.exito && res.item) {
      setToastMensaje(
        `✓ Ingreso registrado exitosamente: +${cantidadIngreso} unidades de "${res.item.nombre}" en Sucursal ${sucursalIngreso} con Guía N° ${guiaDespacho.trim().toUpperCase()}.`
      );
      setModalIngresoAbierto(false);
      setGuiaDespacho('');
      setErrorModal('');
      refrescarInventario();
    } else {
      setErrorModal('Error al registrar el ingreso de stock.');
    }
  };

  // ── Handlers de Excepciones Gerenciales (Administradora) ──
  const handleAbrirModalGerencial = (item: ItemInventario) => {
    setItemGerencial(item);
    setNuevoPrecioVenta(item.precioClp);
    setMotivoPrecio('');
    setSucursalMerma(sucursalActual);
    setCantidadMerma(1);
    setTipoMerma('Rotura en Taller');
    setMotivoMerma('');
    setErrorGerencial('');
    setTabGerencial('PRECIO');
    setModalGerencialAbierto(true);
  };

  const handleGuardarNuevoPrecio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemGerencial) return;
    if (!motivoPrecio.trim()) {
      setErrorGerencial('Debe ingresar un motivo obligatorio para el ajuste de precio (ej. Ajuste IPC, Promoción, Corrección).');
      return;
    }
    if (nuevoPrecioVenta <= 0) {
      setErrorGerencial('El nuevo precio de venta debe ser superior a $0 CLP.');
      return;
    }

    const precioAnterior = itemGerencial.precioClp;
    const actual = getInventario();
    const actualizado = actual.map((it) => {
      if (it.sku === itemGerencial.sku) {
        return { ...it, precioClp: nuevoPrecioVenta };
      }
      return it;
    });
    guardarInventario(actualizado);

    // Registro de auditoría WORM
    const ahora = new Date().toLocaleString('es-CL');
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const auditLog = raw ? JSON.parse(raw) : [];
      auditLog.unshift({
        id: `PRECIO-${Date.now()}`,
        tipo: 'CAMBIO_PRECIO',
        eventoTipo: 'AJUSTE DE PRECIO GERENCIAL',
        folio: `SKU-${itemGerencial.sku}`,
        paciente: 'Control de Catálogo',
        rut: '14.289.432-1',
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        sucursal: sucursalActual,
        motivo: motivoPrecio.trim(),
        detalleAntes: `SKU ${itemGerencial.sku} (${itemGerencial.nombre}) · Precio Anterior: $${precioAnterior.toLocaleString('es-CL')} CLP`,
        detalleDespues: `SKU ${itemGerencial.sku} (${itemGerencial.nombre}) · Nuevo Precio: $${nuevoPrecioVenta.toLocaleString('es-CL')} CLP · Motivo: ${motivoPrecio.trim()}`,
      });
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify(auditLog));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));
    } catch {
      // ignore
    }

    // Registro en Kardex
    try {
      const rawKardex = localStorage.getItem('amaru_movimientos_stock');
      const kardex = rawKardex ? JSON.parse(rawKardex) : [];
      kardex.unshift({
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        tipo: 'Ajuste Precio',
        guia: `MOD-P-${itemGerencial.sku.slice(0, 8)}`,
        descripcion: `Cambio de Precio: $${precioAnterior.toLocaleString('es-CL')} ➔ $${nuevoPrecioVenta.toLocaleString('es-CL')} CLP (${motivoPrecio.trim()})`,
        sucursal: sucursalActual,
        modelo: itemGerencial.nombre,
        sku: itemGerencial.sku,
        cantidad: 0,
      });
      localStorage.setItem('amaru_movimientos_stock', JSON.stringify(kardex));
      window.dispatchEvent(new Event('amaru_stock_updated'));
    } catch {
      // ignore
    }

    refrescarInventario();
    setModalGerencialAbierto(false);
    setToastMensaje(`✓ Precio de "${itemGerencial.nombre}" actualizado a $${nuevoPrecioVenta.toLocaleString('es-CL')} CLP.`);
    setTimeout(() => setToastMensaje(null), 5000);
  };

  const handleGuardarMermaStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemGerencial) return;
    if (!motivoMerma.trim()) {
      setErrorGerencial('Debe indicar un motivo detallado para el registro de merma o baja.');
      return;
    }
    if (cantidadMerma <= 0) {
      setErrorGerencial('La cantidad a descontar debe ser mayor a 0.');
      return;
    }
    const stockDisponible = itemGerencial.stock[sucursalMerma] || 0;
    if (cantidadMerma > stockDisponible) {
      setErrorGerencial(`Stock insuficiente en ${sucursalMerma} (${stockDisponible} disponibles). No es posible descontar ${cantidadMerma} unidades.`);
      return;
    }

    const res = descontarStock(itemGerencial.sku, sucursalMerma, cantidadMerma);
    if (!res.exito) {
      setErrorGerencial('Error al descontar stock de bodega.');
      return;
    }

    const ahora = new Date().toLocaleString('es-CL');
    // Auditoría WORM
    try {
      const raw = localStorage.getItem('amaru_anulaciones_rectificaciones');
      const auditLog = raw ? JSON.parse(raw) : [];
      auditLog.unshift({
        id: `MERMA-${Date.now()}`,
        tipo: 'AJUSTE_MERMA',
        eventoTipo: 'MERMA / AJUSTE DE BODEGA',
        folio: `MERMA-${itemGerencial.sku.slice(0, 6)}`,
        paciente: 'Control de Bodega',
        rut: '14.289.432-1',
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        sucursal: sucursalMerma,
        motivo: `${tipoMerma}: ${motivoMerma.trim()}`,
        detalleAntes: `Stock en ${sucursalMerma}: ${stockDisponible} uds (${itemGerencial.nombre} · ${itemGerencial.sku})`,
        detalleDespues: `Stock en ${sucursalMerma}: ${stockDisponible - cantidadMerma} uds (-${cantidadMerma} uds por ${tipoMerma} · ${motivoMerma.trim()})`,
      });
      localStorage.setItem('amaru_anulaciones_rectificaciones', JSON.stringify(auditLog));
      window.dispatchEvent(new Event('amaru_anulaciones_updated'));
    } catch {
      // ignore
    }

    // Kardex
    try {
      const rawKardex = localStorage.getItem('amaru_movimientos_stock');
      const kardex = rawKardex ? JSON.parse(rawKardex) : [];
      kardex.unshift({
        fechaHoraExacta: ahora,
        responsable: 'María González (Administradora)',
        tipo: 'Merma / Salida',
        guia: `MERMA-${Date.now().toString().slice(-6)}`,
        descripcion: `Merma (${tipoMerma}): ${motivoMerma.trim()}`,
        sucursal: sucursalMerma,
        modelo: itemGerencial.nombre,
        sku: itemGerencial.sku,
        cantidad: -cantidadMerma,
      });
      localStorage.setItem('amaru_movimientos_stock', JSON.stringify(kardex));
      window.dispatchEvent(new Event('amaru_stock_updated'));
    } catch {
      // ignore
    }

    refrescarInventario();
    setModalGerencialAbierto(false);
    setToastMensaje(`✓ Merma registrada: -${cantidadMerma} uds de "${itemGerencial.nombre}" en Sucursal ${sucursalMerma} (${tipoMerma}).`);
    setTimeout(() => setToastMensaje(null), 5000);
  };

  // Filtrado de armazones
  const armazonesFiltrados = inventario.filter((item) => {
    const coincideCategoria =
      categoriaSeleccionada === 'Todos' || item.categoria === categoriaSeleccionada;
    const term = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !term ||
      item.nombre.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.material.toLowerCase().includes(term) ||
      item.filtro.toLowerCase().includes(term);
    return coincideCategoria && coincideBusqueda;
  });

  const totalStockCalama = inventario.reduce((acc, i) => acc + (i.stock.Calama || 0), 0);
  const totalStockAntofagasta = inventario.reduce((acc, i) => acc + (i.stock.Antofagasta || 0), 0);

  const renderIconoArmazon = (nombre: string, size = 48) => {
    const n = nombre.toLowerCase();
    if (n.includes('lumière') || n.includes('acetato') || n.includes('vintage')) {
      return <AcetatoLumiereIcon size={size} className="text-amaru-copper" />;
    }
    if (n.includes('flex') || n.includes('steel') || n.includes('minimal')) {
      return <UltralightFlexIcon size={size} className="text-amaru-copper" />;
    }
    return <TitanioProIcon size={size} className="text-amaru-copper" />;
  };

  const renderSemaforoStock = (cantidad: number, nombreSucursal: string, esPrincipal: boolean) => {
    if (cantidad >= 5) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            esPrincipal
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{cantidad} disp. en {nombreSucursal}</span>
        </span>
      );
    }
    if (cantidad > 0) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            esPrincipal
              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Últimas {cantidad} unid. en {nombreSucursal}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span>Sin stock en {nombreSucursal}</span>
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200 font-sans">
      {/* ── Banner de Cabecera: Consulta Rápida de Stock Mesón ── */}
      <div className="card-zenith optical-sheen rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.06] via-orange-500/[0.02] to-transparent border border-amber-500/25 dark:border-amber-500/35 shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3306] via-[#B34B0C] to-[#E27230]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShoppingBag size={13} className="text-amaru-copper" />
              <span>{isAuditor ? 'Auditoría de Inventario' : 'Catálogo & Stock en Tiempo Real'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {isAuditor ? 'Stock y Kardex' : 'Inventario & Vitrina de Armazones'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {isAuditor
                ? 'Auditoría de existencias físicas en bodega, valorización al costo y registro histórico de movimientos.'
                : 'Herramienta ágil de consulta para el vendedor en mesón: revisa disponibilidad de monturas, materiales oftálmicos y stock en vivo entre sucursales.'}
            </p>
          </div>

          {/* Switch de Sucursal Activa + Ingreso Stock + Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {!isAuditor && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/10 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleCambiarSucursal('Calama')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sucursalActual === 'Calama'
                      ? 'bg-amaru-copper text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin size={12} />
                  <span>Calama ({totalStockCalama})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCambiarSucursal('Antofagasta')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sucursalActual === 'Antofagasta'
                      ? 'bg-amaru-copper text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin size={12} />
                  <span>Antofagasta ({totalStockAntofagasta})</span>
                </button>
              </div>
            )}

            {/* Botón Acción Secundaria: Registrar Ingreso de Stock (Oculto para Auditor SoD A.5.3) */}
            {!isAuditor && (
              <button
                type="button"
                onClick={() => {
                  setSucursalIngreso(sucursalActual);
                  setErrorModal('');
                  setModalIngresoAbierto(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 shrink-0"
                title="Registrar ingreso de mercadería con Guía de Despacho o Factura Proveedor"
              >
                <span>📦 Registrar Ingreso de Stock (Guía)</span>
              </button>
            )}

            <button
              type="button"
              onClick={refrescarInventario}
              title="Refrescar catálogo y stock"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:text-amaru-copper transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* 3 Tarjetas Superiores Simples para Auditor */}
        {isAuditor && (
          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-black/30 border border-slate-200/90 dark:border-white/10 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Stock Total
              </span>
              <strong className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                51 Calama / 25 Antofagasta
              </strong>
              <span className="text-[11px] text-emerald-600 block mt-0.5 font-semibold">
                76 armazones en total
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-black/30 border border-slate-200/90 dark:border-white/10 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Valor Total en Bodega
              </span>
              <strong className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                $1.734.000 CLP
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Costo Proveedor
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-black/30 border border-slate-200/90 dark:border-white/10 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Valor Comercial en Vitrina
              </span>
              <strong className="text-base sm:text-lg font-black font-mono text-amber-800 dark:text-amber-300">
                $6.120.000 CLP
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Precio de Venta
              </span>
            </div>
          </div>
        )}
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
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isAuditor ? (
        /* ── Tabla Contable de Armazones (Exclusivo Auditoría) ── */
        <div className="card-zenith rounded-3xl p-6 bg-white dark:bg-[#181614] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tabla Contable de Armazones
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Consolidado de modelos, costos de adquisición, precios de venta y existencias por sucursal.
              </p>
            </div>
            {/* Buscador Rápido */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Filtrar por SKU o modelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-zinc-800 text-[10px]">
                  <th className="px-3.5 py-3">Código SKU</th>
                  <th className="px-3.5 py-3">Modelo de Armazón</th>
                  <th className="px-3.5 py-3">Categoría</th>
                  <th className="px-3.5 py-3 text-right">Costo Proveedor</th>
                  <th className="px-3.5 py-3 text-right">Precio Venta</th>
                  <th className="px-3.5 py-3 text-center">Margen %</th>
                  <th className="px-3.5 py-3 text-center">Stock Calama</th>
                  <th className="px-3.5 py-3 text-center">Stock Antofagasta</th>
                  <th className="px-3.5 py-3 text-right">Valor Total Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#1C1A18]">
                {armazonesFiltrados.map((item) => {
                  const costo = COSTOS_ADMIN[item.sku]?.costo ?? Math.round(item.precioClp * 0.28);
                  const ganancia = item.precioClp - costo;
                  const margenPct = Math.round((ganancia / item.precioClp) * 100);
                  const stockCalama = item.stock?.Calama || 0;
                  const stockAntofagasta = item.stock?.Antofagasta || 0;
                  const totalUds = stockCalama + stockAntofagasta;
                  const valorTotalCosto = costo * totalUds;

                  return (
                    <tr key={item.sku} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-3.5 py-3 font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                        {item.sku}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {item.material}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-[11px] text-slate-600 dark:text-zinc-400">
                        {item.categoria}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-right font-medium text-slate-700 dark:text-zinc-300">
                        ${costo.toLocaleString('es-CL')}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                        ${item.precioClp.toLocaleString('es-CL')}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          +{margenPct}%
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono font-bold text-amber-800 dark:text-amber-300">
                        {stockCalama} uds
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono font-bold text-blue-700 dark:text-blue-300">
                        {stockAntofagasta} uds
                      </td>
                      <td className="px-3.5 py-3 font-mono text-right font-black text-emerald-600 dark:text-emerald-400">
                        ${valorTotalCosto.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ── Barra de Búsqueda y Filtros de Categoría ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-[#181614]/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            {/* Buscador */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por modelo, SKU (ej. EPP-TITAN), material o filtro..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
              />
            </div>

            {/* Filtros Rápidos por Categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['Todos', 'Boutique & Urbano', 'Seguridad Óptica (EPP)', 'Ultralivianos & Titanio'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    categoriaSeleccionada === cat
                      ? 'bg-[#201E1C] dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-zinc-700/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Grid de Tarjetas de Armazones ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {armazonesFiltrados.map((item) => {
              const stockSucursalActiva = item.stock[sucursalActual] || 0;
              const otraSucursal = sucursalActual === 'Calama' ? 'Antofagasta' : 'Calama';
              const stockOtraSucursal = item.stock[otraSucursal] || 0;

              return (
                <div
                  key={item.sku}
                  className="card-zenith rounded-3xl p-5 border border-slate-200/90 dark:border-white/10 hover:border-amaru-copper/50 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header de Tarjeta: Categoría y SKU */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        {item.sku}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        {item.categoria}
                      </span>
                    </div>

                    {/* Ilustración Vectorial del Armazón */}
                    <div className="py-5 px-3 flex items-center justify-center bg-slate-50/60 dark:bg-black/20 rounded-2xl my-3 group-hover:scale-105 transition-transform duration-200">
                      {renderIconoArmazon(item.nombre, 44)}
                    </div>

                    {/* Nombre y Precio */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-amaru-copper transition-colors">
                        {item.nombre}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          ${item.precioClp.toLocaleString('es-CL')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          CLP
                        </span>
                      </div>
                      {/* Banda Exclusiva de Gerencia: Costo, Margen y Capital Inmovilizado */}
                      {isAdmin && (
                        (() => {
                          const costo = COSTOS_ADMIN[item.sku]?.costo ?? Math.round(item.precioClp * 0.28);
                          const ganancia = item.precioClp - costo;
                          const margenPct = Math.round((ganancia / item.precioClp) * 100);
                          const stockTotal = (item.stock?.Calama || 0) + (item.stock?.Antofagasta || 0);
                          const capitalInmovilizado = costo * stockTotal;

                          return (
                            <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 dark:bg-amber-900/20 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-500 dark:text-zinc-400">Costo Proveedor:</span>
                                <span className="font-mono text-slate-700 dark:text-zinc-300">
                                  ${costo.toLocaleString('es-CL')} CLP
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-500 dark:text-zinc-400">Margen Bruto:</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                  +{margenPct}% (${ganancia.toLocaleString('es-CL')})
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-amber-500/20">
                                <span className="text-amber-800 dark:text-amber-300">Capital Inmovilizado:</span>
                                <span className="font-mono font-black text-amber-900 dark:text-amber-200">
                                  ${capitalInmovilizado.toLocaleString('es-CL')} ({stockTotal} uds)
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Ficha Técnica Rápida */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Material & Montura
                        </span>
                        <span className="font-medium text-slate-700 dark:text-zinc-300 line-clamp-1">
                          {item.material}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tratamiento Óptico
                        </span>
                        <span className="font-medium text-slate-700 dark:text-zinc-300 line-clamp-1">
                          {item.filtro}
                        </span>
                      </div>

                      {/* Colores en Stock */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Colores de Fábrica
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.colores.map((color) => (
                            <span
                              key={color}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Tarjeta: Semáforos de Stock + Botón Iniciar Venta */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                    {/* Semáforos de ambas sucursales */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Sucursal Activa ({sucursalActual}):
                        </span>
                        {renderSemaforoStock(stockSucursalActiva, sucursalActual, true)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 uppercase">
                          En {otraSucursal}:
                        </span>
                        {renderSemaforoStock(stockOtraSucursal, otraSucursal, false)}
                      </div>
                    </div>

                    {/* Botón de Acción Vendedor */}
                    <button
                      type="button"
                      onClick={() => handleIniciarVenta(item)}
                      className="w-full btn-copper py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <ShoppingBag size={14} />
                      <span>Iniciar Venta con este Armazón</span>
                      <ArrowRight size={13} />
                    </button>

                    {/* Botón Exclusivo Administradora: Ajuste de Precio / Merma */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalGerencial(item)}
                        className="w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-black text-amber-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-amber-300 border border-amber-500/30 transition-all shadow-xs hover:scale-[1.01] active:scale-95"
                      >
                        <Settings size={13} className="text-amber-400" />
                        <span>⚙️ Ajuste de Precio / Merma</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {armazonesFiltrados.length === 0 && (
            <div className="card-zenith rounded-3xl p-10 text-center max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                <Search size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No se encontraron armazones
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Intenta con otro término de búsqueda o selecciona otra categoría.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Tabla de Kardex: Bitácora de Movimientos (ADMINISTRADOR y AUDITOR) ── */}
      {(isAdmin || isAuditor) && (
        <div className="card-zenith rounded-2xl p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <BookOpen size={18} />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {isAuditor
                  ? 'Últimos Ingresos de Mercadería, Mermas y Cambios de Precio'
                  : 'Registro de Entradas y Salidas de Lentes (Quién modificó el stock)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isAuditor
                  ? 'Control cronológico de recepciones con guía, mermas de laboratorio y ajustes de inventario.'
                  : 'Control interno de quién actualizó el inventario, cuándo y en qué sucursal — exclusivo Gerencia General.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-zinc-800 text-[11px]">
                <tr>
                  <th className="px-4 py-3">{isAuditor ? 'Fecha' : 'Fecha y Hora Exacta'}</th>
                  <th className="px-4 py-3">{isAuditor ? 'Responsable' : 'Responsable (Quién lo hizo)'}</th>
                  {isAuditor ? (
                    <>
                      <th className="px-4 py-3">Sucursal</th>
                      <th className="px-4 py-3">Tipo de Movimiento</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Tipo & N° Documento</th>
                      <th className="px-4 py-3">Sucursal</th>
                    </>
                  )}
                  <th className="px-4 py-3">Modelo & Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#1C1A18]">
                {(() => {
                  const movimientosStorage: MovimientoKardex[] = (() => {
                    try {
                      return JSON.parse(localStorage.getItem('amaru_movimientos_stock') || '[]');
                    } catch { return []; }
                  })();

                  const filas = movimientosStorage.length > 0
                    ? movimientosStorage.slice(0, 8)
                    : KARDEX_DEMO_INICIAL;

                  return filas.map((mov, i) => {
                    const eIngreso = (mov.tipo || 'Ingreso') === 'Ingreso' || (mov.cantidad ?? 0) >= 0;
                    const fecha = mov.fechaHoraExacta || mov.fecha || '—';
                    const responsable = mov.responsable || mov.operador || 'Administración';
                    const guia = mov.guia || mov.numeroGuia || '—';
                    const sucursal = mov.sucursal || 'Calama';
                    const modelo = mov.modelo || mov.sku || '—';
                    const cantidad = mov.cantidad ?? 0;

                    return (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            {fecha}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white">{responsable}</span>
                        </td>
                        {isAuditor ? (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                📍 {sucursal}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                eIngreso
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                              }`}>
                                <TrendingUp size={10} />
                                {eIngreso ? 'Ingreso' : 'Descuento'}
                              </span>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                                Guía / Doc: <span className="font-bold text-amaru-copper">{guia}</span>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                eIngreso
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                              }`}>
                                <TrendingUp size={10} />
                                {eIngreso ? 'Ingreso' : 'Descuento'}
                              </span>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                                Guía / Doc: <span className="font-bold text-amaru-copper">{guia}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                📍 {sucursal}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white text-[11px]">{modelo}</div>
                          <div className={`font-mono font-black text-sm ${eIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {eIngreso ? '+' : ''}{cantidad} unid.
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal de Control Interno: Recepción de Mercadería por Guía ── */}
      {modalIngresoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E1C1A] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PackageCheck size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Registrar Ingreso de Stock
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Control Interno & Recepción de Mercadería por Guía
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalIngresoAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorModal && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{errorModal}</span>
              </div>
            )}

            <form onSubmit={handleConfirmarIngreso} className="space-y-4">
              {/* Selección de Armazón */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Armazón / Modelo a Ingresar <span className="text-amaru-copper">*</span>
                </label>
                <select
                  value={skuIngreso}
                  onChange={(e) => setSkuIngreso(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                >
                  {inventario.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.nombre} ({item.sku}) - {item.categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sucursal Receptora & Cantidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    Sucursal Receptora <span className="text-amaru-copper">*</span>
                  </label>
                  <select
                    value={sucursalIngreso}
                    onChange={(e) => setSucursalIngreso(e.target.value as 'Calama' | 'Antofagasta')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                  >
                    <option value="Calama">Sucursal Calama</option>
                    <option value="Antofagasta">Sucursal Antofagasta</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    Cantidad Recibida (+1 a +50) <span className="text-amaru-copper">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={cantidadIngreso}
                      onChange={(e) => setCantidadIngreso(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-sm font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                    />
                    <div className="flex gap-1 shrink-0">
                      {[5, 10, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCantidadIngreso(num)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:border-amaru-copper cursor-pointer"
                        >
                          +{num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* N° de Guía de Despacho o Factura */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  N° Guía de Despacho / Factura Proveedor <span className="text-amaru-copper">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. GD-2026-9810 ó FAC-55412"
                  value={guiaDespacho}
                  onChange={(e) => setGuiaDespacho(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-xs uppercase placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                />
                <p className="text-[11px] text-slate-400">
                  Obligatorio para auditoría interna y conciliación de stock con Administración.
                </p>
              </div>

              {/* Registro de Auditoría */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">Responsable de Recepción:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {nombreOperador} (VENDEDOR)
                </span>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalIngresoAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                >
                  <PackageCheck size={15} />
                  <span>Confirmar e Ingresar Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Gerencial: Ajuste de Precio / Merma de Bodega (Exclusivo Administradora) ── */}
      {modalGerencialAbierto && itemGerencial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1A18] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Settings size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    Ajuste Gerencial: {itemGerencial.nombre}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                    SKU: {itemGerencial.sku} · Exclusivo Administradora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalGerencialAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas: Cambio de Precio vs Registro de Merma */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-black/40 p-1 border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTabGerencial('PRECIO');
                  setErrorGerencial('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tabGerencial === 'PRECIO'
                    ? 'bg-white dark:bg-[#2A2522] text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign size={14} />
                <span>1. Cambio de Precio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTabGerencial('MERMA');
                  setErrorGerencial('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tabGerencial === 'MERMA'
                    ? 'bg-white dark:bg-[#2A2522] text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MinusCircle size={14} />
                <span>2. Registro de Merma</span>
              </button>
            </div>

            {errorGerencial && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorGerencial}</span>
              </div>
            )}

            {/* ── Pestaña 1: Cambio de Precio ── */}
            {tabGerencial === 'PRECIO' && (
              <form onSubmit={handleGuardarNuevoPrecio} className="space-y-4 text-xs">
                {(() => {
                  const costoProv =
                    COSTOS_ADMIN[itemGerencial.sku]?.costo ||
                    Math.round(itemGerencial.precioClp * 0.35);
                  const nuevoMargenBrutoClp = nuevoPrecioVenta - costoProv;
                  const nuevoMargenPct =
                    nuevoPrecioVenta > 0
                      ? Math.round((nuevoMargenBrutoClp / nuevoPrecioVenta) * 100)
                      : 0;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Costo Proveedor (Confidencial):
                          </span>
                          <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                            ${costoProv.toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Precio Venta Actual:
                          </span>
                          <span className="font-mono text-sm font-extrabold text-slate-500 line-through">
                            ${itemGerencial.precioClp.toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                          Nuevo Precio de Venta (CLP) <span className="text-amaru-copper">*</span>
                        </label>
                        <input
                          type="number"
                          step={1000}
                          min={10000}
                          value={nuevoPrecioVenta}
                          onChange={(e) => setNuevoPrecioVenta(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                          required
                        />
                      </div>

                      {/* Cálculo en vivo de Margen */}
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                            Nuevo Margen Bruto Proyectado:
                          </span>
                          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            Ganancia neta: ${nuevoMargenBrutoClp.toLocaleString('es-CL')} CLP por unidad
                          </span>
                        </div>
                        <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                          +{nuevoMargenPct}%
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                          Motivo del Ajuste de Precio <span className="text-amaru-copper">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Ajuste IPC anual, Promoción temporal o Reajuste de margen"
                          value={motivoPrecio}
                          onChange={(e) => setMotivoPrecio(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                          required
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400">Firma de Auditoría:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-400">
                          María González (Administradora)
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setModalGerencialAbierto(false)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-600/20 active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 size={15} />
                          <span>Actualizar Precio Oficial</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </form>
            )}

            {/* ── Pestaña 2: Registro de Merma / Ajuste de Stock (Solo Resta) ── */}
            {tabGerencial === 'MERMA' && (
              <form onSubmit={handleGuardarMermaStock} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    <span>Control Estricto de Bajas (Kardex Inmutable)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Las altas de stock se realizan <strong>únicamente con N° de Guía de Despacho en mesón</strong>. Este módulo es exclusivo para registrar bajas por rotura, daño en biselado o traspasos auditados.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Sucursal Afectada <span className="text-amaru-copper">*</span>
                    </label>
                    <select
                      value={sucursalMerma}
                      onChange={(e) => setSucursalMerma(e.target.value as 'Calama' | 'Antofagasta')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                    >
                      <option value="Calama">
                        Calama ({itemGerencial.stock.Calama || 0} disponibles)
                      </option>
                      <option value="Antofagasta">
                        Antofagasta ({itemGerencial.stock.Antofagasta || 0} disponibles)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Unidades a Descontar <span className="text-amaru-copper">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={itemGerencial.stock[sucursalMerma] || 1}
                      value={cantidadMerma}
                      onChange={(e) => setCantidadMerma(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-sm font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Tipo de Merma / Motivo Operativo <span className="text-amaru-copper">*</span>
                  </label>
                  <select
                    value={tipoMerma}
                    onChange={(e) =>
                      setTipoMerma(e.target.value as 'Rotura en Taller' | 'Garantía Clínica' | 'Traspaso a Sucursal')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                  >
                    <option value="Rotura en Taller">Rotura en Taller / Daño en Biselado</option>
                    <option value="Garantía Clínica">Garantía Clínica / Reemplazo por Falla</option>
                    <option value="Traspaso a Sucursal">Traspaso a Sucursal / Muestra Física</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Detalle Obligatorio de la Merma <span className="text-amaru-copper">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describa el incidente, folio del pedido involucrado o justificación de la baja..."
                    value={motivoMerma}
                    onChange={(e) => setMotivoMerma(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-zinc-400">Responsable de Baja:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    María González (Administradora)
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalGerencialAbierto(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-600/20 active:scale-95 flex items-center gap-2"
                  >
                    <MinusCircle size={15} />
                    <span>Confirmar Merma y Descontar Stock</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
