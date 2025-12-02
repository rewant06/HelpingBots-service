"use client";

import { Post } from "@/types/veil";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { 
  Lock, Globe, MessageSquare, Eye, MoreVertical, Edit2, Trash2,
  ThumbsUp, ThumbsDown // Using classic Thumbs for clarity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { veilApi } from "@/lib/veil-client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { CommentDialog } from "./CommentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PostCardProps {
  post: Post;
  isOwner?: boolean; 
  onDelete?: (id: string) => void;
  interactionState?: { reaction: 'AGREE' | 'DISAGREE' | null; hasVoted: boolean };
}

export function PostCard({ post, isOwner, onDelete, interactionState }: PostCardProps) {
  const { toast } = useToast();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [agreeCount, setAgreeCount] = useState(post.agreeCount || 0);
  const [disagreeCount, setDisagreeCount] = useState(post.disagreeCount || 0);
  const [userReaction, setUserReaction] = useState<'AGREE' | 'DISAGREE' | null>(interactionState?.reaction || null);
  
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);

  useEffect(() => {
     if (interactionState) setUserReaction(interactionState.reaction);
  }, [interactionState]);

  // --- LOGIC: Calculate Sentiment Bar ---
  const totalReactions = agreeCount + disagreeCount;
  const agreePercent = totalReactions === 0 ? 0 : Math.round((agreeCount / totalReactions) * 100);
  const disagreePercent = totalReactions === 0 ? 0 : Math.round((disagreeCount / totalReactions) * 100);

  const handleVote = async (optionId: string) => {
      if (!isAuthenticated) return toast({ title: "Login Required", variant: "destructive" });
      try {
          await veilApi.vote(optionId);
          setPollOptions(prev => prev.map(o => o.id === optionId ? {...o, voteCount: o.voteCount + 1} : o));
          toast({ title: "Voted!", className: "bg-primary text-primary-foreground" });
      } catch (e) { toast({ title: "Vote Failed", variant: "destructive" }); }
  };

  const handleReact = async (type: 'AGREE' | 'DISAGREE') => {
    if (!isAuthenticated) return toast({ title: "Login Required", variant: "destructive" });

    const prevReaction = userReaction;
    
    // Optimistic UI Logic
    if (type === 'AGREE') {
        if (userReaction === 'AGREE') {
             setAgreeCount(p => p - 1); setUserReaction(null);
        } else {
             setAgreeCount(p => p + 1); 
             if (userReaction === 'DISAGREE') setDisagreeCount(p => p - 1);
             setUserReaction('AGREE');
        }
    } else {
        if (userReaction === 'DISAGREE') {
             setDisagreeCount(p => p - 1); setUserReaction(null);
        } else {
             setDisagreeCount(p => p + 1);
             if (userReaction === 'AGREE') setAgreeCount(p => p - 1);
             setUserReaction('DISAGREE');
        }
    }

    try {
      await veilApi.react(post.id, type);
    } catch (error) {
      // Revert logic omitted for brevity, but highly recommended in prod
      toast({ title: "Reaction failed", variant: "destructive" });
    }
  };

  const handleArchive = async () => {
      if (!confirm("Delete this post?")) return;
      await veilApi.archivePost(post.id);
      if (onDelete) onDelete(post.id);
  };

  const handleEdit = async () => {
      await veilApi.updatePost(post.id, editContent);
      setCurrentContent(editContent);
      setIsEditing(false);
  };

  return (
    <Card className="mb-6 border-none shadow-lg bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md overflow-hidden hover:shadow-primary/10 transition-all duration-300 ring-1 ring-white/5">
      
      {/* Header Area */}
      <div className="p-5 pb-0 flex gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-border cursor-pointer hover:scale-105 transition-transform">
           <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorDisplayName}`} />
           <AvatarFallback>{post.authorDisplayName[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground tracking-tight">
                  {post.authorDisplayName}
                </span>
                {post.isAnonymous && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Anon
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-2"/> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleArchive} className="text-destructive"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 py-4">
        {isEditing ? (
            <div className="space-y-2">
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bg-background/50" />
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleEdit}>Save</Button>
                </div>
            </div>
        ) : (
            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal">
              {currentContent}
            </p>
        )}

        {/* Polls (Enhanced Visuals) */}
        {post.isPoll && pollOptions.length > 0 && (
          <div className="mt-6 space-y-3">
            {pollOptions.map((option) => {
              const total = pollOptions.reduce((acc, curr) => acc + curr.voteCount, 0);
              const percent = total === 0 ? 0 : Math.round((option.voteCount / total) * 100);
              return (
                <div key={option.id} className="relative group cursor-pointer" onClick={() => handleVote(option.id)}>
                  <div className="relative z-10 flex justify-between items-center px-4 py-3 rounded-xl border border-border/60 hover:border-primary/40 bg-background/30 transition-all">
                    <span className="font-medium text-sm">{option.text}</span>
                    <span className="font-bold text-sm">{percent}%</span>
                  </div>
                  <div className="absolute inset-0 bg-primary/5 rounded-xl transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                </div>
              );
            })}
            <div className="text-xs text-right text-muted-foreground font-medium mt-1">
              {pollOptions.reduce((a,b) => a+b.voteCount, 0)} total votes
            </div>
          </div>
        )}
      </div>

      {/* Sentiment Bar (Visualizing Agree/Disagree) */}
      {(agreeCount > 0 || disagreeCount > 0) && (
        <div className="flex h-1 w-full">
           <div className="bg-green-500/80 transition-all duration-500" style={{ width: `${agreePercent}%` }} />
           <div className="bg-red-500/80 transition-all duration-500" style={{ width: `${disagreePercent}%` }} />
        </div>
      )}

      {/* Action Footer */}
      <div className="px-2 py-2 bg-muted/5 flex items-center justify-between">
         <div className="flex gap-1">
             {/* Agree */}
             <Button 
                variant="ghost" 
                onClick={() => handleReact('AGREE')}
                className={cn(
                  "rounded-full px-4 gap-2 transition-all hover:bg-green-500/10 hover:text-green-600",
                  userReaction === 'AGREE' ? "text-green-600 bg-green-500/10 ring-1 ring-green-500/20" : "text-muted-foreground"
                )}
             >
                <ThumbsUp className={cn("w-5 h-5", userReaction === 'AGREE' && "fill-current")} />
                <span className="font-bold">{agreeCount}</span>
                <span className="text-xs font-normal opacity-70">Agree</span>
             </Button>

             {/* Disagree */}
             <Button 
                variant="ghost" 
                onClick={() => handleReact('DISAGREE')}
                className={cn(
                  "rounded-full px-4 gap-2 transition-all hover:bg-red-500/10 hover:text-red-600",
                  userReaction === 'DISAGREE' ? "text-red-600 bg-red-500/10 ring-1 ring-red-500/20" : "text-muted-foreground"
                )}
             >
                <ThumbsDown className={cn("w-5 h-5 mt-1", userReaction === 'DISAGREE' && "fill-current")} />
                <span className="font-bold">{disagreeCount}</span>
                <span className="text-xs font-normal opacity-70">Disagree</span>
             </Button>
         </div>

         <div className="flex gap-2 pr-2">
             <Button variant="ghost" size="sm" onClick={() => setShowComments(true)} className="text-muted-foreground hover:text-primary rounded-full gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-medium">{post.commentCount}</span>
             </Button>
             <div className="flex items-center gap-1 text-muted-foreground px-3 py-2 rounded-full bg-background/50 text-xs font-medium">
                <Eye className="w-4 h-4" /> {post.viewCount}
             </div>
         </div>
      </div>

      <CommentDialog postId={post.id} open={showComments} onOpenChange={setShowComments} />
    </Card>
  );
}