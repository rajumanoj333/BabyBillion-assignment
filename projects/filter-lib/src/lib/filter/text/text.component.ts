// projects/filter-lib/src/lib/filter/text/text.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DftFilterItem } from '../filter.model';

@Component({
  selector: 'dft-text-filter',
  standalone: true,
  template: `
    <mat-form-field class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ filter.label || filter.name }}</mat-label>
      <input 
        matInput 
        type="text"
        [placeholder]="filter.placeholder || ''"
        [value]="value || ''"
        (input)="onValueChange($event)"
        (blur)="onBlur()"
        (keydown.enter)="onEnter($event)" />
      <button 
        *ngIf="value && value.length > 0" 
        mat-icon-button 
        matSuffix
        (click)="clearValue()"
        aria-label="Clear">
        <mat-icon>close</mat-icon>
      </button>
    </mat-form-field>
  `,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DftTextFilterComponent {
  @Input() filter!: DftFilterItem;
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() enter = new EventEmitter<KeyboardEvent>();

  onValueChange(event: any) {
    const newValue = event.target.value;
    this.valueChange.emit(newValue ? newValue.trim() : null);
  }

  onBlur() {
    this.blur.emit();
  }

  onEnter(event: Event) {
    if (event instanceof KeyboardEvent) {
      this.enter.emit(event);
    }
  }

  clearValue() {
    this.valueChange.emit(null);
  }
}