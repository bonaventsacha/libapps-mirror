// Copyright 2019 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Exports an element: terminal-settings-colorpicker.
 *
 * @suppress {moduleLoad}
 */
import {LitElement, css, html} from './lit_element.js';
import {TerminalSettingsElement} from './terminal_settings_element.js';
import {stylesButtonContainer, stylesDialog}
    from './terminal_settings_styles.js';
import './terminal_settings_button.js';

export const TOO_WHITE_BOX_SHADOW = 'inset 0 0 0 1px black';
export const FOCUS_BOX_SHADOW =
    '0 0 0 2px rgba(var(--google-blue-600-rgb), .4)';

/**
 * Convert CSS color to hex color.  Always use uppercase for display.
 *
 * @param {string} css
 * @return {string} hex color
 */
function cssToHex(css) {
  return lib.notNull(lib.colors.rgbToHex(
      lib.notNull(lib.colors.normalizeCSS(css)))).toUpperCase();
}

/**
 * Return a css string for the swatch's style attribute.
 *
 * @param {string} color the css color.
 * @param {boolean} dialogIsOpened whether dialog is opened.
 * @return {string}
 */
function swatchStyle(color, dialogIsOpened) {
  const boxShadows = [];

  if (color) {
    const c = lib.colors;
    const contrastRatio = c.contrastRatio(1, c.luminance(
        ...lib.notNull(c.crackRGB(lib.notNull(c.normalizeCSS(color))))));
    if (contrastRatio < 1.25) {
      // The color is too white. Put a "border" to make it stands out from the
      // background.
      boxShadows.push(TOO_WHITE_BOX_SHADOW);
    }
  }

  if (dialogIsOpened) {
    boxShadows.push(FOCUS_BOX_SHADOW);
  }

  return `background-color: ${color}; box-shadow: ${boxShadows.join(',')}`;
}

export class TerminalColorpickerElement extends LitElement {
  static get is() { return 'terminal-colorpicker'; }

  /** @override */
  static get properties() {
    return {
      value: {
        type: String,
        reflect: true,
      },
      inputInDialog: {
        type: Boolean,
      },
      disableTransparency: {
        type: Boolean,
      },
      hue_: {
        type: Number
      },
      saturation_: {
        type: Number
      },
      lightness_: {
        type: Number
      },
      transparency_: {
        type: Number
      },
      dialogIsOpened_: {
        type: Boolean
      },
    };
  }

  /** @override */
  static get styles() {
    return [stylesButtonContainer, stylesDialog, css`
        #smallview {
          align-items: center;
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
        }

        #swatch {
          background-image: linear-gradient(
              45deg,
              rgba(0,0,0,0.1) 25%,
              transparent 25%,
              transparent 75%,
              rgba(0,0,0,0.1) 75%,
              rgba(0,0,0,0.1) 0), linear-gradient(
              45deg,
              rgba(0,0,0,0.1) 25%,
              transparent 25%,
              transparent 75%,
              rgba(0,0,0,0.1) 75%,
              rgba(0,0,0,0.1) 0);
          background-position: 0px 0, 5px 5px;
          background-size: 10px 10px, 10px 10px;
          border-radius: 50%;
          cursor: pointer;
          display: inline-block;
          height: 24px;
          margin: 6px;
          position: relative;
          user-select: none;
          width: 24px;
        }

        #swatchdisplay {
          border-radius: inherit;
          height: 100%;
          pointer-events: none;
          width: 100%;
        }

        #hexinput {
          background-color: #F1F3F4;
          border-radius: 4px;
          border: none;
          color: #202124;
          font-family: Roboto;
          font-size: 13px;
          outline: none;
          line-height: 32px;
          margin: 8px 0 8px 6px;
          padding: 0 8px;
          text-transform: uppercase;
          width: 17ch;
        }

        hue-slider, transparency-slider {
          margin: 24px 0;
        }

        dialog #hexinput {
          margin: 0;
        }
    `];
  }

  /** @override */
  render() {
    const msg = hterm.messageManager.get.bind(hterm.messageManager);
    const transparency = this.disableTransparency ? '' : html`
        <transparency-slider hue="${this.hue_}"
            @updated="${this.onTransparency_}"
            transparency="${this.transparency_}">
        </transparency-slider>`;
    const input = html`
        <input id="hexinput" type="text"
            .value="${cssToHex(/** @type {string} */(this.value))}"
            @blur="${this.onInputBlur_}"
            @keyup="${this.onInputKeyup_}"/>`;
    return html`
        <div id="smallview">
          <div id="swatch" @click="${this.onSwatchClick_}">
            <div id="swatchdisplay"
                style="${swatchStyle(this.value, this.dialogIsOpened_)}">
            </div>
          </div>
          ${this.inputInDialog ? '' : input}
        </div>
        <dialog>
          <saturation-lightness-picker
              @updated="${this.onSaturationLightness_}"
              hue="${this.hue_}" saturation="${this.saturation_}"
              lightness="${this.lightness_}">
          </saturation-lightness-picker>
          <hue-slider hue="${this.hue_}" @updated="${this.onHue_}" >
          </hue-slider>
          ${transparency}
          ${this.inputInDialog ? input : ''}
          <div class="button-container">
            <terminal-settings-button class="cancel"
                @click="${this.onCancelClick_}">
              ${msg('CANCEL_BUTTON_LABEL')}
            </terminal-settings-button>
            <terminal-settings-button class="action"
                @click="${this.onOkClick_}">
              ${msg('OK_BUTTON_LABEL')}
            </terminal-settings-button>
          </div>
        </dialog>
    `;
  }

