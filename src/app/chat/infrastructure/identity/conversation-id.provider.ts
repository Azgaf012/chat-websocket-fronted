import { Injectable, signal } from '@angular/core';

function build(): string {
  return `conv-${Date.now()}`;
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
