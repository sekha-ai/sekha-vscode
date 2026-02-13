# Sekha VS Code Extension

> **AI Memory + LLM Bridge in Your Editor**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue.svg)](https://code.visualstudio.com)
[![CI](https://github.com/sekha-ai/sekha-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/sekha-ai/sekha-vscode/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sekha-ai/sekha-vscode/branch/main/graph/badge.svg)](https://codecov.io/gh/sekha-ai/sekha-vscode)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)]()

---

## What is Sekha VS Code?

Bring Sekha memory and AI capabilities directly into Visual Studio Code:

- ✅ **Store & Search** - Save code conversations with semantic search
- ✅ **Context Assembly** - Intelligent context retrieval for LLMs
- ✅ **AI Completions** - Generate code/docs with memory-aware LLM
- ✅ **Smart Summarization** - Summarize selections with AI
- ✅ **Auto-labeling** - AI-powered label suggestions
- ✅ **Sidebar Explorer** - Browse conversations in tree view
- ✅ **Keyboard Shortcuts** - Quick access to all features

**Status:** Beta v0.2.0 - Seeking testers!

---

## 📚 Documentation

**Complete guide: [docs.sekha.dev/integrations/vscode](https://docs.sekha.dev/integrations/vscode/)**

- [VS Code Integration Guide](https://docs.sekha.dev/integrations/vscode/)
- [Getting Started](https://docs.sekha.dev/getting-started/quickstart/)
- [API Reference](https://docs.sekha.dev/api-reference/rest-api/)
- [Keyboard Shortcuts](https://docs.sekha.dev/integrations/vscode/shortcuts/)

---

## 🚀 Quick Start

### 1. Install Sekha Services

```bash
# Clone and start Sekha Controller + Bridge
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
  "sekha.bridgeUrl": "http://localhost:5001",
  "sekha.apiKey": "your-api-key-min-32-chars",
  "sekha.autoSave": false,
  "sekha.defaultFolder": "/vscode"
}
```

---

## ✨ Features

### Memory Management

- **Save Conversations** - `Ctrl+Shift+S` (Cmd+Shift+S on Mac)
  - Parse and save editor content as conversations
  - Auto-save with configurable intervals
  - Organize in custom folders

- **Search Memory** - `Ctrl+Shift+F`
  - Semantic search across all conversations
  - View relevance scores
  - Quick preview and insertion

- **Insert Context** - `Ctrl+Shift+I`
  - Assemble relevant context from memory
  - Smart token budget management
  - Insert at cursor position

### AI-Powered Features (v0.2.0)

- **AI Complete with Memory** - `Ctrl+Shift+K`
  - Generate completions using LLM Bridge
  - Automatically includes relevant memory context
  - Streaming responses

- **Summarize Selection**
  - Select text and summarize with AI
  - Choose summary level (brief/detailed)
  - Insert summary inline

- **Suggest Labels**
  - AI-powered label suggestions
  - Based on conversation content
  - One-click label application

### Sidebar Features

- **Conversation Explorer**
  - Tree view of all conversations
  - Filter by folder/label
  - Click to view in webview
  - Refresh on demand

- **Quick Actions**
  - Search and insert from tree
  - Refresh conversation list
  - Open settings

---

## 🎯 Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Sekha: Save Conversation` | `Ctrl+Shift+S` | Save editor content to Sekha |
| `Sekha: Search Memory` | `Ctrl+Shift+F` | Search conversations semantically |
| `Sekha: Insert Context` | `Ctrl+Shift+I` | Insert assembled context |
| `Sekha: Search & Insert` | `Ctrl+Shift+A` | Search and insert in one step |
| `Sekha: AI Complete with Memory` | `Ctrl+Shift+K` | Generate with LLM + memory |
| `Sekha: Summarize Selection` | - | Summarize selected text with AI |
| `Sekha: Suggest Labels` | - | Get AI label suggestions |
| `Sekha: Refresh` | - | Refresh conversation tree |
| `Sekha: View Conversation` | - | Open conversation in webview |
| `Sekha: Open Settings` | - | Open extension settings |

---

## ⚙️ Configuration Options

```json
{
  // Required
  "sekha.apiUrl": "http://localhost:8080",
  "sekha.apiKey": "your-32-char-minimum-key",
  
  // Optional - LLM Bridge
  "sekha.bridgeUrl": "http://localhost:5001",
  
  // Auto-save
  "sekha.autoSave": false,
  "sekha.autoSaveInterval": 5,  // minutes
  
  // Organization
  "sekha.defaultFolder": "/vscode",
  "sekha.maxConversationsInTree": 100
}
```

---

## 📝 Usage Examples

### Save Current File as Conversation

1. Open a file with conversation-style content:
```
User: How do I implement pagination in React?
Assistant: Here's a pagination component...
```

2. Press `Ctrl+Shift+S`
3. Enter a label (e.g., "React Pagination")
4. Conversation saved to Sekha!

### AI Complete with Memory

1. Type a prompt in editor:
```
Write a Python function to validate email addresses
```

2. Press `Ctrl+Shift+K`
3. Extension searches memory for relevant context
4. Sends prompt + context to LLM Bridge
5. Streams response back into editor

### Search and Insert Context

1. Press `Ctrl+Shift+A`
2. Type search query: "database schema design"
3. Select from results
4. Context inserted at cursor

---

## 🧪 Development

```bash
# Clone repository
git clone https://github.com/sekha-ai/sekha-vscode.git
cd sekha-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Package extension
npm run package
```

### Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests (requires running controller)
export SEKHA_BASE_URL=http://localhost:8080
export SEKHA_API_KEY=your-test-key
npm run test:integration
```

---

## 📊 Project Structure

```
sekha-vscode/
├── src/
│   ├── extension.ts      # Extension entry point
│   ├── commands.ts       # Command implementations
│   ├── treeView.ts       # Sidebar tree provider
│   └── webview.ts        # Webview provider
├── tests/
│   ├── commands.test.ts
│   ├── extension.test.ts
│   ├── treeView.test.ts
│   └── integration/      # Integration tests
├── images/
│   └── icon.png
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗺️ Roadmap

### v0.2.0 (Current)
- [x] Memory storage and search
- [x] Context assembly and insertion
- [x] AI completions with LLM Bridge
- [x] Summarization features
- [x] Label suggestions
- [x] Sidebar explorer
- [x] 70%+ test coverage

### v0.3.0 (Planned)
- [ ] Streaming UI for completions
- [ ] Conversation editing in webview
- [ ] Folder management UI
- [ ] Label management UI
- [ ] Pruning suggestions view
- [ ] Statistics dashboard

### v1.0.0 (Future)
- [ ] VS Code Marketplace publication
- [ ] Git integration
- [ ] Workspace-wide memory
- [ ] Inline suggestions
- [ ] Code action providers

---

## 🔗 Links

- **Main Repo:** [sekha-controller](https://github.com/sekha-ai/sekha-controller)
- **LLM Bridge:** [sekha-llm-bridge](https://github.com/sekha-ai/sekha-llm-bridge)
- **Python SDK:** [sekha-python-sdk](https://github.com/sekha-ai/sekha-python-sdk)
- **JS/TS SDK:** [sekha-js-sdk](https://github.com/sekha-ai/sekha-js-sdk)
- **Docs:** [docs.sekha.dev](https://docs.sekha.dev)
- **Website:** [sekha.dev](https://sekha.dev)
- **Discord:** [discord.gg/sekha](https://discord.gg/gZb7U9deKH)

---

## 📄 License

AGPL-3.0 - **[License Details](https://docs.sekha.dev/about/license/)**

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure tests pass (`npm test`)
5. Ensure linting passes (`npm run lint:fix`)
6. Submit a Pull Request

---

**Built with ❤️ by the Sekha Team**
