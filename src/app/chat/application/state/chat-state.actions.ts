import {
  AcdEndEvent,
  AcdStartEvent,
  AgentMessageEvent,
  BotMessageEvent,
  CloseEvent,
  CustomerEndEvent,
  LeaveEvent,
  OpenEvent,
  TypingEvent,
} from '../../domain/events/incoming-event';
import {
  agentEventToUiMessage,
  botEventToUiMessage,
  meUiMessage,
  systemUiMessage,
} from '../../domain/mappers/incoming-to-ui.mapper';
import { uuidv4 } from '../../infrastructure/utils/uuid';
import { environment } from '../../../../environments/environment';
import { ChatStore } from './chat.store';

/**
 * Pure-ish action functions that translate domain events into store mutations.
 * One function per event type → easy to extend, easy to test in isolation
 * (just construct a `ChatStore` and assert resulting signals).
 */

export function applyAgentMessage(
  store: ChatStore,
  evt: AgentMessageEvent,
): void {
  store.appendMessage(agentEventToUiMessage(evt));
}

export function applyBotMessage(store: ChatStore, evt: BotMessageEvent): void {
  store.appendMessage(botEventToUiMessage(evt));
}

export function applyTyping(store: ChatStore, evt: TypingEvent): void {
  if (evt.active) {
    store.setTypingName(evt.senderName || 'Agent', environment.typingTimeoutMs);
  } else {
    store.setTypingName(null);
  }
}

export function applyOpen(store: ChatStore, _evt: OpenEvent): void {
  store.setStatus('open');
  store.appendMessage(systemUiMessage(uuidv4(), 'Conversación abierta.'));
}

export function applyClose(store: ChatStore, _evt: CloseEvent): void {
  store.setStatus('closed');
  store.appendMessage(systemUiMessage(uuidv4(), 'Conversación cerrada.'));
}

export function applyLeave(store: ChatStore, _evt: LeaveEvent): void {
  store.appendMessage(
    systemUiMessage(uuidv4(), 'El agente salió de la conversación.'),
  );
}

export function applyAcdStart(store: ChatStore, _evt: AcdStartEvent): void {
  store.setAcdActive(true);
  store.appendMessage(systemUiMessage(uuidv4(), 'Conectando con un agente…'));
}

export function applyAcdEnd(store: ChatStore, _evt: AcdEndEvent): void {
  store.setAcdActive(false);
}

export function applyCustomerEnd(
  store: ChatStore,
  _evt: CustomerEndEvent,
): void {
  store.appendMessage(systemUiMessage(uuidv4(), 'Conversación finalizada.'));
  store.setStatus('closed');
}

export function applyOutgoing(store: ChatStore, text: string): void {
  store.appendMessage(meUiMessage(uuidv4(), text));
}
