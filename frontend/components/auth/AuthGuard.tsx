"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { PageLoader } from "../ui/Loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);
  const [mounted, setMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const publicRoutes = ["/login", "/register", "/forgot-password"];
    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route));

    if (!accessToken && !isPublicRoute) {
      router.replace("/login");
    } else if (accessToken && isPublicRoute) {
      if (needsOnboarding) {
        router.replace("/setup-profile");
      } else {
        router.replace("/");
      }
    } else if (accessToken && needsOnboarding && pathname !== "/setup-profile") {
      router.replace("/setup-profile");
    } else {
      setIsVerifying(false);
    }
  }, [accessToken, needsOnboarding, pathname, mounted, router]);

  if (!mounted || isVerifying) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
