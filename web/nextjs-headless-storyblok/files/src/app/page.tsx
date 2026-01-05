import { StoryblokStory } from '@storyblok/react/rsc';
import { getStory } from '@/lib/storyblok-client';

export default async function HomePage() {
  const story = await getStory('home');

  return (
    <div className="container mx-auto py-8 px-4">
      <StoryblokStory story={story} />
    </div>
  );
}

