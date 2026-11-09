/** Selected item coming from a Twilight `items` dropdown (source: categories...). */
export interface SelectedItem {
  label: string;
  value: string | number;
  key?: string;
  url?: string;
}

/**
 * Text-ish setting. The form builder delivers localized fields as `{ ar, en }`
 * objects once saved, while defaults in twilight-bundle.json are plain strings.
 */
export type LocalizedValue = string | Partial<Record<string, string>>;

/** A single feature highlight badge shown on a panel (normalized from flat fields). */
export interface HighlightConfig {
  title?: string;
  icon?: string;
  link?: string;
}

/** Max fixed highlight slots per panel (form-builder does not support nested collections). */
export const MAX_HIGHLIGHTS = 5;

/** A single collection panel (slide). */
export interface PanelConfig {
  category?: SelectedItem[];
  title?: LocalizedValue;
  highlighted_words?: LocalizedValue;
  subheading?: LocalizedValue;
  button_text?: LocalizedValue;
  button_url?: unknown;
  button_link?: LocalizedValue;
  bg_color?: LocalizedValue;
  bg_image?: LocalizedValue;
  bg_image_hover?: LocalizedValue;
  main_image?: LocalizedValue;
  main_image_hover?: LocalizedValue;
  highlight_1_title?: LocalizedValue;
  highlight_1_icon?: LocalizedValue;
  highlight_1_url?: unknown;
  highlight_1_link?: LocalizedValue;
  highlight_2_title?: LocalizedValue;
  highlight_2_icon?: LocalizedValue;
  highlight_2_url?: unknown;
  highlight_2_link?: LocalizedValue;
  highlight_3_title?: LocalizedValue;
  highlight_3_icon?: LocalizedValue;
  highlight_3_url?: unknown;
  highlight_3_link?: LocalizedValue;
  highlight_4_title?: LocalizedValue;
  highlight_4_icon?: LocalizedValue;
  highlight_4_url?: unknown;
  highlight_4_link?: LocalizedValue;
  highlight_5_title?: LocalizedValue;
  highlight_5_icon?: LocalizedValue;
  highlight_5_url?: unknown;
  highlight_5_link?: LocalizedValue;
  [key: string]: unknown;
}

/** Full component configuration (the `config` JSON set from the theme builder). */
export interface SpecialCategoriesConfig {
  panels?: PanelConfig[];
  slides_per_view?: number;
  gap?: number;
  show_arrows?: boolean;
  show_dots?: boolean;
  disable_hover?: boolean;
  enable_hover?: boolean;
  enable_custom_height?: boolean;
  panel_min_height?: number | string;
  panel_min_height_mobile?: number | string;
  image_cover?: boolean;
  title_size?: number;
  section_bg_color?: string;
  section_padding_top?: number;
  section_padding_bottom?: number;
  text_color?: string;
  highlight_color?: string;
  button_bg?: string;
  button_text_color?: string;
  badge_bg?: string;
  badge_text_color?: string;
  badge_icon_color?: string;
  overlay_opacity?: number;
}
