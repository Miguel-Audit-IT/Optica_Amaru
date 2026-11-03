import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, type PedidoOfflineQueue } from '../db/dexie';
import { sincronizarColaOffline, limpiarSincronizados } from '../sw/syncService';
import { validarRUT, normalizarInputRUT, formatearRUT } from '../utils/rut';

interface TerminalViewProps {
  isOnline: boolean;
  onSessionExpired: () => void;
}

const TerminalView: React.FC<TerminalViewProps> = ({ isOnline, onSessionExpired: _onSessionExpired }) => {
  const [rutPaciente, setRutPaciente] = useState('');
  const [errorRutPaciente, setErrorRutPaciente] = useState('');
  const [tieneRecetaVigente, setTieneRecetaVigente] = useState(true);
  const [skuSeleccionado, setSkuSeleccionado] = useState('');
  const [montoTotal, setMontoTotal] = useState('85000');
  const [esConvenio, setEsConvenio] = useState(true);
  const [rutTitular, setRutTitular] = useState('');
  const [errorRutTitular, setErrorRutTitular] = useState('');
  const [colaPendiente, setColaPendiente] = useState<PedidoOfflineQueue[]>([]);
  const [mensajeSync, setMensajeSync] = useState('');

  useEffect(() => {
    cargarDatosLocales();
  }, []);

  useEffect(() => {
    if (!esConvenio) { setRutTitular(''); setErrorRutTitular(''); }
  }, [esConvenio]);

  const cargarDatosLocales = async () => {
    const count = await db.armazones.count();
    if (count === 0) {
      await db.armazones.bulkAdd([
        { sku_armazon: 'EPP-MIN-001', modelo_lente: 'Titanium Shield Industrial Pro', caracteristicas_tecnicas: { material: 'Policarbonato Reforzado', filtro_uv: 'UV400' }, certificaciones_multiples: ['ANSI Z87.1', 'EN 166'], stock_disponible: 15, precio_clp: 85000 },
        { sku_armazon: 'EPP-MIN-002', modelo_lente: 'Vulcan Flex Faena Extreme', caracteristicas_tecnicas: { material: 'TR90 Resistente a Impacto', patillas: 'Ajustables' }, certificaciones_multiples: ['ANSI Z87.1'], stock_disponible: 8, precio_clp: 92000 }
      ]);
    }
    setColaPendiente(await db.cola_pedidos.toArray());
  };

  const handleRutPacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutPaciente(v);
    if (v.length > 3) setErrorRutPaciente(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    else setErrorRutPaciente('');
  };
  const handleRutPacienteBlur = () => {
    if (!rutPaciente) return;
    const f = formatearRUT(rutPaciente); setRutPaciente(f);
    setErrorRutPaciente(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
  };
  const handleRutTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = normalizarInputRUT(e.target.value);
    setRutTitular(v);
    if (v.length > 3) setErrorRutTitular(validarRUT(v) ? '' : 'RUT inválido (Módulo 11)');
    else setErrorRutTitular('');
  };
  const handleRutTitularBlur = () => {
    if (!rutTitular) return;
    const f = formatearRUT(rutTitular); setRutTitular(f);
    setErrorRutTitular(validarRUT(f) ? '' : 'RUT inválido (Módulo 11)');
  };

  const formularioEsValido = () =>
    !!rutPaciente && validarRUT(rutPaciente) && !!skuSeleccionado &&
    (!esConvenio || (!!rutTitular && validarRUT(rutTitular)));

  const handleRegistrarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioEsValido()) return;
    const nuevoFolio = `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`;
    await db.cola_pedidos.add({
      folio_unico_qr: nuevoFolio,
      rut_paciente: formatearRUT(rutPaciente),
      sku_armazon: skuSeleccionado,
      rut_titular_pago: esConvenio ? formatearRUT(rutTitular) : null,
      version_seq: 1, monto_total: montoTotal,
      cuotas: esConvenio ? [
        { numero_cuota: 1, monto_cuota: (Number(montoTotal) / 2).toString(), mes_ejecucion: '2026-11-30' },
        { numero_cuota: 2, monto_cuota: (Number(montoTotal) / 2).toString(), mes_ejecucion: '2026-12-30' }
      ] : [],
      fecha_creacion: new Date().toISOString(), sincronizado: false, estado: 'en_cola', conflicto_msg: null
    });
    setRutPaciente(''); setErrorRutPaciente(''); setRutTitular(''); setErrorRutTitular(''); setSkuSeleccionado('');
    cargarDatosLocales();
    setMensajeSync(`✓ Folio ${nuevoFolio} guardado en IndexedDB.`);
  };

  const handleSincronizar = async () => {
    setMensajeSync('Sincronizando cola con el servidor Django...');
    try {
      const res = await sincronizarColaOffline();
      setMensajeSync(`Completado: ${res.procesados.length} procesados, ${res.conflictos.length} conflictos.`);
      cargarDatosLocales();
    } catch (err) { setMensajeSync(`Fallo: ${err instanceof Error ? err.message : 'Error desconocido'}`); }
  };

  const handleLimpiarSincronizados = async () => {
    const n = await limpiarSincronizados();
    setMensajeSync(`${n} registro(s) sincronizado(s) eliminados.`);
    cargarDatosLocales();
  };

  const BadgeEstado = ({ item }: { item: PedidoOfflineQueue }) => {
    if (item.estado === 'sincronizado') return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">Sincronizado</span>;
    if (item.estado === 'conflicto') return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-800">Conflicto</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">En Cola</span>;
  };

  const formularioValido = formularioEsValido();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario */}
      <section className="bg-[#121826] border border-[#2A364F] p-6 rounded-xl shadow-lg">
        <h2 className="text-base font-bold mb-4 text-[#FF5500]">Registro de Solicitud de EPP Óptico</h2>
        <form onSubmit={handleRegistrarPedido} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">RUT Paciente Trabajador</label>
            <input type="text" placeholder="12345678-9" value={rutPaciente} onChange={handleRutPacienteChange} onBlur={handleRutPacienteBlur} maxLength={12}
              className={`w-full bg-[#1A2234] border rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors ${errorRutPaciente ? 'border-red-500' : rutPaciente && validarRUT(rutPaciente) ? 'border-emerald-600' : 'border-[#2A364F] focus:border-[#FF5500]'}`} />
            {errorRutPaciente && <p className="text-red-400 text-[11px] mt-1">⚠ {errorRutPaciente}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="receta" checked={tieneRecetaVigente} onChange={(e) => setTieneRecetaVigente(e.target.checked)} className="h-4 w-4 rounded border-[#2A364F] bg-[#1A2234] accent-[#FF5500]" />
            <label htmlFor="receta" className="text-xs text-zinc-300 cursor-pointer">¿Posee receta óptica vigente (&lt; 365 días)?</label>
          </div>

          {!tieneRecetaVigente ? (
            <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg text-xs text-amber-200 space-y-2">
              <p className="font-semibold text-amber-300">Embudo de Retención Activado:</p>
              <p>Sin receta vigente no se permite la fabricación de EPP correctivo.</p>
              <button type="button" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer">Agendar Evaluación Oftalmológica</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Modelo / SKU Armazón</label>
                <select value={skuSeleccionado} onChange={(e) => { const s = e.target.value; setSkuSeleccionado(s); setMontoTotal(s === 'EPP-MIN-001' ? '85000' : s === 'EPP-MIN-002' ? '92000' : '85000'); }}
                  className="w-full bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#FF5500] outline-none transition-colors">
                  <option value="">-- Seleccionar Armazón Certificado --</option>
                  <option value="EPP-MIN-001">Titanium Shield Industrial Pro ($85.000)</option>
                  <option value="EPP-MIN-002">Vulcan Flex Faena Extreme ($92.000)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="convenio" checked={esConvenio} onChange={(e) => setEsConvenio(e.target.checked)} className="h-4 w-4 rounded border-[#2A364F] bg-[#1A2234] accent-[#FF5500]" />
                <label htmlFor="convenio" className="text-xs text-zinc-300 cursor-pointer">Afecto a Convenio Sindical (Descuento por planilla)</label>
              </div>

              <div>
                <label className={`block text-xs uppercase tracking-wider mb-1 ${esConvenio ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  RUT Titular Descuento {esConvenio && <span className="text-[#FF5500]">*</span>}
                </label>
                <input type="text" placeholder={esConvenio ? '12345678-9' : 'No aplica'} value={rutTitular} onChange={handleRutTitularChange} onBlur={handleRutTitularBlur} disabled={!esConvenio} maxLength={12}
                  className={`w-full bg-[#1A2234] border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${!esConvenio ? 'text-zinc-600 border-[#1A2234] cursor-not-allowed' : errorRutTitular ? 'text-white border-red-500' : rutTitular && validarRUT(rutTitular) ? 'text-white border-emerald-600' : 'text-white border-[#2A364F] focus:border-[#FF5500]'}`} />
                {esConvenio && errorRutTitular && <p className="text-red-400 text-[11px] mt-1">⚠ {errorRutTitular}</p>}
              </div>

              <button type="submit" disabled={!formularioValido}
                className={`w-full font-semibold py-2.5 rounded-lg text-sm tracking-wide transition-colors shadow-lg ${formularioValido ? 'bg-[#FF5500] hover:bg-[#E04B00] text-white cursor-pointer' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'}`}>
                Generar Folio y Guardar en Local
              </button>
            </>
          )}
        </form>
      </section>

      {/* Cola FIFO */}
      <section className="bg-[#121826] border border-[#2A364F] p-6 rounded-xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white">Cola FIFO Offline (Dexie.js)</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#1A2234] border border-[#2A364F] px-2.5 py-1 rounded-md text-[#FF5500] font-semibold">
                {colaPendiente.filter(p => p.estado === 'en_cola').length} pendientes
              </span>
              <button onClick={handleLimpiarSincronizados} className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 border border-[#2A364F] hover:border-zinc-500 px-2 py-1 rounded-md transition-colors cursor-pointer">
                Limpiar sincronizados
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {colaPendiente.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">No hay pedidos registrados en la base local.</p>
            ) : colaPendiente.map(item => (
              <div key={item.folio_unico_qr} className="bg-[#1A2234] border border-[#2A364F] p-3 rounded-lg text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-[#FF5500] font-bold">{item.folio_unico_qr}</p>
                    <p className="text-zinc-400 mt-0.5">Paciente: {item.rut_paciente} | SKU: {item.sku_armazon}</p>
                  </div>
                  <BadgeEstado item={item} />
                </div>
                {item.estado === 'conflicto' && item.conflicto_msg && (
                  <p className="mt-1.5 text-red-400 text-[11px] bg-red-950/30 border border-red-900/50 rounded px-2 py-1">⚠ Conflicto: {item.conflicto_msg}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#2A364F]">
          {mensajeSync && <p className="text-xs text-zinc-400 mb-3 font-mono">{mensajeSync}</p>}
          <button onClick={handleSincronizar} disabled={!isOnline}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isOnline ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'}`}>
            {isOnline ? 'Sincronizar Cola con Servidor (POST /sync-batch/)' : 'Sin Conexión a Red'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default TerminalView;

