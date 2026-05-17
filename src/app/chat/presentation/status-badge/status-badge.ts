import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChatStatus } from '../../domain/chat-status';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<ChatStatus>();

  label(): string {
    switch (this.status()) {
      case 'idle':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando…';
      case 'connected':
        return 'Conectado';
      case 'open':
        return 'Abierta';
      case 'closed':
        return 'Cerrada';
      case 'error':
        return 'Error';
    }
  }
}
