import { Injectable, inject } from '@angular/core';
import { IncomingEvent } from '../../domain/events/incoming-event';
import {
  applyAcdEnd,
  applyAcdStart,
  applyAgentMessage,
  applyBotMessage,
  applyClose,
  applyCustomerEnd,
  applyLeave,
  applyOpen,
  applyTypingOff,
  applyTypingOn,
} from '../state/chat-state.actions';
import { ChatStore } from '../state/chat.store';

/**
 * Single switch over `IncomingEvent.kind`. Adding a new event type means:
 *   1. Add it to the union in `incoming-event.ts`.
 *   2. Map it in `advisor-to-incoming.mapper.ts`.
 *   3. Add an `apply*` action and a `case` here.
 */
@Injectable({ providedIn: 'root' })
export class IncomingEventHandler {
  private readonly store = inject(ChatStore);

  handle(evt: IncomingEvent): void {
    switch (evt.kind) {
      case 'AGENT_MESSAGE':
        applyAgentMessage(this.store, evt);
        return;
      case 'BOT_MESSAGE':
        applyBotMessage(this.store, evt);
        return;
      case 'TYPING_ON':
        applyTypingOn(this.store, evt);
        return;
      case 'TYPING_OFF':
        applyTypingOff(this.store, evt);
        return;
      case 'OPEN':
        applyOpen(this.store, evt);
        return;
      case 'CLOSE':
        applyClose(this.store, evt);
        return;
      case 'LEAVE':
        applyLeave(this.store, evt);
        return;
      case 'ACD_START':
        applyAcdStart(this.store, evt);
        return;
      case 'ACD_END':
        applyAcdEnd(this.store, evt);
        return;
      case 'CUSTOMER_END':
        applyCustomerEnd(this.store, evt);
        return;
      case 'UNKNOWN':
        console.warn('[chat] Unknown event type:', evt.rawType);
        return;
    }
  }
}
