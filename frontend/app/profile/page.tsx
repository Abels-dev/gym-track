"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, User, Target, Settings, Activity, Palette } from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import { PageLoader } from "../../components/ui/Loader";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto w-full">
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
      <div className="grid grid-cols-2 gap-4 mb-8">
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
      <section className="mb-8 p-4 bg-surface border border-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette size={20} className="opacity-70" />
          <div>
            <h3 className="text-sm font-medium">Appearance</h3>
            <p className="text-xs opacity-60">Customize app theme color</p>
          </div>
        </div>
        <ThemeToggle />
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
