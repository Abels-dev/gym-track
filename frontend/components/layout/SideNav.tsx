"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Play, History, Dumbbell, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { ThemeToggle } from "../ui/ThemeToggle";

export function SideNav() {
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
    { name: "Exercises", href: "/exercises", icon: Dumbbell },
    { name: "History", href: "/history", icon: History },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-dvh sticky top-0 border-r border-border bg-background py-8 px-4 justify-between">
      <div>
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-light tracking-tight">Gym Track</h1>
        </div>
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const isReallyActive = item.href === "/" ? pathname === "/" : isActive;
            const isWorkoutItem = item.name === "Workout";

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isReallyActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground opacity-70 hover:bg-border/50 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={20} strokeWidth={isReallyActive ? 2.5 : 2} />
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </div>
                  {isWorkoutItem && activeWorkout && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-tag-green-bg text-tag-green-text border border-tag-green-text/20 animate-pulse">
                      Live
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pt-6 border-t border-border/60 flex flex-col gap-2 px-2">
        <div className="flex items-center justify-between text-xs font-medium opacity-60 px-2 mb-1">
          <span>Appearance</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
