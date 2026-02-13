import * as vscode from 'vscode';
import { SekhaClient, SekhaConfig } from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { Commands } from './commands';
import { BatchCommands } from './batchCommands';
import { WebviewProvider } from './webview';
import { SelectionManager } from './selectionManager';
import { ExportService } from './exportService';
import { MergeService } from './mergeService';
import { TagManager } from './tagManager';

// Export timer for testing
export let autoSaveTimer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Sekha extension activating...');
  
  const config = vscode.workspace.getConfiguration('sekha');
  const enabled = validateConfig(config);
  
  if (!enabled) {
    vscode.window.showWarningMessage(
      'Sekha: Configuration missing. Please set sekha.apiUrl and sekha.apiKey in settings.'
    );
    return;
  }

  const sekhaClient = createSekhaClient(config);
  
  // Initialize tree view
  const treeDataProvider = new SekhaTreeDataProvider(sekhaClient);
  const treeView = vscode.window.createTreeView('sekhaExplorer', {
    treeDataProvider,
    showCollapseAll: true,
  });

  // Initialize webview provider
  const webviewProvider = new WebviewProvider(context.extensionUri);

  // Initialize services
  const selectionManager = new SelectionManager();
  const exportService = new ExportService();
  const mergeService = new MergeService(sekhaClient);
  const tagManager = new TagManager(sekhaClient);

  // Initialize commands
  const commands = new Commands(sekhaClient, treeDataProvider, webviewProvider);
  const batchCommands = new BatchCommands(
    sekhaClient,
    selectionManager,
    exportService,
    mergeService,
    treeDataProvider
  );

  // Create status bar item for selection
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.hide();
  context.subscriptions.push(statusBarItem);

  // Update status bar on selection change
  selectionManager.onDidChangeSelection((selected) => {
    if (selected.length > 0) {
      statusBarItem.text = `📊 Sekha: ${selected.length} selected`;
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  });

  // Register core commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sekha.saveConversation', () => 
      commands.saveConversation()
    ),
    vscode.commands.registerCommand('sekha.search', () => 
      commands.search()
    ),
    vscode.commands.registerCommand('sekha.fullTextSearch', () => 
      commands.fullTextSearch()
    ),
    vscode.commands.registerCommand('sekha.insertContext', () => 
      commands.insertContext()
    ),
    vscode.commands.registerCommand('sekha.searchAndInsert', () => 
      commands.searchAndInsert()
    ),
    
    // AI/Bridge commands
    vscode.commands.registerCommand('sekha.aiComplete', () => 
      commands.aiComplete()
    ),
    vscode.commands.registerCommand('sekha.summarizeSelection', () => 
      commands.summarizeSelection()
    ),
    vscode.commands.registerCommand('sekha.suggestLabels', () => 
      commands.suggestLabels()
    ),
    
    // Conversation management commands
    vscode.commands.registerCommand('sekha.viewConversation', (item: any) => 
      commands.viewConversation(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.editLabel', (item: any) => 
      commands.editLabel(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.moveFolder', (item: any) => 
      commands.moveFolder(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.pinConversation', (item: any) => 
      commands.pinConversation(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.unpinConversation', (item: any) => 
      commands.unpinConversation(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.archiveConversation', (item: any) => 
      commands.archiveConversation(item.conversationId)
    ),
    vscode.commands.registerCommand('sekha.deleteConversation', (item: any) => 
      commands.deleteConversation(item.conversationId)
    ),
    
    // Batch operations
    vscode.commands.registerCommand('sekha.selectAll', () => 
      batchCommands.selectAll()
    ),
    vscode.commands.registerCommand('sekha.clearSelection', () => 
      batchCommands.clearSelection()
    ),
    vscode.commands.registerCommand('sekha.batchPin', () => 
      batchCommands.batchPin()
    ),
    vscode.commands.registerCommand('sekha.batchUnpin', () => 
      batchCommands.batchUnpin()
    ),
    vscode.commands.registerCommand('sekha.batchArchive', () => 
      batchCommands.batchArchive()
    ),
    vscode.commands.registerCommand('sekha.batchDelete', () => 
      batchCommands.batchDelete()
    ),
    vscode.commands.registerCommand('sekha.batchMove', () => 
      batchCommands.batchMove()
    ),
    vscode.commands.registerCommand('sekha.batchAddTags', () => 
      batchCommands.batchAddTags()
    ),
    vscode.commands.registerCommand('sekha.batchExport', () => 
      batchCommands.batchExport()
    ),
    vscode.commands.registerCommand('sekha.mergeConversations', () => 
      batchCommands.mergeConversations()
    ),
    vscode.commands.registerCommand('sekha.exportConversation', (item: any) => 
      batchCommands.exportConversation(item.conversationId)
    ),
    
    // Tag commands
    vscode.commands.registerCommand('sekha.addTags', async (item: any) => {
      const tagsInput = await vscode.window.showInputBox({
        prompt: 'Enter tags (comma-separated)',
        placeHolder: 'python, tutorial, api',
      });
      
      if (!tagsInput) return;
      
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length === 0) return;
      
      try {
        await tagManager.addTags(item.conversationId, tags);
        vscode.window.showInformationMessage(`Added tags: ${tags.join(', ')}`);
        treeDataProvider.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to add tags: ${message}`);
      }
    }),
    vscode.commands.registerCommand('sekha.removeTags', async (item: any) => {
      try {
        const existingTags = await tagManager.getTags(item.conversationId);
        
        if (existingTags.length === 0) {
          vscode.window.showInformationMessage('No tags to remove');
          return;
        }
        
        const selected = await vscode.window.showQuickPick(existingTags, {
          canPickMany: true,
          placeHolder: 'Select tags to remove',
        });
        
        if (!selected || selected.length === 0) return;
        
        await tagManager.removeTags(item.conversationId, selected);
        vscode.window.showInformationMessage(`Removed tags: ${selected.join(', ')}`);
        treeDataProvider.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to remove tags: ${message}`);
      }
    }),
    vscode.commands.registerCommand('sekha.suggestTags', async (item: any) => {
      try {
        const suggestions = await tagManager.suggestTags(item.conversationId);
        
        if (suggestions.length === 0) {
          vscode.window.showInformationMessage('No tag suggestions available');
          return;
        }
        
        const selected = await vscode.window.showQuickPick(suggestions, {
          canPickMany: true,
          placeHolder: 'Select tags to add',
        });
        
        if (!selected || selected.length === 0) return;
        
        await tagManager.addTags(item.conversationId, selected);
        vscode.window.showInformationMessage(`Added suggested tags: ${selected.join(', ')}`);
        treeDataProvider.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to suggest tags: ${message}`);
      }
    }),
    
    // Utility commands
    vscode.commands.registerCommand('sekha.showStats', () => 
      commands.showStats()
    ),
    vscode.commands.registerCommand('sekha.refresh', () => 
      treeDataProvider.refresh()
    ),
    vscode.commands.registerCommand('sekha.openSettings', () => 
      commands.openSettings()
    ),
    
    // Tree view
    treeView,
    
    // Configuration watcher
    vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('sekha')) {
        vscode.commands.executeCommand('sekha.refresh');
      }
    })
  );

  // Auto-save setup
  autoSaveTimer = setupAutoSave(config, commands);

  console.log('Sekha extension activated successfully!');
}

function validateConfig(config: vscode.WorkspaceConfiguration): boolean {
  const apiUrl = config.get<string>('apiUrl');
  const apiKey = config.get<string>('apiKey');
  return Boolean(apiUrl && apiKey && apiKey.length >= 32);
}

function createSekhaClient(config: vscode.WorkspaceConfiguration): SekhaClient {
  const sekhaConfig: SekhaConfig = {
    controllerURL: config.get<string>('apiUrl', 'http://localhost:8080'),
    apiKey: config.get<string>('apiKey', ''),
    bridgeURL: config.get<string>('bridgeUrl'),
    timeout: 30000,
  };
  
  return new SekhaClient(sekhaConfig);
}

function setupAutoSave(config: vscode.WorkspaceConfiguration, commands: Commands): NodeJS.Timeout | undefined {
  const autoSave = config.get<boolean>('autoSave', false);
  if (!autoSave) return undefined;

  const intervalMinutes = config.get<number>('autoSaveInterval', 5);
  const intervalMs = Math.max(60000, intervalMinutes * 60000); // Minimum 1 minute
  
  return setInterval(() => {
    commands.autoSaveConversation().catch(err => {
      console.error('Auto-save failed:', err);
    });
  }, intervalMs);
}

export function deactivate(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = undefined;
  }
  console.log('Sekha extension deactivated');
}
