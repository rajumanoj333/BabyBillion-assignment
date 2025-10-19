import { PageResult } from "./options.service";

// projects/filter-lib/src/lib/filter/filter.model.ts
export type FilterType = 'text' | 'options' | 'compare';

export interface DftFilterItem {
  name: string;
  type: FilterType;
  label?: string;
  placeholder?: string;
  isDynamicOptions?: boolean;
  getOptions?: (
    filter: DftFilterItem,
    search?: string,
    page?: number
  ) => Promise<PageResult>;
  compareType?: 'range' | 'single';
  // Additional properties for enhanced functionality
  minValue?: number;
  maxValue?: number;
  step?: number;
  required?: boolean;
  validationPattern?: string;
  customTemplate?: string; // For custom filter templates
  staticOptions?: { label: string; value: any }[]; // For static options
  
  // Dependency system properties
  dependsOn?: string | string[];      // Parent filter names this filter depends on
  parent?: string;                    // Parent filter name (for hierarchical structure)
  showWhen?: (parentValue: any) => boolean; // Conditional visibility based on parent value
  disableWhenEmpty?: boolean;         // Whether to disable if parent is empty
  
  // Mutual exclusivity system properties
  excludes?: string[];                // Filters this filter excludes when selected
  exclusionGroup?: string;            // Group name for mutually exclusive filters
  priority?: number;                  // Priority for conflict resolution (higher wins)
}

export interface DftFilterApplyModel {
  name: string;
  value: any;
}
