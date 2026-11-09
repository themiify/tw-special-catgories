import { css, html, LitElement, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import type { HighlightConfig, LocalizedValue, PanelConfig, SpecialCategoriesConfig } from "./types";
import { MAX_HIGHLIGHTS } from "./types";

const DESKTOP_BREAKPOINT = 768;

function toBoolean(val: unknown, defaultValue = false): boolean {
  if (val === undefined || val === null || val === "") return defaultValue;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  }
  return defaultValue;
}

/**
 * Special Categories — fully data-driven collection panels.
 * Every piece of content/style comes from the Twilight bundle JSON `config`,
 * there is no static data inside the component.
 */
export default class SpecialCategories extends LitElement {
  @property({ type: Object }) config?: SpecialCategoriesConfig | string;

  @state() private index = 0;
  @state() private perView = 2;
  @state() private dragOffset = 0;

  private isPointerDragging = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private isHorizontalSwipe = false;
  private wheelLock = false;
  private mediaQuery: MediaQueryList | null = null;

  static styles = css`
    :host {
      display: block;
      --sc-text: #ffffff;
      --sc-highlight: #ffffff;
      --sc-btn-bg: #ffffff;
      --sc-btn-text: #111111;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .sc-section {
      position: relative;
      overflow: hidden;
      background-color: var(--sc-section-bg, #111827);
    }

    .sc-slider {
      position: relative;
      overflow: hidden;
    }

    .sc-track {
      display: flex;
      transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
      will-change: transform;
      cursor: grab;
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
    }

    .sc-track.is-dragging {
      transition: none;
      cursor: grabbing;
    }

    .sc-panel {
      position: relative;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
      min-height: var(--sc-min-height-mobile, 100vh);
      padding-block: 3rem;
      background-color: #1f2937;
      user-select: none;
      -webkit-user-select: none;
    }

    .sc-panel img {
      -webkit-user-drag: none;
      user-drag: none;
      user-select: none;
      -webkit-user-select: none;
      pointer-events: none;
    }

    @media (min-width: 768px) {
      .sc-panel {
        min-height: var(--sc-min-height, 100vh);
        padding-inline: 4rem;
      }

      .sc-panel.has-bg {
        padding-block: 4rem;
      }
    }

    /* ---------- backgrounds ---------- */
    .sc-bg,
    .sc-bg-hover {
      position: absolute;
      inset: 0;
      margin: 0;
      overflow: hidden;
    }

    .sc-bg img,
    .sc-bg-hover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .sc-bg-hover {
      opacity: 0;
    }

    .sc-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 55%);
      opacity: var(--sc-overlay-opacity, 1);
      pointer-events: none;
    }

    /* ---------- content ---------- */
    .sc-content {
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 0;
      color: var(--sc-text);
      margin-block-end: 1.5rem;
    }

    @media (max-width: 767px) {
      .sc-content {
        padding-inline: 1.5rem;
      }
    }

    .sc-subheading {
      font-size: 0.8rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .sc-title {
      margin: 0;
      font-size: var(--sc-title-size, 2.25rem);
      line-height: 1.15;
      font-weight: 700;
      transition: 0.5s ease-in-out;
    }

    .sc-title .accent {
      color: var(--sc-highlight);
    }

    /* ---------- media ---------- */
    .sc-media {
      position: relative;
      z-index: 1;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      width: 90%;
      margin: 0 auto;
      max-height: 68%;
      overflow: hidden;
    }

    .sc-media .media-card {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    @media (min-width: 768px) {
      .sc-media {
        width: 68%;
      }
    }

    .sc-media img {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: var(--sc-image-fit, contain);
      transition:
        transform 0.5s cubic-bezier(0.45, 0, 0.55, 1),
        opacity 0.5s cubic-bezier(0.45, 0, 0.55, 1);
    }

    /* ---------- highlights ---------- */
    .sc-highlights-wrapper {
      position: relative;
      z-index: 2;
      padding-inline: 1.5rem;
      margin-block-start: 1rem;
      pointer-events: auto;
      touch-action: pan-x;
    }

    @media (min-width: 768px) {
      .sc-highlights-wrapper {
        position: absolute;
        top: 50%;
        left: 2rem;
        transform: translateY(-50%);
        padding-inline: 0;
        margin-block-start: 0;
        touch-action: auto;
      }
    }

    @media (min-width: 1200px) {
      .sc-highlights-wrapper {
        left: 5rem;
      }
    }

    .sc-highlights {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 0.25rem;
    }

    @media (max-width: 767px) {
      .sc-highlights {
        flex-direction: row;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
        padding-bottom: 0.25rem;
      }

      .sc-highlights::-webkit-scrollbar {
        display: none;
      }
    }

    @media (min-width: 768px) {
      .sc-highlights {
        flex-direction: column;
      }
    }

    .sc-highlight {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      flex: 0 0 auto;
      width: max-content;
      padding: 0.45rem 0.7rem;
      border-radius: 0.6rem;
      background: var(--sc-badge-bg, #ffffff);
      color: var(--sc-badge-text, #2b2b2b);
      font-size: 0.85rem;
      line-height: 1.2;
      text-align: center;
      opacity: 1;
      transition: 0.5s ease-in-out;
      pointer-events: auto;
    }

    .sc-highlight .icon-box {
      position: relative;
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
      background-color: var(--sc-badge-icon, currentColor);
      -webkit-mask: var(--sc-icon-url) no-repeat center / contain;
      mask: var(--sc-icon-url) no-repeat center / contain;
    }

    @media (min-width: 1200px) {
      .sc-highlight .icon-box {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    .sc-highlight .stretched-link {
      position: absolute;
      inset: 0;
      z-index: 3;
    }

    /* ---------- button (Clean style without dot) ---------- */
    .sc-btn {
      display: inline-block;
      pointer-events: auto;
    }

    @media (min-width: 768px) {
      .sc-btn {
        margin-top: 1rem;
      }
    }

    .sc-btn a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.55rem 1.1rem;
      border-radius: 0.5rem;
      background: var(--sc-btn-bg, #ffffff);
      border: 1px solid rgba(0, 0, 0, 0.12);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      color: var(--sc-btn-text);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      position: relative;
      transition: all 0.3s ease;
    }

    .sc-btn a:hover {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    .sc-btn-mobile {
      margin-top: 0.25rem;
    }

    @media (max-width: 767px) {
      .sc-btn-desktop {
        display: none;
      }
    }

    @media (min-width: 768px) {
      .sc-btn-mobile {
        display: none;
      }

      .sc-btn-desktop {
        display: block;
        width: 100%;
        text-align: left;
      }
    }

    /* ---------- arrows ---------- */
    .sc-controls {
      position: absolute;
      inset-inline: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 3;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }

    @media (min-width: 768px) {
      .sc-controls {
        padding: 0 1.25rem;
      }
    }

    .sc-arrow {
      pointer-events: auto;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.12);
      background: #fff;
      color: #111;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .sc-arrow:hover:not(:disabled) {
      transform: scale(1.06);
    }

    .sc-arrow:disabled {
      opacity: 0.35;
      cursor: default;
    }

    .sc-arrow svg {
      width: 16px;
      height: 16px;
    }

    .sc-controls.is-rtl .sc-arrow svg {
      transform: scaleX(-1);
    }

    /* ---------- pagination dots ---------- */
    .sc-dots {
      position: absolute;
      bottom: 1.25rem;
      inset-inline: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      z-index: 4;
      pointer-events: none;
    }

    .sc-dot {
      pointer-events: auto;
      width: 10px;
      height: 10px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background-color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .sc-dot:hover {
      background-color: rgba(255, 255, 255, 0.8);
      transform: scale(1.15);
    }

    .sc-dot.is-active {
      width: 28px;
      background-color: var(--sc-highlight, #ffffff);
      border-color: var(--sc-highlight, #ffffff);
    }

    /*
     * MOBILE: Fixed static look with BOTH images visible simultaneously
     * (matching the desktop hover composition, but completely static and touch-friendly).
     */
    @media (max-width: 767px) {
      .sc-media .base.has-pair {
        transform: translateX(-8%);
        opacity: 1;
      }

      .sc-media .hovered {
        transform: translateX(15%);
        opacity: 1;
        display: block !important;
        visibility: visible !important;
      }

      .sc-panel .sc-highlight {
        opacity: 1;
        transform: none;
      }

      .sc-panel .sc-title {
        transform: none;
      }
    }

    /*
     * DESKTOP: Dynamic hover animation on mouse hover (pointer: fine and min-width: 768px).
     */
    @media (min-width: 768px) and (pointer: fine) {
      .sc-highlight {
        opacity: 0;
        transform: translate(-1rem);
        transition-delay: var(--transition-delay, 0.05s);
      }

      .sc-panel:focus-within .sc-highlight,
      .sc-highlight:focus {
        opacity: 1;
        transform: translate(0);
      }

      .sc-media .base {
        transform: none;
      }

      .sc-media .hovered {
        opacity: 0;
        transform: none;
      }

      .sc-bg-hover {
        opacity: 0;
        transition: 0.5s ease-in-out;
      }

      .sc-panel:hover .sc-highlight {
        opacity: 1;
        transform: translate(0);
      }

      .sc-panel:hover .sc-media .base.has-pair {
        transform: translateX(-8%);
      }

      .sc-panel:hover .sc-media .hovered {
        opacity: 1;
        transform: translateX(15%);
      }

      .sc-panel:hover .sc-title {
        transform: scale(1.15);
      }

      .sc-panel:hover .sc-bg-hover {
        opacity: 1;
      }
    }

    /* When hover is disabled in settings, show only single base image centered */
    .sc-no-hover .sc-highlight,
    .sc-no-hover .sc-panel:hover .sc-highlight,
    .sc-no-hover .sc-panel:focus-within .sc-highlight {
      opacity: 1 !important;
      transform: none !important;
    }

    .sc-no-hover .sc-bg-hover,
    .sc-no-hover .sc-panel:hover .sc-bg-hover,
    .sc-no-hover .sc-media .hovered,
    .sc-no-hover .sc-panel:hover .sc-media .hovered {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      transform: none !important;
    }

    .sc-no-hover .sc-media .base,
    .sc-no-hover .sc-media .base.has-pair,
    .sc-no-hover .sc-panel:hover .sc-media .base,
    .sc-no-hover .sc-panel:hover .sc-media .base.has-pair {
      transform: none !important;
      opacity: 1 !important;
    }

    .sc-no-hover .sc-title,
    .sc-no-hover .sc-panel:hover .sc-title {
      transform: none !important;
    }
  `;

