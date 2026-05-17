import { Injectable, signal } from '@angular/core';
import { uuidv4 } from '../utils/uuid';

const STORAGE_KEY = 'chat.userId';

/**
 * Manages the end-user identifier. Persisted in localStorage so it survives
 * page reloads, identifying the same "user" across sessions for testing.
 */
@Injectable({ providedIn: 'root' })
export class UserIdProvider {
  private readonly _current = signal<string>(this.load());

  readonly current = this._current.asReadonly();

  private load(): string {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
    } catch {
      // localStorage unavailable — fall through and just generate one.
    }
    const fresh = `user-${uuidv4().slice(0, 8)}`;
    try {
      localStorage.setItem(STORAGE_KEY, fresh);
    } catch {
      /* ignore */
    }
    return fresh;
  }
}
