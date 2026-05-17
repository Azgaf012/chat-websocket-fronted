import { Injectable, inject } from '@angular/core';

import { WsChatMessageDto } from '../domain/chat-message.dto';
import { ConversationIdProvider } from '../infrastructure/identity/conversation-id.provider';
import { UserIdProvider } from '../infrastructure/identity/user-id.provider';
import { StompTransport } from '../infrastructure/transport/stomp-transport';
import { applyOutgoing } from './state/chat-state.actions';
import { ChatStore } from './state/chat.store';

const DEST_SEND = '/app/chat.send';

/**
 * Handles outbound chat messages: build the DTO, publish to the transport,
 * and reflect the outgoing message in the local store.
 */
@Injectable({ providedIn: 'root' })
export class ChatMessagingService {
  private readonly transport = inject(StompTransport);
  private readonly conversationId = inject(ConversationIdProvider);
  private readonly userId = inject(UserIdProvider);
  private readonly store = inject(ChatStore);

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const dto: WsChatMessageDto = {
      conversationId: this.conversationId.current(),
      userId: this.userId.current(),
      text: trimmed,
    };

    this.transport.publish(DEST_SEND, dto);
    applyOutgoing(this.store, trimmed);
  }
}
