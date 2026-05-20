import { Injectable, signal } from '@angular/core';

const MOCK_USER_ID = '12345678';

/**
 * Manages the end-user identifier.
 * Mocked with a fixed value for development/testing.
 */
@Injectable({ providedIn: 'root' })
export class UserIdProvider {
  private readonly _current = signal<string>(MOCK_USER_ID);

  readonly current = this._current.asReadonly();
}
