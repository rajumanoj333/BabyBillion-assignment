// projects/filter-lib/src/lib/filter/filter.util.ts
import { DftFilterItem, DftFilterApplyModel } from './filter.model';

/**
 * Utility functions for filter operations
 */

/**
 * Validates if a filter value is empty/null
 */
export function isFilterValueEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Normalizes filter values for comparison and storage
 */
export function normalizeFilterValue(value: any, filterType: string): any {
  if (isFilterValueEmpty(value)) return null;
  
  switch (filterType) {
    case 'text':
      return typeof value === 'string' ? value.trim() : value;
    case 'options':
      return Array.isArray(value) ? value : [value];
    case 'compare':
      if (typeof value === 'object' && value !== null) {
        return {
          min: value.min !== undefined && value.min !== null ? Number(value.min) : null,
          max: value.max !== undefined && value.max !== null ? Number(value.max) : null
        };
      }
      return value;
    default:
      return value;
  }
}

/**
 * Checks if two filter values are equivalent
 */
export function areFilterValuesEqual(value1: any, value2: any): boolean {
  if (value1 === value2) return true;
  if (isFilterValueEmpty(value1) && isFilterValueEmpty(value2)) return true;
  
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return value1.length === value2.length && 
           value1.every((v, i) => v === value2[i]);
  }
  
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => value1[key] === value2[key]);
  }
  
  return false;
}

/**
 * Creates a deep copy of filter values
 */
export function cloneFilterValues(values: Record<string, any>): Record<string, any> {
  const cloned: Record<string, any> = {};
  Object.keys(values).forEach(key => {
    const value = values[key];
    if (value === null || value === undefined) {
      cloned[key] = value;
    } else if (Array.isArray(value)) {
      cloned[key] = [...value];
    } else if (typeof value === 'object') {
      cloned[key] = { ...value };
    } else {
      cloned[key] = value;
    }
  });
  return cloned;
}

/**
 * Gets default values for different filter types
 */
export function getDefaultFilterValue(filterType: string): any {
  switch (filterType) {
    case 'text':
      return null;
    case 'options':
      return [];
    case 'compare':
      return { min: null, max: null };
    default:
      return null;
  }
}

/**
 * Validates filter configuration
 */
export function validateFilterItem(filter: DftFilterItem): boolean {
  if (!filter.name || !filter.type) {
    console.warn('Filter item missing required properties:', filter);
    return false;
  }
  
  const validTypes: string[] = ['text', 'options', 'compare'];
  if (!validTypes.includes(filter.type)) {
    console.warn('Invalid filter type:', filter.type);
    return false;
  }
  
  return true;
}

/**
 * Sanitizes filter values according to the filter configuration
 */
export function sanitizeFilterValues(filters: DftFilterItem[], values: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  filters.forEach(filter => {
    if (values.hasOwnProperty(filter.name)) {
      sanitized[filter.name] = normalizeFilterValue(values[filter.name], filter.type);
    }
  });
  
  return sanitized;
}

/**
 * Prepares filters for query parameter serialization
 */
export function prepareFiltersForQuery(filters: DftFilterApplyModel[]): DftFilterApplyModel[] {
  return filters.filter(filter => !isFilterValueEmpty(filter.value));
}