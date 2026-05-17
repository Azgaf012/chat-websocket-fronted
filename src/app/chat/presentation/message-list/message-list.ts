import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { UiMessage } from '../../domain/ui-message.model';
import { MessageBubble } from '../message-bubble/message-bubble';

@Component({
  selector: 'app-message-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessageBubble],
  templateUrl: './message-list.html',
  styleUrl: './message-list.css',
})
export class MessageList implements AfterViewInit {
  readonly messages = input.required<readonly UiMessage[]>();

  private readonly scroller =
    viewChild.required<ElementRef<HTMLDivElement>>('scroller');

  constructor() {
    // Auto-scroll to bottom whenever messages change.
    effect(() => {
      this.messages(); // track
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  trackById = (_i: number, m: UiMessage) => m.id;

  private scrollToBottom(): void {
    const el = this.scroller().nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
