import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, effect, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DftFilterItem, DftFilterApplyModel } from './filter.model';
import { FilterStore } from './filter.store';
import { DftTextFilterComponent } from './text/text.component';
import { DftOptionsFilterComponent } from './options/options.component';
import { DftCompareFilterComponent } from './compare/compare.component';
import { MockOptionsService } from './options.service';

@Component({
  selector: 'dft-filter',
  standalone: true,
  template: `
    <div class="p-4">
      <div class="grid gap-3 md:grid-cols-3">
        <ng-container *ngFor="let f of filters; trackBy: trackByFilter">
          <div class="border rounded p-2 mat-elevation-z1">
            <!-- Using the new sub-components -->
            <dft-text-filter 
              *ngIf="f.type === 'text'"
              [filter]="f"
              [value]="values()[f.name]"
              (valueChange)="onValueChange(f.name, $event)"
              (blur)="onFilterBlur(f.name)"
              (enter)="onFilterEnter($event, f.name)">
            </dft-text-filter>

            <dft-options-filter 
              *ngIf="f.type === 'options'"
              [filter]="f"
              [value]="values()[f.name] || []"
              [staticOptions]="f.staticOptions || getStaticOptions(f)"
              (valueChange)="onValueChange(f.name, $event)">
            </dft-options-filter>

            <dft-compare-filter 
              *ngIf="f.type === 'compare'"
              [filter]="f"
              [value]="values()[f.name]"
              (valueChange)="onValueChange(f.name, $event)">
            </dft-compare-filter>
          </div>
        </ng-container>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button mat-raised-button (click)="reset()" color="warn">Reset</button>
        <button mat-raised-button color="primary" (click)="apply()">Apply</button>
      </div>
    </div>
  `,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DftTextFilterComponent,
    DftOptionsFilterComponent,
    DftCompareFilterComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DftFilterComponent implements OnInit {
  @Input() filters: DftFilterItem[] = [];
  @Input() queryParam = false;
  @Input() storeId: string | undefined;

  @Output() onFiltersApplied = new EventEmitter<DftFilterApplyModel[]>();

  values = signal<Record<string, any>>({});
  private store: FilterStore | undefined;
  private optionsService = inject(MockOptionsService);

  constructor() {
    // Set up an effect to sync store values with the component's signal when store is available
    effect(() => {
      if (this.store) {
        const storeValues = this.store.values();
        // Ensure compare filters have the proper structure when initializing from store
        const updatedValues = { ...storeValues };
        this.filters.forEach(filter => {
          if (filter.type === 'compare' && filter.compareType === 'range') {
            if (updatedValues[filter.name] && typeof updatedValues[filter.name] === 'object') {
              // Ensure min/max structure exists
              updatedValues[filter.name] = {
                min: updatedValues[filter.name].min ?? null,
                max: updatedValues[filter.name].max ?? null
              };
            } else if (!updatedValues[filter.name]) {
              // Initialize with empty min/max if not set
              updatedValues[filter.name] = { min: null, max: null };
            }
          } else if (filter.type === 'compare' && filter.compareType === 'single') {
            if (!updatedValues[filter.name]) {
              updatedValues[filter.name] = { operator: 'eq', value: null };
            }
          }
        });
        this.values.set(updatedValues);
      }
    });
  }

  ngOnInit() {
    if (this.storeId) {
      this.store = FilterStore.getStore(this.storeId);
      // Initialize the store with filters if not already done
      this.store.initFilters(this.filters);
      // Initialize compare type filters with proper structure
      this.filters.forEach(filter => {
        if (filter.type === 'compare') {
          if (filter.compareType === 'range') {
            const currentValue = this.store?.values()[filter.name];
            if (!currentValue) {
              this.store?.setValue(filter.name, { min: null, max: null });
            }
          } else if (filter.compareType === 'single') {
            const currentValue = this.store?.values()[filter.name];
            if (!currentValue) {
              this.store?.setValue(filter.name, { operator: 'eq', value: null });
            }
          }
        }
      });
    }
  }

  // Very small default static options for demo. Real library will load/merge dynamic options.
  getStaticOptions(f: DftFilterItem) {
    if (f.name === 'category') {
      return [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Books', value: 'books' },
        { label: 'Clothing', value: 'clothing' }
      ];
    }
    return [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' }
    ];
  }

  onValueChange(key: string, value: any) {
    // Update local values signal and store if available
    const currentValues = { ...this.values() };
    currentValues[key] = value;
    this.values.set(currentValues);

    if (this.store) {
      this.store.setValue(key, value);
    }
    // emits intermediate state (optional). library uses Apply on button as canonical.
  }

  onFilterBlur(key: string) {
    // Handle blur event if needed
  }

  onFilterEnter(event: KeyboardEvent, key: string) {
    // Handle enter key event if needed
  }

  apply() {
    // Sync values with store before applying
    if (this.store) {
      // Apply using store and emit result
      const applied = this.store.apply();
      this.onFiltersApplied.emit(applied);
    } else {
      const out: DftFilterApplyModel[] = this.filters.map(f => ({
        name: f.name,
        value: this.values()[f.name] ?? null
      }));
      this.onFiltersApplied.emit(out);
    }
  }

  reset() {
    this.values.set({});
    // Clear store values if available
    if (this.store) {
      this.store.reset();
      this.store.apply(); // Update lastApplied
    }
    this.onFiltersApplied.emit([]);
  }

  trackByFilter(index: number, filter: DftFilterItem) {
    return filter.name;
  }
}
