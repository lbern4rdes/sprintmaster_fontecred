/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Complexity {
  SIMPLE = 'Simples',
  MEDIUM = 'Médio',
  COMPLEX = 'Complexo',
  CUSTOM = 'Personalizado',
}

export enum CardStatus {
  PLANNED = 'Planejado',
  IN_PROGRESS = 'Em desenvolvimento',
  QA = 'Homologação',
  RETURNED = 'Retornado',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado',
}

export enum CardType {
  IMPROVEMENT = 'Melhoria',
  BUG = 'Bug',
  PROJECT = 'Projeto',
  HOTFIX = 'Hotfix',
  QUEUE_JUMP = 'Fura-fila',
  MAINTENANCE = 'Sustentação',
}

export enum ReturnType {
  DEV_FAILURE = 'Falha Dev',
  REQ_FAILURE = 'Falha Requisito',
  SCOPE_CHANGE = 'Mudança Escopo',
  UNFORESEEN_ADJUST = 'Ajuste Não Previsto',
  NEW_REQUEST = 'Nova Solicitação',
}

export enum ExtraType {
  HOTFIX = 'Hotfix',
  QUEUE_JUMP = 'Fura-fila',
  REQ_FAILURE = 'Falha de Requisito',
  EARLY_BONUS = 'Bônus Antecipação',
  OTHER = 'Outro',
}

export enum SprintStatus {
  PLANNED = 'Planejada',
  ACTIVE = 'Em andamento',
  FINISHED = 'Finalizada',
}

export enum UserRole {
  ADMIN = 'Administrador',
  COMMON = 'Comum',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}

export interface Config {
  pointsSimple: number;
  pointsMedium: number;
  pointsComplex: number;
  discount2Returns: number;
  discount3Returns: number;
  discountAbove3Returns: number;
  pointsHotfix: number;
  pointsQueueJump: number;
  pointsReqFailure: number;
  bonusEarly: number;
  gasUrl?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  observations: string;
}

export interface Dev {
  id: string;
  name: string;
  active: boolean;
  observations: string;
}

export interface CardComment {
  id: string;
  text: string;
  date: string;
  isSystem?: boolean;
}

export interface Card {
  id: string;
  code: string;
  sprintId: string;
  devId: string;
  title: string;
  type: CardType;
  complexity: Complexity;
  basePoints: number;
  estimatedDays: number;
  startDate: string;
  deliveryDate: string;
  completionDate: string;
  status: CardStatus;
  isProject: boolean;
  projectPoints?: number;
  observations: string;
  tags: string[];
  comments: CardComment[];
}

export interface QA {
  id: string;
  cardId: string;
  date: string;
  type: ReturnType;
  description: string;
  observations: string;
}

export interface Extra {
  id: string;
  sprintId: string;
  devId: string;
  cardId?: string;
  type: ExtraType;
  description: string;
  points: number;
  date: string;
  observations: string;
}

export interface ResultRow {
  sprintId: string;
  devId: string;
  plannedPoints: number;
  deliveredPoints: number;
  plannedCards: number;
  completedCards: number;
  completionPercent: number;
  devFailures: number;
  discounts: number;
  extras: number;
  qualityIndex: number;
  sprintScore: number;
  finalScore: number;
}
