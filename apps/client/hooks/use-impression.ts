"use client";

import { useEffect, useRef, useState } from "react";
import { veilApi } from "@/lib/veil-client";

export function useImpression(
  postId: string,
  onView?: () => void,
  threshold = 0.5
) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    if (hasViewed || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          veilApi.trackView(postId);
          if (onView) onView?.();
          setHasViewed(true); // Prevent duplicate counts
          observer.disconnect();
        }
      },
      { threshold } // Trigger when 50% of card is visible
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [postId, hasViewed, threshold]);

  return ref;
}
