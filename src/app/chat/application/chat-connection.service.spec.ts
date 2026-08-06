import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { AdvisorMessageEventDto } from '../domain/advisor-message.dto';
import { ConversationIdProvider } from '../infrastructure/identity/conversation-id.provider';
import { UserIdProvider } from '../infrastructure/identity/user-id.provider';
import {
  CHAT_TRANSPORT,
  ChatTransport,
  ConnectOptions,
  Subscription,
  TransportStatus,
} from '../infrastructure/transport/transport.tokens';
import { ChatConnectionService } from './chat-connection.service';
import { IncomingEventHandler } from './handlers/incoming-event.handler';
import { MessageAcknowledgementService } from './message-acknowledgement.service';
import { ChatStore } from './state/chat.store';

describe('ChatConnectionService ACK integration', () => {
  let service: ChatConnectionService;
  let transport: TransportStub;
  let handler: jasmine.SpyObj<IncomingEventHandler>;
  let acknowledgements: jasmine.SpyObj<MessageAcknowledgementService>;

  beforeEach(() => {
    transport = new TransportStub();
    handler = jasmine.createSpyObj<IncomingEventHandler>('handler', ['handle']);
    acknowledgements = jasmine.createSpyObj<MessageAcknowledgementService>(
      'acknowledgements',
      ['process', 'confirm'],
    );
    acknowledgements.process.and.callFake((_dto, processMessage) =>
      processMessage(),
    );

    TestBed.configureTestingModule({
      providers: [
        ChatConnectionService,
        { provide: CHAT_TRANSPORT, useValue: transport },
        {
          provide: ConversationIdProvider,
          useValue: {
            current: () => 'conversation-1',
            regenerate: () => undefined,
          },
        },
        {
          provide: UserIdProvider,
          useValue: { current: () => 'user-1' },
        },
        { provide: IncomingEventHandler, useValue: handler },
        { provide: MessageAcknowledgementService, useValue: acknowledgements },
        {
          provide: ChatStore,
          useValue: {
            setStatus: () => undefined,
            reset: () => undefined,
          },
        },
      ],
    });
    service = TestBed.inject(ChatConnectionService);
  });

  it('connects with userId and subscribes to message and ACK queues', async () => {
    await service.connect();

    expect(transport.connectOptions?.headers['userId']).toBe('user-1');
    expect(transport.destinations()).toContain('/user/queue/chat-response');
    expect(transport.destinations()).toContain('/user/queue/chat-ack');
    expect(transport.destinations()).toContain(
      '/topic/conversation/conversation-1',
    );
  });

  it('routes only personal AGENT and BOT messages through ACK processing', async () => {
    await service.connect();
    const agent = message({ type: 'AGENT' });
    const bot = message({ id: 'message-2', type: 'BOT' });
    const typing = message({ id: 'message-3', type: 'TYPING' });

    transport.deliver('/user/queue/chat-response', agent);
    transport.deliver('/user/queue/chat-response', bot);
    transport.deliver('/user/queue/chat-response', typing);
    transport.deliver('/topic/conversation/conversation-1', agent);

    expect(acknowledgements.process).toHaveBeenCalledTimes(2);
    expect(handler.handle).toHaveBeenCalledTimes(4);
  });

  it('passes backend ACK confirmations to the coordinator', async () => {
    await service.connect();
    const confirmation = {
      userId: 'user-1',
      messageId: 'message-1',
      status: 'ACKNOWLEDGED',
    };

    transport.deliver('/user/queue/chat-ack', confirmation);

    expect(acknowledgements.confirm).toHaveBeenCalledOnceWith(confirmation);
  });

  function message(
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

class TransportStub implements ChatTransport {
  readonly status$: Observable<TransportStatus> = of('idle');
  connectOptions: ConnectOptions | null = null;
  private readonly handlers = new Map<string, (payload: unknown) => void>();

  connect(opts: ConnectOptions): Promise<void> {
    this.connectOptions = opts;
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  subscribe<T = unknown>(
    destination: string,
    handler: (payload: T) => void,
  ): Subscription {
    this.handlers.set(destination, (payload) => handler(payload as T));
    return { unsubscribe: () => this.handlers.delete(destination) };
  }

  publish(): void {}

  destinations(): string[] {
    return [...this.handlers.keys()];
  }

  deliver(destination: string, payload: unknown): void {
    const handler = this.handlers.get(destination);
    if (!handler) {
      throw new Error(`No subscription for ${destination}`);
    }
    handler(payload);
  }
}
