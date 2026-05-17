/**
 * Discriminated union of inbound events after parsing the raw DTO.
 * `kind` is the discriminator. Adding a new event type means:
 *   1. Add a new variant here.
 *   2. Map it in `advisor-to-incoming.mapper.ts`.
 *   3. Handle it in `incoming-event.handler.ts`.
 */

export interface BaseEvent {
  conversationId: string;
  timestamp: Date;
}

export interface AgentMessageEvent extends BaseEvent {
  kind: 'AGENT_MESSAGE';
  id: string;
  senderName: string;
  text: string;
}

export interface BotMessageEvent extends BaseEvent {
  kind: 'BOT_MESSAGE';
  id: string;
  senderName: string;
  text: string;
}

export interface TypingOnEvent extends BaseEvent {
  kind: 'TYPING_ON';
  senderName: string;
}

export interface TypingOffEvent extends BaseEvent {
  kind: 'TYPING_OFF';
}

export interface OpenEvent extends BaseEvent {
  kind: 'OPEN';
}

export interface CloseEvent extends BaseEvent {
  kind: 'CLOSE';
}

export interface LeaveEvent extends BaseEvent {
  kind: 'LEAVE';
}

export interface AcdStartEvent extends BaseEvent {
  kind: 'ACD_START';
}

export interface AcdEndEvent extends BaseEvent {
  kind: 'ACD_END';
}

export interface CustomerEndEvent extends BaseEvent {
  kind: 'CUSTOMER_END';
}

export interface UnknownEvent extends BaseEvent {
  kind: 'UNKNOWN';
  rawType: string;
}

export type IncomingEvent =
  | AgentMessageEvent
  | BotMessageEvent
  | TypingOnEvent
  | TypingOffEvent
  | OpenEvent
  | CloseEvent
  | LeaveEvent
  | AcdStartEvent
  | AcdEndEvent
  | CustomerEndEvent
  | UnknownEvent;
