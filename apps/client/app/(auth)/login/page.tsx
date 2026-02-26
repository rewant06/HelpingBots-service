"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { loginSchema } from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = React.useState<string | null>(null);

  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.includes("://")
      ? nextParam
      : null;
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setApiError(null);
    try {
      await login(data);
      const destination = safeNext ?? "/dashboard";
      logger.log(`Login successful, redirecting to ${destination}...`);
      router.replace(destination);
      router.push("/dashboard");
    } catch (error: unknown) {
      let errorMsg = "An unknown error occured";
      if (isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message;
        if (error.response?.status === 403) {
          toast.error("Email not verified. Please check your inbox.");
          return;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg || "Invalid credentials");
      logger.error("Login failed", error);
      setApiError(errorMsg);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md">
        <div className="glass-effect p-8 rounded-2xl border border-border/50 shadow-elevated animate-fade-in">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline font-medium transition-all"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-primary/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
