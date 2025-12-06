"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Trash2,
  BarChart2,
  Lock,
  Globe,
  Shield,
  ShieldAlert,
} from "lucide-react";

import { veilApi } from "@/lib/veil-client";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/types/veil";

interface CreatePostDialogProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const { toast } = useToast();

  const user = useAuthStore((s) => s.user);
  const realName = user?.name || "You";

  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // --- STATE ---
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [pseudonym, setPseudonym] = useState(""); // User's alias
  const [hasExistingIdentity, setHasExistingIdentity] = useState(false); // If true, locked

  // Poll State
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);

  // --- IDENTITY LOGIC (VETERAN STANDARD) ---
  useEffect(() => {
    let isMounted = true;
    // Only fetch if open AND anonymous (Public posts don't need pseudonyms)
    if (!isOpen || !isAnonymous) return;

    const fetchIdentity = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await veilApi.getMyProfile();
        if (isMounted && profile?.pseudonym) {
          setPseudonym(profile.pseudonym);
          setHasExistingIdentity(true);
        }
      } catch (error) {
        // Silent Catch: 404 means "New User" - UI handles empty state
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchIdentity();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAnonymous]);

  // Reset on close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setContent("");
        setShowPoll(false);
        setPollOptions(["", ""]);
        setBlockedWords([]);
        // We DO NOT reset pseudonym if they have an existing one
        if (!hasExistingIdentity) setPseudonym("");
      }, 300);
    }
  };

  // --- SUBMISSION LOGIC ---
  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!content.trim()) return;

    // 2. Poll Validation
    const validPollOptions = showPoll
      ? pollOptions.filter((o) => o.trim())
      : undefined;
    if (showPoll && (!validPollOptions || validPollOptions.length < 2)) {
      toast({
        title: "Invalid Poll",
        description: "Please provide at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    // 3. Identity Validation (If Anon)
    if (isAnonymous && !pseudonym.trim()) {
      toast({
        title: "Identity Required",
        description: "Please set a pseudonym first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setBlockedWords([]); // Clear previous errors

    try {
      const newPost = await veilApi.createPost(
        content,
        isAnonymous,
        validPollOptions,
        isAnonymous ? pseudonym : realName
      );

      toast({
        title: "Broadcast Successful",
        description: isAnonymous
          ? "Your identity remains hidden."
          : "Posted publicly.",
        className: "bg-green-600 text-white border-none",
      });

      onPostCreated(newPost);
      setIsOpen(false);
    } catch (error: any) {
      // --- MODERATION HANDLING ---
      const response = error.response?.data;

      if (response && response.triggered === true) {
        // Policy Violation Detected
        setBlockedWords(response.words || []);
        toast({
          title: "Message Blocked",
          description: "Content violates community safety guidelines.",
          variant: "destructive",
        });
      } else {
        // Generic Error
        toast({
          title: "Transmission Failed",
          description: response?.message || "Could not reach the network.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 mr-2" /> Create Post
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-gradient">Speak Freely</span>
          </DialogTitle>
        </DialogHeader>

        {/* LOADING STATE FOR IDENTITY */}
        {isLoadingProfile ? (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Securing anonymous channel...</p>
          </div>
        ) : (
          <div className="grid gap-5 py-2">
            {/* --- MODERATION ALERT --- */}
            {blockedWords.length > 0 && (
              <Alert
                variant="destructive"
                className="animate-in slide-in-from-top-2 fade-in bg-destructive/10 border-destructive/50"
              >
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Safety Protocol Triggered</AlertTitle>
                <AlertDescription>
                  Your post contains restricted content:{" "}
                  <span className="font-bold underline">
                    {blockedWords.join(", ")}
                  </span>
                  . Please remove these words to continue.
                </AlertDescription>
              </Alert>
            )}

            {/* 1. COMPOSER AREA */}
            <div className="relative group">
              <Textarea
                placeholder="What's the truth?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                className={`min-h-[160px] text-lg bg-background/40 backdrop-blur-sm focus:border-primary/50 resize-none p-4 rounded-xl shadow-inner transition-all ${
                  blockedWords.length > 0
                    ? "border-destructive/50"
                    : "border-primary/10"
                }`}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md border border-border/50">
                {content.length}/2000
              </div>
            </div>

            {/* 2. SMART CONTROLS */}
            {/* 2. SMART CONTROLS (Redesigned) */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-secondary/20 border border-border/50 backdrop-blur-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* LEFT: Identity Switcher */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id="anon-mode"
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Label
                        htmlFor="anon-mode"
                        className="font-medium cursor-pointer select-none"
                      >
                        {isAnonymous ? "Veil Identity" : "Public Mode"}
                      </Label>
                    </div>
                  </div>

                  {/* STATUS PILL (Animated) */}
                  <div className="relative h-6 overflow-hidden">
                    {isAnonymous ? (
                      <div className="absolute inset-0 flex items-center gap-2 text-[11px] font-medium text-emerald-600 animate-in slide-in-from-bottom-2 fade-in duration-300">
                        <Lock className="w-3 h-3 p-5" />
                        <span>Identity Hidden</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center gap-2 text-[11px] font-medium text-amber-600 animate-in slide-in-from-top-2 fade-in duration-300">
                        <Globe className="w-3 h-3" />
                        <span>
                          Visible as{" "}
                          <span className="underline decoration-amber-500/30 underline-offset-2">
                            {realName}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block w-px h-10 bg-border/50" />

                {/* RIGHT: Poll Actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPoll(!showPoll)}
                  className={`w-full sm:w-auto rounded-full border border-transparent transition-all duration-300 ${
                    showPoll
                      ? "text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                      : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                  }`}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  {showPoll ? "Cancel Poll" : "Add Poll"}
                </Button>
              </div>
            </div>

            {/* 3. IDENTITY CARD */}
            {isAnonymous && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                {hasExistingIdentity ? (
                  /* LOCKED STATE (Existing User) */
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-primary">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                        Identity Locked
                      </p>
                      <p className="font-bold text-lg leading-none tracking-tight">
                        {pseudonym}
                      </p>
                    </div>
                    <Lock className="w-4 h-4 ml-auto opacity-50" />
                  </div>
                ) : (
                  /* INPUT STATE (New User) */
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Establish Pseudonym
                    </Label>
                    <div className="relative">
                      <Input
                        value={pseudonym}
                        onChange={(e) => setPseudonym(e.target.value)}
                        placeholder="e.g. Cyber Wolf"
                        maxLength={20}
                        className="pl-10 h-12 bg-background/50 border-primary/20 focus:border-primary text-lg"
                      />
                      <Shield className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" /> This identity will be
                      permanent for this tenant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. POLL BUILDER (Conditional) */}
            {showPoll && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50 animate-in zoom-in-95 duration-200">
                <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                  Poll Options
                </Label>
                {pollOptions.map((opt, i) => (
                  <div
                    key={i}
                    className="flex gap-2 animate-in slide-in-from-left-2 fade-in"
                  >
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="bg-background/60"
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const newOpts = [...pollOptions];
                          newOpts.splice(i, 1);
                          setPollOptions(newOpts);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Option
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="bg-primary hover:bg-primary/90 min-w-[100px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Publish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
