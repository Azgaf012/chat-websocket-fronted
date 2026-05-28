import SockJS from 'sockjs-client';

/**
 * Returns a factory function usable by `@stomp/stompjs` `webSocketFactory`.
 * Isolated so the SockJS dependency only leaks through this file.
 */
export function createSockJsFactory(
  url: string,
  headers?: Record<string, string>,
): () => WebSocket {
  return () => new SockJS(url, null, { headers }) as unknown as WebSocket;
}
