import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
  X,
  Receipt,
  Percent,
} from 'lucide-react';
import {
  getCatalogoConvenios,
  crearConvenio,
  actualizarConvenio,
  eliminarConvenio,
  estaConvenioVigente,
  type InfoSindicato,
  type TipoConvenio,
} from '../services/convenioSindicatoService';

export const ConveniosAdminSection: React.FC = () => {
  const [convenios, setConvenios] = useState<InfoSindicato[]>(() => getCatalogoConvenios());
  const [busqueda, setBusqueda] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [codigoOriginal, setCodigoOriginal] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [empresa, setEmpresa] = useState<string>('');
  const [tipo, setTipo] = useState<TipoConvenio>('TIPO_B');
  const [tope, setTope] = useState<number>(150000);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(20);
  const [fechaVigencia, setFechaVigencia] = useState<string>('2026-12-31');
  const [estado, setEstado] = useState<'Vigente' | 'Vencido'>('Vigente');
  const [descripcion, setDescripcion] = useState<string>('');
  const [errorForm, setErrorForm] = useState<string>('');

  // Modal Confirmación Eliminar
  const [convenioAEliminar, setConvenioAEliminar] = useState<InfoSindicato | null>(null);

  const refrescar = () => {
    setConvenios(getCatalogoConvenios());
  };

  useEffect(() => {
    const onUpdated = () => refrescar();
    window.addEventListener('amaru_convenios_updated', onUpdated);
    window.addEventListener('storage', onUpdated);
    return () => {
      window.removeEventListener('amaru_convenios_updated', onUpdated);
      window.removeEventListener('storage', onUpdated);
    };
  }, []);

  const mostrarFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 5000);
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setCodigoOriginal('');
    setCodigo('');
    setNombre('');
    setEmpresa('');
    setTipo('TIPO_B');
    setTope(150000);
    setPorcentajeDescuento(20);
    setFechaVigencia('2026-12-31');
    setEstado('Vigente');
    setDescripcion('');
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item: InfoSindicato) => {
    setModoEdicion(true);
    setCodigoOriginal(item.codigo);
    setCodigo(item.codigo);
    setNombre(item.nombre);
    setEmpresa(item.empresa);
    setTipo(item.tipo);
    setTope(item.tope ?? 150000);
    setPorcentajeDescuento(item.porcentajeDescuento ?? 20);
    setFechaVigencia(item.fechaVigencia || '2026-12-31');
    setEstado(estaConvenioVigente(item) ? 'Vigente' : 'Vencido');
    setDescripcion(item.descripcion || '');
    setErrorForm('');
    setModalAbierto(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');

    if (!codigo.trim()) {
      setErrorForm('El código único del convenio es obligatorio.');
      return;
    }
    if (!nombre.trim()) {
      setErrorForm('El nombre del sindicato o convenio es obligatorio.');
      return;
    }
    if (tipo === 'TIPO_A' && (porcentajeDescuento <= 0 || porcentajeDescuento > 100)) {
      setErrorForm('El porcentaje de descuento debe estar entre 1% y 100%.');
      return;
    }
    if (tipo === 'TIPO_B' && tope <= 0) {
      setErrorForm('El tope de cobertura en CLP debe ser mayor a $0.');
      return;
    }

    const descFinal =
      descripcion.trim() ||
      (tipo === 'TIPO_B'
        ? `Cobertura hasta $${tope.toLocaleString('es-CL')} CLP vía descuento por planilla.`
        : `${porcentajeDescuento}% de Descuento Directo en armazones y cristales.`);

    if (modoEdicion) {
      const res = actualizarConvenio(codigoOriginal, {
        nombre: nombre.trim(),
        empresa: empresa.trim() || nombre.trim(),
        tipo,
        tope: tipo === 'TIPO_B' ? tope : undefined,
        porcentajeDescuento: tipo === 'TIPO_A' ? porcentajeDescuento : undefined,
        fechaVigencia,
        estado,
        descripcion: descFinal,
      });
      if (!res.exito) {
        setErrorForm(res.error || 'Error al actualizar el convenio.');
        return;
      }
      refrescar();
      setModalAbierto(false);
      mostrarFeedback(`✓ Convenio "${codigoOriginal}" actualizado. Los cambios ya están activos en todos los formularios.`);
    } else {
      const res = crearConvenio({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        empresa: empresa.trim() || nombre.trim(),
        tipo,
        tipoNombre:
          tipo === 'TIPO_B'
            ? 'Subvención / Descuento por Planilla'
            : 'Descuento Directo al Contado',
        tope: tipo === 'TIPO_B' ? tope : undefined,
        porcentajeDescuento: tipo === 'TIPO_A' ? porcentajeDescuento : undefined,
        fechaVigencia,
        estado,
        descripcion: descFinal,
      });
      if (!res.exito) {
        setErrorForm(res.error || 'No se pudo registrar el convenio.');
        return;
      }
      refrescar();
      setModalAbierto(false);
      mostrarFeedback(`✓ Nuevo convenio "${codigo.trim().toUpperCase()}" creado y disponible de inmediato para validación de pacientes.`);
    }
  };

  const handleConfirmarEliminar = () => {
    if (!convenioAEliminar) return;
    const cod = convenioAEliminar.codigo;
    eliminarConvenio(cod);
    refrescar();
    setConvenioAEliminar(null);
    mostrarFeedback(`🗑️ Convenio "${cod}" eliminado del padrón activo.`);
  };

  const filtrados = convenios.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      c.codigo.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.empresa.toLowerCase().includes(q)
    );
  });

  const totalVigentes = convenios.filter((c) => estaConvenioVigente(c)).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Feedback Toast */}
      {feedback && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera CRUD de Convenios */}
      <div className="card-zenith rounded-3xl p-6 border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Building2 size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Administrador de Convenios Sindicales y Empresas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {totalVigentes} Vigentes / {convenios.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Crea, edita vigencia/cobertura o da de baja convenios. Los cambios se sincronizan al instante con los portales de pacientes y mesón.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalCrear}
            className="btn-copper px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 transition-all shrink-0"
          >
            <Plus size={15} />
            <span>Nuevo Convenio</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código (SDC1326), sindicato o empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amaru-copper"
          />
        </div>

        {/* Tabla CRUD */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-zinc-900/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Sindicato / Empresa</th>
                <th className="px-4 py-3">Beneficio / Tope</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#1C1A18]">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron convenios con ese criterio.
                  </td>
                </tr>
              ) : (
                filtrados.map((item) => {
                  const vigente = estaConvenioVigente(item);
                  return (
                    <tr
                      key={item.codigo}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                          {item.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.nombre}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">{item.empresa}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.tipo === 'TIPO_B' ? (
                          <div>
                            <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                              Tope ${(item.tope || 0).toLocaleString('es-CL')} CLP
                            </span>
                            <div className="text-[10px] text-slate-400">Subvención / Planilla</div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-extrabold text-sky-700 dark:text-sky-400">
                              {item.porcentajeDescuento || 0}% Descuento
                            </span>
                            <div className="text-[10px] text-slate-400">Descuento Directo Contado</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={12} className="text-amaru-copper" />
                          {item.fechaVigencia || '2026-12-31'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {vigente ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Vigente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Vencido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 size={12} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConvenioAEliminar(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Convenio */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A18] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  {modoEdicion ? <Edit3 size={18} /> : <Plus size={18} />}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {modoEdicion ? `Editar Convenio (${codigoOriginal})` : 'Registrar Nuevo Convenio Sindical'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Impacto inmediato en validadores de pacientes y mesón POS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorForm && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{errorForm}</span>
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    disabled={modoEdicion}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: SDC2026"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase text-xs font-bold ${
                      modoEdicion
                        ? 'bg-slate-100 dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-white/5 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-amaru-copper outline-none'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Estado *
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as 'Vigente' | 'Vencido')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amaru-copper"
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Nombre del Sindicato / Convenio *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sindicato N°2 Radomiro Tomic"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Empresa / Institución
                </label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ej: Codelco División Radomiro Tomic"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                />
              </div>

              {/* Tipo de Beneficio */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipo('TIPO_B')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    tipo === 'TIPO_B'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Receipt size={14} />
                    <span>Tope Planilla ($)</span>
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">Subvención en CLP</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('TIPO_A')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    tipo === 'TIPO_A'
                      ? 'bg-sky-500/15 border-sky-500/50 text-sky-900 dark:text-sky-200 font-bold'
                      : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Percent size={14} />
                    <span>Descuento Directo (%)</span>
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">Porcentaje al contado</div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tipo === 'TIPO_B' ? (
                  <div>
                    <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Tope de Beneficio (CLP) *
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={5000}
                      value={tope}
                      onChange={(e) => setTope(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                      Porcentaje de Descuento (%) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={porcentajeDescuento}
                      onChange={(e) => setPorcentajeDescuento(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Fecha de Vigencia *
                  </label>
                  <input
                    type="date"
                    value={fechaVigencia}
                    onChange={(e) => setFechaVigencia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Descripción / Condiciones (Opcional)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Cobertura válida para socios y cargas familiares..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amaru-copper"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-copper px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{modoEdicion ? 'Guardar Cambios' : 'Crear Convenio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {convenioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A18] border border-rose-500/35 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <span className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ¿Eliminar Convenio {convenioAEliminar.codigo}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {convenioAEliminar.nombre}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Esta acción retirará el código <strong>{convenioAEliminar.codigo}</strong> del padrón activo y dejará de aceptarse en los formularios de validación de pacientes.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setConvenioAEliminar(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConveniosAdminSection;
