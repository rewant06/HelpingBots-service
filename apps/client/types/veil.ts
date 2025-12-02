export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  postId: string;
}

export interface Post {
  id: string;
  content: string;
  authorDisplayName: string; // "Quiet Panda" or "Rewant Raj"
  createdAt: string;
  isGlobal: boolean;
  isAnonymous: boolean;
  
  // Engagement
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  
  // Features
  isPoll: boolean;
  pollOptions?: PollOption[];

  // Cursor for pagination
  cursorId?: string; 
}

export interface FeedResponse {
  data: Post[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}