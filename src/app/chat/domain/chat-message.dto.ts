/**
 * Outbound DTO sent to `/app/chat.send`.
 * `sessionId` is intentionally omitted — backend infers it from the STOMP session.
 */
export interface WsChatMessageDto {
  conversationId: string;
  userId: string;
  text: string;
}
