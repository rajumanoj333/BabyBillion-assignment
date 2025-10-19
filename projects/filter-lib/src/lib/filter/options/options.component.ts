// projects/filter-lib/src/lib/filter/options/options.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable, BehaviorSubject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map, catchError } from 'rxjs/operators';
import { DftFilterItem } from '../filter.model';
import { MockOptionsService, OptionItem, PageResult } from '../options.service';

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
        [disabled]="isDisabled"
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
          *ngFor="let option of (filteredOptions$ | async)?.items"
          [value]="option.value"
          [disabled]="isDisabled">
          {{ option.label }}
        </mat-option>
        
        <!-- Load more option if pagination is available -->
        <mat-option 
          *ngIf="hasMoreOptions && !loading && !isDisabled" 
          (click)="loadMoreOptions()"
          class="font-medium text-blue-600"
          [disabled]="isDisabled">
          Load More...
        </mat-option>
      </mat-autocomplete>
      
      <!-- Static options select -->
      <mat-select 
        *ngIf="!filter.isDynamicOptions"
        [value]="selectedValues"
        (selectionChange)="onSelectionChange($event.value)"
        multiple
        panelClass="dft-options-panel"
        [disabled]="isDisabled">
        <mat-option 
          *ngFor="let option of staticOptions" 
          [value]="option.value"
          [disabled]="isDisabled">
          {{ option.label }}
        </mat-option>
      </mat-select>
      
      <!-- Clear button -->
      <button 
        *ngIf="selectedValues && selectedValues.length > 0 && !isDisabled" 
        mat-icon-button 
        matSuffix
        class="clear-button"
        (click)="clearSelection()"
        aria-label="Clear selection"
        [disabled]="isDisabled">
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
          *ngIf="!isDisabled"
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
  private _isDisabled = false;
  @Input() 
  set isDisabled(value: boolean) {
    this._isDisabled = value;
    if (value) {
      this.searchControl.disable({onlySelf: true, emitEvent: false});
    } else {
      this.searchControl.enable({onlySelf: true, emitEvent: false});
    }
  }
  get isDisabled(): boolean {
    return this._isDisabled;
  }
  
  @Output() valueChange = new EventEmitter<any[]>();

  searchControl = new FormControl({value: '', disabled: false});
  selectedValues: any[] = [];
  
  private optionsService = inject(MockOptionsService);
  private subscriptions = new Subscription();
  
  // Dynamic options state
  filteredOptions$: Observable<PageResult | null> = of(null);
  loading = false;
  hasMoreOptions = false;
  currentPage = 1;
  totalLoaded = 0;
  allLoadedOptions: OptionItem[] = [];

  ngOnInit() {
    this.selectedValues = this.value || [];
    
    // Update disabled state when isDisabled input changes
    if (this.isDisabled) {
      this.searchControl.disable({onlySelf: true, emitEvent: false});
    }
    
    if (this.filter.isDynamicOptions && this.filter.getOptions) {
      const search$ = this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value || ''),
        debounceTime(300),
        distinctUntilChanged(),
        map(search => search || '')
      );
      
      this.filteredOptions$ = search$.pipe(
        switchMap(search => {
          this.loading = true;
          if (search !== this.searchControl.value || this.currentPage !== 1) {
            this.currentPage = 1;
            this.allLoadedOptions = [];
          }
          return this.fromPromise(this.filter.getOptions!(this.filter, search, this.currentPage));
        }),
        map((result: PageResult) => {
          this.loading = false;
          this.hasMoreOptions = result.page < result.totalPages;
          this.totalLoaded = result.totalItems;
          
          if (this.currentPage === 1) {
            this.allLoadedOptions = [...result.items];
          } else {
            this.allLoadedOptions = [...this.allLoadedOptions, ...result.items];
          }
          
          return { ...result, items: this.allLoadedOptions };
        }),
        catchError((error) => {
          this.loading = false;
          console.error('Error loading options:', error);
          return of(null);
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSelectionChange(newValues: any[]) {
    if (this.isDisabled) return;
    this.selectedValues = newValues;
    this.valueChange.emit(newValues);
  }

  onOptionSelected(event: any) {
    if (this.isDisabled) return;
    const selectedValue = event.option.value;
    if (!this.selectedValues.includes(selectedValue)) {
      this.selectedValues = [...this.selectedValues, selectedValue];
      this.valueChange.emit([...this.selectedValues]);
    }
    this.searchControl.setValue('');
  }

  loadMoreOptions() {
    if (this.isDisabled || this.loading || !this.hasMoreOptions) return;
    
    this.loading = true;
    this.currentPage++;
    
    const search = this.searchControl.value || '';
    
    let optionsPromise: Promise<PageResult>;
    if (this.filter.getOptions) {
      optionsPromise = this.filter.getOptions(this.filter, search, this.currentPage);
    } else {
      optionsPromise = this.optionsService.search(this.filter.name, search, this.currentPage);
    }
    
    optionsPromise.then(result => {
      this.loading = false;
      this.hasMoreOptions = result.page < result.totalPages;
      this.totalLoaded = result.totalItems;
      
      this.allLoadedOptions = [...this.allLoadedOptions, ...result.items];
      this.filteredOptions$ = of({ ...result, items: this.allLoadedOptions });
    }).catch(error => {
      this.loading = false;
      console.error('Error loading more options:', error);
    });
  }

  clearSelection() {
    if (this.isDisabled) return;
    this.selectedValues = [];
    this.valueChange.emit([]);
    this.searchControl.setValue('');
  }

  removeValue(value: any) {
    if (this.isDisabled) return;
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.valueChange.emit([...this.selectedValues]);
  }

  getOptionLabel(value: any): string {
    const option = this.allLoadedOptions.find(opt => opt.value === value);
    if (option) return option.label;
    
    const staticOption = this.staticOptions.find(opt => opt.value === value);
    return staticOption ? staticOption.label : String(value);
  }

  trackByValue(index: number, item: any) {
    return item;
  }
  
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