import { Injectable, signal } from '@angular/core';
import { uuidv4 } from '../utils/uuid';

/**
 * Manages the active `conversationId`. Regenerated when the user starts
 * a new conversation.
 */
@Injectable({ providedIn: 'root' })
export class ConversationIdProvider {
  private readonly _current = signal<string>(uuidv4());

  readonly current = this._current.asReadonly();

  regenerate(): string {
    const next = uuidv4();
    this._current.set(next);
    return next;
  }
}
