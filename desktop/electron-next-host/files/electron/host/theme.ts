/** Startup page and window colours, from host.config.json's optional "theme" block. */
export interface HostTheme {
  /** Window background and the startup page's page colour */
  background: string;
  /** The startup page's card */
  panel: string;
  text: string;
  muted: string;
  /** Retry / Continue button fill */
  accent: string;
  /** Text on the accent fill */
  accentText: string;
  error: string;
}

export const THEME_KEYS = ['background', 'panel', 'text', 'muted', 'accent', 'accentText', 'error'] as const;

/** Used for every key the config leaves out. Match them to the hosted web app's own palette. */
export const DEFAULT_THEME: HostTheme = {
  background: '#171b21',
  panel: '#1e242c',
  text: '#ece6d8',
  muted: '#9aa1a8',
  accent: '#0f52ba',
  accentText: '#ffffff',
  error: '#f5777b',
};
