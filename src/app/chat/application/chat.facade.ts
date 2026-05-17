import { Injectable, inject } from '@angular/core';

import { ConversationIdProvider } from '../infrastructure/identity/conversation-id.provider';
import { SessionIdProvider } from '../infrastructure/identity/session-id.provider';
import { UserIdProvider } from '../infrastructure/identity/user-id.provider';
import { ChatConnectionService } from './chat-connection.service';
import { ChatMessagingService } from './chat-messaging.service';
import { ChatSelectors } from './state/chat-state.selectors';
import { ChatStore } from './state/chat.store';

/**
 * Public API consumed by presentation components.
 * Hides the internal service composition — components depend on this only.
 */
@Injectable({ providedIn: 'root' })
export class ChatFacade {
  private readonly connection = inject(ChatConnectionService);
  private readonly messaging = inject(ChatMessagingService);
  private readonly store = inject(ChatStore);
  private readonly selectors = inject(ChatSelectors);
  private readonly sessionId = inject(SessionIdProvider);
  private readonly conversationId = inject(ConversationIdProvider);
  private readonly userId = inject(UserIdProvider);

  // ----- read-only state for UI -----
  readonly messages = this.store.messages;
  readonly status = this.store.status;
  readonly typingName = this.store.typingName;
  readonly acdActive = this.store.acdActive;
  readonly canSend = this.selectors.canSend;
  readonly isConnected = this.selectors.isConnected;

  readonly currentSessionId = this.sessionId.current;
  readonly currentConversationId = this.conversationId.current;
  readonly currentUserId = this.userId.current;

  // ----- actions -----
  open(): Promise<void> {
    if (this.store.status() === 'connecting' || this.selectors.isConnected()) {
      return Promise.resolve();
    }
    return this.connection.connect();
  }

  close(): Promise<void> {
    return this.connection.disconnect();
  }

  send(text: string): void {
    this.messaging.send(text);
  }

  startNewConversation(): Promise<void> {
    return this.connection.reconnectWithNewSession();
  }
}
