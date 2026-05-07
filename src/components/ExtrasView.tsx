/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Edit2, Check, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { ExtraType } from '../types';

export function ExtrasView() {
  const { extras, sprints, devs, cards, config, addExtra, updateExtra, deleteExtra, currentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Administrador';

  const [formData, setFormData] = useState({
    sprintId: '',
    devId: '',
    cardId: '',
    type: ExtraType.HOTFIX,
    description: '',
    points: 1,
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });

  // Auto-fill points
  useEffect(() => {
    switch (formData.type) {
      case ExtraType.HOTFIX: setFormData(f => ({ ...f, points: config.pointsHotfix })); break;
      case ExtraType.QUEUE_JUMP: setFormData(f => ({ ...f, points: config.pointsQueueJump })); break;
      case ExtraType.REQ_FAILURE: setFormData(f => ({ ...f, points: config.pointsReqFailure })); break;
      case ExtraType.EARLY_BONUS: setFormData(f => ({ ...f, points: config.bonusEarly })); break;
      default: break;
    }
  }, [formData.type, config]);

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.sprintId || !formData.devId) return;
    if (editingId) {
      updateExtra(editingId, formData as any);
      setEditingId(null);
    } else {
      addExtra(formData as any);
    }
    setFormData({ 
      sprintId: '', devId: '', cardId: '', type: ExtraType.HOTFIX, 
      description: '', points: 1, date: new Date().toISOString().split('T')[0], observations: '' 
    });
    setIsAdding(false);
  };

  const startEdit = (e: any) => {
    if (!isAdmin) return;
    setFormData({ ...e });
    setEditingId(e.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bonificações & Extras</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Registro de atuações fora do fluxo padrão e bônus de performance.</p>
        </div>
        {!isAdding && isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">{editingId ? 'Editar Extra' : 'Lançar Ponto Extra'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sprint Vinculada</label>
              <select value={formData.sprintId} onChange={(e) => setFormData({ ...formData, sprintId: e.target.value })} className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800">
                <option value="">Selecionar...</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Desenvolvedor</label>
              <select value={formData.devId} onChange={(e) => setFormData({ ...formData, devId: e.target.value })} className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800">
                <option value="">Selecionar Dev</option>
                {devs.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ExtraType })} className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800">
                {Object.values(ExtraType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pontuação</label>
              <input 
                type="number" 
                disabled={formData.type !== ExtraType.OTHER}
                value={formData.points} 
                onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })} 
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none text-center font-black",
                  formData.type !== ExtraType.OTHER ? "bg-slate-50 text-slate-400" : "bg-white text-slate-900 border-slate-900"
                )} 
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Demanda Relacionada (Opcional)</label>
              <select value={formData.cardId} onChange={(e) => setFormData({ ...formData, cardId: e.target.value })} className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-medium text-slate-700">
                <option value="">Não vinculado a card específico</option>
                {cards.filter(c => c.sprintId === formData.sprintId || !formData.sprintId).map(c => <option key={c.id} value={c.id}>#{c.id.slice(0,6)} - {c.title}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Lançamento</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-medium text-slate-600" />
            </div>

            <div className="md:col-span-4 space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Justificativa / Comentários</label>
              <input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                className="w-full px-4 py-3 text-sm rounded-lg border border-slate-200 outline-none font-medium text-slate-700 focus:border-slate-900 transition-colors" 
                placeholder="Ex: Resolução de bug crítico em produção após horário comercial..." 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); }} 
              className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Descartar
            </button>
            <button 
              onClick={handleSave} 
              className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Salvar Extra
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extras.map((extra) => {
          const sprint = sprints.find(s => s.id === extra.sprintId);
          const dev = devs.find(d => d.id === extra.devId);
          return (
            <div key={extra.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all group flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500 shadow-sm">
                  <Star className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 leading-none">+{extra.points}</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pontos</span>
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-1">{extra.type}</h4>
                <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">{extra.description || 'Nenhum comentário adicional registrado para este bônus.'}</p>
              </div>

              <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-50 relative z-10">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{dev?.name}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sprint?.name} • {new Date(extra.date).toLocaleDateString()}</div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(extra)} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteExtra(extra.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute right-0 bottom-0 opacity-[0.02] transform translate-x-1/4 translate-y-1/4 pointer-events-none transition-transform group-hover:scale-110">
                <Star className="w-24 h-24" fill="currentColor" />
              </div>
            </div>
          );
        })}
        {extras.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
             <Star className="w-10 h-10 mx-auto mb-4 text-slate-200" />
             <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Nenhuma bonificação registrada no momento</p>
          </div>
        )}
      </div>
    </div>
  );
}
