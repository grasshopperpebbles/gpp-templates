'use client'

/**
 * React hooks for blog posts
 *
 * Provides usePosts and usePost hooks for client-side data fetching
 * with loading states and error handling.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getPosts,
  getPostBySlug,
  getRecentPosts,
  getPostsByCategory,
  getPostsByTag,
  searchPosts,
  getCategories,
  getTags,
  type GetPostsOptions,
} from '@/lib/posts'
import type {
  Post,
  PostCategory,
  PostTag,
} from '@/lib/graphql'

// ============================================================================
// TYPES
// ============================================================================

interface UsePostsState {
  posts: Post[]
  loading: boolean
  error: Error | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  endCursor?: string
  startCursor?: string
}

interface UsePostState {
  post: Post | null
  loading: boolean
  error: Error | null
}

interface UseCategoriesState {
  categories: PostCategory[]
  loading: boolean
  error: Error | null
}

interface UseTagsState {
  tags: PostTag[]
  loading: boolean
  error: Error | null
}

interface UseSearchPostsState {
  results: Post[]
  loading: boolean
  error: Error | null
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for fetching a list of posts with pagination
 */
export function usePosts(options: GetPostsOptions = {}) {
  const { first = 10, category, tag } = options

  const [state, setState] = useState<UsePostsState>({
    posts: [],
    loading: true,
    error: null,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const fetchPosts = useCallback(async (opts: GetPostsOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await getPosts({ first, category, tag, ...opts })
      setState({
        posts: response.posts.nodes,
        loading: false,
        error: null,
        hasNextPage: response.posts.pageInfo.hasNextPage,
        hasPreviousPage: response.posts.pageInfo.hasPreviousPage,
        endCursor: response.posts.pageInfo.endCursor,
        startCursor: response.posts.pageInfo.startCursor,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch posts'),
      }))
    }
  }, [first, category, tag])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (state.hasNextPage && state.endCursor) {
      fetchPosts({ after: state.endCursor })
    }
  }, [state.hasNextPage, state.endCursor, fetchPosts])

  const refresh = useCallback(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    ...state,
    loadMore,
    refresh,
  }
}

/**
 * Hook for fetching a single post by slug
 */
export function usePost(slug: string) {
  const [state, setState] = useState<UsePostState>({
    post: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!slug) {
      setState({ post: null, loading: false, error: null })
      return
    }

    const fetchPost = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const post = await getPostBySlug(slug)
        setState({
          post,
          loading: false,
          error: post ? null : new Error('Post not found'),
        })
      } catch (error) {
        setState({
          post: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch post'),
        })
      }
    }

    fetchPost()
  }, [slug])

  return state
}

/**
 * Hook for fetching recent posts
 */
export function useRecentPosts(count: number = 5) {
  const [state, setState] = useState<{ posts: Post[]; loading: boolean; error: Error | null }>({
    posts: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchRecentPosts = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const posts = await getRecentPosts(count)
        setState({ posts, loading: false, error: null })
      } catch (error) {
        setState({
          posts: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch recent posts'),
        })
      }
    }

    fetchRecentPosts()
  }, [count])

  return state
}

/**
 * Hook for fetching posts by category
 */
export function usePostsByCategory(categorySlug: string, options: { first?: number } = {}) {
  const [state, setState] = useState<UsePostsState>({
    posts: [],
    loading: true,
    error: null,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const fetchPosts = useCallback(async (after?: string) => {
    if (!categorySlug) {
      setState({ posts: [], loading: false, error: null, hasNextPage: false, hasPreviousPage: false })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await getPostsByCategory(categorySlug, { first: options.first, after })
      setState({
        posts: response.posts.nodes,
        loading: false,
        error: null,
        hasNextPage: response.posts.pageInfo.hasNextPage,
        hasPreviousPage: response.posts.pageInfo.hasPreviousPage,
        endCursor: response.posts.pageInfo.endCursor,
        startCursor: response.posts.pageInfo.startCursor,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch posts'),
      }))
    }
  }, [categorySlug, options.first])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (state.hasNextPage && state.endCursor) {
      fetchPosts(state.endCursor)
    }
  }, [state.hasNextPage, state.endCursor, fetchPosts])

  return { ...state, loadMore }
}

/**
 * Hook for fetching posts by tag
 */
export function usePostsByTag(tagSlug: string, options: { first?: number } = {}) {
  const [state, setState] = useState<UsePostsState>({
    posts: [],
    loading: true,
    error: null,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const fetchPosts = useCallback(async (after?: string) => {
    if (!tagSlug) {
      setState({ posts: [], loading: false, error: null, hasNextPage: false, hasPreviousPage: false })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await getPostsByTag(tagSlug, { first: options.first, after })
      setState({
        posts: response.posts.nodes,
        loading: false,
        error: null,
        hasNextPage: response.posts.pageInfo.hasNextPage,
        hasPreviousPage: response.posts.pageInfo.hasPreviousPage,
        endCursor: response.posts.pageInfo.endCursor,
        startCursor: response.posts.pageInfo.startCursor,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch posts'),
      }))
    }
  }, [tagSlug, options.first])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (state.hasNextPage && state.endCursor) {
      fetchPosts(state.endCursor)
    }
  }, [state.hasNextPage, state.endCursor, fetchPosts])

  return { ...state, loadMore }
}

/**
 * Hook for searching posts
 */
export function useSearchPosts(query: string, limit: number = 10) {
  const [state, setState] = useState<UseSearchPostsState>({
    results: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!query || query.length < 2) {
      setState({ results: [], loading: false, error: null })
      return
    }

    const searchTimeout = setTimeout(async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const results = await searchPosts(query, limit)
        setState({ results, loading: false, error: null })
      } catch (error) {
        setState({
          results: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Search failed'),
        })
      }
    }, 300) // Debounce search

    return () => clearTimeout(searchTimeout)
  }, [query, limit])

  return state
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchCategories = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const categories = await getCategories()
        setState({ categories, loading: false, error: null })
      } catch (error) {
        setState({
          categories: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch categories'),
        })
      }
    }

    fetchCategories()
  }, [])

  return state
}

/**
 * Hook for fetching tags
 */
export function useTags() {
  const [state, setState] = useState<UseTagsState>({
    tags: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchTags = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const tags = await getTags()
        setState({ tags, loading: false, error: null })
      } catch (error) {
        setState({
          tags: [],
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch tags'),
        })
      }
    }

    fetchTags()
  }, [])

  return state
}
