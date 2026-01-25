# Sekha VS Code Extension

> **AI Memory in Your Editor**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue.svg)](https://code.visualstudio.com)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)]()

---

## What is Sekha VS Code?

Bring Sekha memory directly into Visual Studio Code:

- ✅ Store code conversations
- ✅ Search past coding sessions
- ✅ Auto-save file changes with context
- ✅ Inline memory search
- ✅ Sidebar memory explorer

**Status:** Beta - Seeking testers!

---

## 📚 Documentation

**Complete guide: [docs.sekha.dev/integrations/vscode](https://docs.sekha.dev/integrations/vscode/)**

- [VS Code Integration Guide](https://docs.sekha.dev/integrations/vscode/)
- [Getting Started](https://docs.sekha.dev/getting-started/quickstart/)
- [API Reference](https://docs.sekha.dev/api-reference/rest-api/)

---

## 🚀 Quick Start

### 1. Install Sekha

```bash
git clone https://github.com/sekha-ai/sekha-docker.git
cd sekha-docker
docker compose up -d
```

### 2. Install Extension

**From VS Code Marketplace (coming soon):**
- Search "Sekha" in Extensions

**From source:**
```bash
git clone https://github.com/sekha-ai/sekha-vscode.git
cd sekha-vscode
npm install
npm run compile
# Press F5 in VS Code to debug
```

### 3. Configure

```json
// settings.json
{
  "sekha.apiUrl": "http://localhost:8080",
  "sekha.apiKey": "your-api-key"
}
```

---

## ✨ Features

### Current (Beta)

- ✅ Store conversations from editor
- ✅ Search memory inline
- ✅ Sidebar memory explorer
- ✅ Quick commands palette

### Roadmap

- [ ] Auto-save file changes
- [ ] Code context assembly
- [ ] Git integration
- [ ] Inline suggestions
- [ ] Workspace-wide memory

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Test
npm test

# Package
vsce package
```

---

## 🔗 Links

- **Main Repo:** [sekha-controller](https://github.com/sekha-ai/sekha-controller)
- **Docs:** [docs.sekha.dev](https://docs.sekha.dev)
- **Website:** [sekha.dev](https://sekha.dev)
- **Discord:** [discord.gg/sekha](https://discord.gg/sekha)

---

## 📄 License

AGPL-3.0 - **[License Details](https://docs.sekha.dev/about/license/)**
