/**
 * Tokens de color y diseño — fuente de verdad alineada con `globals.css`.
 * Claves en camelCase; se mapean a variables CSS `--kebab-case`.
 */

export type ThemeMode = "light" | "dark";

/** Variables de color del tema (equivalente a :root / .dark en globals.css). */
export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

export type ThemeTypography = {
  fontSans: string;
  fontSerif: string;
  fontMono: string;
};

export type ThemeShadowTokens = {
  shadowX: string;
  shadowY: string;
  shadowBlur: string;
  shadowSpread: string;
  shadowOpacity: string;
  shadowColor: string;
  shadow2xs: string;
  shadowXs: string;
  shadowSm: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadow2xl: string;
};

export type ThemeLayout = {
  radius: string;
  trackingNormal: string;
  spacing: string;
};

export type ThemeDefinition = {
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  shadows: ThemeShadowTokens;
};

// ============================================
// TEMA CLARO (:root)
// ============================================
export const LIGHT_THEME: ThemeDefinition = {
  colors: {
    background: "#ffffff",
    foreground: "#0e251f",
    card: "#fafafa",
    cardForeground: "#15372f",
    popover: "#ffffff",
    popoverForeground: "#0e251f",
    primary: "#1b7440",
    primaryForeground: "#ffffff",
    secondary: "#7ba63f",
    secondaryForeground: "#ffffff",
    muted: "#eef5f6",
    mutedForeground: "#577075",
    accent: "#ee862b",
    accentForeground: "#ffffff",
    destructive: "#ef4343",
    destructiveForeground: "#fafafa",
    border: "#e0ebe8",
    input: "#e0ebe8",
    ring: "#169c7b",
    chart1: "#169c7b",
    chart2: "#7eaa41",
    chart3: "#1b8ba1",
    chart4: "#f08628",
    chart5: "#1b7440",
    sidebar: "#fafafa",
    sidebarForeground: "#15372f",
    sidebarPrimary: "#169c7b",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e7f1da",
    sidebarAccentForeground: "#169c7b",
    sidebarBorder: "#e7efed",
    sidebarRing: "#169c7b",
  },
  typography: {
    fontSans: "Inter, system-ui, sans-serif",
    fontSerif: "Georgia, serif",
    fontMono: "JetBrains Mono, monospace",
  },
  layout: {
    radius: "0.5rem",
    trackingNormal: "0em",
    spacing: "0.25rem",
  },
  shadows: {
    shadowX: "0px",
    shadowY: "4px",
    shadowBlur: "10px",
    shadowSpread: "0px",
    shadowOpacity: "0.1",
    shadowColor: "hsl(0, 0%, 0%)",
    shadow2xs: "0px 4px 10px 0px hsl(0 0% 0% / 0.05)",
    shadowXs: "0px 4px 10px 0px hsl(0 0% 0% / 0.05)",
    shadowSm:
      "0px 4px 10px 0px hsl(0 0% 0% / 0.10), 0px 1px 2px -1px hsl(0 0% 0% / 0.10)",
    shadow:
      "0px 4px 10px 0px hsl(0 0% 0% / 0.10), 0px 1px 2px -1px hsl(0 0% 0% / 0.10)",
    shadowMd:
      "0px 4px 10px 0px hsl(0 0% 0% / 0.10), 0px 2px 4px -1px hsl(0 0% 0% / 0.10)",
    shadowLg:
      "0px 4px 10px 0px hsl(0 0% 0% / 0.10), 0px 4px 6px -1px hsl(0 0% 0% / 0.10)",
    shadowXl:
      "0px 4px 10px 0px hsl(0 0% 0% / 0.10), 0px 8px 10px -1px hsl(0 0% 0% / 0.10)",
    shadow2xl: "0px 4px 10px 0px hsl(0 0% 0% / 0.25)",
  },
};

