// projects/filter-lib/src/lib/filter/options/options.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule, MatOption } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocomplete } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map, catchError } from 'rxjs/operators';
import { DftFilterItem } from '../filter.model';
import { MockOptionsService, OptionItem } from '../options.service';

@Component({
  selector: 'dft-options-filter',
  standalone: true,
  template: `
    <mat-form-field class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ filter.label || filter.name }}</mat-label>
      
      <!-- Search input for dynamic options -->
      <input 
        *ngIf="filter.isDynamicOptions" 
        matInput
        placeholder="Search options..."
        [formControl]="searchControl"
        [matAutocomplete]="auto" />
      
      <!-- Autocomplete for dynamic options -->
      <mat-autocomplete 
        #auto="matAutocomplete" 
        (optionSelected)="onOptionSelected($event)">
        <mat-option *ngIf="loading" class="p-2">
          <div class="flex justify-center">
            <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
          </div>
        </mat-option>
        
        <mat-option 
          *ngFor="let option of filteredOptions$ | async" 
          [value]="option.value">
          {{ option.label }}
        </mat-option>
        
        <!-- Load more option if pagination is available -->
        <mat-option 
          *ngIf="hasMoreOptions && !loading" 
          (click)="loadMoreOptions()"
          class="font-medium text-blue-600">
          Load More...
        </mat-option>
      </mat-autocomplete>
      
      <!-- Static options select -->
      <mat-select 
        *ngIf="!filter.isDynamicOptions"
        [value]="selectedValues"
        (selectionChange)="onSelectionChange($event.value)"
        multiple
        panelClass="dft-options-panel">
        <mat-option 
          *ngFor="let option of staticOptions" 
          [value]="option.value">
          {{ option.label }}
        </mat-option>
      </mat-select>
      
      <!-- Clear button -->
      <button 
        *ngIf="selectedValues && selectedValues.length > 0" 
        mat-icon-button 
        matSuffix
        (click)="clearSelection()"
        aria-label="Clear selection">
        <mat-icon>close</mat-icon>
      </button>
    </mat-form-field>
    
    <!-- Selected values display -->
    <div class="mt-2 flex flex-wrap gap-1" *ngIf="selectedValues && selectedValues.length > 0">
      <span 
        *ngFor="let value of selectedValues; trackBy: trackByValue" 
        class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
        {{ getOptionLabel(value) }}
        <button 
          type="button" 
          class="ml-1 text-blue-600 hover:text-blue-800"
          (click)="removeValue(value)"
          aria-label="Remove">
          ×
        </button>
      </span>
    </div>
  `,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DftOptionsFilterComponent implements OnInit, OnDestroy {
  @Input() filter!: DftFilterItem;
  @Input() value: any[] = [];
  @Input() staticOptions: OptionItem[] = [];
  @Output() valueChange = new EventEmitter<any[]>();

  searchControl = new FormControl('');
  selectedValues: any[] = [];
  
  private optionsService = inject(MockOptionsService);
  private subscriptions = new Subscription();
  
  // Dynamic options state
  filteredOptions$ = new BehaviorSubject<OptionItem[]>([]);
  loading = false;
  hasMoreOptions = false;
  currentPage = 1;
  totalLoaded = 0;
  allLoadedOptions: OptionItem[] = [];

  ngOnInit() {
    this.selectedValues = this.value || [];
    
    if (this.filter.isDynamicOptions && this.filter.getOptions) {
      // Set up dynamic option loading with search and debouncing
      const search$ = this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value || ''),
        debounceTime(300), // Debounce search
        distinctUntilChanged(),
        map(search => search || '')
      );
      
      // Combine search changes with option loading
      this.subscriptions.add(
        search$.pipe(
          switchMap(search => {
            this.loading = true;
            // Reset pagination when search changes
            if (search !== this.searchControl.value || this.currentPage !== 1) {
              this.currentPage = 1;
              this.allLoadedOptions = [];
            }
            
            // Use custom getOptions if provided, otherwise use mock service
            return this.fromPromise(this.filter.getOptions!(this.filter, search, this.currentPage));
          }),
          map((result: any) => {
            this.loading = false;
            this.hasMoreOptions = result.page < result.totalPages;
            this.totalLoaded = result.totalItems;
            
            // Update all loaded options
            if (this.currentPage === 1) {
              this.allLoadedOptions = [...result.items];
            } else {
              this.allLoadedOptions = [...this.allLoadedOptions, ...result.items];
            }
            
            return result.items;
          }),
          catchError((error) => {
            this.loading = false;
            console.error('Error loading options:', error);
            return of([]);
          })
        ).subscribe(options => {
          this.filteredOptions$.next(options);
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSelectionChange(newValues: any[]) {
    this.selectedValues = newValues;
    this.valueChange.emit(newValues);
  }

  onOptionSelected(event: any) {
    const selectedValue = event.option.value;
    if (!this.selectedValues.includes(selectedValue)) {
      this.selectedValues = [...this.selectedValues, selectedValue];
      this.valueChange.emit([...this.selectedValues]);
    }
    // Clear search after selection to allow more selections
    this.searchControl.setValue('');
  }

  onAutocompleteClosed() {
    // When autocomplete closes, clear search but keep selected values
    setTimeout(() => {
      this.searchControl.setValue('');
    }, 1);
  }

  loadMoreOptions() {
    if (this.loading || !this.hasMoreOptions) return;
    
    this.loading = true;
    this.currentPage++;
    
    const search = this.searchControl.value || '';
    
    // Load more options using the same logic
    let optionsPromise: Promise<any>;
    if (this.filter.getOptions) {
      optionsPromise = this.filter.getOptions(this.filter, search, this.currentPage);
    } else {
      optionsPromise = this.optionsService.search(this.filter.name, search, this.currentPage);
    }
    
    optionsPromise.then(result => {
      this.loading = false;
      this.hasMoreOptions = result.page < result.totalPages;
      this.totalLoaded = result.totalItems;
      
      // Add new options to existing ones
      this.allLoadedOptions = [...this.allLoadedOptions, ...result.items];
      this.filteredOptions$.next(result.items); // Only show newly loaded items in the dropdown
    }).catch(error => {
      this.loading = false;
      console.error('Error loading more options:', error);
    });
  }

  clearSelection() {
    this.selectedValues = [];
    this.valueChange.emit([]);
    this.searchControl.setValue('');
  }

  removeValue(value: any) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.valueChange.emit([...this.selectedValues]);
  }

  getOptionLabel(value: any): string {
    const option = this.allLoadedOptions.find(opt => opt.value === value);
    if (option) return option.label;
    
    // If not found in loaded options, look in static options
    const staticOption = this.staticOptions.find(opt => opt.value === value);
    return staticOption ? staticOption.label : String(value);
  }

  trackByValue(index: number, item: any) {
    return item;
  }
  
  // Helper method to convert promise to observable
  private fromPromise<T>(promise: Promise<T>): Observable<T> {
    return new Observable(observer => {
      promise.then(
        value => {
          observer.next(value);
          observer.complete();
        },
        error => {
          observer.error(error);
        }
      );
    });
  }
}