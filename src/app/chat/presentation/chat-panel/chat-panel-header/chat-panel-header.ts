import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ChatStatus } from '../../../domain/chat-status';
import { StatusBadge } from '../../status-badge/status-badge';

@Component({
  selector: 'app-chat-panel-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadge],
  templateUrl: './chat-panel-header.html',
  styleUrl: './chat-panel-header.css',
})
export class ChatPanelHeader {
  readonly title = input<string>('Chat');
  readonly status = input.required<ChatStatus>();

  readonly newConversation = output<void>();
  readonly close = output<void>();
}
