import { storyblokInit, apiPlugin } from '@storyblok/react/rsc';
import { components } from './components';

const accessToken = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || '';
const version = process.env.NEXT_PUBLIC_STORYBLOK_VERSION || 'published';

storyblokInit({
  accessToken,
  use: [apiPlugin],
  apiOptions: {
    version,
  },
  components,
});

export { storyblokInit };

