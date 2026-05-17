import { Injectable, computed, signal } from '@angular/core';
import { ChatStatus } from '../../domain/chat-status';
import { UiMessage } from '../../domain/ui-message.model';

/**
 * Pure state container. Exposes signals for UI consumption and
 * minimal mutation methods. All business logic lives in `chat-state.actions.ts`.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly _status = signal<ChatStatus>('idle');
  private readonly _messages = signal<UiMessage[]>([]);
  private readonly _typingName = signal<string | null>(null);
  private readonly _acdActive = signal<boolean>(false);

  readonly status = this._status.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly typingName = this._typingName.asReadonly();
  readonly acdActive = this._acdActive.asReadonly();

  readonly messageCount = computed(() => this._messages().length);

  setStatus(s: ChatStatus): void {
    this._status.set(s);
  }

  appendMessage(msg: UiMessage): void {
    this._messages.update((list) => [...list, msg]);
  }

  setTypingName(name: string | null): void {
    this._typingName.set(name);
  }

  setAcdActive(active: boolean): void {
    this._acdActive.set(active);
  }

  reset(): void {
    this._messages.set([]);
    this._typingName.set(null);
    this._acdActive.set(false);
    this._status.set('idle');
  }
}
