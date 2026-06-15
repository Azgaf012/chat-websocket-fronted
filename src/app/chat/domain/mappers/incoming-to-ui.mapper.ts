import { AgentMessageEvent, BotMessageEvent } from '../events/incoming-event';
import { UiMessage } from '../ui-message.model';

export function agentEventToUiMessage(evt: AgentMessageEvent): UiMessage {
  return {
    id: evt.id,
    author: 'agent',
    authorName: evt.senderName,
    text: evt.text,
    timestamp: evt.timestamp,
    ...(evt.quickReplies &&
      evt.quickReplies.length > 0 && { quickReplies: evt.quickReplies }),
  };
}

export function botEventToUiMessage(evt: BotMessageEvent): UiMessage {
  return {
    id: evt.id,
    author: 'bot',
    authorName: evt.senderName,
    text: evt.text,
    timestamp: evt.timestamp,
    ...(evt.quickReplies &&
      evt.quickReplies.length > 0 && { quickReplies: evt.quickReplies }),
  };
}

export function systemUiMessage(id: string, text: string): UiMessage {
  return {
    id,
    author: 'system',
    text,
    timestamp: new Date(),
  };
}

export function meUiMessage(id: string, text: string): UiMessage {
  return {
    id,
    author: 'me',
    text,
    timestamp: new Date(),
  };
}
