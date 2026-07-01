import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { createSockJsFactory } from './sockjs-factory';
import {
  ChatTransport,
  ConnectOptions,
  Subscription,
  TransportStatus,
} from './transport.tokens';

/**
 * Default implementation of `ChatTransport` using STOMP 1.2 over SockJS.
 * Knows nothing about chat semantics — only transport-level concerns.
 */
@Injectable({ providedIn: 'root' })
export class StompTransport implements ChatTransport {
  private client: Client | null = null;
  private readonly statusSubject = new BehaviorSubject<TransportStatus>('idle');

  readonly status$: Observable<TransportStatus> =
    this.statusSubject.asObservable();

  connect(opts: ConnectOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disposeClient();

      const client = new Client({
        webSocketFactory: createSockJsFactory(environment.wsUrl),
        connectHeaders: opts.headers,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        reconnectDelay: 0, // we control reconnection from the application layer
        debug: () => {
          /* silenced by default; flip to console.log for STOMP debugging */
        },
      });

      let settled = false;

      client.onConnect = () => {
        this.statusSubject.next('connected');
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      client.onStompError = (frame) => {
        this.statusSubject.next('error');
        if (!settled) {
          settled = true;
          reject(new Error(frame.headers['message'] ?? 'STOMP error'));
        }
      };

      client.onWebSocketError = () => {
        this.statusSubject.next('error');
      };

      client.onWebSocketClose = () => {
        this.statusSubject.next('disconnected');
      };

      this.statusSubject.next('connecting');
      this.client = client;
      client.activate();
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.deactivate();
    } finally {
      this.disposeClient();
      this.statusSubject.next('disconnected');
    }
  }

  subscribe<T = unknown>(
    destination: string,
    handler: (payload: T) => void,
  ): Subscription {
    if (!this.client || !this.client.connected) {
      throw new Error('Transport not connected — cannot subscribe.');
    }
    const sub: StompSubscription = this.client.subscribe(
      destination,
      (msg: IMessage) => {
        const payload = this.parseBody<T>(msg);
        console.group('[chat] inbound frame (backend → frontend)');
        console.log('destination :', destination);
        console.log('--- stomp headers ---');
        console.log(msg.headers);
        console.log('--- body ---');
        console.log(payload);
        console.groupEnd();
        handler(payload);
      },
    );
    return { unsubscribe: () => sub.unsubscribe() };
  }

  publish(
    destination: string,
    body: unknown,
    headers: Record<string, string> = {},
  ): void {
    if (!this.client || !this.client.connected) {
      throw new Error('Transport not connected — cannot publish.');
    }
    this.client.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        // TODO: replace with real values before going to production
        'x-guid': 'test-guid-12345',
        Authorization: 'Bearer test-bearer-token',
        ...headers,
      },
    });
  }

  private parseBody<T>(msg: IMessage): T {
    try {
      return JSON.parse(msg.body) as T;
    } catch {
      return msg.body as unknown as T;
    }
  }

  private disposeClient(): void {
    this.client = null;
  }
}
