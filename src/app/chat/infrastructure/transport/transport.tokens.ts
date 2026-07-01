import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type TransportStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ConnectOptions {
  /** Headers sent in the STOMP CONNECT frame (e.g. `sessionId`). */
  headers: Record<string, string>;
}

export interface Subscription {
  unsubscribe(): void;
}

/**
 * Abstraction over the transport layer.
 * Implementations: `StompTransport` (default), or a mock for tests.
 * Components and application services depend on this interface only.
 */
export interface ChatTransport {
  readonly status$: Observable<TransportStatus>;

  connect(opts: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;

  subscribe<T = unknown>(
    destination: string,
    handler: (payload: T) => void,
  ): Subscription;

  /** Optional `headers` are merged into the STOMP MESSAGE frame headers. */
  publish(destination: string, body: unknown, headers?: Record<string, string>): void;
}

export const CHAT_TRANSPORT = new InjectionToken<ChatTransport>(
  'CHAT_TRANSPORT',
);
