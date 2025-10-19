import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  effect,
  signal,
  inject,
} from '@angular/core';
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
            >
            </dft-text-filter>

            <dft-options-filter
              *ngIf="f.type === 'options'"
              [filter]="f"
              [value]="values()[f.name] || []"
              (valueChange)="onValueChange(f.name, $event)"
            >
            </dft-options-filter>

            <dft-compare-filter
              *ngIf="f.type === 'compare'"
              [filter]="f"
              [value]="values()[f.name]"
              (valueChange)="onValueChange(f.name, $event)"
            >
            </dft-compare-filter>
          </div>
        </ng-container>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button mat-raised-button (click)="clear()">Clear</button>
        <button mat-raised-button color="primary" (click)="apply()">
          Apply
        </button>
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
    DftCompareFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DftFilterComponent implements OnInit {
  @Input() filters: DftFilterItem[] = [];
  @Input() queryParam = false;
  @Input() storeId: string | undefined;

  @Output() onFiltersApplied = new EventEmitter<DftFilterApplyModel[]>();

  values = signal<Record<string, any>>({});
  private store: FilterStore | undefined;

  constructor() {
    effect(() => {
      if (this.store) {
        this.values.set(this.store.values());
      }
    });
  }

  ngOnInit() {
    if (this.storeId) {
      this.store = FilterStore.getStore(this.storeId);
      this.store.initFilters(this.filters);
    }
  }

  onValueChange(key: string, value: any) {
    this.values.set({ ...this.values(), [key]: value });

    if (this.store) {
      this.store.setValue(key, value);
    }
  }

  apply() {
    if (this.store) {
      const applied = this.store.apply();
      this.onFiltersApplied.emit(applied);
    } else {
      const out: DftFilterApplyModel[] = this.filters.map((f) => ({
        name: f.name,
        value: this.values()[f.name] ?? null,
      }));
      this.onFiltersApplied.emit(out);
    }
  }

  clear() {
    this.values.set({});
    if (this.store) {
      this.store.reset();
    }
    this.onFiltersApplied.emit([]);
  }

  trackByFilter(index: number, filter: DftFilterItem) {
    return filter.name;
  }
}
