/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useApp } from '../store';
import { CardType, Complexity, ReturnType, CardStatus, SprintStatus } from '../types';
import { RefreshCcw, Cloud } from 'lucide-react';

export function SettingsView() {
  const { config, setConfig } = useApp();

  const handleConfigChange = (key: keyof typeof config, value: string | number) => {
    const val = typeof value === 'string' && value !== '' && key !== 'gasUrl' ? Number(value) : value;
    setConfig({ ...config, [key]: val });
  };

  const gasBoilerplate = `
/**
 * SprintMaster - Pro Database Sync Script v2.0
 * Este script transforma as abas da planilha no Banco de Dados Real.
 */

const SHEETS = {
  CONFIG: "DB_CONFIG",
  SPRINTS: "DB_SPRINTS",
  DEVS: "DB_DEVS",
  CARDS: "DB_CARDS",
  QA: "DB_QA",
  EXTRAS: "DB_EXTRAS",
  USERS: "DB_USERS"
};

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {
    config: readConfig(ss),
    sprints: readSheet(ss, SHEETS.SPRINTS),
    devs: readSheet(ss, SHEETS.DEVS),
    cards: readSheet(ss, SHEETS.CARDS),
    qa: readSheet(ss, SHEETS.QA),
    extras: readSheet(ss, SHEETS.EXTRAS),
    users: readSheet(ss, SHEETS.USERS)
  };
  
  // Se não houver usuários, garante pelo menos o admin padrão
  if (data.users.length === 0) {
    data.users = [{
      id: "admin_root",
      name: "Administrador Fontecred",
      email: "admin@fontecred.com.br",
      password: "12345678",
      role: "Administrador",
      active: true
    }];
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    
    // Salva cada entidade em sua respectiva aba
    if (data.config) writeConfig(ss, data.config);
    if (data.sprints) writeSheet(ss, SHEETS.SPRINTS, data.sprints);
    if (data.devs) writeSheet(ss, SHEETS.DEVS, data.devs);
    if (data.cards) writeSheet(ss, SHEETS.CARDS, data.cards);
    if (data.qa) writeSheet(ss, SHEETS.QA, data.qa);
    if (data.extras) writeSheet(ss, SHEETS.EXTRAS, data.extras);
    if (data.users) writeSheet(ss, SHEETS.USERS, data.users);
    
    return ContentService.createTextOutput("Sync Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// --- Funções Auxiliares de Leitura ---

function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  
  const headers = values[0];
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Converte strings de booleanos/números se necessário
      if (val === "true") val = true;
      if (val === "false") val = false;
      obj[h] = val;
    });
    return obj;
  });
}

function readConfig(ss) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  let config = {};
  values.forEach(row => {
    if (row[0]) config[row[0]] = row[1];
  });
  return config;
}

// --- Funções Auxiliares de Escrita ---

function writeSheet(ss, sheetName, items) {
  if (!items || items.length === 0) return;
  let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear();
  
  const headers = Object.keys(items[0]);
  sheet.appendRow(headers);
  
  const rows = items.map(item => headers.map(h => {
    const val = item[h];
    return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : (val === undefined ? "" : val);
  }));
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
}

function writeConfig(ss, config) {
  let sheet = ss.getSheetByName(SHEETS.CONFIG) || ss.insertSheet(SHEETS.CONFIG);
  sheet.clear();
  const rows = Object.keys(config).map(key => [key, config[key]]);
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  }
}
  `.trim();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gasBoilerplate);
    alert('Script copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parametetrização do Sistema</h2>
        <p className="text-sm text-slate-500 font-medium tracking-tight">Refinamento das regras de negócio e integração com banco de dados externo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Pesos por Complexidade</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Esforço Simples</label>
              <input 
                type="number" 
                value={config.pointsSimple} 
                onChange={(e) => handleConfigChange('pointsSimple', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Esforço Intermediário</label>
              <input 
                type="number" 
                value={config.pointsMedium} 
                onChange={(e) => handleConfigChange('pointsMedium', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Esforço Avançado</label>
              <input 
                type="number" 
                value={config.pointsComplex} 
                onChange={(e) => handleConfigChange('pointsComplex', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Escalabilidade de Descontos (Retornos)</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Primeira Faixa (Até 2)</label>
              <input 
                type="number" 
                value={config.discount2Returns} 
                onChange={(e) => handleConfigChange('discount2Returns', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Segunda Faixa (Exatos 3)</label>
              <input 
                type="number" 
                value={config.discount3Returns} 
                onChange={(e) => handleConfigChange('discount3Returns', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Terceira Faixa (4 ou mais)</label>
              <input 
                type="number" 
                value={config.discountAbove3Returns} 
                onChange={(e) => handleConfigChange('discountAbove3Returns', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Bonificações & Incidências</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-blue-600 uppercase tracking-tighter">Hotfix Emergencial</label>
              <input 
                type="number" 
                value={config.pointsHotfix} 
                onChange={(e) => handleConfigChange('pointsHotfix', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-amber-600 uppercase tracking-tighter">Atuação "Fura-fila"</label>
              <input 
                type="number" 
                value={config.pointsQueueJump} 
                onChange={(e) => handleConfigChange('pointsQueueJump', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-rose-600 uppercase tracking-tighter">Falha de Negócio/Requisito</label>
              <input 
                type="number" 
                value={config.pointsReqFailure} 
                onChange={(e) => handleConfigChange('pointsReqFailure', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
            <div className="flex items-center justify-between group">
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">Bônus Entrega Antecipada</label>
              <input 
                type="number" 
                value={config.bonusEarly} 
                onChange={(e) => handleConfigChange('bonusEarly', e.target.value)}
                className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-right font-black text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-2">Glossário & Categorias Estáticas</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-widest">
            <div>
              <p className="font-black text-slate-800 mb-2 border-l-2 border-slate-800 pl-2">Tipos de Card</p>
              {Object.values(CardType).map(t => <p key={t} className="mt-0.5">• {t}</p>)}
            </div>
            <div>
              <p className="font-black text-slate-800 mb-2 border-l-2 border-slate-800 pl-2">Status Card</p>
              {Object.values(CardStatus).map(s => <p key={s} className="mt-0.5">• {s}</p>)}
            </div>
            <div>
              <p className="font-black text-slate-800 mb-2 border-l-2 border-slate-800 pl-2">Retornos QA</p>
              {Object.values(ReturnType).map(r => <p key={r} className="mt-0.5">• {r}</p>)}
            </div>
             <div>
              <p className="font-black text-slate-800 mb-2 border-l-2 border-slate-800 pl-2">Status Sprint</p>
              {Object.values(SprintStatus).map(s => <p key={s} className="mt-0.5">• {s}</p>)}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
