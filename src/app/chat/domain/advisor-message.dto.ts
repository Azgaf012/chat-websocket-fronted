import { MessageType } from './message-type';

export interface StructuredQuickReply {
  text: string;
  payload: string;
  action: string;
}

export interface StructuredContentItem {
  contentType: string;
  quickReply: StructuredQuickReply;
}

/**
 * Inbound DTO delivered by the backend on `/user/queue/chat-response`
 * and `/topic/conversation/{conversationId}`.
 * Matches `AdvisorMessageEventDto` from the gateway spec.
 */
export interface AdvisorMessageEventDto {
  id: string | null;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  structuredContent?: StructuredContentItem[];
  type: MessageType | string;
  timestamp: string;
  genesysMessageId: string | null;
}
