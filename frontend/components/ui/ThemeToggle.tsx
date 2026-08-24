"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
        aria-label="Toggle theme"
        className={`p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-all duration-200 ${className}`}
      >
        {theme === "dark" ? (
          <Moon size={18} className="text-primary" />
        ) : theme === "light" ? (
          <Sun size={18} className="text-primary" />
        ) : (
          <Monitor size={18} />
        )}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center bg-surface border border-border p-1 rounded-lg gap-1 ${className}`}
    >
      <button
        onClick={() => setTheme("light")}
        title="Light theme"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground opacity-60 hover:opacity-100"
        }`}
      >
        <Sun size={14} />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Dark theme"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground opacity-60 hover:opacity-100"
        }`}
      >
        <Moon size={14} />
        <span className="hidden sm:inline">Dark</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        title="System default"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          theme === "system"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground opacity-60 hover:opacity-100"
        }`}
      >
        <Monitor size={14} />
        <span className="hidden sm:inline">Auto</span>
      </button>
    </div>
  );
}
