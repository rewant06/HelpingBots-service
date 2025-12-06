"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMyTenants,
  createTenant,
  generateApiKey,
  getTenantKeys,
  revokeApiKey,
  ApiKeyResponse,
} from "@/lib/tenant.service";
import { Tenant, ApiKeyDisplay } from "@/types/index";
import { useAuthStore } from "@/store/auth.store";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Icons & Utilities
import {
  Plus,
  Key,
  Copy,
  Check,
  Building2,
  Loader2,
  ShieldAlert,
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DeveloperConsole() {
  // --- 1. DATA STATE ---
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyDisplay[]>([]);

  // --- 2. TENANT CREATION FORM STATE ---
  const [createOpen, setCreateOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");
  // Veteran Addition: Compliance Fields
  const [jobTitle, setJobTitle] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // --- 3. API KEY FORM STATE ---
  const [apiKeyName, setApiKeyName] = useState("");
  const [selectedService, setSelectedService] = useState<"VEIL" | "IAM">(
    "VEIL"
  );
  const [generatedKey, setGeneratedKey] = useState<ApiKeyResponse | null>(null);

  // --- 4. UI/LOADING STATE ---
  const [loading, setLoading] = useState(true); // Initial Page Load
  const [keysLoading, setKeysLoading] = useState(false); // Fetching Keys
  const [actionLoading, setActionLoading] = useState(false); // Submitting Forms
  const [isCopied, setIsCopied] = useState(false); // Clipboard feedback
  const [showKeys, setShowKeys] = useState(true); // Mobile Toggle

  // --- 5. HOOKS ---
  const { user } = useAuthStore();
  const { toast } = useToast();

  // --- 6. DATA FETCHING LOGIC ---

  // Load Tenants on Mount
  const loadTenants = useCallback(async () => {
    try {
      const data = await getMyTenants();
      setTenants(data);

      // UX: Auto-select the first tenant if none is selected
      if (data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to load your organizations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, toast]);

  // Initial Trigger
  useEffect(() => {
    if (user) loadTenants();
  }, [user, loadTenants]);

  // Load Keys when Tenant Selection Changes
  const refreshKeys = useCallback(async () => {
    if (!selectedTenantId) return;
    setKeysLoading(true);
    try {
      const keys = await getTenantKeys(selectedTenantId);
      setApiKeys(keys);
    } catch (error) {
      setApiKeys([]);
      // Silent fail or toast? Silent is better for list loading failures to avoid spamming toasts
      console.error("Failed to load keys", error);
    } finally {
      setKeysLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  // --- 7. ACTION HANDLERS ---

  const handleCreateTenant = async () => {
    // Validation
    if (!newTenantName.trim() || !jobTitle.trim() || !isAuthorized) return;

    setActionLoading(true);
    try {
      const payload = {
        name: newTenantName,
        slug: newTenantSlug || undefined,
        type: "ORGANIZATION" as const,
        jobTitle, // Compliance Field
        isAuthorized, // Compliance Field
      };

      const newTenant = await createTenant(payload);

      // Optimistic Update
      setTenants([newTenant, ...tenants]);
      setSelectedTenantId(newTenant.id);

      // Reset Form & Close Modal
      setCreateOpen(false);
      setNewTenantName("");
      setNewTenantSlug("");
      setJobTitle("");
      setIsAuthorized(false);

      toast({
        title: "Success",
        description: `${newTenant.name} has been registered.`,
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to create organization";
      toast({
        title: "Creation Failed",
        description: Array.isArray(msg) ? msg[0] : msg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!selectedTenantId || !apiKeyName.trim()) return;

    setActionLoading(true);
    try {
      const key = await generateApiKey(selectedTenantId, {
        name: apiKeyName,
        service: selectedService, // "VEIL" or "IAM"
        scopes: [], // Backend handles scope mapping based on service
      });

      // Show the Secret Modal
      setGeneratedKey(key);

      // Reset Input
      setApiKeyName("");

      // Refresh the table to show the new key metadata
      await refreshKeys();

      toast({
        title: "Key Generated",
        description: "Make sure to copy it immediately.",
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to generate key";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API Key? This action cannot be undone."
      )
    )
      return;

    try {
      // We assume selectedTenantId is set if we are clicking a key row
      if (!selectedTenantId) return;

      await revokeApiKey(selectedTenantId, keyId);

      // Optimistic Remove from UI
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));

      toast({ title: "Revoked", description: "API Key has been disabled." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke key.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    if (generatedKey?.rawKey) {
      navigator.clipboard.writeText(generatedKey.rawKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pt-6 px-4 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Developer Console
          </h2>
          <p className="text-muted-foreground">
            Manage your organizations, billing, and access tokens.
          </p>
        </div>

        {/* Create Organization Modal Trigger */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg transition-transform hover:scale-105">
              <Plus className="w-4 h-4 mr-2" /> New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-effect border-primary/20">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Establish a new billing entity for your projects.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="acme-corp"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="job">
                  Your Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="job"
                  placeholder="e.g. CTO, Lead Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-3 pt-2 bg-muted/50 p-3 rounded-md border border-border/50">
                <Checkbox
                  id="auth"
                  checked={isAuthorized}
                  onCheckedChange={(c) => setIsAuthorized(c as boolean)}
                  className="mt-1"
                />
                <Label
                  htmlFor="auth"
                  className="text-xs text-muted-foreground font-normal leading-snug cursor-pointer"
                >
                  I confirm that I am authorized to create this organization and
                  agree to the{" "}
                  <span className="text-primary hover:underline">
                    Terms of Service
                  </span>
                  .
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleCreateTenant}
                disabled={
                  actionLoading || !newTenantName || !jobTitle || !isAuthorized
                }
                className="w-full"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Create Organization"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* 1. SCOPE SELECTOR (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-effect border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">
                Active Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {tenants.length > 0 ? (
                <Select
                  value={selectedTenantId || ""}
                  onValueChange={setSelectedTenantId}
                >
                  <SelectTrigger className="h-12 text-lg font-semibold border-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select Org" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />{" "}
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-6 bg-muted/30 rounded-xl text-sm text-center border border-dashed border-muted-foreground/25">
                  <p className="text-muted-foreground mb-2">
                    No organizations found.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setCreateOpen(true)}
                    className="h-auto p-0"
                  >
                    Create one now
                  </Button>
                </div>
              )}

              {selectedTenantId && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tenant ID</span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded select-all">
                      {selectedTenantId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge
                      variant="outline"
                      className="text-green-500 border-green-500/20 bg-green-500/5"
                    >
                      Free Tier
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 2. API KEY MANAGER (Right Column) */}
        <div className="lg:col-span-2">
          <Card className="glass-effect border-border/50 h-full flex flex-col shadow-md">
            <CardHeader className="border-b border-border/40 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Terminal className="w-5 h-5 text-primary" /> API Access
                  </CardTitle>
                  <CardDescription>
                    Manage secure access tokens for your applications.
                  </CardDescription>
                </div>
                {selectedTenantId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-muted-foreground"
                  >
                    {showKeys ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showKeys ? "Hide Keys" : "Show Keys"}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6 flex-1">
              {!selectedTenantId ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground opacity-50">
                  <Building2 className="w-16 h-16 mb-4 stroke-1" />
                  <p className="text-lg">
                    Select an organization to manage keys
                  </p>
                </div>
              ) : (
                <>
                  {/* GENERATOR FORM */}
                  <div className="p-5 bg-secondary/30 rounded-xl border border-border/50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1 space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Service Scope
                        </Label>
                        <Select
                          value={selectedService}
                          onValueChange={(v: "VEIL" | "IAM") =>
                            setSelectedService(v)
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VEIL">Veil API</SelectItem>
                            <SelectItem value="IAM">Identity (IAM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Key Description
                        </Label>
                        <Input
                          placeholder="e.g. Production Server"
                          value={apiKeyName}
                          onChange={(e) => setApiKeyName(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          onClick={handleGenerateKey}
                          disabled={actionLoading || !apiKeyName}
                          className="w-full"
                        >
                          {actionLoading ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Generate Key"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* RESPONSIVE KEY LIST */}
                  {showKeys && (
                    <div className="space-y-4 animate-accordion-down">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">
                          Active Keys ({apiKeys.length})
                        </h4>
                      </div>

                      {keysLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="animate-spin w-6 h-6 text-primary" />
                        </div>
                      ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                          No active keys found. Generate one above to get
                          started.
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table */}
                          <div className="hidden md:block rounded-lg border border-border/50 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-muted/40">
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Key Mask</TableHead>
                                  <TableHead>Scopes</TableHead>
                                  <TableHead>Created</TableHead>
                                  <TableHead className="text-right">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {apiKeys.map((key) => (
                                  <TableRow key={key.id} className="group">
                                    <TableCell className="font-medium">
                                      {key.name}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground bg-muted/30 p-2 rounded w-fit">
                                      {key.prefix}...{key.last4}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                                        {key.scopes.slice(0, 2).map((s) => (
                                          <Badge
                                            key={s}
                                            variant="secondary"
                                            className="text-[10px] px-1"
                                          >
                                            {s}
                                          </Badge>
                                        ))}
                                        {key.scopes.length > 2 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            +{key.scopes.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(
                                        new Date(key.createdAt)
                                      )}{" "}
                                      ago
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRevokeKey(key.id)}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-3">
                            {apiKeys.map((key) => (
                              <div
                                key={key.id}
                                className="p-4 rounded-xl border border-border bg-card/40 space-y-3 relative"
                              >
                                <div className="flex justify-between items-start pr-8">
                                  <div>
                                    <div className="font-bold text-sm">
                                      {key.name}
                                    </div>
                                    <div className="font-mono text-xs text-muted-foreground mt-1 bg-muted/50 px-2 py-1 rounded inline-block">
                                      {key.prefix}...{key.last4}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevokeKey(key.id)}
                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {key.scopes.map((s) => (
                                    <Badge
                                      key={s}
                                      variant="outline"
                                      className="text-[10px] bg-background/80"
                                    >
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/30 flex justify-between items-center">
                                  <span>
                                    Created{" "}
                                    {formatDistanceToNow(
                                      new Date(key.createdAt)
                                    )}{" "}
                                    ago
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- SUCCESS MODAL (COPY KEY) --- */}
      <Dialog
        open={!!generatedKey}
        onOpenChange={(open) => !open && setGeneratedKey(null)}
      >
        <DialogContent className="sm:max-w-md glass-effect border-green-500/20 shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <ShieldAlert className="w-5 h-5" /> Secret Key Generated
            </DialogTitle>
            <DialogDescription>
              This key grants full access to the{" "}
              <strong>{selectedService}</strong> API. It will{" "}
              <strong>never</strong> be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4 mb-2 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <pre className="p-6 bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 font-mono text-xs break-all whitespace-pre-wrap shadow-inner">
                {generatedKey?.rawKey}
              </pre>
              <Button
                size="sm"
                className="absolute top-3 right-3 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                onClick={copyToClipboard}
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-400 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setGeneratedKey(null)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              I have securely saved this key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
