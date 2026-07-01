import { Injectable, inject } from '@angular/core';

import { WsChatMessageDto } from '../domain/chat-message.dto';
import { ChatMetadataProvider } from '../infrastructure/identity/chat-metadata.provider';
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
  private readonly metadata = inject(ChatMetadataProvider);
  private readonly store = inject(ChatStore);

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const body: WsChatMessageDto = {
      conversationId: this.conversationId.current(),
      userId: this.userId.current(),
      // TODO: replace with real values before going to production
      clientIdType: 'NIF',
      clientCif: 'test-cif-00000',
      text: trimmed,
    };

    const meta = this.metadata.current();
    const messageHeaders: Record<string, string> = {
      'x-device'    : meta.device,
      'x-device-ip' : meta.deviceIp,
      'x-session'   : meta.session,
      'x-channel'   : meta.channelSession,
      'x-medium'    : meta.medium,
      'x-app'       : meta.app,
      'x-geolocation': meta.geolocation,
      'x-agency'    : meta.agency,
    };

    console.group('[chat] outbound message (frontend → backend)');
    console.log('destination  :', DEST_SEND);
    console.log('--- stomp headers ---');
    console.log(messageHeaders);
    console.log('--- body ---');
    console.log(JSON.stringify(body, null, 2));
    console.groupEnd();

    this.transport.publish(DEST_SEND, body, messageHeaders);
    applyOutgoing(this.store, trimmed);
  }
}
