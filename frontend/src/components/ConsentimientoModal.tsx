import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RotateCcw,
  X,
  FileText,
  Lock,
} from 'lucide-react';

export const CONSENTIMIENTO_STORAGE_KEY = 'amaru_consentimiento_v1';
export const CONSENTIMIENTO_VERSION = '2026.11-Ley21719';

export interface RegistroConsentimiento {
  aceptado: boolean;
  fechaAceptacion: string;
  version: string;
}

export function tieneConsentimientoValido(): boolean {
  try {
    const raw = localStorage.getItem(CONSENTIMIENTO_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<RegistroConsentimiento>;
    return Boolean(
      parsed &&
        parsed.aceptado === true &&
        parsed.version === CONSENTIMIENTO_VERSION &&
        typeof parsed.fechaAceptacion === 'string' &&
        parsed.fechaAceptacion.length > 0
    );
  } catch {
    return false;
  }
}

export interface ConsentimientoModalProps {
  modo: 'bloqueante' | 'consulta';
  isOpen: boolean;
  acordeonInicial?: 'terminos' | 'privacidad' | null;
  onAceptar?: () => void;
  onCerrar?: () => void;
}

export const ConsentimientoModal: React.FC<ConsentimientoModalProps> = ({
  modo,
  isOpen,
  acordeonInicial = null,
  onAceptar,
  onCerrar,
}) => {
  const [acordeonAbierto, setAcordeonAbierto] = useState<'terminos' | 'privacidad' | null>(
    acordeonInicial
  );
  const [terminoLeido, setTerminoLeido] = useState<boolean>(false);
  const [privacidadLeida, setPrivacidadLeida] = useState<boolean>(false);
  const [checkboxAceptado, setCheckboxAceptado] = useState<boolean>(false);
  const [rechazado, setRechazado] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setAcordeonAbierto(acordeonInicial);
      setRechazado(false);
      if (modo === 'bloqueante') {
        setCheckboxAceptado(false);
      }
    }
  }, [isOpen, acordeonInicial, modo]);

  if (!isOpen) return null;

  const ambosLeidos = terminoLeido && privacidadLeida;

  const handleToggleAcordeon = (seccion: 'terminos' | 'privacidad') => {
    setAcordeonAbierto((prev) => (prev === seccion ? null : seccion));
  };

  const handleScrollTerminos = (e: React.UIEvent<HTMLDivElement>) => {
    if (terminoLeido) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 14) {
      setTerminoLeido(true);
    }
  };

  const handleScrollPrivacidad = (e: React.UIEvent<HTMLDivElement>) => {
    if (privacidadLeida) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 14) {
      setPrivacidadLeida(true);
    }
  };

  const handleConfirmarAceptacion = () => {
    if (!ambosLeidos || !checkboxAceptado) return;
    const registro: RegistroConsentimiento = {
      aceptado: true,
      fechaAceptacion: new Date().toISOString(),
      version: CONSENTIMIENTO_VERSION,
    };
    localStorage.setItem(CONSENTIMIENTO_STORAGE_KEY, JSON.stringify(registro));
    onAceptar?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consentimiento-modal-title"
      onClick={() => {
        if (modo === 'consulta') onCerrar?.();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#141414] text-stone-100 rounded-3xl border border-white/10 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Franja superior acento ámbar/cobre corporativo */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7C3306] via-[#C86D2D] to-[#E28A48] shrink-0" />

        {/* Encabezado del Modal */}
        <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#C86D2D]/15 border border-[#C86D2D]/35 text-[#C86D2D] shrink-0 mt-0.5">
              {modo === 'bloqueante' ? <Scale size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C86D2D] mb-1">
                Óptica Amaru · Ley N° 21.719 & ISO 27001
              </span>
              <h2
                id="consentimiento-modal-title"
                className="text-xl sm:text-2xl font-black tracking-tight text-white"
              >
                {modo === 'bloqueante' ? 'Antes de continuar' : 'Términos y Privacidad'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 leading-relaxed">
                {modo === 'bloqueante'
                  ? 'Para usar Óptica Amaru necesitamos que revises y aceptes nuestros términos y cómo cuidamos tus datos.'
                  : 'Estos son los términos y la política de privacidad que aceptaste.'}
              </p>
            </div>
          </div>

          {modo === 'consulta' && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="px-6 sm:px-7 py-5 overflow-y-auto space-y-4 flex-1">
          {rechazado && modo === 'bloqueante' ? (
            /* Pantalla de rechazo claro */
            <div className="rounded-2xl bg-[#1E1E1E] border border-[#C86D2D]/35 p-6 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-[#C86D2D]/15 border border-[#C86D2D]/35 text-[#C86D2D] flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white">
                  No es posible continuar sin aceptar
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Sin aceptar los Términos y Condiciones y la Política de Privacidad no es posible operar en la plataforma digital de Óptica Amaru, ya que requerimos tu autorización para gestionar pedidos, convenios y seguimiento.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 text-left text-xs text-stone-300 space-y-1.5 max-w-md mx-auto">
                <div className="flex items-center gap-2 font-bold text-[#C86D2D]">
                  <MapPin size={14} />
                  <span>Atención Presencial Disponible</span>
                </div>
                <p className="text-stone-400 leading-relaxed">
                  Si prefieres no utilizar el canal digital, puedes acudir directamente a nuestra <strong className="text-stone-200">Sucursal Calama</strong> para recibir atención presencial.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRechazado(false)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C86D2D] hover:bg-[#B35D22] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Volver a revisar los términos</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Bloque "En pocas palabras" */}
              <div className="rounded-2xl bg-[#1E1E1E] border border-[#C86D2D]/25 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#C86D2D]">
                  <ShieldCheck size={15} />
                  <span>En pocas palabras</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-[13px] text-stone-200 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86D2D] shrink-0 mt-1.5" />
                    <span>
                      Usamos tus datos solo para fabricar y entregar tus lentes y gestionar tu convenio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86D2D] shrink-0 mt-1.5" />
                    <span>
                      Tus datos de salud y biométricos te los pedimos aparte, en el momento en que se necesitan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86D2D] shrink-0 mt-1.5" />
                    <span>
                      Puedes ejercer tus derechos sobre tus datos cuando quieras.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Acordeón 1: Términos y Condiciones */}
              <div
                className={`rounded-2xl bg-[#1E1E1E] border transition-colors overflow-hidden ${
                  acordeonAbierto === 'terminos'
                    ? 'border-[#C86D2D]/50'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleAcordeon('terminos')}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/5 text-[#C86D2D] shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">Términos y Condiciones</div>
                      <div className="text-xs text-stone-400 truncate">
                        Cómo funciona la plataforma y tus opciones aquí.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {modo === 'bloqueante' && (
                      terminoLeido ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} />
                          <span>✓ Leído</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          Pendiente de lectura
                        </span>
                      )
                    )}
                    <span className="text-stone-400">
                      {acordeonAbierto === 'terminos' ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </span>
                  </div>
                </button>

                {acordeonAbierto === 'terminos' && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-white/10">
                    <div
                      onScroll={handleScrollTerminos}
                      className="max-h-44 overflow-y-auto pr-2 pt-3 space-y-3 text-xs text-stone-300 leading-relaxed"
                    >
                      <p>
                        <strong className="text-white">1. Quién puede usar la plataforma: </strong>
                        Pueden usarla personas mayores de 18 años, trabajadores con convenio de empresa o sindicato, y clientes particulares de Óptica Amaru. Para acceder a un convenio verificamos que la persona figure vigente en el padrón oficial del sindicato o empresa.
                      </p>
                      <p>
                        <strong className="text-white">2. Qué es este portal: </strong>
                        Es un canal digital de la óptica para pedir, validar y seguir el estado de tus lentes o agendar evaluación visual. No reemplaza una consulta médica ni emite recetas.
                      </p>
                      <p>
                        <strong className="text-white">3. Receta óptica: </strong>
                        La receta debe tener una antigüedad máxima de 365 días. Si está vencida o no la tienes, la plataforma te ofrecerá agendar una evaluación visual en sucursal o faena. Eres responsable de que la receta y los documentos que subas sean reales y legibles.
                      </p>
                      <p>
                        <strong className="text-white">4. Convenios y descuentos por planilla: </strong>
                        Si un pedido pasa por un convenio sin autorización del titular del beneficio o con datos falsos, quedará bloqueado en la plataforma.
                      </p>
                      <p>
                        <strong className="text-white">5. Funcionamiento sin conexión: </strong>
                        La aplicación puede funcionar sin señal. La información queda guardada en tu dispositivo y se envía cuando recuperas la conexión.
                      </p>
                      <p>
                        <strong className="text-white">6. Cambios en estos términos: </strong>
                        Si actualizamos los términos te pediremos que los aceptes nuevamente antes de seguir usando la plataforma.
                      </p>
                      <p>
                        <strong className="text-white">7. Ley aplicable: </strong>
                        Estos términos se rigen por las leyes de Chile.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Acordeón 2: Política de Privacidad */}
              <div
                className={`rounded-2xl bg-[#1E1E1E] border transition-colors overflow-hidden ${
                  acordeonAbierto === 'privacidad'
                    ? 'border-[#C86D2D]/50'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleAcordeon('privacidad')}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/5 text-[#C86D2D] shrink-0">
                      <Lock size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">Política de Privacidad</div>
                      <div className="text-xs text-stone-400 truncate">
                        Qué datos usamos, por qué y cuáles son tus derechos.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {modo === 'bloqueante' && (
                      privacidadLeida ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} />
                          <span>✓ Leído</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          Pendiente de lectura
                        </span>
                      )
                    )}
                    <span className="text-stone-400">
                      {acordeonAbierto === 'privacidad' ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </span>
                  </div>
                </button>

                {acordeonAbierto === 'privacidad' && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-white/10">
                    <div
                      onScroll={handleScrollPrivacidad}
                      className="max-h-44 overflow-y-auto pr-2 pt-3 space-y-3 text-xs text-stone-300 leading-relaxed"
                    >
                      <p>
                        <strong className="text-white">1. Quién es el responsable: </strong>
                        Óptica Amaru (RUT 76.543.210-8) es responsable del tratamiento de tus datos. Puedes escribirnos a{' '}
                        <span className="text-[#C86D2D] font-semibold">privacidad@opticaamaru.cl</span>.
                      </p>
                      <div className="space-y-1.5">
                        <p>
                          <strong className="text-white">2. Qué datos tratamos:</strong>
                        </p>
                        <ul className="pl-4 space-y-1 list-disc marker:text-[#C86D2D]">
                          <li>
                            <strong className="text-stone-100">De identificación: </strong>
                            RUT, nombre, correo y teléfono.
                          </li>
                          <li>
                            <strong className="text-stone-100">De salud: </strong>
                            Receta óptica y parámetros oftalmológicos.
                          </li>
                          <li>
                            <strong className="text-stone-100">De imagen: </strong>
                            Fotografías de recetas, verificación documental y documentos de respaldo firmados.
                          </li>
                          <li>
                            <strong className="text-stone-100">De operación: </strong>
                            Sucursal, convenio y estado de cada venta.
                          </li>
                        </ul>
                      </div>
                      <p>
                        <strong className="text-white">3. Por qué los usamos: </strong>
                        Con tu consentimiento (Ley N° 21.719) tratamos datos de salud y validación documental. Por contrato con el paciente y el convenio fabricamos los lentes. Por obligación legal (MINSAL y SII) conservamos registros clínicos y tributarios.
                      </p>
                      <p>
                        <strong className="text-white">4. Quién puede ver tus datos: </strong>
                        Solo el personal autorizado de Óptica Amaru según su rol. Algunos proveedores de infraestructura procesan datos bajo contrato estricto de confidencialidad. Jamás vendemos ni cedemos tus datos a terceros.
                      </p>
                      <p>
                        <strong className="text-white">5. Decisiones automatizadas: </strong>
                        El sistema valida formato de RUT (Módulo 11), vigencia de receta y reglas de convenio. Si una solicitud queda retenida por seguridad, siempre puedes pedir revisión humana en sucursal.
                      </p>
                      <p>
                        <strong className="text-white">6. Cuánto tiempo los guardamos: </strong>
                        Mientras dure la atención y por los plazos legales exigidos por la normativa sanitaria y tributaria (hasta 6 años para registros clínicos/contables).
                      </p>
                      <p>
                        <strong className="text-white">7. Tus derechos (Ley N° 21.719): </strong>
                        Puedes solicitar acceso, rectificación, supresión, oposición, portabilidad y bloqueo de tus datos escribiendo a{' '}
                        <span className="text-[#C86D2D] font-semibold">privacidad@opticaamaru.cl</span>. También puedes reclamar ante la Agencia de Protección de Datos Personales.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox de aceptación obligatoria (solo en modo bloqueante) */}
              {modo === 'bloqueante' && (
                <div className="pt-1 space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                      ambosLeidos
                        ? 'bg-[#1E1E1E] border-[#C86D2D]/40 cursor-pointer hover:border-[#C86D2D]'
                        : 'bg-[#1A1A1A] border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkboxAceptado}
                      disabled={!ambosLeidos}
                      onChange={(e) => setCheckboxAceptado(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-600 bg-[#141414] accent-[#C86D2D] disabled:cursor-not-allowed cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-[13px] font-semibold text-stone-200 leading-snug">
                      He leído y acepto los Términos y Condiciones y la Política de Privacidad
                    </span>
                  </label>

                  {!ambosLeidos && (
                    <p className="text-[11px] text-amber-300/90 px-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="shrink-0 text-[#C86D2D]" />
                      <span>
                        Abre y desliza hasta el final de ambos documentos para habilitar la aceptación.
                      </span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer de Acciones */}
        {!(rechazado && modo === 'bloqueante') && (
          <div className="px-6 sm:px-7 py-4 border-t border-white/10 bg-[#1A1A1A] shrink-0">
            {modo === 'bloqueante' ? (
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRechazado(true)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 bg-transparent hover:bg-white/5 text-stone-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  No acepto
                </button>
                <button
                  type="button"
                  disabled={!ambosLeidos || !checkboxAceptado}
                  onClick={handleConfirmarAceptacion}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    ambosLeidos && checkboxAceptado
                      ? 'bg-[#C86D2D] hover:bg-[#B35D22] active:scale-[0.99] text-white shadow-lg shadow-[#C86D2D]/25 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={15} />
                  <span>Aceptar y continuar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onCerrar}
                className="w-full py-2.5 px-5 rounded-xl bg-[#C86D2D] hover:bg-[#B35D22] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentimientoModal;
