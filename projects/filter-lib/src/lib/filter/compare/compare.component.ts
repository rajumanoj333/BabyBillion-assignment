// projects/filter-lib/src/lib/filter/compare/compare.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DftFilterItem } from '../filter.model';

interface CompareOperator {
  value: string;
  label: string;
}

@Component({
  selector: 'dft-compare-filter',
  standalone: true,
  template: `
    <div class="w-full">
      <div class="text-sm font-medium mb-1">{{ filter.label || filter.name }}</div>
      
      <!-- Range type (min/max) -->
      <div *ngIf="filter.compareType === 'range'" class="flex gap-2">
        <mat-form-field class="flex-1" subscriptSizing="dynamic">
          <mat-label>Min</mat-label>
          <input 
            matInput 
            type="number"
            placeholder="Min"
            [value]="value?.min || ''"
            (input)="onValueChange('min', $event)"
            [min]="filter.minValue"
            [max]="filter.maxValue" />
        </mat-form-field>
        
        <mat-form-field class="flex-1" subscriptSizing="dynamic">
          <mat-label>Max</mat-label>
          <input 
            matInput 
            type="number"
            placeholder="Max"
            [value]="value?.max || ''"
            (input)="onValueChange('max', $event)"
            [min]="filter.minValue"
            [max]="filter.maxValue" />
        </mat-form-field>
        
        <button 
          *ngIf="value && (value.min !== null || value.max !== null)" 
          mat-icon-button 
          (click)="clearValue()"
          aria-label="Clear">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <!-- Single type (value + operator) -->
      <div *ngIf="filter.compareType === 'single'" class="flex gap-2 items-end">
        <mat-form-field class="flex-1" subscriptSizing="dynamic">
          <mat-label>Operator</mat-label>
          <mat-select [value]="value?.operator || defaultOperator" (selectionChange)="onOperatorChange($event.value)">
            <mat-option *ngFor="let op of operators" [value]="op.value">{{ op.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field class="flex-1" subscriptSizing="dynamic">
          <mat-label>Value</mat-label>
          <input 
            matInput 
            type="number"
            [placeholder]="'Value'"
            [value]="value?.value || ''"
            (input)="onValueChange('value', $event)"
            [min]="filter.minValue"
            [max]="filter.maxValue" />
        </mat-form-field>
        
        <button 
          *ngIf="value" 
          mat-icon-button 
          (click)="clearValue()"
          aria-label="Clear">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DftCompareFilterComponent implements OnInit {
  @Input() filter!: DftFilterItem;
  @Input() value: any = { min: null, max: null };
  @Output() valueChange = new EventEmitter<any>();
  
  operators: CompareOperator[] = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' }
  ];
  
  defaultOperator = 'eq';

  ngOnInit() {
    // Initialize value based on compare type if not provided
    if (!this.value) {
      if (this.filter.compareType === 'range') {
        this.value = { min: null, max: null };
      } else {
        this.value = { operator: this.defaultOperator, value: null };
      }
    }
  }

  onValueChange(field: string, event: any) {
    const inputValue = event.target.value !== '' ? Number(event.target.value) : null;
    
    if (this.filter.compareType === 'range') {
      const newValue = { ...this.value, [field]: inputValue };
      this.value = newValue;
      this.valueChange.emit(newValue);
    } else {
      const newValue = { ...this.value, [field]: inputValue };
      this.value = newValue;
      this.valueChange.emit(newValue);
    }
  }

  onOperatorChange(operator: string) {
    const newValue = { ...this.value, operator };
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  clearValue() {
    let clearedValue: any;
    if (this.filter.compareType === 'range') {
      clearedValue = { min: null, max: null };
    } else {
      clearedValue = { operator: this.defaultOperator, value: null };
    }
    
    this.value = clearedValue;
    this.valueChange.emit(clearedValue);
  }
}