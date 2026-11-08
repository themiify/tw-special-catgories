import { LitElement as m, css as u, html as n, nothing as o } from "lit";
import { property as b, state as l } from "lit/decorators.js";
import { classMap as p } from "lit/directives/class-map.js";
import { repeat as f } from "lit/directives/repeat.js";
var v = Object.defineProperty, c = (d, t, i, e) => {
  for (var s = void 0, r = d.length - 1, g; r >= 0; r--)
    (g = d[r]) && (s = g(t, i, s) || s);
  return s && v(t, i, s), s;
};
const x = 768, h = class h extends m {
  constructor() {
    super(...arguments), this.index = 0, this.perView = 2, this.dragOffset = 0, this.dragStartX = null, this.mediaQuery = null, this.syncPerView = () => {
      var e;
      const t = ((e = this.mediaQuery) == null ? void 0 : e.matches) ?? !0, i = this.settings;
      this.perView = Math.max(
        1,
        Math.floor(t ? i.slides_per_view ?? 2 : i.slides_per_view_mobile ?? 1)
      ), this.clampIndex();
    };
  }
  /** The builder may deliver `config` as a JSON string attribute — normalize it. */
  get settings() {
    const t = this.config;
    if (typeof t == "string")
      try {
        return JSON.parse(t);
      } catch {
        return {};
      }
    return t ?? {};
  }
  get panels() {
    return (this.settings.panels ?? []).filter(
      (t) => {
        var i;
        return !!(t != null && t.title || (i = t == null ? void 0 : t.category) != null && i.length || t != null && t.main_image);
      }
    );
  }
  connectedCallback() {
    super.connectedCallback(), this.mediaQuery = window.matchMedia(`(min-width: ${x}px)`), this.syncPerView(), this.mediaQuery.addEventListener("change", this.syncPerView);
  }
  disconnectedCallback() {
    var t;
    (t = this.mediaQuery) == null || t.removeEventListener("change", this.syncPerView), super.disconnectedCallback();
  }
  clampIndex() {
    const t = Math.max(0, this.panels.length - this.perView);
    this.index > t && (this.index = t), this.index < 0 && (this.index = 0);
  }
  next() {
    this.clampIndex(), this.index < Math.max(0, this.panels.length - this.perView) && this.index++;
  }
  prev() {
    this.index > 0 && this.index--;
  }
  /** RTL stores slide toward the positive axis. */
  get isRTL() {
    return getComputedStyle(this).direction === "rtl";
  }
  onPointerDown(t) {
    var i, e;
    this.panels.length <= this.perView || (this.dragStartX = t.clientX, (e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".sc-track")) == null || e.classList.add("is-dragging"));
  }
  onPointerMove(t) {
    this.dragStartX !== null && (this.dragOffset = t.clientX - this.dragStartX);
  }
  onPointerUp() {
    var s, r;
    if ((r = (s = this.shadowRoot) == null ? void 0 : s.querySelector(".sc-track")) == null || r.classList.remove("is-dragging"), this.dragStartX === null) return;
    const i = this.clientWidth / this.perView / 4, e = Math.round(this.dragOffset / i);
    e !== 0 && (this.index -= this.isRTL ? -e : e), this.dragStartX = null, this.dragOffset = 0, this.clampIndex();
  }
  /** One slide step = containerWidth/perView + gap/perView (accounts for the flex gap). */
  get trackStyle() {
    const i = this.settings.gap ?? 8, e = this.isRTL ? 1 : -1, s = e * this.index * 100 / this.perView, r = e * (this.index * i) / this.perView + (this.isRTL ? -this.dragOffset : this.dragOffset);
    return `gap: ${i}px; transform: translateX(calc(${s}% + ${r}px));`;
  }
  panelStyle() {
    return `flex-basis: calc((100% - ${(this.settings.gap ?? 8) * (this.perView - 1)}px) / ${this.perView});`;
  }
  sectionStyle() {
    const t = this.settings;
    return [
      `--sc-text: ${t.text_color || "#ffffff"}`,
      `--sc-highlight: ${t.highlight_color || "#ffffff"}`,
      `--sc-btn-bg: ${t.button_bg || "#ffffff"}`,
      `--sc-btn-text: ${t.button_text_color || "#111111"}`,
      `--sc-title-size: ${(t.title_size ?? 36) / 16}rem`,
      `--sc-min-height: ${t.panel_min_height ?? 520}px`,
      `--sc-overlay-opacity: ${(t.overlay_opacity ?? 50) / 100}`,
      `padding-block-start: ${t.section_padding_top ?? 0}px`,
      `padding-block-end: ${t.section_padding_bottom ?? 0}px`
    ].join(";");
  }
  /** Resolve a panel link: explicit link wins, otherwise fall back to the chosen category. */
  panelLink(t) {
    var e;
    if (t.button_link) return t.button_link;
    const i = (e = t.category) == null ? void 0 : e[0];
    return i != null && i.value ? `/products?category=${i.value}` : "";
  }
  /** Panel title: explicit text wins, otherwise the selected category name. */
  panelTitle(t) {
    var i, e;
    return t.title || ((e = (i = t.category) == null ? void 0 : i[0]) == null ? void 0 : e.label) || "";
  }
  renderTitle(t) {
    const i = this.panelTitle(t).split(/\s+/).filter(Boolean), e = new Set(
      (t.highlighted_words ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    );
    return n`
      <h2 class="sc-title">
        ${i.map(
      (s) => n`<span class=${p({ accent: e.has(s.toLowerCase()) })}
            >${s}</span
          >&nbsp;`
    )}
      </h2>
    `;
  }
  renderButton(t, i) {
    const e = t.button_text, s = this.panelLink(t);
    return !e || !s ? o : n`
      <div class="sc-btn ${i}">
        <a href=${s} aria-label=${e}>${e}</a>
      </div>
    `;
  }
  renderHighlights(t) {
    const i = (t.highlights ?? []).filter((e) => (e == null ? void 0 : e.title) || (e == null ? void 0 : e.icon));
    return i.length ? n`
      <div class="sc-highlights-wrapper">
        <ul class="sc-highlights">
          ${f(
      i,
      (e) => `${e.title}-${e.icon}`,
      (e, s) => n`
              <li class="sc-highlight" style="--transition-delay:${(s + 1) * 0.1}s">
                ${e.link ? n`<a class="stretched-link" href=${e.link} aria-label=${e.title ?? ""}></a>` : o}
                ${e.icon ? n`<span class="icon-box"
                      ><img src=${e.icon} alt=${e.title ?? ""} loading="lazy" decoding="async"
                    /></span>` : o}
                <span>${e.title}</span>
              </li>
            `
    )}
        </ul>
      </div>
    ` : o;
  }
  renderMedia(t) {
    if (!t.main_image) return o;
    const i = this.settings.enable_hover !== !1;
    return n`
      <div class="sc-media">
        <div class="media-card">
          <img src=${t.main_image} alt=${this.panelTitle(t)} loading="lazy" decoding="async" />
          ${i && t.main_image_hover ? n`<img
                class="hovered"
                src=${t.main_image_hover}
                alt=${this.panelTitle(t)}
                loading="lazy"
                decoding="async"
              />` : o}
        </div>
      </div>
    `;
  }
  renderPanel(t) {
    const i = this.settings.enable_hover !== !1;
    return n`
      <div class="sc-panel" style=${this.panelStyle()}>
        ${t.bg_image ? n`<figure class="sc-bg">
              <img src=${t.bg_image} alt="" loading="lazy" decoding="async" />
            </figure>` : o}
        ${i && t.bg_image_hover ? n`<figure class="sc-bg-hover">
              <img src=${t.bg_image_hover} alt="" loading="lazy" decoding="async" />
            </figure>` : o}
        <div class="sc-overlay"></div>

        <div class="sc-content">
          ${t.subheading ? n`<div class="sc-subheading">${t.subheading}</div>` : o}
          ${this.panelTitle(t) ? this.renderTitle(t) : o}
          ${this.renderButton(t, "sc-btn-mobile")}
        </div>

        ${this.renderMedia(t)} ${this.renderHighlights(t)}
        ${this.renderButton(t, "sc-btn-desktop")}
      </div>
    `;
  }
  render() {
    const t = this.panels;
    if (!t.length) return o;
    const i = this.settings, e = i.show_arrows !== !1 && t.length > this.perView, s = Math.max(0, t.length - this.perView);
    return n`
      <div
        class="sc-section ${p({ "sc-no-hover": i.enable_hover === !1 })}"
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
            ${f(t, (r) => this.panelTitle(r) + r.main_image, (r) => this.renderPanel(r))}
          </div>

          ${e ? n`
                <div class="sc-controls">
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
                    ?disabled=${this.index >= s}
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
              ` : o}
        </div>
      </div>
    `;
  }
};
h.styles = u`
    :host {
      display: block;
      --sc-text: #ffffff;
      --sc-highlight: #ffffff;
      --sc-btn-bg: #ffffff;
      --sc-btn-text: #111111;
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
      min-height: var(--sc-min-height, 520px);
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
      transition: opacity 0.6s ease;
    }

    .sc-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 55%);
      opacity: var(--sc-overlay-opacity, 1);
      pointer-events: none;
    }

    .sc-panel:hover .sc-bg-hover {
      opacity: 1;
    }

    /* ---------- content ---------- */
    .sc-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 1.25rem 1rem 0;
      color: var(--sc-text);
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
    }

    .sc-title .accent {
      color: var(--sc-highlight);
    }

    /* ---------- media ---------- */
    .sc-media {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      aspect-ratio: var(--sc-image-ratio, 1 / 1);
      max-height: 65%;
    }

    .sc-media .media-card {
      position: relative;
      width: min(100%, 420px);
      aspect-ratio: var(--sc-image-ratio, 1 / 1);
    }

    .sc-media img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .sc-media .hovered {
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    .sc-panel:hover .sc-media .hovered {
      opacity: 1;
    }

    /* ---------- highlights ---------- */
    .sc-highlights-wrapper {
      position: relative;
      z-index: 2;
      padding: 0.5rem 1rem 1rem;
    }

    @media (min-width: 768px) {
      .sc-highlights-wrapper {
        position: absolute;
        inset-inline-end: 1rem;
        top: 50%;
        transform: translateY(-50%);
        padding: 0;
      }
    }

    .sc-highlights {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 0.5rem;
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

    .sc-highlight {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      flex: 0 0 auto;
      font-size: 0.7rem;
      color: var(--sc-text);
      text-align: center;
    }

    .sc-highlight .icon-box {
      position: relative;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .sc-highlight img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .sc-highlight .stretched-link {
      position: absolute;
      inset: 0;
      z-index: 3;
    }

    @media (min-width: 768px) {
      .sc-highlight {
        font-size: 0.8rem;
      }

      .sc-highlight .icon-box {
        width: 40px;
        height: 40px;
      }
    }

    /* ---------- button ---------- */
    .sc-btn {
      display: inline-block;
    }

    .sc-btn a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: var(--sc-btn-bg);
      color: var(--sc-btn-text);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .sc-btn a:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
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
        position: absolute;
        z-index: 2;
        inset-inline-start: 1.5rem;
        bottom: 1.5rem;
      }
    }

    /* ---------- arrows ---------- */
    .sc-controls {
      position: absolute;
      inset-inline: 0;
      top: 50%;
      transform: translateY(-50%);
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      z-index: 5;
      pointer-events: none;
    }

    @media (min-width: 768px) {
      .sc-controls {
        display: flex;
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

    /* hover effects disabled via settings */
    .sc-no-hover .sc-bg-hover,
    .sc-no-hover .sc-media .hovered {
      opacity: 0 !important;
    }
  `;
let a = h;
c([
  b({ type: Object })
], a.prototype, "config");
c([
  l()
], a.prototype, "index");
c([
  l()
], a.prototype, "perView");
c([
  l()
], a.prototype, "dragOffset");
typeof a < "u" && a.registerSallaComponent("salla-special-categories");
export {
  a as default
};
