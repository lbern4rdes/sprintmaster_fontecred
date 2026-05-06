/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Edit2, Check, Search, AlertCircle, Filter, Calendar, User, Layers, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReturnType } from '../types';

export function QAView() {
  const { qa, cards, sprints, devs, addQA, updateQA, deleteQA, currentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Administrador';

  // Filters State
  const [filterDev, setFilterDev] = useState('all');
  const [filterSprint, setFilterSprint] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    cardId: '',
    date: new Date().toISOString().split('T')[0],
    type: ReturnType.DEV_FAILURE,
    description: '',
    observations: ''
  });

  const selectedPerformance = cards.find(c => c.id === formData.cardId);
  const selectedSprint = sprints.find(s => s.id === selectedPerformance?.sprintId);
  const selectedDev = devs.find(d => d.id === selectedPerformance?.devId);

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.cardId || !formData.date) return;
    if (editingId) {
      updateQA(editingId, formData);
      setEditingId(null);
    } else {
      addQA(formData);
    }
    setFormData({ 
      cardId: '', 
      date: new Date().toISOString().split('T')[0], 
      type: ReturnType.DEV_FAILURE, 
      description: '', 
      observations: '' 
    });
    setIsAdding(false);
  };

  const startEdit = (item: any) => {
    if (!isAdmin) return;
    setFormData({ ...item });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const filteredQA = qa.filter(item => {
    const card = cards.find(c => c.id === item.cardId);
    
    const matchesDev = filterDev === 'all' || card?.devId === filterDev;
    const matchesSprint = filterSprint === 'all' || card?.sprintId === filterSprint;
    const matchesDate = !filterDate || item.date === filterDate;
    const matchesSearch = !searchTerm || 
      card?.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card?.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDev && matchesSprint && matchesDate && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Controle de Homologação</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Registro e rastreamento de retornos por qualidade (QA).</p>
        </div>
        {!isAdding && isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Registrar Retorno
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por card ou descrição..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filterDev}
              onChange={(e) => setFilterDev(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 appearance-none bg-white font-bold text-slate-700 outline-none"
            >
              <option value="all">Todos Devs</option>
              {devs.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 appearance-none bg-white font-bold text-slate-700 outline-none"
            >
              <option value="all">Todas Sprints</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 bg-white font-medium text-slate-700 outline-none"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">{editingId ? 'Editar Apontamento' : 'Novo Apontamento'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID da Demanda (Card)</label>
              <select 
                value={formData.cardId}
                onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800"
              >
                <option value="">Selecionar Card</option>
                {cards.map(c => <option key={c.id} value={c.id}>#{c.id.slice(0,6)} - {c.title}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data da Ocorrência</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-medium text-slate-600" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Retorno</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ReturnType })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800"
              >
                {Object.values(ReturnType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Info Cards */}
            <div className="p-3 bg-slate-50 rounded-lg flex flex-col justify-center border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável</span>
               <span className="font-bold text-xs text-slate-700">{selectedDev?.name || '-'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex flex-col justify-center border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sprint</span>
               <span className="font-bold text-xs text-slate-700">{selectedSprint?.name || '-'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex flex-col justify-center border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Financeiro</span>
               <span className={cn(
                 "font-black text-[10px] px-2 py-0.5 rounded w-fit uppercase tracking-tighter shadow-sm",
                 formData.type === ReturnType.DEV_FAILURE ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"
               )}>
                 {formData.type === ReturnType.DEV_FAILURE ? 'Gera Desconto' : 'Neutro'}
               </span>
            </div>

            <div className="md:col-span-3 space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição Técnica</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-slate-900 outline-none min-h-[100px] font-medium text-slate-700 transition-colors"
                placeholder="Detalhes sobre a falha ou ajuste necessário..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ cardId: '', date: new Date().toISOString().split('T')[0], type: ReturnType.DEV_FAILURE, description: '', observations: '' });
              }}
              className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Finalizar Registro
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Data Ocorrência</th>
                <th className="px-6 py-4">Demanda Associada</th>
                <th className="px-6 py-4">Tipo de Retorno</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4 text-center">Impacto</th>
                {isAdmin && <th className="px-6 py-4 text-right">Controles</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQA.map((item) => {
                const card = cards.find(c => c.id === item.cardId);
                const dev = devs.find(d => d.id === card?.devId);
                return (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-400 font-mono">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 truncate max-w-[280px] text-sm">{card?.title || 'Card removido'}</div>
                      <div className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">ID: {item.cardId.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-600 uppercase tracking-tighter">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{dev?.name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {item.type === ReturnType.DEV_FAILURE ? (
                        <div className="bg-red-50 text-red-600 p-1.5 rounded-full w-fit mx-auto border border-red-100">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-slate-200 text-[10px] font-black uppercase">Neutro</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 px-2">
                          <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(confirm('Remover registro de retorno?')) deleteQA(item.id) }} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredQA.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic text-sm font-medium">
                    Nenhum retorno de homologação encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
