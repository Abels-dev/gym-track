"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // State 1: Request OTP
  const [email, setEmail] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // State 2: Verify OTP & Reset
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/forgot-password", { email });
      return data;
    },
    onSuccess: (data) => {
      setIsOtpSent(true);
      setError("");
      setSuccess(data.message || "Reset code sent successfully.");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to request password reset.");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      return data;
    },
    onSuccess: () => {
      setError("");
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to reset password.");
    },
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    requestOtpMutation.mutate();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    resetPasswordMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-light tracking-tight text-foreground">Reset Password</h2>
          <p className="mt-2 text-sm opacity-70">
            {!isOtpSent ? "Enter your email to receive a code" : "Enter your code and new password"}
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-tag-red-text bg-tag-red-bg border border-tag-red-text/20 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-tag-green-text bg-tag-green-bg border border-tag-green-text/20 rounded-md">
              {success}
            </div>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
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

              <button
                type="submit"
                disabled={requestOtpMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
              >
                {requestOtpMutation.isPending ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="otp">
                  Reset Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  placeholder="6-digit code"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Update Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm opacity-70">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground underline decoration-border hover:decoration-foreground underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
