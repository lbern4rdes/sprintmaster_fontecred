/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../store';
import { LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginView() {
  const { login, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSyncing = users.length <= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Simulate slight delay
    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError(true);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.15),rgba(2,6,23,1))]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-2">
             <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fontecred Dashboard</h1>
          <p className="text-slate-400 text-sm font-medium">Insira suas credenciais para acessar o painel administrativo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">E-mail Corporativo</label>
            <input 
              required
              type="email" 
              placeholder="insira seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Senha de Acesso</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          {isSyncing && !error && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sincronizando base de usuários...</p>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-[11px] text-rose-400 font-bold uppercase tracking-tighter">Credenciais inválidas ou usuário inativo.</p>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Acessar Dashboard <LogIn className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Acesso restrito • v1.0.4</p>
        </div>
      </motion.div>
    </div>
  );
}
