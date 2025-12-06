"use client";

import { useState } from "react";
import { Post } from "@/types/veil";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  Lock,
  MoreVertical,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();

  // --- GLOBAL STATE ---
  const interaction = useInteractionStore((s) => s.interactions[post.id]);
  const { setReaction, setVoted } = useInteractionStore();

  // --- VIEW TRACKING ---
  // We attach this ref to the Card to detect when it enters the viewport
  const [viewCount, setViewCount] = useState(post.viewCount || 0);

  // --- LOCAL STATE ---
  const [agreeCount, setAgreeCount] = useState(post.agreeCount || 0);
  const [disagreeCount, setDisagreeCount] = useState(post.disagreeCount || 0);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);

  // --- EDIT & UI STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [showComments, setShowComments] = useState(false);

  // --- LOGIC ---
  const isOwner = post.isAuthor;
  const minutesSincePost = differenceInMinutes(
    new Date(),
    new Date(post.createdAt)
  );
  const canEdit = isOwner && minutesSincePost < 15;

  const cardRef = useImpression(post.id, () => {
    setViewCount((prev) => prev + 1);
  });

  const totalReactions = agreeCount + disagreeCount;
  const agreePercent =
    totalReactions === 0 ? 0 : Math.round((agreeCount / totalReactions) * 100);
  const disagreePercent =
    totalReactions === 0
      ? 0
      : Math.round((disagreeCount / totalReactions) * 100);

  // --- HANDLERS ---

  const handleVote = async (optionId: string) => {
    if (!user)
      return toast({ title: "Login Required", variant: "destructive" });
    if (interaction?.hasVoted)
      return toast({ title: "Already Voted", variant: "destructive" });

    setVoted(post.id);

    setPollOptions((prev) =>
      prev.map((o) =>
        o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
      )
    );

    try {
      await veilApi.vote(optionId);
      toast({
        title: "Vote Recorded",
        className: "bg-emerald-600 text-white border-none",
      });
    } catch (e: any) {
      toast({ title: "Vote Failed", variant: "destructive" });
      if (e.response && e.response.status === 409) {
        toast({
          title: "Results Updated",
          description: "You have already voted on this poll.",
        });
      } else {
        console.error(e);
        toast({ title: "Vote Failed", variant: "destructive" });
      }
    }
  };

  const handleReact = async (type: "AGREE" | "DISAGREE") => {
    if (!user)
      return toast({ title: "Login Required", variant: "destructive" });

    const currentReaction = interaction?.reaction;

    if (type === "AGREE") {
      if (currentReaction === "AGREE") {
        setAgreeCount((p) => p - 1);
        setReaction(post.id, null);
      } else {
        setAgreeCount((p) => p + 1);
        if (currentReaction === "DISAGREE") setDisagreeCount((p) => p - 1);
        setReaction(post.id, "AGREE");
      }
    } else {
      if (currentReaction === "DISAGREE") {
        setDisagreeCount((p) => p - 1);
        setReaction(post.id, null);
      } else {
        setDisagreeCount((p) => p + 1);
        if (currentReaction === "AGREE") setAgreeCount((p) => p - 1);
        setReaction(post.id, "DISAGREE");
      }
    }

    try {
      await veilApi.react(post.id, type);
    } catch (error) {}
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
      className="mb-6 border-none shadow-lg bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md hover:shadow-primary/10 transition-all duration-300 ring-1 ring-white/5 overflow-visible"
    >
      {/* HEADER */}
      <div className="p-5 pb-0 flex gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-border/50">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorDisplayName}`}
          />
          <AvatarFallback>{post.authorDisplayName?.[0] || "?"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {post.authorDisplayName}
                </span>
                {post.isAnonymous && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Anon
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {canEdit ? (
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Post
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="opacity-50 cursor-not-allowed"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit (Locked)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleArchive}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {blockedWords.length > 0 && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/50"
              >
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Content Warning</AlertTitle>
                <AlertDescription>
                  Restricted words detected:{" "}
                  <span className="font-bold underline">
                    {blockedWords.join(", ")}
                  </span>
                </AlertDescription>
              </Alert>
            )}
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`min-h-[100px] text-lg bg-background/50 focus:bg-background transition-colors ${
                blockedWords.length > 0 ? "border-destructive" : ""
              }`}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal">
            {isEditing ? editContent : post.content}
          </p>
        )}

        {/* POLL RENDERER */}
        {post.isPoll && pollOptions.length > 0 && (
          <div className="mt-6 space-y-3">
            {pollOptions.map((option) => {
              const total = pollOptions.reduce(
                (acc, curr) => acc + curr.voteCount,
                0
              );
              const percent =
                total === 0 ? 0 : Math.round((option.voteCount / total) * 100);
              const isVoted = interaction?.hasVoted;

              return (
                <div
                  key={option.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border transition-all select-none",
                    isVoted
                      ? "cursor-default border-border/30 bg-transparent"
                      : "cursor-pointer hover:border-primary/50 bg-background/50 active:scale-[0.99]"
                  )}
                  onClick={() => !isVoted && handleVote(option.id)}
                >
                  <div className="relative z-10 flex justify-between items-center px-4 py-3">
                    <span className="font-medium text-sm z-10">
                      {option.text}
                    </span>
                    {isVoted && (
                      <span className="font-bold text-sm animate-in fade-in z-10">
                        {percent}%
                      </span>
                    )}
                  </div>
                  {isVoted && (
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all duration-1000 ease-out origin-left"
                      style={{ width: `${percent}%` }}
                    />
                  )}
                </div>
              );
            })}
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {interaction?.hasVoted ? "Poll Results" : "Poll Active"}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {pollOptions.reduce((a, b) => a + b.voteCount, 0)} votes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SENTIMENT BAR */}
      {(agreeCount > 0 || disagreeCount > 0) && (
        <div className="flex h-1 w-full mt-2">
          <div
            className="bg-emerald-500/80 transition-all duration-500"
            style={{ width: `${agreePercent}%` }}
          />
          <div
            className="bg-rose-500/80 transition-all duration-500"
            style={{ width: `${disagreePercent}%` }}
          />
        </div>
      )}

      {/* FOOTER */}
      <div className="px-2 py-2 bg-muted/5 flex items-center justify-between border-t border-white/5">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            onClick={() => handleReact("AGREE")}
            className={cn(
              "rounded-full px-4 gap-2 transition-all hover:bg-emerald-500/10 hover:text-emerald-600",
              interaction?.reaction === "AGREE"
                ? "text-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                : "text-muted-foreground"
            )}
          >
            <ThumbsUp
              className={cn(
                "w-5 h-5",
                interaction?.reaction === "AGREE" && "fill-current"
              )}
            />
            <span className="font-bold">{agreeCount}</span>
            <span className="text-xs font-normal opacity-70">Agree</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleReact("DISAGREE")}
            className={cn(
              "rounded-full px-4 gap-2 transition-all hover:bg-rose-500/10 hover:text-rose-600",
              interaction?.reaction === "DISAGREE"
                ? "text-rose-600 bg-rose-500/10 ring-1 ring-rose-500/20"
                : "text-muted-foreground"
            )}
          >
            <ThumbsDown
              className={cn(
                "w-5 h-5 mt-1",
                interaction?.reaction === "DISAGREE" && "fill-current"
              )}
            />
            <span className="font-bold">{disagreeCount}</span>
            <span className="text-xs font-normal opacity-70">Disagree</span>
          </Button>
        </div>

        <div className="flex gap-2 pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(true)}
            className="text-muted-foreground hover:text-primary rounded-full gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">{post.commentCount}</span>
          </Button>
          <div className="flex items-center gap-1 text-muted-foreground px-3 py-2 rounded-full bg-background/50 text-xs font-medium">
            <Eye className="w-4 h-4" /> {viewCount}
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
