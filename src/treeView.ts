import * as vscode from 'vscode';
import { SekhaClient, Conversation, Message } from '@sekha/sdk';

export class SekhaTreeDataProvider implements vscode.TreeDataProvider<SekhaTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SekhaTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private sekha: SekhaClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SekhaTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SekhaTreeItem): Promise<SekhaTreeItem[]> {
    try {
      if (!element) {
        return await this.getLabelNodes();
      } else if (element.contextValue === 'label') {
        return await this.getConversationNodes(element.label!);
      } else if (element.contextValue === 'conversation' && element.conversation) {
        return await this.getMessageNodes(element.conversation);
      }
      return [];
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load Sekha tree: ${error}`);
      return [];
    }
  }

  private async getLabelNodes(): Promise<SekhaTreeItem[]> {
    const response = await this.sekha.controller.list({ limit: 1000 });
    const conversations = response.conversations;
    const labels = [...new Set(conversations.map(c => c.label).filter(Boolean))].sort();
    
    return labels.map(label => new SekhaTreeItem(
      label || 'Unlabeled',
      vscode.TreeItemCollapsibleState.Collapsed,
      'label',
      undefined,
      undefined,
      label
    ));
  }

  private async getConversationNodes(label: string): Promise<SekhaTreeItem[]> {
    const maxConversations = vscode.workspace
      .getConfiguration('sekha')
      .get<number>('maxConversationsInTree', 100);
    
    const response = await this.sekha.controller.list({ 
      limit: maxConversations,
      filter: { label }
    });
    
    return response.conversations.map(conv => new SekhaTreeItem(
      conv.label || 'Untitled',
      vscode.TreeItemCollapsibleState.Collapsed,
      'conversation',
      conv,
      conv.id,
      undefined,
      new vscode.ThemeIcon(conv.status === 'pinned' ? 'pinned' : 'file-text')
    ));
  }

  private async getMessageNodes(conversation: Conversation): Promise<SekhaTreeItem[]> {
    return conversation.messages.map((msg: Message, index: number) => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      
      const preview = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      
      return new SekhaTreeItem(
        `${msg.role}: ${preview}`,
        vscode.TreeItemCollapsibleState.None,
        'message',
        undefined,
        undefined,
        undefined,
        new vscode.ThemeIcon(msg.role === 'user' ? 'account' : 'hubot')
      );
    });
  }
}

export class SekhaTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly conversation?: Conversation,
    public readonly conversationId?: string,
    public readonly detail?: string,
    public readonly iconPath?: vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
    
    if (contextValue === 'conversation' && conversationId) {
      this.command = {
        command: 'sekha.viewConversation',
        title: 'View Conversation',
        arguments: [conversationId]
      };
    }
  }
}