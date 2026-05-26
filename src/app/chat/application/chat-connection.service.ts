import { Injectable, inject } from '@angular/core';

import { ConversationIdProvider } from '../infrastructure/identity/conversation-id.provider';
import { StompTransport } from '../infrastructure/transport/stomp-transport';
import { Subscription } from '../infrastructure/transport/transport.tokens';

import { AdvisorMessageEventDto } from '../domain/advisor-message.dto';
import { toIncomingEvent } from '../domain/mappers/advisor-to-incoming.mapper';

import { IncomingEventHandler } from './handlers/incoming-event.handler';
import { ChatStore } from './state/chat.store';

const DEST_USER_QUEUE = '/user/queue/chat-response';
const DEST_CONVERSATION_TOPIC = (convId: string) =>
  `/topic/conversation/${convId}`;

/**
 * Orchestrates transport + identity to open a STOMP session and wire
 * inbound subscriptions to the event handler. Does not know how to
 * publish outbound chat messages — that lives in `ChatMessagingService`.
 */
@Injectable({ providedIn: 'root' })
export class ChatConnectionService {
  private readonly transport = inject(StompTransport);
  private readonly conversationId = inject(ConversationIdProvider);
  private readonly handler = inject(IncomingEventHandler);
  private readonly store = inject(ChatStore);

  private subs: Subscription[] = [];

  async connect(): Promise<void> {
    this.store.setStatus('connecting');
    try {
      await this.transport.connect({
        headers: { sessionId: this.conversationId.current() },
      });
      this.subscribeAll();
      this.store.setStatus('connected');
    } catch (err) {
      console.error('[chat] connect failed', err);
      this.store.setStatus('error');
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.unsubscribeAll();
    await this.transport.disconnect();
    this.store.setStatus('idle');
  }

  /** Disconnects, regenerates `sessionId` + `conversationId`, reconnects. */
  async reconnectWithNewSession(): Promise<void> {
    await this.disconnect();
    this.conversationId.regenerate();
    this.store.reset();
    await this.connect();
  }

  private subscribeAll(): void {
    this.unsubscribeAll();

    this.subs.push(
      this.transport.subscribe<AdvisorMessageEventDto>(
        DEST_USER_QUEUE,
        (dto) => {
          this.handler.handle(toIncomingEvent(dto));
        },
      ),
    );

    this.subs.push(
      this.transport.subscribe<AdvisorMessageEventDto>(
        DEST_CONVERSATION_TOPIC(this.conversationId.current()),
        (dto) => this.handler.handle(toIncomingEvent(dto)),
      ),
    );
  }

  private unsubscribeAll(): void {
    for (const s of this.subs) {
      try {
        s.unsubscribe();
      } catch {
        /* ignore */
      }
    }
    this.subs = [];
  }
}
