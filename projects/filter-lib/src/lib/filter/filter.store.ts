// projects/filter-lib/src/lib/filter/filter.store.ts
import { signal, computed, Signal } from '@angular/core';
import { DftFilterApplyModel, DftFilterItem } from './filter.model';
import { safeParse, safeStringify } from './filter.query';

/**
 * Simple FilterStore built with Angular Signals.
 *
 * - Supports creating/using multiple store instances by id.
 * - Holds current filter items and applied values.
 * - Exposes signals for components to read reactively.
 */

type StoreState = {
  filters: DftFilterItem[];
  values: Record<string, any>;
  lastApplied: DftFilterApplyModel[] | null;
};

const STORE_REGISTRY = new Map<string, FilterStore>();

export class FilterStore {
  private state = signal<StoreState>({
    filters: [],
    values: {},
    lastApplied: null
  });

  /** Public read-only signals */
  public filters: Signal<DftFilterItem[]> = computed(() => this.state().filters);
  public values: Signal<Record<string, any>> = computed(() => this.state().values);
  public lastApplied: Signal<DftFilterApplyModel[] | null> = computed(() => this.state().lastApplied);

  constructor(public id = 'default') {}

  static getStore(id = 'default') {
    if (!STORE_REGISTRY.has(id)) {
      STORE_REGISTRY.set(id, new FilterStore(id));
    }
    return STORE_REGISTRY.get(id)!;
  }

  /** Initialize filters (replace existing) */
  initFilters(filters: DftFilterItem[]) {
    this.state.update(s => ({
      ...s,
      filters: filters ?? [],
      // reset values that don't exist now
      values: {}
    }));
  }

  /** Update a single filter value (reactive) */
  setValue(name: string, value: any) {
    this.state.update(s => {
      const nextValues = { ...s.values, [name]: value };
      return { ...s, values: nextValues };
    });
  }

  /** Clear a single filter value */
  clearValue(name: string) {
    this.state.update(s => {
      const nextValues = { ...s.values };
      delete nextValues[name];
      return { ...s, values: nextValues };
    });
  }

  /** Apply current values and store last applied snapshot */
  apply() {
    const applied: DftFilterApplyModel[] = this.state().filters.map(f => ({
      name: f.name,
      value: this.state().values[f.name] ?? null
    }));
    this.state.update(s => ({ ...s, lastApplied: applied }));
    return applied;
  }

  /** Reset all values and last applied */
  reset() {
    this.state.update(s => ({ ...s, values: {}, lastApplied: null }));
  }

  /** Replace entire values object (useful for hydrating from query params) */
  setAllValues(values: Record<string, any>) {
    this.state.update(s => ({ ...s, values: values ?? {} }));
  }

  /** Save current values to localStorage */
  saveToLocalStorage() {
    const values = this.state().values;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`filter-store-${this.id}`, JSON.stringify(values));
      } catch (error) {
        console.error(`Failed to save to localStorage for store ${this.id}:`, error);
      }
    }
  }

  /** Load values from localStorage */
  loadFromLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(`filter-store-${this.id}`);
        if (saved) {
          const values = JSON.parse(saved);
          this.setAllValues(values);
        }
      } catch (error) {
        console.error(`Failed to load from localStorage for store ${this.id}:`, error);
      }
    }
  }

  /** Clear values from localStorage */
  clearLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`filter-store-${this.id}`);
      } catch (error) {
        console.error(`Failed to clear localStorage for store ${this.id}:`, error);
      }
    }
  }

  /** Hydrate from query params */
  hydrateFromQueryParams(queryParams: Record<string, any>) {
    const parsedValues: Record<string, any> = {};
    const filterNames = this.state().filters.map(f => f.name);

    Object.keys(queryParams).forEach(key => {
      if (filterNames.includes(key)) {
        const rawValue = queryParams[key];
        parsedValues[key] = safeParse(rawValue);
      }
    });
    
    this.setAllValues(parsedValues);
  }

  /** Convert filter values to query params */
  toQueryParams(filters: DftFilterApplyModel[]): Record<string, string> {
    const params: Record<string, string> = {};
    
    filters.forEach(filter => {
      if (filter.value !== null && filter.value !== undefined) {
        const serialized = safeStringify(filter.value);
        if (serialized !== null) {
          params[filter.name] = serialized;
        }
      }
    });
    
    return params;
  }
}
