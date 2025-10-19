// projects/filter-lib/src/lib/filter/text/text.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
        [disabled]="isDisabled"
        (input)="onValueChange($event)"
        (blur)="onBlur()"
        (keydown.enter)="onEnter($event)" />
            <button class="clear-button"
              *ngIf="value && value.length > 0 && !isDisabled"
              mat-icon-button
              matSuffix
              (click)="clearValue()"
              aria-label="Clear"
              [disabled]="isDisabled">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
        `,
        imports: [
          CommonModule,
          FormsModule,
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
        private _isDisabled = false;
        @Input() 
        set isDisabled(value: boolean) {
          this._isDisabled = value;
        }
        get isDisabled(): boolean {
          return this._isDisabled;
        }
        @Output() valueChange = new EventEmitter<string | null>();
        @Output() blur = new EventEmitter<void>();
        @Output() enter = new EventEmitter<KeyboardEvent>();
      
        onValueChange(event: any) {
          if (this.isDisabled) return;
          const newValue = event.target.value;
          this.valueChange.emit(newValue ? newValue.trim() : null);
        }
      
        onBlur() {
          if (this.isDisabled) return;
          this.blur.emit();
        }
      
        onEnter(event: Event) {
          if (this.isDisabled || !(event instanceof KeyboardEvent)) return;
          this.enter.emit(event);
        }
      
        clearValue() {
          if (this.isDisabled) return;
          this.valueChange.emit(null);
        }
      }