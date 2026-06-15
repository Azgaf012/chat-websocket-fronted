export type UiMessageAuthor = 'me' | 'agent' | 'bot' | 'system';

export interface QuickReply {
  text: string;
  payload: string;
}

export interface UiMessage {
  id: string;
  author: UiMessageAuthor;
  authorName?: string;
  text: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
}
