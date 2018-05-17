import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  Optional,
  Renderer2,
  SimpleChanges,
  ViewChild,
  Inject,
  NgZone,
  OnDestroy
} from '@angular/core';
import {
  IsBoolean,
  LyTheme,
  Platform,
  StyleData,
  toBoolean,
  ThemeVariables,
  LyGlobalStyles
} from '@alyle/ui';
import { LyRipple, Ripple, LyRippleService } from '@alyle/ui/ripple';
import { LyButtonService } from './button.service';
import { LyBgColorAndRaised } from '@alyle/ui';

@Component({
  selector: '[ly-button], ly-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <span #content>
    <ng-content></ng-content>
  </span>
  `
})
export class LyButton implements AfterViewInit, OnDestroy {
  public _disabled = false;
  private _rippleSensitive = false;
  private _disabledClassName: string;
  private _outlinedClassName: string;
  private _rippleContainer: Ripple;
  @Input()
  set outlined(val: boolean) {
    const classname = toBoolean(val) === true ? this.buttonService.classes.outlined : '';
    this.theme.updateClassName(this.elementRef.nativeElement, this.renderer, classname, this._outlinedClassName);
    this._outlinedClassName = classname;
  }
  @Input('sensitive')
  get rippleSensitive(): boolean {
    return this._rippleSensitive;
  }
  set rippleSensitive(value: boolean) {
    this._rippleSensitive = toBoolean(value);
  }

  @ViewChild('content') buttonContent: ElementRef;

  @Input()
  set disabled(value: boolean) {
    const key = this.bgAndColor && (this.bgAndColor.raised || this.bgAndColor.bg) ? 'r' : 'f';
    this._disabledClassName = this.theme.createStyle(`btn${key}`, this.disableStyle.bind(this)).id;
    this._disabled = toBoolean(value);
    if (this._disabled) {
      this.renderer.addClass(this.elementRef.nativeElement, this._disabledClassName);
    } else {
      this.renderer.removeClass(this.elementRef.nativeElement, this._disabledClassName);
    }
  }
  get disabled() {
    return this._disabled;
  }

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private theme: LyTheme,
    public rippleStyles: LyRippleService,
    private buttonService: LyButtonService,
    _ngZone: NgZone,
    @Optional() private bgAndColor: LyBgColorAndRaised
  ) {
    if (bgAndColor) {
      bgAndColor.setAutoContrast();
    }
    this.buttonService.applyTheme(renderer, elementRef);
    if (Platform.isBrowser) {
      const el = elementRef.nativeElement;
      this._rippleContainer = new Ripple(_ngZone, rippleStyles.stylesData, el);
    }
  }

  public focused() {
    this.elementRef.nativeElement.focus();
  }

  ngAfterViewInit() {
    const classes = this.buttonService.classes;
      (this.buttonContent.nativeElement as HTMLElement).classList.add(
        classes.buttonContent
      );
  }

  private disableStyle() {
    let style =
    `box-shadow: 0 0 0 rgba(0, 0, 0, 0) !important;` +
    `cursor: default;` +
    `color: ${this.theme.palette.text.disabled} !important;` +
    `pointer-events: none;`;
    if (this.bgAndColor && (this.bgAndColor.raised || this.bgAndColor.bg)) {
      style += `background-color: ${this.theme.palette.button.disabled} !important;`;
    }
    return style;
  }

  ngOnDestroy() {
    if (Platform.isBrowser) {
      this._rippleContainer.removeEvents();
    }
  }

}
