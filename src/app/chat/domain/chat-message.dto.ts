/**
 * Outbound DTO sent as the **body** of the `/app/chat.send` STOMP frame.
 * Context metadata (device, session, channel, etc.) travels as STOMP message
 * headers — see `ChatMessagingService.buildMessageHeaders()`.
 */
export interface WsChatMessageDto {
  conversationId: string;
  userId: string;
  clientIdType: string;
  clientCif: string;
  text: string;
}
