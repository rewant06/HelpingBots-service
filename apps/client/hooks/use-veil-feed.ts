"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { veilApi } from "@/lib/veil-client";
import { Post } from "@/types/veil";
import { logger } from "@/lib/logger";

export function useVeilFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Scroll load
  const [isFatalError, setIsFatalError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          currentCursor || undefined
        );

        setPosts((prev) => {
          // If reset, replace. If append, filter duplicates (safety) to avoid key collisions
          if (reset) return response.data;
          const newPosts = response.data.filter(
            (newP) => !prev.find((p) => p.id === newP.id)
          );
          return [...prev, ...newPosts];
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
    [cursor, posts.length, isFatalError]
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
    setPosts((prev) => [newPost, ...prev]);
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
  };
}
