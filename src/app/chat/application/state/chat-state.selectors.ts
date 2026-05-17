import { Injectable, computed, inject } from '@angular/core';
import { ChatStore } from './chat.store';

/**
 * Derived (read-only) signals computed from the store.
 * Keeping these here lets components read intent-level state
 * (`canSend`, `isConnected`) instead of duplicating the conditions.
 */
@Injectable({ providedIn: 'root' })
export class ChatSelectors {
  private readonly store = inject(ChatStore);

  readonly isConnected = computed(() => {
    const s = this.store.status();
    return s === 'connected' || s === 'open';
  });

  readonly canSend = computed(() => this.isConnected());

  readonly isClosed = computed(() => this.store.status() === 'closed');
}
