// projects/filter-lib/src/lib/filter/filter.store.ts
import { signal, computed, Signal } from '@angular/core';
import { DftFilterApplyModel, DftFilterItem } from './filter.model';
import { safeParse, safeStringify } from './filter.query';
import { isFilterValueEmpty } from './filter.util';

/**
 * Advanced FilterStore built with Angular Signals.
 *
 * - Supports creating/using multiple store instances by id.
 * - Holds current filter items and applied values.
 * - Exposes signals for components to read reactively.
 * - Handles dependencies between filters and mutual exclusivity.
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
    // Validate dependencies to prevent circular dependencies
    const circularDeps = this.validateDependencies(filters);
    if (circularDeps.length > 0) {
      console.warn(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }
    
    this.state.update(s => ({
      ...s,
      filters: filters ?? [],
      // reset values that don't exist now
      values: {}
    }));
  }

  /** Update a single filter value (reactive) - with dependency and exclusivity handling */
  setValue(name: string, value: any) {
    this.state.update(s => {
      const nextValues = { ...s.values, [name]: value };
      
      // Handle exclusivity first - check if this filter excludes others
      const currentFilters = s.filters;
      const currentFilter = currentFilters.find(f => f.name === name);
      
      if (currentFilter && currentFilter.excludes && currentFilter.excludes.length > 0) {
        currentFilter.excludes.forEach(excludedFilterName => {
          if (nextValues.hasOwnProperty(excludedFilterName) && value !== null && value !== undefined && value !== '') {
            delete nextValues[excludedFilterName];
          }
        });
      }
      
      // Handle exclusion groups - only allow one filter from each group to be active
      if (currentFilter && currentFilter.exclusionGroup) {
        const groupFilters = currentFilters.filter(f => 
          f.exclusionGroup === currentFilter.exclusionGroup && f.name !== name
        );
        
        if (value !== null && value !== undefined && value !== '') {
          // Clear other filters in the same exclusion group
          groupFilters.forEach(f => {
            delete nextValues[f.name];
          });
        }
      }
      
      // Handle dependency logic - check if any dependent filters should be cleared
      // When a parent filter changes, clear its children if they should be disabled 
      currentFilters.forEach(filter => {
        if (filter.dependsOn) {
          const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
          const shouldClear = dependsOn.some(parentName => parentName === name);
          
          if (shouldClear) {
            const parentValue = value;
            // If parent is empty and the child has disableWhenEmpty set to true, clear the child
            if (isFilterValueEmpty(parentValue) && filter.disableWhenEmpty) {
              delete nextValues[filter.name];
            }
          }
        }
      });

      return { ...s, values: nextValues };
    });
  }

  /** Clear a single filter value */
  clearValue(name: string) {
    this.state.update(s => {
      const nextValues = { ...s.values };
      delete nextValues[name];
      
      // Handle dependency logic - when a parent filter is cleared, potentially clear its children
      const currentFilters = s.filters;
      const currentFilter = currentFilters.find(f => f.name === name);
      
      if (currentFilter) {
        // Find all filters that depend on this filter
        currentFilters.forEach(filter => {
          if (filter.dependsOn) {
            const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
            if (dependsOn.includes(name) && filter.disableWhenEmpty) {
              delete nextValues[filter.name];
            }
          }
        });
      }
      
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
    // Process the values to handle exclusivity and dependencies
    let processedValues = { ...values };
    const currentFilters = this.state().filters;
    
    // Process exclusivity constraints 
    Object.keys(processedValues).forEach(filterName => {
      if (processedValues[filterName] !== null && processedValues[filterName] !== undefined && processedValues[filterName] !== '') {
        const currentFilter = currentFilters.find(f => f.name === filterName);
        
        if (currentFilter) {
          // Handle explicit exclusions
          if (currentFilter.excludes) {
            currentFilter.excludes.forEach(excludedName => {
              if (processedValues.hasOwnProperty(excludedName)) {
                delete processedValues[excludedName];
              }
            });
          }
          
          // Handle exclusion groups
          if (currentFilter.exclusionGroup) {
            const groupFilters = currentFilters.filter(f => 
              f.exclusionGroup === currentFilter.exclusionGroup && f.name !== filterName
            );
            
            groupFilters.forEach(f => {
              if (processedValues.hasOwnProperty(f.name)) {
                delete processedValues[f.name];
              }
            });
          }
        }
      }
    });
    
    this.state.update(s => ({ ...s, values: processedValues ?? {} }));
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

  /**
   * Check if a filter should be visible based on its dependencies
   */
  isFilterVisible(filterName: string): boolean {
    const currentState = this.state();
    const filter = currentState.filters.find(f => f.name === filterName);
    
    if (!filter || !filter.dependsOn) {
      return true;
    }
    
    const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
    
    for (const parentName of dependsOn) {
      const parentFilter = currentState.filters.find(f => f.name === parentName);
      const parentValue = currentState.values[parentName];
      
      if (!parentFilter) {
        // If parent doesn't exist, filter should not be visible
        return false;
      }
      
      // If parent value is empty and this filter has disableWhenEmpty, hide it
      if (filter.disableWhenEmpty && isFilterValueEmpty(parentValue)) {
        return false;
      }
      
      // If parent has showWhen function, use it to determine visibility
      if (parentFilter.showWhen && typeof parentFilter.showWhen === 'function') {
        if (!parentFilter.showWhen(parentValue)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Check if a filter should be disabled based on its dependencies
   */
  isFilterDisabled(filterName: string): boolean {
    const currentState = this.state();
    const filter = currentState.filters.find(f => f.name === filterName);
    
    if (!filter || !filter.dependsOn) {
      return false;
    }
    
    const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
    
    for (const parentName of dependsOn) {
      const parentValue = currentState.values[parentName];
      
      // If parent value is empty and this filter has disableWhenEmpty, disable it
      if (filter.disableWhenEmpty && isFilterValueEmpty(parentValue)) {
        return true;
      }
      
      // Check if parent has showWhen function and it returns false
      const parentFilter = currentState.filters.find(f => f.name === parentName);
      if (parentFilter && parentFilter.showWhen && typeof parentFilter.showWhen === 'function') {
        if (!parentFilter.showWhen(parentValue)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get dependent filters of a given filter
   */
  getDependentFilters(filterName: string): DftFilterItem[] {
    const currentState = this.state();
    return currentState.filters.filter(filter => {
      if (filter.dependsOn) {
        const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
        return dependsOn.includes(filterName);
      }
      return false;
    });
  }

  /**
   * Check if a filter is in conflict with others based on exclusivity
   */
  isFilterExcluded(filterName: string): boolean {
    const currentState = this.state();
    const filter = currentState.filters.find(f => f.name === filterName);
    
    if (!filter) {
      return false;
    }
    
    const currentValues = currentState.values;
    
    // Check if any active filter excludes this one
    for (const [activeFilterName, activeFilterValue] of Object.entries(currentValues)) {
      if (activeFilterName !== filterName && 
          !isFilterValueEmpty(activeFilterValue)) {
        const activeFilter = currentState.filters.find(f => f.name === activeFilterName);
        
        if (activeFilter && activeFilter.excludes && activeFilter.excludes.includes(filterName)) {
          return true;
        }
      }
    }
    
    // Check if this filter is blocked by exclusion group
    if (filter.exclusionGroup) {
      for (const [activeFilterName, activeFilterValue] of Object.entries(currentValues)) {
        if (activeFilterName !== filterName && 
            !isFilterValueEmpty(activeFilterValue)) {
          const activeFilter = currentState.filters.find(f => f.name === activeFilterName);
          
          if (activeFilter && activeFilter.exclusionGroup === filter.exclusionGroup) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Validate dependencies to detect circular dependencies
   */
  private validateDependencies(filters: DftFilterItem[]): string[] {
    const circularDependencies: string[] = [];
    const dependencyGraph: { [key: string]: string[] } = {};
    
    // Build dependency graph
    filters.forEach(filter => {
      if (filter.dependsOn) {
        const dependsOn = Array.isArray(filter.dependsOn) ? filter.dependsOn : [filter.dependsOn];
        dependencyGraph[filter.name] = dependsOn;
      } else {
        dependencyGraph[filter.name] = [];
      }
    });
    
    // Check for circular dependencies using DFS
    const visited: { [key: string]: boolean } = {};
    const recStack: { [key: string]: boolean } = {};
    
    const hasCycle = (node: string): boolean => {
      if (!visited[node]) {
        visited[node] = true;
        recStack[node] = true;
        
        const neighbors = dependencyGraph[node] || [];
        for (const neighbor of neighbors) {
          if (!visited[neighbor] && hasCycle(neighbor)) {
            circularDependencies.push(`${node} -> ${neighbor}`);
            return true;
          } else if (recStack[neighbor]) {
            circularDependencies.push(`${node} -> ${neighbor}`);
            return true;
          }
        }
      }
      recStack[node] = false;
      return false;
    };
    
    Object.keys(dependencyGraph).forEach(node => {
      if (!visited[node]) {
        hasCycle(node);
      }
    });
    
    return circularDependencies;
  }
}
