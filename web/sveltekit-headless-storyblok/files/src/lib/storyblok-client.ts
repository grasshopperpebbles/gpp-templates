import { StoryblokClient } from '@storyblok/js';
import { PUBLIC_STORYBLOK_ACCESS_TOKEN, PUBLIC_STORYBLOK_VERSION } from '$env/static/public';

const accessToken = PUBLIC_STORYBLOK_ACCESS_TOKEN || '';
const version = PUBLIC_STORYBLOK_VERSION || 'published';

export const storyblokClient = new StoryblokClient({
  accessToken,
  cache: {
    clear: 'auto',
    type: 'memory',
  },
  version,
});

// Helper function to fetch stories
export async function getStory(slug: string, version: string = version) {
  const { data } = await storyblokClient.get(`cdn/stories/${slug}`, {
    version,
    resolve_relations: 'article.author',
  });
  return data.story;
}

export async function getStories(startsWith: string = '', version: string = version) {
  const { data } = await storyblokClient.get('cdn/stories', {
    version,
    starts_with: startsWith,
    resolve_relations: 'article.author',
  });
  return data.stories;
}

