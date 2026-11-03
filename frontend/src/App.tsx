import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, type PedidoOfflineQueue } from './db/dexie';
import { sincronizarColaOffline } from './sw/syncService';
import { Login } from './components/Login';
import logoImg from './assets/logo.jpg';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('amaru_session_active') === 'true';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [rutPaciente, setRutPaciente] = useState<string>('');
  const [tieneRecetaVigente, setTieneRecetaVigente] = useState<boolean>(true);
  const [skuSeleccionado, setSkuSeleccionado] = useState<string>('');
  const [montoTotal, setMontoTotal] = useState<string>('85000');
  const [esConvenio, setEsConvenio] = useState<boolean>(true);
  const [rutTitular, setRutTitular] = useState<string>('');
  const [colaPendiente, setColaPendiente] = useState<PedidoOfflineQueue[]>([]);
  const [mensajeSync, setMensajeSync] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isAuthenticated) {
      cargarDatosLocales();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  const cargarDatosLocales = async () => {
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

  const handleLoginSuccess = () => {
    localStorage.setItem('amaru_session_active', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('amaru_session_active');
    setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-zinc-100 p-6 flex flex-col items-center font-sans">
      <header className="w-full max-w-5xl flex justify-between items-center bg-[#121826] border border-[#2A364F] px-6 py-4 rounded-xl shadow-xl mb-6">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Óptica Amaru" className="h-10 w-auto object-contain rounded" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Terminal Operativa Faena
            </h1>
            <p className="text-xs text-zinc-400">Plataforma Health-Tech EPP Minería</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-[#1A2234] border border-[#2A364F] px-3 py-1.5 rounded-lg">
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold">{isOnline ? 'En Línea' : 'Offline'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-xs font-medium text-zinc-400 hover:text-[#FF5500] border border-[#2A364F] hover:border-[#FF5500] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#121826] border border-[#2A364F] p-6 rounded-xl shadow-lg">
          <h2 className="text-base font-bold mb-4 text-[#FF5500]">
            Registro de Solicitud de EPP Óptico
          </h2>

          <form onSubmit={handleRegistrarPedido} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">RUT Paciente Trabajador</label>
              <input
                type="text"
                placeholder="12345678-9"
                value={rutPaciente}
                onChange={(e) => setRutPaciente(e.target.value)}
                className="w-full bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#FF5500] outline-none transition-colors"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="receta"
                checked={tieneRecetaVigente}
                onChange={(e) => setTieneRecetaVigente(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A364F] bg-[#1A2234] text-[#FF5500] focus:ring-[#FF5500] accent-[#FF5500]"
              />
              <label htmlFor="receta" className="text-xs text-zinc-300 cursor-pointer">
                ¿Posee receta óptica vigente (&lt; 365 días)?
              </label>
            </div>

            {!tieneRecetaVigente ? (
              <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg text-xs text-amber-200 space-y-2">
                <p className="font-semibold text-amber-300">Embudo de Retención Activado:</p>
                <p>
                  Sin receta vigente no se permite la fabricación de EPP correctivo. Derivando a reserva clínica en faena.
                </p>
                <button
                  type="button"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Agendar Evaluación Oftalmológica
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Modelo / SKU Armazón</label>
                  <select
                    value={skuSeleccionado}
                    onChange={(e) => {
                      const sku = e.target.value;
                      setSkuSeleccionado(sku);
                      if (sku === 'EPP-MIN-001') setMontoTotal('85000');
                      else if (sku === 'EPP-MIN-002') setMontoTotal('92000');
                    }}
                    className="w-full bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#FF5500] outline-none transition-colors"
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
                    className="h-4 w-4 rounded border-[#2A364F] bg-[#1A2234] text-[#FF5500] focus:ring-[#FF5500] accent-[#FF5500]"
                  />
                  <label htmlFor="convenio" className="text-xs text-zinc-300 cursor-pointer">
                    Afecto a Convenio Sindical (Descuento por planilla)
                  </label>
                </div>

                {esConvenio && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">RUT Titular Descuento</label>
                    <input
                      type="text"
                      placeholder="RUT Titular Nómina"
                      value={rutTitular}
                      onChange={(e) => setRutTitular(e.target.value)}
                      className="w-full bg-[#1A2234] border border-[#2A364F] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#FF5500] outline-none transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#FF5500] hover:bg-[#E04B00] text-white font-semibold py-2.5 rounded-lg text-sm tracking-wide transition-colors cursor-pointer shadow-lg shadow-orange-950/30"
                >
                  Generar Folio y Guardar en Local
                </button>
              </>
            )}
          </form>
        </section>

        <section className="bg-[#121826] border border-[#2A364F] p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white">Cola FIFO Offline (Dexie.js)</h2>
              <span className="text-xs bg-[#1A2234] border border-[#2A364F] px-2.5 py-1 rounded-md text-[#FF5500] font-semibold">
                {colaPendiente.filter((p) => !p.sincronizado).length} pendientes
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {colaPendiente.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No hay pedidos registrados en la base local.</p>
              ) : (
                colaPendiente.map((item) => (
                  <div
                    key={item.folio_unico_qr}
                    className="bg-[#1A2234] border border-[#2A364F] p-3 rounded-lg text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-mono text-[#FF5500] font-bold">{item.folio_unico_qr}</p>
                      <p className="text-zinc-400">Paciente: {item.rut_paciente} | SKU: {item.sku_armazon}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.sincronizado
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        }`}
                    >
                      {item.sincronizado ? 'Sincronizado' : 'En Cola'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#2A364F]">
            {mensajeSync && <p className="text-xs text-zinc-400 mb-3 font-mono">{mensajeSync}</p>}
            <button
              onClick={handleSincronizar}
              disabled={!isOnline}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isOnline
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
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