import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ChatStatus } from '../../domain/chat-status';
import { UiMessage } from '../../domain/ui-message.model';
import { MessageList } from '../message-list/message-list';
import { TypingIndicator } from '../typing-indicator/typing-indicator';
import { ChatPanelHeader } from './chat-panel-header/chat-panel-header';
import { ChatPanelInput } from './chat-panel-input/chat-panel-input';

@Component({
  selector: 'app-chat-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatPanelHeader, ChatPanelInput, MessageList, TypingIndicator],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css',
})
export class ChatPanel {
  readonly status = input.required<ChatStatus>();
  readonly messages = input.required<readonly UiMessage[]>();
  readonly typingName = input<string | null>(null);
  readonly canSend = input<boolean>(false);

  readonly send = output<string>();
  readonly newConversation = output<void>();
  readonly close = output<void>();
}
