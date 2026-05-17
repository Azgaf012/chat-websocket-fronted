import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './typing-indicator.html',
  styleUrl: './typing-indicator.css',
})
export class TypingIndicator {
  readonly name = input<string | null>(null);
}
