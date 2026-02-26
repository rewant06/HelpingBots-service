"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { veilApi } from "@/lib/veil-client";
import { Post } from "@/types/veil";
import { logger } from "@/lib/logger";
import { useInteractionStore } from "@/store/interaction.store";

export function useVeilFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Scroll load
  const [isFatalError, setIsFatalError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateInteractions = useInteractionStore((state) => state.hydrate);

  // Prevent duplicate fetches in React Strict Mode
  const initialized = useRef(false);
  const fetchFeed = useCallback(
    async (reset = false) => {
      if (isFatalError) return;

      try {
        const currentCursor = reset ? undefined : cursor;
        if (!reset && !currentCursor && posts.length > 0) return; // Safety check

        if (reset) setIsLoading(true);
        else setIsFetchingMore(true);

        setError(null);

        const response = await veilApi.getGlobalFeed(
          currentCursor || undefined,
        );
        const newPosts = response.data;
        const postIds = newPosts.map((p) => p.id);

        setPosts((prev) => {
          if (reset) return newPosts;
          const uniqueNew = newPosts.filter(
            (newP) => !prev.find((p) => p.id === newP.id),
          );
          return [...prev, ...uniqueNew];
        });

        setCursor(response.meta.nextCursor);
        setHasMore(response.meta.hasMore);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setIsFatalError(true); // Kill switch
        }
        const msg = err instanceof Error ? err.message : "Failed to load feed";
        logger.error("Feed fetch failed", err);
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [cursor, posts.length, isFatalError, hydrateInteractions],
  );

  // Initial Load
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchFeed(true);
    }
  }, [fetchFeed]);

  // Optimistic UI Updates
  const addPostLocally = (newPost: Post) => {
    const postWithAuth = { ...newPost, isAuthor: true };
    setPosts((prev) => [postWithAuth, ...prev]);
  };

  const removePost = (postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId));
  };

  return {
    posts,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    loadMore: () => fetchFeed(false),
    refresh: () => fetchFeed(true),
    addPostLocally,
    removePost,
  };
}
