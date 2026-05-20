import { Injectable, signal } from '@angular/core';

const MOCK_SESSION_ID = 'mock-session-00000001';

/**
 * Manages the STOMP `sessionId` header.
 * Mocked with a fixed value for development/testing.
 */
@Injectable({ providedIn: 'root' })
export class SessionIdProvider {
  private readonly _current = signal<string>(MOCK_SESSION_ID);

  readonly current = this._current.asReadonly();

  regenerate(): string {
    return MOCK_SESSION_ID;
  }
}
