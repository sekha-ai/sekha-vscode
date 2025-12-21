import * as vscode from 'vscode';
import { MemoryController, MemoryConfig } from '@sekha/sdk';
import { SekhaTreeDataProvider } from './treeView';
import { Commands } from './commands';
import { WebviewProvider } from './webview';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Sekha extension activating...');
  
  const config = vscode.workspace.getConfiguration('sekha');
  const enabled = validateConfig(config);
  
  if (!enabled) {
    vscode.window.showWarningMessage(
      'Sekha: Configuration missing. Please set sekha.apiUrl and sekha.apiKey in settings.'
    );
    return;
  }

  const memory = createMemoryController(config);
  
  // Initialize tree view
  const treeDataProvider = new SekhaTreeDataProvider(memory);
  const treeView = vscode.window.createTreeView('sekhaExplorer', {
    treeDataProvider,
    showCollapseAll: true,
  });

  // Initialize webview provider
  const webviewProvider = new WebviewProvider(context.extensionUri);

  // Initialize commands
  const commands = new Commands(memory, treeDataProvider, webviewProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sekha.saveConversation', () => 
      commands.saveConversation()
    ),
    vscode.commands.registerCommand('sekha.search', () => 
      commands.search()
    ),
    vscode.commands.registerCommand('sekha.insertContext', () => 
      commands.insertContext()
    ),
    vscode.commands.registerCommand('sekha.refresh', () => 
      treeDataProvider.refresh()
    ),
    vscode.commands.registerCommand('sekha.viewConversation', (id: string) => 
      commands.viewConversation(id)
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
  setupAutoSave(config, commands);

  console.log('Sekha extension activated successfully!');
}

function validateConfig(config: vscode.WorkspaceConfiguration): boolean {
  const apiUrl = config.get<string>('apiUrl');
  const apiKey = config.get<string>('apiKey');
  return Boolean(apiUrl && apiKey);
}

function createMemoryController(config: vscode.WorkspaceConfiguration): MemoryController {
  const apiConfig: MemoryConfig = {
    baseURL: config.get<string>('apiUrl', 'http://localhost:8080'),
    apiKey: config.get<string>('apiKey', ''),
    timeout: 30000,
  };
  
  return new MemoryController(apiConfig);
}

function setupAutoSave(config: vscode.WorkspaceConfiguration, commands: Commands): NodeJS.Timeout | undefined {
  const autoSave = config.get<boolean>('autoSave', false);
  if (!autoSave) return;

  const intervalMinutes = config.get<number>('autoSaveInterval', 5);
  const intervalMs = intervalMinutes * 60000;
  
  if (intervalMs <= 0) return;

  return setInterval(() => {
    commands.autoSaveConversation();
  }, intervalMs);
}

export function deactivate() {
  console.log('Sekha extension deactivated');
}
