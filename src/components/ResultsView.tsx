/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { useApp } from '../store';
import { RefreshCcw, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { CardStatus } from '../types';

export function ResultsView() {
  const { calculateResults, sprints, devs, cards, qa, extras } = useApp();
  const [results, setResults] = useState(() => calculateResults());
  const [filterSprint, setFilterSprint] = useState('all');

  const handleUpdate = () => {
    setResults(calculateResults());
  };

  const filteredResults = useMemo(() => {
    if (filterSprint === 'all') return results;
    return results.filter(r => r.sprintId === filterSprint);
  }, [results, filterSprint]);

  const validations = useMemo(() => {
    const list: string[] = [];
    cards.forEach(c => {
      if (!c.sprintId) list.push(`Card "${c.title}" está sem Sprint.`);
      if (!c.devId) list.push(`Card "${c.title}" está sem Dev Responsável.`);
      if (c.status === CardStatus.COMPLETED && !c.completionDate) list.push(`Card "${c.title}" foi concluído mas está sem data de conclusão.`);
      if (c.isProject && !c.projectPoints) list.push(`Card "${c.title}" é projeto mas está sem pontuação combinada.`);
    });
    qa.forEach(q => {
      if (!q.cardId) list.push(`Retorno de homologação sem ID de Card vinculado.`);
    });
    extras.forEach(e => {
      if (!e.devId) list.push(`Lançamento extra sem Dev Responsável.`);
    });
    return list;
  }, [cards, qa, extras]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Consolidado de Resultados</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Métricas de performance e qualidade consolidada por Sprint/Dev.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select 
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
              className="w-full md:w-48 pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg border border-slate-200 focus:border-slate-900 appearance-none bg-white font-bold text-slate-700 outline-none shadow-sm"
            >
              <option value="all">Todas Sprints</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <button 
            onClick={handleUpdate}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <RefreshCcw className="w-4 h-4" /> Calcular
          </button>
        </div>
      </div>

      {validations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Pendências de Dados ({validations.length})</span>
          </div>
          <ul className="text-[11px] text-amber-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 list-disc pl-5 font-medium">
            {validations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Sprint</th>
                <th className="px-6 py-4">Desenvolvedor</th>
                <th className="px-6 py-4 text-center">Planejado</th>
                <th className="px-6 py-4 text-center">Entregue</th>
                <th className="px-6 py-4 text-center">% Entrega</th>
                <th className="px-6 py-4 text-center text-rose-600">% Aproveitamento</th>
                <th className="px-6 py-4 text-center text-red-600">Penalidades</th>
                <th className="px-6 py-4 text-center border-l border-slate-100 font-bold">Score Sprint</th>
                <th className="px-6 py-4 text-center text-green-600">Bonificações</th>
                <th className="px-6 py-4 text-center font-black text-slate-900 bg-slate-100/50">Score Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredResults.map((row, i) => {
                const sprint = sprints.find(s => s.id === row.sprintId);
                const dev = devs.find(d => d.id === row.devId);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{sprint?.name || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{dev?.name || '-'}</td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-slate-400">{row.plannedPoints} pts <span className="text-[10px]">({row.plannedCards} c)</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{row.deliveredPoints} pts</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{row.completedCards} concl.</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                         <span className={cn(
                           "font-black text-[11px]",
                           row.completionPercent >= 100 ? "text-emerald-600" : 
                           row.completionPercent >= 80 ? "text-blue-600" :
                           "text-amber-600"
                         )}>
                           {row.completionPercent.toFixed(1)}%
                         </span>
                         <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full rounded-full transition-all duration-500",
                              row.completionPercent >= 100 ? "bg-emerald-500" : "bg-blue-500"
                            )} style={{ width: `${Math.min(row.completionPercent, 100)}%` }} />
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                         <span className={cn(
                           "font-black text-[11px]",
                           row.qualityIndex >= 90 ? "text-emerald-600" : 
                           row.qualityIndex >= 75 ? "text-amber-600" :
                           "text-rose-600"
                         )}>
                           {row.qualityIndex.toFixed(1)}%
                         </span>
                         <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full rounded-full transition-all duration-500",
                              row.qualityIndex >= 80 ? "bg-emerald-500" : "bg-rose-500"
                            )} style={{ width: `${row.qualityIndex}%` }} />
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-red-600 font-bold">-{row.discounts} pts</span>
                        <span className="text-[9px] text-red-300 font-bold uppercase">{row.devFailures} falhas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-l border-slate-50 bg-slate-50/30">
                      <span className="font-bold text-slate-900">{row.sprintScore.toFixed(1)} pts</span>
                    </td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-bold">+{row.extras} pts</td>
                    <td className="px-6 py-4 text-center bg-slate-50/50">
                      <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-md font-black text-sm shadow-sm">
                        {row.finalScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400 italic text-sm font-medium">
                     Nenhum dado consolidado disponível.<br/>
                     <span className="text-[10px] uppercase font-bold tracking-widest mt-2 block text-slate-300">Lance informações nas abas e clique em calcular resultados.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> % Entrega</div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Desempenho volumétrico: pontos entregues vs planejados.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider"><RefreshCcw className="w-3.5 h-3.5 text-rose-500" /> % Aproveitamento</div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Eficiência real: saldo de pontos após penalidades vs total bruto entregue.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Score Sprint</div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Resultado técnico da sprint: Pontos Entregues - Penalidades.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5 text-slate-900" /> Score Final</div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Resultado final consolidado: Score Sprint + Bônus Extras.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider"><Info className="w-3.5 h-3.5 text-slate-400" /> Penalidades</div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Descontos fixos aplicados em cards com 3 ou mais retornos.</p>
        </div>
      </div>
    </div>
  );
}
