import * as vscode from 'vscode';
import { SekhaClient, SekhaConfig } from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { Commands } from './commands';
import { WebviewProvider } from './webview';

// Export timer for testing
export let autoSaveTimer: NodeJS.Timeout | undefined;

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

  // Initialize commands
  const commands = new Commands(sekhaClient, treeDataProvider, webviewProvider);

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
    vscode.commands.registerCommand('sekha.viewConversation', (id: string) => 
      commands.viewConversation(id)
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