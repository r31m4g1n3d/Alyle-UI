import {
  Component,
  forwardRef,
  NgModule,
  Input,
  Directive,
  Output,
  SimpleChange,
  ChangeDetectorRef,
  OnChanges,
  ModuleWithProviders,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ContentChildren,
  QueryList,
  Optional,
  HostBinding,
  EventEmitter,
  ChangeDetectionStrategy,
  SimpleChanges,
  NgZone,
  ViewChild,
  ElementRef,
  Renderer2
} from '@angular/core';
import { LyRippleModule, LyRipple, LyRippleService, Ripple } from '@alyle/ui/ripple';
import { Subscription , Subject , BehaviorSubject , Observable } from 'rxjs';
import {
  NgModel,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LyCommonModule, Platform, IsBoolean, LyTheme2, LyCoreStyles, toBoolean } from '@alyle/ui';
import { LyRadioService } from './radio.service';
export const LY_RADIO_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => LyRadioGroup),
  multi: true
};

let idx = 0;

export class UndefinedValue {
  constructor() { }
}

@Component({
  selector: 'ly-radio-group',
  template: `<ng-content></ng-content>`,
  providers: [LY_RADIO_CONTROL_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
  exportAs: 'lyRadioGroup'
})
export class LyRadioGroup implements ControlValueAccessor {
  _value = new UndefinedValue;
  name = `ly-radio-name-${idx++}`;
  _color = 'accent';
  private _classes;

  get classes() {
    return {
      label: this.theme.setUpStyle(
        `k-radio-label`, {
          '': () => (
            `cursor: pointer;` +
            `white-space: nowrap;` +
            `position: relative;` +
            `display: flex;` +
            `align-items: center;`
          )
        }
      ),
      container: this.theme.setUpStyleSecondary(
        `k-radio-container`, {
          '': () => (
            `position: relative;` +
            `height: calc(1em * 3);` +
            `width: 1.5em;`
          ),
          '>div': () => (
            `box-sizing: border-box;`
          ),
          '>div *': () => (
            `box-sizing: border-box;` +
            `margin:auto;` +
            `border-radius: 50%;` +
            `transition: transform cubic-bezier(.1, 1, 0.5, 1);` +
            `transition-duration: 250ms;` +
            `width: 1em;` +
            `height: 1em;`
          ),
          ' div>:nth-child(1)': () => (
            `transform: scale(1);` +
            `border: solid .08em currentColor;` +
            `color:${this.theme.config.radio.radioOuterCircle}`
          ),
          ' div>:nth-child(2)': () => (
            `background: currentColor;` +
            `transform: scale(0);`
          )
        }
      )
    };
  }

  @Input()
  set value(val: any) {
    if (this._value !== val) {
      // this._value = val;
      if (this._radios) {
        this._updateCheckFromValue(val);
      }
    }
  }
  get value() {
    return this._value;
  }

  @Output() readonly change: EventEmitter<void> = new EventEmitter<void>();

  /** @deprecated use withColor */
  @Input() radioColor = 'accent';
  @Input() withColor = 'accent';
  @ContentChildren(forwardRef(() => LyRadio)) _radios: QueryList<LyRadio>;

  /** The method to be called in order to update ngModel */
  _controlValueAccessorChangeFn: (value: any) => void = () => {};

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   * @docs-private
   */
  onTouched: () => any = () => {};

  /**
   * Mark this group as being "touched" (for ngModel). Meant to be called by the contained
   * radio buttons upon their blur.
   */
  _touch() {
    if (this.onTouched) {
      this.onTouched();
    }
  }

  writeValue(value: any) {
    if (!!this._radios) {
      this.value = value;
      this.markForCheck();
    }
  }

  /**
   * Registers a callback to be triggered when the model value changes.
   * Implemented as part of ControlValueAccessor.
   * @param fn Callback to be registered.
   */
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  /**
   * Registers a callback to be triggered when the control is touched.
   * Implemented as part of ControlValueAccessor.
   * @param fn Callback to be registered.
   */
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state of the control. Implemented as a part of ControlValueAccessor.
   * @param isDisabled Whether the control should be disabled.
   */
  setDisabledState(isDisabled: boolean) {
    // this.disabled = isDisabled;
    this.markForCheck();
  }

  constructor(
    public _radioService: LyRadioService,
    private elementRef: ElementRef,
    private _renderer: Renderer2,
    public theme: LyTheme2,
    public ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {
    _renderer.addClass(elementRef.nativeElement, this._radioService.classes.root);
  }

  _updateCheckFromValue(val: any) {
    let newChecked: boolean;
    this._radios.forEach(radioButton => {
      if (val === radioButton.value) {
        this.updatevalue(val);
        newChecked = true;
        radioButton.checked = true;
      } else if (radioButton.checked) {
        radioButton.checked = false;
      }
    });
    if (!newChecked) {
      /** when val not exist in radio button !==  */
      this._controlValueAccessorChangeFn(null);
      if (this._value !== null) {
        this._value = null;
      }
    }
  }

  updatevalue(value: any) {
    this._value = value;
    this._controlValueAccessorChangeFn(value);
    this.change.emit();
    this.markForCheck();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  _radioResetChecked() {
    this._radios.forEach(_ => _._setCheckedToFalsy());
  }

}
@Component({
  selector: 'ly-radio',
  // styleUrls: ['radio.scss'],
  template: `
  <label #_labelContainer [attr.for]="inputId" [className]="radioGroup.classes.label">
    <input
      [className]="coreStyles.classes.VisuallyHidden"
      [id]="inputId"
      [checked]="checked"
      [name]="name"
      (change)="_onInputChange($event)"
      (click)="_onInputClick($event)"
      type="radio"
      >
    <div #_radioContainer>
      <div>
      <div [className]="coreStyles.classes.Fill"></div>
      <div [className]="coreStyles.classes.Fill"></div>
      </div>
    </div>
    <div
    [className]="radioGroup._radioService.classes.labelContent">
      <ng-content></ng-content>
    </div>
  </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false
})
export class LyRadio implements OnInit, OnDestroy {
  id = `ly-radio-id-${idx++}`;
  name = '';
  _value = null;
  private _withColor: string;
  private _rippleContainer: Ripple;
  private _checked = false;
  private checkedClass: string;
  @ViewChild('_radioContainer') private _radioContainer: ElementRef;
  @ViewChild('_labelContainer') _labelContainer: ElementRef;
  @Input()
  set withColor(val: string) {
    if (this._withColor !== val) {
      this._withColor = val;
      if (this.checkedClass) {
        /** create new class if exist `this.checkedClass` */
        const beforeClass = this.checkedClass;
        this.checkedClass = this._createStyleWithColor(val);
        this.theme.updateClassName(this._radioContainer.nativeElement, this._renderer, this.checkedClass, beforeClass);
      }
    }
  }
  get withColor() {
    return this._withColor;
  }
  @Output() onCheckedState = new EventEmitter<boolean>();

  @Input()
  set value(val) {
    if (this._value !== val) {
      this._value = val;
    }
  }
  get value() { return this._value; }

  @Input()
  set checked(val: boolean) {
    const newCheckedState = toBoolean(val);
    const before = this._checked;
    if (before !== newCheckedState) {
      this._checked = newCheckedState;
      if (!before && newCheckedState) {
        /** Use current checked class or create new class */
        this.checkedClass = this.checkedClass || this._createStyleWithColor(this.withColor || this.radioGroup.withColor);
        /** Add class checked */
        this._renderer.addClass(this._radioContainer.nativeElement, this.checkedClass);

        if (this.value !== this.radioGroup.value) {
          /** update Value */
          this.radioGroup.updatevalue(this.value);
        }
      } else {
        /** Remove class checked */
        this._renderer.removeClass(this._radioContainer.nativeElement, this.checkedClass);
      }
      this._markForCheck();
    }
  }
  get checked() {
    return this._checked;
  }
  get inputId(): string {
    return `${this.id}-input`;
  }

  _onInputChange(event: any) {
    event.stopPropagation();
    this.radioGroup._updateCheckFromValue(this.value);
    // this.radioGroup._radioResetChecked();
    // this.checked = true;
    this.radioGroup._touch();
  }

  _onInputClick(event: Event) { event.stopPropagation(); }

  _setCheckedToFalsy() {
    this.checked = false;
  }

  _createStyleWithColor(val: string) {
    return this.theme.setUpStyle(
      `k-radio-checked-${val}`, {
        '': () => (
          `color:${this.theme.colorOf(val)};`
        ),
        ' div>:nth-child(1)': () => (
          `transform: scale(1.25);` +
          `color:${this.theme.colorOf(val)};`
        ),
        ' div>:nth-child(2)': () => (
          `transform: scale(0.7);`
        ),
      }
    );
  }

  ngOnInit() {
    if (this.radioGroup) {
      // Copy name from parent radio group
      this.name = this.radioGroup.name;
      this._renderer.addClass(this._radioContainer.nativeElement, this.radioGroup.classes.container);
    }
    this._rippleContainer = new Ripple(this.ngZone, this._rippleService.stylesData, this._radioContainer.nativeElement, this._elementRef.nativeElement);
    this._rippleContainer.setConfig({
      centered: true,
      radius: 'containerSize'
    });
  }

  _markForCheck() {
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy() {
    this._rippleContainer.removeEvents();
  }


  constructor(
    @Optional() public radioGroup: LyRadioGroup,
    private _elementRef: ElementRef,
    private _renderer: Renderer2,
    public theme: LyTheme2,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
    public coreStyles: LyCoreStyles,
    private _rippleService: LyRippleService
  ) { }
}

@NgModule({
  imports: [CommonModule, FormsModule, LyRippleModule, LyCommonModule],
  exports: [LyRadioGroup, LyRadio],
  declarations: [LyRadioGroup, LyRadio],
})
export class LyRadioModule { }
