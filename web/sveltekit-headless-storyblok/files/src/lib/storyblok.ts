import { storyblokInit, apiPlugin } from '@storyblok/svelte';
import { components } from './components';
import { PUBLIC_STORYBLOK_ACCESS_TOKEN, PUBLIC_STORYBLOK_VERSION } from '$env/static/public';

const accessToken = PUBLIC_STORYBLOK_ACCESS_TOKEN || '';
const version = PUBLIC_STORYBLOK_VERSION || 'published';

storyblokInit({
  accessToken,
  use: [apiPlugin],
  apiOptions: {
    version,
  },
  components,
});

export { storyblokInit };

