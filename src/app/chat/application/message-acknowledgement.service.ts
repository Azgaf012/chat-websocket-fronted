import { Injectable, inject } from '@angular/core';

import { AdvisorMessageEventDto } from '../domain/advisor-message.dto';
import {
  MessageAckRequestDto,
  MessageAckResponseDto,
} from '../domain/message-ack.dto';
import {
  CHAT_TRANSPORT,
  ChatTransport,
} from '../infrastructure/transport/transport.tokens';

const DEST_ACK = '/app/chat.ack';

@Injectable({ providedIn: 'root' })
export class MessageAcknowledgementService {
  private readonly transport: ChatTransport = inject(CHAT_TRANSPORT);
  private readonly processedMessageKeys = new Set<string>();
  private readonly pendingAckKeys = new Set<string>();

  process(dto: AdvisorMessageEventDto, processMessage: () => void): void {
    if (!this.hasAcknowledgementIdentifiers(dto)) {
      console.error(
        '[chat] Cannot acknowledge message without id and userId.',
        dto,
      );
      processMessage();
      return;
    }

    const key = this.messageKey(dto.userId, dto.id);
    if (!this.processedMessageKeys.has(key)) {
      processMessage();
      this.processedMessageKeys.add(key);
    }

    const ack: MessageAckRequestDto = {
      userId: dto.userId,
      messageId: dto.id,
    };
    this.pendingAckKeys.add(key);
    this.transport.publish(DEST_ACK, ack);
  }

  confirm(payload: unknown): boolean {
    const ack = this.parseAcknowledgement(payload);
    if (!ack) {
      console.error('[chat] Invalid ACK confirmation.', payload);
      return false;
    }

    return this.pendingAckKeys.delete(
      this.messageKey(ack.userId, ack.messageId),
    );
  }

  private hasAcknowledgementIdentifiers(
    dto: AdvisorMessageEventDto,
  ): dto is AdvisorMessageEventDto & { id: string; userId: string } {
    return this.isNonEmptyString(dto.id) && this.isNonEmptyString(dto.userId);
  }

  private parseAcknowledgement(
    payload: unknown,
  ): MessageAckResponseDto | null {
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const userId: unknown = Object.getOwnPropertyDescriptor(
      payload,
      'userId',
    )?.value;
    const messageId: unknown = Object.getOwnPropertyDescriptor(
      payload,
      'messageId',
    )?.value;
    const status: unknown = Object.getOwnPropertyDescriptor(
      payload,
      'status',
    )?.value;

    if (
      !this.isNonEmptyString(userId) ||
      !this.isNonEmptyString(messageId) ||
      status !== 'ACKNOWLEDGED'
    ) {
      return null;
    }

    return { userId, messageId, status };
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private messageKey(userId: string, messageId: string): string {
    return `${userId}\u0000${messageId}`;
  }
}
