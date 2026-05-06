/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Edit2, Check, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { SprintStatus } from '../types';

export function SprintsView() {
  const { sprints, addSprint, updateSprint, deleteSprint, currentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Administrador';

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: SprintStatus.PLANNED,
    observations: ''
  });

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.name || !formData.startDate || !formData.endDate) return;
    if (editingId) {
      updateSprint(editingId, formData);
      setEditingId(null);
    } else {
      addSprint(formData);
    }
    setFormData({ name: '', startDate: '', endDate: '', status: SprintStatus.PLANNED, observations: '' });
    setIsAdding(false);
  };

  const startEdit = (sprint: any) => {
    if (!isAdmin) return;
    setFormData({ 
      name: sprint.name, 
      startDate: sprint.startDate, 
      endDate: sprint.endDate, 
      status: sprint.status, 
      observations: sprint.observations 
    });
    setEditingId(sprint.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cronograma de Sprints</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Planejamento e gestão de ciclos temporais de desenvolvimento.</p>
        </div>
        {!isAdding && isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Sprint
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">{editingId ? 'Editar Planejamento' : 'Novo Ciclo de Sprint'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Identificador</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium text-slate-700"
                placeholder="Ex: Ciclo 01 - Janeiro"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Inicial</label>
              <input 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Final</label>
              <input 
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none text-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status do Ciclo</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SprintStatus })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800"
              >
                {Object.values(SprintStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações Estratégicas</label>
              <input 
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium text-slate-700"
                placeholder="Foco em core-business, ajustes de estabilidade..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', startDate: '', endDate: '', status: SprintStatus.PLANNED, observations: '' });
              }}
              className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Descartar
            </button>
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Confirmar Planejamento
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.map((sprint) => (
          <div key={sprint.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all flex flex-col gap-4 relative group overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 text-base leading-tight tracking-tight">{sprint.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm",
                sprint.status === SprintStatus.ACTIVE ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                sprint.status === SprintStatus.FINISHED ? "bg-slate-900 text-white border-slate-900" :
                "bg-slate-50 text-slate-400 border-slate-200"
              )}>
                {sprint.status}
              </span>
            </div>
            
            {sprint.observations && (
              <p className="text-xs text-slate-500 font-medium line-clamp-2 italic leading-relaxed border-l-2 border-slate-100 pl-3 py-1">
                {sprint.observations}
              </p>
            )}

            <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-50">
               <div className="text-[9px] font-black text-slate-300 font-mono tracking-tighter uppercase">Ref: {sprint.id.slice(0, 8)}</div>
               {isAdmin && (
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => startEdit(sprint)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => { if(confirm('Remover esta sprint e seus históricos?')) deleteSprint(sprint.id) }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               )}
            </div>
          </div>
        ))}

        {sprints.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-10 h-10 mx-auto mb-4 text-slate-200" />
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest tracking-widest">Nenhuma sprint planejada na cronologia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
