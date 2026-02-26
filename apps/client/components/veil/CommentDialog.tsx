"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { veilApi } from "@/lib/veil-client";

interface CommentDialogProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentDialog({
  postId,
  open,
  onOpenChange,
}: CommentDialogProps) {
  const { user } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextUrl =
    pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

  const requireAuth = () => {
    if (user) return true;

    toast("Login required", {
      description: "Please login to comment.",
      action: {
        label: "Login",
        onClick: () =>
          router.push(`/login?next=${encodeURIComponent(nextUrl)}`),
      },
    });

    return false;
  };
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [loadError, setLoadError] = useState<null | "AUTH" | "GENERIC">(null);

  useEffect(() => {
    if (!open || !postId) return;

    setLoading(true);
    setLoadError(null);

    veilApi
      .getComments(postId)
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((e: any) => {
        const status = e?.response?.status;

        if (status === 401 || status === 403) {
          setLoadError("AUTH");
          return;
        }

        setLoadError("GENERIC");
      })
      .finally(() => setLoading(false));
  }, [open, postId]);

  const handleSend = async () => {
    if (!newComment.trim() || !postId) return;
    if (!requireAuth()) return;
    setSending(true);
    try {
      const comment = await veilApi.createComment(postId, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      toast.success("Comment posted");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        requireAuth();
        return;
      }
      toast.error("Failed to post comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col glass-effect">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : loadError === "AUTH" ? (
            <div className="text-center text-muted-foreground py-10 space-y-3">
              <p>You need to login to view comments.</p>
              <Button
                variant="default"
                onClick={() =>
                  router.push(`/login?next=${encodeURIComponent(nextUrl)}`)
                }
              >
                Login
              </Button>
            </div>
          ) : loadError === "GENERIC" ? (
            <div className="text-center text-muted-foreground py-10 space-y-3">
              <p>Couldn’t load comments.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!postId) return;

                  setLoading(true);
                  setLoadError(null);

                  veilApi
                    .getComments(postId)
                    .then((data) =>
                      setComments(Array.isArray(data) ? data : []),
                    )
                    .catch((e: any) => {
                      const status = e?.response?.status;
                      if (status === 401 || status === 403) {
                        setLoadError("AUTH");
                        return;
                      }
                      setLoadError("GENERIC");
                    })
                    .finally(() => setLoading(false));
                }}
              >
                Retry
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.authorDisplayName}`}
                    />
                    <AvatarFallback>
                      {comment.authorDisplayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {comment.authorDisplayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 bg-muted/50 p-2 rounded-lg">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !newComment.trim()}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
