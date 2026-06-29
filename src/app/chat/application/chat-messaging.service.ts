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

    const dto: WsChatMessageDto = {
      conversationId: this.conversationId.current(),
      userId: this.userId.current(),
      // TODO: replace with real values before going to production
      clientIdType: 'NIF',
      clientCif: 'test-cif-00000',
      text: trimmed,
      ...this.metadata.current(),
    };

    console.group('[chat] outbound message (frontend → backend)');
    console.log('destination   :', DEST_SEND);
    console.log('stomp headers :', { 'content-type': 'application/json' });
    console.log('--- body ---');
    console.log('conversationId:', dto.conversationId);
    console.log('userId        :', dto.userId);
    console.log('clientIdType  :', dto.clientIdType);
    console.log('clientCif     :', dto.clientCif);
    console.log('text          :', dto.text);
    console.log('device        :', dto.device);
    console.log('deviceIp      :', dto.deviceIp);
    console.log('session       :', dto.session);
    console.log('channelSession:', dto.channelSession);
    console.log('medium        :', dto.medium);
    console.log('app           :', dto.app);
    console.log('geolocation   :', dto.geolocation);
    console.log('agency        :', dto.agency);
    console.log('full body JSON:', JSON.stringify(dto, null, 2));
    console.groupEnd();
    this.transport.publish(DEST_SEND, dto);
    applyOutgoing(this.store, trimmed);
  }
}
