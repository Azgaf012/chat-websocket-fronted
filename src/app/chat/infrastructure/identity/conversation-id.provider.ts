import { Injectable, signal } from '@angular/core';

const MOCK_CONVERSATION_ID = 'mock-conversation-00000001';

/**
 * Manages the active `conversationId`.
 * Mocked with a fixed value for development/testing.
 */
@Injectable({ providedIn: 'root' })
export class ConversationIdProvider {
  private readonly _current = signal<string>(MOCK_CONVERSATION_ID);

  readonly current = this._current.asReadonly();

  regenerate(): string {
    return MOCK_CONVERSATION_ID;
  }
}
