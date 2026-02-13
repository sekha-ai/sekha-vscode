# Phase 3: Enhanced Features & Integration Tests

Phase 3 adds advanced conversation management features, full-text search, statistics, and comprehensive integration tests.

## ✨ New Features

### 1. Conversation Management

#### Edit Label
- Right-click conversation in tree → "Edit Label"
- Update conversation labels in-place
- Command: `sekha.editLabel`

#### Move to Folder
- Organize conversations into folders
- Right-click → "Move to Folder"
- Command: `sekha.moveFolder`

#### Pin/Unpin
- Pin important conversations to top
- Right-click → "Pin Conversation"
- Pinned conversations show pin icon
- Commands: `sekha.pinConversation`, `sekha.unpinConversation`

#### Archive
- Archive old conversations
- Right-click → "Archive Conversation"
- Confirmation dialog prevents accidents
- Command: `sekha.archiveConversation`

#### Delete
- Permanently delete conversations
- Right-click → "Delete Conversation"
- Modal confirmation required
- Command: `sekha.deleteConversation`

### 2. Search Enhancements

#### Full-Text Search
- Fast keyword-based search
- Command: `sekha.fullTextSearch`
- Searches all conversation content
- Returns snippets with matches highlighted

```typescript
// Usage
const response = await client.controller.fullTextSearch({
  query: 'python flask',
  limit: 10,
});
```

#### Semantic Search (existing)
- AI-powered similarity search
- Command: `sekha.search`
- Finds conceptually related content

### 3. Memory Statistics

#### Show Stats
- View memory usage statistics
- Command: `sekha.showStats`
- Shows:
  - Total conversations
  - By status: active, pinned, archived
  - Available via tree view toolbar

```typescript
const stats = await client.controller.count();
// { total: 150, by_status: { active: 120, pinned: 5, archived: 25 } }
```

## 🧪 Integration Tests

### Controller Tests

**Location**: `tests/integration/controller.integration.test.ts`

**Coverage**:
- ✅ Create conversations
- ✅ Get conversation by ID
- ✅ List with pagination
- ✅ Semantic query
- ✅ Full-text search
- ✅ Update label
- ✅ Update folder
- ✅ Pin/unpin
- ✅ Archive/delete
- ✅ Count statistics
- ✅ Assemble context

**Running**:
```bash
# Enable integration tests
export SEKHA_INTEGRATION_TESTS=1
export SEKHA_API_KEY="your-api-key"

# Run tests
npm run test:integration
```

See [tests/integration/README.md](tests/integration/README.md) for details.

## 📋 Context Menus

### Tree View Item Context Menu

When right-clicking a conversation:

1. **View** (👁️)
   - Open conversation in webview

2. **Edit & Organize**
   - Edit Label (✏️)
   - Move to Folder (📁)

3. **Manage**
   - Pin Conversation (📌)
   - Archive Conversation (📦)

4. **Danger**
   - Delete Conversation (🗑️)

### Tree View Title Bar

1. **Refresh** (🔄)
2. **Search** (🔍)
3. **Statistics** (📊)
4. **Settings** (⚙️)

## 🎯 Updated Commands

### New Commands

| Command | Keyboard | Description |
|---------|----------|-------------|
| `sekha.fullTextSearch` | - | Full-text keyword search |
| `sekha.editLabel` | - | Edit conversation label |
| `sekha.moveFolder` | - | Move to different folder |
| `sekha.pinConversation` | - | Pin conversation |
| `sekha.unpinConversation` | - | Unpin conversation |
| `sekha.archiveConversation` | - | Archive conversation |
| `sekha.deleteConversation` | - | Delete permanently |
| `sekha.showStats` | - | Show memory statistics |

### Existing Commands (from Phases 1-2)

| Command | Keyboard | Description |
|---------|----------|-------------|
| `sekha.saveConversation` | Ctrl+Shift+S | Save to memory |
| `sekha.search` | Ctrl+Shift+F | Semantic search |
| `sekha.searchAndInsert` | Ctrl+Shift+A | Search & insert |
| `sekha.insertContext` | Ctrl+Shift+I | Insert assembled context |
| `sekha.aiComplete` | Ctrl+Shift+K | AI complete with memory |
| `sekha.summarizeSelection` | - | Summarize selected text |
| `sekha.suggestLabels` | - | AI label suggestions |
| `sekha.refresh` | - | Refresh tree view |
| `sekha.viewConversation` | - | View in webview |
| `sekha.openSettings` | - | Open settings |

## 🏗️ Architecture Updates

### Commands Class

