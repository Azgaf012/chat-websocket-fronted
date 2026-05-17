import { MessageType } from './message-type';

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
  type: MessageType | string;
  timestamp: string;
  genesysMessageId: string | null;
}
