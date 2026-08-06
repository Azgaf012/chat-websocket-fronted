import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CHAT_TRANSPORT } from './chat/infrastructure/transport/transport.tokens';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: CHAT_TRANSPORT,
          useValue: {
            status$: of('idle'),
            connect: () => Promise.resolve(),
            disconnect: () => Promise.resolve(),
            subscribe: () => ({ unsubscribe: () => undefined }),
            publish: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Chat WebSocket',
    );
  });
});
