import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands } from '../src/commands';
import { MemoryController } from '@sekha/sdk';
import { SekhaTreeDataProvider } from '../src/treeView';
import { WebviewProvider } from '../src/webview';
import * as vscode from 'vscode';

suite('Commands', () => {
  let mockMemory: any;
  let mockTreeView: any;
  let mockWebview: any;
  let commands: Commands;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();

    mockMemory = {
      create: sandbox.stub(),
      getConversation: sandbox.stub(),
      listConversations: sandbox.stub(),
      search: sandbox.stub(),
      assembleContext: sandbox.stub(),
    };

    mockTreeView = {
      refresh: sandbox.stub(),
    };

    mockWebview = {
      getConversationHtml: sandbox.stub().returns('<html></html>'),
    };

    commands = new Commands(mockMemory, mockTreeView as any, mockWebview as any);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('saveConversation', () => {
    test('should show warning when no active editor', async () => {
      const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage');
      sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);

      await commands.saveConversation();

      assert.ok(showWarningStub.calledWith('No active editor to save from'));
    });

    test('should save conversation successfully', async () => {
      const mockEditor = {
        document: {
          getText: () => 'User: Hello\nAssistant: Hi there!',
        },
      };
      
      sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);
      sandbox.stub(vscode.window, 'showInputBox').resolves('Test Conversation');
      const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
      
      mockMemory.create.resolves({ id: '123' });

      await commands.saveConversation();

      assert.ok(mockMemory.create.calledWith({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        label: 'Test Conversation',
        folder: '/vscode',
      }));
      assert.ok(showInfoStub.calledWith('Conversation saved to Sekha!'));
    });
  });

  suite('search', () => {
    test('should handle no query', async () => {
      sandbox.stub(vscode.window, 'showInputBox').resolves('');

      await commands.search();

      assert.ok(mockMemory.search.notCalled);
    });

    test('should search and show results', async () => {
      sandbox.stub(vscode.window, 'showInputBox').resolves('test query');
      mockMemory.search.resolves([
        { id: '123', label: 'Test', score: 0.95, messages: [] },
      ]);
      
      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);

      await commands.search();

      assert.ok(mockMemory.search.calledWith('test query'));
      assert.ok(quickPickStub.called);
    });
  });
});
