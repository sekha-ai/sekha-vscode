# Sekha Memory Controller for VS Code

<div align="center">

[![VS Code Marketplace](https://img.shields.io/vscode-marketplace/v/sekha-ai.sekha-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=sekha-ai.sekha-vscode)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

Persistent AI memory and context management for VS Code. Never lose track of important conversations again.

</div>

---

## ✨ Features

- **💾 Save Conversations** - Save chat transcripts directly from your editor
- **🔍 Semantic Search** - Find relevant conversations with AI-powered search
- **📝 Insert Context** - Automatically insert relevant context into your current file
- **📂 Browse Memory** - Explore your conversation library in the sidebar
- **🔄 Auto-Save** - Optionally auto-save conversations at regular intervals
- **⌨️ Keyboard Shortcuts** - Quick access to all features
- **Activity Bar**: Browse conversations by label
- **Commands**: Save chats, search memory, insert context

---

## 🚀 Quick Start

### 1. Install Extension

Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=sekha-ai.sekha-vscode) or search for "Sekha" in VS Code Extensions.

### 2. Configure Settings

Press `Ctrl+,` (or `Cmd+,` on Mac) and search for "Sekha":

- **Sekha: API URL** - Your Sekha Controller URL (default: `http://localhost:8080`)
- **Sekha: API Key** - Your API key (get from Sekha Controller)

### 3. Start Using

- **Save Current Chat**: `Ctrl+Shift+S` (or `Cmd+Shift+S`)
- **Search Memory**: `Ctrl+Shift+F` (or `Cmd+Shift+F`)
- **Insert Context**: `Ctrl+Shift+I` (or `Cmd+Shift+I`)

---

## 📖 Usage

### Saving Conversations

1. Open a file containing a conversation (format: `User: ...` / `Assistant: ...`)
2. Press `Ctrl+Shift+S` or run command "Sekha: Save Conversation"
3. Enter a label for the conversation
4. Done! Your conversation is now saved to Sekha

### Searching Memory

1. Press `Ctrl+Shift+F` or run "Sekha: Search Memory"
2. Enter your search query
3. Select a conversation from results to view it

### Inserting Context

1. Place cursor where you want to insert context
2. Press `Ctrl+Shift+I` or run "Sekha: Insert Context"
3. Enter what context you need
4. Relevant conversations will be inserted at cursor position

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `sekha.apiUrl` | `http://localhost:8080` | Sekha Controller API URL |
| `sekha.apiKey` | `` | API key for authentication |
| `sekha.autoSave` | `false` | Enable auto-save |
| `sekha.autoSaveInterval` | `5` | Auto-save interval (minutes) |
| `sekha.maxConversationsInTree` | `100` | Max conversations in sidebar |
| `sekha.defaultFolder` | `/vscode` | Default save folder |

```json
{
  "sekha.apiUrl": "http://localhost:8080",
  "sekha.apiKey": "sk-...",
  "sekha.autoSave": true,
  "sekha.autoSaveInterval": 5
}

---

## 🎯 Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Sekha: Save Conversation | `Ctrl+Shift+S` | Save current editor content |
| Sekha: Search Memory | `Ctrl+Shift+F` | Search Sekha memory |
| Sekha: Insert Context | `Ctrl+Shift+I` | Insert relevant context | Insert context into chat - Add context to current chat
| Sekha: Refresh | - | Refresh sidebar | Reload conversation tree
| Sekha: View Conversation | - | Open conversation in viewer |

---

## 📋 Requirements

- **Sekha Controller** must be running
- **API Key** configured in settings
- VS Code **1.85.0** or higher

---

Usage
Set API URL and key in settings
Use commands from command palette (Ctrl+Shift+P)
Browse conversations in Activity Bar
Click to view conversation details


Create `sekha-vscode/src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { MemoryController, MemoryConfig } from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { SekhaCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('sekha');
  
  const memory = new MemoryController({
    baseURL: config.get('apiUrl', 'http://localhost:8080'),
    apiKey: config.get('apiKey', ''),
  });

  // Tree view
  const treeDataProvider = new SekhaTreeDataProvider(memory);
  vscode.window.registerTreeDataProvider('sekhaExplorer', treeDataProvider);

  // Commands
  const commands = new SekhaCommands(memory, treeDataProvider);
  
  context.subscriptions.push(
    vscode.commands.registerCommand('sekha.saveConversation', 
      () => commands.saveConversation()),
    vscode.commands.registerCommand('sekha.search', 
      () => commands.search()),
    vscode.commands.registerCommand('sekha.insertContext', 
      () => commands.insertContext()),
    vscode.commands.registerCommand('sekha.refresh', 
      () => treeDataProvider.refresh()),
    vscode.commands.registerCommand('sekha.viewConversation', 
      (id: string) => commands.viewConversation(id))
  );

  // Auto-save
  if (config.get('autoSave', false)) {
    const interval = config.get('autoSaveInterval', 5) * 60000;
    setInterval(() => commands.saveConversation(), interval);
  }
}

export function deactivate() {}

---

## 🐛 Troubleshooting

### "Configuration missing" warning

Make sure both `sekha.apiUrl` and `sekha.apiKey` are set in settings.

### Conversations not loading

1. Check Sekha Controller is running at configured URL
2. Verify API key is correct (minimum 32 characters)
3. Check network connectivity

### Tree view empty

Click the refresh button in the Sekha sidebar or run "Sekha: Refresh" command.

---

## 📜 License

AGPL-3.0 - See [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Homepage**: [sekha.ai](https://sekha.ai)
- **GitHub**: [sekha-ai/sekha-vscode](https://github.com/sekha-ai/sekha-vscode)
- **Issues**: [Report a bug](https://github.com/sekha-ai/sekha-vscode/issues)

---

<div align="center">

Made with ❤️ by the Sekha team

</div>


