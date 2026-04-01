/**
 * Channel configuration — defines branding and settings for a YouTube channel.
 */
export interface ChannelConfig {
  name: string;
  handle: string;
  niche: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  defaultTags: string[];
  descriptionTemplate: string;
}

/**
 * Video data input — fed into a Remotion composition to render a video.
 */
export interface VideoData {
  id: string;
  channel: string;
  composition: string;
  title: string;
  description: string;
  tags: string[];
  props: Record<string, unknown>;
}

/**
 * Country comparison item — used by the CountryComparison composition.
 */
export interface CountryItem {
  country: string;
  value: string;
  flag: string;
  image?: string;
}
