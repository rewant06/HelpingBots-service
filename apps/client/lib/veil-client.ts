import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { FeedResponse, Post, InteractionMap } from "@/types/veil"; // Ensure Post type includes comments count

const BASE_URL =
  process.env.NEXT_PUBLIC_VEIL_API_URL || "http://localhost:5001/v1/posts";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VEIL_API_KEY || "";

const veilClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": PUBLIC_KEY,
  },
});

veilClient.interceptors.request.use((config) => {
  const user = useAuthStore.getState().user;
  if (user?.id) {
    config.headers["x-user-id"] = user.id;
  }
  return config;
});

export const veilApi = {
  // --- READ ---
  getGlobalFeed: async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    params.append("limit", "20");
    const { data } = await veilClient.get<FeedResponse>(
      `/global?${params.toString()}`
    );
    return data;
  },

  getTenantFeed: async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    params.append("limit", "20");
    const { data } = await veilClient.get<FeedResponse>(
      `/?${params.toString()}`
    );
    return data;
  },

  getPostById: async (id: string) => {
    const { data } = await veilClient.get<Post>(`/${id}`);
    return data;
  },

  getMyProfile: async () => {
    try {
      const { data } = await veilClient.get<{
        pseudonym: string;
        avatarUrl: string;
      }>("/me/profile");
      return data;
    } catch (e) {
      return null;
    }
  },

  getComments: async (postId: string, cursor?: string) => {
    // Simple pagination for comments
    const params = new URLSearchParams();
    if (cursor) params.append("page", cursor); // Backend currently uses page/limit for comments
    const { data } = await veilClient.get<any[]>(
      `/${postId}/comments?${params.toString()}`
    );
    return data;
  },

  // --- WRITE ---
  createPost: async (
    content: string,
    isAnonymous: boolean,
    pollOptions?: string[],
    authorDisplayName?: string
  ) => {
    const payload = {
      content,
      isAnonymous,
      isGlobal: true,
      pollOptions: pollOptions?.length ? pollOptions : undefined,
      authorDisplayName,
    };
    const { data } = await veilClient.post("", payload);
    return data;
  },

  updatePost: async (postId: string, content: string) => {
    const { data } = await veilClient.patch(`/${postId}`, { content });
    return data;
  },

  archivePost: async (postId: string) => {
    const { data } = await veilClient.delete(`/${postId}`);
    return data;
  },

  // --- INTERACTION ---
  vote: async (pollOptionId: string) => {
    const { data } = await veilClient.post(
      `/poll-options/${pollOptionId}/vote`
    );
    return data;
  },

  react: async (postId: string, type: "AGREE" | "DISAGREE") => {
    const { data } = await veilClient.post(`/${postId}/react`, { type });
    return data;
  },

  createComment: async (
    postId: string,
    content: string,
    isAnonymous = true
  ) => {
    const { data } = await veilClient.post(`/${postId}/comments`, {
      content,
      isAnonymous,
    });
    return data;
  },

  trackView: async (postId: string) => {
    veilClient.post(`/${postId}/view`).catch(() => {});
  },

  getInteractions: async (postIds: string[]) => {
    if (postIds.length === 0) return {};
    // Ensure we are sending the request correctly as per Backend DTO
    const { data } = await veilClient.post<InteractionMap>("/interactions", {
      postIds,
    });
    return data;
  },
};
