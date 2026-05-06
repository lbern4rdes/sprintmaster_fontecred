# SprintMaster Desktop (Electron)

Este projeto foi configurado para rodar como um aplicativo desktop usando Electron.

## Como começar

1. **Instale as dependências:**
   Abra o seu terminal na pasta do projeto e execute:
   ```bash
   npm install
   ```
   *(Ou o gerenciador de pacotes que você utiliza)*

2. **Rodar em modo de desenvolvimento:**
   Isso abrirá a janela do Electron conectada ao servidor do Vite:
   ```bash
   npm run electron:dev
   ```

3. **Gerar o instalador (.exe):**
   Para criar o arquivo instalador para Windows:
   ```bash
   npm run electron:build
   ```
   O instalador será gerado na pasta `release/`.

## Configurações Realizadas

- **Processo Principal:** Localizado em `electron/main.ts`.
- **Configuração TypeScript:** Adicionado `tsconfig.electron.json`.
- **Build:** Configurado no `package.json` usando `electron-builder`.
- **Ícone:** Gerado e salvo em `public/icon.png`.
- **Vite:** Ajustado em `vite.config.ts` para suportar caminhos relativos exigidos pelo Electron.

## Conexão com GAS
## Sincronização com Google Sheets

Para usar a planilha como banco de dados:

1. Abra sua Planilha Google.
2. Vá em **Extensões > Apps Script**.
3. Cole o código abaixo:

```javascript
/**
 * SprintMaster - Smart Sync Script
 */
const DB_SHEET_NAME = "CONFIG_RAW_DATA";

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DB_SHEET_NAME) || ss.insertSheet(DB_SHEET_NAME);
  const data = sheet.getRange(1, 1).getValue();
  return ContentService.createTextOutput(data || "{}").setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  const dbSheet = ss.getSheetByName(DB_SHEET_NAME) || ss.insertSheet(DB_SHEET_NAME);
  dbSheet.getRange(1, 1).setValue(e.postData.contents);
  updateHumanSheet(ss, "DB_DEVS", ["id", "name", "active"], data.devs);
  updateHumanSheet(ss, "DB_SPRINTS", ["id", "name", "startDate", "endDate", "active"], data.sprints);
  updateHumanSheet(ss, "DB_CARDS", ["id", "code", "title", "status", "basePoints", "devId", "sprintId"], data.cards);
  updateHumanSheet(ss, "DB_USERS", ["id", "name", "email", "role", "active"], data.users);
  return ContentService.createTextOutput("Sync Success").setMimeType(ContentService.MimeType.TEXT);
}

function updateHumanSheet(ss, name, headers, items) {
  let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clear();
  sheet.appendRow(headers);
  if (items && items.length > 0) {
    const rows = items.map(item => headers.map(h => item[h] || ""));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}
```

4. Clique em **Implantar > Nova Implantação**.
5. Tipo: **App da Web**, Executar como: **Eu**, Acesso: **Qualquer pessoa**.
6. Copie a URL e cole nas configurações do app.

