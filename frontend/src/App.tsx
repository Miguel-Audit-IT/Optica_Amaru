import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, type PedidoOfflineQueue } from './db/dexie';
import { sincronizarColaOffline } from './sw/syncService';

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [rutPaciente, setRutPaciente] = useState<string>('');
  const [tieneRecetaVigente, setTieneRecetaVigente] = useState<boolean>(true);
  const [skuSeleccionado, setSkuSeleccionado] = useState<string>('');
  const [montoTotal, setMontoTotal] = useState<string>('85000');
  const [esConvenio, setEsConvenio] = useState<boolean>(true);
  const [rutTitular, setRutTitular] = useState<string>('');
  const [colaPendiente, setColaPendiente] = useState<PedidoOfflineQueue[]>([]);
  const [mensajeSync, setMensajeSync] = useState<string>('');

  // Escucha de estado de conectividad industrial
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    cargarDatosLocales();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cargarDatosLocales = async () => {
    // Si no existen armazones en cache local, sembramos muestras para operar offline
    const count = await db.armazones.count();
    if (count === 0) {
      await db.armazones.bulkAdd([
        {
          sku_armazon: 'EPP-MIN-001',
          modelo_lente: 'Titanium Shield Industrial Pro',
          caracteristicas_tecnicas: { material: 'Policarbonato Reforzado', filtro_uv: 'UV400' },
          certificaciones_multiples: ['ANSI Z87.1', 'EN 166'],
          stock_disponible: 15,
          precio_clp: 85000
        },
        {
          sku_armazon: 'EPP-MIN-002',
          modelo_lente: 'Vulcan Flex Faena Extreme',
          caracteristicas_tecnicas: { material: 'TR90 Resistente a Impacto', patillas: 'Ajustables' },
          certificaciones_multiples: ['ANSI Z87.1'],
          stock_disponible: 8,
          precio_clp: 92000
        }
      ]);
    }

    const pedidos = await db.cola_pedidos.toArray();
    setColaPendiente(pedidos);
  };

  const handleRegistrarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutPaciente || !skuSeleccionado) {
      alert('Debe completar el RUT del paciente y el armazón.');
      return;
    }

    const nuevoFolio = `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`;

    const nuevoPedido: PedidoOfflineQueue = {
      folio_unico_qr: nuevoFolio,
      rut_paciente: rutPaciente,
      sku_armazon: skuSeleccionado,
      rut_titular_pago: esConvenio ? (rutTitular || rutPaciente) : null,
      version_seq: 1,
      monto_total: montoTotal,
      cuotas: esConvenio
        ? [
          { numero_cuota: 1, monto_cuota: (Number(montoTotal) / 2).toString(), mes_ejecucion: '2026-11-30' },
          { numero_cuota: 2, monto_cuota: (Number(montoTotal) / 2).toString(), mes_ejecucion: '2026-12-30' }
        ]
        : [],
      fecha_creacion: new Date().toISOString(),
      sincronizado: false
    };

    await db.cola_pedidos.add(nuevoPedido);
    setRutPaciente('');
    setRutTitular('');
    cargarDatosLocales();
    setMensajeSync(`Pedido ${nuevoFolio} registrado en almacenamiento local (IndexedDB).`);
  };

  const handleSincronizar = async () => {
    setMensajeSync('Iniciando sincronización por lotes con el servidor Django...');
    try {
      const res = await sincronizarColaOffline();
      setMensajeSync(`Sincronización completada. Procesados: ${res.procesados.length}. Conflictos: ${res.conflictos.length}`);
      cargarDatosLocales();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMensajeSync(`Fallo al sincronizar: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      {/* Barra de Conectividad de Faena */}
      <header className="w-full max-w-4xl flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Óptica Amaru — Terminal Industrial</h1>
          <p className="text-xs text-slate-400">PWA Health-Tech Operativa (Turnos Faena)</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-sm font-semibold">{isOnline ? 'En Línea' : 'Modo Offline (Faena)'}</span>
        </div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Emisión */}
        <section className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-emerald-400">Registro de Solicitud de EPP Óptico</h2>

          <form onSubmit={handleRegistrarPedido} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-300 mb-1">RUT Paciente Trabajador</label>
              <input
                type="text"
                placeholder="12345678-9"
                value={rutPaciente}
                onChange={(e) => setRutPaciente(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="receta"
                checked={tieneRecetaVigente}
                onChange={(e) => setTieneRecetaVigente(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="receta" className="text-sm text-slate-300">
                ¿Posee receta óptica vigente (&lt; 365 días)?
              </label>
            </div>

            {/* Embudo de Retención Asíncrona (Sección 6 TDD) */}
            {!tieneRecetaVigente ? (
              <div className="bg-amber-950/60 border border-amber-600/40 p-4 rounded-lg text-sm text-amber-200">
                <p className="font-semibold mb-1">Embudo de Retención Activado:</p>
                <p className="text-xs">
                  Sin receta vigente no se permite la fabricación de EPP correctivo. Derivando a reserva de hora clínica en operativo faena.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                >
                  Agendar Evaluación Oftalmológica
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 mb-1">Modelo / SKU Armazón</label>
                  <select
                    value={skuSeleccionado}
                    onChange={(e) => {
                      const sku = e.target.value;
                      setSkuSeleccionado(sku);
                      if (sku === 'EPP-MIN-001') setMontoTotal('85000');
                      else if (sku === 'EPP-MIN-002') setMontoTotal('92000');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="">-- Seleccionar Armazón Certificado --</option>
                    <option value="EPP-MIN-001">Titanium Shield Industrial Pro ($85.000)</option>
                    <option value="EPP-MIN-002">Vulcan Flex Faena Extreme ($92.000)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="convenio"
                    checked={esConvenio}
                    onChange={(e) => setEsConvenio(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="convenio" className="text-sm text-slate-300">
                    Afecto a Convenio Sindical (Descuento por planilla)
                  </label>
                </div>

                {esConvenio && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-300 mb-1">RUT Titular Descuento</label>
                    <input
                      type="text"
                      placeholder="RUT Titular Nómina"
                      value={rutTitular}
                      onChange={(e) => setRutTitular(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm tracking-wide transition-colors"
                >
                  Generar Folio y Guardar en Local
                </button>
              </>
            )}
          </form>
        </section>

        {/* Monitor de Cola Offline / Sincronización */}
        <section className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-200">Cola FIFO Offline (Dexie.js)</h2>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded-md text-slate-300">
                {colaPendiente.filter(p => !p.sincronizado).length} pendientes
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {colaPendiente.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay pedidos registrados en la base local.</p>
              ) : (
                colaPendiente.map((item) => (
                  <div
                    key={item.folio_unico_qr}
                    className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-mono text-emerald-400 font-bold">{item.folio_unico_qr}</p>
                      <p className="text-slate-400">Paciente: {item.rut_paciente} | SKU: {item.sku_armazon}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.sincronizado ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                    >
                      {item.sincronizado ? 'Sincronizado' : 'En Cola'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            {mensajeSync && <p className="text-xs text-slate-400 mb-3 font-mono">{mensajeSync}</p>}
            <button
              onClick={handleSincronizar}
              disabled={!isOnline}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${isOnline
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              {isOnline ? 'Sincronizar Cola con Servidor (POST /sync-batch/)' : 'Sin Conexión a Red'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}