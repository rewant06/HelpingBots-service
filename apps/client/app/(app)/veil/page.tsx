"use client";

import { useEffect, useRef } from "react";
import { useVeilFeed } from "@/hooks/use-veil-feed";
import { PostCard } from "@/components/veil/PostCard";
import { CreatePostDialog } from "@/components/veil/CreatePostDialog";
import { Loader2, ShieldAlert, Radio } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VeilFeedPage() {
  const { posts, isLoading, hasMore, loadMore, addPostLocally, error } =
    useVeilFeed();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const observerTarget = useRef(null);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      {/* Header */}
      <div className="container mx-auto px-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
            Global Live Feed
          </h1>
          <p className="text-muted-foreground">
            Real-time anonymous pulse from around the world.
          </p>
        </div>

        {/* Create Action */}
        <div>
          {isAuthenticated ? (
            <CreatePostDialog onPostCreated={addPostLocally} />
          ) : (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary/50 text-primary hover:bg-primary/10"
            >
              <Link href="/login">Login to Post</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="container mx-auto px-4 mb-8">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        {/* Empty State */}
        {!isLoading && posts.length === 0 && !error && (
          <div className="text-center py-20 glass-effect rounded-3xl border border-dashed border-border">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">Silence in the void</h3>
            <p className="text-muted-foreground">
              Be the first to speak the truth.
            </p>
          </div>
        )}

        {/* Posts List */}
        {posts.map((post) => (
          <div key={post.id} className="animate-fade-in">
            <PostCard post={post} />
          </div>
        ))}

        {/* Loading Spinner */}
        <div
          ref={observerTarget}
          className="h-24 flex items-center justify-center"
        >
          {isLoading && (
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          )}
          {!hasMore && posts.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>End of feed</span>
              <span className="w-1 h-1 rounded-full bg-border" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
