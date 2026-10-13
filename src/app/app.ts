import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from './app-header/app-header';
import { HlmToasterImports } from './shared/ui/sonner/src';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, HlmToasterImports],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly appName = 'Team Nest';
}
