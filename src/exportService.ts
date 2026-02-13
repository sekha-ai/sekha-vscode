import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Conversation, Message } from '@sekha/sdk';

export type ExportFormat = 'markdown' | 'json' | 'text' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  outputPath?: string;
  combineFiles?: boolean;
}

export class ExportService {
  async exportConversation(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<string> {
    switch (options.format) {
      case 'markdown':
        return this.exportToMarkdown(conversation, options.includeMetadata);
      case 'json':
        return this.exportToJSON(conversation, options.includeMetadata);
      case 'text':
        return this.exportToText(conversation);
      case 'html':
        return this.exportToHTML(conversation, options.includeMetadata);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async batchExport(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<void> {
    const outputPath = options.outputPath || await this.pickOutputDirectory();
    if (!outputPath) {
      throw new Error('No output path selected');
    }

    // Ensure directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    if (options.combineFiles) {
      await this.exportCombined(conversations, outputPath, options);
    } else {
      await this.exportSeparate(conversations, outputPath, options);
    }
  }

  private async exportCombined(
    conversations: Conversation[],
    outputPath: string,
    options: ExportOptions
  ): Promise<void> {
    const combined = conversations.map(c => 
      this.exportConversation(c, options)
    ).join('\n\n---\n\n');

    const ext = this.getFileExtension(options.format);
    const filename = `export-${Date.now()}.${ext}`;
    const filepath = path.join(outputPath, filename);

    fs.writeFileSync(filepath, combined, 'utf-8');
    vscode.window.showInformationMessage(
      `Exported ${conversations.length} conversations to ${filename}`
    );
  }

  private async exportSeparate(
    conversations: Conversation[],
    outputPath: string,
    options: ExportOptions
  ): Promise<void> {
    let exported = 0;
    const total = conversations.length;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Exporting conversations',
      cancellable: false,
    }, async (progress) => {
      for (const conv of conversations) {
        const content = await this.exportConversation(conv, options);
        const filename = this.sanitizeFilename(conv.label || conv.id);
        const ext = this.getFileExtension(options.format);
        const filepath = path.join(outputPath, `${filename}.${ext}`);

        fs.writeFileSync(filepath, content, 'utf-8');
        exported++;

        progress.report({
          increment: (100 / total),
          message: `${exported}/${total} files`,
        });
      }
    });

    vscode.window.showInformationMessage(
      `Exported ${exported} conversations to ${outputPath}`
    );
  }

  private exportToMarkdown(conversation: Conversation, includeMetadata = true): string {
    let md = `# ${conversation.label || 'Untitled Conversation'}\n\n`;

    if (includeMetadata) {
      md += `**Created**: ${new Date(conversation.created_at).toLocaleString()}\n`;
      md += `**Folder**: ${conversation.folder || '/'}\n`;
      
      if (conversation.tags && conversation.tags.length > 0) {
        md += `**Tags**: ${conversation.tags.join(', ')}\n`;
      }
      
      if (conversation.status) {
        md += `**Status**: ${conversation.status}\n`;
      }
      
      md += `\n---\n\n`;
    }

    conversation.messages.forEach((msg, index) => {
      md += `## Message ${index + 1}\n`;
      md += `**Role**: ${msg.role}\n`;
      
      if (msg.timestamp) {
        md += `**Timestamp**: ${new Date(msg.timestamp).toLocaleString()}\n`;
      }
      
      md += `\n`;
      
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content, null, 2);
      
      md += `${content}\n\n`;
    });

    return md;
  }

  private exportToJSON(conversation: Conversation, includeMetadata = true): string {
    if (includeMetadata) {
      return JSON.stringify(conversation, null, 2);
    } else {
      const minimal = {
        label: conversation.label,
        messages: conversation.messages,
      };
      return JSON.stringify(minimal, null, 2);
    }
  }

  private exportToText(conversation: Conversation): string {
    let text = `${conversation.label || 'Untitled Conversation'}\n`;
    text += `${'='.repeat(conversation.label?.length || 25)}\n\n`;

    conversation.messages.forEach((msg) => {
      text += `[${msg.role.toUpperCase()}]\n`;
      
      const content = typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content);
      
      text += `${content}\n\n`;
    });

    return text;
  }

  private exportToHTML(conversation: Conversation, includeMetadata = true): string {
    let html = `<!DOCTYPE html>\n<html>\n<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <title>${this.escapeHtml(conversation.label || 'Conversation')}</title>\n`;
    html += `  <style>\n`;
    html += this.getHTMLStyles();
    html += `  </style>\n`;
    html += `</head>\n<body>\n`;
    html += `  <div class="container">\n`;
    html += `    <h1>${this.escapeHtml(conversation.label || 'Untitled Conversation')}</h1>\n`;

    if (includeMetadata) {
      html += `    <div class="metadata">\n`;
      html += `      <p><strong>Created:</strong> ${new Date(conversation.created_at).toLocaleString()}</p>\n`;
      html += `      <p><strong>Folder:</strong> ${this.escapeHtml(conversation.folder || '/')}</p>\n`;
      
      if (conversation.tags && conversation.tags.length > 0) {
        html += `      <p><strong>Tags:</strong> ${conversation.tags.map(t => this.escapeHtml(t)).join(', ')}</p>\n`;
      }
      
      html += `    </div>\n`;
    }

    html += `    <div class="messages">\n`;
    conversation.messages.forEach((msg, index) => {
      const content = typeof msg.content === 'string'
        ? this.escapeHtml(msg.content)
        : this.escapeHtml(JSON.stringify(msg.content, null, 2));
      
      html += `      <div class="message message-${msg.role}">\n`;
      html += `        <div class="message-header">\n`;
      html += `          <span class="role">${msg.role}</span>\n`;
      
      if (msg.timestamp) {
        html += `          <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>\n`;
      }
      
      html += `        </div>\n`;
      html += `        <div class="message-content">${content.replace(/\n/g, '<br>')}</div>\n`;
      html += `      </div>\n`;
    });
    html += `    </div>\n`;
    html += `  </div>\n`;
    html += `</body>\n</html>`;

    return html;
  }

  private getHTMLStyles(): string {
    return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .metadata {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .metadata p {
      margin: 5px 0;
    }
    .messages {
      margin-top: 30px;
    }
    .message {
      margin: 20px 0;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #3498db;
    }
    .message-user {
      background: #e3f2fd;
      border-left-color: #2196f3;
    }
    .message-assistant {
      background: #f1f8e9;
      border-left-color: #8bc34a;
    }
    .message-system {
      background: #fff3e0;
      border-left-color: #ff9800;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 0.9em;
    }
    .role {
      font-weight: bold;
      text-transform: uppercase;
      color: #555;
    }
    .timestamp {
      color: #999;
    }
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
  }

  private getFileExtension(format: ExportFormat): string {
    const extensions: { [key in ExportFormat]: string } = {
      markdown: 'md',
      json: 'json',
      text: 'txt',
      html: 'html',
    };
    return extensions[format];
  }

  private async pickOutputDirectory(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Select Export Directory',
    });

    return result?.[0]?.fsPath;
  }
}
