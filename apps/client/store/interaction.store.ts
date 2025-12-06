import { create } from "zustand";
import { InteractionMap } from "@/types/veil";

interface InteractionState {
  interactions: InteractionMap;

  hydrate: (newMap: InteractionMap) => void;
  setReaction: (postId: string, reaction: "AGREE" | "DISAGREE" | null) => void;
  setVoted: (postId: string) => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  interactions: {},

  hydrate: (newMap) =>
    set((state) => ({
      interactions: { ...state.interactions, ...newMap },
    })),

  setReaction: (postId, reaction) =>
    set((state) => ({
      interactions: {
        ...state.interactions,
        [postId]: {
          ...(state.interactions[postId] || { hasVoted: false }),
          reaction,
        },
      },
    })),

  setVoted: (postId) =>
    set((state) => ({
      interactions: {
        ...state.interactions,
        [postId]: {
          ...(state.interactions[postId] || { reaction: null }),
          hasVoted: true,
        },
      },
    })),
}));
