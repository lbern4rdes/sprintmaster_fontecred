/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../store';
import { User, UserRole } from '../types';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  Shield, 
  MoreHorizontal,
  X,
  Check,
  Power
} from 'lucide-react';
import { cn } from '../lib/utils';

export function UsersView() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.COMMON,
    active: true
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, formData);
      setEditingId(null);
    } else {
      addUser(formData);
    }
    setIsAdding(false);
    setFormData({ name: '', email: '', password: '', role: UserRole.COMMON, active: true });
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      active: user.active
    });
    setEditingId(user.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Controle de acessos, privilégios e credenciais do time administrativo.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: UserRole.COMMON, active: true });
          }}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all text-xs"
        >
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-medium"
          />
        </div>
        <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900/10 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{editingId ? 'Editar' : 'Cadastrar'} Usuário</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">E-mail</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Senha</label>
              <input 
                required={!editingId}
                type="text" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={editingId ? 'Deixe vazio para manter' : ''}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Função / Privilégio</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none transition-all text-sm font-medium"
              >
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="user_active"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4 text-slate-900"
              />
              <label htmlFor="user_active" className="text-xs font-bold text-slate-700">Usuário Ativo</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-8 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs"
              >
                {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Acesso</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
                      user.role === UserRole.ADMIN ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {user.role === UserRole.ADMIN ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                       onClick={() => user.id !== 'admin_root' && updateUser(user.id, { active: !user.active })}
                       className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all",
                        user.active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}
                    >
                      <Power className="w-3 h-3" />
                      {user.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {user.id !== 'admin_root' && (
                         <button 
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                       <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                       >
                         <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