// ============================================
// TEMA OSCURO (.dark)
// ============================================
export const DARK_THEME: ThemeDefinition = {
  colors: {
    background: "#060f0c",
    foreground: "#ffffff",
    card: "#0a1a16",
    cardForeground: "#fafafa",
    popover: "#071210",
    popoverForeground: "#fafafa",
    primary: "#1dc99e",
    primaryForeground: "#ffffff",
    secondary: "#6e9438",
    secondaryForeground: "#ffffff",
    muted: "#1b322c",
    mutedForeground: "#b3b3b3",
    accent: "#ec7813",
    accentForeground: "#ffffff",
    destructive: "#7c1d1d",
    destructiveForeground: "#fafafa",
    border: "#1d302b",
    input: "#1d302b",
    ring: "#1dc99e",
    chart1: "#1dc99e",
    chart2: "#95c059",
    chart3: "#21a9c4",
    chart4: "#f29340",
    chart5: "#229150",
    sidebar: "#081613",
    sidebarForeground: "#f2f2f2",
    sidebarPrimary: "#1dc99e",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#152823",
    sidebarAccentForeground: "#1dc99e",
    sidebarBorder: "#1d302b",
    sidebarRing: "#1dc99e",
  },
  typography: LIGHT_THEME.typography,
  layout: LIGHT_THEME.layout,
  shadows: {
    shadowX: "0px",
    shadowY: "8px",
    shadowBlur: "15px",
    shadowSpread: "2px",
    shadowOpacity: "0.5",
    shadowColor: "hsl(0, 0%, 0%)",
    shadow2xs: "0px 8px 15px 2px hsl(0 0% 0% / 0.25)",
    shadowXs: "0px 8px 15px 2px hsl(0 0% 0% / 0.25)",
    shadowSm:
      "0px 8px 15px 2px hsl(0 0% 0% / 0.50), 0px 1px 2px 1px hsl(0 0% 0% / 0.50)",
    shadow:
      "0px 8px 15px 2px hsl(0 0% 0% / 0.50), 0px 1px 2px 1px hsl(0 0% 0% / 0.50)",
    shadowMd:
      "0px 8px 15px 2px hsl(0 0% 0% / 0.50), 0px 2px 4px 1px hsl(0 0% 0% / 0.50)",
    shadowLg:
      "0px 8px 15px 2px hsl(0 0% 0% / 0.50), 0px 4px 6px 1px hsl(0 0% 0% / 0.50)",
    shadowXl:
      "0px 8px 15px 2px hsl(0 0% 0% / 0.50), 0px 8px 10px 1px hsl(0 0% 0% / 0.50)",
    shadow2xl: "0px 8px 15px 2px hsl(0 0% 0% / 1.25)",
  },
};

export const THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
} as const satisfies Record<ThemeMode, ThemeDefinition>;

// ============================================
// COLORES DE MARCA (constantes semánticas — tema claro)
// ============================================
export const BRAND_COLORS = {
  primary: LIGHT_THEME.colors.primary,
  secondary: LIGHT_THEME.colors.secondary,
  accent: LIGHT_THEME.colors.accent,
  ring: LIGHT_THEME.colors.ring,
  teal: LIGHT_THEME.colors.chart1,
  destructive: LIGHT_THEME.colors.destructive,
  foreground: LIGHT_THEME.colors.foreground,
  background: LIGHT_THEME.colors.background,
} as const;

export const PALETTE = BRAND_COLORS;

export type BrandColor = keyof typeof BRAND_COLORS;

// ============================================
// ESTADOS / FEEDBACK (por tema)
// ============================================
export const STATUS_COLORS = {
  light: {
    destructive: LIGHT_THEME.colors.destructive,
    destructiveForeground: LIGHT_THEME.colors.destructiveForeground,
    success: LIGHT_THEME.colors.primary,
    successForeground: LIGHT_THEME.colors.primaryForeground,
    warning: LIGHT_THEME.colors.accent,
    warningForeground: LIGHT_THEME.colors.accentForeground,
    info: LIGHT_THEME.colors.ring,
    infoForeground: LIGHT_THEME.colors.primaryForeground,
  },
  dark: {
    destructive: DARK_THEME.colors.destructive,
    destructiveForeground: DARK_THEME.colors.destructiveForeground,
    success: DARK_THEME.colors.primary,
    successForeground: DARK_THEME.colors.primaryForeground,
    warning: DARK_THEME.colors.accent,
    warningForeground: DARK_THEME.colors.accentForeground,
    info: DARK_THEME.colors.ring,
    infoForeground: DARK_THEME.colors.primaryForeground,
  },
} as const;

