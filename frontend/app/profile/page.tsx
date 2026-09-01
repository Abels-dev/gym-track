"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, User, Target, Settings, Activity, Palette, Smartphone, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { usePwaStore } from "../../store/pwaStore";
import { useRouter } from "next/navigation";
import { PageLoader } from "../../components/ui/Loader";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isStandalone, promptInstall } = usePwaStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile");
      return data;
    },
  });

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-light tracking-tight capitalize">
            {authUser?.fullName || "Profile"}
          </h1>
          <p className="text-sm opacity-70 mt-1">{authUser?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-tag-red-text bg-tag-red-bg border border-tag-red-text/20 rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-2 opacity-70 mb-2">
            <User size={16} />
            <span className="text-sm font-medium">Bodyweight</span>
          </div>
          <span className="text-2xl font-semibold">
            {profile?.weight ? `${profile.weight} ${profile.preferredUnit}` : "--"}
          </span>
        </div>
        
        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-2 opacity-70 mb-2">
            <Target size={16} />
            <span className="text-sm font-medium">Goal</span>
          </div>
          <span className="text-lg font-semibold capitalize">
            {profile?.primaryGoal?.replace("_", " ").toLowerCase() || "--"}
          </span>
        </div>

        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-2 opacity-70 mb-2">
            <Activity size={16} />
            <span className="text-sm font-medium">Experience</span>
          </div>
          <span className="text-lg font-semibold capitalize">
            {profile?.experienceLevel?.toLowerCase() || "--"}
          </span>
        </div>

        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <div className="flex items-center gap-2 opacity-70 mb-2">
            <Settings size={16} />
            <span className="text-sm font-medium">Schedule</span>
          </div>
          <span className="text-lg font-semibold">
            {profile?.targetDaysPerWeek ? `${profile.targetDaysPerWeek} Days/Week` : "--"}
          </span>
        </div>
      </div>

      {/* Equipment Section */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Available Equipment</h2>
        <div className="flex flex-wrap gap-2">
          {profile?.availableEquipment?.map((eq: string) => (
            <span
              key={eq}
              className="bg-primary/5 text-primary border border-border px-3 py-1.5 rounded-sm text-xs font-medium tracking-wide capitalize"
            >
              {eq.replace("_", " ").toLowerCase()}
            </span>
          ))}
          {(!profile?.availableEquipment || profile.availableEquipment.length === 0) && (
            <span className="text-sm opacity-50">No equipment selected</span>
          )}
        </div>
      </section>

      {/* Theme / Appearance Section */}
      <section className="mb-4 p-4 bg-surface border border-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette size={20} className="opacity-70" />
          <div>
            <h3 className="text-sm font-medium">Appearance</h3>
            <p className="text-xs opacity-60">Customize app theme color</p>
          </div>
        </div>
        <ThemeToggle />
      </section>

      {/* App Installation Section */}
      <section className="mb-8 p-4 bg-surface border border-border rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium">Install App</h3>
            <p className="text-xs opacity-60 mt-0.5">
              {isStandalone
                ? "App is installed and ready for offline use"
                : "Add Gym Track to home screen for offline access"}
            </p>
          </div>
        </div>
        {isStandalone ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-tag-green-text bg-tag-green-bg px-3 py-1.5 rounded-lg border border-tag-green-text/20 shrink-0">
            <CheckCircle2 size={14} />
            Installed
          </span>
        ) : (
          <button
            onClick={() => promptInstall()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-sm"
          >
            <Download size={14} />
            Install
          </button>
        )}
      </section>

      {/* Action Buttons */}
      <Link 
        href="/profile/edit"
        className="w-full border border-border bg-surface hover:bg-border/30 text-foreground py-3 rounded-md font-medium tracking-wide transition-colors mt-auto flex justify-center items-center"
      >
        Edit Profile
      </Link>
    </div>
  );
}
