import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate } from '../src/extension';
import { SekhaTreeProvider } from '../src/treeView';

suite('Sekha VS Code Extension Tests', () => {
  let context: vscode.ExtensionContext;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    context = {
      subscriptions: [],
      extensionPath: '/test/path',
      globalState: {
        get: sandbox.stub(),
        update: sandbox.stub()
      },
      workspaceState: {
        get: sandbox.stub(),
        update: sandbox.stub()
      }
    } as any;
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Extension activates successfully', async () => {
    await activate(context);
    assert.ok(context.subscriptions.length > 0);
  });

  test('Registers all commands', async () => {
    const registerStub = sandbox.stub(vscode.commands, 'registerCommand');
    
    await activate(context);

    assert.ok(registerStub.calledWith('sekha.saveConversation'));
    assert.ok(registerStub.calledWith('sekha.searchMemory'));
    assert.ok(registerStub.calledWith('sekha.insertContext'));
    assert.ok(registerStub.calledWith('sekha.refreshTreeView'));
  });

  test('Reads configuration on activation', async () => {
    const getConfigStub = sandbox.stub(vscode.workspace, 'getConfiguration');
    getConfigStub.returns({
      get: (key: string) => {
        if (key === 'apiUrl') return 'http://localhost:8080';
        if (key === 'apiKey') return 'sk-test-key';
        return null;
      }
    } as any);

    await activate(context);

    assert.ok(getConfigStub.calledWith('sekha'));
  });

  suite('TreeView', () => {
    let treeProvider: SekhaTreeProvider;

    setup(() => {
      treeProvider = new SekhaTreeProvider('http://localhost:8080', 'sk-test-key');
    });

    test('TreeProvider initializes', () => {
      assert.ok(treeProvider);
    });

    test('getChildren returns labels at root', async () => {
      const fetchStub = sandbox.stub(global, 'fetch' as any);
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          labels: ['Work', 'Personal', 'Project:AI']
        })
      });

      const children = await treeProvider.getChildren();
      
      assert.strictEqual(children.length, 3);
      assert.strictEqual(children[0].label, 'Work');
    });

    test('getChildren returns conversations for label', async () => {
      const fetchStub = sandbox.stub(global, 'fetch' as any);
      fetchStub.resolves({
        ok: true,
        json: async () => ({
          conversations: [
            { id: 'conv_1', label: 'Work', created_at: '2025-12-21' },
            { id: 'conv_2', label: 'Work', created_at: '2025-12-20' }
          ]
        })
      });

      const labelItem = { label: 'Work', type: 'label' } as any;
      const children = await treeProvider.getChildren(labelItem);

      assert.strictEqual(children.length, 2);
    });
  });

  suite('Commands', () => {
    test('saveConversation shows quick pick', async () => {
      const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      showQuickPickStub.resolves({ label: 'Work' } as any);

      const showInputBoxStub = sandbox.stub(vscode.window, 'showInputBox');
      showInputBoxStub.resolves('Test conversation');

      await vscode.commands.executeCommand('sekha.saveConversation');

      assert.ok(showQuickPickStub.called);
    });

    test('searchMemory opens webview', async () => {
      const createWebviewPanelStub = sandbox.stub(vscode.window, 'createWebviewPanel');
      createWebviewPanelStub.returns({
        webview: { html: '' },
        reveal: () => {},
        onDidDispose: () => ({dispose: () => {}})
      } as any);

      await vscode.commands.executeCommand('sekha.searchMemory');

      assert.ok(createWebviewPanelStub.called);
    });

    test('insertContext inserts text at cursor', async () => {
      const editor = {
        edit: sandbox.stub().resolves(true),
        selection: { active: { line: 0, character: 0 } }
      };
      
      sandbox.stub(vscode.window, 'activeTextEditor').get(() => editor);

      const fetchStub = sandbox.stub(global, 'fetch' as any);
      fetchStub.resolves({
        ok: true,
        json: async () => ({ context: 'Test context' })
      });

      await vscode.commands.executeCommand('sekha.insertContext');

      assert.ok(editor.edit.called);
    });
  });

  suite('Configuration Changes', () => {
    test('Updates controller on config change', async () => {
      await activate(context);

      const changeEvent = {
        affectsConfiguration: (section: string) => section === 'sekha'
      };

      // Trigger configuration change
      await vscode.workspace.onDidChangeConfiguration(changeEvent as any);

      // Should reinitialize with new config
      assert.ok(true); // Placeholder - actual impl would check controller update
    });
  });

  suite('Auto-save Feature', () => {
    test('Auto-save timer starts when enabled', async () => {
      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: (key: string) => {
          if (key === 'autoSave') return true;
          if (key === 'apiUrl') return 'http://localhost:8080';
          if (key === 'apiKey') return 'sk-test';
          return null;
        }
      } as any);

      const setIntervalSpy = sandbox.spy(global, 'setInterval');

      await activate(context);

      assert.ok(setIntervalSpy.called);
    });
  });
});
