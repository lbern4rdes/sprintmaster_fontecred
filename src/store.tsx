/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  Sprint, Dev, Card, QA, Extra, Config,
  Complexity, CardType, ReturnType, ExtraType,
  CardStatus, ResultRow, User, UserRole, SprintStatus
} from './types';
import { DEFAULT_CONFIG } from './constants';
import { supabase } from './lib/supabase';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  setConfig: (config: Config) => void;
  setSprints: (sprints: Sprint[]) => void;
  setDevs: (devs: Dev[]) => void;
  setCards: (cards: Card[]) => void;
  setQA: (qa: QA[]) => void;
  setExtras: (extras: Extra[]) => void;
  setUsers: (users: User[]) => void;

  // Helpers
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<void>;
  addDev: (dev: Omit<Dev, 'id'>) => Promise<void>;
  addCard: (card: Omit<Card, 'id'>) => Promise<void>;
  addQA: (qa: Omit<QA, 'id'>) => Promise<void>;
  addExtra: (extra: Omit<Extra, 'id'>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;

  updateSprint: (id: string, sprint: Partial<Sprint>) => Promise<void>;
  updateDev: (id: string, dev: Partial<Dev>) => Promise<void>;
  updateCard: (id: string, card: Partial<Card>) => Promise<void>;
  updateQA: (id: string, qa: Partial<QA>) => Promise<void>;
  updateExtra: (id: string, extra: Partial<Extra>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;

  deleteSprint: (id: string) => Promise<void>;
  deleteDev: (id: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteQA: (id: string) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

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

  const [state, setState] = useState<AppState>({
    config: DEFAULT_CONFIG,
    sprints: [],
    devs: [],
    cards: [],
    qa: [],
    extras: [],
    users: [DEFAULT_ADMIN]
  });

  const [isInitialPulling, setIsInitialPulling] = useState(true);

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      const [
        { data: configData },
        { data: sprintsData },
        { data: devsData },
        { data: cardsData },
        { data: qaData },
        { data: extrasData },
        { data: profilesData }
      ] = await Promise.all([
        supabase.from('app_config').select('*').single(),
        supabase.from('sprints').select('*').order('created_at', { ascending: false }),
        supabase.from('devs').select('*').order('name'),
        supabase.from('cards').select('*').order('created_at', { ascending: false }),
        supabase.from('qa').select('*').order('date', { ascending: false }),
        supabase.from('extras').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('*').order('name')
      ]);

      const mappedUsers = (profilesData || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        password: p.password,
        role: p.role as UserRole,
        active: p.active
      }));

      // Se não houver config no banco, usa a padrão
      const mappedConfig: Config = configData ? {
        pointsSimple: configData.points_simple,
        pointsMedium: configData.points_medium,
        pointsComplex: configData.points_complex,
        discount2Returns: configData.discount_2_returns,
        discount3Returns: configData.discount_3_returns,
        discountAbove3Returns: configData.discount_above_3_returns,
        pointsHotfix: configData.points_hotfix,
        pointsQueueJump: configData.points_queue_jump,
        pointsReqFailure: configData.points_req_failure,
        bonusEarly: configData.bonus_early,
      } : DEFAULT_CONFIG;

      setState({
        config: mappedConfig,
        sprints: (sprintsData || []).map(s => ({
          id: s.id,
          name: s.name,
          startDate: s.start_date,
          endDate: s.end_date,
          status: s.status as SprintStatus,
          observations: s.observations || ''
        })),
        devs: (devsData || []).map(d => ({
          id: d.id,
          name: d.name,
          active: d.active,
          observations: d.observations || ''
        })),
        cards: (cardsData || []).map(c => ({
          id: c.id,
          code: c.code,
          sprintId: c.sprint_id,
          devId: c.dev_id,
          title: c.title,
          type: c.type as CardType,
          complexity: c.complexity as Complexity,
          basePoints: Number(c.base_points),
          estimatedDays: Number(c.estimated_days),
          startDate: c.start_date || '',
          deliveryDate: c.delivery_date || '',
          completionDate: c.completion_date || '',
          status: c.status as CardStatus,
          isProject: c.is_project,
          projectPoints: Number(c.project_points),
          tags: c.tags || [],
          comments: c.comments || [],
          observations: c.observations || ''
        })),
        qa: (qaData || []).map(q => ({
          id: q.id,
          cardId: q.card_id,
          date: q.date,
          type: q.type as ReturnType,
          description: q.description || '',
          observations: q.observations || ''
        })),
        extras: (extrasData || []).map(e => ({
          id: e.id,
          sprintId: e.sprint_id,
          devId: e.dev_id,
          cardId: e.card_id,
          type: e.type as ExtraType,
          description: e.description || '',
          points: Number(e.points),
          date: e.date,
          observations: e.observations || ''
        })),
        users: mappedUsers.length > 0 ? mappedUsers : [DEFAULT_ADMIN]
      });
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setIsInitialPulling(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Realtime subscriptions
    const channels = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sprint_master_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sprint_master_session');
    }
  }, [currentUser]);

  const login = async (email: string, password: string) => {
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

  const setConfig = async (config: Config) => {
    await supabase.from('app_config').upsert({
      id: 1,
      points_simple: config.pointsSimple,
      points_medium: config.pointsMedium,
      points_complex: config.pointsComplex,
      discount_2_returns: config.discount2Returns,
      discount_3_returns: config.discount3Returns,
      discount_above_3_returns: config.discountAbove3Returns,
      points_hotfix: config.pointsHotfix,
      points_queue_jump: config.pointsQueueJump,
      points_req_failure: config.pointsReqFailure,
      bonus_early: config.bonusEarly
    });
    fetchData();
  };

  const setSprints = (sprints: Sprint[]) => setState(s => ({ ...s, sprints }));
  const setDevs = (devs: Dev[]) => setState(s => ({ ...s, devs }));
  const setCards = (cards: Card[]) => setState(s => ({ ...s, cards }));
  const setQA = (qa: QA[]) => setState(s => ({ ...s, qa }));
  const setExtras = (extras: Extra[]) => setState(s => ({ ...s, extras }));
  const setUsers = (users: User[]) => setState(s => ({ ...s, users }));

  const addSprint = async (sprint: Omit<Sprint, 'id'>) => {
    await supabase.from('sprints').insert({
      name: sprint.name,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      status: sprint.status,
      observations: sprint.observations
    });
    fetchData();
  };

  const addDev = async (dev: Omit<Dev, 'id'>) => {
    await supabase.from('devs').insert({
      name: dev.name,
      active: dev.active,
      observations: dev.observations
    });
    fetchData();
  };

  const addCard = async (card: Omit<Card, 'id'>) => {
    const defaultCode = `CRD-${(state.cards.length + 1).toString().padStart(3, '0')}`;
    let finalCode = card.code || defaultCode;
    
    let counter = 1;
    while (state.cards.some(c => c.code === finalCode)) {
      finalCode = `${card.code || defaultCode}-${counter}`;
      counter++;
    }

    await supabase.from('cards').insert({
      code: finalCode,
      sprint_id: card.sprintId,
      dev_id: card.devId,
      title: card.title,
      type: card.type,
      complexity: card.complexity,
      base_points: card.basePoints,
      estimated_days: card.estimatedDays,
      start_date: card.startDate,
      delivery_date: card.deliveryDate,
      status: card.status,
      is_project: card.isProject,
      project_points: card.projectPoints,
      tags: card.tags,
      comments: card.comments,
      observations: card.observations
    });
    fetchData();
  };

  const addQA = async (qa: Omit<QA, 'id'>) => {
    const card = state.cards.find(c => c.id === qa.cardId);
    const cardFailures = state.qa.filter(q => q.cardId === qa.cardId && q.type === ReturnType.DEV_FAILURE).length;
    const newFailureCount = qa.type === ReturnType.DEV_FAILURE ? cardFailures + 1 : cardFailures;

    let discount = 0;
    if (qa.type === ReturnType.DEV_FAILURE) {
      if (newFailureCount === 3) discount = Math.abs(state.config.discount3Returns);
      else if (newFailureCount > 3) discount = Math.abs(state.config.discountAbove3Returns);
    }

    const commentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      text: `🚩 RETORNO QA: ${qa.type}. Descrição: ${qa.description}. Impacto: ${discount > 0 ? `Descontou ${discount} pts` : 'Sem desconto'} (Total: ${newFailureCount}x)`,
      date: new Date().toISOString(),
      isSystem: true
    };

    const updatedComments = [...(card?.comments || []), commentRecord];

    await Promise.all([
      supabase.from('qa').insert({
        card_id: qa.cardId,
        date: qa.date,
        type: qa.type,
        description: qa.description,
        observations: qa.observations
      }),
      supabase.from('cards').update({
        comments: updatedComments,
        status: CardStatus.RETURNED
      }).eq('id', qa.cardId)
    ]);
    
    fetchData();
  };

  const addExtra = async (extra: Omit<Extra, 'id'>) => {
    await supabase.from('extras').insert({
      sprint_id: extra.sprintId,
      dev_id: extra.devId,
      card_id: extra.cardId,
      type: extra.type,
      description: extra.description,
      points: extra.points,
      date: extra.date,
      observations: extra.observations
    });
    fetchData();
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    await supabase.from('profiles').insert({
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      active: user.active
    });
    fetchData();
  };

  const updateSprint = async (id: string, sprint: Partial<Sprint>) => {
    await supabase.from('sprints').update({
      name: sprint.name,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      status: sprint.status,
      observations: sprint.observations
    }).eq('id', id);
    fetchData();
  };

  const updateDev = async (id: string, dev: Partial<Dev>) => {
    await supabase.from('devs').update({
      name: dev.name,
      active: dev.active,
      observations: dev.observations
    }).eq('id', id);
    fetchData();
  };

  const updateCard = async (id: string, card: Partial<Card>) => {
    await supabase.from('cards').update({
      code: card.code,
      sprint_id: card.sprintId,
      dev_id: card.devId,
      title: card.title,
      type: card.type,
      complexity: card.complexity,
      base_points: card.basePoints,
      estimated_days: card.estimatedDays,
      start_date: card.startDate,
      delivery_date: card.deliveryDate,
      completion_date: card.completionDate,
      status: card.status,
      is_project: card.isProject,
      project_points: card.projectPoints,
      tags: card.tags,
      comments: card.comments,
      observations: card.observations
    }).eq('id', id);
    fetchData();
  };

  const updateQA = async (id: string, qa: Partial<QA>) => {
    await supabase.from('qa').update({
      type: qa.type,
      description: qa.description,
      observations: qa.observations
    }).eq('id', id);
    fetchData();
  };

  const updateExtra = async (id: string, extra: Partial<Extra>) => {
    await supabase.from('extras').update({
      type: extra.type,
      description: extra.description,
      points: extra.points,
      observations: extra.observations
    }).eq('id', id);
    fetchData();
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    await supabase.from('profiles').update({
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      active: user.active
    }).eq('id', id);
    fetchData();
  };

  const deleteSprint = async (id: string) => {
    await supabase.from('sprints').delete().eq('id', id);
    fetchData();
  };

  const deleteDev = async (id: string) => {
    await supabase.from('devs').delete().eq('id', id);
    fetchData();
  };

  const deleteCard = async (id: string) => {
    await supabase.from('cards').delete().eq('id', id);
    fetchData();
  };

  const deleteQA = async (id: string) => {
    await supabase.from('qa').delete().eq('id', id);
    fetchData();
  };

  const deleteExtra = async (id: string) => {
    await supabase.from('extras').delete().eq('id', id);
    fetchData();
  };

  const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    fetchData();
  };

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
