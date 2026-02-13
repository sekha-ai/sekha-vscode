import { Conversation, Message, SekhaClient } from '@sekha/sdk';

export interface MergeOptions {
  label?: string;
  folder?: string;
  deleteOriginals?: boolean;
  sortBy?: 'chronological' | 'conversation';
}

export class MergeService {
  constructor(private sekha: SekhaClient) {}

  async merge(ids: string[], options: MergeOptions): Promise<Conversation> {
    if (ids.length < 2) {
      throw new Error('At least 2 conversations are required to merge');
    }

    // Fetch all conversations
    const conversations = await Promise.all(
      ids.map(id => this.sekha.controller.get(id))
    );

    // Determine label and folder
    const label = options.label || this.generateMergedLabel(conversations);
    const folder = options.folder || conversations[0].folder || '/';

    // Sort and combine messages
    const messages = this.combineMessages(conversations, options.sortBy || 'chronological');

    // Combine metadata
    const tags = this.combineTags(conversations);

    // Create merged conversation
    const merged = await this.sekha.controller.create({
      label,
      folder,
      messages,
      tags,
    });

    // Optionally delete originals
    if (options.deleteOriginals) {
      await Promise.all(ids.map(id => this.sekha.controller.delete(id)));
    }

    return merged;
  }

  private combineMessages(
    conversations: Conversation[],
    sortBy: 'chronological' | 'conversation'
  ): Message[] {
    if (sortBy === 'chronological') {
      return this.sortMessagesChronologically(conversations);
    } else {
      return this.sortMessagesByConversation(conversations);
    }
  }

  private sortMessagesChronologically(conversations: Conversation[]): Message[] {
    const allMessages: Array<Message & { _convId?: string }> = [];

    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        allMessages.push({ ...msg, _convId: conv.id });
      });
    });

    // Sort by timestamp if available, otherwise maintain order
    allMessages.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    });

    // Remove temporary _convId
    return allMessages.map(({ _convId, ...msg }) => msg);
  }

  private sortMessagesByConversation(conversations: Conversation[]): Message[] {
    const allMessages: Message[] = [];

    conversations.forEach((conv) => {
      // Add separator comment
      allMessages.push({
        role: 'system',
        content: `--- From conversation: ${conv.label} ---`,
      });

      conv.messages.forEach((msg) => {
        allMessages.push(msg);
      });
    });

    return allMessages;
  }

  private generateMergedLabel(conversations: Conversation[]): string {
    const labels = conversations
      .map(c => c.label)
      .filter(Boolean)
      .slice(0, 3);

    if (labels.length === 0) {
      return `Merged Conversation - ${new Date().toLocaleDateString()}`;
    }

    return `Merged: ${labels.join(', ')}`;
  }

  private combineTags(conversations: Conversation[]): string[] {
    const allTags = new Set<string>();

    conversations.forEach((conv) => {
      if (conv.tags) {
        conv.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags);
  }
}
