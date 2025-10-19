// projects/filter-lib/src/lib/filter/filter.model.ts
export type FilterType = 'text' | 'options' | 'compare';

export interface DftFilterItem {
  name: string;
  type: FilterType;
  label?: string;
  placeholder?: string;
  isDynamicOptions?: boolean;
  getOptions?: (filter: DftFilterItem, search?: string, page?: number) => Promise<{ label: string; value: any }[]>;
  compareType?: 'range' | 'single';
  // Additional properties for enhanced functionality
  minValue?: number;
  maxValue?: number;
  step?: number;
  required?: boolean;
  validationPattern?: string;
  customTemplate?: string; // For custom filter templates
  staticOptions?: { label: string; value: any }[]; // For static options
}

export interface DftFilterApplyModel {
  name: string;
  value: any;
}
