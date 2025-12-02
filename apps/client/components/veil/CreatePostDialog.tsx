"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Trash2,
  BarChart2,
  Lock,
  Globe,
  Send,
  Shield, // Correctly imported
} from "lucide-react";
import { veilApi } from "@/lib/veil-client";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/types/veil";
import { useAuthStore } from "@/store/auth.store";

interface CreatePostDialogProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authorDisplayName, setAuthorDisplayName] = useState(""); // State for pseudonym
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setContent("");
        setIsAnonymous(true);
        setShowPoll(false);
        setPollOptions(["", ""]);
        setAuthorDisplayName("");
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    
    try {
      // Filter empty poll options
      const validPollOptions = showPoll ? pollOptions.filter(o => o.trim()) : undefined;
      if (showPoll && (!validPollOptions || validPollOptions.length < 2)) {
         throw new Error("Poll must have at least 2 options");
      }

      const newPost = await veilApi.createPost(
        content,
        isAnonymous,
        validPollOptions,
        isAnonymous ? authorDisplayName : undefined
      );

      toast({
        title: "Posted Successfully",
        description: isAnonymous ? "Your identity is hidden." : "Posted publicly.",
      });

      onPostCreated(newPost);
      setIsOpen(false);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.triggered) {
        toast({
          title: "Content Warning",
          description: `Blocked words: ${errorData.words.join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorData?.message || error.message || "Failed to post",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (JSX remains similar to what you have, but ensure inputs are wired to state) ...
  // I will provide the full JSX in the next block if you need it, but the logic above fixes the Name/Submit issue.
  // Assuming you keep the JSX structure you pasted, just ensure 'value={authorDisplayName}' is set on the input.
  
  return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform">
          <Plus className="w-5 h-5 mr-2" /> Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] glass-effect border-primary/20">
         {/* ... Header ... */}
         <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-gradient">Speak Freely</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            <Textarea 
                placeholder="What's on your mind?" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="min-h-[150px] text-lg bg-background/50 border-primary/20 focus:border-primary resize-none p-4"
            />
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-xl bg-muted/10 border border-border/50">
                 {/* Anon Switch */}
                 <div className="flex items-center gap-4">
                    <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    <Label>Anonymous Mode</Label>
                 </div>
                 {/* Poll Toggle */}
                 <Button variant="ghost" size="sm" onClick={() => setShowPoll(!showPoll)}>
                    <BarChart2 className="w-4 h-4 mr-2" /> {showPoll ? "Remove Poll" : "Add Poll"}
                 </Button>
            </div>

            {/* Name Input */}
            {isAnonymous && (
                <div className="animate-fade-in">
                    <Label>Choose Alias</Label>
                    <Input 
                        value={authorDisplayName} 
                        onChange={(e) => setAuthorDisplayName(e.target.value)} 
                        placeholder="e.g. Cyber Wolf"
                        className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1"><Shield className="w-3 h-3 inline mr-1"/> Sticky Identity</p>
                </div>
            )}

            {/* Poll Inputs */}
            {showPoll && (
                <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                            <Input value={opt} onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[i] = e.target.value;
                                setPollOptions(newOpts);
                            }} placeholder={`Option ${i+1}`} />
                            {pollOptions.length > 2 && <Button size="icon" variant="ghost" onClick={() => {
                                const newOpts = [...pollOptions];
                                newOpts.splice(i, 1);
                                setPollOptions(newOpts);
                            }}><Trash2 className="w-4 h-4"/></Button>}
                        </div>
                    ))}
                    {pollOptions.length < 10 && <Button variant="outline" size="sm" onClick={() => setPollOptions([...pollOptions, ""])}><Plus className="w-4 h-4 mr-2"/> Add Option</Button>}
                </div>
            )}
        </div>

        <DialogFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Publish"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}