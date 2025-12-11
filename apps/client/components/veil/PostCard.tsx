"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Post } from "@/types/veil";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  Lock, MoreVertical, Edit2, Trash2, 
  ThumbsUp, ThumbsDown, MessageSquare, Eye, 
  ShieldAlert, ExternalLink, BarChart3, ChevronDown, ChevronUp
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

// --- UTILITY: LINK PARSER & LAYOUT PROTECTION ---
// Fixes "Google Form" overflow and makes links clickable
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

  // --- 2. HYDRATION (Fixes "Refresh Amnesia") ---
  useEffect(() => {
    initializeInteraction(post.id, {
      reaction: post.userReaction || null, 
      hasVoted: post.hasVoted || false,    
    });
  }, [post.id, post.userReaction, post.hasVoted, initializeInteraction]);

  // --- 3. STATE RESOLUTION ---
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
  const [isExpanded, setIsExpanded] = useState(false); // For "See More"

  // Computed Properties
  const isOwner = post.isAuthor;
  const minutesSincePost = differenceInMinutes(new Date(), new Date(post.createdAt));
  const canEdit = isOwner && minutesSincePost < 15;
  
  // Content Truncation Logic
  const shouldTruncate = post.content.length > 280;
  const displayContent = isExpanded || !shouldTruncate ? post.content : post.content.slice(0, 280) + "...";

  const totalReactions = agreeCount + disagreeCount;
  const agreePercent = totalReactions === 0 ? 0 : Math.round((agreeCount / totalReactions) * 100);
  const disagreePercent = totalReactions === 0 ? 0 : Math.round((disagreeCount / totalReactions) * 100);

  // Impression Tracking
  const cardRef = useImpression(post.id, () => setViewCount(p => p + 1));

  // --- HANDLER: VOTING ---
  const handleVote = async (optionId: string) => {
    if (!user) return toast({ title: "Login Required", variant: "destructive" });
    if (hasVoted) return toast({ title: "Already Voted", variant: "destructive" });

    // Optimistic Update
    setVoted(post.id);
    setPollOptions(prev => prev.map(o => o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o));

    try {
      await veilApi.vote(optionId);
      toast({ title: "Vote Recorded", className: "bg-emerald-600 text-white border-none" });
    } catch (e: any) {
      if (e.response?.status !== 409) toast({ title: "Vote Failed", variant: "destructive" });
    }
  };

  // --- HANDLER: REACTION ---
  const handleReact = async (type: "AGREE" | "DISAGREE") => {
    if (!user) return toast({ title: "Login Required", variant: "destructive" });

    // Logic: Smart Toggle (Remove if same, Swap if different)
    if (currentReaction === type) {
      if (type === "AGREE") setAgreeCount(p => Math.max(0, p - 1));
      if (type === "DISAGREE") setDisagreeCount(p => Math.max(0, p - 1));
      setReaction(post.id, null);
    } else {
      if (currentReaction === "AGREE") setAgreeCount(p => Math.max(0, p - 1));
      if (currentReaction === "DISAGREE") setDisagreeCount(p => Math.max(0, p - 1));
      
      if (type === "AGREE") setAgreeCount(p => p + 1);
      if (type === "DISAGREE") setDisagreeCount(p => p + 1);
      setReaction(post.id, type);
    }

    try { await veilApi.react(post.id, type); } catch (error) {}
  };

  const handleEditSubmit = async () => {
    setBlockedWords([]);
    try {
      await veilApi.updatePost(post.id, editContent);
      setIsEditing(false);
      toast({ title: "Post Updated", className: "bg-emerald-600 text-white" });
    } catch (error: any) {
      const response = error.response?.data;
      if (response && response.triggered) {
        setBlockedWords(response.words || []);
        toast({ title: "Safety Protocol Triggered", variant: "destructive" });
      } else {
        toast({ title: "Update Failed", variant: "destructive" });
      }
    }
  };

  const handleArchive = async () => {
    if (!confirm("Delete post?")) return;
    try {
      await veilApi.archivePost(post.id);
      if (onDelete) onDelete(post.id);
      toast({ title: "Post Deleted" });
    } catch (e) { toast({ title: "Delete Failed", variant: "destructive" }); }
  };

  return (
    <Card
      ref={cardRef}
      className="mb-4 border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/95 backdrop-blur-sm overflow-hidden"
    >
      {/* HEADER */}
      <div className="p-4 flex gap-3 items-start">
        <Avatar className="w-10 h-10 ring-1 ring-border/50 shadow-sm shrink-0">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorDisplayName}`}
          />
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
            {post.authorDisplayName?.[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[180px] sm:max-w-[300px]">
                  {post.authorDisplayName}
                </span>
                {post.isAnonymous && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground flex items-center gap-1 border border-border/50">
                    <Lock className="w-2.5 h-2.5" /> Anon
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Menu (Owner Only) */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={!canEdit}>
                    <Edit2 className="w-3.5 h-3.5 mr-2" /> 
                    {canEdit ? "Edit Post" : "Edit Locked (>15m)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="px-4 pb-2 -mt-1">
        {isEditing ? (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-dashed animate-in fade-in">
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
              className="bg-background min-h-[100px] text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleEditSubmit}>Save Changes</Button>
            </div>
          </div>
        ) : (
          /* SAFE TEXT RENDERER */
          <div className="text-sm sm:text-base text-foreground/90 leading-relaxed break-words">
             <ContentWithLinks text={displayContent} />
             
             {/* "See More" Toggle */}
             {shouldTruncate && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsExpanded(!isExpanded);
                 }}
                 className="block mt-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
               >
                 {isExpanded ? (
                   <>Show Less <ChevronUp className="w-3 h-3" /></>
                 ) : (
                   <>See More <ChevronDown className="w-3 h-3" /></>
                 )}
               </button>
             )}
          </div>
        )}

        {/* POLL RENDERER */}
        {post.isPoll && pollOptions.length > 0 && (
          <div className="mt-4 space-y-2 max-w-full">
            {pollOptions.map((option) => {
              const total = pollOptions.reduce((acc, curr) => acc + curr.voteCount, 0);
              const percent = total === 0 ? 0 : Math.round((option.voteCount / total) * 100);
              
              return (
                <div
                  key={option.id}
                  className={cn(
                    "relative overflow-hidden rounded-md border h-9 sm:h-10 transition-all select-none group",
                    hasVoted
                      ? "cursor-default border-border/40"
                      : "cursor-pointer hover:border-primary/40 active:scale-[0.99] active:bg-muted/30"
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
                    <span className="text-xs sm:text-sm font-medium truncate pr-2">{option.text}</span>
                    {hasVoted && (
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {percent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mt-1 px-1">
               <BarChart3 className="w-3 h-3" />
               <span>{pollOptions.reduce((a, b) => a + b.voteCount, 0)} votes</span>
               <span className="mx-1">•</span>
               <span>{hasVoted ? "Final Results" : "Poll Open"}</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: SENTIMENT & ACTIONS */}
      <div className="mt-4 border-t border-border/30 bg-muted/5">
        
        {/* Sentiment Visual Bar */}
        {(agreeCount > 0 || disagreeCount > 0) && (
          <div className="flex h-0.5 w-full overflow-hidden">
            <div 
              className="bg-emerald-500/70 transition-all duration-500 ease-out" 
              style={{ width: `${agreePercent}%` }} 
            />
            <div 
              className="bg-rose-500/70 transition-all duration-500 ease-out" 
              style={{ width: `${disagreePercent}%` }} 
            />
          </div>
        )}

        {/* Buttons Container */}
        <div className="p-2 flex items-center justify-between">
           <div className="flex gap-1.5">
              {/* AGREE BUTTON (Compact h-8) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReact("AGREE")}
                className={cn(
                  "rounded-full gap-1.5 h-8 px-3 transition-all active:scale-95 border border-transparent", 
                  currentReaction === "AGREE" 
                    ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" 
                    : "text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                )}
              >
                <ThumbsUp className={cn("w-3.5 h-3.5", currentReaction === "AGREE" && "fill-current")} />
                <span className="text-xs font-bold tabular-nums">{agreeCount}</span>
                <span className="text-[10px] font-medium opacity-80">Agree</span>
              </Button>

              {/* DISAGREE BUTTON (Compact h-8) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReact("DISAGREE")}
                className={cn(
                  "rounded-full gap-1.5 h-8 px-3 transition-all active:scale-95 border border-transparent",
                  currentReaction === "DISAGREE" 
                    ? "text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20" 
                    : "text-muted-foreground hover:bg-rose-500/5 hover:text-rose-600"
                )}
              >
                <ThumbsDown className={cn("w-3.5 h-3.5 mt-0.5", currentReaction === "DISAGREE" && "fill-current")} />
                <span className="text-xs font-bold tabular-nums">{disagreeCount}</span>
                <span className="text-[10px] font-medium opacity-80">Disagree</span>
              </Button>
           </div>

           {/* RIGHT SIDE */}
           <div className="flex items-center gap-1 sm:gap-3 pr-1">
              <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => setShowComments(true)}
                 className="h-8 gap-1.5 text-muted-foreground hover:text-primary rounded-full px-2 sm:px-3"
              >
                 <MessageSquare className="w-3.5 h-3.5" />
                 <span className="text-xs font-medium tabular-nums">{post.commentCount}</span>
              </Button>
              
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium px-2 py-1 rounded-full bg-background/50 border border-border/30">
                 <Eye className="w-3 h-3 opacity-70" />
                 <span className="tabular-nums">{viewCount}</span>
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