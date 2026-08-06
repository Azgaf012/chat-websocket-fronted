import { TestBed } from '@angular/core/testing';

import { AdvisorMessageEventDto } from '../domain/advisor-message.dto';
import { CHAT_TRANSPORT } from '../infrastructure/transport/transport.tokens';
import { MessageAcknowledgementService } from './message-acknowledgement.service';

describe('MessageAcknowledgementService', () => {
  let service: MessageAcknowledgementService;
  let published: Array<{ destination: string; body: unknown }>;
  let onPublish: () => void;

  beforeEach(() => {
    published = [];
    onPublish = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        MessageAcknowledgementService,
        {
          provide: CHAT_TRANSPORT,
          useValue: {
            publish: (destination: string, body: unknown) => {
              onPublish();
              published.push({ destination, body });
            },
          },
        },
      ],
    });
    service = TestBed.inject(MessageAcknowledgementService);
  });

  it('processes a new agent message before publishing its ACK', () => {
    const order: string[] = [];
    const dto = agentMessage();
    onPublish = () => order.push('published');

    service.process(dto, () => order.push('processed'));

    expect(order).toEqual(['processed', 'published']);
    expect(published).toEqual([
      {
        destination: '/app/chat.ack',
        body: { userId: 'user-1', messageId: 'message-1' },
      },
    ]);
  });

  it('does not process a repeated message and publishes its ACK again', () => {
    const process = jasmine.createSpy('process');
    const dto = agentMessage();

    service.process(dto, process);
    service.process(dto, process);

    expect(process).toHaveBeenCalledTimes(1);
    expect(published).toHaveSize(2);
  });

  it('removes a pending ACK only for a matching ACKNOWLEDGED response', () => {
    service.process(agentMessage(), () => undefined);

    expect(
      service.confirm({
        userId: 'another-user',
        messageId: 'message-1',
        status: 'ACKNOWLEDGED',
      }),
    ).toBeFalse();
    expect(
      service.confirm({
        userId: 'user-1',
        messageId: 'message-1',
        status: 'ACKNOWLEDGED',
      }),
    ).toBeTrue();
    expect(
      service.confirm({
        userId: 'user-1',
        messageId: 'message-1',
        status: 'ACKNOWLEDGED',
      }),
    ).toBeFalse();
  });

  it('ignores malformed ACK responses', () => {
    service.process(agentMessage(), () => undefined);

    expect(
      service.confirm({
        userId: 'user-1',
        messageId: 'message-1',
        status: 'REJECTED',
      }),
    ).toBeFalse();
  });

  it('processes a message without identifiers but does not publish an ACK', () => {
    const process = jasmine.createSpy('process');
    spyOn(console, 'error');

    service.process(agentMessage({ id: null, userId: null }), process);

    expect(process).toHaveBeenCalledOnceWith();
    expect(published).toHaveSize(0);
    expect(console.error).toHaveBeenCalled();
  });

  function agentMessage(
    overrides: Partial<AdvisorMessageEventDto> = {},
  ): AdvisorMessageEventDto {
    return {
      id: 'message-1',
      userId: 'user-1',
      conversationId: 'conversation-1',
      senderId: 'agent-1',
      senderName: 'Advisor',
      content: 'Hello',
      type: 'AGENT',
      timestamp: '2026-08-06T10:00:00',
      genesysMessageId: null,
      ...overrides,
    };
  }
});
