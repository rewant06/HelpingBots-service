"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Lock, Globe } from "lucide-react";
import { veilApi } from "@/lib/veil-client";

interface CommentDialogProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommentDialog({ postId, open, onOpenChange }: CommentDialogProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      veilApi.getComments(postId)
        .then(setComments)
        .catch(() => setComments([]))
        .finally(() => setLoading(false));
    }
  }, [open, postId]);

  const handleSend = async () => {
    if (!newComment.trim() || !postId) return;
    setSending(true);
    try {
      const comment = await veilApi.createComment(postId, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment("");
    } catch (e) {
      console.error(e);
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
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : comments.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">No comments yet. Be the first!</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.authorDisplayName}`} />
                    <AvatarFallback>{comment.authorDisplayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{comment.authorDisplayName}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt))}</span>
                    </div>
                    <p className="text-sm text-foreground/90 bg-muted/50 p-2 rounded-lg">{comment.content}</p>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !newComment.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}