  private get settings(): SpecialCategoriesConfig {
    if (!this.config) {
      try {
        const raw = (window as unknown as { customComponentsRaw?: Record<string, { fields?: Array<{ id: string; value: unknown }> }> })?.customComponentsRaw?.["special-categories"];
        if (raw?.fields && Array.isArray(raw.fields)) {
          return Object.fromEntries(raw.fields.map(f => [f.id, f.value])) as SpecialCategoriesConfig;
        }
      } catch {}
      return {};
    }
    if (typeof this.config === "string") {
      try {
        return JSON.parse(this.config) as SpecialCategoriesConfig;
      } catch {
        return {};
      }
    }
    return this.config;
  }

  private get isHoverActive(): boolean {
    const s = this.settings;
    return !toBoolean(s.disable_hover, false);
  }

  private get panels(): PanelConfig[] {
    const raw = this.settings.panels;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (panel) =>
        Boolean(this.panelTitle(panel) || panel?.category?.length || this.resolveImage(panel.main_image))
    );
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.syncPerView();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    this.syncPerView();
    this.mediaQuery.addEventListener("change", this.syncPerView);
    window.addEventListener("resize", this.syncPerView);
    document.addEventListener("formbuilder-settings-changed", this.onSettingsChanged);
  }

  disconnectedCallback(): void {
    this.mediaQuery?.removeEventListener("change", this.syncPerView);
    window.removeEventListener("resize", this.syncPerView);
    document.removeEventListener("formbuilder-settings-changed", this.onSettingsChanged);
    super.disconnectedCallback();
  }

  private onSettingsChanged = (): void => {
    this.syncPerView();
    this.requestUpdate();
  };

  private syncPerView = (): void => {
    const isDesktop = this.mediaQuery ? this.mediaQuery.matches : window.innerWidth >= DESKTOP_BREAKPOINT;
    const rawVal = Number(this.settings.slides_per_view);
    const desktop = !isNaN(rawVal) && rawVal >= 1 ? Math.min(3, Math.max(1, Math.round(rawVal))) : 2;
    // On mobile, perView is always fixed to 1 slide per view
    this.perView = isDesktop ? desktop : 1;
    this.clampIndex();
  };

  private clampIndex(): void {
    const max = Math.max(0, this.panels.length - this.perView);
    if (this.index > max) this.index = max;
    if (this.index < 0) this.index = 0;
  }

  private next(): void {
    const max = Math.max(0, this.panels.length - this.perView);
    if (this.index < max) this.index++;
  }

  private prev(): void {
    if (this.index > 0) this.index--;
  }

  private get isRTL(): boolean {
    return getComputedStyle(this).direction === "rtl";
  }

  private onPointerDown(event: PointerEvent): void {
    // Ignore pointer events on interactive elements so drag doesn't hijack badges, buttons, dots, or scroll
    if ((event.target as HTMLElement)?.closest(".sc-highlights-wrapper, .sc-btn, .sc-arrow, .sc-dot, a, button")) {
      return;
    }
    if (this.panels.length <= this.perView) return;

    this.isPointerDragging = true;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.isHorizontalSwipe = false;
    this.dragOffset = 0;

    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isPointerDragging) return;

    const deltaX = event.clientX - this.pointerStartX;
    const deltaY = event.clientY - this.pointerStartY;

    if (!this.isHorizontalSwipe) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          this.isHorizontalSwipe = true;
          this.shadowRoot?.querySelector(".sc-track")?.classList.add("is-dragging");
        } else {
          // Vertical gesture — allow normal page scroll
          this.isPointerDragging = false;
          return;
        }
      }
    }

    if (this.isHorizontalSwipe) {
      const maxIndex = Math.max(0, this.panels.length - this.perView);
      let offset = deltaX;
      // Rubber-banding when pulling past edges
      if (this.isRTL) {
        if (this.index === 0 && offset < 0) offset *= 0.35;
        if (this.index === maxIndex && offset > 0) offset *= 0.35;
      } else {
        if (this.index === 0 && offset > 0) offset *= 0.35;
        if (this.index === maxIndex && offset < 0) offset *= 0.35;
      }
      this.dragOffset = offset;
    }
  }

  private onPointerUp(): void {
    if (!this.isPointerDragging) return;
    this.isPointerDragging = false;
    this.shadowRoot?.querySelector(".sc-track")?.classList.remove("is-dragging");

    if (this.isHorizontalSwipe) {
      const threshold = 35;
      if (Math.abs(this.dragOffset) >= threshold) {
        if (this.isRTL) {
          if (this.dragOffset > 0) {
            this.next();
          } else {
            this.prev();
          }
        } else {
          if (this.dragOffset < 0) {
            this.next();
          } else {
            this.prev();
          }
        }
      }
    }

    this.dragOffset = 0;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.isHorizontalSwipe = false;
    this.clampIndex();
  }

  private onTrackWheel(event: WheelEvent): void {
    if ((event.target as HTMLElement)?.closest(".sc-highlights-wrapper")) return;
    if (this.panels.length <= this.perView) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : (event.shiftKey ? event.deltaY : 0);

    if (Math.abs(delta) < 20) return;

    if (this.wheelLock) return;
    this.wheelLock = true;
    setTimeout(() => {
      this.wheelLock = false;
    }, 350);

    if (this.isRTL) {
      if (delta < 0) this.next();
      else this.prev();
    } else {
      if (delta > 0) this.next();
      else this.prev();
    }
  }

  /**
   * Translates vertical mouse-wheel motion into horizontal scroll for the highlights bar
   * so the user does NOT have to hold Shift to scroll highlights.
   */
  private onHighlightsWheel(event: WheelEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  }

  private get trackStyle(): string {
    const s = this.settings;
    const rawGap = Number(s.gap);
    const gap = !isNaN(rawGap) && rawGap >= 0 ? rawGap : 8;
    const dir = this.isRTL ? 1 : -1;
    const percent = (dir * this.index * 100) / this.perView;
    const px = (dir * (this.index * gap)) / this.perView + this.dragOffset;
    return `gap: ${gap}px; transform: translateX(calc(${percent}% + ${px}px));`;
  }

  private panelStyle(): string {
    const rawGap = Number(this.settings.gap);
    const gap = !isNaN(rawGap) && rawGap >= 0 ? rawGap : 8;
    return `flex-basis: calc((100% - ${gap * (this.perView - 1)}px) / ${this.perView});`;
  }

  private sectionStyle(): string {
    const s = this.settings;
    const customHeight = toBoolean(s.enable_custom_height, false);

    const formatHeight = (val: unknown, fallback: string): string => {
      if (val === undefined || val === null || val === "") return fallback;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.endsWith("vh") || trimmed.endsWith("px") || trimmed.endsWith("%") || trimmed.endsWith("rem")) {
          return trimmed;
        }
      }
      const num = Number(val);
      if (isNaN(num) || num <= 0) return fallback;
      return `${num}vh`;
    };

    const desktopHeight = customHeight ? formatHeight(s.panel_min_height, "80vh") : "100vh";
    const mobileHeight = customHeight ? formatHeight(s.panel_min_height_mobile, "70vh") : "100vh";

    const titleSize = Number(s.title_size) || 36;
    const overlayOpacity = s.overlay_opacity !== undefined ? Number(s.overlay_opacity) / 100 : 0.5;
    const paddingTop = Number(s.section_padding_top) || 0;
    const paddingBottom = Number(s.section_padding_bottom) || 0;

    return [
      `--sc-section-bg: ${s.section_bg_color || "#111827"}`,
      `--sc-text: ${s.text_color || "#ffffff"}`,
      `--sc-highlight: ${s.highlight_color || "#ffffff"}`,
      `--sc-btn-bg: ${s.button_bg || "#ffffff"}`,
      `--sc-btn-text: ${s.button_text_color || "#111111"}`,
      `--sc-badge-bg: ${s.badge_bg || "#ffffff"}`,
      `--sc-badge-text: ${s.badge_text_color || "#2b2b2b"}`,
      `--sc-badge-icon: ${s.badge_icon_color || s.badge_text_color || "#2b2b2b"}`,
      `--sc-title-size: ${titleSize / 16}rem`,
      `--sc-image-fit: ${toBoolean(s.image_cover, false) ? "cover" : "contain"}`,
      `--sc-min-height: ${desktopHeight}`,
      `--sc-min-height-mobile: ${mobileHeight}`,
      `--sc-overlay-opacity: ${overlayOpacity}`,
      `padding-block-start: ${paddingTop}px`,
      `padding-block-end: ${paddingBottom}px`,
    ].join(";");
  }

  /** The builder may deliver localized values as `{ar, en}` — pick the current language. */
  private t(value: LocalizedValue | undefined): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    const lang = (document.documentElement.lang || "ar").slice(0, 2);
    return value[lang] || Object.values(value).find(Boolean) || "";
  }

  /**
   * Normalizes URLs from various Twilight formats: plain string, variable-list objects/arrays,
   * category fallbacks, custom external links, etc.
   */
  private resolveUrl(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "#" ? "" : trimmed;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = this.resolveUrl(item);
        if (resolved) return resolved;
      }
      return "";
    }

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (obj.url && typeof obj.url === "string") return obj.url.trim();
      if (obj.link && typeof obj.link === "string") return obj.link.trim();

      if (obj.value !== undefined && obj.value !== null) {
        const val = String(obj.value).trim();
        const key = String(obj.key || "").trim();

        if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/")) {
          return val;
        }

        switch (key) {
          case "products":
            return `/products/${val}`;
          case "categories":
            return `/categories/${val}`;
          case "brands":
            return `/brands/${val}`;
          case "pages":
            return `/pages/${val}`;
          case "blog_articles":
            return `/blog/${val}`;
          case "blog_categories":
            return `/blog/categories/${val}`;
          case "offers_link":
            return `/offers`;
          case "brands_link":
            return `/brands`;
          case "blog_link":
            return `/blog`;
          case "custom":
            return val;
          default:
            return val;
        }
      }
    }

    return "";
  }

  private resolveImage(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        const url = this.resolveImage(item);
        if (url) return url;
      }
      return "";
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      for (const key of ["url", "src", "secure_url", "cdn_url", "image", "link", "value", "path"]) {
        const url = this.resolveImage(obj[key]);
        if (url) return url;
      }
      const lang = (document.documentElement.lang || "ar").slice(0, 2);
      const localized = this.resolveImage(obj[lang]);
      if (localized) return localized;
      for (const nested of Object.values(obj)) {
        const url = this.resolveImage(nested);
        if (url) return url;
      }
    }
    return "";
  }

  /** Resolve a panel link: explicit button_url or button_link wins, otherwise category. */
  private panelLink(panel: PanelConfig): string {
    const explicit = this.resolveUrl(panel.button_url) || this.resolveUrl(panel.button_link);
    if (explicit) return explicit;
    const category = panel.category?.[0];
    if (category?.value) return `/categories/${category.value}`;
    return "";
  }

  private panelTitle(panel: PanelConfig): string {
    return this.t(panel.title) || panel.category?.[0]?.label || "";
  }

  private renderTitle(panel: PanelConfig) {
    const words = this.panelTitle(panel).split(/\s+/).filter(Boolean);
    const highlighted = new Set(
      (this.t(panel.highlighted_words) ?? "")
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
    );

    return html`
      <h2 class="sc-title">
        ${words.map(
          (word) => html`<span class=${classMap({ accent: highlighted.has(word.toLowerCase()) })}
            >${word}</span
          >&nbsp;`
        )}
      </h2>
    `;
  }

  private renderButton(panel: PanelConfig, extraClass: string) {
    const label = this.t(panel.button_text);
    if (!label) return nothing;
    const link = this.panelLink(panel) || "#";
    return html`
      <div class="sc-btn ${extraClass}">
        <a href=${link} aria-label=${label}>
          <span>${label}</span>
        </a>
      </div>
    `;
  }

  private panelHighlights(panel: PanelConfig): HighlightConfig[] {
    const highlights: HighlightConfig[] = [];
    for (let i = 1; i <= MAX_HIGHLIGHTS; i++) {
      const title = this.t(panel[`highlight_${i}_title` as keyof PanelConfig] as string | undefined);
      const icon = this.resolveImage(panel[`highlight_${i}_icon` as keyof PanelConfig]);
      const link =
        this.resolveUrl(panel[`highlight_${i}_url` as keyof PanelConfig]) ||
        this.resolveUrl(panel[`highlight_${i}_link` as keyof PanelConfig]);
      if (title || icon) highlights.push({ title, icon, link });
    }
    return highlights;
  }

  private renderHighlights(panel: PanelConfig) {
    const highlights = this.panelHighlights(panel);
    if (!highlights.length) return nothing;
    return html`
      <div class="sc-highlights-wrapper">
        <ul class="sc-highlights" @wheel=${this.onHighlightsWheel}>
          ${repeat(
            highlights,
            (item) => `${item.title}-${item.icon}`,
            (item, i) => html`
              <li class="sc-highlight" style="--transition-delay:${0.05 + i * 0.1}s">
                ${item.link
                  ? html`<a class="stretched-link" href=${item.link} aria-label=${item.title ?? ""}></a>`
                  : nothing}
                ${item.icon
                  ? html`<span
                      class="icon-box"
                      style=${`--sc-icon-url:url('${item.icon}')`}
                      role="img"
                      aria-label=${item.title ?? ""}
                    ></span>`
                  : nothing}
                <span>${item.title}</span>
              </li>
            `
          )}
        </ul>
      </div>
    `;
  }

  private renderMedia(panel: PanelConfig) {
    const mainImage = this.resolveImage(panel.main_image);
    if (!mainImage) return nothing;
    const hoverEnabled = this.isHoverActive;
    const hoverImage = hoverEnabled ? this.resolveImage(panel.main_image_hover) : "";
    const hasPair = Boolean(hoverImage);

    return html`
      <div class="sc-media">
        <div class="media-card">
          <img
            class="base ${classMap({ "has-pair": hasPair })}"
            src=${mainImage}
            alt=${this.panelTitle(panel)}
            loading="lazy"
            decoding="async"
          />
          ${hasPair
            ? html`<img
                class="hovered"
                src=${hoverImage}
                alt=${this.panelTitle(panel)}
                loading="lazy"
                decoding="async"
              />`
            : nothing}
        </div>
      </div>
    `;
  }

  private renderPanel(panel: PanelConfig, active: boolean) {
    const hoverEnabled = this.isHoverActive;
    const bgImage = this.resolveImage(panel.bg_image);
    const bgImageHover = hoverEnabled ? this.resolveImage(panel.bg_image_hover) : "";
    const bgColor = this.t(panel.bg_color as string | undefined) || "#1F2937";

    return html`
      <div
        class="sc-panel ${classMap({ "has-bg": Boolean(bgImage), "is-active": active })}"
        style="${this.panelStyle()} background-color: ${bgColor};"
      >
        ${bgImage
          ? html`<figure class="sc-bg">
              <img src=${bgImage} alt="" loading="lazy" decoding="async" />
            </figure>`
          : nothing}
        ${bgImageHover
          ? html`<figure class="sc-bg-hover">
              <img src=${bgImageHover} alt="" loading="lazy" decoding="async" />
            </figure>`
          : nothing}
        ${(bgImage || bgImageHover)
          ? html`<div class="sc-overlay"></div>`
          : nothing}

        <div class="sc-content">
          ${this.t(panel.subheading)
            ? html`<div class="sc-subheading">${this.t(panel.subheading)}</div>`
            : nothing}
          ${this.panelTitle(panel) ? this.renderTitle(panel) : nothing}
          ${this.renderButton(panel, "sc-btn-mobile")}
        </div>

        ${this.renderMedia(panel)} ${this.renderHighlights(panel)}
        ${this.renderButton(panel, "sc-btn-desktop")}
      </div>
    `;
  }

  render() {
    const panels = this.panels;
    if (!panels.length) return nothing;

    const s = this.settings;
    const showArrows = toBoolean(s.show_arrows, true) && panels.length > this.perView;
    const showDots = toBoolean(s.show_dots, true) && panels.length > this.perView;
    const maxIndex = Math.max(0, panels.length - this.perView);

    return html`
      <div
        class="sc-section ${classMap({ "sc-no-hover": !this.isHoverActive })}"
        style=${this.sectionStyle()}
      >
        <div class="sc-slider" @wheel=${this.onTrackWheel}>
          <div
            class="sc-track"
            style=${this.trackStyle}
            @pointerdown=${this.onPointerDown}
            @pointermove=${this.onPointerMove}
            @pointerup=${this.onPointerUp}
            @pointercancel=${this.onPointerUp}
            @dragstart=${(e: DragEvent) => e.preventDefault()}
          >
            ${repeat(
              panels,
              (panel) => this.panelTitle(panel) + this.t(panel.main_image),
              (panel, i) =>
                this.renderPanel(panel, i >= this.index && i < this.index + this.perView)
            )}
          </div>

          ${showArrows
            ? html`
                <div class="sc-controls ${classMap({ "is-rtl": this.isRTL })}">
                  <button
                    type="button"
                    class="sc-arrow"
                    aria-label="Previous"
                    ?disabled=${this.index <= 0}
                    @click=${this.prev}
                  >
                    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M8.34 5.18H2.06" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                      <path
                        d="M5.05 1.67L1.56 5.16l3.49 3.22"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="sc-arrow"
                    aria-label="Next"
                    ?disabled=${this.index >= maxIndex}
                    @click=${this.next}
                  >
                    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M1.66 5.18h6.28" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                      <path
                        d="M4.95 1.67l3.49 3.49-3.49 3.22"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              `
            : nothing}

          ${showDots
            ? html`
                <div class="sc-dots">
                  ${repeat(
                    Array.from({ length: maxIndex + 1 }, (_, i) => i),
                    (i: number) => i,
                    (i: number) => html`
                      <button
                        type="button"
                        class="sc-dot ${classMap({ "is-active": i === this.index })}"
                        aria-label="الانتقال إلى اللوحة ${i + 1}"
                        @click=${() => {
                          this.index = i;
                        }}
                      ></button>
                    `
                  )}
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
