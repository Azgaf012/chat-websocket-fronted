import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidget } from './chat/presentation/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
