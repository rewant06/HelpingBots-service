"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; 
import { Post } from "@/types/veil";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  Lock, MoreVertical, Edit2, Trash2, 
  ThumbsUp, ThumbsDown, MessageSquare, Eye, 
  ShieldAlert, ExternalLink, BarChart3
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useInteractionStore } from "@/store/interaction.store";
import { useAuthStore } from "@/store/auth.store";
import { useToast } from "@/hooks/use-toast";
import { veilApi } from "@/lib/veil-client";
import { cn } from "@/lib/utils";
import { CommentDialog } from "./CommentDialog";
import { useImpression } from "@/hooks/use-impression";

// --- UTILITY: LINK PARSER ---
// Prevents layout breaking on long URLs and makes them clickable
const ContentWithLinks = ({ text }: { text: string }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <span className="break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
               className="text-primary hover:underline inline-flex items-center gap-0.5 z-20 relative break-all font-medium hover:bg-primary/5 rounded px-0.5"
               onClick={(e) => e.stopPropagation()}>
              {part} <ExternalLink className="w-3 h-3 inline opacity-50" />
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  // --- 1. GLOBAL STORE (Client State) ---
  const interaction = useInteractionStore((s) => s.interactions[post.id]);
  const { setReaction, setVoted, initializeInteraction } = useInteractionStore();

  // --- 2. HYDRATION (The "Refresh" Fix) ---
  // Syncs Server Truth -> Client Store immediately on mount
  useEffect(() => {
    initializeInteraction(post.id, {
      reaction: post.userReaction || null, 
      hasVoted: post.hasVoted || false,    
    });
  }, [post.id, post.userReaction, post.hasVoted, initializeInteraction]);

  // --- 3. STATE TRUTH ---
  // Store takes precedence (latest action), falls back to Props (server state)
  const currentReaction = interaction?.reaction ?? post.userReaction;
  const hasVoted = interaction?.hasVoted ?? post.hasVoted;

  // --- 4. LOCAL UI STATE ---
  const [agreeCount, setAgreeCount] = useState(post.agreeCount || 0);
  const [disagreeCount, setDisagreeCount] = useState(post.disagreeCount || 0);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [showComments, setShowComments] = useState(false);

  // Computed
  const isOwner = user?.id === post.authorId;
  const minutesSincePost = differenceInMinutes(new Date(), new Date(post.createdAt));
  const canEdit = isOwner && minutesSincePost < 15;
  
  const totalReactions = agreeCount + disagreeCount;
  const agreePercent = totalReactions === 0 ? 0 : Math.round((agreeCount / totalReactions) * 100);
  const disagreePercent = totalReactions === 0 ? 0 : Math.round((disagreeCount / totalReactions) * 100);

  // Impression Tracking
  const cardRef = useImpression(post.id, () => setViewCount(p => p + 1));

  // --- HANDLER: VOTING ---
  const handleVote = async (optionId: string) => {
    if (!user) return toast({ title: "Login Required", variant: "destructive" });
    if (hasVoted) return toast({ title: "Already Voted", variant: "destructive" });

    // Optimistic
    setVoted(post.id);
    setPollOptions(prev => prev.map(o => o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o));

    try {
      await veilApi.vote(optionId);
      toast({ title: "Vote Recorded", className: "bg-emerald-600 text-white border-none" });
    } catch (e: any) {
      // 409 means "Already Voted" on backend, which matches our UI state, so we ignore it.
      if (e.response?.status !== 409) {
         toast({ title: "Vote Failed", variant: "destructive" });
      }
    }
  };

  // --- HANDLER: REACTION ---
  const handleReact = async (type: "AGREE" | "DISAGREE") => {
    if (!user) return toast({ title: "Login Required", variant: "destructive" });

    // Logic: Smart Toggling & Swapping
    if (currentReaction === type) {
      // Toggle OFF
      if (type === "AGREE") setAgreeCount(p => Math.max(0, p - 1));
      if (type === "DISAGREE") setDisagreeCount(p => Math.max(0, p - 1));
      setReaction(post.id, null);
    } else {
      // Swap or Add
      if (currentReaction === "AGREE") setAgreeCount(p => Math.max(0, p - 1));
      if (currentReaction === "DISAGREE") setDisagreeCount(p => Math.max(0, p - 1));

      if (type === "AGREE") setAgreeCount(p => p + 1);
      if (type === "DISAGREE") setDisagreeCount(p => p + 1);
      setReaction(post.id, type);
    }

    try {
      await veilApi.react(post.id, type);
    } catch (error) {
       // Silent fail for smoother UX
    }
  };

  const handleEditSubmit = async () => {
    setBlockedWords([]);
    try {
      await veilApi.updatePost(post.id, editContent);
      setIsEditing(false);
      toast({ title: "Post Updated", className: "bg-emerald-600 text-white" });
    } catch (error: any) {
      const response = error.response?.data;
      if (response && response.triggered === true) {
        setBlockedWords(response.words || []);
        toast({ title: "Safety Protocol Triggered", variant: "destructive" });
      } else {
        toast({ title: "Update Failed", variant: "destructive" });
      }
    }
  };

  const handleArchive = async () => {
    if (!confirm("Permanently delete this post?")) return;
    try {
      await veilApi.archivePost(post.id);
      if (onDelete) onDelete(post.id);
      toast({ title: "Post Deleted" });
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  return (
    <Card
      ref={cardRef}
      className="mb-6 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/95 backdrop-blur-sm overflow-hidden"
    >
      {/* HEADER */}
      <div className="p-4 flex gap-3 sm:gap-4 items-start">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-background shadow-sm shrink-0">
          <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorDisplayName}`} />
          <AvatarFallback className="bg-primary/5 text-primary">{post.authorDisplayName?.[0] || "?"}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[300px]">
                  {post.authorDisplayName}
                </span>
                {post.isAnonymous && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground flex items-center gap-1 border">
                    <Lock className="w-3 h-3" /> Anon
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={!canEdit}>
                    <Edit2 className="w-4 h-4 mr-2" /> {canEdit ? "Edit Post" : "Edit Locked (>15m)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="px-4 sm:px-16 pb-2 -mt-2">
        {isEditing ? (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-dashed">
            {blockedWords.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Restricted: <span className="font-bold">{blockedWords.join(", ")}</span>
                </AlertDescription>
              </Alert>
            )}
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-background min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleEditSubmit}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="text-base text-foreground/90 leading-relaxed overflow-hidden">
             <ContentWithLinks text={post.content} />
          </div>
        )}

        {/* POLL RENDERER */}
        {post.isPoll && pollOptions.length > 0 && (
          <div className="mt-4 space-y-2 max-w-lg">
            {pollOptions.map((option) => {
              const total = pollOptions.reduce((acc, curr) => acc + curr.voteCount, 0);
              const percent = total === 0 ? 0 : Math.round((option.voteCount / total) * 100);
              
              return (
                <div
                  key={option.id}
                  className={cn(
                    "relative overflow-hidden rounded-md border h-10 transition-all select-none group",
                    hasVoted
                      ? "cursor-default border-border/40"
                      : "cursor-pointer hover:border-primary/40 active:scale-[0.99]"
                  )}
                  onClick={() => !hasVoted && handleVote(option.id)}
                >
                  {/* Progress Bar */}
                  {hasVoted && (
                     <div 
                       className="absolute inset-0 bg-primary/10 transition-all duration-500 ease-out origin-left"
                       style={{ width: `${percent}%` }} 
                     />
                  )}
                  {/* Text Layer */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
                    <span className="text-sm font-medium truncate pr-2">{option.text}</span>
                    {hasVoted && <span className="text-xs font-bold text-primary tabular-nums">{percent}%</span>}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 px-1">
               <BarChart3 className="w-3 h-3" />
               <span>{pollOptions.reduce((a, b) => a + b.voteCount, 0)} votes</span>
               <span className="mx-1">•</span>
               <span>{hasVoted ? "Poll Completed" : "Select an option"}</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER & ACTIONS */}
      <div className="mt-4 border-t bg-muted/5">
        {/* Sentiment Bar */}
        {totalReactions > 0 && (
          <div className="flex h-0.5 w-full">
            <div className="bg-emerald-500/70 transition-all duration-500" style={{ width: `${agreePercent}%` }} />
            <div className="bg-rose-500/70 transition-all duration-500" style={{ width: `${disagreePercent}%` }} />
          </div>
        )}

        <div className="p-2 flex items-center justify-between">
           <div className="flex gap-1">
              {/* Agree Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReact("AGREE")}
                className={cn(
                  "rounded-full gap-2 h-9 px-3 transition-colors",
                  currentReaction === "AGREE" 
                    ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20" 
                    : "text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                )}
              >
                <ThumbsUp className={cn("w-4 h-4", currentReaction === "AGREE" && "fill-current")} />
                <span className="text-xs font-bold">{agreeCount}</span>
                <span className="text-[10px] font-normal opacity-70 hidden sm:inline">Agree</span>
              </Button>

              {/* Disagree Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReact("DISAGREE")}
                className={cn(
                  "rounded-full gap-2 h-9 px-3 transition-colors",
                  currentReaction === "DISAGREE" 
                    ? "text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20" 
                    : "text-muted-foreground hover:bg-rose-500/5 hover:text-rose-600"
                )}
              >
                <ThumbsDown className={cn("w-4 h-4 mt-0.5", currentReaction === "DISAGREE" && "fill-current")} />
                <span className="text-xs font-bold">{disagreeCount}</span>
                <span className="text-[10px] font-normal opacity-70 hidden sm:inline">Disagree</span>
              </Button>
           </div>

           <div className="flex items-center gap-3 pr-2">
              <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => setShowComments(true)}
                 className="h-8 gap-1.5 text-muted-foreground hover:text-primary rounded-full"
              >
                 <MessageSquare className="w-4 h-4" />
                 <span className="text-xs font-medium">{post.commentCount}</span>
              </Button>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                 <Eye className="w-3 h-3" /> {viewCount}
              </div>
           </div>
        </div>
      </div>

      <CommentDialog
        postId={post.id}
        open={showComments}
        onOpenChange={setShowComments}
      />
    </Card>
  );
}