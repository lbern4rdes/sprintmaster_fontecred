/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  PlusCircle, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RefreshCcw,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './store';
import { cn } from './lib/utils';

// Views
import { DashboardView } from './components/DashboardView';
import { SprintsView } from './components/SprintsView';
import { DevsView } from './components/DevsView';
import { CardsView } from './components/CardsView';
import { QAView } from './components/QAView';
import { ExtrasView } from './components/ExtrasView';
import { ResultsView } from './components/ResultsView';
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { LoginView } from './components/LoginView';
import { UserRole } from './types';

type Tab = 'dashboard' | 'sprints' | 'devs' | 'cards' | 'qa' | 'extras' | 'results' | 'users' | 'settings';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { calculateResults, currentUser, logout } = useApp();

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sprints', label: 'Sprints', icon: Calendar },
    { id: 'devs', label: 'Desenvolvedores', icon: Users },
    { id: 'cards', label: 'Cards & Demandas', icon: CreditCard },
    { id: 'qa', label: 'Homologação', icon: CheckCircle2 },
    { id: 'extras', label: 'Pontos Extras', icon: PlusCircle },
    { id: 'results', label: 'Resultados', icon: BarChart3 },
    { id: 'users', label: 'Usuários', icon: Users, hidden: !isAdmin },
    { id: 'settings', label: 'Configurações', icon: Settings, hidden: !isAdmin },
  ].filter(item => !item.hidden);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'sprints': return <SprintsView />;
      case 'devs': return <DevsView />;
      case 'cards': return <CardsView />;
      case 'qa': return <QAView />;
      case 'extras': return <ExtrasView />;
      case 'results': return <ResultsView />;
      case 'users': return <UsersView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col bg-slate-900 transition-all duration-300 relative z-50 shadow-xl"
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          {sidebarOpen && <span className="font-bold text-lg text-white tracking-tight">SprintMetrics</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm text-slate-400"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <div className="bg-slate-800/50 p-4 rounded-xl">
            {sidebarOpen && <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Ações Rápidas</div>}
            <button 
              onClick={() => { setActiveTab('results'); calculateResults(); }} 
              className="w-full text-left text-xs text-blue-400 py-1.5 hover:text-blue-300 flex items-center gap-2"
            >
              <RefreshCcw className="w-3 h-3" /> {sidebarOpen && "Atualizar Resultados"}
            </button>
          </div>

          <button 
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogIn className="w-4 h-4 rotate-180" />
            {sidebarOpen && <span className="font-bold text-[10px] uppercase tracking-widest">Sair do Sistema</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
             <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="font-bold text-white">SprintMetrics</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 z-[60]"
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-slate-900 z-[70] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-lg text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}><X className="text-white" /></button>
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-xl",
                    activeTab === item.id ? "bg-slate-800 text-white" : "text-slate-400"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3 text-rose-400"
                >
                  <LogIn className="w-5 h-5 rotate-180" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold text-slate-800 capitalize tracking-tight ring-slate-900">{activeTab === 'users' ? 'Gestão de Usuários' : activeTab === 'dashboard' ? 'Dashboard' : activeTab}</h1>
             <div className="h-4 w-[1px] bg-slate-200" />
             <div className="flex items-center bg-slate-100 px-3 py-1 rounded border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase mr-2 tracking-wider">Perfil:</span>
                <span className="text-xs text-slate-900 font-black uppercase tracking-tighter">{currentUser?.role}</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{currentUser?.role}</p>
              <p className="text-xs font-semibold text-slate-900">{currentUser?.name}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-lg overflow-hidden">
               {currentUser?.role === UserRole.ADMIN ? <ShieldCheck className="w-5 h-5 text-blue-400" /> : <Users className="w-5 h-5 text-slate-400" />}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const { currentUser } = useApp();
  
  if (!currentUser) return <LoginView />;
  
  return <MainLayout />;
}

