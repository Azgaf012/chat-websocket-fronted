import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { uuidv4 } from '../infrastructure/utils/uuid';
import { ConversationIdProvider } from '../infrastructure/identity/conversation-id.provider';
import { UserIdProvider } from '../infrastructure/identity/user-id.provider';
import {
  CHAT_TRANSPORT,
  ChatTransport,
  Subscription,
} from '../infrastructure/transport/transport.tokens';

import { AdvisorMessageEventDto } from '../domain/advisor-message.dto';
import { toIncomingEvent } from '../domain/mappers/advisor-to-incoming.mapper';

import { IncomingEventHandler } from './handlers/incoming-event.handler';
import { MessageAcknowledgementService } from './message-acknowledgement.service';
import { ChatStore } from './state/chat.store';

/** Stable UUID for the duration of the browser page session. */
const CLIENT_SESSION_ID = uuidv4();

const DEST_USER_QUEUE = '/user/queue/chat-response';
const DEST_ACK_QUEUE = '/user/queue/chat-ack';
const DEST_CONVERSATION_TOPIC = (convId: string) =>
  `/topic/conversation/${convId}`;

/**
 * Orchestrates transport + identity to open a STOMP session and wire
 * inbound subscriptions to the event handler. Does not know how to
 * publish outbound chat messages — that lives in `ChatMessagingService`.
 */
@Injectable({ providedIn: 'root' })
export class ChatConnectionService {
  private readonly transport: ChatTransport = inject(CHAT_TRANSPORT);
  private readonly conversationId = inject(ConversationIdProvider);
  private readonly userId = inject(UserIdProvider);
  private readonly handler = inject(IncomingEventHandler);
  private readonly acknowledgements = inject(MessageAcknowledgementService);
  private readonly store = inject(ChatStore);

  private subs: Subscription[] = [];

  async connect(): Promise<void> {
    this.store.setStatus('connecting');
    try {
      const headers: Record<string, string> = {
        sessionId: this.conversationId.current(),
        userId: this.userId.current(),
        'x-app': environment.wsHeaders.xApp,
        'x-guid': uuidv4(),
        'x-channel': environment.wsHeaders.xChannel,
        'x-medium': environment.wsHeaders.xMedium,
        'x-session': CLIENT_SESSION_ID,
      };
      console.log('[chat] connecting with headers:', headers);
      await this.transport.connect({ headers });
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
          console.log(
            '[chat] inbound message (backend → frontend)',
            dto.type,
            dto,
          );
          this.handleUserQueueMessage(dto);
        },
      ),
    );

    this.subs.push(
      this.transport.subscribe<unknown>(DEST_ACK_QUEUE, (confirmation) => {
        this.acknowledgements.confirm(confirmation);
      }),
    );

    this.subs.push(
      this.transport.subscribe<AdvisorMessageEventDto>(
        DEST_CONVERSATION_TOPIC(this.conversationId.current()),
        (dto) => {
          console.log(
            '[chat] inbound message (backend → frontend)',
            dto.type,
            dto,
          );
          this.handler.handle(toIncomingEvent(dto));
        },
      ),
    );
  }

  private handleUserQueueMessage(dto: AdvisorMessageEventDto): void {
    const processMessage = () => this.handler.handle(toIncomingEvent(dto));

    if (dto.type === 'AGENT' || dto.type === 'BOT') {
      this.acknowledgements.process(dto, processMessage);
      return;
    }

    processMessage();
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
