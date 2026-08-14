"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/login", { email, password });
      return data; // AuthSession
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.needsOnboarding);
      // AuthGuard will handle the actual redirection now
      router.refresh(); 
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to login. Check your credentials.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-light tracking-tight text-foreground">Welcome Back</h2>
          <p className="mt-2 text-sm opacity-70">Log in to track your workouts</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-tag-red-text bg-tag-red-bg border border-tag-red-text/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-foreground opacity-70 hover:opacity-100 transition-opacity">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm opacity-70">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline decoration-border hover:decoration-foreground underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
