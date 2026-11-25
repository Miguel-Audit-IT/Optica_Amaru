import React from 'react';
import { ShieldCheck, Sparkles, Wrench, Eye } from 'lucide-react';

interface PoliticasGarantiaBoxProps {
  compact?: boolean;
}

export const PoliticasGarantiaBox: React.FC<PoliticasGarantiaBoxProps> = ({ compact = false }) => {
  return (
    <div
      className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-950/20 ${
        compact ? 'p-3.5 space-y-2' : 'p-4 space-y-3'
      } text-left`}
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Políticas de Garantía Óptica Amaru · Sucursal Calama</span>
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
          Respaldo Oficial
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] leading-relaxed">
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-500/15 space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>1. Fallo de Cristal</span>
          </div>
          <p className="text-slate-600 dark:text-zinc-300 text-[10.5px]">
            Cobertura total ante defectos de fabricación, fallas en capas antirreflejo o tratamientos de filtro (UV, Luz Azul o Luz Amarilla).
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-500/15 space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wrench size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>2. Marco Roto</span>
          </div>
          <p className="text-slate-600 dark:text-zinc-300 text-[10.5px]">
            Evaluación técnica presencial en Sucursal Calama con cobertura o reposición preferencial por rotura estructural o falla de bisagra.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-500/15 space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Eye size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <span>3. Equivocación de Especificación</span>
          </div>
          <p className="text-slate-600 dark:text-zinc-300 text-[10.5px]">
            Revisión óptica gratuita y reposición o ajuste de cristales sin costo ante error de graduación, distancia pupilar o especificación técnica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticasGarantiaBox;
