import {
  Component,
  importProvidersFrom,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  bootstrapApplication,
  DomSanitizer,
  SafeHtml,
} from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <!-- Header with title and language buttons -->
      <div class="w-full max-w-2xl flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Riqs Email Templates</h1>
        
        <!-- Language buttons in top right corner -->
        <div class="flex gap-2">
        <button 
  *ngFor="let language of languages" 
  (click)="selectlanaugeItem(language)"
  [ngStyle]="{ 'background-color': getButtonColor(language) }"
  class="px-3 py-1 text-white rounded-lg transition hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
>
  {{ language }}
</button>
        </div>
      </div>

      <!-- Dropdown Menu -->
      <div class="relative w-full max-w-lg">
        <button 
          (click)="toggleDropdown()"
          class="w-full flex justify-between px-4 py-2 bg-blue-500 text-white rounded-lg transition hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {{ selectedItem ? selectedItem.Name : 'Select an Item' }}
          <span [class.rotate-180]="isDropdownOpen">▼</span>
        </button>
        
        <div *ngIf="isDropdownOpen" class="absolute w-full mt-2 bg-white shadow-lg rounded-lg z-10">
          <!-- Search input -->
          <div class="p-2 border-b">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search items..."
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              (click)="$event.stopPropagation()"
            >
          </div>
          
          <!-- Dropdown list with max height and scrolling -->
          <div class="max-h-64 overflow-y-auto">
            <ul>
              <li *ngFor="let item of filteredItems">
                <button 
                  (click)="onSelectItem(item)" 
                  class="w-full text-left px-4 py-3 hover:bg-gray-200 transition border-b"
                >
                  {{ item.Name }}
                </button>
              </li>
            </ul>
            
            <!-- No results message -->
            <div *ngIf="filteredItems.length === 0" class="p-4 text-center text-gray-500">
              No items match your search
            </div>
          </div>
        </div>
      </div>

      <!-- Display Selected Item -->
      <div *ngIf="selectedItem" class="w-full max-w-2xl mt-6 p-6 bg-white shadow-lg rounded-lg">
        <h2 class="text-xl font-semibold text-gray-900">📌 Name: {{ selectedItem.Name }}</h2>
        <p class="text-gray-600">📩 Subject: {{ selectedItem.TemplateSubject }}</p>
        
        <div class="mt-4 border-t pt-4" [innerHTML]="sanitizeHtml(selectedItem.TemplateBody)"></div>
      </div>
    </div>
  `,
  styles: [
    `
    /* Add any additional styles here */
  `,
  ],
  imports: [CommonModule, HttpClientModule, FormsModule],
})
export class App {
  name = 'Angular';

  private readonly http: HttpClient = inject(HttpClient);

  private jsonUrl = './assets/dummy.json'; // Path to your JSON file
  data: any[] = [];
  emailTemplates: any[] = [];
  selectedItem: any = null;
  isDropdownOpen = false;
  searchQuery: string = '';

  languages = ['en-US', 'de-DE','fr-FR','it-IT'];

  constructor(private sanitizer: DomSanitizer) {
    this.getProcessedJson().subscribe((res) => {
      console.log(res);
      this.emailTemplates = res.filter(
        (x) => x.Language == 'en-US' || x.Language == 'de-DE' || x.Language == 'fr-FR' || x.Language == 'it-IT'
      );

      this.data = this.emailTemplates.filter((x) => x.Language == 'en-US');
      this.selectedItem = this.data[0]; // Default selection
      console.log(res, this.emailTemplates, this.data);
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.searchQuery = ''; // Clear search when opening dropdown
    }
  }

  onSelectItem(item: any): void {
    this.selectedItem = item;
    this.isDropdownOpen = false; // Close dropdown after selection
  }

  selectlanaugeItem(l: any) {
    this.data = this.emailTemplates.filter((x) => x.Language == l);

    // Try to find the same template name in the new language selection
    const sameTemplate = this.data.find(
      (x) => x.Name === this.selectedItem.Name
    );
    if (sameTemplate) {
      this.selectedItem = sameTemplate;
    } else if (this.data.length > 0) {
      this.selectedItem = this.data[0];
    }
  }

  get filteredItems() {
    if (!this.searchQuery) return this.data;
    return this.data.filter((item) =>
      item.Name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  getButtonColor(language: string): string {
    switch (language) {
      case 'en-US':
        return '#08712dff'; // DodgerBlue
      case 'fr-FR':
        return '#2fa4ecff'; // Tomato
      case 'de-DE':
        return '#32CD32'; // LimeGreen
      case 'it-IT':
        return '#d29209ff'; // Gold
      // Add more languages and their corresponding colors as needed
      default:
        return '#4CAF50'; // Default to green
    }
  }
  getProcessedJson(): Observable<any[]> {
    return this.http.get(this.jsonUrl, { responseType: 'text' }).pipe(
      map((response) => {
        // Split the response by lines and filter out any empty lines
        const jsonObjects = response
          .split('\n')
          .filter((line) => line.trim() !== '');

        // Join the objects with commas and enclose in square brackets
        const jsonArray = `[${jsonObjects.join(',')}]`;
        const parsedArray = JSON.parse(jsonArray);
        // Parse the JSON array

        return parsedArray.map((res: any) => {
          console.log(`Name: ${res.Name}, Language: ${res.Language}`);
          return {
            Name: res.Name,
            Language: res.Language,
            TemplateBody: res.TemplateBody,
            TemplateSubject: res.TemplateSubject,
          };
        });
      })
    );
  }
}

bootstrapApplication(App, {
  providers: [importProvidersFrom(HttpClientModule, FormsModule)],
});
