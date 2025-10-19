import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Filter Library Demo</h1>
        <p class="text-sm text-gray-600">A demo for the filter-lib (text, options, compare)</p>
      </header>

      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {}
