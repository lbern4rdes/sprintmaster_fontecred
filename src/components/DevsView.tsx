/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function DevsView() {
  const { devs, addDev, updateDev, deleteDev, currentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Administrador';

  const [formData, setFormData] = useState({
    name: '',
    active: true,
    observations: ''
  });

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.name) return;
    if (editingId) {
      updateDev(editingId, formData);
      setEditingId(null);
    } else {
      addDev(formData);
    }
    setFormData({ name: '', active: true, observations: '' });
    setIsAdding(false);
  };

  const startEdit = (dev: any) => {
    if (!isAdmin) return;
    setFormData({ name: dev.name, active: dev.active, observations: dev.observations });
    setEditingId(dev.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Operadores</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Configuração de membros da equipe técnica e disponibilidade.</p>
        </div>
        {!isAdding && isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Integrante
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">{editingId ? 'Editar Perfil' : 'Novo Perfil de Operador'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 outline-none font-medium text-slate-700 transition-colors"
                placeholder="Ex: Alexander Hamilton"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disponibilidade</label>
              <select 
                value={formData.active ? 'Sim' : 'Não'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'Sim' })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-800 transition-colors"
              >
                <option value="Sim">Ativo na Grade</option>
                <option value="Não">Inativo / Licença</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notas de Qualificação</label>
              <textarea 
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-4 py-3 text-sm rounded-lg border border-slate-200 focus:border-slate-900 outline-none min-h-[100px] font-medium text-slate-700 transition-colors"
                placeholder="Senioridade, stack principal, observações de RH..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', active: true, observations: '' });
              }}
              className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Salvar Cadastro
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Sinalizador</th>
                <th className="px-6 py-4">Nome do Operador</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Qualificações</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {devs.map((dev) => (
                <tr key={dev.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-black text-slate-300 font-mono tracking-tighter uppercase whitespace-nowrap">ID: {dev.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm whitespace-nowrap">{dev.name}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm border",
                      dev.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {dev.active ? 'Operacional' : 'Indisponível'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium truncate max-w-[250px]">{dev.observations || '-'}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 px-2">
                        <button 
                          onClick={() => startEdit(dev)}
                          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteDev(dev.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {devs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic text-sm font-medium">
                    Nenhum integrante cadastrado na equipe.
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
