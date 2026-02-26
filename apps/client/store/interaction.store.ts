import { create } from "zustand";
import { InteractionMap } from "@/types/veil";

interface InteractionState {
  interactions: InteractionMap;

  initializeInteraction: (
    postId: string,
    data: {
      reaction: "AGREE" | "DISAGREE" | null;
      hasVoted: boolean;
      votedOptionId?: string | null;
    },
  ) => void;
  hydrate: (newMap: InteractionMap) => void;
  setReaction: (postId: string, reaction: "AGREE" | "DISAGREE" | null) => void;
  setVoted: (postId: string, votedOptionId: string | null) => void;
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
          ...(state.interactions[postId] || { hasVoted: false, votedOptionId: null  }),
          reaction,
        },
      },
    })),

  initializeInteraction: (postId, data) =>
    set((state) => ({
      interactions: {
        ...state.interactions,
        [postId]: { ...state.interactions[postId], ...data },
      },
    })),

  setVoted: (postId, votedOptionId) =>
    set((state) => ({
      interactions: {
        ...state.interactions,
        [postId]: {
          ...(state.interactions[postId] || { reaction: null, hasVoted: false, votedOptionId: null }),
          hasVoted: true,
          votedOptionId,
        },
      },
    })),
}));
