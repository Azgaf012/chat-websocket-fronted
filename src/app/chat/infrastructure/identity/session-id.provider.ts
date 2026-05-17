import { Injectable, signal } from '@angular/core';
import { uuidv4 } from '../utils/uuid';

/**
 * Manages the STOMP `sessionId` header. Generated as UUID v4 per connection
 * and regenerated when the user explicitly starts a new conversation.
 */
@Injectable({ providedIn: 'root' })
export class SessionIdProvider {
  private readonly _current = signal<string>(uuidv4());

  readonly current = this._current.asReadonly();

  regenerate(): string {
    const next = uuidv4();
    this._current.set(next);
    return next;
  }
}
