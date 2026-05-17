import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-chat-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-bubble.html',
  styleUrl: './chat-bubble.css',
})
export class ChatBubble {
  readonly open = input<boolean>(false);
  readonly toggle = output<void>();
}