  constructor() {
    super();

    /** If true, hex input is shown in dialog rather than next to swatch. */
    this.inputInDialog = false;
    /** If true, transparency is not shown. */
    this.disableTransparency = false;
    /** @private {string} */
    this.value_;
    /** @private {number} */
    this.hue_;
    /** @private {number} */
    this.saturation_;
    /** @private {number} */
    this.lightness_;
    /** @private {number} */
    this.transparency_;
    /** @private {string} */
    this.cancelValue_;
    /** @private {boolean} */
    this.dialogIsOpened_ = false;
  }

  /**
   * UI changed and we should update value with rgb provided, or
   * recalculate value from hslt components.
   *
   * @param {string=} value New value from hex input.
   * @private
   */
  onUiChanged_(value) {
    if (value !== undefined) {
      this.value = value;
    } else {
      this.value = lib.colors.arrayToHSLA([this.hue_, this.saturation_,
            this.lightness_, this.transparency_]);
    }
    this.dispatchEvent(new CustomEvent('updated'));
  }

  /** @param {string} value */
  set value(value) {
    if (value === this.value_) {
      return;
    }
    const oldValue = this.value_;
    this.value_ = value;
    const hsl = lib.notNull(lib.colors.normalizeCSSToHSL(value));
    const [h, s, l, a] = lib.notNull(lib.colors.crackHSL(hsl)).map(
        Number.parseFloat);
    // Only update the preferences if they have changed noticably, as minor
    // updates due to rounding can move the picker around by small perceptible
    // amounts when clicking the same spot.
    if (Math.round(this.hue_) !== Math.round(h)) {
      this.hue_ = h;
    }
    if (Math.round(this.saturation_) !== Math.round(s)) {
      this.saturation_ = s;
    }
    if (Math.round(this.lightness_) !== Math.round(l)) {
      this.lightness_ = l;
    }
    this.transparency_ = a;
    this.requestUpdate('value', oldValue);
  }

  /** @return {string} */
  get value() {
    return this.value_;
  }

  /** @param {!Event} event */
  onSwatchClick_(event) {
    this.openDialog();
    this.cancelValue_ = this.value;
  }

  /** @param {!Event} event */
  onSaturationLightness_(event) {
    this.saturation_ = event.target.saturation;
    this.lightness_ = event.target.lightness;
    this.onUiChanged_();
  }

  /** @param {!Event} event */
  onHue_(event) {
    this.hue_ = event.target.hue;
    this.onUiChanged_();
  }

  /** @param {!Event} event */
  onTransparency_(event) {
    this.transparency_ = event.target.transparency;
    this.onUiChanged_();
  }

  /** @param {!Event} event */
  onInputBlur_(event) {
    const rgb = lib.colors.normalizeCSS(event.target.value);
    if (!rgb) {
      event.target.value = cssToHex(/** @type {string} */(this.value));
    } else {
      // Store uppercase hex to help detect when a value is set to default.
      this.onUiChanged_(cssToHex(event.target.value));
    }
  }

  /** @param {!KeyboardEvent} event */
  onInputKeyup_(event) {
    if (event.key === 'Enter') {
      this.onInputBlur_(event);
      this.onOkClick_(event);
    }
  }

  /**
   * Detects clicks on the dialog cancel button.
   *
   * @param {!Event} event
   */
  onCancelClick_(event) {
    this.closeDialog();
    this.onUiChanged_(this.cancelValue_);
  }

  /**
   * Detects clicks on the dialog cancel button.
   *
   * @param {!Event} event
   */
  onOkClick_(event) {
    this.closeDialog();
  }

  openDialog() {
    this.dialogIsOpened_ = true;
    this.shadowRoot.querySelector('dialog').showModal();
  }

  closeDialog() {
    this.dialogIsOpened_ = false;
    this.shadowRoot.querySelector('dialog').close();
  }
}

customElements.define(TerminalColorpickerElement.is,
    TerminalColorpickerElement);

export class TerminalSettingsColorpickerElement extends
    TerminalSettingsElement {
  static get is() { return 'terminal-settings-colorpicker'; }

  /** @override */
  static get properties() {
    return {
      preference: {
        type: String,
      },
      value: {
        type: String,
        reflect: true,
      },
      disableTransparency: {
        type: Boolean,
      }
    };
  }

  /** @override */
  render() {
    return html`
        <terminal-colorpicker @updated="${this.scheduleUpdate_}"
            value="${this.value}"
            ?disableTransparency="${this.disableTransparency}"/>
    `;
  }

  constructor() {
    super();

    /** If true, transparency is not shown. */
    this.disableTransparency = false;
    /** @private {string} */
    this.pendingValue_ = '';
    /** @private {?Promise<void>} */
    this.pendingUpdate_ = null;
    /** @public {number} */
    this.updateDelay = 100;
  }

  /**
   * Schedule to update the preference (and thus also this.value). The reason
   * that we do not do the update immediately is to avoid flooding the
   * preference manager, in which case the user might see the color picker knob
   * jumping around by itself after dragging the knob quickly.
   *
   * @param {!CustomEvent} event Event with value.
   * @private
   */
  scheduleUpdate_(event) {
    this.pendingValue_ = event.target.value;
    if (this.pendingUpdate_ === null) {
      // We need to use a promise so that tests can wait on this.
      this.pendingUpdate_ = new Promise((resolve) => {
        setTimeout(() => {
          this.pendingUpdate_ = null;
          super.uiChanged_(this.pendingValue_);
          resolve();
        }, this.updateDelay);
      });
    }
  }
}

customElements.define(TerminalSettingsColorpickerElement.is,
    TerminalSettingsColorpickerElement);
