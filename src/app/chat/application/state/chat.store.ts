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

  /** Pending auto-clear timer for the typing indicator, if any. */
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

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

  /**
   * Sets the typing indicator name. When `autoClearMs` is provided and a
   * name is set, the indicator is automatically cleared after that delay.
   * Any previously scheduled auto-clear is cancelled first.
   */
  setTypingName(name: string | null, autoClearMs?: number): void {
    this.clearTypingTimer();
    this._typingName.set(name);
    if (name !== null && autoClearMs && autoClearMs > 0) {
      this.typingTimer = setTimeout(() => {
        this._typingName.set(null);
        this.typingTimer = null;
      }, autoClearMs);
    }
  }

  private clearTypingTimer(): void {
    if (this.typingTimer !== null) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  setAcdActive(active: boolean): void {
    this._acdActive.set(active);
  }

  reset(): void {
    this.clearTypingTimer();
    this._messages.set([]);
    this._typingName.set(null);
    this._acdActive.set(false);
    this._status.set('idle');
  }
}
