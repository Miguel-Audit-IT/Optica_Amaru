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
} from 'lucide-react';
import {
  getInventario,
  getSucursalActiva,
  setSucursalActiva,
  registrarIngresoStock,
  type ItemInventario,
} from '../services/inventarioService';
import { getUserInfo } from '../utils/auth';
import {
  TitanioProIcon,
  AcetatoLumiereIcon,
  UltralightFlexIcon,
} from '../components/icons/ArmazonesSVGs';

export const InventarioView: React.FC = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const nombreOperador = (
    localStorage.getItem('amaru_nombre_vendedor') ||
    (userInfo.username === '17456789-2' ? 'JUANITA ARAYA' : 'CARLOS ROJAS MORALES')
  ).toUpperCase();

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
              <span>Catálogo & Stock en Tiempo Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Inventario & Vitrina de Armazones
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Herramienta ágil de consulta para el vendedor en mesón: revisa disponibilidad de monturas, materiales oftálmicos y stock en vivo entre sucursales.
            </p>
          </div>

          {/* Switch de Sucursal Activa + Ingreso Stock + Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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

            {/* Botón Acción Secundaria: Registrar Ingreso de Stock */}
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
    </div>
  );
};
