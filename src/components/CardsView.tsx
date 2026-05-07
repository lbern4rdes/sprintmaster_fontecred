/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import {
  Plus, Trash2, Edit2, Check, Filter, Search, Tag, User, Star, CreditCard,
  LayoutGrid, List as ListIcon, CheckCircle2, Circle, GripVertical, FileText,
  MessageSquare, Send, History, X, AlertOctagon, RotateCcw
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CardStatus, CardType, Complexity, ReturnType } from '../types';

const TAG_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-orange-50 text-orange-700 border-orange-100',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

export function CardsView() {
  const { cards, sprints, devs, config, addCard, updateCard, deleteCard, addQA, currentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Administrador';

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAddingReturn, setIsAddingReturn] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSprint, setFilterSprint] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'columns'>('columns');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    sprintId: '',
    devId: '',
    title: '',
    type: CardType.IMPROVEMENT,
    complexity: Complexity.MEDIUM,
    basePoints: 5,
    estimatedDays: 1,
    startDate: '',
    deliveryDate: '',
    completionDate: '',
    status: CardStatus.PLANNED,
    isProject: false,
    projectPoints: 0,
    observations: '',
    tags: [] as string[],
    code: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Extract all unique tags for filter
  const allTags = Array.from(new Set(cards.flatMap(c => c.tags || []))).sort();

  const filteredSuggestions = allTags.filter((tag: string) => {
    const parts = tagInput.split(',').map(p => p.trim());
    const lastPart = parts[parts.length - 1].toLowerCase();
    return tag.toLowerCase().includes(lastPart) && !parts.slice(0, -1).includes(tag);
  });

  // Auto-fill points based on complexity
  useEffect(() => {
    if (formData.complexity === Complexity.SIMPLE) setFormData(f => ({ ...f, basePoints: config.pointsSimple }));
    else if (formData.complexity === Complexity.MEDIUM) setFormData(f => ({ ...f, basePoints: config.pointsMedium }));
    else if (formData.complexity === Complexity.COMPLEX) setFormData(f => ({ ...f, basePoints: config.pointsComplex }));
  }, [formData.complexity, config]);

  const handleSave = () => {
    if (!isAdmin) return;
    if (!formData.title || !formData.sprintId || !formData.devId) return;
    if (editingId) {
      updateCard(editingId, formData as any);
      setEditingId(null);
    } else {
      addCard(formData as any);
    }
    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      sprintId: '',
      devId: '',
      title: '',
      type: CardType.IMPROVEMENT,
      complexity: Complexity.MEDIUM,
      basePoints: 5,
      estimatedDays: 1,
      startDate: '',
      deliveryDate: '',
      completionDate: '',
      status: CardStatus.PLANNED,
      isProject: false,
      projectPoints: 0,
      observations: '',
      tags: [],
      code: ''
    });
    setTagInput('');
  };

  const startEdit = (card: any) => {
    if (!isAdmin) return;
    setFormData({ ...card, tags: card.tags || [] });
    setTagInput((card.tags || []).join(', '));
    setEditingId(card.id);
    setIsAdding(true);
  };

  const handleTagChange = (input: string) => {
    if (!isAdmin) return;
    setTagInput(input);
    const tags = input.split(',').map(t => t.trim()).filter(t => t !== '');
    setFormData(f => ({ ...f, tags }));
    setShowTagSuggestions(true);
  };

  const selectTagSuggestion = (tag: string) => {
    if (!isAdmin) return;
    const parts = tagInput.split(',').map(p => p.trim());
    parts[parts.length - 1] = tag;
    const newTags = Array.from(new Set(parts.filter(p => p !== '')));
    const newVal = newTags.join(', ') + ', ';
    setTagInput(newVal);
    setFormData(f => ({ ...f, tags: newTags }));
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  };

  const toggleReady = (id: string, currentStatus: CardStatus) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === CardStatus.COMPLETED ? CardStatus.PLANNED : CardStatus.COMPLETED;
    const completionDate = newStatus === CardStatus.COMPLETED ? new Date().toISOString().split('T')[0] : '';
    updateCard(id, { status: newStatus, completionDate });
  };


  // Horizontal Scroll Drag
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'columns') return;
    const target = e.target as HTMLElement;
    // Don't trigger if clicking on a card or button
    if (target.closest('.card-item') || target.closest('button') || target.closest('select') || target.closest('input')) return;

    setIsDraggingScroll(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => setIsDraggingScroll(false);
  const handleMouseUp = () => setIsDraggingScroll(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Drag and Drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as CardStatus;
    const completionDate = newStatus === CardStatus.COMPLETED ? new Date().toISOString().split('T')[0] : '';
    updateCard(draggableId, { status: newStatus, completionDate });
  };

  const filteredCards = cards.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSprint = filterSprint === 'all' || c.sprintId === filterSprint;
    const matchesTag = filterTag === 'all' || (c.tags && c.tags.includes(filterTag));
    return matchesSearch && matchesSprint && matchesTag;
  });

  const selectedCard = cards.find(c => c.id === selectedCardId);

  const handleAddReturn = (cardId: string, data: { type: ReturnType, description: string }) => {
    addQA({
      cardId,
      date: new Date().toISOString().split('T')[0],
      type: data.type,
      description: data.description,
      observations: ''
    });
    setIsAddingReturn(false);
  };

  const handleAddManualComment = () => {
    if (!selectedCardId || !newComment.trim()) return;
    const comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment.trim(),
      date: new Date().toISOString(),
      isSystem: false
    };
    updateCard(selectedCardId, {
      comments: [...(selectedCard?.comments || []), comment]
    });
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fluxo de Demandas</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Gerenciamento e acompanhamento de cards por sprint.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'columns' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {!isAdding && isAdmin && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> Criar Card
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">
              {editingId ? `Editar: ${formData.title}` : 'Nova Demanda'}
            </h3>
            {formData.isProject && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Projeto</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</label>
              <input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-black placeholder:text-slate-300 bg-slate-50"
                placeholder="Ex: CRD-001 (Auto se vazio)"
              />
            </div>

            <div className="space-y-1.5 lg:col-span-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição do Card</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium placeholder:text-slate-300"
                placeholder="Ex: API de Conexão com Sheets"
              />
            </div>

            <div className="space-y-2 lg:col-span-2 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tags (Separadas por vírgula)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onFocus={() => setShowTagSuggestions(true)}
                  onChange={(e) => handleTagChange(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium placeholder:text-slate-300"
                  placeholder="Ex: Urgente, Bug, Frontend"
                />
              </div>

              {/* Tag Autocomplete Dropdown */}
              {showTagSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Sugestões de Tags</div>
                  <div className="flex flex-col gap-0.5">
                    {filteredSuggestions.map((tag: string) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => selectTagSuggestion(tag)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg text-left transition-colors group"
                      >
                        <div className={cn("w-2 h-2 rounded-full border", getTagColor(tag).split(' ')[0])} />
                        {tag}
                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Overlay to close dropdown */}
              {showTagSuggestions && (
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowTagSuggestions(false)}
                />
              )}

              {/* Active Tags Preview */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1",
                        getTagColor(tag)
                      )}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags?.filter((t: string) => t !== tag) || [];
                          setFormData(f => ({ ...f, tags: newTags }));
                          setTagInput(newTags.join(', '));
                        }}
                        className="hover:text-slate-900 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sprint Alvo</label>
              <select
                value={formData.sprintId}
                onChange={(e) => setFormData({ ...formData, sprintId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-700"
              >
                <option value="">Selecionar...</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dev Atribuído</label>
              <select
                value={formData.devId}
                onChange={(e) => setFormData({ ...formData, devId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-bold text-slate-700"
              >
                <option value="">Selecionar Dev</option>
                {devs.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CardType })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-medium text-slate-600"
              >
                {Object.values(CardType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Complexidade</label>
              <select
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: e.target.value as Complexity })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-medium text-slate-600"
              >
                {Object.values(Complexity).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pontuação</label>
              <input
                type="number"
                disabled={formData.complexity !== Complexity.CUSTOM}
                value={formData.basePoints}
                onChange={(e) => setFormData({ ...formData, basePoints: Number(e.target.value) })}
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none font-bold text-center",
                  formData.complexity === Complexity.CUSTOM ? "bg-white" : "bg-slate-50 text-slate-400"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Atual</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CardStatus })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none bg-white font-black text-slate-800"
              >
                {Object.values(CardStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Início</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none text-slate-600" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entrega Estimada</label>
              <input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none text-slate-600" />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="isProject"
                checked={formData.isProject}
                onChange={(e) => setFormData({ ...formData, isProject: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="isProject" className="text-xs font-black uppercase tracking-tighter text-slate-700">Flag Projeto</label>
            </div>

            {formData.isProject && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 text-center block">Pontos Combinados</label>
                <input
                  type="number"
                  value={formData.projectPoints}
                  onChange={(e) => setFormData({ ...formData, projectPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 outline-none font-black text-center text-indigo-700"
                />
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Anotações / Observações</label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-slate-900 transition-colors outline-none font-medium placeholder:text-slate-300 min-h-[100px] bg-slate-50/30"
                placeholder="Adicione detalhes, observações ou requisitos específicos..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              {editingId ? 'Salvar Mudanças' : 'Criar Demanda'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            placeholder="Pesquisar por título, ID ou Código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:border-slate-400 outline-none transition-colors font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto px-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
              className="text-xs font-bold py-2 bg-transparent outline-none cursor-pointer text-slate-700"
            >
              <option value="all">Sprints: Todas</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="text-xs font-bold py-2 bg-transparent outline-none cursor-pointer text-slate-700"
            >
              <option value="all">Tag: Todas</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredCards.map((card) => {
            const sprint = sprints.find(s => s.id === card.sprintId);
            const dev = devs.find(d => d.id === card.devId);
            const score = card.isProject && card.projectPoints ? card.projectPoints : card.basePoints;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 md:items-center hover:border-slate-400 transition-colors group relative overflow-hidden cursor-pointer active:scale-[0.99]"
              >
                {card.isProject && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReady(card.id, card.status);
                  }}
                  className="shrink-0 group/check"
                >
                  {card.status === CardStatus.COMPLETED ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-200 group-hover/check:text-slate-400 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-900 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50 shadow-sm">{card.code}</span>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                      card.status === CardStatus.COMPLETED ? "bg-emerald-100 text-emerald-700" :
                        card.status === CardStatus.QA ? "bg-blue-100 text-blue-700" :
                          card.status === CardStatus.IN_PROGRESS ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-500"
                    )}>
                      {card.status}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 font-mono tracking-tighter">ID: {card.id.slice(0, 6)}</span>
                  </div>
                  <h4 className={cn(
                    "font-bold truncate pr-4 transition-colors",
                    card.status === CardStatus.COMPLETED ? "text-slate-400 line-through" : "text-slate-800"
                  )}>
                    {card.title}
                  </h4>
                  {card.observations && (
                    <div className="flex items-start gap-2 mb-2 p-2 rounded bg-slate-50/50 border border-slate-100/50">
                      <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">{card.observations}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {card.tags?.map(t => (
                      <span key={t} className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", getTagColor(t))}>{t}</span>
                    ))}
                    {!card.tags?.length && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {card.type}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-tighter ml-2">
                      <User className="w-3 h-3 text-slate-300" /> {dev?.name || 'Sem dev'}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-between md:justify-end gap-6 md:border-l md:border-slate-100 md:pl-6 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <div className="text-center md:text-right flex flex-col md:items-end">
                      <span className="text-xl font-black text-slate-900 leading-none">{score}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.complexity}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(card)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Excluir card permanentemente?')) deleteCard(card.id) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {!isAdmin && (
                  <div className="flex items-center justify-between md:justify-end gap-6 md:border-l md:border-slate-100 md:pl-6 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <div className="text-center md:text-right flex flex-col md:items-end">
                      <span className="text-xl font-black text-slate-900 leading-none">{score}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.complexity}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={cn(
              "flex gap-4 overflow-x-auto pb-6 min-h-[600px] select-none cursor-default active:cursor-grabbing scrollbar-hide",
              isDraggingScroll && "cursor-grabbing"
            )}
            style={{ scrollBehavior: isDraggingScroll ? 'auto' : 'smooth' }}
          >
            {Object.values(CardStatus).map((status) => (
              <div key={status} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-3">
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 border-b-4 border-b-slate-900 shadow-sm shrink-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{status}</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full">
                    {filteredCards.filter(c => c.status === status).length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex flex-col gap-3 min-h-[400px] rounded-xl transition-colors p-1",
                        snapshot.isDraggingOver ? "bg-slate-100/50" : "bg-transparent"
                      )}
                    >
                      {filteredCards.filter(c => c.status === status).map((card, index) => {
                        const dev = devs.find(d => d.id === card.devId);
                        const score = card.isProject && card.projectPoints ? card.projectPoints : card.basePoints;

                        return (
                          // @ts-ignore
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedCardId(card.id)}
                                className={cn(
                                  "card-item bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all group/card cursor-pointer",
                                  snapshot.isDragging ? "shadow-2xl border-slate-900 z-50 rotate-2 scale-105" : ""
                                )}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="w-3 h-3 text-slate-300 group-hover/card:text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-900 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{card.code}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReady(card.id, card.status);
                                    }}
                                    className={cn(
                                      "transition-colors",
                                      card.status === CardStatus.COMPLETED ? "text-emerald-500" : "text-slate-200 hover:text-slate-300"
                                    )}
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                </div>
                                <h5 className={cn(
                                  "font-bold text-sm leading-tight mb-3",
                                  card.status === CardStatus.COMPLETED ? "text-slate-400 line-through" : "text-slate-800"
                                )}>
                                  {card.title}
                                </h5>
                                {card.observations && (
                                  <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover/card:bg-slate-100/50 transition-colors">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <FileText className="w-3 h-3 text-slate-400" />
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Anotações</span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{card.observations}</p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {card.tags?.map(t => (
                                    <span key={t} className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", getTagColor(t))}>{t}</span>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                      {dev?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">{dev?.name?.split(' ')[0] || 'Unassigned'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">{score}pts</span>
                                    <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); startEdit(card); }} className="p-1 text-slate-300 hover:text-slate-900 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {filteredCards.filter(c => c.status === status).length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black text-slate-200 uppercase tracking-widest">
                          Sem cards
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {filteredCards.length === 0 && (
        <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <CreditCard className="w-10 h-10 mx-auto mb-4 text-slate-200" />
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Nenhum resultado para os filtros atuais</p>
        </div>
      )}

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selectedCardId && selectedCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCardId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4 bg-slate-50/50">
                <div className="space-y-1.5 text-left w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] md:text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm shrink-0">{selectedCard.code}</span>
                    <span className={cn(
                      "text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest shrink-0",
                      selectedCard.status === CardStatus.COMPLETED ? "bg-emerald-100 text-emerald-700" :
                        selectedCard.status === CardStatus.QA ? "bg-blue-100 text-blue-700" :
                          selectedCard.status === CardStatus.RETURNED ? "bg-rose-100 text-rose-700" :
                            "bg-slate-200 text-slate-600"
                    )}>
                      {selectedCard.status}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{selectedCard.type}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{selectedCard.title}</h3>
                </div>
                <div className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0">
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Info Column */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Main Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Responsável</span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                            {devs.find(d => d.id === selectedCard.devId)?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-bold text-slate-800 truncate">{devs.find(d => d.id === selectedCard.devId)?.name || 'Nenhum'}</span>
                        </div>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sprint</span>
                        <div className="font-bold text-slate-800 truncate">{sprints.find(s => s.id === selectedCard.sprintId)?.name || 'Sem sprint'}</div>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pontuação</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-900">{selectedCard.isProject ? selectedCard.projectPoints : selectedCard.basePoints}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedCard.complexity}</span>
                        </div>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prazos</span>
                        <div className="flex flex-col gap-1">
                          <div className="text-[11px] font-bold text-slate-600">Inicio: {selectedCard.startDate || '-'}</div>
                          <div className="text-[11px] font-bold text-slate-400">Entrega: {selectedCard.deliveryDate || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                        <FileText className="w-3 h-3" /> Anotações / Descrição
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                        {selectedCard.observations || 'Nenhuma anotação adicional.'}
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedCard.tags && selectedCard.tags.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <Tag className="w-3 h-3" /> Tags
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCard.tags.map(t => (
                            <span key={t} className={cn("px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border", getTagColor(t))}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback/Comments Column */}
                  <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-6 pb-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shrink-0">
                        <MessageSquare className="w-4 h-4" /> Comentários
                      </div>
                      <button
                        onClick={() => setIsAddingReturn(!isAddingReturn)}
                        className={cn(
                          "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all",
                          isAddingReturn
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        )}
                      >
                        {isAddingReturn ? <X className="w-3 h-3 shrink-0" /> : <RotateCcw className="w-3 h-3 shrink-0" />}
                        <span className="hidden xs:inline">{isAddingReturn ? 'Fechar' : 'Lançar Retorno'}</span>
                        <span className="xs:hidden">{isAddingReturn ? 'X' : 'Retorno'}</span>
                      </button>
                    </div>

                    {/* Return Form (Miniature) */}
                    {isAddingReturn && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-4 mb-4"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-rose-400">Motivo do Retorno</label>
                          <select
                            id="returnType"
                            className="w-full bg-white px-3 py-2 text-xs font-bold rounded-lg border border-rose-200 outline-none shadow-sm"
                          >
                            {Object.values(ReturnType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-rose-400">O que ajustar?</label>
                          <textarea
                            id="returnDesc"
                            placeholder="Descreva o problema..."
                            className="w-full bg-white px-3 py-2 text-xs font-medium rounded-lg border border-rose-200 outline-none min-h-[80px] shadow-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const type = (document.getElementById('returnType') as HTMLSelectElement).value as ReturnType;
                            const desc = (document.getElementById('returnDesc') as HTMLTextAreaElement).value;
                            if (!desc) return;
                            handleAddReturn(selectedCardId, { type, description: desc });
                          }}
                          className="w-full bg-rose-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-sm"
                        >
                          Confirmar Retorno
                        </button>
                      </motion.div>
                    )}

                    {/* Comment Feed */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedCard.comments && selectedCard.comments.length > 0 ? (
                        [...selectedCard.comments].reverse().map((comment) => (
                          <div
                            key={comment.id}
                            className={cn(
                              "p-3 rounded-xl border shadow-sm",
                              comment.isSystem ? "bg-amber-50/50 border-amber-100" : "bg-white border-slate-100"
                            )}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                comment.isSystem ? "text-amber-600" : "text-slate-400"
                              )}>
                                {comment.isSystem ? 'Sistema / QA' : 'Comentário'}
                              </span>
                              <span className="text-[8px] font-bold text-slate-300">
                                {new Date(comment.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className={cn(
                              "text-xs leading-relaxed",
                              comment.isSystem ? "text-amber-800 font-medium italic" : "text-slate-700"
                            )}>
                              {comment.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          Nenhum comentário ainda.
                        </div>
                      )}
                    </div>

                    {/* Post Comment */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Adicionar um comentário..."
                          className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-200 focus:border-slate-400 outline-none min-h-[80px] transition-all bg-slate-50/50 resize-none font-medium"
                        />
                        <button
                          onClick={handleAddManualComment}
                          disabled={!newComment.trim()}
                          className="absolute bottom-3 right-3 bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-all shadow-md disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  onClick={() => { if (confirm('Excluir card permanentemente?')) { deleteCard(selectedCardId); setSelectedCardId(null); } }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 px-4 transition-colors order-2 md:order-1"
                >
                  Excluir Card
                </button>
                <div className="flex flex-wrap justify-center gap-3 order-1 md:order-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      startEdit(selectedCard);
                      setSelectedCardId(null);
                    }}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => toggleReady(selectedCard.id, selectedCard.status)}
                    className={cn(
                      "flex-1 md:flex-none px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md",
                      selectedCard.status === CardStatus.COMPLETED
                        ? "bg-slate-200 text-slate-500"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 font-black"
                    )}
                  >
                    {selectedCard.status === CardStatus.COMPLETED ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {selectedCard.status === CardStatus.COMPLETED ? 'Reabrir' : 'Finalizar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

