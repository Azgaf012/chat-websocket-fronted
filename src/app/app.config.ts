import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { StompTransport } from './chat/infrastructure/transport/stomp-transport';
import { CHAT_TRANSPORT } from './chat/infrastructure/transport/transport.tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: CHAT_TRANSPORT, useExisting: StompTransport },
  ],
};
