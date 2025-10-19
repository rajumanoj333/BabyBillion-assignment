# Angular Filter Library (filter-lib)

A reusable Angular component library that provides flexible, customizable filter components for applications. This library includes various filter types with support for state management, URL query parameter synchronization, and local storage persistence.

## 📋 Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Demo Application](#running-the-demo-application)
- [Library Usage](#library-usage)
- [Filter Types](#filter-types)
- [Development](#development)
- [Building the Library](#building-the-library)
- [API Reference](#api-reference)
- [License](#license)

## Features

- **Multiple Filter Types**: Text, options (dropdown/multi-select), and comparison (range) filters
- **State Management**: Built-in state management with FilterStore
- **URL Integration**: Synchronize filter state with URL query parameters
- **Persistence**: Local storage support for saving filter preferences
- **Dynamic Options**: Support for loading options dynamically with search and pagination
- **Responsive Design**: Mobile-friendly layout
- **Angular Material Integration**: Uses Angular Material components for consistent UI
- **Standalone Components**: Built with Angular standalone components architecture

## Project Structure

```
filter-workspace/
├── projects/
│   ├── filter-lib/           # The main filter library
│   │   ├── src/
│   │   │   └── lib/
│   │   │       ├── filter/
│   │   │       │   ├── filter.component.ts      # Main filter container
│   │   │       │   ├── filter.model.ts          # Filter types and interfaces
│   │   │       │   ├── filter.store.ts          # State management service
│   │   │       │   ├── text/
│   │   │       │   ├── options/
│   │   │       │   ├── compare/
│   │   │       │   └── options.service.ts       # Mock service for dynamic options
│   │   │       └── public-api.ts
│   │   └── package.json
│   └── demo-app/            # Demo application showcasing the library
│       └── src/
│           └── app/
│               ├── app.component.ts
│               ├── app.html
│               └── demo-filter.component.ts
├── angular.json
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (v18 or higher)

### Setup Steps

1. Clone or download the repository
2. Navigate to the project directory:
   ```bash
   cd filter-workspace
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Demo Application

The demo application showcases all filter library features:

1. **Start the development server**:
   ```bash
   npm start
   # or
   ng serve
   ```

2. **Open your browser** to `http://localhost:4200`

3. **View the filter demo** at the main route which displays the filter component in action

### Alternative Development Mode

For real-time library development, use the watch mode:

```bash
npm run start:dev
```

This command:
- Builds the library in watch mode
- Serves the demo application
- Automatically updates the demo when library code changes

## Library Usage

### Basic Integration

1. **Import the library** in your component:
   ```typescript
   import { DftFilterComponent } from 'filter-lib';
   ```

2. **Define filter configuration**:
   ```typescript
   import { DftFilterItem } from 'filter-lib';
   
   filterItems: DftFilterItem[] = [
     {
       name: 'search',
       type: 'text',
       label: 'Search Products',
       placeholder: 'Enter search term...'
     },
     {
       name: 'category',
       type: 'options',
       label: 'Category',
       isDynamicOptions: true,
       getOptions: (filter, search, page) => this.getCategoryOptions(filter, search, page)
     },
     {
       name: 'price',
       type: 'compare',
       label: 'Price Range',
       compareType: 'range',
       minValue: 0,
       maxValue: 10000
     }
   ];
   ```

3. **Add the component to your template**:
   ```html
   <dft-filter
     [filters]="filterItems"
     (onFiltersApplied)="handleFilters($event)">
   </dft-filter>
   ```

### Advanced Features

#### State Management with FilterStore
```typescript
// Create a store instance
private store = FilterStore.getStore('my-filters');

// Initialize with filter definitions
this.store.initFilters(this.filterItems);

// Load from URL query parameters
this.store.hydrateFromQueryParams(this.route.snapshot.queryParams);

// Apply filters and get the result
const appliedFilters = this.store.apply();
```

#### URL Integration
```typescript
// Enable query parameter synchronization
<dft-filter
  [filters]="filterItems"
  [queryParam]="true"
  [storeId]="'my-filters'"
  (onFiltersApplied)="handleFilters($event)">
</dft-filter>
```

#### Local Storage Persistence
```typescript
// Save to localStorage
this.store.saveToLocalStorage();

// Load from localStorage
this.store.loadFromLocalStorage();

// Clear stored values
this.store.clearLocalStorage();
```

## Filter Types

### Text Filter
- **Type**: `'text'`
- **Features**: Input field with clear button, placeholder support
- **Options**:
  - `label`: Display label
  - `placeholder`: Input placeholder text

### Options Filter
- **Type**: `'options'`
- **Features**: Dropdown or multi-select with dynamic option loading
- **Options**:
  - `label`: Display label
  - `isDynamicOptions`: Enable dynamic loading
  - `getOptions`: Function to load options dynamically
  - `staticOptions`: Static list of options

### Compare Filter
- **Type**: `'compare'`
- **Features**: Range selection (min/max) or single value with operator
- **Options**:
  - `label`: Display label
  - `compareType`: `'range'` or `'single'`
  - `minValue`/`maxValue`: Value range limits
  - `step`: Step increment for values

## Development

### Available Scripts

- `npm start` - Serve the demo application
- `npm run build` - Build the demo application
- `npm run build:lib` - Build the filter library
- `npm run watch:lib` - Watch mode for library development
- `npm run start:dev` - Watch library + serve demo application
- `npm test` - Run unit tests
- `npm run lint` - Run linting

### Development Workflow

1. Make changes to the library components in `projects/filter-lib/src/lib/`
2. Run `npm run watch:lib` to automatically rebuild the library
3. View changes in the demo application at `http://localhost:4200`

## Building the Library

To build the library for distribution:

```bash
npm run build:lib
```

This command:
- Compiles the library to the `dist/filter-lib` directory
- Creates all necessary files for npm publishing
- Generates type definitions
- Creates both development and production builds

### Publishing the Library

After building:

1. Navigate to the distribution directory:
   ```bash
   cd dist/filter-lib
   ```

2. Publish to npm:
   ```bash
   npm publish
   ```

## API Reference

### DftFilterComponent Inputs
- `filters: DftFilterItem[]` - Array of filter configurations
- `queryParam: boolean` - Enable query parameter synchronization
- `storeId: string` - ID for the FilterStore instance

### DftFilterComponent Outputs
- `onFiltersApplied: EventEmitter<DftFilterApplyModel[]>` - Emitted when filters are applied

### DftFilterItem Properties
- `name: string` - Unique identifier for the filter
- `type: 'text' | 'options' | 'compare'` - Filter type
- `label?: string` - Display label
- `placeholder?: string` - Placeholder text
- `isDynamicOptions?: boolean` - Enable dynamic options loading
- `getOptions?: Function` - Function to load options dynamically
- `compareType?: 'range' | 'single'` - For compare filters
- `minValue?: number` - Minimum value constraint
- `maxValue?: number` - Maximum value constraint
- `step?: number` - Step increment for values
- `required?: boolean` - Required field validation
- `validationPattern?: string` - Custom validation pattern
- `customTemplate?: string` - Custom template reference
- `staticOptions?: { label: string; value: any }[]` - Static options list

### FilterStore Methods
- `getStore(storeId: string)` - Get or create a store instance
- `initFilters(filters: DftFilterItem[])` - Initialize filters with store
- `setValue(name: string, value: any)` - Set filter value
- `apply()` - Apply current values and return result
- `reset()` - Reset all filter values
- `saveToLocalStorage()` - Persist values to localStorage
- `loadFromLocalStorage()` - Load values from localStorage
- `clearLocalStorage()` - Clear stored values

## License

This project is licensed under the MIT License.
# BabyBillion-assignment
#   B a b y B i l l i o n - a s s i g n m e n t  
 g i t  
 i n i t  
 g i t  
 a d d  
 .  
 g i t  
 c o m m i t  
 - m  
 f i r s t   c o m m i t  
 g i t  
 b r a n c h  
 - M  
 m a s t e r  
 g i t  
 r e m o t e  
 a d d  
 o r i g i n  
 h t t p s : / / g i t h u b . c o m / r a j u m a n o j 3 3 3 / B a b y B i l l i o n - a s s i g n m e n t . g i t  
 g i t  
 p u s h  
 - u  
 o r i g i n  
 m a s t e r  
 #   B a b y B i l l i o n - a s s i g n m e n t  
 g i t  
 i n i t  
 g i t  
 a d d  
 .  
 g i t  
 c o m m i t  
 - m  
 f i r s t   c o m m i t  
 g i t  
 b r a n c h  
 - M  
 m a s t e r  
 g i t  
 r e m o t e  
 a d d  
 o r i g i n  
 h t t p s : / / g i t h u b . c o m / r a j u m a n o j 3 3 3 / B a b y B i l l i o n - a s s i g n m e n t . g i t  
 g i t  
 p u s h  
 - u  
 o r i g i n  
 m a s t e r  
 #   B a b y B i l l i o n - a s s i g n m e n t  
 