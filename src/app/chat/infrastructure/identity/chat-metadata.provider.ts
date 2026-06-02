import { Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';

/** Metadata fields attached to every outbound chat message. */
export interface ChatMetadata {
  device: string;
  deviceIp: string;
  session: string;
  channelSession: string;
  medium: string;
  app: string;
  geolocation: string;
  agency: string;
}

/**
 * Supplies request-context metadata for outbound messages.
 * Mocked from environment for development/testing. `medium`/`app`
 * reuse the configured WS headers.
 */
@Injectable({ providedIn: 'root' })
export class ChatMetadataProvider {
  current(): ChatMetadata {
    const meta = environment.chatMetadata;
    return {
      device: meta.device,
      deviceIp: meta.deviceIp,
      session: meta.session,
      channelSession: meta.channelSession,
      medium: environment.wsHeaders.xMedium,
      app: environment.wsHeaders.xApp,
      geolocation: meta.geolocation,
      agency: meta.agency,
    };
  }
}
