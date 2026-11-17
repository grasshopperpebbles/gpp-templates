import {
  graphqlClient,
  GET_RECENT_POSTS,
  GET_POST_CATEGORIES,
  type Post,
  type PostCategory,
} from '@/lib/graphql'
import { SITE_CONFIG } from '@/lib/config'
import { CMSOnlyHomepage } from '@/components/homepage'

export const revalidate = 60 // ISR: revalidate every 60 seconds

type HomepageData = {
  recentPosts: Post[]
  postCategories: PostCategory[]
}

async function fetchHomepageData(): Promise<HomepageData> {
  const [postsData, postCategoriesData] = await Promise.all([
    graphqlClient
      .query<{ posts: { nodes: Post[] } }>(
        GET_RECENT_POSTS,
        { first: 10 },
        { next: { revalidate: 60, tags: ['posts'] } }
      )
      .catch(() => ({ posts: { nodes: [] } })),
    graphqlClient
      .query<{ categories: { nodes: PostCategory[] } }>(
        GET_POST_CATEGORIES,
        {},
        { next: { revalidate: 300, tags: ['post-categories'] } }
      )
      .catch(() => ({ categories: { nodes: [] } })),
  ])

  return {
    recentPosts: postsData.posts.nodes,
    postCategories: postCategoriesData.categories.nodes,
  }
}

export default async function HomePage() {
  const data = await fetchHomepageData()

  const siteName = SITE_CONFIG.name
  const siteTagline = SITE_CONFIG.description

  return (
    <CMSOnlyHomepage
      siteName={siteName}
      siteTagline={siteTagline}
      recentPosts={data.recentPosts}
      postCategories={data.postCategories}
    />
  )
}
