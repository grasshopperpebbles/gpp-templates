import { StoryblokStory } from '@storyblok/react/rsc';
import { getStory } from '@/lib/storyblok-client';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string[] };
}

export default async function DynamicPage({ params }: Props) {
  const slug = params.slug ? params.slug.join('/') : 'home';

  try {
    const story = await getStory(slug);

    return (
      <div className="container mx-auto py-8 px-4">
        <StoryblokStory story={story} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}

