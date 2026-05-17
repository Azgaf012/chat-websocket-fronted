import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-panel-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './chat-panel-input.html',
  styleUrl: './chat-panel-input.css',
})
export class ChatPanelInput {
  readonly disabled = input<boolean>(false);
  readonly send = output<string>();

  protected readonly text = signal<string>('');

  onSubmit(event: Event): void {
    event.preventDefault();
    this.tryEmit();
  }

  onKeydown(event: KeyboardEvent): void {
    // Enter sends, Shift+Enter inserts newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.tryEmit();
    }
  }

  private tryEmit(): void {
    if (this.disabled()) return;
    const value = this.text().trim();
    if (!value) return;
    this.send.emit(value);
    this.text.set('');
  }
}
