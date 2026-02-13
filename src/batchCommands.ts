import * as vscode from 'vscode';
import { SekhaClient } from '@sekha/sdk';
import { SelectionManager } from './selectionManager';
import { ExportService, ExportOptions } from './exportService';
import { MergeService, MergeOptions } from './mergeService';
import { SekhaTreeDataProvider } from './treeView';

export class BatchCommands {
  constructor(
    private sekha: SekhaClient,
    private selectionManager: SelectionManager,
    private exportService: ExportService,
    private mergeService: MergeService,
    private treeView: SekhaTreeDataProvider
  ) {}

  async selectAll(): Promise<void> {
    try {
      const response = await this.sekha.controller.list({ limit: 100 });
      const ids = response.conversations.map(c => c.id);
      
      this.selectionManager.selectAll(ids);
      
      vscode.window.showInformationMessage(
        `Selected ${ids.length} conversations`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to select all: ${message}`);
    }
  }

  async clearSelection(): Promise<void> {
    this.selectionManager.clear();
    vscode.window.showInformationMessage('Selection cleared');
  }

  async batchPin(): Promise<void> {
    await this.batchOperation(
      'pin',
      ids => Promise.all(ids.map(id => this.sekha.controller.pin(id))),
      'Pinned'
    );
  }

  async batchUnpin(): Promise<void> {
    await this.batchOperation(
      'unpin',
      ids => Promise.all(ids.map(id => this.sekha.controller.unpin(id))),
      'Unpinned'
    );
  }

  async batchArchive(): Promise<void> {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      vscode.window.showWarningMessage('No conversations selected');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `Archive ${selected.length} selected conversations?`,
      { modal: true },
      'Archive'
    );

    if (confirm !== 'Archive') return;

    await this.batchOperation(
      'archive',
      ids => Promise.all(ids.map(id => this.sekha.controller.archive(id))),
      'Archived'
    );
  }

  async batchDelete(): Promise<void> {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      vscode.window.showWarningMessage('No conversations selected');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `Permanently delete ${selected.length} conversations? This cannot be undone.`,
      { modal: true },
      'Delete'
    );

    if (confirm !== 'Delete') return;

    await this.batchOperation(
      'delete',
      ids => Promise.all(ids.map(id => this.sekha.controller.delete(id))),
      'Deleted'
    );
  }

  async batchMove(): Promise<void> {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      vscode.window.showWarningMessage('No conversations selected');
      return;
    }

    const folder = await vscode.window.showInputBox({
      prompt: 'Enter destination folder',
      placeHolder: '/vscode/archived',
    });

    if (!folder) return;

    await this.batchOperation(
      'move',
      ids => Promise.all(ids.map(id => 
        this.sekha.controller.updateFolder(id, { folder })
      )),
      `Moved to ${folder}`
    );
  }

  async batchAddTags(): Promise<void> {
    const selected = this.selectionManager.getSelected();
    if (selected.length === 0) {
      vscode.window.showWarningMessage('No conversations selected');
      return;
    }

    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma-separated)',
      placeHolder: 'python, tutorial, api',
    });

    if (!tagsInput) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) return;

    await this.batchOperation(
      'tag',
      ids => Promise.all(ids.map(id =>
        this.sekha.controller.addTags(id, tags)
      )),
      `Added tags: ${tags.join(', ')}`
    );
  }

  async batchExport(): Promise<void> {
    try {
      const selected = this.selectionManager.getSelected();
      if (selected.length === 0) {
        vscode.window.showWarningMessage('No conversations selected');
        return;
      }

      const format = await vscode.window.showQuickPick(
        [
          { label: 'Markdown', value: 'markdown' as const },
          { label: 'JSON', value: 'json' as const },
          { label: 'Plain Text', value: 'text' as const },
          { label: 'HTML', value: 'html' as const },
        ],
        { placeHolder: 'Select export format' }
      );

      if (!format) return;

      const combine = await vscode.window.showQuickPick(
        [
          { label: 'Separate Files', value: false },
          { label: 'Combined File', value: true },
        ],
        { placeHolder: 'Export as separate or combined file?' }
      );

      if (combine === undefined) return;

      const options: ExportOptions = {
        format: format.value,
        includeMetadata: true,
        combineFiles: combine.value,
      };

      // Fetch conversations
      const conversations = await Promise.all(
        selected.map(id => this.sekha.controller.get(id))
      );

      await this.exportService.batchExport(conversations, options);
      
      this.selectionManager.clear();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Batch export failed: ${message}`);
    }
  }

  async mergeConversations(): Promise<void> {
    try {
      const selected = this.selectionManager.getSelected();
      if (selected.length < 2) {
        vscode.window.showWarningMessage(
          'Select at least 2 conversations to merge'
        );
        return;
      }

      const label = await vscode.window.showInputBox({
        prompt: 'Enter label for merged conversation',
        placeHolder: 'Merged: Discussion',
      });

      if (!label) return;

      const sortBy = await vscode.window.showQuickPick(
        [
          { label: 'Chronological (by timestamp)', value: 'chronological' as const },
          { label: 'By Conversation (keep separate)', value: 'conversation' as const },
        ],
        { placeHolder: 'How should messages be sorted?' }
      );

      if (!sortBy) return;

      const deleteOriginals = await vscode.window.showQuickPick(
        [
          { label: 'Keep original conversations', value: false },
          { label: 'Delete originals after merge', value: true },
        ],
        { placeHolder: 'Delete originals after merging?' }
      );

      if (deleteOriginals === undefined) return;

      const options: MergeOptions = {
        label,
        sortBy: sortBy.value,
        deleteOriginals: deleteOriginals.value,
      };

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Merging conversations...',
        cancellable: false,
      }, async () => {
        const merged = await this.mergeService.merge(selected, options);
        
        vscode.window.showInformationMessage(
          `Merged ${selected.length} conversations into "${merged.label}"`
        );
        
        this.selectionManager.clear();
        this.treeView.refresh();
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Merge failed: ${message}`);
    }
  }

  async exportConversation(conversationId: string): Promise<void> {
    try {
      const format = await vscode.window.showQuickPick(
        [
          { label: 'Markdown', value: 'markdown' as const },
          { label: 'JSON', value: 'json' as const },
          { label: 'Plain Text', value: 'text' as const },
          { label: 'HTML', value: 'html' as const },
        ],
        { placeHolder: 'Select export format' }
      );

      if (!format) return;

      const options: ExportOptions = {
        format: format.value,
        includeMetadata: true,
      };

      const conversation = await this.sekha.controller.get(conversationId);
      await this.exportService.batchExport([conversation], options);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Export failed: ${message}`);
    }
  }

  private async batchOperation(
    operation: string,
    execute: (ids: string[]) => Promise<any>,
    successMessage: string
  ): Promise<void> {
    try {
      const selected = this.selectionManager.getSelected();
      if (selected.length === 0) {
        vscode.window.showWarningMessage('No conversations selected');
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `${operation} ${selected.length} conversations...`,
        cancellable: false,
      }, async () => {
        await execute(selected);
      });

      vscode.window.showInformationMessage(
        `${successMessage} ${selected.length} conversations`
      );
      
      this.selectionManager.clear();
      this.treeView.refresh();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Batch ${operation} failed: ${message}`
      );
    }
  }
}
