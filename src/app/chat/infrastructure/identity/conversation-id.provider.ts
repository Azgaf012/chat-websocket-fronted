import { Injectable, signal } from '@angular/core';
import { uuidv4 } from '../utils/uuid';

function build(): string {
  return uuidv4();
}

/**
 * Manages the active `conversationId`. Regenerated when the user starts
 * a new conversation.
 */
@Injectable({ providedIn: 'root' })
export class ConversationIdProvider {
  private readonly _current = signal<string>(build());

  readonly current = this._current.asReadonly();

  regenerate(): string {
    const next = build();
    this._current.set(next);
    return next;
  }
}
