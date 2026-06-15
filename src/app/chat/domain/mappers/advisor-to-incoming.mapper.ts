import { AdvisorMessageEventDto } from '../advisor-message.dto';
import { IncomingEvent } from '../events/incoming-event';
import { QuickReply } from '../ui-message.model';

function extractQuickReplies(dto: AdvisorMessageEventDto): QuickReply[] {
  return (
    dto.structuredContent
      ?.filter((item) => item.contentType === 'QuickReply')
      .map((item) => ({
        text: item.quickReply.text,
        payload: item.quickReply.payload,
      })) ?? []
  );
}

/**
 * Parse a backend timestamp like `2026-05-17T10:30:00` into a Date.
 * Falls back to "now" on parse failure.
 */
function parseTimestamp(raw: string): Date {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Maps the raw DTO from the wire into a tightly-typed `IncomingEvent`.
 * Lives in the domain layer — pure function, no Angular, no side effects.
 */
export function toIncomingEvent(dto: AdvisorMessageEventDto): IncomingEvent {
  const base = {
    conversationId: dto.conversationId,
    timestamp: parseTimestamp(dto.timestamp),
  };

  switch (dto.type) {
    // `TEXT` is an agent text message — treat it the same as `AGENT`.
    case 'AGENT':
    case 'TEXT': {
      const agentReplies = extractQuickReplies(dto);
      return {
        kind: 'AGENT',
        ...base,
        id: dto.id ?? `${dto.timestamp}-${Math.random()}`,
        senderName: dto.senderName,
        text: dto.content,
        ...(agentReplies.length > 0 && { quickReplies: agentReplies }),
      };
    }

    case 'BOT': {
      const botReplies = extractQuickReplies(dto);
      return {
        kind: 'BOT',
        ...base,
        id: dto.id ?? `${dto.timestamp}-${Math.random()}`,
        senderName: dto.senderName,
        text: dto.content,
        ...(botReplies.length > 0 && { quickReplies: botReplies }),
      };
    }

    case 'TYPING':
      // TYPING ON vs OFF is encoded in `content`: non-empty → on, empty → off.
      return dto.content && dto.content.length > 0
        ? { kind: 'TYPING', ...base, active: true, senderName: dto.senderName }
        : { kind: 'TYPING', ...base, active: false };

    case 'OPEN':
      return { kind: 'OPEN', ...base };
    case 'CLOSE':
      return { kind: 'CLOSE', ...base };
    case 'LEAVE':
      return { kind: 'LEAVE', ...base };
    case 'ACD_START':
      return { kind: 'ACD_START', ...base };
    case 'ACD_END':
      return { kind: 'ACD_END', ...base };
    case 'CUSTOMER_END':
      return { kind: 'CUSTOMER_END', ...base };

    default:
      return { kind: 'UNKNOWN', ...base, rawType: String(dto.type) };
  }
}
