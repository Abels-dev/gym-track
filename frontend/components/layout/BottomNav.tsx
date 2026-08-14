"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Play, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Routines", href: "/routines", icon: List },
    { name: "Workout", href: "/workout", icon: Play },
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
          // Special case for exact match on home
          const isReallyActive = item.href === "/" ? pathname === "/" : isActive;

          return (
            <li key={item.name} className="flex-1 flex justify-center">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full p-2 transition-opacity ${
                  isReallyActive
                    ? "text-foreground opacity-100"
                    : "text-foreground opacity-40 hover:opacity-70"
                }`}
              >
                <item.icon
                  size={24}
                  strokeWidth={isReallyActive ? 2.5 : 2}
                  className={item.name === "Workout" && isReallyActive ? "text-primary" : ""}
                />
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
