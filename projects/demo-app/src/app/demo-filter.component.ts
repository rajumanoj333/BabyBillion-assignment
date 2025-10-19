import { Component, signal, OnInit } from '@angular/core';
import {
  DftFilterComponent,
  DftFilterItem,
  DftFilterApplyModel,
  FilterStore,
  MockOptionsService,
} from 'filter-lib';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-demo-filter',
  standalone: true,
  imports: [CommonModule, DftFilterComponent],
  providers: [MockOptionsService],
  template: `
    <section class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-semibold mb-4">Live Filter Demo (Hydrated)</h2>

      <dft-filter
        [filters]="filterItems()"
        [queryParam]="true"
        [storeId]="'demo-filters'"
        (onFiltersApplied)="onFiltersApplied($event)"
      >
      </dft-filter>

      <div class="mt-6">
        <h3 class="font-medium">Last applied filters (object):</h3>
        <pre class="bg-gray-100 p-3 rounded mt-2">{{ applied | json }}</pre>
        <div class="mt-3 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> Filters are hydrated from URL query parameters
            at load. You can also persist state to localStorage using the store
            methods.
          </p>
        </div>
        <div class="mt-3 flex gap-2">
          <button (click)="saveSnapshot()" class="px-3 py-1 border rounded">
            Save to localStorage
          </button>
          <button (click)="loadSnapshot()" class="px-3 py-1 border rounded">
            Load fromLocalStorage
          </button>
          <button (click)="clearSnapshot()" class="px-3 py-1 border rounded">
            Clear localStorage
          </button>
        </div>
      </div>
    </section>
  `,
})
export class DemoFilterComponent implements OnInit {
  private optionsService = new MockOptionsService();

  filterItems = signal<DftFilterItem[]>([
    {
      name: 'search',
      type: 'text',
      label: 'Search Products',
      placeholder: 'Enter search term...',
    },
    {
      name: 'category',
      type: 'options',
      label: 'Category',
      isDynamicOptions: true,
      getOptions: (filter, search, page) =>
        this.getCategoryOptions(filter, search, page),
    },
    {
      name: 'price',
      type: 'compare',
      label: 'Price Range',
      compareType: 'range',
      minValue: 0,
      maxValue: 10000,
    },
  ]);

  applied: DftFilterApplyModel[] | null = null;

  private store = FilterStore.getStore('demo-filters');

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.store.initFilters(this.filterItems());

    const qp = this.route.snapshot.queryParams;
    if (qp && Object.keys(qp).length > 0) {
      this.store.hydrateFromQueryParams(qp);
      this.store.apply();
      this.applied = this.store.lastApplied();
    } else {
      this.store.loadFromLocalStorage();
    }
  }

  async getCategoryOptions(
    filter: DftFilterItem,
    search?: string,
    page: number = 1
  ) {
    const result = await this.optionsService.search(
      filter.name,
      search,
      page
    );
    return result;
  }

  onFiltersApplied(filters: DftFilterApplyModel[]) {
    this.applied = filters;

    const params = this.store.toQueryParams(filters);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  saveSnapshot() {
    this.store.saveToLocalStorage();
    alert('Saved filter snapshot to localStorage for store id: demo-filters');
  }

  loadSnapshot() {
    this.store.loadFromLocalStorage();
    alert('Loaded snapshot (values set) from localStorage. Use Apply to emit.');
  }

  clearSnapshot() {
    this.store.clearLocalStorage();
    alert('Cleared stored snapshot for demo-filters');
  }
}
