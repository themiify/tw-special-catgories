import { LitElement as _, css as S, html as o, nothing as c } from "lit";
import { property as z, state as v } from "lit/decorators.js";
import { classMap as g } from "lit/directives/class-map.js";
import { repeat as b } from "lit/directives/repeat.js";
const P = 5;
var M = Object.defineProperty, m = (l, t, e, i) => {
  for (var s = void 0, n = l.length - 1, r; n >= 0; n--)
    (r = l[n]) && (s = r(t, e, s) || s);
  return s && M(t, e, s), s;
};
const y = 768;
function f(l, t = !1) {
  if (l == null || l === "") return t;
  if (typeof l == "boolean") return l;
  if (typeof l == "number") return l !== 0;
  if (typeof l == "string") {
    const e = l.trim().toLowerCase();
    if (e === "true" || e === "1" || e === "yes" || e === "on") return !0;
    if (e === "false" || e === "0" || e === "no" || e === "off") return !1;
  }
  return t;
}
const x = class x extends _ {
  constructor() {
    super(...arguments), this.index = 0, this.perView = 2, this.dragOffset = 0, this.isPointerDragging = !1, this.pointerStartX = 0, this.pointerStartY = 0, this.isHorizontalSwipe = !1, this.wheelLock = !1, this.mediaQuery = null, this.onSettingsChanged = () => {
      this.syncPerView(), this.requestUpdate();
    }, this.syncPerView = () => {
      const t = this.mediaQuery ? this.mediaQuery.matches : window.innerWidth >= y, e = Number(this.settings.slides_per_view), i = !isNaN(e) && e >= 1 ? Math.min(3, Math.max(1, Math.round(e))) : 2;
      this.perView = t ? i : 1, this.clampIndex();
    };
  }
  get settings() {
    var t;
    if (!this.config) {
      try {
        const e = (t = window == null ? void 0 : window.customComponentsRaw) == null ? void 0 : t["special-categories"];
        if (e != null && e.fields && Array.isArray(e.fields))
          return Object.fromEntries(e.fields.map((i) => [i.id, i.value]));
      } catch {
      }
      return {};
    }
    if (typeof this.config == "string")
      try {
        return JSON.parse(this.config);
      } catch {
        return {};
      }
    return this.config;
  }
  get isHoverActive() {
    const t = this.settings;
    return !f(t.disable_hover, !1);
  }
  get panels() {
    const t = this.settings.panels;
    return Array.isArray(t) ? t.filter(
      (e) => {
        var i;
        return !!(this.panelTitle(e) || (i = e == null ? void 0 : e.category) != null && i.length || this.resolveImage(e.main_image));
      }
    ) : [];
  }
  willUpdate(t) {
    super.willUpdate(t), this.syncPerView();
  }
  connectedCallback() {
    super.connectedCallback(), this.mediaQuery = window.matchMedia(`(min-width: ${y}px)`), this.syncPerView(), this.mediaQuery.addEventListener("change", this.syncPerView), window.addEventListener("resize", this.syncPerView), document.addEventListener("formbuilder-settings-changed", this.onSettingsChanged);
  }
  disconnectedCallback() {
    var t;
    (t = this.mediaQuery) == null || t.removeEventListener("change", this.syncPerView), window.removeEventListener("resize", this.syncPerView), document.removeEventListener("formbuilder-settings-changed", this.onSettingsChanged), super.disconnectedCallback();
  }
  clampIndex() {
    const t = Math.max(0, this.panels.length - this.perView);
    this.index > t && (this.index = t), this.index < 0 && (this.index = 0);
  }
  next() {
    const t = Math.max(0, this.panels.length - this.perView);
    this.index < t && this.index++;
  }
  prev() {
    this.index > 0 && this.index--;
  }
  get isRTL() {
    return getComputedStyle(this).direction === "rtl";
  }
  onPointerDown(t) {
    var e, i, s;
    (e = t.target) != null && e.closest(".sc-highlights-wrapper, .sc-btn, .sc-arrow, .sc-dot, a, button") || this.panels.length <= this.perView || (this.isPointerDragging = !0, this.pointerStartX = t.clientX, this.pointerStartY = t.clientY, this.isHorizontalSwipe = !1, this.dragOffset = 0, (s = (i = t.currentTarget) == null ? void 0 : i.setPointerCapture) == null || s.call(i, t.pointerId));
  }
  onPointerMove(t) {
    var s, n;
    if (!this.isPointerDragging) return;
    const e = t.clientX - this.pointerStartX, i = t.clientY - this.pointerStartY;
    if (!this.isHorizontalSwipe && (Math.abs(e) > 6 || Math.abs(i) > 6))
      if (Math.abs(e) >= Math.abs(i))
        this.isHorizontalSwipe = !0, (n = (s = this.shadowRoot) == null ? void 0 : s.querySelector(".sc-track")) == null || n.classList.add("is-dragging");
      else {
        this.isPointerDragging = !1;
        return;
      }
    if (this.isHorizontalSwipe) {
      const r = Math.max(0, this.panels.length - this.perView);
      let a = e;
      this.isRTL ? (this.index === 0 && a < 0 && (a *= 0.35), this.index === r && a > 0 && (a *= 0.35)) : (this.index === 0 && a > 0 && (a *= 0.35), this.index === r && a < 0 && (a *= 0.35)), this.dragOffset = a;
    }
  }
  onPointerUp() {
    var t, e;
    this.isPointerDragging && (this.isPointerDragging = !1, (e = (t = this.shadowRoot) == null ? void 0 : t.querySelector(".sc-track")) == null || e.classList.remove("is-dragging"), this.isHorizontalSwipe && Math.abs(this.dragOffset) >= 35 && (this.isRTL ? this.dragOffset > 0 ? this.next() : this.prev() : this.dragOffset < 0 ? this.next() : this.prev()), this.dragOffset = 0, this.pointerStartX = 0, this.pointerStartY = 0, this.isHorizontalSwipe = !1, this.clampIndex());
  }
  onTrackWheel(t) {
    var i;
    if ((i = t.target) != null && i.closest(".sc-highlights-wrapper") || this.panels.length <= this.perView) return;
    const e = Math.abs(t.deltaX) > Math.abs(t.deltaY) ? t.deltaX : t.shiftKey ? t.deltaY : 0;
    Math.abs(e) < 20 || this.wheelLock || (this.wheelLock = !0, setTimeout(() => {
      this.wheelLock = !1;
    }, 350), this.isRTL ? e < 0 ? this.next() : this.prev() : e > 0 ? this.next() : this.prev());
  }
  /**
   * Translates vertical mouse-wheel motion into horizontal scroll for the highlights bar
   * so the user does NOT have to hold Shift to scroll highlights.
   */
  onHighlightsWheel(t) {
    const e = t.currentTarget;
    e && Math.abs(t.deltaY) > Math.abs(t.deltaX) && (e.scrollLeft += t.deltaY, t.preventDefault());
  }
  get trackStyle() {
    const t = this.settings, e = Number(t.gap), i = !isNaN(e) && e >= 0 ? e : 8, s = this.isRTL ? 1 : -1, n = s * this.index * 100 / this.perView, r = s * (this.index * i) / this.perView + this.dragOffset;
    return `gap: ${i}px; transform: translateX(calc(${n}% + ${r}px));`;
  }
  panelStyle() {
    const t = Number(this.settings.gap);
    return `flex-basis: calc((100% - ${(!isNaN(t) && t >= 0 ? t : 8) * (this.perView - 1)}px) / ${this.perView});`;
  }
  sectionStyle() {
    const t = this.settings, e = f(t.enable_custom_height, !1), i = (d, w) => {
      if (d == null || d === "") return w;
      if (typeof d == "string") {
        const p = d.trim();
        if (p.endsWith("vh") || p.endsWith("px") || p.endsWith("%") || p.endsWith("rem"))
          return p;
      }
      const u = Number(d);
      return isNaN(u) || u <= 0 ? w : `${u}vh`;
    }, s = e ? i(t.panel_min_height, "80vh") : "100vh", n = e ? i(t.panel_min_height_mobile, "70vh") : "100vh", r = Number(t.title_size) || 36, a = t.overlay_opacity !== void 0 ? Number(t.overlay_opacity) / 100 : 0.5, k = Number(t.section_padding_top) || 0, $ = Number(t.section_padding_bottom) || 0;
    return [
      `--sc-section-bg: ${t.section_bg_color || "#111827"}`,
      `--sc-text: ${t.text_color || "#ffffff"}`,
      `--sc-highlight: ${t.highlight_color || "#ffffff"}`,
      `--sc-btn-bg: ${t.button_bg || "#ffffff"}`,
      `--sc-btn-text: ${t.button_text_color || "#111111"}`,
      `--sc-badge-bg: ${t.badge_bg || "#ffffff"}`,
      `--sc-badge-text: ${t.badge_text_color || "#2b2b2b"}`,
      `--sc-badge-icon: ${t.badge_icon_color || t.badge_text_color || "#2b2b2b"}`,
      `--sc-title-size: ${r / 16}rem`,
      `--sc-image-fit: ${f(t.image_cover, !1) ? "cover" : "contain"}`,
      `--sc-min-height: ${s}`,
      `--sc-min-height-mobile: ${n}`,
      `--sc-overlay-opacity: ${a}`,
      `padding-block-start: ${k}px`,
      `padding-block-end: ${$}px`
    ].join(";");
  }
  /** The builder may deliver localized values as `{ar, en}` — pick the current language. */
  t(t) {
    if (!t) return "";
    if (typeof t == "string") return t;
    const e = (document.documentElement.lang || "ar").slice(0, 2);
    return t[e] || Object.values(t).find(Boolean) || "";
  }
  /**
   * Normalizes URLs from various Twilight formats: plain string, variable-list objects/arrays,
   * category fallbacks, custom external links, etc.
   */
  resolveUrl(t) {
    if (!t) return "";
    if (typeof t == "string") {
      const e = t.trim();
      return e === "#" ? "" : e;
    }
    if (Array.isArray(t)) {
      for (const e of t) {
        const i = this.resolveUrl(e);
        if (i) return i;
      }
      return "";
    }
    if (typeof t == "object") {
      const e = t;
      if (e.url && typeof e.url == "string") return e.url.trim();
      if (e.link && typeof e.link == "string") return e.link.trim();
      if (e.value !== void 0 && e.value !== null) {
        const i = String(e.value).trim(), s = String(e.key || "").trim();
        if (i.startsWith("http://") || i.startsWith("https://") || i.startsWith("/"))
          return i;
        switch (s) {
          case "products":
            return `/products/${i}`;
          case "categories":
            return `/categories/${i}`;
          case "brands":
            return `/brands/${i}`;
          case "pages":
            return `/pages/${i}`;
          case "blog_articles":
            return `/blog/${i}`;
          case "blog_categories":
            return `/blog/categories/${i}`;
          case "offers_link":
            return "/offers";
          case "brands_link":
            return "/brands";
          case "blog_link":
            return "/blog";
          case "custom":
            return i;
          default:
            return i;
        }
      }
    }
    return "";
  }
  resolveImage(t) {
    if (!t) return "";
    if (typeof t == "string") return t.trim();
    if (Array.isArray(t)) {
      for (const e of t) {
        const i = this.resolveImage(e);
        if (i) return i;
      }
      return "";
    }
    if (typeof t == "object") {
      const e = t;
      for (const n of ["url", "src", "secure_url", "cdn_url", "image", "link", "value", "path"]) {
        const r = this.resolveImage(e[n]);
        if (r) return r;
      }
      const i = (document.documentElement.lang || "ar").slice(0, 2), s = this.resolveImage(e[i]);
      if (s) return s;
      for (const n of Object.values(e)) {
        const r = this.resolveImage(n);
        if (r) return r;
      }
    }
    return "";
  }
  /** Resolve a panel link: explicit button_url or button_link wins, otherwise category. */
  panelLink(t) {
    var s;
    const e = this.resolveUrl(t.button_url) || this.resolveUrl(t.button_link);
    if (e) return e;
    const i = (s = t.category) == null ? void 0 : s[0];
    return i != null && i.value ? `/categories/${i.value}` : "";
  }
  panelTitle(t) {
    var e, i;
    return this.t(t.title) || ((i = (e = t.category) == null ? void 0 : e[0]) == null ? void 0 : i.label) || "";
  }
  renderTitle(t) {
    const e = this.panelTitle(t).split(/\s+/).filter(Boolean), i = new Set(
      (this.t(t.highlighted_words) ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    );
    return o`
      <h2 class="sc-title">
        ${e.map(
      (s) => o`<span class=${g({ accent: i.has(s.toLowerCase()) })}
            >${s}</span
          >&nbsp;`
    )}
      </h2>
    `;
  }
  renderButton(t, e) {
    const i = this.t(t.button_text);
    if (!i) return c;
    const s = this.panelLink(t) || "#";
    return o`
      <div class="sc-btn ${e}">
        <a href=${s} aria-label=${i}>
          <span>${i}</span>
        </a>
      </div>
    `;
  }
  panelHighlights(t) {
    const e = [];
    for (let i = 1; i <= P; i++) {
      const s = this.t(t[`highlight_${i}_title`]), n = this.resolveImage(t[`highlight_${i}_icon`]), r = this.resolveUrl(t[`highlight_${i}_url`]) || this.resolveUrl(t[`highlight_${i}_link`]);
      (s || n) && e.push({ title: s, icon: n, link: r });
    }
    return e;
  }
  renderHighlights(t) {
    const e = this.panelHighlights(t);
    return e.length ? o`
      <div class="sc-highlights-wrapper">
        <ul class="sc-highlights" @wheel=${this.onHighlightsWheel}>
          ${b(
      e,
      (i) => `${i.title}-${i.icon}`,
      (i, s) => o`
              <li class="sc-highlight" style="--transition-delay:${0.05 + s * 0.1}s">
                ${i.link ? o`<a class="stretched-link" href=${i.link} aria-label=${i.title ?? ""}></a>` : c}
                ${i.icon ? o`<span
                      class="icon-box"
                      style=${`--sc-icon-url:url('${i.icon}')`}
                      role="img"
                      aria-label=${i.title ?? ""}
                    ></span>` : c}
                <span>${i.title}</span>
              </li>
            `
    )}
        </ul>
      </div>
    ` : c;
  }
  renderMedia(t) {
    const e = this.resolveImage(t.main_image);
    if (!e) return c;
    const s = this.isHoverActive ? this.resolveImage(t.main_image_hover) : "", n = !!s;
    return o`
      <div class="sc-media">
        <div class="media-card">
          <img
            class="base ${g({ "has-pair": n })}"
            src=${e}
            alt=${this.panelTitle(t)}
            loading="lazy"
            decoding="async"
          />
          ${n ? o`<img
                class="hovered"
                src=${s}
                alt=${this.panelTitle(t)}
                loading="lazy"
                decoding="async"
              />` : c}
        </div>
      </div>
    `;
  }
  renderPanel(t, e) {
    const i = this.isHoverActive, s = this.resolveImage(t.bg_image), n = i ? this.resolveImage(t.bg_image_hover) : "", r = this.t(t.bg_color) || "#1F2937";
    return o`
      <div
        class="sc-panel ${g({ "has-bg": !!s, "is-active": e })}"
        style="${this.panelStyle()} background-color: ${r};"
      >
        ${s ? o`<figure class="sc-bg">
              <img src=${s} alt="" loading="lazy" decoding="async" />
            </figure>` : c}
        ${n ? o`<figure class="sc-bg-hover">
              <img src=${n} alt="" loading="lazy" decoding="async" />
            </figure>` : c}
        ${s || n ? o`<div class="sc-overlay"></div>` : c}

        <div class="sc-content">
          ${this.t(t.subheading) ? o`<div class="sc-subheading">${this.t(t.subheading)}</div>` : c}
          ${this.panelTitle(t) ? this.renderTitle(t) : c}
          ${this.renderButton(t, "sc-btn-mobile")}
        </div>

        ${this.renderMedia(t)} ${this.renderHighlights(t)}
        ${this.renderButton(t, "sc-btn-desktop")}
      </div>
    `;
  }
  render() {
    const t = this.panels;
    if (!t.length) return c;
    const e = this.settings, i = f(e.show_arrows, !0) && t.length > this.perView, s = f(e.show_dots, !0) && t.length > this.perView, n = Math.max(0, t.length - this.perView);
    return o`
      <div
        class="sc-section ${g({ "sc-no-hover": !this.isHoverActive })}"
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
            @dragstart=${(r) => r.preventDefault()}
          >
            ${b(
      t,
      (r) => this.panelTitle(r) + this.t(r.main_image),
      (r, a) => this.renderPanel(r, a >= this.index && a < this.index + this.perView)
    )}
          </div>

          ${i ? o`
                <div class="sc-controls ${g({ "is-rtl": this.isRTL })}">
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
                    ?disabled=${this.index >= n}
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
              ` : c}

          ${s ? o`
                <div class="sc-dots">
                  ${b(
      Array.from({ length: n + 1 }, (r, a) => a),
      (r) => r,
      (r) => o`
                      <button
                        type="button"
                        class="sc-dot ${g({ "is-active": r === this.index })}"
                        aria-label="الانتقال إلى اللوحة ${r + 1}"
                        @click=${() => {
        this.index = r;
      }}
                      ></button>
                    `
    )}
                </div>
              ` : c}
        </div>
      </div>
    `;
  }
};
x.styles = S`
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
let h = x;
m([
  z({ type: Object })
], h.prototype, "config");
m([
  v()
], h.prototype, "index");
m([
  v()
], h.prototype, "perView");
m([
  v()
], h.prototype, "dragOffset");
typeof h < "u" && h.registerSallaComponent("salla-special-categories");
export {
  h as default
};
