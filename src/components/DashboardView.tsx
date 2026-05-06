/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Target, CheckSquare, Zap, Activity, Users, 
  AlertTriangle, CreditCard, ChevronDown, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CardStatus, CardType } from '../types';

const COLORS = ['#1A1A1A', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DashboardView() {
  const { calculateResults, sprints, devs, cards, qa, extras, config } = useApp();
  const [filterSprint, setFilterSprint] = useState('latest');
  const [filterDev, setFilterDev] = useState('all');
  
  const results = useMemo(() => calculateResults(), [calculateResults]);

  const activeSprintId = useMemo(() => {
    if (filterSprint === 'latest' && sprints.length > 0) {
      return [...sprints].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].id;
    }
    return filterSprint;
  }, [filterSprint, sprints]);

  const activeSprint = useMemo(() => sprints.find(s => s.id === activeSprintId), [sprints, activeSprintId]);

  const sprintResults = useMemo(() => {
    let filtered = results.filter(r => r.sprintId === activeSprintId);
    if (filterDev !== 'all') {
      filtered = filtered.filter(r => r.devId === filterDev);
    }
    return filtered;
  }, [results, activeSprintId, filterDev]);

  const stats = useMemo(() => {
    const planned = sprintResults.reduce((acc, r) => acc + r.plannedPoints, 0);
    const delivered = sprintResults.reduce((acc, r) => acc + r.deliveredPoints, 0);
    const totalExtraPoints = sprintResults.reduce((acc, r) => acc + r.extras, 0);
    const totalFailures = sprintResults.reduce((acc, r) => acc + r.devFailures, 0);
    const completedCards = sprintResults.reduce((acc, r) => acc + r.completedCards, 0);
    const totalCards = sprintResults.reduce((acc, r) => acc + r.plannedCards, 0);
    const totalDiscounts = sprintResults.reduce((acc, r) => acc + r.discounts, 0);
    
    // Média de aproveitamento (qualityIndex) do set atual (filtrado ou geral)
    const avgQuality = sprintResults.length > 0
      ? sprintResults.reduce((acc, r) => acc + r.qualityIndex, 0) / sprintResults.length
      : 100;
    
    return {
      planned,
      delivered,
      extras: totalExtraPoints,
      failures: totalFailures,
      completedCards,
      totalCards,
      avgQuality,
      completionRate: planned > 0 ? (delivered / planned) * 100 : 0,
      openCards: totalCards - completedCards,
      finalTotal: delivered + totalExtraPoints - totalDiscounts
    };
  }, [sprintResults]);

  // Alert: Devs with low efficiency (below 75%)
  const alerts = useMemo(() => {
    // Only show alerts in "all devs" view or for the specific dev if specifically low
    const baseResults = results.filter(r => r.sprintId === activeSprintId);
    return baseResults
      .filter(r => r.qualityIndex < 75)
      .map(r => ({
        devName: devs.find(d => d.id === r.devId)?.name || '?',
        qualityLabel: r.qualityIndex.toFixed(1) + '%',
        failures: r.devFailures
      }));
  }, [results, activeSprintId, devs]);

  // Chart Data: Points by Dev
  const devPerformanceData = useMemo(() => {
    return sprintResults.map(r => {
      const dev = devs.find(d => d.id === r.devId);
      return {
        name: dev?.name || '?',
        planejado: r.plannedPoints,
        entregue: r.deliveredPoints,
        final: r.finalScore
      };
    });
  }, [sprintResults, devs]);

  // Chart Data: Card Status Distribution
  const statusData = useMemo(() => {
    const sprintCards = cards.filter(c => c.sprintId === activeSprintId);
    const counts: Record<string, number> = {};
    Object.values(CardStatus).forEach(s => counts[s] = 0);
    sprintCards.forEach(c => counts[c.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [cards, activeSprintId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visão Geral da Sprint</h2>
            {config.gasUrl && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Cloud Sync</span>
              </div>
            )}
          </div>
          {activeSprint && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sprint Selecionada:</span>
              <span className="text-xs font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded border border-blue-100">{activeSprint.name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="pl-3 pr-2 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Filter className="w-3 h-3" /> Sprint
            </div>
            <select 
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
              className="px-3 py-1 text-xs font-bold bg-transparent outline-none cursor-pointer pr-6 appearance-none text-slate-700"
            >
              <option value="latest">Última Sprint</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="pl-3 pr-2 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Users className="w-3 h-3" /> Dev
            </div>
            <select 
              value={filterDev}
              onChange={(e) => setFilterDev(e.target.value)}
              className="px-3 py-1 text-xs font-bold bg-transparent outline-none cursor-pointer pr-6 appearance-none text-slate-700"
            >
              <option value="all">Todos Devs</option>
              {devs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planejado</p>
          <p className="text-3xl font-black text-slate-900">{stats.planned}</p>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-full" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entregue</p>
          <p className="text-3xl font-black text-emerald-600">{stats.delivered}</p>
          <p className="text-[10px] text-slate-400">Bruto entregue</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">% Entrega</p>
          <p className="text-3xl font-black text-slate-900">{stats.completionRate.toFixed(1)}%</p>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(stats.completionRate, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 border-b-4 border-b-rose-400">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">% Aproveitamento</p>
          <p className={cn(
            "text-3xl font-black",
            stats.avgQuality >= 80 ? "text-emerald-600" : stats.avgQuality >= 60 ? "text-amber-500" : "text-rose-600"
          )}>{stats.avgQuality.toFixed(1)}%</p>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className={cn(
               "h-full transition-all duration-500",
               stats.avgQuality >= 80 ? "bg-emerald-500" : stats.avgQuality >= 60 ? "bg-amber-500" : "bg-rose-500"
             )} style={{ width: `${Math.min(stats.avgQuality, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score Final</p>
          <p className="text-3xl font-black text-blue-600 font-mono">{stats.finalTotal.toFixed(1)}</p>
          <p className="text-[10px] text-blue-400 italic">Com bônus e qualidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[460px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
             <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4" /> Performance por Desenvolvedor</h2>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total na Sprint</span>
          </div>
          <div className="flex-1 p-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devPerformanceData} barGap={6}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#94A3B8' }} />
                   <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                   />
                   <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                   <Bar name="Planejado" dataKey="planejado" fill="#CBD5E1" radius={[2, 2, 0, 0]} />
                   <Bar name="Entregue" dataKey="entregue" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                   <Bar name="Final" dataKey="final" fill="#0F172A" radius={[2, 2, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Small Widgets Panel */}
        <div className="space-y-6">
           {/* Status Distribution */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[280px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                 <h2 className="text-sm font-bold text-slate-800">Status dos Cards</h2>
              </div>
              <div className="flex-1 p-4 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={statusData}
                       innerRadius={50}
                       outerRadius={70}
                       paddingAngle={4}
                       dataKey="value"
                     >
                       {statusData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                    <span className="text-lg font-black text-slate-900">{stats.totalCards}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Cards</span>
                 </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 justify-center rounded-b-xl border-t border-slate-100">
                 {statusData.slice(0, 3).map((entry, index) => (
                   <div key={entry.name} className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                     <span className="text-[9px] font-bold text-slate-500 uppercase">{entry.name}</span>
                   </div>
                 ))}
                 {statusData.length > 3 && <span className="text-[9px] font-bold text-slate-400 uppercase">+{statusData.length - 3} Outros</span>}
              </div>
           </div>

            {/* Metrics Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
               <div className="flex items-center justify-between">
                 <h2 className="text-sm font-bold text-slate-800">Alertas críticos</h2>
                 <AlertTriangle className="w-4 h-4 text-rose-500" />
               </div>
               <div className="space-y-3">
                  {alerts.length > 0 ? (
                    alerts.map((alert, i) => (
                      <div key={i} className="bg-rose-50 border-l-4 border-rose-400 p-3">
                         <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">{alert.devName}</p>
                         <p className="text-xs text-rose-700 font-medium">Abaixo da média de aproveitamento: {alert.qualityLabel}</p>
                         <p className="text-[9px] text-rose-400 font-bold uppercase mt-1">{alert.failures} falhas registradas na sprint</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3">
                       <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Tudo em dia</p>
                       <p className="text-xs text-emerald-700 font-medium">Nenhum dev com aproveitamento abaixo de 75% nesta sprint.</p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                     <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Qualidade Geral</p>
                     <p className="text-xs text-blue-700 font-medium">{stats.failures} retornos totais detectados na visão atual.</p>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}
