import * as vscode from 'vscode';
import { 
  SekhaClient,
  Conversation, 
  QueryResponse,
  Message,
  CreateConversationRequest,
  ContextAssembleRequest,
  FullTextSearchResponse
} from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { WebviewProvider } from './webview';

export class Commands {
  constructor(
    private sekha: SekhaClient,
    private treeView: SekhaTreeDataProvider,
    private webview: WebviewProvider
  ) {}

  async saveConversation(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor to save from');
        return;
      }

      const content = editor.document.getText();
      if (!content.trim()) {
        vscode.window.showWarningMessage('Editor is empty');
        return;
      }

      const messages = this.parseMessages(content);
      
      const label = await vscode.window.showInputBox({
        prompt: 'Enter conversation label',
        value: 'Saved from VS Code',
      });

      if (!label) return;

      const defaultFolder = vscode.workspace
        .getConfiguration('sekha')
        .get<string>('defaultFolder', '/vscode');

      const request: CreateConversationRequest = {
        messages,
        label,
        folder: defaultFolder,
      };

      await this.sekha.controller.create(request);

      vscode.window.showInformationMessage('Conversation saved to Sekha!');
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to save conversation: ${message}`);
    }
  }

  async autoSaveConversation(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const content = editor.document.getText();
      if (!content.trim()) return;

      const messages = this.parseMessages(content);
      if (messages.length === 0) return;

      const defaultFolder = vscode.workspace
        .getConfiguration('sekha')
        .get<string>('defaultFolder', '/vscode');

      await this.sekha.controller.create({
        messages,
        label: 'Auto-saved from VS Code',
        folder: `${defaultFolder}/auto`,
      });

    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  async search(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'Search Sekha memory (semantic)',
        placeHolder: 'Enter search query...',
      });

      if (!query) return;

      const response: QueryResponse = await this.sekha.controller.query({
        query,
        limit: 10,
      });
      
      if (response.results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      const items = response.results.map(r => ({
        label: r.label || 'Untitled',
        description: `Score: ${(r.score * 100).toFixed(1)}% | ${r.folder || '/'}`,
        detail: this.extractContent(r.conversation).substring(0, 100) || '',
        conversationId: r.conversation_id,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select conversation to view',
      });

      if (selected?.conversationId) {
        await this.viewConversation(selected.conversationId);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Search failed: ${message}`);
    }
  }

  async fullTextSearch(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'Full-text search Sekha memory',
        placeHolder: 'Enter keywords...',
      });

      if (!query) return;

      const response: FullTextSearchResponse = await this.sekha.controller.fullTextSearch({
        query,
        limit: 10,
      });
      
      if (response.results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      const items = response.results.map(r => ({
        label: r.label || 'Untitled',
        description: `${r.folder || '/'}`,
        detail: r.snippet || this.extractContent(r.conversation).substring(0, 100),
        conversationId: r.conversation_id,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select conversation to view',
      });

      if (selected?.conversationId) {
        await this.viewConversation(selected.conversationId);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Full-text search failed: ${message}`);
    }
  }

  async searchAndInsert(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'Search and insert context',
        placeHolder: 'What information do you need?',
      });

      if (!query) return;

      const response: QueryResponse = await this.sekha.controller.query({
        query,
        limit: 5,
      });
      
      if (response.results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      const items = response.results.map(r => ({
        label: r.label || 'Untitled',
        description: `Score: ${(r.score * 100).toFixed(1)}%`,
        detail: this.extractContent(r.conversation).substring(0, 100) || '',
        conversationId: r.conversation_id,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select context to insert',
      });

      if (selected?.conversationId) {
        const conversation = await this.sekha.controller.get(selected.conversationId);
        await this.insertConversationContext(conversation);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Search and insert failed: ${message}`);
    }
  }

  async insertContext(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'What context do you need?',
        placeHolder: 'Enter query for context assembly...',
      });

      if (!query) return;

      const request: ContextAssembleRequest = {
        query,
        context_budget: 4000,
      };

      const context = await this.sekha.controller.assembleContext(request);

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor to insert into');
        return;
      }

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const position = editor.selection.active;
        editBuilder.insert(position, `\n\n### Context from Sekha\n\n${context.assembled_context}\n\n`);
      });

      vscode.window.showInformationMessage(
        `Context inserted! (${context.conversations_used} conversations, ${context.tokens_used} tokens)`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to insert context: ${message}`);
    }
  }

  async aiComplete(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      let prompt = editor.document.getText(editor.selection);
      if (!prompt) {
        const line = editor.document.lineAt(editor.selection.active.line);
        prompt = line.text;
      }

      if (!prompt.trim()) {
        vscode.window.showWarningMessage('No text selected or at cursor');
        return;
      }

      const response = await this.sekha.controller.query({
        query: prompt,
        limit: 3,
      });

      let contextText = '';
      if (response.results.length > 0) {
        contextText = '\n\nRelevant context from memory:\n';
        response.results.forEach((r, i) => {
          contextText += `\n[${i + 1}] ${r.label}\n${this.extractContent(r.conversation).substring(0, 200)}...\n`;
        });
      }

      const completion = await this.sekha.bridge.complete({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coding assistant. Use the provided context from memory to give accurate responses.'
          },
          {
            role: 'user',
            content: prompt + contextText
          }
        ],
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const position = editor.selection.active;
        editBuilder.insert(position, `\n\n### AI Response (with memory context)\n\n${aiResponse}\n\n`);
      });

      vscode.window.showInformationMessage(
        `AI completion inserted! (${response.results.length} memory contexts used)`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`AI completion failed: ${message}`);
    }
  }

  async summarizeSelection(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage('No text selected');
        return;
      }

      const level = await vscode.window.showQuickPick(
        [
          { label: 'Brief', value: 'brief' },
          { label: 'Detailed', value: 'detailed' },
        ],
        { placeHolder: 'Select summary level' }
      );

      if (!level) return;

      const summary = await this.sekha.bridge.summarize({
        text: selection,
        level: level.value as 'brief' | 'detailed',
      });

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const position = editor.selection.end;
        editBuilder.insert(
          position,
          `\n\n### Summary (${level.label})\n\n${summary.summary}\n\n`
        );
      });

      vscode.window.showInformationMessage('Summary inserted!');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Summarization failed: ${message}`);
    }
  }

  async suggestLabels(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const content = editor.document.getText();
      if (!content.trim()) {
        vscode.window.showWarningMessage('Editor is empty');
        return;
      }

      const messages = this.parseMessages(content);
      if (messages.length === 0) {
        vscode.window.showWarningMessage('No conversation found in editor');
        return;
      }

      const suggestions = await this.sekha.controller.suggestLabel({
        messages,
        count: 5,
      });

      if (suggestions.suggestions.length === 0) {
        vscode.window.showInformationMessage('No label suggestions available');
        return;
      }

      const items = suggestions.suggestions.map(s => ({
        label: s.label,
        description: `Confidence: ${(s.confidence * 100).toFixed(1)}%`,
        detail: s.reasoning,
        value: s.label,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a label suggestion',
      });

      if (selected) {
        vscode.window.showInformationMessage(
          `Selected label: "${selected.value}". Use this when saving the conversation.`
        );
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Label suggestion failed: ${message}`);
    }
  }

  async editLabel(conversationId: string): Promise<void> {
    try {
      const conversation = await this.sekha.controller.get(conversationId);
      
      const newLabel = await vscode.window.showInputBox({
        prompt: 'Enter new label',
        value: conversation.label,
      });

      if (!newLabel || newLabel === conversation.label) return;

      await this.sekha.controller.updateLabel(conversationId, { label: newLabel });

      vscode.window.showInformationMessage(`Label updated to "${newLabel}"`);
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to edit label: ${message}`);
    }
  }

  async moveFolder(conversationId: string): Promise<void> {
    try {
      const conversation = await this.sekha.controller.get(conversationId);
      
      const newFolder = await vscode.window.showInputBox({
        prompt: 'Enter folder path',
        value: conversation.folder || '/',
        placeHolder: '/vscode/archived',
      });

      if (!newFolder || newFolder === conversation.folder) return;

      await this.sekha.controller.updateFolder(conversationId, { folder: newFolder });

      vscode.window.showInformationMessage(`Moved to folder "${newFolder}"`);
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to move folder: ${message}`);
    }
  }

  async pinConversation(conversationId: string): Promise<void> {
    try {
      await this.sekha.controller.pin(conversationId);

      vscode.window.showInformationMessage('Conversation pinned');
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to pin conversation: ${message}`);
    }
  }

  async unpinConversation(conversationId: string): Promise<void> {
    try {
      await this.sekha.controller.unpin(conversationId);

      vscode.window.showInformationMessage('Conversation unpinned');
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to unpin conversation: ${message}`);
    }
  }

  async archiveConversation(conversationId: string): Promise<void> {
    try {
      const confirm = await vscode.window.showWarningMessage(
        'Archive this conversation?',
        { modal: true },
        'Archive'
      );

      if (confirm !== 'Archive') return;

      await this.sekha.controller.archive(conversationId);

      vscode.window.showInformationMessage('Conversation archived');
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to archive conversation: ${message}`);
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const confirm = await vscode.window.showWarningMessage(
        'Permanently delete this conversation? This cannot be undone.',
        { modal: true },
        'Delete'
      );

      if (confirm !== 'Delete') return;

      await this.sekha.controller.delete(conversationId);

      vscode.window.showInformationMessage('Conversation deleted');
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to delete conversation: ${message}`);
    }
  }

  async showStats(): Promise<void> {
    try {
      const stats = await this.sekha.controller.count();

      const message = `
📊 Memory Statistics

Total Conversations: ${stats.total}
By Status:
  • Active: ${stats.by_status?.active || 0}
  • Pinned: ${stats.by_status?.pinned || 0}
  • Archived: ${stats.by_status?.archived || 0}
      `.trim();

      vscode.window.showInformationMessage(message, { modal: true });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to load statistics: ${message}`);
    }
  }

  async insertConversationContext(conversation: Conversation): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('No active editor');
    }

    const contextText = conversation.messages
      .map(m => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `[${m.role}] ${content}`;
      })
      .join('\n\n');

    await editor.edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.insert(
        editor.selection.active,
        `\n\n<!-- Context from "${conversation.label}" -->\n${contextText}\n\n`
      );
    });

    vscode.window.showInformationMessage(`Context inserted from "${conversation.label}"`);
  }

  async viewConversation(id: string): Promise<void> {
    try {
      const conversation = await this.sekha.controller.get(id);
      
      const panel = vscode.window.createWebviewPanel(
        'sekhaConversation',
        conversation.label || 'Conversation',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = this.webview.getConversationHtml(conversation);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to load conversation: ${message}`);
    }
  }

  async openSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'sekha');
  }

  private parseMessages(content: string): Message[] {
    const messages: Message[] = [];
    const lines = content.split('\n');
    
    let currentRole: 'user' | 'assistant' | 'system' | null = null;
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('User:') || trimmed.startsWith('Assistant:') || trimmed.startsWith('System:')) {
        if (currentRole && currentContent.length > 0) {
          messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim(),
          });
        }
        
        if (trimmed.startsWith('User:')) {
          currentRole = 'user' as const;
        } else if (trimmed.startsWith('Assistant:')) {
          currentRole = 'assistant' as const;
        } else {
          currentRole = 'system' as const;
        }
        
        currentContent = [trimmed.replace(/^(User|Assistant|System):\s*/, '')];
      } else if (trimmed && currentRole) {
        currentContent.push(line);
      }
    }
    
    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join('\n').trim(),
      });
    }
    
    return messages;
  }

  private extractContent(conversation: Conversation): string {
    return conversation.messages
      .map(m => {
        if (typeof m.content === 'string') {
          return m.content;
        }
        return JSON.stringify(m.content);
      })
      .join(' ')
      .trim();
  }
}