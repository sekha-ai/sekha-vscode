import * as vscode from 'vscode';
import { MemoryController, Conversation, SearchResult, Message } from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { WebviewProvider } from './webview';

export class Commands {
  constructor(
    private memory: MemoryController,
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

      await this.memory.store({
        messages,
        label,
        folder: '/vscode',
      });

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

      await this.memory.store({
        messages,
        label: 'Auto-saved from VS Code',
        folder: '/vscode/auto',
      });

    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  async search(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'Search Sekha memory',
        placeHolder: 'Enter search query...',
      });

      if (!query) return;

      const results = await this.memory.query(query);
      
      if (results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      const items = results.map((r: SearchResult) => ({
        label: r.label || 'Untitled',
        description: `Score: ${(r.score * 100).toFixed(1)}%`,
        detail: r.content?.substring(0, 100) || '',
        conversationId: r.conversationId,
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

  async searchAndInsert(): Promise<void> {
    try {
      const query = await vscode.window.showInputBox({
        prompt: 'Search and insert context',
        placeHolder: 'What information do you need?',
      });

      if (!query) return;

      const results = await this.memory.query(query);
      
      if (results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      const items = results.map((r: SearchResult) => ({
        label: r.label || 'Untitled',
        description: `Score: ${(r.score * 100).toFixed(1)}%`,
        detail: r.content?.substring(0, 100) || '',
        conversationId: r.conversationId,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select context to insert',
      });

      if (selected?.conversationId) {
        const conversation = await this.memory.get(selected.conversationId);
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

      const context = await this.memory.assembleContext({
        query,
        tokenBudget: 4000,
      });

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor to insert into');
        return;
      }

      await editor.edit((editBuilder: vscode.TextEditorEdit) => {
        const position = editor.selection.active;
        editBuilder.insert(position, `\n\n### Context from Sekha\n\n${context.formattedContext}\n\n`);
      });

      vscode.window.showInformationMessage('Context inserted from Sekha!');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to insert context: ${message}`);
    }
  }

  async insertConversationContext(conversation: Conversation): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('No active editor');
    }

    const contextText = conversation.messages
      .map(m => `[${m.role}] ${m.content}`)
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
      const conversation = await this.memory.get(id);
      
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
      
      if (trimmed.startsWith('User:') || trimmed.startsWith('Assistant:')) {
        if (currentRole && currentContent.length > 0) {
          messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim(),
          });
        }        
        currentRole = trimmed.startsWith('User:') ? 'user' as const : 'assistant' as const;
        currentContent = [trimmed.replace(/^(User|Assistant):\s*/, '')];
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
}