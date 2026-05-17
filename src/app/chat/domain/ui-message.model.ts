export type UiMessageAuthor = 'me' | 'agent' | 'bot' | 'system';

export interface UiMessage {
  id: string;
  author: UiMessageAuthor;
  authorName?: string;
  text: string;
  timestamp: Date;
}
