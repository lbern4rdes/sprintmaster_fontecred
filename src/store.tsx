/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  Sprint, Dev, Card, QA, Extra, Config,
  Complexity, CardType, ReturnType, ExtraType,
  CardStatus, ResultRow, User, UserRole
} from './types';
import { DEFAULT_CONFIG } from './constants';

interface AppState {
  config: Config;
  sprints: Sprint[];
  devs: Dev[];
  cards: Card[];
  qa: QA[];
  extras: Extra[];
  users: User[];
}

interface AppContextType extends AppState {
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  setConfig: (config: Config) => void;
  setSprints: (sprints: Sprint[]) => void;
  setDevs: (devs: Dev[]) => void;
  setCards: (cards: Card[]) => void;
  setQA: (qa: QA[]) => void;
  setExtras: (extras: Extra[]) => void;
  setUsers: (users: User[]) => void;

  // Helpers
  addSprint: (sprint: Omit<Sprint, 'id'>) => void;
  addDev: (dev: Omit<Dev, 'id'>) => void;
  addCard: (card: Omit<Card, 'id'>) => void;
  addQA: (qa: Omit<QA, 'id'>) => void;
  addExtra: (extra: Omit<Extra, 'id'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;

  updateSprint: (id: string, sprint: Partial<Sprint>) => void;
  updateDev: (id: string, dev: Partial<Dev>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  updateQA: (id: string, qa: Partial<QA>) => void;
  updateExtra: (id: string, extra: Partial<Extra>) => void;
  updateUser: (id: string, user: Partial<User>) => void;

  deleteSprint: (id: string) => void;
  deleteDev: (id: string) => void;
  deleteCard: (id: string) => void;
  deleteQA: (id: string) => void;
  deleteExtra: (id: string) => void;
  deleteUser: (id: string) => void;

  calculateResults: () => ResultRow[];
  isInitialPulling: boolean;
}

const DEFAULT_ADMIN: User = {
  id: 'admin_root',
  name: 'Administrador Fontecred',
  email: 'admin@fontecred.com.br',
  password: '12345678',
  role: UserRole.ADMIN,
  active: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sprint_master_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [state, setState] = useState<AppState>(() => {
    const savedData = localStorage.getItem('sprint_master_data');
    const savedConfig = localStorage.getItem('sprint_master_config');

    let initialState: AppState = {
      config: DEFAULT_CONFIG,
      sprints: [],
      devs: [],
      cards: [],
      qa: [],
      extras: [],
      users: [DEFAULT_ADMIN]
    };

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        initialState = { ...initialState, ...data };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }

    // Always prioritize the saved config (and URL)
    if (savedConfig) {
      try {
        initialState.config = JSON.parse(savedConfig);
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }

    // Se a URL estiver vazia e tivermos uma padrão no código, usa a padrão
    if (DEFAULT_CONFIG.gasUrl && (!initialState.config.gasUrl || initialState.config.gasUrl === '')) {
      initialState.config.gasUrl = DEFAULT_CONFIG.gasUrl;
    }

    // Migration/Safety checks
    if (initialState.cards) {
      initialState.cards = initialState.cards.map((c: any, index: number) => ({
        ...c,
        code: c.code || `CRD-${(index + 1).toString().padStart(3, '0')}`,
        comments: c.comments || []
      }));
    }
    if (!initialState.users) initialState.users = [];
    if (!initialState.users.some((u: User) => u.id === DEFAULT_ADMIN.id)) {
      initialState.users = [DEFAULT_ADMIN, ...initialState.users];
    }

    return initialState;
  });

  const lastLocalUpdate = useRef<number>(0);
  const recentlyDeletedIds = useRef<Set<string>>(new Set());
  const dirtyItems = useRef<Map<string, any>>(new Map()); // Guarda itens novos/editados
  const isInitialMount = useRef<boolean>(true);
  const initialPullAttempted = useRef<boolean>(false);
  const isFromPull = useRef<boolean>(false);
  const pushTimeout = useRef<any>(null);
  const [isInitialPulling, setIsInitialPulling] = useState(true);

  // Helper para marcar uma atualização local IMEDIATAMENTE
  const markLocalUpdate = (id?: string, fullItem?: any) => {
    lastLocalUpdate.current = Date.now();
    
    if (id && fullItem) {
      // É uma criação ou edição
      dirtyItems.current.set(id, fullItem);
      // Remove do estado "dirty" após 60 segundos (tempo de sobra para o GAS)
      setTimeout(() => dirtyItems.current.delete(id), 60000);
    } else if (id) {
      // É uma exclusão
      recentlyDeletedIds.current.add(id);
      setTimeout(() => recentlyDeletedIds.current.delete(id), 60000);
    }
  };

  useEffect(() => {
    // 1. Sempre salva no localStorage como backup ultrarápido
    localStorage.setItem('sprint_master_config', JSON.stringify(state.config));
    localStorage.setItem('sprint_master_data', JSON.stringify(state));

    const hasGasUrl = state.config.gasUrl && state.config.gasUrl.startsWith('http');

    // 2. Sincronização DEBOUNCED para o GAS (Evita travar a UI)
    if (hasGasUrl && !isInitialMount.current && !isFromPull.current) {
      if (pushTimeout.current) clearTimeout(pushTimeout.current);
      
      pushTimeout.current = setTimeout(async () => {
        try {
          await fetch(state.config.gasUrl!, {
            method: 'POST',
            body: JSON.stringify(state),
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          console.error('GAS Sync Failed', e);
        }
      }, 300); // Debounce baixíssimo (0.3s) para ser quase instantâneo na nuvem
    }

    if (isFromPull.current) {
      isFromPull.current = false;
    }
    
    isInitialMount.current = false;
  }, [state]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sprint_master_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sprint_master_session');
    }
  }, [currentUser]);

  // Initial pull and periodic polling from GAS
  useEffect(() => {
    async function pullData() {
      const now = Date.now();
      
      // BLOQUEIO: Se houve alteração local nos últimos 15 segundos, 
      // somos extremamente criteriosos com o pull.
      if (initialPullAttempted.current && (now - lastLocalUpdate.current < 15000)) {
        // Não paramos o pull, mas vamos processar com cuidado abaixo
      }

      if (state.config.gasUrl && state.config.gasUrl.startsWith('http')) {
        try {
          const res = await fetch(state.config.gasUrl);
          const data = await res.json();
          initialPullAttempted.current = true;

          if (data && typeof data === 'object') {
            const currentState = stateRef.current;
            
            // 1. FILTRO DE FANTASMAS (Exclusões)
            const filterGhosts = (list: any[]) => list?.filter(item => !recentlyDeletedIds.current.has(item.id)) || [];
            data.cards = filterGhosts(data.cards);
            data.devs = filterGhosts(data.devs);
            data.sprints = filterGhosts(data.sprints);
            data.users = filterGhosts(data.users);
            data.qa = filterGhosts(data.qa);
            data.extras = filterGhosts(data.extras);

            // 2. FORÇAR ITENS SUJOS (Criações/Edições que ainda não chegaram na nuvem)
            const mergeDirty = (remoteList: any[], type: string) => {
              const merged = [...remoteList];
              dirtyItems.current.forEach((item, id) => {
                // Se o item é do tipo correto e não está na lista remota, forçamos ele
                const isCorrectType = 
                  (type === 'cards' && item.title !== undefined) ||
                  (type === 'devs' && item.name !== undefined && item.role === undefined) ||
                  (type === 'users' && item.email !== undefined) ||
                  (type === 'sprints' && item.startDate !== undefined);

                if (isCorrectType && !merged.some(m => m.id === id)) {
                  merged.push(item);
                }
              });
              return merged;
            };

            data.cards = mergeDirty(data.cards, 'cards');
            data.devs = mergeDirty(data.devs, 'devs');
            data.users = mergeDirty(data.users, 'users');
            data.sprints = mergeDirty(data.sprints, 'sprints');

            const remoteUsers = data.users || [];
            const hasAdmin = remoteUsers.some((u: User) => u.id === DEFAULT_ADMIN.id);
            
            const updatedData = {
              ...currentState,
              ...data,
              users: hasAdmin ? remoteUsers : [DEFAULT_ADMIN, ...remoteUsers]
            };

            // Só atualiza se realmente houver diferença após a mesclagem
            if (JSON.stringify(updatedData) !== JSON.stringify(currentState)) {
              isFromPull.current = true;
              setState(updatedData);
            }
          }
          setIsInitialPulling(false);
        } catch (e) {
          console.error('GAS Pull Failed', e);
          initialPullAttempted.current = true;
          setIsInitialPulling(false);
        }
      }
    }

    // Dispara ao montar
    pullData(); 

    // Dispara ao voltar para a aba (foco)
    window.addEventListener('focus', pullData);

    // Polling contínuo
    const pollInterval = setInterval(pullData, 3000); 
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', pullData);
    };
  }, [state.config.gasUrl]); 


  const login = (email: string, password: string) => {
    const cleanedEmail = email.trim().toLowerCase();
    const user = state.users.find(u => 
      u.email.trim().toLowerCase() === cleanedEmail && 
      u.password === password && 
      u.active
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const setConfig = (config: Config) => { markLocalUpdate(); setState(s => ({ ...s, config })); };
  const setSprints = (sprints: Sprint[]) => { markLocalUpdate(); setState(s => ({ ...s, sprints })); };
  const setDevs = (devs: Dev[]) => { markLocalUpdate(); setState(s => ({ ...s, devs })); };
  const setCards = (cards: Card[]) => { markLocalUpdate(); setState(s => ({ ...s, cards })); };
  const setQA = (qa: QA[]) => { markLocalUpdate(); setState(s => ({ ...s, qa })); };
  const setExtras = (extras: Extra[]) => { markLocalUpdate(); setState(s => ({ ...s, extras })); };
  const setUsers = (users: User[]) => { markLocalUpdate(); setState(s => ({ ...s, users })); };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addSprint = (sprint: Omit<Sprint, 'id'>) => {
    const newSprint = { ...sprint, id: generateId() };
    markLocalUpdate(newSprint.id, newSprint);
    setState(s => ({ ...s, sprints: [...s.sprints, newSprint] }));
  };
  const addDev = (dev: Omit<Dev, 'id'>) => {
    const newDev = { ...dev, id: generateId() };
    markLocalUpdate(newDev.id, newDev);
    setState(s => ({ ...s, devs: [...s.devs, newDev] }));
  };
  const addCard = (card: Omit<Card, 'id'>) => {
    const defaultCode = `CRD-${(state.cards.length + 1).toString().padStart(3, '0')}`;
    const id = generateId();
    const newCard = {
      ...card,
      id,
      code: card.code || defaultCode,
      tags: card.tags || [],
      comments: card.comments || []
    };

    // Safety check: ensure unique code
    let finalCode = newCard.code;
    let counter = 1;
    while (state.cards.some(c => c.code === finalCode)) {
      finalCode = `${newCard.code}-${counter}`;
      counter++;
    }
    newCard.code = finalCode;

    markLocalUpdate(id, newCard);
    setState(s => ({
      ...s,
      cards: [...s.cards, newCard]
    }));
  };
  const addQA = (qa: Omit<QA, 'id'>) => {
    markLocalUpdate();
    const id = generateId();
    const newQA = { ...qa, id };

    // Find card to check current failure count
    const card = state.cards.find(c => c.id === qa.cardId);
    const cardFailures = state.qa.filter(q => q.cardId === qa.cardId && q.type === ReturnType.DEV_FAILURE).length;
    const newFailureCount = qa.type === ReturnType.DEV_FAILURE ? cardFailures + 1 : cardFailures;

    let discount = 0;
    if (qa.type === ReturnType.DEV_FAILURE) {
      if (newFailureCount === 3) discount = Math.abs(state.config.discount3Returns);
      else if (newFailureCount > 3) discount = Math.abs(state.config.discountAbove3Returns);
    }

    const commentRecord = {
      id: generateId(),
      text: `🚩 RETORNO QA: ${qa.type}. Descrição: ${qa.description}. Impacto: ${discount > 0 ? `Descontou ${discount} pts` : 'Sem desconto'} (Total: ${newFailureCount}x)`,
      date: new Date().toISOString(),
      isSystem: true
    };

    setState(s => ({
      ...s,
      qa: [...s.qa, newQA],
      cards: s.cards.map(c => c.id === qa.cardId ? {
        ...c,
        comments: [...(c.comments || []), commentRecord],
        status: CardStatus.RETURNED
      } : c)
    }));
  };
  const addExtra = (extra: Omit<Extra, 'id'>) => { markLocalUpdate(); setState(s => ({ ...s, extras: [...s.extras, { ...extra, id: generateId() }] })); };
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: generateId() };
    markLocalUpdate(newUser.id, newUser);
    setState(s => ({ ...s, users: [...s.users, newUser] }));
  };

  const updateSprint = (id: string, sprint: Partial<Sprint>) => {
    setState(s => {
      const updated = s.sprints.map(x => x.id === id ? { ...x, ...sprint } : x);
      const item = updated.find(x => x.id === id);
      markLocalUpdate(id, item);
      return { ...s, sprints: updated };
    });
  };
  const updateDev = (id: string, dev: Partial<Dev>) => {
    setState(s => {
      const updated = s.devs.map(x => x.id === id ? { ...x, ...dev } : x);
      const item = updated.find(x => x.id === id);
      markLocalUpdate(id, item);
      return { ...s, devs: updated };
    });
  };
  const updateCard = (id: string, card: Partial<Card>) => {
    setState(s => {
      const updated = s.cards.map(x => x.id === id ? { ...x, ...card } : x);
      const item = updated.find(x => x.id === id);
      markLocalUpdate(id, item);
      return { ...s, cards: updated };
    });
  };
  const updateQA = (id: string, qa: Partial<QA>) => { markLocalUpdate(); setState(s => ({ ...s, qa: s.qa.map(x => x.id === id ? { ...x, ...qa } : x) })); };
  const updateExtra = (id: string, extra: Partial<Extra>) => { markLocalUpdate(); setState(s => ({ ...s, extras: s.extras.map(x => x.id === id ? { ...x, ...extra } : x) })); };
  const updateUser = (id: string, user: Partial<User>) => {
    setState(s => {
      const updated = s.users.map(x => x.id === id ? { ...x, ...user } : x);
      const item = updated.find(x => x.id === id);
      markLocalUpdate(id, item);
      return { ...s, users: updated };
    });
  };

  const deleteSprint = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, sprints: s.sprints.filter(x => x.id !== id) })); };
  const deleteDev = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, devs: s.devs.filter(x => x.id !== id) })); };
  const deleteCard = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, cards: s.cards.filter(x => x.id !== id) })); };
  const deleteQA = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, qa: s.qa.filter(x => x.id !== id) })); };
  const deleteExtra = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, extras: s.extras.filter(x => x.id !== id) })); };
  const deleteUser = (id: string) => { markLocalUpdate(id); setState(s => ({ ...s, users: s.users.filter(x => x.id !== id) })); };

  const calculateResults = (): ResultRow[] => {
    const results: ResultRow[] = [];

    state.sprints.forEach(sprint => {
      state.devs.forEach(dev => {
        const devCards = state.cards.filter(c => c.sprintId === sprint.id && c.devId === dev.id);
        if (devCards.length === 0) return;

        const plannedCards = devCards.length;
        const completedCards = devCards.filter(c => c.status === CardStatus.COMPLETED).length;

        const plannedPoints = devCards.reduce((acc, c) => acc + (c.isProject ? (c.projectPoints || 0) : c.basePoints), 0);
        const deliveredPoints = devCards
          .filter(c => c.status === CardStatus.COMPLETED)
          .reduce((acc, c) => acc + (c.isProject ? (c.projectPoints || 0) : c.basePoints), 0);

        const completionPercent = plannedPoints > 0 ? (deliveredPoints / plannedPoints) * 100 : 0;

        // Discontos por retornos de Homologação
        let totalDiscounts = 0;
        let totalDevFailures = 0;

        devCards.forEach(card => {
          const cardQA = state.qa.filter(q => q.cardId === card.id && q.type === ReturnType.DEV_FAILURE);
          const failureCount = cardQA.length;
          totalDevFailures += failureCount;

          if (failureCount === 3) {
            totalDiscounts += Math.abs(state.config.discount3Returns);
          } else if (failureCount > 3) {
            totalDiscounts += Math.abs(state.config.discountAbove3Returns);
          }
        });

        // Extras
        const devExtras = state.extras.filter(e => e.sprintId === sprint.id && e.devId === dev.id);
        const totalExtras = devExtras.reduce((acc, e) => acc + e.points, 0);

        const sprintScore = deliveredPoints - totalDiscounts;

        const qualityIndex = deliveredPoints > 0
          ? (sprintScore / deliveredPoints) * 100
          : (totalDevFailures > 0 ? 0 : 100);

        results.push({
          sprintId: sprint.id,
          devId: dev.id,
          plannedPoints,
          deliveredPoints,
          plannedCards,
          completedCards,
          completionPercent,
          devFailures: totalDevFailures,
          discounts: totalDiscounts,
          extras: totalExtras,
          qualityIndex,
          sprintScore,
          finalScore: sprintScore + totalExtras
        });
      });
    });

    return results;
  };

  return (
    <AppContext.Provider value={{
      ...state,
      currentUser,
      login,
      logout,
      setConfig,
      setSprints,
      setDevs,
      setCards,
      setQA,
      setExtras,
      setUsers,
      addSprint,
      addDev,
      addCard,
      addQA,
      addExtra,
      addUser,
      updateSprint,
      updateDev,
      updateCard,
      updateQA,
      updateExtra,
      updateUser,
      deleteSprint,
      deleteDev,
      deleteCard,
      deleteQA,
      deleteExtra,
      deleteUser,
      calculateResults,
      isInitialPulling
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
