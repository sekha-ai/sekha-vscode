# Changelog

All notable changes to the Sekha VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-21

### Added
- Initial release of Sekha VS Code extension
- Save conversations from editor to Sekha Memory
- Semantic search through conversation history
- Insert relevant context into current file
- Tree view sidebar for browsing conversations
- Webview panel for viewing conversation details
- Auto-save functionality with configurable intervals
- Keyboard shortcuts for all commands
- Configuration settings for API URL and key

### Features
- **Save Conversation** (`Ctrl+Shift+S`) - Save current editor content
- **Search Memory** (`Ctrl+Shift+F`) - Semantic search across conversations
- **Insert Context** (`Ctrl+Shift+I`) - Insert relevant context at cursor
- **Refresh** - Reload conversation tree
- **View Conversation** - Open conversation in webview

### Configuration
- `sekha.apiUrl` - Sekha Controller API URL
- `sekha.apiKey` - API authentication key
- `sekha.autoSave` - Enable automatic saving
- `sekha.autoSaveInterval` - Auto-save interval in minutes
- `sekha.maxConversationsInTree` - Limit conversations in sidebar
- `sekha.defaultFolder` - Default folder for saved conversations

### Technical
- Built with TypeScript 5.7
- Uses @sekha/sdk for API communication
- ESLint 9 with flat config
- Jest for testing
- Modern Node.js 18+ support
