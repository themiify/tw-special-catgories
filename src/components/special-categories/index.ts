import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import type { HighlightConfig, LocalizedValue, PanelConfig, SpecialCategoriesConfig } from "./types";
import { MAX_HIGHLIGHTS } from "./types";

const DESKTOP_BREAKPOINT = 768;

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

  private dragStartX: number | null = null;
  private mediaQuery: MediaQueryList | null = null;

  static styles = css`
    :host {
      display: block;
      --sc-text: #ffffff;
      --sc-highlight: #ffffff;
      --sc-btn-bg: #ffffff;
      --sc-btn-text: #111111;
    }

    /* Shadow DOM does not inherit the host page reset; without border-box the
       JS-computed flex-basis plus padding-inline makes each panel overflow and
       get clipped. Scope a reset inside the component. */
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .sc-section {
      position: relative;
      overflow: hidden;
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
      touch-action: pan-y; /* let us capture horizontal swipe on touch while the page still scrolls vertically */
    }

    .sc-track.is-dragging {
      transition: none;
      cursor: grabbing;
      user-select: none;
    }

    .sc-panel {
      position: relative;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow: hidden;
      min-height: var(--sc-min-height-mobile, 100vh);
      padding-block: 3rem; /* Sky: .collection-panel-item:has(.background-image) */
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

    /* Sky base state (touch / coarse pointer): both figures shown offset. */
    .sc-bg-hover {
      opacity: 0;
    }

    /*
     * Sky offsets the two images with "left", but that is a no-op in RTL
     * (absolute + inset:0 + width:100% is over-constrained, and RTL drops
     * the left value). translateX is direction-agnostic and reproduces the
     * same parallax: front image slides one way, back image the other.
     */
    .sc-media .base {
      transform: translateX(-8%);
    }

    .sc-media .hovered {
      transform: translateX(15%);
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
      margin-block-end: 1.5rem; /* Sky: keep a clear gap so the title never sits on the image */
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
      min-height: 0; /* let the media shrink instead of overflowing up into the title */
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
        width: 68%; /* Sky */
      }
    }

    /* Sky: images slide horizontally via translateX + crossfade. */
    .sc-media img {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: var(--sc-image-fit, contain); /* cover = fill & crop, contain = always whole figure */
      transition:
        transform 0.5s cubic-bezier(0.45, 0, 0.55, 1),
        opacity 0.5s cubic-bezier(0.45, 0, 0.55, 1);
    }

    /* ---------- highlights ---------- */
    .sc-highlights-wrapper {
      position: relative;
      z-index: 1;
      padding-inline: 1.5rem;
      margin-block-start: 1rem;
    }

    @media (min-width: 768px) {
      .sc-highlights-wrapper {
        position: absolute;
        top: 50%;
        left: 2rem;
        transform: translateY(-50%);
        z-index: 1;
        padding-inline: 0;
        margin-block-start: 0;
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
        scrollbar-width: none;
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

    /* Sky pill: .collection-panel-hightlight-item */
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
    }

    /* Mobile (no hover): Sky slides badges up into place for the active slide. */
    @media (max-width: 767px) {
      .sc-highlight {
        transform: translateY(1rem);
      }
    }

    .sc-highlight .icon-box {
      position: relative;
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
      /* Render the SVG as a mask so its color is fully controllable (tintable),
         instead of a fixed-color <img>. Defaults to the badge text color. */
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

    /* ---------- button (Sky style: plain text + animated dot) ---------- */
    .sc-btn {
      display: inline-block;
    }

    @media (min-width: 768px) {
      .sc-btn {
        margin-top: 1rem; /* Sky: .collection-panel-btn */
      }
    }

    /* Button pill (matches the reference): white rounded box, thin border,
       soft shadow, dark text, with the animated dot kept inline inside it. */
    .sc-btn a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.9rem;
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
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    }

    /* The dot sits inline next to the label (no longer absolutely positioned),
       so it stays inside the pill on both directions. */
    .sc-btn .btn-dot {
      position: static;
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sc-dot-color, #ff4400);
      transition: transform 0.3s cubic-bezier(0.7, 0, 0.3, 1);
      pointer-events: none;
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

      /* Desktop button sits in flow at the end of the panel, aligned to the
         highlights column on the LEFT (not the right edge). */
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
      display: flex; /* show on both mobile and desktop whenever there is more than one page */
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      z-index: 5;
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

    /* RTL: the slider navigates toward the left, so mirror the arrow glyphs to
       match the direction each button actually moves the track. */
    .sc-controls.is-rtl .sc-arrow svg {
      transform: scaleX(-1);
    }

    /*
     * Hover animation — mirrors Sky's collection-panels.css exactly:
     * base offsets live outside the query, the (pointer: fine) block hides the
     * layers, images slide via "left" (0 -> -8% / 0 -> 15%), badges fade+slide
     * with a per-badge --transitionDelay stagger, title scales 1.2, background
     * crossfades, and the button dot travels on the link's own hover.
     */
    @media (pointer: fine) {
      .sc-highlight {
        opacity: 0;
        transform: translate(-1rem);
        transition-delay: var(--transition-delay, 0.05s);
      }

      /* Sky keyboard fallback: focus reveals opacity only. */
      .sc-panel:focus-within .sc-highlight,
      .sc-highlight:focus {
        opacity: 1;
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

      .sc-panel:hover .sc-media .base {
        transform: translateX(-8%);
      }

      .sc-panel:hover .sc-media .hovered {
        opacity: 1;
        transform: translateX(15%);
      }

      .sc-panel:hover .sc-title {
        transform: scale(1.2);
      }

      .sc-panel:hover .sc-bg-hover {
        opacity: 1;
      }

      /* The dot pops slightly on hover (kept inline inside the pill). */
      .sc-btn a:hover .btn-dot {
        transform: scale(1.5);
      }
    }

    /* Mobile has no hover, so the revealed (hover) state is shown statically:
       badges visible, the second figure composited in, and the hover background
       crossfaded in — regardless of pointer type. The .sc-panel prefix gives
       these higher specificity than the (pointer: fine) block, so a narrow
       desktop window behaves exactly like a phone too. */
    @media (max-width: 767px) {
      .sc-panel .sc-highlight {
        opacity: 1;
        transform: translate(0);
      }

      .sc-panel .sc-media .hovered {
        opacity: 1;
      }

      .sc-panel .sc-bg-hover {
        opacity: 1;
      }
    }

    /* When hover is disabled in settings, nothing hides or slides. */
    .sc-no-hover .sc-highlight {
      opacity: 1;
      transform: none;
    }

    .sc-no-hover .sc-bg-hover,
    .sc-no-hover .sc-media .hovered {
      opacity: 0 !important;
    }

    .sc-no-hover .sc-media .base,
    .sc-no-hover .sc-media .hovered,
    .sc-no-hover .sc-panel:hover .sc-media .base,
    .sc-no-hover .sc-panel:hover .sc-media .hovered {
      transform: none !important;
    }

    .sc-no-hover .sc-title {
      transform: none !important;
    }
  `;

  /** The builder may deliver `config` as a JSON string attribute — normalize it. */
  get settings(): SpecialCategoriesConfig {
    const raw = this.config as SpecialCategoriesConfig | string | undefined;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as SpecialCategoriesConfig;
      } catch {
        return {};
      }
    }
    return raw ?? {};
  }

  get panels(): PanelConfig[] {
    return (this.settings.panels ?? []).filter(
      (panel) =>
        Boolean(this.panelTitle(panel) || panel?.category?.length || this.resolveImage(panel.main_image))
    );
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    this.syncPerView();
    this.mediaQuery.addEventListener("change", this.syncPerView);
  }

  disconnectedCallback(): void {
    this.mediaQuery?.removeEventListener("change", this.syncPerView);
    super.disconnectedCallback();
  }

  private syncPerView = (): void => {
    const isDesktop = this.mediaQuery?.matches ?? true;
    const s = this.settings;
    this.perView = Math.max(
      1,
      Math.floor(isDesktop ? s.slides_per_view ?? 2 : s.slides_per_view_mobile ?? 1)
    );
    this.clampIndex();
  };

  private clampIndex(): void {
    const max = Math.max(0, this.panels.length - this.perView);
    if (this.index > max) this.index = max;
    if (this.index < 0) this.index = 0;
  }

  private next(): void {
    this.clampIndex();
    if (this.index < Math.max(0, this.panels.length - this.perView)) this.index++;
  }

  private prev(): void {
    if (this.index > 0) this.index--;
  }

  /** RTL stores slide toward the positive axis. */
  private get isRTL(): boolean {
    return getComputedStyle(this).direction === "rtl";
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.panels.length <= this.perView) return;
    this.dragStartX = event.clientX;
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    this.shadowRoot?.querySelector(".sc-track")?.classList.add("is-dragging");
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.dragStartX === null) return;
    this.dragOffset = event.clientX - this.dragStartX;
  }

  private onPointerUp(): void {
    this.shadowRoot?.querySelector(".sc-track")?.classList.remove("is-dragging");
    if (this.dragStartX === null) return;
    const panelWidth = this.clientWidth / this.perView;
    const threshold = panelWidth / 4;
    const draggedSlides = Math.round(this.dragOffset / threshold);
    if (draggedSlides !== 0) this.index -= this.isRTL ? -draggedSlides : draggedSlides;
    this.dragStartX = null;
    this.dragOffset = 0;
    this.clampIndex();
  }

  /** One slide step = containerWidth/perView + gap/perView (accounts for the flex gap). */
  private get trackStyle(): string {
    const s = this.settings;
    const gap = s.gap ?? 8;
    const dir = this.isRTL ? 1 : -1;
    const percent = (dir * this.index * 100) / this.perView;
    const px = dir * (this.index * gap) / this.perView + (this.isRTL ? -this.dragOffset : this.dragOffset);
    return `gap: ${gap}px; transform: translateX(calc(${percent}% + ${px}px));`;
  }

  private panelStyle(): string {
    const gap = this.settings.gap ?? 8;
    return `flex-basis: calc((100% - ${gap * (this.perView - 1)}px) / ${this.perView});`;
  }

  private sectionStyle(): string {
    const s = this.settings;
    // When custom height is disabled the panel fills the full viewport height.
    const customHeight = s.enable_custom_height === true;
    const desktopHeight = customHeight ? `${s.panel_min_height ?? 520}px` : "100vh";
    const mobileHeight = customHeight ? `${s.panel_min_height_mobile ?? 420}px` : "100vh";
    return [
      `--sc-text: ${s.text_color || "#ffffff"}`,
      `--sc-highlight: ${s.highlight_color || "#ffffff"}`,
      `--sc-btn-bg: ${s.button_bg || "#ffffff"}`,
      `--sc-btn-text: ${s.button_text_color || "#111111"}`,
      `--sc-badge-bg: ${s.badge_bg || "#ffffff"}`,
      `--sc-badge-text: ${s.badge_text_color || "#2b2b2b"}`,
      `--sc-badge-icon: ${s.badge_icon_color || s.badge_text_color || "#2b2b2b"}`,
      `--sc-dot-color: ${s.dot_color || "#ff4400"}`,
      `--sc-title-size: ${(s.title_size ?? 36) / 16}rem`,
      `--sc-image-fit: ${s.image_cover === true ? "cover" : "contain"}`,
      `--sc-min-height: ${desktopHeight}`,
      `--sc-min-height-mobile: ${mobileHeight}`,
      `--sc-overlay-opacity: ${(s.overlay_opacity ?? 50) / 100}`,
      `padding-block-start: ${s.section_padding_top ?? 0}px`,
      `padding-block-end: ${s.section_padding_bottom ?? 0}px`,
    ].join(";");
  }

  /** The builder may deliver localized values as `{ar, en}` — pick the current language. */
  private t(value: LocalizedValue | undefined): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    const lang = (document.documentElement.lang || "ar").slice(0, 2);
    // Use || (not ??): a saved localized field may hold an empty string for the
    // current language, and we must fall back to any non-empty translation.
    return value[lang] || Object.values(value).find(Boolean) || "";
  }

  /**
   * Image fields (format: "image") are not always a plain URL string once saved:
   * the builder may deliver a localized {ar,en}, a {url,...} object, or an array.
   * Normalize every shape to a usable URL so the chosen image renders instead of
   * falling back to the Salla default placeholder.
   */
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

  /** Resolve a panel link: explicit link wins, otherwise fall back to the chosen category. */
  private panelLink(panel: PanelConfig): string {
    if (this.t(panel.button_link)) return this.t(panel.button_link);
    const category = panel.category?.[0];
    if (category?.value) return `/products?category=${category.value}`;
    return "";
  }

  /** Panel title: explicit text wins, otherwise the selected category name. */
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
    const link = this.panelLink(panel);
    if (!label || !link) return nothing;
    return html`
      <div class="sc-btn ${extraClass}">
        <a href=${link} aria-label=${label}>
          <span class="btn-dot" aria-hidden="true"></span><span>${label}</span>
        </a>
      </div>
    `;
  }

  /** Normalize the flat highlight_N_* fields into badge objects, skipping empty slots. */
  private panelHighlights(panel: PanelConfig): HighlightConfig[] {
    const highlights: HighlightConfig[] = [];
    for (let i = 1; i <= MAX_HIGHLIGHTS; i++) {
      const title = this.t(panel[`highlight_${i}_title` as keyof PanelConfig] as string | undefined);
      const icon = this.resolveImage(panel[`highlight_${i}_icon` as keyof PanelConfig]);
      const link = this.t(panel[`highlight_${i}_link` as keyof PanelConfig] as string | undefined);
      if (title || icon) highlights.push({ title, icon, link });
    }
    return highlights;
  }

  private renderHighlights(panel: PanelConfig) {
    const highlights = this.panelHighlights(panel);
    if (!highlights.length) return nothing;
    return html`
      <div class="sc-highlights-wrapper">
        <ul class="sc-highlights">
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
    const hoverEnabled = this.settings.enable_hover !== false;
    const hoverImage = this.resolveImage(panel.main_image_hover);
    return html`
      <div class="sc-media">
        <div class="media-card">
          <img class="base" src=${mainImage} alt=${this.panelTitle(panel)} loading="lazy" decoding="async" />
          ${hoverEnabled && hoverImage
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
    const hoverEnabled = this.settings.enable_hover !== false;
    const bgImage = this.resolveImage(panel.bg_image);
    const bgImageHover = this.resolveImage(panel.bg_image_hover);
    return html`
      <div
        class="sc-panel ${classMap({ "has-bg": Boolean(bgImage), "is-active": active })}"
        style=${this.panelStyle()}
      >
        ${bgImage
          ? html`<figure class="sc-bg">
              <img src=${bgImage} alt="" loading="lazy" decoding="async" />
            </figure>`
          : nothing}
        ${hoverEnabled && bgImageHover
          ? html`<figure class="sc-bg-hover">
              <img src=${bgImageHover} alt="" loading="lazy" decoding="async" />
            </figure>`
          : nothing}
        <div class="sc-overlay"></div>

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
    const showArrows = s.show_arrows !== false && panels.length > this.perView;
    const maxIndex = Math.max(0, panels.length - this.perView);

    return html`
      <div
        class="sc-section ${classMap({ "sc-no-hover": s.enable_hover === false })}"
        style=${this.sectionStyle()}
      >
        <div class="sc-slider">
          <div
            class="sc-track"
            style=${this.trackStyle}
            @pointerdown=${this.onPointerDown}
            @pointermove=${this.onPointerMove}
            @pointerup=${this.onPointerUp}
            @pointercancel=${this.onPointerUp}
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
        </div>
      </div>
    `;
  }
}
