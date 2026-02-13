# Sekha VS Code Extension

> **AI Memory + LLM Bridge in Your Editor**

Persistent AI memory, semantic search, and LLM-powered features directly in Visual Studio Code.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue.svg)](https://code.visualstudio.com)
[![CI](https://github.com/sekha-ai/sekha-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/sekha-ai/sekha-vscode/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sekha-ai/sekha-vscode/branch/main/graph/badge.svg)](https://codecov.io/gh/sekha-ai/sekha-vscode)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)]()

---

## What is Sekha VS Code?

Bring Sekha's powerful memory and AI capabilities directly into Visual Studio Code:

### Core Features
- ✅ **Persistent Memory** - Store conversations with semantic search
- ✅ **Context Assembly** - Intelligent context retrieval for LLMs
- ✅ **AI Completions** - Memory-aware code/text generation
- ✅ **Smart Organization** - Folders, labels, tags, pinning
- ✅ **Batch Operations** - Multi-select actions for efficiency
- ✅ **Multi-Format Export** - MD, JSON, TXT, HTML
- ✅ **Conversation Merging** - Combine related discussions
- ✅ **Tree View Explorer** - Browse and manage conversations

**Status:** Beta v0.2.0 - Production-ready!

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

Open VS Code settings (Ctrl+,) and configure:

```json
{
  "sekha.apiUrl": "http://localhost:8080",
  "sekha.apiKey": "your-api-key-min-32-chars",
  "sekha.bridgeUrl": "http://localhost:5001"
}
```

**Get an API Key:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"description": "VS Code Extension"}'
```

---

## ✨ Features

### 💾 Memory Management

#### Save Conversations
**Command:** `Sekha: Save Conversation` (`Ctrl+Shift+S`)

- Parse editor content into structured conversations
- Automatic or manual label assignment
- Organize into custom folders
- Auto-save with configurable intervals

#### Search
**Semantic Search:** `Sekha: Search Memory` (`Ctrl+Shift+F`)
- AI-powered similarity search
- Relevance scoring
- Quick preview and insertion

**Full-Text Search:** `Sekha: Full Text Search`
- Fast keyword-based search
- Exact phrase matching
- Snippet highlighting

#### Context Assembly
**Command:** `Sekha: Insert Context` (`Ctrl+Shift+I`)

- Intelligent context retrieval
- Smart token budget management
- Multi-source aggregation
- Insert at cursor position

### 🤖 AI-Powered Features

#### AI Complete with Memory
**Command:** `Sekha: AI Complete with Memory` (`Ctrl+Shift+K`)

- Generate completions using LLM Bridge
- Automatically includes relevant memory context
- Streaming responses
- Contextually aware outputs

#### Summarization
**Command:** `Sekha: Summarize Selection`

- Select any text and summarize with AI
- Choose summary level (brief/detailed)
- Insert summary inline
- Powered by LLM Bridge

#### Smart Labeling & Tagging
**Label Suggestions:** `Sekha: Suggest Labels`
- AI-powered label suggestions
- Confidence scores
- Reasoning explanations

**Tag Suggestions:** `Sekha: Suggest Tags (AI)`
- AI analyzes conversation content
- Suggests 3-5 relevant tags
- One-click application

### 📋 Conversation Management

#### Individual Operations
- **View** - Open in webview with formatted display
- **Edit Label** - Rename conversations
- **Move to Folder** - Organize by project/topic
- **Add/Remove Tags** - Multi-tag support
- **Pin/Unpin** - Keep important conversations at top
- **Archive** - Hide old conversations
- **Delete** - Permanently remove (with confirmation)
- **Export** - Save to external files

#### Batch Operations 📦

**Select multiple conversations** then:
- **Batch Pin** - Pin selected conversations
- **Batch Archive** - Archive multiple at once
- **Batch Delete** - Delete with confirmation
- **Batch Move** - Move to same folder
- **Batch Add Tags** - Tag multiple conversations
- **Batch Export** - Export with progress tracking

**Selection Features:**
- Select All command
- Clear Selection command
- Status bar shows: `📊 Sekha: 5 selected`

### 🔄 Merge Conversations

**Command:** `Sekha: Merge Selected Conversations`

Combine multiple conversations into one:

**Sort Strategies:**
- **Chronological** - Unified timeline by timestamp
- **By Conversation** - Keep separate with dividers

**Options:**
- Custom merged label
- Destination folder
- Delete originals (optional)
- Combines all unique tags

### 💾 Export System

**Command:** `Sekha: Export Conversation` (single)  
**Command:** `Sekha: Batch Export Selected` (multiple)

**Supported Formats:**

| Format | Extension | Features |
|--------|-----------|----------|
| **Markdown** | `.md` | Human-readable, metadata headers, formatted messages |
| **JSON** | `.json` | Full structured data, machine-readable |
| **Plain Text** | `.txt` | Simple text format, no formatting |
| **HTML** | `.html` | Styled with embedded CSS, color-coded messages, print-friendly |

**Export Options:**
- Include/exclude metadata
- Combined file or separate files
- Progress tracking for batch exports
- Directory picker UI

### 🏷️ Tag System

**Multi-tag support** for powerful organization:

- **Add Tags** - Manual tag addition (comma-separated)
- **Remove Tags** - Multi-select tag removal
- **AI Suggest Tags** - Bridge analyzes content
- **Batch Add Tags** - Tag multiple conversations
- **Tag Statistics** - Most used tags (coming in Phase 5)
- **Filter by Tags** - Advanced filtering (coming in Phase 5)

**Tags vs Labels:**
- **Labels:** Single descriptive name
- **Tags:** Multiple keywords for categorization
- Both can coexist and complement each other

### 🌲 Tree View Explorer

**Sidebar View Features:**
- Browse all conversations
- Folder hierarchy
- Pin indicator (📌)
- Right-click context menus
- Quick actions toolbar
- Auto-refresh on changes

**Toolbar Actions:**
- 🔄 Refresh
- 🔍 Search
- 📊 Statistics
- ⚙️ Settings

### 📊 Memory Statistics

**Command:** `Sekha: Show Memory Statistics`

View at-a-glance statistics:
- Total conversations
- By status: Active, Pinned, Archived
- Emoji-formatted display
- Modal presentation

---

## 🎯 All Commands

### Core Operations

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Sekha: Save Conversation` | `Ctrl+Shift+S` | Save editor to Sekha |
| `Sekha: Search Memory` | `Ctrl+Shift+F` | Semantic search |
| `Sekha: Full Text Search` | - | Keyword search |
| `Sekha: Insert Context` | `Ctrl+Shift+I` | Insert assembled context |
| `Sekha: Search & Insert` | `Ctrl+Shift+A` | Search + insert |

### AI Features

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Sekha: AI Complete with Memory` | `Ctrl+Shift+K` | LLM completion |
| `Sekha: Summarize Selection` | - | Summarize text |
| `Sekha: Suggest Labels` | - | AI label suggestions |
| `Sekha: Suggest Tags (AI)` | - | AI tag suggestions |

### Conversation Management

| Command | Description |
|---------|-------------|
| `Sekha: View Conversation` | Open in webview |
| `Sekha: Edit Label` | Rename conversation |
| `Sekha: Move to Folder` | Change folder |
| `Sekha: Add Tags` | Add tags |
| `Sekha: Remove Tags` | Remove tags |
| `Sekha: Pin Conversation` | Pin to top |
| `Sekha: Unpin Conversation` | Unpin |
| `Sekha: Archive Conversation` | Archive |
| `Sekha: Delete Conversation` | Delete |
| `Sekha: Export Conversation` | Export single |

### Batch Operations

| Command | Description |
|---------|-------------|
| `Sekha: Select All Conversations` | Select all |
| `Sekha: Clear Selection` | Clear selection |
| `Sekha: Batch Pin Selected` | Pin multiple |
| `Sekha: Batch Unpin Selected` | Unpin multiple |
| `Sekha: Batch Archive Selected` | Archive multiple |
| `Sekha: Batch Delete Selected` | Delete multiple |
| `Sekha: Batch Move Selected` | Move to folder |
| `Sekha: Batch Add Tags` | Tag multiple |
| `Sekha: Batch Export Selected` | Export multiple |
| `Sekha: Merge Selected Conversations` | Merge into one |

### Utility

| Command | Description |
|---------|-------------|
| `Sekha: Show Memory Statistics` | View stats |
| `Sekha: Refresh` | Refresh tree |
| `Sekha: Open Settings` | Open settings |

**Total: 31 Commands**

---

## ⚙️ Configuration Options

### Required

```json
{
  "sekha.apiUrl": "http://localhost:8080",
  "sekha.apiKey": "your-32-char-minimum-key"
}
```

### Optional - LLM Bridge

```json
{
  "sekha.bridgeUrl": "http://localhost:5001"
}
```

### Auto-Save

```json
{
  "sekha.autoSave": false,
  "sekha.autoSaveInterval": 5  // minutes
}
```

### Organization

```json
{
  "sekha.defaultFolder": "/vscode",
  "sekha.maxConversationsInTree": 100
}
```

### Batch Operations & Export

```json
{
  "sekha.batchOperationChunkSize": 10,
  "sekha.exportDefaultFormat": "markdown",
  "sekha.exportIncludeMetadata": true
}
```

### Tags & UI

```json
{
  "sekha.tagSuggestionsEnabled": true,
  "sekha.showSelectionInStatusBar": true
}
```

---

## 📝 Usage Examples

### Example 1: Save & Search Workflow

1. **Save a conversation:**
   ```
   User: How do I implement JWT auth in Node.js?
   Assistant: Here's a complete implementation...
   ```
   Press `Ctrl+Shift+S`, enter label "JWT Auth Node"

2. **Later, search for it:**
   Press `Ctrl+Shift+F`, type "authentication"
   Select result and insert context

### Example 2: AI Complete with Memory

1. Type in editor:
   ```
   Write a Python function to validate email addresses using regex
   ```

2. Press `Ctrl+Shift+K`

3. Extension:
   - Searches memory for relevant context
   - Finds previous regex discussions
   - Sends prompt + context to LLM
   - Streams response back

### Example 3: Batch Archive Old Conversations

1. Right-click in tree → "Select All"
2. Filter to old conversations (manual deselect)
3. Right-click → "Batch Archive Selected"
4. Confirm → ✅ Archived 25 conversations

### Example 4: Export Project Documentation

1. Search for "project design"
2. Select 5 relevant conversations (Ctrl+Click)
3. Right-click → "Batch Export Selected"
4. Format: Markdown, Separate files
5. Destination: `./docs/conversations/`
6. ✅ 5 .md files created

### Example 5: Merge Related Discussions

1. Search: "API endpoints"
2. Select 3 discussions (Ctrl+Click)
3. Right-click → "Merge Selected Conversations"
4. Label: "Complete API Design"
5. Sort: Chronological
6. Keep originals: Yes
7. ✅ Merged conversation created with all unique tags

### Example 6: AI-Powered Tagging

1. Right-click conversation → "Suggest Tags (AI)"
2. Bridge analyzes content
3. Suggests: `python, flask, rest-api, authentication, jwt`
4. Select relevant tags
5. ✅ Tags applied, ready for filtering

---

## 🏗️ Architecture

### Extension Structure

```typescript
// Core Components
SekhaClient        // SDK integration
Commands           // User-facing commands
BatchCommands      // Multi-select operations
TreeDataProvider   // Sidebar tree view
WebviewProvider    // Conversation viewer

// Services
SelectionManager   // Multi-select tracking
ExportService      // Multi-format export
MergeService       // Conversation merging
TagManager         // Tag operations
```

### Data Flow

```
VS Code Editor
    ↓
Commands Layer
    ↓
Sekha SDK (@sekha/sdk)
    ↓
[Controller API] ←→ [Bridge API]
    ↓
Persistent Storage
```

---

## 🧪 Development

### Setup

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
```

### Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report (80% threshold)
npm run test:coverage

# Integration tests (requires running controller)
export SEKHA_INTEGRATION_TESTS=1
export SEKHA_BASE_URL=http://localhost:8080
export SEKHA_API_KEY=your-test-key
npm run test:integration
```

### Building & Packaging

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Package for distribution
npm run package  # Creates .vsix file

# Publish to marketplace
npm run publish
```

---

## 📊 Project Structure

```
sekha-vscode/
├── src/
│   ├── extension.ts          # Entry point
│   ├── commands.ts           # Core commands
│   ├── batchCommands.ts      # Batch operations
│   ├── treeView.ts           # Sidebar tree
│   ├── webview.ts            # Webview provider
│   ├── selectionManager.ts   # Multi-select
│   ├── exportService.ts      # Export formats
│   ├── mergeService.ts       # Conversation merge
│   └── tagManager.ts         # Tag operations
├── tests/
│   ├── *.test.ts             # Unit tests
│   └── integration/          # Integration tests
│       ├── controller.integration.test.ts
│       ├── bridge.integration.test.ts
│       └── README.md
├── images/
│   └── icon.png
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── PHASE1.md                 # Phase 1 docs
├── PHASE2.md                 # Phase 2 docs
├── PHASE3.md                 # Phase 3 docs
├── PHASE4.md                 # Phase 4 docs
├── ROADMAP.md                # v0.3.0 roadmap
└── README.md                 # This file
```

---

## 🗺️ Roadmap

### v0.2.0 (Current - Feature Complete!) ✅

**Phase 1:** Foundation
- [x] Test infrastructure (Vitest)
- [x] CI/CD pipeline
- [x] Configuration system
- [x] Basic tree view

**Phase 2:** SDK Integration
- [x] SDK v0.2.0 migration
- [x] Bridge integration
- [x] AI completion with memory
- [x] Summarization
- [x] Label suggestions

**Phase 3:** Enhanced Features
- [x] Conversation management (CRUD)
- [x] Full-text search
- [x] Memory statistics
- [x] Integration tests
- [x] Context menus

**Phase 4:** Advanced Features
- [x] Batch operations
- [x] Multi-format export
- [x] Conversation merging
- [x] Tag system
- [x] Selection manager

**Phase 5:** Production Ready (In Progress)
- [ ] Fix integration tests
- [ ] Bridge integration tests
- [ ] 80% test coverage
- [ ] E2E test workflows
- [ ] Production hardening

### v0.3.0 (Planned - Q2 2026)

**Performance & Scale:**
- [ ] Virtual scrolling for 50k conversations
- [ ] Caching layer with LRU
- [ ] Query optimization
- [ ] Debounced search
- [ ] Benchmark suite

**Advanced Filtering:**
- [ ] Filter by date range
- [ ] Filter by tags (multi-select)
- [ ] Filter by folder
- [ ] Filter by status
- [ ] Filter presets

**Scale Targets:**
| Metric | v0.2.0 | v0.3.0 Target |
|--------|--------|---------------|
| Max conversations | 1,000 | 50,000 |
| Tree load time | 500ms | 100ms |
| Search response | 1s | 200ms |
| Memory usage | 50MB | 75MB |

### v0.4.0 (Future - Q3 2026)
- [ ] Real-time collaboration
- [ ] Cross-device sync
- [ ] Workspace integration
- [ ] Offline mode

### v1.0.0 (Future - Q4 2026)
- [ ] VS Code Marketplace publication
- [ ] Enterprise features
- [ ] Analytics dashboard
- [ ] Plugin system

See [ROADMAP.md](ROADMAP.md) for detailed v0.3.0+ plans.

---

## 🔗 Links

### Sekha Ecosystem
- **Main Repo:** [sekha-controller](https://github.com/sekha-ai/sekha-controller)
- **LLM Bridge:** [sekha-llm-bridge](https://github.com/sekha-ai/sekha-llm-bridge)
- **Python SDK:** [sekha-python-sdk](https://github.com/sekha-ai/sekha-python-sdk)
- **JS/TS SDK:** [sekha-js-sdk](https://github.com/sekha-ai/sekha-js-sdk)
- **Docker:** [sekha-docker](https://github.com/sekha-ai/sekha-docker)

### Documentation & Community
- **Docs:** [docs.sekha.dev](https://docs.sekha.dev)
- **Website:** [sekha.dev](https://sekha.dev)
- **Discord:** [discord.gg/sekha](https://discord.gg/gZb7U9deKH)
- **Twitter:** [@sekha_ai](https://twitter.com/sekha_ai)

---

## 📄 License

AGPL-3.0 - **[License Details](https://docs.sekha.dev/about/license/)**

This extension is free and open source. For commercial use inquiries, see our [licensing page](https://docs.sekha.dev/about/license/).

---

## 🤝 Contributing

Contributions welcome! Please:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes with tests**
4. **Ensure tests pass** (`npm test`)
5. **Ensure coverage meets 80%** (`npm run test:coverage`)
6. **Ensure linting passes** (`npm run lint:fix`)
7. **Submit a Pull Request**

### Development Guidelines

- Write tests for all new features
- Maintain 80%+ test coverage
- Follow TypeScript best practices
- Use ESLint configuration
- Document public APIs
- Update relevant PHASE docs

### Areas Needing Help

- [ ] Additional export formats (PDF, CSV)
- [ ] Advanced search filters UI
- [ ] Performance optimization
- [ ] Additional LLM Bridge features
- [ ] Documentation improvements
- [ ] Localization (i18n)

---

## 📈 Stats

- **31 Commands** - Complete feature set
- **80% Test Coverage** - Production-ready quality
- **8 Services** - Modular architecture
- **4 Export Formats** - Flexible data portability
- **2 Search Modes** - Semantic + full-text
- **Phase 5** - Final production hardening

---

## 💡 Tips & Tricks

### Quick Context Assembly
```
Ctrl+Shift+I → Type query → Enter
= Instant context insertion
```

### AI Complete Pattern
```
Type prompt → Ctrl+Shift+K
= Memory-aware completion
```

### Batch Export Workflow
```
Search → Multi-select (Ctrl+Click) → Export → Done
= Documentation in seconds
```

### Tag Organization
```
AI Suggest Tags → Apply → Filter by tag later
= Smart categorization
```

---

**Built with ❤️ by the Sekha Team**

**Star ⭐ this repo if you find it useful!**
