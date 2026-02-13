import { SekhaClient } from '@sekha/sdk';

export interface TagStats {
  tag: string;
  count: number;
}

export class TagManager {
  constructor(private sekha: SekhaClient) {}

  async addTags(id: string, tags: string[]): Promise<void> {
    await this.sekha.controller.addTags(id, tags);
  }

  async removeTags(id: string, tags: string[]): Promise<void> {
    await this.sekha.controller.removeTags(id, tags);
  }

  async getTags(id: string): Promise<string[]> {
    const conversation = await this.sekha.controller.get(id);
    return conversation.tags || [];
  }

  async getAllTags(): Promise<TagStats[]> {
    const response = await this.sekha.controller.list({ limit: 1000 });
    const tagCounts = new Map<string, number>();

    response.conversations.forEach(conv => {
      if (conv.tags) {
        conv.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async suggestTags(id: string): Promise<string[]> {
    const conversation = await this.sekha.controller.get(id);
    
    // Use Bridge to suggest tags based on content
    try {
      const response = await this.sekha.bridge.complete({
        messages: [
          {
            role: 'system',
            content: 'Analyze this conversation and suggest 3-5 relevant tags. Return only the tags as a comma-separated list, no explanations.'
          },
          {
            role: 'user',
            content: JSON.stringify(conversation.messages)
          }
        ],
        temperature: 0.3,
      });

      const tagsText = response.choices[0]?.message?.content || '';
      return tagsText
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

    } catch (error) {
      console.error('Tag suggestion failed:', error);
      return [];
    }
  }

  async filterByTags(tags: string[]): Promise<string[]> {
    const response = await this.sekha.controller.list({ limit: 1000 });
    
    const matching = response.conversations
      .filter(conv => {
        if (!conv.tags) return false;
        return tags.some(tag => conv.tags!.includes(tag));
      })
      .map(conv => conv.id);

    return matching;
  }
}
