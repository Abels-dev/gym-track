"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Play, History, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";

export function BottomNav() {
  const pathname = usePathname();

  const { data: activeWorkout } = useQuery({
    queryKey: ["activeWorkout"],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get("/workouts/active");
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  const navItems = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Routines", href: "/routines", icon: List },
    { name: "Workout", href: "/workout", icon: Play },
    { name: "History", href: "/history", icon: History },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 w-full bg-background border-t border-border z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const isReallyActive = item.href === "/" ? pathname === "/" : isActive;
          const isWorkoutItem = item.name === "Workout";

          return (
            <li key={item.name} className="flex-1 flex justify-center">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full p-2 transition-opacity relative ${
                  isReallyActive
                    ? "text-foreground opacity-100"
                    : "text-foreground opacity-40 hover:opacity-70"
                }`}
              >
                <div className="relative">
                  <item.icon
                    size={24}
                    strokeWidth={isReallyActive ? 2.5 : 2}
                    className={isWorkoutItem && (isReallyActive || activeWorkout) ? "text-primary" : ""}
                  />
                  {isWorkoutItem && activeWorkout && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-tag-green-text animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