export type StatusColor = keyof (typeof STATUS_COLORS)["light"];

// ============================================
// MAPEO camelCase → --css-variable
// ============================================
const COLOR_CSS_KEYS: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

const TYPOGRAPHY_CSS_KEYS: Record<keyof ThemeTypography, string> = {
  fontSans: "--font-sans",
  fontSerif: "--font-serif",
  fontMono: "--font-mono",
};

const LAYOUT_CSS_KEYS: Record<keyof ThemeLayout, string> = {
  radius: "--radius",
  trackingNormal: "--tracking-normal",
  spacing: "--spacing",
};

const SHADOW_CSS_KEYS: Record<keyof ThemeShadowTokens, string> = {
  shadowX: "--shadow-x",
  shadowY: "--shadow-y",
  shadowBlur: "--shadow-blur",
  shadowSpread: "--shadow-spread",
  shadowOpacity: "--shadow-opacity",
  shadowColor: "--shadow-color",
  shadow2xs: "--shadow-2xs",
  shadowXs: "--shadow-xs",
  shadowSm: "--shadow-sm",
  shadow: "--shadow",
  shadowMd: "--shadow-md",
  shadowLg: "--shadow-lg",
  shadowXl: "--shadow-xl",
  shadow2xl: "--shadow-2xl",
};

function mapTokensToCssVars<T extends Record<string, string>>(
  tokens: T,
  keyMap: Record<keyof T, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(tokens) as (keyof T)[]) {
    out[keyMap[key]] = tokens[key];
  }
  return out;
}

/** Mapa `--variable: valor` listo para aplicar en :root o .dark. */
export function toCssCustomProperties(theme: ThemeDefinition): Record<string, string> {
  return {
    ...mapTokensToCssVars(theme.colors, COLOR_CSS_KEYS),
    ...mapTokensToCssVars(theme.typography, TYPOGRAPHY_CSS_KEYS),
    ...mapTokensToCssVars(theme.layout, LAYOUT_CSS_KEYS),
    ...mapTokensToCssVars(theme.shadows, SHADOW_CSS_KEYS),
  };
}

export function getTheme(mode: ThemeMode = "light"): ThemeDefinition {
  return THEMES[mode];
}

export function getThemeColors(mode: ThemeMode = "light"): ThemeColors {
  return THEMES[mode].colors;
}

export function getStatusColors(mode: ThemeMode = "light") {
  return STATUS_COLORS[mode];
}

// ============================================
// API unificada + helpers (compatibilidad)
// ============================================
export const THEME = {
  ...BRAND_COLORS,
  getTheme,
  getThemeColors,
  getThemeVariables: getThemeColors,
  getBrandColor: (color: BrandColor) => BRAND_COLORS[color],
  getStatusColor: (status: StatusColor, mode: ThemeMode = "light") =>
    STATUS_COLORS[mode][status],
  getColors: (mode: ThemeMode = "light") => ({
    ...BRAND_COLORS,
    ...getThemeColors(mode),
    ...getStatusColors(mode),
  }),
  toCssCustomProperties: (mode: ThemeMode = "light") =>
    toCssCustomProperties(getTheme(mode)),
} as const;

export const getBackgroundColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).background;
export const getForegroundColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).foreground;
export const getBorderColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).border;
export const getInputColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).input;
export const getRingColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).ring;
export const getCardColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).card;
export const getCardFgColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).cardForeground;
export const getTextPrimaryColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).foreground;
export const getTextSecondaryColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).mutedForeground;
export const getTextMutedColor = (mode: ThemeMode = "light") =>
  getThemeColors(mode).mutedForeground;
