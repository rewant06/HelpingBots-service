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
  isAuthor: boolean;
  // Engagement
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  agreeCount: number;
  disagreeCount: number;


  // Features
  isPoll: boolean;
  pollOptions?: PollOption[];

  userReaction?: 'AGREE' | 'DISAGREE' | null;
  hasVoted?: boolean;

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
export interface InteractionMap {
  [postId: string]: {
    reaction: 'AGREE' | 'DISAGREE' | null;
    hasVoted: boolean;
  };
}