**New Methods**:
```typescript
class Commands {
  // Conversation management
  async editLabel(id: string): Promise<void>
  async moveFolder(id: string): Promise<void>
  async pinConversation(id: string): Promise<void>
  async unpinConversation(id: string): Promise<void>
  async archiveConversation(id: string): Promise<void>
  async deleteConversation(id: string): Promise<void>
  
  // Search
  async fullTextSearch(): Promise<void>
  
  // Statistics
  async showStats(): Promise<void>
}
```

### SDK Integration

**New SDK Methods Used**:
```typescript
// Controller
client.controller.fullTextSearch({ query, limit })
client.controller.updateLabel(id, { label })
client.controller.updateFolder(id, { folder })
client.controller.pin(id)
client.controller.unpin(id)
client.controller.archive(id)
client.controller.delete(id)
client.controller.count()
```

## 📦 Package Updates

### Commands Added to `package.json`

```json
{
  "contributes": {
    "commands": [
      // ... existing commands
      { "command": "sekha.fullTextSearch", "title": "Sekha: Full Text Search" },
      { "command": "sekha.editLabel", "title": "Sekha: Edit Label" },
      { "command": "sekha.moveFolder", "title": "Sekha: Move to Folder" },
      { "command": "sekha.pinConversation", "title": "Sekha: Pin Conversation" },
      { "command": "sekha.archiveConversation", "title": "Sekha: Archive Conversation" },
      { "command": "sekha.deleteConversation", "title": "Sekha: Delete Conversation" },
      { "command": "sekha.showStats", "title": "Sekha: Show Memory Statistics" }
    ]
  }
}
```

### Context Menu Groups

```json
{
  "menus": {
    "view/item/context": [
      { "group": "1_view@1" },      // View
      { "group": "2_edit@1" },      // Edit Label
      { "group": "2_edit@2" },      // Move Folder
      { "group": "3_manage@1" },    // Pin
      { "group": "3_manage@2" },    // Archive
      { "group": "4_danger@1" }     // Delete
    ]
  }
}
```

## 🧪 Testing

### Unit Tests

All new features have unit test coverage:
- `tests/commands.test.ts` - Management command tests
- `tests/treeView.test.ts` - Tree view updates
- `tests/extension.test.ts` - Command registration

### Integration Tests

Real controller integration:
- `tests/integration/controller.integration.test.ts`

Run with:
```bash
export SEKHA_INTEGRATION_TESTS=1
export SEKHA_API_KEY="your-key"
npm run test:integration
```

### Coverage Goals

- Unit tests: **75%+** (current threshold)
- Integration tests: **All major workflows**

## 🚀 Usage Examples

### 1. Organize Conversations

```
1. Right-click conversation in tree
2. Select "Move to Folder"
3. Enter: /projects/vscode-extension
4. Conversation moves to new location
```

### 2. Pin Important Conversations

```
1. Right-click conversation
2. Select "Pin Conversation"
3. Conversation shows pin icon
4. Appears at top of list
```

### 3. Full-Text Search

```
1. Open command palette (Ctrl+Shift+P)
2. Type "Sekha: Full Text Search"
3. Enter keywords: "python flask REST API"
4. View results with matching snippets
5. Select to open conversation
```

### 4. View Statistics

```
1. Click statistics icon in tree view toolbar
2. See modal with:
   - Total conversations: 150
   - Active: 120
   - Pinned: 5
   - Archived: 25
```

## 🔄 Migration from Phase 2

No breaking changes. Phase 3 is additive:

- ✅ All Phase 2 features still work
- ✅ New commands opt-in via context menus
- ✅ Existing shortcuts unchanged
- ✅ Configuration compatible

## 📊 Performance

### Full-Text Search vs Semantic Search

| Feature | Full-Text | Semantic |
|---------|-----------|----------|
| Speed | ⚡ Very Fast | 🐌 Slower |
| Accuracy | 🎯 Exact matches | 🧠 Conceptual |
| Use case | Keywords | Meaning |

**Recommendation**: Use full-text for known keywords, semantic for exploratory search.

## 🔮 Future Enhancements

Potential Phase 4 features:
- Batch operations (multi-select)
- Conversation merging
- Export conversations
- Tags in addition to labels
- Advanced filtering UI
- Conversation history/versions
- Collaborative features

## 📝 Changelog

### Added
- Conversation label editing
- Folder management
- Pin/unpin functionality
- Archive conversations
- Delete conversations with confirmation
- Full-text search
- Memory statistics panel
- Integration tests for controller
- Context menus for tree items
- README for integration testing

### Changed
- Enhanced tree view context menus
- Added statistics toolbar icon
- Improved error messages

### Fixed
- N/A (new features)

---

**Phase 3 Status**: ✅ Ready for review
