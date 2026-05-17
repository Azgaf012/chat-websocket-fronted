import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ChatFacade } from '../../application/chat.facade';
import { ChatBubble } from '../chat-bubble/chat-bubble';
import { ChatPanel } from '../chat-panel/chat-panel';

/**
 * Smart container — the only presentation component that talks to `ChatFacade`.
 * Holds the local `open` state, connects lazily on first open, and wires
 * facade actions to the dumb sub-components.
 */
@Component({
  selector: 'app-chat-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatBubble, ChatPanel],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget {
  private readonly facade = inject(ChatFacade);

  protected readonly open = signal<boolean>(false);

  protected readonly status = this.facade.status;
  protected readonly messages = this.facade.messages;
  protected readonly typingName = this.facade.typingName;
  protected readonly canSend = this.facade.canSend;

  toggle(): void {
    const willOpen = !this.open();
    this.open.set(willOpen);
    if (willOpen && this.status() === 'idle') {
      // Lazy connect on first open.
      void this.facade.open();
    }
  }

  closePanel(): void {
    this.open.set(false);
  }

  send(text: string): void {
    this.facade.send(text);
  }

  newConversation(): void {
    void this.facade.startNewConversation();
  }
}
